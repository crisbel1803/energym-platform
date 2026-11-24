import { Schema, model, Document, Types } from 'mongoose';

export type OrderStatus = 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Cancelado';
export type StorePaymentMethod = 'PayPal' | 'Pago Móvil' | 'Transferencia';

export interface IOrderItem {
    product: Types.ObjectId;
    nameSnapshot: string;
    colorSnapshot: string;
    sizeSnapshot: string;
    quantity: number;
    unitPrice: number;
}

export interface IOrder extends Document {
    user: Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    paymentMethod: StorePaymentMethod;
    paymentReceived: boolean;
    paymentReference?: string;
    receiptUrl?: string;
    paypalOrderId?: string;
    paypalTransactionId?: string;
    status: OrderStatus;
    adminNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        nameSnapshot: { type: String, required: true },
        colorSnapshot: { type: String, required: true },
        sizeSnapshot: { type: String, required: true, default: 'Única' },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: [(arr: IOrderItem[]) => arr.length > 0, 'El pedido debe tener al menos un ítem'],
        },
        totalAmount: { type: Number, required: true, min: 0 },
        paymentMethod: {
            type: String,
            enum: ['PayPal', 'Pago Móvil', 'Transferencia'],
            required: true,
        },
        paymentReceived: {
            type: Boolean,
            default: false,
        },
        paymentReference: {
            type: String,
            default: '',
        },
        receiptUrl: {
            type: String,
            default: '',
        },
        paypalOrderId: {
            type: String,
            default: '',
        },
        paypalTransactionId: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            enum: ['Pendiente', 'Aprobado', 'Rechazado', 'Cancelado'],
            default: 'Pendiente',
        },
        adminNotes: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

export const Order = model<IOrder>('Order', orderSchema);