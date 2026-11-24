import { Router } from 'express';
import {
    createBooking,
    createPayPalOrder,
    capturePayPalOrder,
    getUserBookings,
    cancelMyBooking,
    getAllBookings,
    updateBookingStatus
} from '../controllers/bookingController';
import { verifyToken } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';

const router = Router();

router.post('/paypal/create-order', verifyToken, createPayPalOrder);
router.post('/paypal/capture-order', verifyToken, capturePayPalOrder);

router.post('/', verifyToken, upload.single('receipt'), createBooking);
router.get('/my-bookings', verifyToken, getUserBookings);
router.patch('/:id/cancel', verifyToken, cancelMyBooking);
router.get('/admin/all', verifyToken, getAllBookings);
router.patch('/:id/status', verifyToken, updateBookingStatus);

export default router;