import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Booking, PaymentMethodType } from '../models/Booking';
import { GymClass } from '../models/GymClass';
import { User } from '../models/User';
import { sendEmail } from '../services/mailService';

const isFromNowOnward = (target: Date, now: Date = new Date()): boolean =>
    !Number.isNaN(target.getTime()) && target.getTime() >= now.getTime();

const formatClassDateTime = (dateValue?: Date | string): string => {
    if (!dateValue) return 'Por confirmar';
    return new Date(dateValue).toLocaleString('es-VE', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

function getPayPalConfig() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || process.env.PAYPAL_SECRET;
    const baseUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

    if (!clientId || !clientSecret) {
        return null;
    }

    return { clientId, clientSecret, baseUrl };
}

async function getPayPalAccessToken(
    baseUrl: string,
    clientId: string,
    clientSecret: string
): Promise<string | null> {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) return null;
    const tokenData = await tokenRes.json() as { access_token?: string };
    return tokenData.access_token || null;
}

// ==========================================
// 0A. PAYPAL SANDBOX: CREAR ORDEN EN EL SERVIDOR
// ==========================================
export const createPayPalOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { gymClassId } = req.body as { gymClassId?: string };

        if (!gymClassId) {
            res.status(400).json({ ok: false, message: 'La clase es obligatoria para generar la orden de PayPal' });
            return;
        }

        const paypalConfig = getPayPalConfig();
        if (!paypalConfig) {
            res.status(500).json({
                ok: false,
                message: 'Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en la configuración del servidor'
            });
            return;
        }

        const targetClass = await GymClass.findById(gymClassId);
        if (!targetClass || !targetClass.isActive) {
            res.status(404).json({ ok: false, message: 'La clase seleccionada no existe o no está activa' });
            return;
        }

        if (!isFromNowOnward(new Date(targetClass.startTime), new Date())) {
            res.status(400).json({
                ok: false,
                message: 'Solo puedes reservar clases cuya fecha y hora sean a partir del momento actual'
            });
            return;
        }

        if (targetClass.availableSlots <= 0) {
            res.status(400).json({ ok: false, message: 'Esta clase ya no tiene cupos disponibles' });
            return;
        }

        const activeBooking = await Booking.findOne({
            user: userId,
            gymClass: gymClassId,
            status: { $in: ['Pendiente', 'Aprobado'] }
        });

        if (activeBooking) {
            res.status(400).json({ ok: false, message: 'Ya tienes una reserva activa para esta clase' });
            return;
        }

        const amountValue = Number(targetClass.cost || 0).toFixed(2);
        if (Number(amountValue) <= 0) {
            res.status(400).json({ ok: false, message: 'El monto de la clase debe ser mayor a $0.00 USD para pagar con PayPal' });
            return;
        }

        const accessToken = await getPayPalAccessToken(
            paypalConfig.baseUrl,
            paypalConfig.clientId,
            paypalConfig.clientSecret
        );

        if (!accessToken) {
            res.status(502).json({ ok: false, message: 'No se pudo autenticar con PayPal Sandbox' });
            return;
        }

        const orderRes = await fetch(`${paypalConfig.baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: gymClassId,
                        description: `Reserva Energym - ${targetClass.title}`,
                        amount: {
                            currency_code: 'USD',
                            value: amountValue,
                        },
                    },
                ],
            }),
        });

        if (!orderRes.ok) {
            const errorBody = await orderRes.text();
            console.error('Error al crear orden PayPal:', errorBody);
            res.status(502).json({ ok: false, message: 'PayPal rechazó la creación de la orden' });
            return;
        }

        const orderData = await orderRes.json() as { id?: string };
        if (!orderData.id) {
            res.status(502).json({ ok: false, message: 'PayPal no devolvió un ID de orden válido' });
            return;
        }

        res.status(200).json({ ok: true, orderId: orderData.id });
    } catch (error) {
        console.error('Error en createPayPalOrder:', error);
        res.status(500).json({ ok: false, message: 'Error interno al crear orden de PayPal' });
    }
};

// ==========================================
// 0B. PAYPAL SANDBOX: CAPTURAR ORDEN Y CREAR RESERVA
// ==========================================
export const capturePayPalOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { orderId, gymClassId } = req.body as { orderId?: string; gymClassId?: string };

        if (!orderId || !gymClassId) {
            res.status(400).json({ ok: false, message: 'orderId y gymClassId son obligatorios' });
            return;
        }

        const paypalConfig = getPayPalConfig();
        if (!paypalConfig) {
            res.status(500).json({
                ok: false,
                message: 'Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET en la configuración del servidor'
            });
            return;
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const targetClass = await GymClass.findById(gymClassId);
        if (!targetClass || !targetClass.isActive) {
            res.status(404).json({ ok: false, message: 'La clase seleccionada no existe o no está activa' });
            return;
        }

        if (!isFromNowOnward(new Date(targetClass.startTime), new Date())) {
            res.status(400).json({
                ok: false,
                message: 'Solo puedes reservar clases cuya fecha y hora sean a partir del momento actual'
            });
            return;
        }

        const existingByOrder = await Booking.findOne({ paypalTransactionId: orderId });
        if (existingByOrder) {
            res.status(400).json({ ok: false, message: 'Esta transacción de PayPal ya fue registrada anteriormente' });
            return;
        }

        const activeBooking = await Booking.findOne({
            user: userId,
            gymClass: gymClassId,
            status: { $in: ['Pendiente', 'Aprobado'] }
        });

        if (activeBooking) {
            res.status(400).json({ ok: false, message: 'Ya tienes una reserva activa para esta clase' });
            return;
        }

        const accessToken = await getPayPalAccessToken(
            paypalConfig.baseUrl,
            paypalConfig.clientId,
            paypalConfig.clientSecret
        );

        if (!accessToken) {
            res.status(502).json({ ok: false, message: 'No se pudo autenticar con PayPal Sandbox' });
            return;
        }

        const captureRes = await fetch(
            `${paypalConfig.baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!captureRes.ok) {
            const errorBody = await captureRes.text();
            console.error('Error al capturar orden PayPal:', errorBody);
            res.status(400).json({ ok: false, message: 'No se pudo capturar el pago en PayPal' });
            return;
        }

        const captureData = await captureRes.json() as {
            id?: string;
            status?: string;
            purchase_units?: Array<{
                payments?: {
                    captures?: Array<{ id?: string; status?: string }>;
                };
            }>;
        };

        const captureId =
            captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
            captureData.id ||
            orderId;

        if (captureData.status !== 'COMPLETED') {
            res.status(400).json({
                ok: false,
                message: `El pago en PayPal no quedó completado (estado: ${captureData.status || 'desconocido'})`
            });
            return;
        }

        const existingByCapture = await Booking.findOne({ paypalTransactionId: captureId });
        if (existingByCapture) {
            res.status(400).json({ ok: false, message: 'Esta captura de PayPal ya fue registrada anteriormente' });
            return;
        }

        const updatedClass = await GymClass.findOneAndUpdate(
            { _id: gymClassId, isActive: true, availableSlots: { $gt: 0 } },
            { $inc: { availableSlots: -1 } },
            { new: true }
        );

        if (!updatedClass) {
            res.status(400).json({ ok: false, message: 'Lo sentimos, esta clase ya no tiene cupos disponibles' });
            return;
        }

        const newBooking = new Booking({
            user: userId,
            gymClass: gymClassId,
            paymentMethod: 'PayPal',
            paypalTransactionId: captureId,
            status: 'Aprobado'
        });

        await newBooking.save();

        const formattedSchedule = formatClassDateTime(targetClass.startTime);

        await sendEmail(
            currentUser.email,
            'Reserva Confirmada por PayPal en Energym 🏋️‍♀️',
            `
            <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${currentUser.name}!</h2>
            <p style="margin: 0 0 18px;">Tu pago con <strong>PayPal</strong> fue verificado correctamente y tu cupo está asegurado.</p>
            <div style="background-color: #ecfdf5; border-left: 4px solid #00c24f; padding: 16px 18px; border-radius: 8px; margin: 18px 0;">
                <p style="margin: 0 0 8px;"><strong>Clase:</strong> ${targetClass.title}</p>
                <p style="margin: 0 0 8px;"><strong>Fecha y hora:</strong> ${formattedSchedule}</p>
                <p style="margin: 0 0 8px;"><strong>Estado:</strong> <span style="color: #059669; font-weight: bold;">Aprobada</span></p>
                <p style="margin: 0; font-size: 13px; color: #4b5563;"><strong>ID de transacción:</strong> ${captureId}</p>
            </div>
            <p style="margin: 18px 0 0; color: #4b5563;">¡Te esperamos para entrenar!</p>
            `
        );

        res.status(201).json({
            ok: true,
            message: '¡Pago con PayPal verificado y reserva confirmada 🎟️!',
            data: newBooking,
            availableSlots: updatedClass.availableSlots
        });
    } catch (error) {
        console.error('Error en capturePayPalOrder:', error);
        res.status(500).json({ ok: false, message: 'Error interno al capturar el pago de PayPal' });
    }
};

