import { Router } from 'express';
import { getClasses, createClass, updateClass, deleteClass } from '../controllers/gymClassController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', getClasses);
router.post('/', verifyToken, createClass);
router.put('/:id', verifyToken, updateClass);    // <--- Actualizar clase
router.delete('/:id', verifyToken, deleteClass); // <--- Eliminar clase

export default router;