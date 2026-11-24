import { Request, Response } from 'express';
import { Discipline } from '../models/Discipline';
import { Instructor } from '../models/Instructor';
import { Room } from '../models/Room';

// ==========================================
// 1. CONTROLADORES DE DISCIPLINAS
// ==========================================

export const createDiscipline = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('FILE:', req.file);
        console.log('BODY:', req.body);
        const { name, description, exerciseType } = req.body;

        const existingDiscipline = await Discipline.findOne({ name });
        if (existingDiscipline) {
            res.status(400).json({ ok: false, message: 'La disciplina ya existe' });
            return;
        }

        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        const discipline = new Discipline({ name, description, exerciseType, photoUrl });
        await discipline.save();

        res.status(201).json({
            ok: true,
            message: '¡Disciplina creada exitosamente 🏋️‍♀️!',
            data: discipline
        });
    } catch (error) {
        console.error('Error al crear disciplina:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const getDisciplines = async (req: Request, res: Response): Promise<void> => {
    try {
        const disciplines = await Discipline.find();
        res.status(200).json({ ok: true, data: disciplines });
    } catch (error) {
        console.error('Error al obtener disciplinas:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 2. CONTROLADORES DE INSTRUCTORES
// ==========================================

export const createInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, contactEmail, phone, disciplines } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        // Nota: si disciplines llega como JSON string desde FormData, asegúrate de parsearlo si hace falta
        const parsedDisciplines = typeof disciplines === 'string' ? JSON.parse(disciplines) : disciplines;

        const instructor = new Instructor({
            name,
            contactEmail,
            phone,
            disciplines: parsedDisciplines,
            photoUrl
        });
        await instructor.save();

        res.status(201).json({
            ok: true,
            message: '¡Instructor registrado exitosamente 🥇!',
            data: instructor
        });
    } catch (error) {
        console.error('Error al crear instructor:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const getInstructors = async (req: Request, res: Response): Promise<void> => {
    try {
        // .populate('disciplines') trae la información detallada de la disciplina en lugar de solo ver IDs
        const instructors = await Instructor.find().populate('disciplines');
        res.status(200).json({ ok: true, data: instructors });
    } catch (error) {
        console.error('Error al obtener instructores:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 3. CONTROLADORES DE SALONES (ROOMS)
// ==========================================

export const createRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, location, capacity, supportedDisciplines } = req.body;
        const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

        const parsedDisciplines = typeof supportedDisciplines === 'string'
            ? JSON.parse(supportedDisciplines)
            : supportedDisciplines;

        const room = new Room({
            name,
            location,
            capacity,
            supportedDisciplines: parsedDisciplines,
            photoUrl
        });
        await room.save();

        res.status(201).json({
            ok: true,
            message: '¡Salón creado exitosamente 🏢!',
            data: room
        });
    } catch (error) {
        console.error('Error al crear salón:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const getRooms = async (req: Request, res: Response): Promise<void> => {
    try {
        const rooms = await Room.find().populate('supportedDisciplines');
        res.status(200).json({ ok: true, data: rooms });
    } catch (error) {
        console.error('Error al obtener salones:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 4. ACTUALIZAR Y ELIMINAR DISCIPLINAS
// ==========================================
export const updateDiscipline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, description, exerciseType } = req.body;

        const updateData: {
            name?: string;
            description?: string;
            exerciseType?: string;
            photoUrl?: string;
        } = {};

        if (name !== undefined) updateData.name = name;
        if (description !== undefined) updateData.description = description;
        if (exerciseType !== undefined) updateData.exerciseType = exerciseType;
        if (req.file) {
            updateData.photoUrl = `/uploads/${req.file.filename}`;
        }

        const updated = await Discipline.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            res.status(404).json({ ok: false, message: 'Disciplina no encontrada' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Disciplina actualizada exitosamente', data: updated });
    } catch (error) {
        console.error('Error al actualizar disciplina:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const deleteDiscipline = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Discipline.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ ok: false, message: 'Disciplina no encontrada' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Disciplina eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 5. ACTUALIZAR Y ELIMINAR INSTRUCTORES
// ==========================================
export const updateInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, contactEmail, phone, disciplines } = req.body;

        const updateData: Record<string, any> = {
            name,
            contactEmail,
            phone,
        };

        if (disciplines !== undefined) {
            updateData.disciplines = typeof disciplines === 'string' ? JSON.parse(disciplines) : disciplines;
        }

        // Solo actualiza photoUrl si se subió un archivo nuevo
        if (req.file) {
            updateData.photoUrl = `/uploads/${req.file.filename}`;
        }

        const updated = await Instructor.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            res.status(404).json({ ok: false, message: 'Instructor no encontrado' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Instructor actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error al actualizar instructor:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const deleteInstructor = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Instructor.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ ok: false, message: 'Instructor no encontrado' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Instructor eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

// ==========================================
// 6. ACTUALIZAR Y ELIMINAR SALONES (ROOMS)
// ==========================================
export const updateRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { name, location, capacity, supportedDisciplines } = req.body;

        const updateData: Record<string, any> = {
            name,
            location,
            capacity,
        };

        if (supportedDisciplines !== undefined) {
            updateData.supportedDisciplines = typeof supportedDisciplines === 'string'
                ? JSON.parse(supportedDisciplines)
                : supportedDisciplines;
        }

        if (req.file) {
            updateData.photoUrl = `/uploads/${req.file.filename}`;
        }

        const updated = await Room.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) {
            res.status(404).json({ ok: false, message: 'Salón no encontrado' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Salón actualizado exitosamente', data: updated });
    } catch (error) {
        console.error('Error al actualizar salón:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};

export const deleteRoom = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deleted = await Room.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ ok: false, message: 'Salón no encontrado' });
            return;
        }
        res.status(200).json({ ok: true, message: 'Salón eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};