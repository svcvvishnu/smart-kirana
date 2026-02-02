import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/subscriptions - Fetch all subscriptions
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const subscriptions = await prisma.subscription.findMany({
            include: {
                seller: {
                    select: {
                        id: true,
                        shopName: true,
                        ownerName: true,
                        email: true,
                        isActive: true,
                    },
                },
                plan: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(subscriptions);
    } catch (error) {
        console.error("Error fetching subscriptions:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscriptions" },
            { status: 500 }
        );
    }
}

// POST /api/admin/subscriptions - Assign subscription to seller
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

        const { sellerId, planId } = body;

        if (!sellerId || !planId) {
            return NextResponse.json(
                { error: "Seller ID and Plan ID are required" },
                { status: 400 }
            );
        }

        // Check if seller exists
        const seller = await prisma.seller.findUnique({
            where: { id: sellerId },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "Seller not found" },
                { status: 404 }
            );
        }

        // Check if plan exists
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: planId },
        });

        if (!plan) {
            return NextResponse.json(
                { error: "Plan not found" },
                { status: 404 }
            );
        }

        // Upsert subscription (update if exists, create if not)
        const subscription = await prisma.subscription.upsert({
            where: { sellerId },
            update: {
                planId,
                isActive: true,
            },
            create: {
                sellerId,
                planId,
                isActive: true,
            },
            include: {
                seller: true,
                plan: true,
            },
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error assigning subscription:", error);
        return NextResponse.json(
            { error: "Failed to assign subscription" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/subscriptions - Update subscription
export async function PATCH(request: Request) {
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

        const { subscriptionId, planId, isActive } = body;

        if (!subscriptionId) {
            return NextResponse.json(
                { error: "Subscription ID is required" },
                { status: 400 }
            );
        }

        const subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                ...(planId && { planId }),
                ...(isActive !== undefined && { isActive }),
            },
            include: {
                seller: true,
                plan: true,
            },
        });

        return NextResponse.json(subscription);
    } catch (error) {
        console.error("Error updating subscription:", error);
        return NextResponse.json(
            { error: "Failed to update subscription" },
            { status: 500 }
        );
    }
}
