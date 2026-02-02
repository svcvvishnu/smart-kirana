import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/expenses/[id] - Fetch single expense
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const expense = await prisma.expense.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
        });

        if (!expense) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error fetching expense:", error);
        return NextResponse.json(
            { error: "Failed to fetch expense" },
            { status: 500 }
        );
    }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify expense belongs to seller
        const existing = await prisma.expense.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
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

        // Validate category if provided
        if (category) {
            const validCategories = ["PURCHASE", "RENT", "UTILITIES", "SALARY", "TRANSPORT", "MAINTENANCE", "OTHER"];
            if (!validCategories.includes(category)) {
                return NextResponse.json(
                    { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
                    { status: 400 }
                );
            }
        }

        // Validate amount if provided
        if (amount !== undefined && (typeof amount !== "number" || amount <= 0)) {
            return NextResponse.json(
                { error: "Amount must be a positive number" },
                { status: 400 }
            );
        }

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                ...(category && { category }),
                ...(amount !== undefined && { amount }),
                ...(description !== undefined && { description }),
                ...(date && { date: new Date(date) }),
            },
        });

        return NextResponse.json(expense);
    } catch (error) {
        console.error("Error updating expense:", error);
        return NextResponse.json(
            { error: "Failed to update expense" },
            { status: 500 }
        );
    }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify expense belongs to seller
        const existing = await prisma.expense.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: "Expense not found" }, { status: 404 });
        }

        await prisma.expense.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting expense:", error);
        return NextResponse.json(
            { error: "Failed to delete expense" },
            { status: 500 }
        );
    }
}
