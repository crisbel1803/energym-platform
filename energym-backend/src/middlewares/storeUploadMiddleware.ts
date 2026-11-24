import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ensureDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const productStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), 'uploads', 'products');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
    },
});

const receiptStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), 'uploads', 'receipts');
        ensureDir(dir);
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `receipt-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, uniqueName);
    },
});

const imageFileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WEBP'));
    }
};

export const uploadProductImage = multer({
    storage: productStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadReceiptImage = multer({
    storage: receiptStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});