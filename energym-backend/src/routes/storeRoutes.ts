import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware';
import { uploadProductImage, uploadReceiptImage } from '../middlewares/storeUploadMiddleware';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../controllers/productController';
import {
    getCartAndWishlist,
    addToCart,
    updateCartItem,
    removeFromCart,
    toggleWishlist,
    createManualOrder,
    createPayPalStoreOrder,
    capturePayPalStoreOrder,
    getMyOrders,
    cancelMyOrder,
    getAllOrdersAdmin,
    updateOrderAdmin,
    getStoreStatsAdmin,
} from '../controllers/storeController';

const router = Router();

// Catálogo público
router.get('/products', getProducts);

// CRUD de productos (Admin)
router.post('/products', verifyToken, uploadProductImage.single('photo'), createProduct);
router.put('/products/:id', verifyToken, uploadProductImage.single('photo'), updateProduct);
router.delete('/products/:id', verifyToken, deleteProduct);

// Carrito y lista de deseos (Usuario autenticado)
router.get('/user-data', verifyToken, getCartAndWishlist);
router.post('/cart', verifyToken, addToCart);
router.patch('/cart', verifyToken, updateCartItem);
router.delete('/cart/:productId', verifyToken, removeFromCart);
router.post('/wishlist/toggle', verifyToken, toggleWishlist);

// Órdenes de usuario
router.post('/orders/manual', verifyToken, uploadReceiptImage.single('receipt'), createManualOrder);
router.post('/orders/paypal/create', verifyToken, createPayPalStoreOrder);
router.post('/orders/paypal/capture', verifyToken, capturePayPalStoreOrder);
router.get('/orders/my-orders', verifyToken, getMyOrders);
router.patch('/orders/:id/cancel', verifyToken, cancelMyOrder);

// Administración de órdenes y métricas de tienda
router.get('/admin/orders', verifyToken, getAllOrdersAdmin);
router.patch('/admin/orders/:id', verifyToken, updateOrderAdmin);
router.get('/admin/stats', verifyToken, getStoreStatsAdmin);

export default router;