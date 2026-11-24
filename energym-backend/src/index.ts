import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './config/database';

// Importación de Rutas
import userRoutes from './routes/userRoutes';
import gymRoutes from './routes/gymRoutes';
import gymClassRoutes from './routes/gymClassRoutes';
import bookingRoutes from './routes/bookingRoutes';
import uploadRoutes from './routes/uploadRoutes';
import statsRoutes from './routes/statsRoutes';
import storeRoutes from './routes/storeRoutes';

// 1. Cargar las variables de entorno del archivo .env
dotenv.config();

// 2. Inicializar la aplicación de Express
const app: Application = express();
const PORT = process.env.PORT || 5000;

// 3. Middlewares globales
const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter((origin): origin is string => Boolean(origin));

app.use(express.json()); // Permite recibir datos en formato JSON
app.use(
    cors({
        origin: (origin, callback) => {
            // Permite peticiones sin origin (como Postman, curl o health checks del servidor)
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('No permitido por CORS'));
            }
        },
        credentials: true,
    })
);
app.use(morgan('dev'));  // Muestra las peticiones HTTP en la terminal en tiempo real

// 4. Archivos estáticos (Carpeta uploads e imágenes públicas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// 5. Rutas de la API
app.use('/api/users', userRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/classes', gymClassRoutes); // Ruta para FullCalendar / Clases de Energym
app.use('/api/bookings', bookingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/store', storeRoutes);

// 6. Ruta de prueba principal
app.get('/', (_req: Request, res: Response) => {
    res.json({
        ok: true,
        message: '¡Bienvenida a la API de Energym 🏋️‍♀️✨!',
        status: 'Funcionando al 100%',
    });
});

// 7. Inicializar Base de Datos y levantar servidor
const startServer = async () => {
    try {
        await connectDB(); // Conectamos a MongoDB primero

        app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo exitosamente en el puerto http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
    }
};

startServer();