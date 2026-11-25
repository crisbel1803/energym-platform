import { Request, Response } from 'express';
import { GymClass, IGymClass } from '../models/GymClass';
import { Discipline } from '../models/Discipline';
import { Booking } from '../models/Booking';
import { sendEmail } from '../services/mailService';

const ONE_HOUR_MS = 60 * 60 * 1000;
const BASE_CLASS_DESCRIPTION = 'Entrenamiento guiado por instructores profesionales.';

interface PopulatedUser {
    _id: unknown;
    name?: string;
    email?: string;
}

interface ClassChange {
    label: string;
    before: string;
    after: string;
    summaryText: string;
}

const formatTime = (date: Date): string =>
    new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const formatDateTime = (date: Date): string =>
    new Date(date).toLocaleString();

// Siempre calcula el cierre exactamente 60 minutos después del inicio
const buildOneHourEnd = (start: Date): Date => new Date(start.getTime() + ONE_HOUR_MS);

// Verifica que la fecha sea válida y no anterior al momento exacto actual
const isFromNowOnward = (target: Date, now: Date = new Date()): boolean =>
    !Number.isNaN(target.getTime()) && target.getTime() >= now.getTime();

// Combina la descripción base con la descripción específica de la disciplina sin duplicar
function buildCombinedDescription(disciplineDesc?: string, customDesc?: string): string {
    const cleanDisciplineDesc = disciplineDesc?.trim();
    const cleanCustomDesc = customDesc?.trim();

    if (cleanDisciplineDesc) {
        if (cleanCustomDesc && cleanCustomDesc !== BASE_CLASS_DESCRIPTION && cleanCustomDesc.includes(cleanDisciplineDesc)) {
            return cleanCustomDesc;
        }
        return `${BASE_CLASS_DESCRIPTION} ${cleanDisciplineDesc}`;
    }

    return cleanCustomDesc || BASE_CLASS_DESCRIPTION;
}

async function resolveDisciplineDescription(disciplineName?: string): Promise<string | undefined> {
    if (!disciplineName || !disciplineName.trim()) return undefined;
    const escaped = disciplineName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const found = await Discipline.findOne({
        name: { $regex: new RegExp(`^${escaped}$`, 'i') }
    }).lean();
    return found?.description;
}

// Detecta únicamente cambios clave: horario, salón e instructor
function detectKeyChanges(
    previous: IGymClass,
    nextData: {
        startTime: Date;
        endTime: Date;
        room: string;
        instructor: string;
    }
): ClassChange[] {
    const changes: ClassChange[] = [];

    const prevStart = new Date(previous.startTime).getTime();
    const nextStart = new Date(nextData.startTime).getTime();
    const prevEnd = new Date(previous.endTime).getTime();
    const nextEnd = new Date(nextData.endTime).getTime();

    if (prevStart !== nextStart || prevEnd !== nextEnd) {
        const beforeSchedule = `${formatDateTime(previous.startTime)} - ${formatTime(previous.endTime)}`;
        const afterSchedule = `${formatDateTime(nextData.startTime)} - ${formatTime(nextData.endTime)}`;
        changes.push({
            label: 'Horario / Fecha',
            before: beforeSchedule,
            after: afterSchedule,
            summaryText: `Horario: de ${beforeSchedule} a ${afterSchedule}`
        });
    }

    if (previous.room !== nextData.room) {
        changes.push({
            label: 'Salón',
            before: previous.room,
            after: nextData.room,
            summaryText: `Salón: de "${previous.room}" a "${nextData.room}"`
        });
    }

    if (previous.instructor !== nextData.instructor) {
        changes.push({
            label: 'Instructor',
            before: previous.instructor,
            after: nextData.instructor,
            summaryText: `Instructor: de "${previous.instructor}" a "${nextData.instructor}"`
        });
    }

    return changes;
}

function buildChangesComparisonHtml(changes: ClassChange[]): string {
    return changes
        .map(
            (change) => `
            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #6b7280; margin-bottom: 8px;">
                    ${change.label}
                </div>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="padding: 8px 10px; background-color: #fef2f2; border-radius: 6px; width: 47%; vertical-align: top;">
                            <span style="display: inline-block; font-size: 10px; font-weight: bold; color: #dc2626; background-color: #fee2e2; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px;">
                                ANTES
                            </span>
                            <div style="font-size: 13px; color: #7f1d1d; text-decoration: line-through;">
                                ${change.before}
                            </div>
                        </td>
                        <td style="width: 6%; text-align: center; color: #9ca3af; font-weight: bold; font-size: 15px;">
                            →
                        </td>
                        <td style="padding: 8px 10px; background-color: #ecfdf5; border-radius: 6px; width: 47%; vertical-align: top;">
                            <span style="display: inline-block; font-size: 10px; font-weight: bold; color: #059669; background-color: #d1fae5; padding: 2px 6px; border-radius: 4px; margin-bottom: 5px;">
                                MODIFICADA
                            </span>
                            <div style="font-size: 13px; color: #065f46; font-weight: bold;">
                                ${change.after}
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        `
        )
        .join('');
}

