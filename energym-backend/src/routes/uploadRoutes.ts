import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController';
import { upload } from '../middlewares/uploadMiddleware';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// Endpoint protegido para subir una imagen (el campo en el FormData se llamará 'image')
router.post('/', verifyToken, upload.single('image'), uploadImage);

export default router;