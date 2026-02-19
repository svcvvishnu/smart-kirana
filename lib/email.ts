import { Resend } from "resend";

let resend: Resend | null = null;

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resend) {
        resend = new Resend(process.env.RESEND_API_KEY);
    }
    return resend;
}

const fromEmail = () => process.env.RESEND_FROM_EMAIL || "noreply@smartkirana.com";

export async function sendWelcomeEmail({
    to,
    ownerName,
    shopName,
    loginEmail,
    temporaryPassword,
}: {
    to: string;
    ownerName: string;
    shopName: string;
    loginEmail: string;
    temporaryPassword: string;
}) {
    const client = getResendClient();
    if (!client) {
        console.warn("Email service not configured. Skipping welcome email.");
        return { success: false, reason: "not_configured" };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smartkirana.com";

    const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Welcome to Smart Kirana</title></head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #4f46e5; margin: 0;">Welcome to Smart Kirana!</h1>
                <p style="color: #666; margin: 10px 0;">Your shop management platform</p>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px 0;">Hi <strong>${ownerName}</strong>,</p>
                <p style="margin: 0 0 12px 0;">
                    Your shop <strong>${shopName}</strong> has been successfully registered on Smart Kirana.
                    Here are your login credentials:
                </p>

                <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 16px; margin: 16px 0;">
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">Login Email</p>
                    <p style="margin: 0 0 16px 0; font-weight: bold; font-size: 16px;">${loginEmail}</p>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 13px;">Temporary Password</p>
                    <p style="margin: 0; font-weight: bold; font-size: 16px; font-family: monospace;">${temporaryPassword}</p>
                </div>

                <p style="margin: 16px 0 0 0; color: #dc2626; font-size: 14px;">
                    <strong>Important:</strong> You will be asked to change your password on your first login.
                </p>
            </div>

            <div style="text-align: center;">
                <a href="${appUrl}/login" style="display: inline-block; background: linear-gradient(to right, #4f46e5, #0891b2); color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: bold;">
                    Login to Smart Kirana
                </a>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
                <p>This is an automated email from Smart Kirana. Please do not reply.</p>
            </div>
        </body>
        </html>
    `;

    try {
        await client.emails.send({
            from: fromEmail(),
            to,
            subject: `Welcome to Smart Kirana - Your login credentials for ${shopName}`,
            html,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        return { success: false, reason: "send_failed" };
    }
}

export { getResendClient, fromEmail };
