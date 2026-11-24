import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { Product } from '../models/Product';

const parseSizes = (rawSizes: unknown): string[] => {
    if (Array.isArray(rawSizes)) {
        const cleaned = rawSizes.map((s) => String(s).trim()).filter(Boolean);
        return cleaned.length > 0 ? cleaned : ['Única'];
    }
    if (typeof rawSizes === 'string') {
        const trimmed = rawSizes.trim();
        if (!trimmed) return ['Única'];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                const cleaned = parsed.map((s) => String(s).trim()).filter(Boolean);
                return cleaned.length > 0 ? cleaned : ['Única'];
            }
        } catch {
            const split = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
            return split.length > 0 ? split : ['Única'];
        }
    }
    return ['Única'];
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const includeInactive = req.query.all === 'true';
        const filter = includeInactive ? {} : { isActive: true };
        const products = await Product.find(filter).sort({ createdAt: -1 }).lean();
        res.status(200).json({ ok: true, data: products });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ ok: false, message: 'Error al cargar el catálogo de la tienda' });
    }
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const { name, description, category, price, stock, sizes, color, isActive } = req.body;
        const parsedPrice = Number(price);
        const parsedStock = Number(stock ?? 0);

        if (!name || !description || !category || !color || Number.isNaN(parsedPrice) || parsedPrice <= 0) {
            res.status(400).json({
                ok: false,
                message: 'Nombre, descripción, categoría, color y precio válido (> 0) son obligatorios.',
            });
            return;
        }

        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
            res.status(400).json({
                ok: false,
                message: 'El stock debe ser un número entero mayor o igual a 0.',
            });
            return;
        }

        const photoUrl = req.file ? `/uploads/products/${req.file.filename}` : '';

        const created = await Product.create({
            name: String(name).trim(),
            description: String(description).trim(),
            category: String(category).trim(),
            color: String(color).trim(),
            price: parsedPrice,
            stock: parsedStock,
            sizes: parseSizes(sizes),
            photoUrl,
            isActive: isActive !== undefined ? String(isActive) === 'true' : true,
        });

        res.status(201).json({
            ok: true,
            message: 'Producto creado en el catálogo de la Tienda Fit.',
            data: created,
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ ok: false, message: 'Error interno al crear producto' });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            res.status(404).json({ ok: false, message: 'Producto no encontrado' });
            return;
        }

        const { name, description, category, price, stock, sizes, color, isActive } = req.body;

        if (name !== undefined && String(name).trim()) product.name = String(name).trim();
        if (description !== undefined && String(description).trim()) {
            product.description = String(description).trim();
        }
        if (category !== undefined && String(category).trim()) {
            product.category = String(category).trim();
        }
        if (color !== undefined && String(color).trim()) product.color = String(color).trim();

        if (price !== undefined) {
            const parsedPrice = Number(price);
            if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
                res.status(400).json({ ok: false, message: 'Precio inválido' });
                return;
            }
            product.price = parsedPrice;
        }

        if (stock !== undefined) {
            const parsedStock = Number(stock);
            if (!Number.isInteger(parsedStock) || parsedStock < 0) {
                res.status(400).json({ ok: false, message: 'Stock inválido' });
                return;
            }
            product.stock = parsedStock;
        }

        if (sizes !== undefined) {
            product.sizes = parseSizes(sizes);
        }

        if (isActive !== undefined) {
            product.isActive = typeof isActive === 'boolean' ? isActive : String(isActive) === 'true';
        }

        if (req.file) {
            product.photoUrl = `/uploads/products/${req.file.filename}`;
        }

        await product.save();

        res.status(200).json({
            ok: true,
            message: 'Producto actualizado correctamente.',
            data: product,
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ ok: false, message: 'Error interno al actualizar producto' });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ ok: false, message: 'Acceso denegado. Se requiere rol ADMIN.' });
            return;
        }

        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) {
            res.status(404).json({ ok: false, message: 'Producto no encontrado' });
            return;
        }

        res.status(200).json({ ok: true, message: 'Producto eliminado del catálogo.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ ok: false, message: 'Error interno al eliminar producto' });
    }
};