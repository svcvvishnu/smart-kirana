import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/subscription-plans - Fetch all subscription plans
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const plans = await prisma.subscriptionPlan.findMany({
            include: {
                _count: {
                    select: {
                        subscriptions: true,
                    },
                },
            },
            orderBy: {
                price: "asc",
            },
        });

        return NextResponse.json(plans);
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return NextResponse.json(
            { error: "Failed to fetch subscription plans" },
            { status: 500 }
        );
    }
}

// POST /api/admin/subscription-plans - Create new subscription plan
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
            name,
            tier,
            price,
            maxProducts,
            maxUsers,
            hasAnalytics,
            hasReports,
            hasExports,
            hasCustomerInsights,
        } = body;

        if (!name || !tier || price === undefined) {
            return NextResponse.json(
                { error: "Name, tier, and price are required" },
                { status: 400 }
            );
        }

        // Check if tier already exists
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { tier },
        });

        if (existingPlan) {
            return NextResponse.json(
                { error: "A plan with this tier already exists" },
                { status: 400 }
            );
        }

        const plan = await prisma.subscriptionPlan.create({
            data: {
                name,
                tier,
                price,
                features: {},
                maxProducts: maxProducts || null,
                maxUsers: maxUsers || null,
                hasAnalytics: hasAnalytics || false,
                hasReports: hasReports || false,
                hasExports: hasExports || false,
                hasCustomerInsights: hasCustomerInsights || false,
            },
        });

        return NextResponse.json(plan, { status: 201 });
    } catch (error) {
        console.error("Error creating subscription plan:", error);
        return NextResponse.json(
            { error: "Failed to create subscription plan" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/subscription-plans - Update subscription plan
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

        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Plan ID is required" },
                { status: 400 }
            );
        }

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: updates,
        });

        return NextResponse.json(plan);
    } catch (error) {
        console.error("Error updating subscription plan:", error);
        return NextResponse.json(
            { error: "Failed to update subscription plan" },
            { status: 500 }
        );
    }
}