// ==========================================
// 1. CREAR RESERVA (Pago Móvil y Transferencia; PayPal usa /paypal/create-order y /paypal/capture-order)
// ==========================================
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const {
            gymClassId,
            paymentMethod,
            paymentReference,
        } = req.body as {
            gymClassId?: string;
            paymentMethod?: PaymentMethodType;
            paymentReference?: string;
        };

        if (!gymClassId || !paymentMethod) {
            res.status(400).json({ ok: false, message: 'La clase y el método de pago son obligatorios' });
            return;
        }

        if (paymentMethod === 'PayPal') {
            res.status(400).json({
                ok: false,
                message: 'Los pagos con PayPal deben iniciarse y capturarse mediante la pasarela de PayPal'
            });
            return;
        }

        if (paymentMethod !== 'Transferencia' && paymentMethod !== 'Pago Móvil') {
            res.status(400).json({ ok: false, message: 'Método de pago no válido' });
            return;
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const targetClass = await GymClass.findById(gymClassId);
        if (!targetClass || !targetClass.isActive) {
            res.status(404).json({ ok: false, message: 'La clase seleccionada no existe o no está activa' });
            return;
        }

        if (!isFromNowOnward(new Date(targetClass.startTime), new Date())) {
            res.status(400).json({
                ok: false,
                message: 'Solo puedes reservar clases cuya fecha y hora sean a partir del momento actual'
            });
            return;
        }

        const activeBooking = await Booking.findOne({
            user: userId,
            gymClass: gymClassId,
            status: { $in: ['Pendiente', 'Aprobado'] }
        });

        if (activeBooking) {
            res.status(400).json({ ok: false, message: 'Ya tienes una reserva activa para esta clase' });
            return;
        }

        const receiptUrl = req.file
            ? `/uploads/${req.file.filename}`
            : (req.body.paymentReceiptUrl || undefined);

        if (!receiptUrl && !paymentReference?.trim()) {
            res.status(400).json({
                ok: false,
                message: 'Debes adjuntar el comprobante o indicar el número de referencia del pago'
            });
            return;
        }

        const updatedClass = await GymClass.findOneAndUpdate(
            { _id: gymClassId, isActive: true, availableSlots: { $gt: 0 } },
            { $inc: { availableSlots: -1 } },
            { new: true }
        );

        if (!updatedClass) {
            res.status(400).json({ ok: false, message: 'Lo sentimos, esta clase ya no tiene cupos disponibles' });
            return;
        }

        const newBooking = new Booking({
            user: userId,
            gymClass: gymClassId,
            paymentMethod,
            paymentReference: paymentReference?.trim() || undefined,
            paymentReceiptUrl: receiptUrl,
            status: 'Pendiente'
        });

        await newBooking.save();

        const formattedSchedule = formatClassDateTime(targetClass.startTime);

        await sendEmail(
            currentUser.email,
            'Reserva Registrada en Energym 🏋️‍♀️',
            `
            <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${currentUser.name}!</h2>
            <p style="margin: 0 0 18px;">Hemos registrado tu solicitud de reserva para la siguiente sesión:</p>
            <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 18px; border-radius: 8px; margin: 18px 0;">
                <p style="margin: 0 0 8px;"><strong>Clase:</strong> ${targetClass.title}</p>
                <p style="margin: 0 0 8px;"><strong>Fecha y hora:</strong> ${formattedSchedule}</p>
                <p style="margin: 0 0 8px;"><strong>Método de pago:</strong> ${paymentMethod}</p>
                <p style="margin: 0;"><strong>Estado actual:</strong> <span style="color: #d97706; font-weight: bold;">Pendiente de aprobación</span></p>
            </div>
            <p style="margin: 0; font-size: 14px; color: #4b5563;">Tu comprobante está en revisión por nuestro equipo administrativo. Te avisaremos en cuanto sea validado.</p>
            `
        );

        res.status(201).json({
            ok: true,
            message: '¡Reserva registrada! Tu comprobante está pendiente de confirmación.',
            data: newBooking,
            availableSlots: updatedClass.availableSlots
        });
    } catch (error) {
        console.error('Error al crear reserva:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 2. HISTORIAL DE RESERVAS DEL USUARIO
// ==========================================
export const getUserBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;

        const bookings = await Booking.find({ user: userId })
            .populate('gymClass')
            .sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error al obtener reservas del usuario:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 3. CANCELAR RESERVA PROPIA (Usuario)
// ==========================================
export const cancelMyBooking = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { id } = req.params;

        const booking = await Booking.findOne({ _id: id, user: userId });
        if (!booking) {
            res.status(404).json({ ok: false, message: 'Reserva no encontrada' });
            return;
        }

        if (booking.status === 'Cancelado' || booking.status === 'Rechazado') {
            res.status(400).json({ ok: false, message: `La reserva ya se encuentra en estado ${booking.status}` });
            return;
        }

        const previousStatus = booking.status;
        booking.status = 'Cancelado';
        await booking.save();

        if (previousStatus === 'Pendiente' || previousStatus === 'Aprobado') {
            await GymClass.findByIdAndUpdate(booking.gymClass, {
                $inc: { availableSlots: 1 }
            });
        }

        res.status(200).json({
            ok: true,
            message: 'Reserva cancelada y cupo liberado',
            data: booking
        });
    } catch (error) {
        console.error('Error al cancelar reserva:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 4. TODAS LAS RESERVAS (Solo Admin)
// ==========================================
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
            return;
        }

        const bookings = await Booking.find()
            .populate('user', 'name email role')
            .populate('gymClass')
            .sort({ createdAt: -1 });

        res.status(200).json({
            ok: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.error('Error al obtener todas las reservas:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 5. APROBAR / RECHAZAR RESERVA (Solo Admin)
// ==========================================
export const updateBookingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Solo administradores.' });
            return;
        }

        const { id } = req.params;
        const { status, adminMessage } = req.body as {
            status?: 'Pendiente' | 'Aprobado' | 'Cancelado' | 'Rechazado';
            adminMessage?: string;
        };

        if (!status || !['Pendiente', 'Aprobado', 'Cancelado', 'Rechazado'].includes(status)) {
            res.status(400).json({ ok: false, message: 'Estado de reserva no válido' });
            return;
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            res.status(404).json({ ok: false, message: 'Reserva no encontrada' });
            return;
        }

        const previousStatus = booking.status;
        booking.status = status;
        if (adminMessage !== undefined) booking.adminMessage = adminMessage;
        await booking.save();

        const wasOccupyingSlot = previousStatus === 'Pendiente' || previousStatus === 'Aprobado';
        const isFreeingSlot = status === 'Rechazado' || status === 'Cancelado';
        const isReoccupyingSlot = (previousStatus === 'Rechazado' || previousStatus === 'Cancelado') &&
            (status === 'Pendiente' || status === 'Aprobado');

        if (wasOccupyingSlot && isFreeingSlot) {
            await GymClass.findByIdAndUpdate(booking.gymClass, {
                $inc: { availableSlots: 1 }
            });
        } else if (isReoccupyingSlot) {
            await GymClass.findOneAndUpdate(
                { _id: booking.gymClass, availableSlots: { $gt: 0 } },
                { $inc: { availableSlots: -1 } }
            );
        }

        const userToNotify = await User.findById(booking.user);
        const relatedClass = await GymClass.findById(booking.gymClass);

        if (userToNotify) {
            const isApproved = status === 'Aprobado';
            const accentColor = isApproved ? '#059669' : '#dc2626';
            const boxBg = isApproved ? '#ecfdf5' : '#fef2f2';
            const classTitle = relatedClass?.title || 'Clase reservada';
            const classSchedule = formatClassDateTime(relatedClass?.startTime);

            await sendEmail(
                userToNotify.email,
                `Actualización de tu reserva: ${classTitle} (${status})`,
                `
                <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${userToNotify.name}!</h2>
                <p style="margin: 0 0 18px;">Tu solicitud de reserva ha sido revisada por nuestro equipo administrativo:</p>
                <div style="background-color: ${boxBg}; border-left: 4px solid ${accentColor}; padding: 16px 18px; border-radius: 8px; margin: 18px 0;">
                    <p style="margin: 0 0 8px;"><strong>Clase:</strong> ${classTitle}</p>
                    <p style="margin: 0 0 8px;"><strong>Fecha y hora:</strong> ${classSchedule}</p>
                    <p style="margin: 0;">
                        <strong>Nuevo estatus:</strong>
                        <span style="color: ${accentColor}; font-weight: bold;">${status}</span>
                    </p>
                    ${adminMessage ? `<p style="margin: 10px 0 0; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.08); font-size: 14px;"><strong>Nota del administrador:</strong> ${adminMessage}</p>` : ''}
                </div>
                <p style="margin: 18px 0 0;">
                    ${isApproved
                        ? '¡Tu cupo está confirmado! Te esperamos en el gimnasio.'
                        : 'Si tienes dudas sobre el estado de tu reserva, comunícate con recepción o administración.'}
                </p>
                `
            );
        }

        res.status(200).json({
            ok: true,
            message: `Estado de la reserva actualizado a: ${status}`,
            data: booking
        });
    } catch (error) {
        console.error('Error al actualizar estado de reserva:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};