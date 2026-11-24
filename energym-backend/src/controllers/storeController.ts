import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order, OrderStatus, StorePaymentMethod } from '../models/Order';

const getPayPalBaseUrl = () => {
    return process.env.PAYPAL_MODE === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
};

const getPayPalAccessToken = async (): Promise<string> => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !secret) {
        throw new Error('Credenciales de PayPal no configuradas en el servidor.');
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
        throw new Error('No se pudo autenticar con PayPal Sandbox.');
    }

    const data = (await response.json()) as { access_token: string };
    return data.access_token;
};

// ==========================================
// CARRITO PERSISTENTE POR USUARIO
// ==========================================
export const getCartAndWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const userDoc = await User.findById(userId)
            .populate('cart.product')
            .populate('wishlist')
            .lean();

        if (!userDoc) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const validCart = ((userDoc as any).cart || []).filter((c: any) => c.product);
        const validWishlist = ((userDoc as any).wishlist || []).filter(Boolean);

        res.status(200).json({
            ok: true,
            data: {
                cart: validCart,
                wishlist: validWishlist,
            },
        });
    } catch (error) {
        console.error('Error al obtener carrito y lista de deseos:', error);
        res.status(500).json({ ok: false, message: 'Error al cargar carrito y lista de deseos' });
    }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { productId, size, quantity = 1 } = req.body;
        const qty = Number(quantity);

        if (!productId || !Number.isInteger(qty) || qty < 1) {
            res.status(400).json({ ok: false, message: 'Producto y cantidad válida (>= 1) requeridos.' });
            return;
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            res.status(404).json({ ok: false, message: 'Producto no disponible.' });
            return;
        }

        const chosenSize =
            typeof size === 'string' && size.trim()
                ? size.trim()
                : product.sizes?.[0] || 'Única';

        const userDoc = await User.findById(userId);
        if (!userDoc) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const cartArr: any[] = (userDoc as any).cart || [];
        const existingIndex = cartArr.findIndex(
            (item) => String(item.product) === String(productId) && item.size === chosenSize
        );

        const nextQty = existingIndex >= 0 ? cartArr[existingIndex].quantity + qty : qty;
        if (nextQty > product.stock) {
            res.status(400).json({
                ok: false,
                message: `Stock insuficiente. Solo quedan ${product.stock} unidad(es) de ${product.name}.`,
            });
            return;
        }

        if (existingIndex >= 0) {
            cartArr[existingIndex].quantity = nextQty;
        } else {
            cartArr.push({ product: product._id, size: chosenSize, quantity: qty });
        }

        (userDoc as any).cart = cartArr;
        await userDoc.save();

        const populated = await User.findById(userId).populate('cart.product').lean();
        res.status(200).json({
            ok: true,
            message: 'Producto añadido al carrito.',
            data: (populated as any)?.cart || [],
        });
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        res.status(500).json({ ok: false, message: 'Error al añadir al carrito' });
    }
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { productId, size, quantity } = req.body;
        const qty = Number(quantity);

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ ok: false, message: 'Producto no encontrado' });
            return;
        }

        const userDoc = await User.findById(userId);
        if (!userDoc) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        let cartArr: any[] = (userDoc as any).cart || [];
        const idx = cartArr.findIndex(
            (item) => String(item.product) === String(productId) && item.size === size
        );

        if (idx < 0) {
            res.status(404).json({ ok: false, message: 'Ítem no encontrado en el carrito' });
            return;
        }

        if (qty <= 0) {
            cartArr = cartArr.filter((_, i) => i !== idx);
        } else {
            if (qty > product.stock) {
                res.status(400).json({
                    ok: false,
                    message: `Solo hay ${product.stock} unidad(es) disponibles.`,
                });
                return;
            }
            cartArr[idx].quantity = qty;
        }

        (userDoc as any).cart = cartArr;
        await userDoc.save();

        const populated = await User.findById(userId).populate('cart.product').lean();
        res.status(200).json({
            ok: true,
            data: (populated as any)?.cart || [],
        });
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        res.status(500).json({ ok: false, message: 'Error al actualizar el carrito' });
    }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { productId } = req.params;
        const size = typeof req.query.size === 'string' ? req.query.size : undefined;

        const userDoc = await User.findById(userId);
        if (!userDoc) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const cartArr: any[] = (userDoc as any).cart || [];
        (userDoc as any).cart = cartArr.filter((item) => {
            const sameProduct = String(item.product) === String(productId);
            if (!sameProduct) return true;
            return size ? item.size !== size : false;
        });

        await userDoc.save();
        const populated = await User.findById(userId).populate('cart.product').lean();
        res.status(200).json({
            ok: true,
            message: 'Producto eliminado del carrito.',
            data: (populated as any)?.cart || [],
        });
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({ ok: false, message: 'Error al eliminar del carrito' });
    }
};

