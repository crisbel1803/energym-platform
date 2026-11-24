import { Schema, model, Document, Types } from 'mongoose';

export interface ICartItem {
    product: Types.ObjectId | any;
    size: string;
    quantity: number;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    phone?: string;
    role: 'ADMIN' | 'CLIENT';
    isVerified: boolean;
    verificationToken?: string;
    verificationTokenExpires?: Date;
    cart: ICartItem[];
    wishlist: (Types.ObjectId | any)[];
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, 'El nombre es obligatorio'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'El correo es obligatorio'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'La contraseña es obligatoria'],
        },
        phone: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['ADMIN', 'CLIENT'],
            default: 'CLIENT',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },
        verificationTokenExpires: {
            type: Date,
        },
        cart: [
            {
                product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
                size: { type: String, required: true, default: 'Única' },
                quantity: { type: Number, required: true, min: 1, default: 1 },
            },
        ],
        wishlist: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const User = model<IUser>('User', userSchema);