import { Schema, model, Document, Types } from 'mongoose';

export interface IInstructor extends Document {
    name: string;
    contactEmail: string;
    phone: string;
    disciplines: Types.ObjectId[]; // Relación con las disciplinas que imparte
    photoUrl?: string;
    createdAt: Date;
}

const instructorSchema = new Schema<IInstructor>({
    name: { type: String, required: true },
    contactEmail: { type: String },
    phone: { type: String },
    disciplines: [{ type: Schema.Types.ObjectId, ref: 'Discipline' }],
    photoUrl: { type: String }
}, { timestamps: true });

export const Instructor = model<IInstructor>('Instructor', instructorSchema);