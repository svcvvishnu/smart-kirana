import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendWelcomeEmail } from "@/lib/email";

// GET /api/admin/sellers - Fetch all sellers
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only ADMIN can access
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const search = searchParams.get("search");
        const isActive = searchParams.get("isActive");

        const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 50)) : 50;

        const filters: any = {};
        
        if (search) {
            filters.OR = [
                { shopName: { contains: search, mode: "insensitive" } },
                { ownerName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (isActive !== null && isActive !== undefined) {
            filters.isActive = isActive === "true";
        }

        const sellers = await prisma.seller.findMany({
            where: filters,
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                _count: {
                    select: {
                        users: true,
                        products: true,
                        sales: true,
                        customers: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        return NextResponse.json(sellers);
    } catch (error) {
        console.error("Error fetching sellers:", error);
        return NextResponse.json(
            { error: "Failed to fetch sellers" },
            { status: 500 }
        );
    }
}

// POST /api/admin/sellers - Create new seller (onboarding)
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

        const {
            shopName,
            businessType,
            ownerName,
            phone,
            email,
            address,
            ownerEmail,
            subscriptionPlanId,
        } = body;

        // Validate required fields
        if (!shopName || !businessType || !ownerName || !phone || !email) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!ownerEmail) {
            return NextResponse.json(
                { error: "Owner email is required" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingSeller = await prisma.seller.findUnique({
            where: { email },
        });

        if (existingSeller) {
            return NextResponse.json(
                { error: "A seller with this email already exists" },
                { status: 400 }
            );
        }

        // Check if owner email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: ownerEmail },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "A user with this email already exists" },
                { status: 400 }
            );
        }

        // Generate a secure temporary password
        const temporaryPassword = crypto.randomBytes(4).toString("hex") + "A1!";
        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Create seller, owner user, and subscription in a transaction
        const result = await prisma.$transaction(async (tx) => {
            const seller = await tx.seller.create({
                data: {
                    shopName,
                    businessType,
                    ownerName,
                    phone,
                    email,
                    address: address || null,
                    isActive: true,
                },
            });

            const user = await tx.user.create({
                data: {
                    email: ownerEmail,
                    password: hashedPassword,
                    name: ownerName,
                    role: "OWNER",
                    sellerId: seller.id,
                    mustChangePassword: true,
                },
            });

            if (subscriptionPlanId) {
                await tx.subscription.create({
                    data: {
                        sellerId: seller.id,
                        planId: subscriptionPlanId,
                        isActive: true,
                    },
                });
            } else {
                const freePlan = await tx.subscriptionPlan.findFirst({
                    where: { tier: "FREE" },
                });

                if (freePlan) {
                    await tx.subscription.create({
                        data: {
                            sellerId: seller.id,
                            planId: freePlan.id,
                            isActive: true,
                        },
                    });
                }
            }

            return { seller, user };
        });

        // Send welcome email (non-blocking, don't fail the request if email fails)
        sendWelcomeEmail({
            to: ownerEmail,
            ownerName,
            shopName,
            loginEmail: ownerEmail,
            temporaryPassword,
        }).catch((err) => console.error("Welcome email failed:", err));

        return NextResponse.json(result.seller, { status: 201 });
    } catch (error) {
        console.error("Error creating seller:", error);
        return NextResponse.json(
            { error: "Failed to create seller" },
            { status: 500 }
        );
    }
}
