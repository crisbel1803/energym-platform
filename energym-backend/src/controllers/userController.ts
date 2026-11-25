import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { sendEmail } from '../services/mailService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Booking } from '../models/Booking';
import { GymClass } from '../models/GymClass';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Controlador para registrar un nuevo usuario (requiere verificación por correo)
export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, phone } = req.body;

        const cleanName = typeof name === 'string' ? name.trim() : '';
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!cleanName || !cleanEmail || !password) {
            res.status(400).json({
                ok: false,
                message: 'Nombre, correo y contraseña son obligatorios'
            });
            return;
        }

        if (!EMAIL_REGEX.test(cleanEmail)) {
            res.status(400).json({
                ok: false,
                message: 'Ingresa un correo electrónico válido (ejemplo: usuario@dominio.com)'
            });
            return;
        }

        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
            res.status(400).json({
                ok: false,
                message: 'El correo electrónico ya está registrado'
            });
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

        const newUser = new User({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: role || 'CLIENT',
            phone: phone || '',
            isVerified: false,
            verificationToken,
            verificationTokenExpires
        });

        await newUser.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const verifyLink = `${frontendUrl}/verificar-correo?token=${verificationToken}`;

        await sendEmail(
            cleanEmail,
            'Verifica tu correo en Energym Fitness Club 🏋️‍♀️',
            `
            <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${cleanName}!</h2>
            <p style="margin: 0 0 14px;">Gracias por registrarte en <strong>Energym Fitness Club</strong>.</p>
            <p style="margin: 0 0 22px;">Para activar tu cuenta y poder iniciar sesión, haz clic en el siguiente botón:</p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="${verifyLink}" style="background-color: #00c24f; color: #000000; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Verificar mi correo
                </a>
            </div>
            <p style="font-size: 12px; color: #6b7280; word-break: break-all; margin: 18px 0 8px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:<br/>
                <a href="${verifyLink}" style="color: #059669;">${verifyLink}</a>
            </p>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">Este enlace expirará en 24 horas.</p>
            `
        );

        res.status(201).json({
            ok: true,
            requiresVerification: true,
            message: '¡Cuenta creada! Revisa tu correo electrónico y haz clic en el enlace de verificación para poder iniciar sesión.'
        });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al registrar el usuario'
        });
    }
};

// Controlador para verificar el correo mediante token del enlace
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
        const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

        if (!token) {
            res.status(400).json({
                ok: false,
                message: 'Token de verificación faltante o inválido'
            });
            return;
        }

        const user = await User.findOne({ verificationToken: token });

        if (!user) {
            res.status(400).json({
                ok: false,
                message: 'El enlace de verificación no es válido o ya fue utilizado'
            });
            return;
        }

        if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
            res.status(400).json({
                ok: false,
                message: 'El enlace de verificación ha expirado. Solicita uno nuevo o regístrate nuevamente.'
            });
            return;
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();

        res.status(200).json({
            ok: true,
            message: '¡Correo verificado exitosamente! Ya puedes iniciar sesión en Energym.'
        });
    } catch (error) {
        console.error('Error al verificar correo:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al verificar el correo'
        });
    }
};

// ==========================================
// Controlador para el Inicio de Sesión
// ==========================================
export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            res.status(400).json({
                ok: false,
                message: 'Credenciales inválidas (correo o contraseña incorrectos)'
            });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password || '');
        if (!isPasswordValid) {
            res.status(400).json({
                ok: false,
                message: 'Credenciales inválidas (correo o contraseña incorrectos)'
            });
            return;
        }

        if (user.isVerified === false) {
            res.status(403).json({
                ok: false,
                message: 'Debes verificar tu correo para poder ingresar'
            });
            return;
        }

        const secret = process.env.JWT_SECRET || 'secreto';
        const token = jwt.sign(
            { uid: user._id, role: user.role },
            secret,
            { expiresIn: '7h' }
        );

        res.status(200).json({
            ok: true,
            message: '¡Inicio de sesión exitoso en Energym 🚀!',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al iniciar sesión'
        });
    }
};

// ==========================================
// Controlador para obtener el perfil del usuario autenticado
// ==========================================
export const getUserProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        res.status(200).json({
            ok: true,
            message: '¡Datos de perfil obtenidos correctamente 🏋️‍♀️!',
            user
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al obtener el perfil'
        });
    }
};

