import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

export const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<void> => {
    try {
        await transporter.sendMail({
            from: '"Energym Fitness ERP 🏋️‍♀️" <no-reply@energym.com>',
            to,
            subject,
            html: htmlContent
        });
        console.log(`📧 Correo enviado exitosamente a: ${to}`);
    } catch (error) {
        console.error('❌ Error al enviar el correo:', error);
        // No lanzamos error crítico para evitar que se caiga la petición HTTP principal si el correo falla
    }
};