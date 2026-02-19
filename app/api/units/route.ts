import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/units - Fetch system defaults + seller's custom units
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const units = await prisma.unit.findMany({
            where: {
                OR: [
                    { sellerId: null },
                    { sellerId: session.user.sellerId },
                ],
            },
            include: {
                _count: { select: { products: true } },
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error("Error fetching units:", error);
        return NextResponse.json(
            { error: "Failed to fetch units" },
            { status: 500 }
        );
    }
}

// POST /api/units - Create a custom unit for the seller
export async function POST(request: Request) {
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

        const { name, abbreviation } = body;

        if (!name || !abbreviation) {
            return NextResponse.json(
                { error: "Name and abbreviation are required" },
                { status: 400 }
            );
        }

        // Check for duplicate among system units or this seller's units
        const existing = await prisma.unit.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                OR: [
                    { sellerId: null },
                    { sellerId: session.user.sellerId },
                ],
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "A unit with this name already exists" },
                { status: 400 }
            );
        }

        const unit = await prisma.unit.create({
            data: {
                name,
                abbreviation,
                sellerId: session.user.sellerId,
            },
        });

        return NextResponse.json(unit, { status: 201 });
    } catch (error) {
        console.error("Error creating unit:", error);
        return NextResponse.json(
            { error: "Failed to create unit" },
            { status: 500 }
        );
    }
}