// ==========================================
// Controlador para actualizar el perfil (Nombre, Email, Teléfono, Contraseña)
// ==========================================
export const updateUserProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { name, email, phone, password } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        if (email) {
            const cleanEmail = String(email).trim().toLowerCase();
            if (!EMAIL_REGEX.test(cleanEmail)) {
                res.status(400).json({
                    ok: false,
                    message: 'El nuevo correo electrónico no tiene un formato válido'
                });
                return;
            }

            if (cleanEmail !== user.email) {
                const emailExists = await User.findOne({ email: cleanEmail });
                if (emailExists) {
                    res.status(400).json({
                        ok: false,
                        message: 'El correo electrónico ya está en uso por otra cuenta'
                    });
                    return;
                }
                user.email = cleanEmail;
            }
        }

        if (name) user.name = String(name).trim();
        if (phone !== undefined) user.phone = phone;

        if (password && password.trim().length > 0) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        const updatedUser = await user.save();

        res.status(200).json({
            ok: true,
            message: '¡Perfil actualizado exitosamente ✨!',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al actualizar el perfil'
        });
    }
};

// ==========================================
// Controlador para eliminar la cuenta del usuario
// ==========================================
export const deleteUserProfile = async (req: any, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado'
            });
            return;
        }

        res.status(200).json({
            ok: true,
            message: '¡Cuenta eliminada exitosamente 🗑️!'
        });
    } catch (error) {
        console.error('Error al eliminar cuenta:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al eliminar la cuenta'
        });
    }
};

// ==========================================
// ADMIN: LISTAR USUARIOS CON ESTADO DE RESERVAS
// ==========================================
export const getAllUsersAdmin = async (req: any, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({
                ok: false,
                message: 'Acceso denegado. Se requiere rol de Administrador.'
            });
            return;
        }

        const users = await User.find()
            .select('-password -verificationToken -verificationTokenExpires')
            .sort({ createdAt: -1 })
            .lean();

        const bookings = await Booking.find()
            .populate('gymClass', 'title discipline instructor room startTime endTime cost')
            .sort({ createdAt: -1 })
            .lean();

        type UserBookingSummary = {
            _id: string;
            status: 'Aprobado' | 'Pendiente' | 'Rechazado' | 'Cancelado';
            paymentMethod: string;
            paymentReference?: string;
            paypalTransactionId?: string;
            createdAt: string;
            gymClass?: {
                title?: string;
                discipline?: string;
                instructor?: string;
                room?: string;
                startTime?: string;
                cost?: number;
            } | null;
        };

        const bookingsByUserId = new Map<
            string,
            {
                total: number;
                approved: number;
                pending: number;
                cancelled: number;
                rejected: number;
                approvedAmount: number;
                pendingAmount: number;
                items: UserBookingSummary[];
            }
        >();

        for (const b of bookings as any[]) {
            const ownerId = b.user ? String(b.user) : '';
            if (!ownerId) continue;

            if (!bookingsByUserId.has(ownerId)) {
                bookingsByUserId.set(ownerId, {
                    total: 0,
                    approved: 0,
                    pending: 0,
                    cancelled: 0,
                    rejected: 0,
                    approvedAmount: 0,
                    pendingAmount: 0,
                    items: [],
                });
            }

            const stats = bookingsByUserId.get(ownerId)!;
            const classCost = Number(b.gymClass?.cost || 0);

            stats.total += 1;
            if (b.status === 'Aprobado') {
                stats.approved += 1;
                stats.approvedAmount += classCost;
            } else if (b.status === 'Pendiente') {
                stats.pending += 1;
                stats.pendingAmount += classCost;
            } else if (b.status === 'Cancelado') {
                stats.cancelled += 1;
            } else if (b.status === 'Rechazado') {
                stats.rejected += 1;
            }

            stats.items.push({
                _id: String(b._id),
                status: b.status,
                paymentMethod: b.paymentMethod,
                paymentReference: b.paymentReference,
                paypalTransactionId: b.paypalTransactionId,
                createdAt: b.createdAt,
                gymClass: b.gymClass
                    ? {
                          title: b.gymClass.title,
                          discipline: b.gymClass.discipline,
                          instructor: b.gymClass.instructor,
                          room: b.gymClass.room,
                          startTime: b.gymClass.startTime,
                          cost: classCost,
                      }
                    : null,
            });
        }

        const enrichedUsers = users.map((u: any) => {
            const summary = bookingsByUserId.get(String(u._id)) || {
                total: 0,
                approved: 0,
                pending: 0,
                cancelled: 0,
                rejected: 0,
                approvedAmount: 0,
                pendingAmount: 0,
                items: [],
            };

            return {
                _id: String(u._id),
                name: u.name,
                email: u.email,
                phone: u.phone || '',
                role: u.role,
                isVerified: Boolean(u.isVerified),
                createdAt: u.createdAt,
                bookingStats: {
                    total: summary.total,
                    approved: summary.approved,
                    pending: summary.pending,
                    cancelled: summary.cancelled,
                    rejected: summary.rejected,
                    approvedAmount: summary.approvedAmount,
                    pendingAmount: summary.pendingAmount,
                },
                bookings: summary.items,
            };
        });

        res.status(200).json({
            ok: true,
            count: enrichedUsers.length,
            data: enrichedUsers,
        });
    } catch (error) {
        console.error('Error al listar usuarios para admin:', error);
        res.status(500).json({
            ok: false,
            message: 'Error interno del servidor al obtener usuarios'
        });
    }
};