// ==========================================
// LISTA DE DESEOS PERSISTENTE POR USUARIO
// ==========================================
export const toggleWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const { productId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            res.status(404).json({ ok: false, message: 'Producto no encontrado' });
            return;
        }

        const userDoc = await User.findById(userId);
        if (!userDoc) {
            res.status(404).json({ ok: false, message: 'Usuario no encontrado' });
            return;
        }

        const wishArr: any[] = (userDoc as any).wishlist || [];
        const exists = wishArr.some((id) => String(id) === String(productId));

        if (exists) {
            (userDoc as any).wishlist = wishArr.filter((id) => String(id) !== String(productId));
        } else {
            wishArr.push(product._id);
            (userDoc as any).wishlist = wishArr;
        }

        await userDoc.save();
        const populated = await User.findById(userId).populate('wishlist').lean();

        res.status(200).json({
            ok: true,
            wishlisted: !exists,
            message: !exists ? 'Añadido a tu lista de deseos.' : 'Quitado de tu lista de deseos.',
            data: (populated as any)?.wishlist || [],
        });
    } catch (error) {
        console.error('Error al actualizar lista de deseos:', error);
        res.status(500).json({ ok: false, message: 'Error en la lista de deseos' });
    }
};

// ==========================================
// CREAR ORDEN (PAGO MÓVIL / TRANSFERENCIA)
// ==========================================
export const createManualOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const deducted: { productId: any; quantity: number }[] = [];

    try {
        const userId = req.user?.uid;
        const paymentMethod = req.body.paymentMethod as StorePaymentMethod;
        const paymentReference = typeof req.body.paymentReference === 'string' ? req.body.paymentReference.trim() : '';

        if (!['Pago Móvil', 'Transferencia'].includes(paymentMethod)) {
            res.status(400).json({ ok: false, message: 'Método de pago manual no válido.' });
            return;
        }

        const receiptUrl = req.file ? `/uploads/receipts/${req.file.filename}` : '';
        if (!paymentReference && !receiptUrl) {
            res.status(400).json({
                ok: false,
                message: 'Ingresa el número de referencia o adjunta el comprobante de pago.',
            });
            return;
        }

        const userDoc = await User.findById(userId).populate('cart.product');
        const cartItems: any[] = ((userDoc as any)?.cart || []).filter((c: any) => c.product);

        if (!userDoc || cartItems.length === 0) {
            res.status(400).json({ ok: false, message: 'Tu carrito está vacío.' });
            return;
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const c of cartItems) {
            const prod = c.product;
            const qty = Number(c.quantity);

            const updatedProd = await Product.findOneAndUpdate(
                { _id: prod._id, isActive: true, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
            );

            if (!updatedProd) {
                for (const d of deducted) {
                    await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
                }
                res.status(400).json({
                    ok: false,
                    message: `Stock insuficiente para "${prod.name}". Revisa tu carrito.`,
                });
                return;
            }

            deducted.push({ productId: prod._id, quantity: qty });
            const unitPrice = Number(prod.price);
            totalAmount += unitPrice * qty;

            orderItems.push({
                product: prod._id,
                nameSnapshot: prod.name,
                colorSnapshot: prod.color,
                sizeSnapshot: c.size || 'Única',
                quantity: qty,
                unitPrice,
            });
        }

        const order = await Order.create({
            user: userDoc._id,
            items: orderItems,
            totalAmount: Number(totalAmount.toFixed(2)),
            paymentMethod,
            paymentReceived: false,
            paymentReference,
            receiptUrl,
            status: 'Pendiente',
        });

        const purchasedIds = orderItems.map((i) => String(i.product));
        (userDoc as any).cart = [];
        (userDoc as any).wishlist = ((userDoc as any).wishlist || []).filter(
            (wId: any) => !purchasedIds.includes(String(wId))
        );
        await userDoc.save();

        res.status(201).json({
            ok: true,
            message: '¡Pedido registrado! Queda en estado Pendiente para verificación de pago y preparación.',
            data: order,
        });
    } catch (error) {
        for (const d of deducted) {
            await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
        }
        console.error('Error al crear orden manual:', error);
        res.status(500).json({ ok: false, message: 'Error interno al procesar el pedido' });
    }
};