// Envía correos en paralelo sin bloquear ni romper la operación principal
async function sendNotificationsSafely(
    recipients: Array<{ email?: string; name?: string }>,
    subject: string,
    buildHtml: (recipientName: string) => string
): Promise<void> {
    const validRecipients = recipients.filter((r) => Boolean(r.email));
    if (validRecipients.length === 0) return;

    const results = await Promise.allSettled(
        validRecipients.map((recipient) =>
            sendEmail(
                recipient.email as string,
                subject,
                buildHtml(recipient.name || 'Atleta')
            )
        )
    );

    results.forEach((result, index) => {
        if (result.status === 'rejected') {
            console.error(
                `Fallo al enviar notificación a ${validRecipients[index].email}:`,
                result.reason
            );
        }
    });
}

// Obtener todas las clases formateadas para FullCalendar
export const getClasses = async (_req: Request, res: Response): Promise<void> => {
    try {
        const classes = await GymClass.find({ isActive: true });

        const events = classes.map((c) => {
            const start = new Date(c.startTime);
            const end = buildOneHourEnd(start);

            return {
                id: c._id.toString(),
                title: c.title,
                start,
                end,
                extendedProps: {
                    instructor: c.instructor,
                    description: c.description,
                    capacity: c.maxCapacity,
                    availableSlots: c.availableSlots,
                    price: c.cost,
                    room: c.room
                }
            };
        });

        res.status(200).json({ ok: true, events });
    } catch (error) {
        console.error('Error al obtener clases:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener el horario' });
    }
};

// Crear una nueva clase (Admin) - Cualquier día desde el momento exacto, duración fija de 60 min
export const createClass = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, discipline, instructor, room, startDate, maxCapacity, cost, level } = req.body;

        const now = new Date();
        const start = new Date(startDate);

        if (!isFromNowOnward(start, now)) {
            res.status(400).json({
                ok: false,
                message: 'Solo puedes programar clases a partir del momento exacto actual'
            });
            return;
        }

        const end = buildOneHourEnd(start);
        const disciplineName = discipline || title;
        const disciplineDesc = await resolveDisciplineDescription(disciplineName);
        const finalDescription = buildCombinedDescription(disciplineDesc, description);

        const newClass = new GymClass({
            title,
            description: finalDescription,
            discipline: disciplineName,
            instructor,
            room: room || 'Salón Principal',
            startTime: start,
            endTime: end,
            maxCapacity: maxCapacity || 20,
            availableSlots: maxCapacity || 20,
            cost: cost || 0,
            level: level || 'Todos los niveles'
        });

        await newClass.save();
        res.status(201).json({
            ok: true,
            message: '¡Clase programada exitosamente (duración: 1 hora)!',
            class: newClass
        });
    } catch (error) {
        console.error('Error al crear clase:', error);
        res.status(500).json({ ok: false, message: 'Error al programar la clase', error: String(error) });
    }
};

