import { Schema, model, Document, Types } from 'mongoose';

export interface IRoom extends Document {
    name: string; // Ej: "Salón Principal", "Sala de Spinning"
    location: string;
    capacity: number;
    supportedDisciplines: Types.ObjectId[];
    photoUrl?: string; 
}

const roomSchema = new Schema<IRoom>({
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: Number, required: true },
    supportedDisciplines: [{ type: Schema.Types.ObjectId, ref: 'Discipline' }],
    photoUrl: { type: String }
}, { timestamps: true });

export const Room = model<IRoom>('Room', roomSchema);