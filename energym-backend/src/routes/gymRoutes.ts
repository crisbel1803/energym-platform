import { Router } from 'express';
import { 
    createDiscipline, getDisciplines, updateDiscipline, deleteDiscipline,
    createInstructor, getInstructors, updateInstructor, deleteInstructor,
    createRoom, getRooms, updateRoom, deleteRoom 
} from '../controllers/gymController';
import { verifyToken } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

// --- RUTAS DE DISCIPLINAS ---
router.get('/disciplines', getDisciplines);
router.post('/disciplines', verifyToken, upload.single('photo'), createDiscipline); // <--- Única y con upload
router.put('/disciplines/:id', verifyToken, upload.single('photo'), updateDiscipline);
router.delete('/disciplines/:id', verifyToken, deleteDiscipline);

// --- RUTAS DE INSTRUCTORES ---
router.get('/instructors', getInstructors);
router.post('/instructors', verifyToken, upload.single('photo'), createInstructor);
router.put('/instructors/:id', verifyToken, upload.single('photo'), updateInstructor);
router.delete('/instructors/:id', verifyToken, deleteInstructor);

// --- RUTAS DE SALONES ---
router.get('/rooms', getRooms);
router.post('/rooms', verifyToken, upload.single('photo'), createRoom);
router.put('/rooms/:id', verifyToken, upload.single('photo'), updateRoom);
router.delete('/rooms/:id', verifyToken, deleteRoom);

export default router;