// Actualizar una clase existente - No permite mover al pasado, mantiene 60 min y notifica cambios clave
export const updateClass = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, discipline, instructor, room, startDate, maxCapacity, cost, level } = req.body;

        const currentClass = await GymClass.findById(id);
        if (!currentClass) {
            res.status(404).json({ ok: false, message: 'Clase no encontrada' });
            return;
        }

        const now = new Date();
        let nextStart = new Date(currentClass.startTime);

        if (startDate) {
            const parsedStart = new Date(startDate);
            if (!isFromNowOnward(parsedStart, now)) {
                res.status(400).json({
                    ok: false,
                    message: 'No puedes programar o mover una clase a una fecha u hora pasada'
                });
                return;
            }
            nextStart = parsedStart;
        } else if (!isFromNowOnward(nextStart, now)) {
            res.status(400).json({
                ok: false,
                message: 'Debes asignar una fecha y hora a partir del momento actual para actualizar esta clase'
            });
            return;
        }

        const nextEnd = buildOneHourEnd(nextStart);
        const nextRoom = room || currentClass.room;
        const nextInstructor = instructor || currentClass.instructor;
        const nextDiscipline = discipline || title || currentClass.discipline;

        let nextDescription = currentClass.description;
        if (discipline || title || description !== undefined) {
            const disciplineDesc = await resolveDisciplineDescription(nextDiscipline);
            nextDescription = buildCombinedDescription(
                disciplineDesc,
                description !== undefined ? description : currentClass.description
            );
        }

        const keyChanges = detectKeyChanges(currentClass, {
            startTime: nextStart,
            endTime: nextEnd,
            room: nextRoom,
            instructor: nextInstructor
        });

        let nextAvailableSlots = currentClass.availableSlots;
        if (typeof maxCapacity === 'number' && maxCapacity > 0) {
            const occupiedSlots = Math.max(0, currentClass.maxCapacity - currentClass.availableSlots);
            nextAvailableSlots = Math.max(0, maxCapacity - occupiedSlots);
        }

        const updatedClass = await GymClass.findByIdAndUpdate(
            id,
            {
                ...(title && { title }),
                description: nextDescription,
                ...(nextDiscipline && { discipline: nextDiscipline }),
                ...(instructor && { instructor }),
                ...(room && { room }),
                startTime: nextStart,
                endTime: nextEnd,
                ...(typeof maxCapacity === 'number' && maxCapacity > 0 && {
                    maxCapacity,
                    availableSlots: nextAvailableSlots
                }),
                ...(cost !== undefined && { cost }),
                ...(level && { level })
            },
            { new: true }
        );

        if (!updatedClass) {
            res.status(404).json({ ok: false, message: 'Clase no encontrada' });
            return;
        }

        if (keyChanges.length > 0) {
            const summaryText = `Actualización en "${updatedClass.title}": ${keyChanges.map((c) => c.summaryText).join(' | ')}`;

            const activeBookings = await Booking.find({
                gymClass: id,
                status: { $in: ['Pendiente', 'Aprobado'] }
            }).populate<{ user: PopulatedUser }>('user', 'name email');

            if (activeBookings.length > 0) {
                await Booking.updateMany(
                    { _id: { $in: activeBookings.map((b) => b._id) } },
                    { $set: { classUpdateNotice: summaryText } }
                );

                const changesHtml = buildChangesComparisonHtml(keyChanges);
                const recipients = activeBookings.map((b) => b.user).filter(Boolean);

                await sendNotificationsSafely(
                    recipients,
                    `Cambio en tu clase de Energym: ${updatedClass.title}`,
                    (userName) => `
                        <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${userName}!</h2>
                        <p style="margin: 0 0 16px;">Se realizaron actualizaciones importantes en la clase <strong>${updatedClass.title}</strong> que tienes reservada. Aquí tienes el detalle:</p>
                        ${changesHtml}
                        <p style="margin: 16px 0 0; font-size: 14px; color: #4b5563;">Revisa tu perfil en Energym para confirmar los detalles actualizados de tu reserva.</p>
                    `
                );
            }
        }

        res.status(200).json({
            ok: true,
            message: '¡Clase actualizada exitosamente!',
            class: updatedClass,
            notifiedKeyChanges: keyChanges.length > 0
        });
    } catch (error) {
        console.error('Error al actualizar clase:', error);
        res.status(500).json({ ok: false, message: 'Error al actualizar la clase' });
    }
};

// Eliminar/cancelar una clase y notificar + actualizar reservas activas
export const deleteClass = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const targetClass = await GymClass.findById(id);

        if (!targetClass) {
            res.status(404).json({ ok: false, message: 'Clase no encontrada' });
            return;
        }

        const activeBookings = await Booking.find({
            gymClass: id,
            status: { $in: ['Pendiente', 'Aprobado'] }
        }).populate<{ user: PopulatedUser }>('user', 'name email');

        const cancelNotice =
            `La clase "${targetClass.title}" programada para el ${formatDateTime(targetClass.startTime)} fue cancelada por administración.`;

        await GymClass.findByIdAndDelete(id);

        if (activeBookings.length > 0) {
            await Booking.updateMany(
                { _id: { $in: activeBookings.map((b) => b._id) } },
                {
                    $set: {
                        status: 'Cancelado',
                        classUpdateNotice: cancelNotice
                    }
                }
            );

            const recipients = activeBookings.map((b) => b.user).filter(Boolean);

            await sendNotificationsSafely(
                recipients,
                `Clase cancelada en Energym: ${targetClass.title}`,
                (userName) => `
                    <h2 style="margin: 0 0 12px; color: #111827; font-size: 20px;">¡Hola, ${userName}!</h2>
                    <p style="margin: 0 0 16px;">Lamentamos informarte que la siguiente clase ha sido cancelada por administración:</p>
                    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px 18px; border-radius: 8px; margin: 16px 0;">
                        <p style="margin: 0 0 8px;"><strong>Clase:</strong> ${targetClass.title}</p>
                        <p style="margin: 0 0 8px;"><strong>Fecha y hora:</strong> ${formatDateTime(targetClass.startTime)}</p>
                        <p style="margin: 0;"><strong>Estado de tu reserva:</strong> <span style="color: #dc2626; font-weight: bold;">Cancelado</span></p>
                    </div>
                    <p style="margin: 16px 0 0; font-size: 14px; color: #4b5563;">Si realizaste un pago, por favor comunícate con administración para gestionar tu reembolso o reprogramación.</p>
                `
            );
        }

        res.status(200).json({ ok: true, message: 'Clase eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar clase:', error);
        res.status(500).json({ ok: false, message: 'Error al eliminar la clase' });
    }
};