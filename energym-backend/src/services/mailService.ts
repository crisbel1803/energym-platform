import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpHost = process.env.SMTP_HOST || 'smtp.mailtrap.io';
const smtpPort = Number(process.env.SMTP_PORT) || 587;

console.log(`📨 Configurando SMTP con host: ${smtpHost} (puerto ${smtpPort})`);

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    }
});

export const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<void> => {
    try {
        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@energym.com';

        await transporter.sendMail({
            from: `"Energym Fitness ERP 🏋️‍♀️" <${senderEmail}>`,
            to,
            subject,
            html: htmlContent
        });
        console.log(`📧 Correo enviado exitosamente a: ${to}`);
    } catch (error) {
        console.error('❌ Error al enviar el correo:', error);
    }
};