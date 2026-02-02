import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/admin/sellers/[id] - Fetch single seller
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const seller = await prisma.seller.findUnique({
            where: { id },
            include: {
                subscription: {
                    include: {
                        plan: true,
                    },
                },
                users: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        products: true,
                        sales: true,
                        customers: true,
                    },
                },
            },
        });

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // Get sales summary
        const salesSummary = await prisma.sale.aggregate({
            where: { sellerId: id },
            _sum: { total: true, profit: true },
            _count: true,
        });

        return NextResponse.json({
            ...seller,
            salesSummary: {
                totalSales: salesSummary._sum.total || 0,
                totalProfit: salesSummary._sum.profit || 0,
                orderCount: salesSummary._count,
            },
        });
    } catch (error) {
        console.error("Error fetching seller:", error);
        return NextResponse.json(
            { error: "Failed to fetch seller" },
            { status: 500 }
        );
    }
}

// PATCH /api/admin/sellers/[id] - Update seller
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existing = await prisma.seller.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
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
            address,
            isActive,
        } = body;

        const seller = await prisma.seller.update({
            where: { id },
            data: {
                ...(shopName && { shopName }),
                ...(businessType && { businessType }),
                ...(ownerName && { ownerName }),
                ...(phone && { phone }),
                ...(address !== undefined && { address }),
                ...(isActive !== undefined && { isActive }),
            },
        });

        return NextResponse.json(seller);
    } catch (error) {
        console.error("Error updating seller:", error);
        return NextResponse.json(
            { error: "Failed to update seller" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/sellers/[id] - Delete seller (soft delete by deactivating)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const existing = await prisma.seller.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        // Soft delete by deactivating
        await prisma.seller.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting seller:", error);
        return NextResponse.json(
            { error: "Failed to delete seller" },
            { status: 500 }
        );
    }
}
