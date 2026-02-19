import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// PATCH /api/categories/[id] - Rename a category
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

        const category = await prisma.category.findFirst({
            where: { id, sellerId: session.user.sellerId },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
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

        const { name } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check for duplicate name for this seller
        const duplicate = await prisma.category.findFirst({
            where: {
                sellerId: session.user.sellerId,
                name: { equals: name.trim(), mode: "insensitive" },
                id: { not: id },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { error: "A category with this name already exists" },
                { status: 400 }
            );
        }

        const updated = await prisma.category.update({
            where: { id },
            data: { name: name.trim() },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json(
            { error: "Failed to update category" },
            { status: 500 }
        );
    }
}

// DELETE /api/categories/[id] - Delete a category
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

        const category = await prisma.category.findFirst({
            where: { id, sellerId: session.user.sellerId },
            include: { _count: { select: { products: true } } },
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        if (category._count.products > 0) {
            return NextResponse.json(
                { error: `Cannot delete category. ${category._count.products} product(s) are assigned to it. Reassign them first.` },
                { status: 400 }
            );
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json(
            { error: "Failed to delete category" },
            { status: 500 }
        );
    }
}
