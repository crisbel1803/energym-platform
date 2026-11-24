import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Ruta protegida para el panel de control del administrador
router.get('/dashboard', verifyToken, getDashboardStats);

export default router;