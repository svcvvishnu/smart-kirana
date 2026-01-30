import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/customers - Fetch all customers for a seller
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customers = await prisma.customer.findMany({
            where: {
                sellerId: session.user.sellerId,
            },
            include: {
                _count: {
                    select: {
                        sales: true,
                    },
                },
                sales: {
                    select: {
                        total: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Calculate totals for each customer
        const customersWithStats = await Promise.all(
            customers.map(async (customer: typeof customers[number]) => {
                const totalPurchases = await prisma.sale.aggregate({
                    where: {
                        customerId: customer.id,
                    },
                    _sum: {
                        total: true,
                    },
                });

                return {
                    ...customer,
                    totalSpent: totalPurchases._sum.total || 0,
                    lastPurchase: customer.sales[0]?.createdAt || null,
                    purchaseCount: customer._count.sales,
                };
            })
        );

        return NextResponse.json(customersWithStats);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json(
            { error: "Failed to fetch customers" },
            { status: 500 }
        );
    }
}

// POST /api/customers - Create a new customer
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role - OWNER only
        if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, phone, email } = body;

        // Validate required fields
        if (!name || !phone) {
            return NextResponse.json(
                { error: "Name and phone are required" },
                { status: 400 }
            );
        }

        // Check for duplicate phone
        const existingCustomer = await prisma.customer.findUnique({
            where: {
                sellerId_phone: {
                    sellerId: session.user.sellerId,
                    phone: phone,
                },
            },
        });

        if (existingCustomer) {
            return NextResponse.json(
                { error: "A customer with this phone number already exists" },
                { status: 409 }
            );
        }

        // Create customer
        const customer = await prisma.customer.create({
            data: {
                name,
                phone,
                email: email || null,
                sellerId: session.user.sellerId,
            },
        });

        return NextResponse.json(customer, { status: 201 });
    } catch (error) {
        console.error("Error creating customer:", error);
        return NextResponse.json(
            { error: "Failed to create customer" },
            { status: 500 }
        );
    }
}
