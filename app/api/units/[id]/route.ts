import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// PATCH /api/units/[id] - Update a custom unit
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

        const unit = await prisma.unit.findUnique({ where: { id } });

        if (!unit) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        if (unit.sellerId === null) {
            return NextResponse.json(
                { error: "Cannot edit system default units" },
                { status: 403 }
            );
        }

        if (unit.sellerId !== session.user.sellerId) {
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

        const { name, abbreviation } = body;

        const updated = await prisma.unit.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(abbreviation && { abbreviation }),
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating unit:", error);
        return NextResponse.json(
            { error: "Failed to update unit" },
            { status: 500 }
        );
    }
}

// DELETE /api/units/[id] - Delete a custom unit
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

        const unit = await prisma.unit.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } },
        });

        if (!unit) {
            return NextResponse.json({ error: "Unit not found" }, { status: 404 });
        }

        if (unit.sellerId === null) {
            return NextResponse.json(
                { error: "Cannot delete system default units" },
                { status: 403 }
            );
        }

        if (unit.sellerId !== session.user.sellerId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        if (unit._count.products > 0) {
            return NextResponse.json(
                { error: `Cannot delete unit. ${unit._count.products} product(s) are using it.` },
                { status: 400 }
            );
        }

        await prisma.unit.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting unit:", error);
        return NextResponse.json(
            { error: "Failed to delete unit" },
            { status: 500 }
        );
    }
}
