import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

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

        const product = await prisma.product.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
                isActive: true,
            },
            include: {
                category: true,
                unit: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

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

        const body = await request.json();

        // Verify product belongs to seller
        const existingProduct = await prisma.product.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Calculate selling price if markup mode
        let finalSellingPrice = body.sellingPrice !== undefined ? parseFloat(body.sellingPrice) : undefined;
        if (body.pricingMode === "MARKUP" && body.markupPercentage != null && body.purchasePrice !== undefined) {
            finalSellingPrice = parseFloat(body.purchasePrice) * (1 + parseFloat(body.markupPercentage) / 100);
        }

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: body.name,
                categoryId: body.categoryId,
                purchasePrice: body.purchasePrice !== undefined ? parseFloat(body.purchasePrice) : undefined,
                sellingPrice: finalSellingPrice,
                pricingMode: body.pricingMode,
                markupPercentage: body.markupPercentage !== undefined ? (body.markupPercentage != null ? parseFloat(body.markupPercentage) : null) : undefined,
                unitId: body.unitId !== undefined ? (body.unitId || null) : undefined,
                minStockLevel: body.minStockLevel !== undefined ? parseInt(body.minStockLevel) : undefined,
                description: body.description,
            },
            include: {
                category: true,
                unit: true,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}

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

        // Verify product belongs to seller
        const existingProduct = await prisma.product.findFirst({
            where: {
                id,
                sellerId: session.user.sellerId,
            },
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Soft delete
        await prisma.product.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Failed to delete product" },
            { status: 500 }
        );
    }
}
