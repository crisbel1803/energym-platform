import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz de Request de Express para poder guardar la información del usuario decodificada
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        role: string;
    };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    // 1. Obtener el token desde los headers de la petición (en la cabecera 'Authorization')
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            ok: false,
            message: 'Acceso denegado. No se proporcionó un token de autenticación.'
        });
        return;
    }

    // El formato del header es "Bearer <token>", así que separamos por el espacio para extraer solo el token
    const token = authHeader.split(' ')[1];

    try {
        // 2. Verificar y decodificar el token usando nuestra clave secreta
        const secret = process.env.JWT_SECRET || 'secreto';
        const decoded = jwt.verify(token, secret) as { uid: string; role: string };

        // 3. Adjuntar los datos del usuario decodificados al objeto 'req' para que las siguientes rutas los usen
        req.user = decoded;

        // 4. Permitir que la petición continúe hacia el controlador correspondiente
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(403).json({
            ok: false,
            message: 'Token inválido o expirado.'
        });
        return;
    }
};