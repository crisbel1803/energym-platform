import { Request } from 'express';
import multer from 'multer';
import path from 'path';

// Configuración de almacenamiento local
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Carpeta donde se guardarán los archivos
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Generamos un nombre único para evitar sobreescrituras: timestamp + nombre original limpio
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// Filtro para aceptar solo imágenes
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const isValidExt = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExt && isValidMime) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos de imagen válidos (JPEG, JPG, PNG, WEBP)'));
    }
};

export const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB por imagen
    fileFilter: fileFilter
});