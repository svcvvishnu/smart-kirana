import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

// Lazy-loaded Resend client to avoid build-time errors
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

// POST /api/sales/[id]/share - Share invoice via email
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get sale with details
        const sale = await prisma.sale.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
            include: {
                customer: true,
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                seller: {
                    select: {
                        shopName: true,
                        address: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        });

        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { type, email } = body;

        if (type === "email") {
            if (!email || typeof email !== "string" || !email.includes("@")) {
                return NextResponse.json(
                    { error: "Valid email address is required" },
                    { status: 400 }
                );
            }

            // Check if Resend API key is configured
            const resendClient = getResendClient();
            if (!resendClient) {
                return NextResponse.json(
                    { error: "Email service not configured" },
                    { status: 500 }
                );
            }

            // Format currency helper
            const formatCurrency = (amount: number) =>
                new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                }).format(amount);

            // Build email content
            const itemRows = sale.items
                .map(
                    (item) =>
                        `<tr>
                            <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.product.name}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.sellingPrice)}</td>
                            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.subtotal)}</td>
                        </tr>`
                )
                .join("");

            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Invoice ${sale.saleNumber}</title>
                </head>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #333; margin: 0;">${sale.seller.shopName}</h1>
                        ${sale.seller.address ? `<p style="color: #666; margin: 5px 0;">${sale.seller.address}</p>` : ""}
                        ${sale.seller.phone ? `<p style="color: #666; margin: 5px 0;">Phone: ${sale.seller.phone}</p>` : ""}
                    </div>

                    <div style="border-top: 2px solid #333; padding-top: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
                            <div>
                                <p style="margin: 0; color: #666;">Invoice Number</p>
                                <p style="margin: 0; font-weight: bold; font-size: 18px;">${sale.saleNumber}</p>
                            </div>
                            <div style="text-align: right;">
                                <p style="margin: 0; color: #666;">Date</p>
                                <p style="margin: 0; font-weight: bold;">${new Date(sale.createdAt).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                })}</p>
                            </div>
                        </div>

                        ${sale.customer ? `
                            <div style="margin-bottom: 20px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
                                <p style="margin: 0; color: #666; font-size: 12px;">Bill To:</p>
                                <p style="margin: 5px 0 0 0; font-weight: bold;">${sale.customer.name}</p>
                                <p style="margin: 0; color: #666;">${sale.customer.phone}</p>
                            </div>
                        ` : ""}

                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                            <thead>
                                <tr style="background: #f5f5f5;">
                                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                                    <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                                    <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemRows}
                            </tbody>
                        </table>

                        <div style="text-align: right; margin-top: 20px;">
                            <p style="margin: 5px 0;">Subtotal: <strong>${formatCurrency(sale.subtotal)}</strong></p>
                            ${sale.discountAmount > 0 ? `<p style="margin: 5px 0; color: #22c55e;">Discount: <strong>-${formatCurrency(sale.discountAmount)}</strong></p>` : ""}
                            <p style="margin: 10px 0; font-size: 20px; border-top: 2px solid #333; padding-top: 10px;">
                                Total: <strong>${formatCurrency(sale.total)}</strong>
                            </p>
                        </div>
                    </div>

                    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
                        <p>Thank you for your business!</p>
                    </div>
                </body>
                </html>
            `;

            try {
                await resendClient.emails.send({
                    from: process.env.RESEND_FROM_EMAIL || "noreply@smartkirana.com",
                    to: email,
                    subject: `Invoice ${sale.saleNumber} from ${sale.seller.shopName}`,
                    html: emailHtml,
                });

                return NextResponse.json({ success: true, message: "Email sent successfully" });
            } catch (emailError) {
                console.error("Failed to send email:", emailError);
                return NextResponse.json(
                    { error: "Failed to send email" },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json(
            { error: "Invalid share type" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error sharing invoice:", error);
        return NextResponse.json(
            { error: "Failed to share invoice" },
            { status: 500 }
        );
    }
}
