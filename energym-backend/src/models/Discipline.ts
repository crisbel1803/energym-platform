import { Schema, model, Document } from 'mongoose';

export interface IDiscipline extends Document {
    name: string;
    description: string;
    exerciseType: string; // Ej: Cardio, Fuerza, Yoga, Funcional
    photoUrl?: string;
    createdAt: Date;
}

const disciplineSchema = new Schema<IDiscipline>({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    exerciseType: { type: String, required: true },
    photoUrl: { type: String } // Opcional o requerido según prefieras
}, { timestamps: true });

export const Discipline = model<IDiscipline>('Discipline', disciplineSchema);