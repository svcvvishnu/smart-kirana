import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/sales/[id] - Fetch single sale with details
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
                    },
                },
            },
        });

        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 });
        }

        return NextResponse.json(sale);
    } catch (error) {
        console.error("Error fetching sale:", error);
        return NextResponse.json(
            { error: "Failed to fetch sale" },
            { status: 500 }
        );
    }
}
