import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';

export const uploadImage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ ok: false, message: 'No se ha proporcionado ninguna imagen' });
            return;
        }

        // Construimos la URL pública del archivo subido
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.status(201).json({
            ok: true,
            message: '¡Imagen subida exitosamente 📸!',
            url: fileUrl
        });

    } catch (error) {
        console.error('Error al subir la imagen:', error);
        res.status(500).json({ ok: false, message: 'Error interno del servidor' });
    }
};