import { Schema, model, Document, Types } from 'mongoose';

export type PaymentMethodType = 'PayPal' | 'Transferencia' | 'Pago Móvil';
export type BookingStatusType = 'Pendiente' | 'Aprobado' | 'Cancelado' | 'Rechazado';

export interface IBooking extends Document {
    user: Types.ObjectId;
    gymClass: Types.ObjectId;
    status: BookingStatusType;
    paymentMethod: PaymentMethodType;
    paymentReference?: string;     // Nro. de referencia en Transferencia / Pago Móvil
    paymentReceiptUrl?: string;    // Ruta local /uploads/... del comprobante
    paypalTransactionId?: string;  // ID de transacción verificado en PayPal
    adminMessage?: string;
    classUpdateNotice?: string;    // Aviso automático por cambio clave o cancelación de la clase
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    gymClass: { type: Schema.Types.ObjectId, ref: 'GymClass', required: true },
    status: {
        type: String,
        enum: ['Pendiente', 'Aprobado', 'Cancelado', 'Rechazado'],
        default: 'Pendiente'
    },
    paymentMethod: {
        type: String,
        enum: ['PayPal', 'Transferencia', 'Pago Móvil'],
        required: true
    },
    paymentReference: { type: String },
    paymentReceiptUrl: { type: String },
    paypalTransactionId: { type: String },
    adminMessage: { type: String },
    classUpdateNotice: { type: String }
}, { timestamps: true });

export const Booking = model<IBooking>('Booking', bookingSchema);