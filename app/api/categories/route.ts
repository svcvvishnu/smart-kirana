import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const categories = await prisma.category.findMany({
            where: {
                sellerId: session.user.sellerId,
            },
            include: {
                _count: {
                    select: {
                        products: {
                            where: {
                                isActive: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                name: "asc",
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name } = body;

        if (!name || name.trim() === "") {
            return NextResponse.json(
                { error: "Category name is required" },
                { status: 400 }
            );
        }

        // Check if category already exists for this seller
        const existingCategory = await prisma.category.findUnique({
            where: {
                sellerId_name: {
                    sellerId: session.user.sellerId,
                    name: name.trim(),
                },
            },
        });

        if (existingCategory) {
            return NextResponse.json(
                { error: "Category already exists" },
                { status: 409 }
            );
        }

        const category = await prisma.category.create({
            data: {
                name: name.trim(),
                sellerId: session.user.sellerId,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json(
            { error: "Failed to create category" },
            { status: 500 }
        );
    }
}
