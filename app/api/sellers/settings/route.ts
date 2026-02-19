import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/sellers/settings - Get current seller's settings
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const seller = await prisma.seller.findUnique({
            where: { id: session.user.sellerId },
            select: {
                id: true,
                shopName: true,
                defaultPricingMode: true,
                defaultMarkupPercentage: true,
            },
        });

        if (!seller) {
            return NextResponse.json({ error: "Seller not found" }, { status: 404 });
        }

        return NextResponse.json(seller);
    } catch (error) {
        console.error("Error fetching seller settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// PATCH /api/sellers/settings - Update seller's pricing defaults
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

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

        const { defaultPricingMode, defaultMarkupPercentage } = body;

        if (defaultPricingMode && !["FIXED", "MARKUP"].includes(defaultPricingMode)) {
            return NextResponse.json(
                { error: "Invalid pricing mode. Must be FIXED or MARKUP." },
                { status: 400 }
            );
        }

        if (defaultMarkupPercentage !== undefined && defaultMarkupPercentage < 0) {
            return NextResponse.json(
                { error: "Markup percentage cannot be negative." },
                { status: 400 }
            );
        }

        const updated = await prisma.seller.update({
            where: { id: session.user.sellerId },
            data: {
                ...(defaultPricingMode && { defaultPricingMode }),
                ...(defaultMarkupPercentage !== undefined && { defaultMarkupPercentage }),
            },
            select: {
                id: true,
                defaultPricingMode: true,
                defaultMarkupPercentage: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating seller settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
