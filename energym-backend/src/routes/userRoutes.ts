import { Router } from 'express';
import {
    registerUser,
    verifyEmail,
    loginUser,
    getUserProfile,
    updateUserProfile,
    deleteUserProfile,
    getAllUsersAdmin,
    verifyUserByAdmin,
    updateUserRoleByAdmin,
    deleteUserByAdmin
} from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register', registerUser);
router.get('/verify-email', verifyEmail);
router.post('/login', loginUser);
router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.delete('/profile', verifyToken, deleteUserProfile);

// Rutas administrativas de gestión de usuarios
router.get('/admin/all', verifyToken, getAllUsersAdmin);
router.patch('/admin/:id/verify', verifyToken, verifyUserByAdmin);
router.patch('/admin/:id/role', verifyToken, updateUserRoleByAdmin);
router.delete('/admin/:id', verifyToken, deleteUserByAdmin);

export default router;