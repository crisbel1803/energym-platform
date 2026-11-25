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

const wrapInEmailTemplate = (badgeText: string, bodyHtml: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif; color: #1f2937;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 28px 12px;">
            <tr>
                <td align="center">
                    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);">
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #111827; padding: 24px 28px; text-align: center; border-bottom: 3px solid #00c24f;">
                                <div style="color: #ffffff; font-size: 22px; font-weight: bold; letter-spacing: 1px;">
                                    ENERGYM FITNESS CLUB 🏋️‍♀️
                                </div>
                                <div style="margin-top: 8px; display: inline-block; background-color: rgba(0, 194, 79, 0.15); color: #00c24f; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 999px;">
                                    ${badgeText}
                                </div>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 28px; font-size: 15px; line-height: 1.6; color: #374151;">
                                ${bodyHtml}
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f9fafb; padding: 18px 28px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
                                <p style="margin: 0 0 4px;">Mensaje automático de <strong>Energym Fitness ERP</strong>.</p>
                                <p style="margin: 0;">Si tienes dudas, contacta a nuestro equipo de soporte o administración.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

export const sendEmail = async (to: string, subject: string, htmlContent: string): Promise<void> => {
    try {
        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@energym.com';

        await transporter.sendMail({
            from: `"Energym Fitness ERP 🏋️‍♀️" <${senderEmail}>`,
            to,
            subject,
            html: wrapInEmailTemplate(subject, htmlContent)
        });
        console.log(`📧 Correo enviado exitosamente a: ${to}`);
    } catch (error) {
        console.error('❌ Error al enviar el correo:', error);
    }
};