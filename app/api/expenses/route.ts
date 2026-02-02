import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/expenses - Fetch all expenses
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only OWNER can view expenses
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get("category");
        const startDateStr = searchParams.get("startDate");
        const endDateStr = searchParams.get("endDate");
        const limitParam = searchParams.get("limit");
        
        const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 50)) : 50;

        // Build filters
        const filters: any = {
            sellerId: session.user.sellerId,
        };

        if (category) {
            filters.category = category;
        }

        if (startDateStr || endDateStr) {
            filters.date = {};
            if (startDateStr) {
                filters.date.gte = new Date(startDateStr);
            }
            if (endDateStr) {
                const endDate = new Date(endDateStr);
                endDate.setHours(23, 59, 59, 999);
                filters.date.lte = endDate;
            }
        }

        const expenses = await prisma.expense.findMany({
            where: filters,
            orderBy: {
                date: "desc",
            },
            take: limit,
        });

        // Get summary
        const summary = await prisma.expense.aggregate({
            where: filters,
            _sum: {
                amount: true,
            },
            _count: true,
        });

        return NextResponse.json({
            expenses,
            summary: {
                total: summary._sum.amount || 0,
                count: summary._count,
            },
        });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        return NextResponse.json(
            { error: "Failed to fetch expenses" },
            { status: 500 }
        );
    }
}

// POST /api/expenses - Create new expense
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Only OWNER can create expenses
        if (session.user.role !== "OWNER") {
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

        const { category, amount, description, date } = body;

        // Validate required fields
        if (!category || typeof category !== "string") {
            return NextResponse.json(
                { error: "Category is required" },
                { status: 400 }
            );
        }

        const validCategories = ["PURCHASE", "RENT", "UTILITIES", "SALARY", "TRANSPORT", "MAINTENANCE", "OTHER"];
        if (!validCategories.includes(category)) {
            return NextResponse.json(
                { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
                { status: 400 }
            );
        }

        if (typeof amount !== "number" || amount <= 0) {
            return NextResponse.json(
                { error: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.create({
            data: {
                sellerId: session.user.sellerId,
                category,
                amount,
                description: description || null,
                date: date ? new Date(date) : new Date(),
            },
        });

        return NextResponse.json(expense, { status: 201 });
    } catch (error) {
        console.error("Error creating expense:", error);
        return NextResponse.json(
            { error: "Failed to create expense" },
            { status: 500 }
        );
    }
}