// ==========================================
// ADMIN: VERIFICAR CORREO DE USUARIO MANUALMENTE
// ==========================================
export const verifyUserByAdmin = async (req: any, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({
                ok: false,
                message: 'Acceso denegado. Se requiere rol de Administrador.'
            });
            return;
        }

        const { id } = req.params;
        const targetUser = await User.findById(id);

        if (!targetUser) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        targetUser.isVerified = true;
        targetUser.verificationToken = undefined;
        targetUser.verificationTokenExpires = undefined;
        await targetUser.save();

        res.status(200).json({
            ok: true,
            message: `Correo de ${targetUser.email} verificado manualmente.`,
            data: {
                _id: targetUser._id,
                isVerified: targetUser.isVerified,
            }
        });
    } catch (error) {
        console.error('Error al verificar usuario por admin:', error);
        res.status(500).json({ ok: false, message: 'Error interno al verificar usuario' });
    }
};

// ==========================================
// ADMIN: CAMBIAR ROL DE USUARIO (ADMIN / CLIENT)
// ==========================================
export const updateUserRoleByAdmin = async (req: any, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({
                ok: false,
                message: 'Acceso denegado. Se requiere rol de Administrador.'
            });
            return;
        }

        const { id } = req.params;
        const { role } = req.body as { role?: 'ADMIN' | 'CLIENT' };

        if (!role || !['ADMIN', 'CLIENT'].includes(role)) {
            res.status(400).json({ ok: false, message: 'Rol no válido. Usa ADMIN o CLIENT.' });
            return;
        }

        if (String(req.user?.uid) === String(id)) {
            res.status(400).json({
                ok: false,
                message: 'No puedes cambiar tu propio rol desde el panel de administración.'
            });
            return;
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        targetUser.role = role;
        await targetUser.save();

        res.status(200).json({
            ok: true,
            message: `Rol de ${targetUser.name} actualizado a ${role}.`,
            data: {
                _id: targetUser._id,
                role: targetUser.role,
            }
        });
    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        res.status(500).json({ ok: false, message: 'Error interno al actualizar el rol' });
    }
};

// ==========================================
// ADMIN: ELIMINAR USUARIO Y LIBERAR CUPOS ACTIVOS
// ==========================================
export const deleteUserByAdmin = async (req: any, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({
                ok: false,
                message: 'Acceso denegado. Se requiere rol de Administrador.'
            });
            return;
        }

        const { id } = req.params;

        if (String(req.user?.uid) === String(id)) {
            res.status(400).json({
                ok: false,
                message: 'No puedes eliminar tu propia cuenta de administrador desde este panel.'
            });
            return;
        }

        const targetUser = await User.findById(id);
        if (!targetUser) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const activeBookings = await Booking.find({
            user: id,
            status: { $in: ['Pendiente', 'Aprobado'] }
        });

        for (const booking of activeBookings) {
            await GymClass.findByIdAndUpdate(booking.gymClass, {
                $inc: { availableSlots: 1 }
            });
        }

        await Booking.deleteMany({ user: id });
        await User.findByIdAndDelete(id);

        res.status(200).json({
            ok: true,
            message: `Usuario ${targetUser.email} eliminado y ${activeBookings.length} cupo(s) activo(s) liberado(s).`
        });
    } catch (error) {
        console.error('Error al eliminar usuario por admin:', error);
        res.status(500).json({ ok: false, message: 'Error interno al eliminar el usuario' });
    }
};