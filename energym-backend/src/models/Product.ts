import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    description: string;
    category: string;
    price: number;
    stock: number;
    sizes: string[];
    color: string;
    photoUrl?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
    {
        name: {
            type: String,
            required: [true, 'El nombre del producto es obligatorio'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'La descripción del producto es obligatoria'],
            trim: true,
        },
        category: {
            type: String,
            required: [true, 'La categoría es obligatoria'],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, 'El precio en USD es obligatorio'],
            min: [0.01, 'El precio debe ser mayor a 0'],
        },
        stock: {
            type: Number,
            required: [true, 'El stock es obligatorio'],
            min: [0, 'El stock no puede ser negativo'],
            default: 0,
        },
        sizes: {
            type: [String],
            default: ['Única'],
        },
        color: {
            type: String,
            required: [true, 'El color del artículo es obligatorio'],
            trim: true,
        },
        photoUrl: {
            type: String,
            default: '',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export const Product = model<IProduct>('Product', productSchema);