// ==========================================
// PAYPAL SANDBOX: CREAR Y CAPTURAR ORDEN DE TIENDA
// ==========================================
export const createPayPalStoreOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        const userDoc = await User.findById(userId).populate('cart.product');
        const cartItems: any[] = ((userDoc as any)?.cart || []).filter((c: any) => c.product);

        if (!userDoc || cartItems.length === 0) {
            res.status(400).json({ ok: false, message: 'Tu carrito está vacío.' });
            return;
        }

        let totalAmount = 0;
        for (const c of cartItems) {
            if (!c.product.isActive || c.product.stock < c.quantity) {
                res.status(400).json({
                    ok: false,
                    message: `Stock insuficiente para "${c.product.name}".`,
                });
                return;
            }
            totalAmount += Number(c.product.price) * Number(c.quantity);
        }

        const accessToken = await getPayPalAccessToken();
        const ppRes = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        description: 'Compra en ENERGYM Tienda Fit',
                        amount: {
                            currency_code: 'USD',
                            value: totalAmount.toFixed(2),
                        },
                    },
                ],
            }),
        });

        const ppData = await ppRes.json();
        if (!ppRes.ok || !ppData.id) {
            console.error('Respuesta error PayPal create order:', ppData);
            res.status(502).json({ ok: false, message: 'No se pudo iniciar el pago en PayPal.' });
            return;
        }

        const approveLink = Array.isArray(ppData.links)
            ? ppData.links.find((l: { rel?: string; href?: string }) => l.rel === 'approve')?.href
            : undefined;

        res.status(200).json({ ok: true, id: ppData.id, approveUrl: approveLink });
    } catch (error: any) {
        console.error('Error al crear orden PayPal tienda:', error);
        res.status(500).json({ ok: false, message: error?.message || 'Error con PayPal' });
    }
};

export const capturePayPalStoreOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const deducted: { productId: any; quantity: number }[] = [];

    try {
        const userId = req.user?.uid;
        const { paypalOrderId } = req.body;

        if (!paypalOrderId || typeof paypalOrderId !== 'string') {
            res.status(400).json({ ok: false, message: 'Falta el ID de orden de PayPal.' });
            return;
        }

        const accessToken = await getPayPalAccessToken();
        const capRes = await fetch(
            `${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId.trim())}/capture`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const capData = await capRes.json();
        if (!capRes.ok || capData.status !== 'COMPLETED') {
            console.error('PayPal capture no completado:', {
                statusCode: capRes.status,
                capData,
            });
            res.status(400).json({
                ok: false,
                message:
                    capData?.message ||
                    capData?.details?.[0]?.description ||
                    'El pago en PayPal no se completó.',
            });
            return;
        }

        const captureId =
            capData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || paypalOrderId.trim();

        const userDoc = await User.findById(userId).populate('cart.product');
        const cartItems: any[] = ((userDoc as any)?.cart || []).filter((c: any) => c.product);

        if (!userDoc || cartItems.length === 0) {
            res.status(400).json({ ok: false, message: 'No hay productos en el carrito para registrar.' });
            return;
        }

        const orderItems = [];
        let totalAmount = 0;

        for (const c of cartItems) {
            const prod = c.product;
            const qty = Number(c.quantity);

            const updatedProd = await Product.findOneAndUpdate(
                { _id: prod._id, isActive: true, stock: { $gte: qty } },
                { $inc: { stock: -qty } },
                { new: true }
            );

            if (!updatedProd) {
                for (const d of deducted) {
                    await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
                }
                res.status(400).json({
                    ok: false,
                    message: `Stock insuficiente para "${prod.name}" al finalizar el pedido.`,
                });
                return;
            }

            deducted.push({ productId: prod._id, quantity: qty });
            const unitPrice = Number(prod.price);
            totalAmount += unitPrice * qty;

            orderItems.push({
                product: prod._id,
                nameSnapshot: prod.name,
                colorSnapshot: prod.color,
                sizeSnapshot: c.size || 'Única',
                quantity: qty,
                unitPrice,
            });
        }

        const order = await Order.create({
            user: userDoc._id,
            items: orderItems,
            totalAmount: Number(totalAmount.toFixed(2)),
            paymentMethod: 'PayPal',
            paymentReceived: true,
            paypalOrderId: paypalOrderId.trim(),
            paypalTransactionId: captureId,
            status: 'Pendiente',
        });

        const purchasedIds = orderItems.map((i) => String(i.product));
        (userDoc as any).cart = [];
        (userDoc as any).wishlist = ((userDoc as any).wishlist || []).filter(
            (wId: any) => !purchasedIds.includes(String(wId))
        );
        await userDoc.save();

        res.status(201).json({
            ok: true,
            message: '¡Pago con PayPal recibido! Tu pedido está Pendiente de preparación por administración.',
            data: order,
        });
    } catch (error) {
        for (const d of deducted) {
            await Product.findByIdAndUpdate(d.productId, { $inc: { stock: d.quantity } });
        }
        console.error('Error al capturar orden PayPal tienda:', error);
        res.status(500).json({ ok: false, message: 'Error interno al capturar pago PayPal' });
    }
};

