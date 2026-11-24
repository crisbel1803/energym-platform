import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User';
import { GymClass } from '../models/GymClass';
import { Booking } from '../models/Booking';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol de Administrador.' });
            return;
        }

        const [
            totalUsers,
            totalActiveClasses,
            totalBookings,
            approvedBookings,
            pendingBookings,
            cancelledBookings,
            rejectedBookings,
            revenueAgg,
            pendingRevenueAgg,
            byMethodAgg,
            byClassAgg,
        ] = await Promise.all([
            User.countDocuments(),
            GymClass.countDocuments({ isActive: true }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: 'Aprobado' }),
            Booking.countDocuments({ status: 'Pendiente' }),
            Booking.countDocuments({ status: 'Cancelado' }),
            Booking.countDocuments({ status: 'Rechazado' }),
            Booking.aggregate([
                { $match: { status: 'Aprobado' } },
                {
                    $lookup: {
                        from: 'gymclasses',
                        localField: 'gymClass',
                        foreignField: '_id',
                        as: 'classDetails',
                    },
                },
                { $unwind: '$classDetails' },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ['$classDetails.cost', 0] } },
                    },
                },
            ]),
            Booking.aggregate([
                { $match: { status: 'Pendiente' } },
                {
                    $lookup: {
                        from: 'gymclasses',
                        localField: 'gymClass',
                        foreignField: '_id',
                        as: 'classDetails',
                    },
                },
                { $unwind: '$classDetails' },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ['$classDetails.cost', 0] } },
                    },
                },
            ]),
            Booking.aggregate([
                {
                    $group: {
                        _id: '$paymentMethod',
                        count: { $sum: 1 },
                    },
                },
            ]),
            Booking.aggregate([
                {
                    $lookup: {
                        from: 'gymclasses',
                        localField: 'gymClass',
                        foreignField: '_id',
                        as: 'classDetails',
                    },
                },
                { $unwind: '$classDetails' },
                {
                    $group: {
                        _id: { $ifNull: ['$classDetails.discipline', '$classDetails.title'] },
                        totalBookings: { $sum: 1 },
                        approvedCount: {
                            $sum: { $cond: [{ $eq: ['$status', 'Aprobado'] }, 1, 0] },
                        },
                    },
                },
                { $sort: { totalBookings: -1 } },
                { $limit: 6 },
            ]),
        ]);

        const totalRevenue = revenueAgg.length > 0 ? Number(revenueAgg[0].total || 0) : 0;
        const pendingRevenue = pendingRevenueAgg.length > 0 ? Number(pendingRevenueAgg[0].total || 0) : 0;

        const methodMap = new Map<string, number>();
        for (const item of byMethodAgg) {
            if (item._id) {
                methodMap.set(String(item._id), Number(item.count || 0));
            }
        }

        const bookingsByMethod = {
            PayPal: methodMap.get('PayPal') || 0,
            'Pago Móvil': methodMap.get('Pago Móvil') || 0,
            Transferencia: methodMap.get('Transferencia') || 0,
        };

        const bookingsByDiscipline = byClassAgg.map((row) => ({
            label: String(row._id || 'Sin disciplina'),
            total: Number(row.totalBookings || 0),
            approved: Number(row.approvedCount || 0),
        }));

        res.status(200).json({
            ok: true,
            updatedAt: new Date().toISOString(),
            data: {
                totalUsers,
                totalActiveClasses,
                totalBookings,
                approvedBookings,
                pendingBookings,
                cancelledBookings,
                rejectedBookings,
                totalRevenue,
                pendingRevenue,
                bookingsByMethod,
                bookingsByDiscipline,
            },
        });
    } catch (error) {
        console.error('Error al obtener estadísticas del dashboard:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};