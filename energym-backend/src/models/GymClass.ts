import { Schema, model, Document } from 'mongoose';

export interface IGymClass extends Document {
    title: string;
    description: string;
    discipline: string;
    instructor: string;
    room: string;
    startTime: Date;
    endTime: Date;
    maxCapacity: number;
    availableSlots: number;
    cost: number;
    level: string;
    isActive: boolean;
}

const gymClassSchema = new Schema<IGymClass>({
    title: { type: String, required: true },
    description: { type: String, default: 'Entrenamiento guiado por profesionales' },
    discipline: { type: String, required: true },
    instructor: { type: String, required: true },
    room: { type: String, default: 'Salón Principal' },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    maxCapacity: { type: Number, required: true, default: 20 },
    availableSlots: { type: Number, required: true, default: 20 },
    cost: { type: Number, required: true, default: 0 },
    level: { type: String, default: 'Todos los niveles' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const GymClass = model<IGymClass>('GymClass', gymClassSchema);