// ==========================================
// HISTORIAL Y CANCELACIÓN POR USUARIO
// ==========================================
export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const orders = await Order.find({ user: req.user?.uid })
            .sort({ createdAt: -1 })
            .lean();
        res.status(200).json({ ok: true, data: orders });
    } catch (error) {
        console.error('Error al obtener historial de pedidos:', error);
        res.status(500).json({ ok: false, message: 'Error al cargar tus pedidos' });
    }
};

export const cancelMyOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user?.uid });
        if (!order) {
            res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
            return;
        }

        if (order.status === 'Cancelado' || order.status === 'Rechazado') {
            res.status(400).json({ ok: false, message: `El pedido ya está ${order.status}.` });
            return;
        }

        // Devolver stock al cancelar
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
        }

        order.status = 'Cancelado';
        await order.save();

        res.status(200).json({
            ok: true,
            message: 'Pedido cancelado y stock devuelto al inventario.',
            data: order,
        });
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        res.status(500).json({ ok: false, message: 'Error al cancelar el pedido' });
    }
};

// ==========================================
// ADMIN: GESTIÓN DE ÓRDENES, PAGOS Y MÉTRICAS DE TIENDA
// ==========================================
export const getAllOrdersAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const orders = await Order.find()
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ ok: true, data: orders });
    } catch (error) {
        console.error('Error al obtener órdenes para admin:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener pedidos' });
    }
};

export const updateOrderAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const { id } = req.params;
        const { status, paymentReceived, adminNotes } = req.body as {
            status?: OrderStatus;
            paymentReceived?: boolean;
            adminNotes?: string;
        };

        const order = await Order.findById(id);
        if (!order) {
            res.status(404).json({ ok: false, message: 'Pedido no encontrado' });
            return;
        }

        const prevStatus = order.status;

        if (typeof paymentReceived === 'boolean') {
            order.paymentReceived = paymentReceived;
        }

        if (typeof adminNotes === 'string') {
            order.adminNotes = adminNotes.trim();
        }

        if (status) {
            const validStatuses: OrderStatus[] = ['Pendiente', 'Aprobado', 'Rechazado', 'Cancelado'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({ ok: false, message: 'Estado de pedido inválido' });
                return;
            }

            const stockWasDeducted = prevStatus === 'Pendiente' || prevStatus === 'Aprobado';
            const stockShouldBeReturned = status === 'Rechazado' || status === 'Cancelado';

            if (stockWasDeducted && stockShouldBeReturned) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
                }
            } else if (!stockWasDeducted && !stockShouldBeReturned) {
                // Si se reactiva desde Rechazado/Cancelado, descontar stock atómicamente
                for (const item of order.items) {
                    const okStock = await Product.findOneAndUpdate(
                        { _id: item.product, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } }
                    );
                    if (!okStock) {
                        res.status(400).json({
                            ok: false,
                            message: `No hay stock suficiente para reactivar "${item.nameSnapshot}".`,
                        });
                        return;
                    }
                }
            }

            order.status = status;
        }

        await order.save();

        res.status(200).json({
            ok: true,
            message: 'Pedido actualizado correctamente.',
            data: order,
        });
    } catch (error) {
        console.error('Error al actualizar pedido por admin:', error);
        res.status(500).json({ ok: false, message: 'Error al actualizar el pedido' });
    }
};

export const getStoreStatsAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const [totalOrders, approvedOrders, pendingOrders, revenueAgg, topProductAgg] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: 'Aprobado' }),
            Order.countDocuments({ status: 'Pendiente' }),
            Order.aggregate([
                { $match: { status: 'Aprobado' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            Order.aggregate([
                { $match: { status: 'Aprobado' } },
                { $unwind: '$items' },
                {
                    $group: {
                        _id: '$items.nameSnapshot',
                        unitsSold: { $sum: '$items.quantity' },
                        revenue: {
                            $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] },
                        },
                    },
                },
                { $sort: { unitsSold: -1 } },
                { $limit: 1 },
            ]),
        ]);

        const storeRevenue = revenueAgg.length > 0 ? Number(revenueAgg[0].total || 0) : 0;
        const bestSeller =
            topProductAgg.length > 0
                ? {
                      name: String(topProductAgg[0]._id),
                      unitsSold: Number(topProductAgg[0].unitsSold || 0),
                      revenue: Number(topProductAgg[0].revenue || 0),
                  }
                : null;

        res.status(200).json({
            ok: true,
            data: {
                storeRevenue,
                totalOrders,
                approvedOrders,
                pendingOrders,
                bestSeller,
            },
        });
    } catch (error) {
        console.error('Error al obtener métricas de tienda:', error);
        res.status(500).json({ ok: false, message: 'Error al obtener métricas de la tienda' });
    }
};