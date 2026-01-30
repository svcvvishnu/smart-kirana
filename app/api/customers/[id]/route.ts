import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// GET /api/customers/[id] - Fetch customer with purchase history
export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const customer = await prisma.customer.findFirst({
            where: {
                id: params.id,
                sellerId: session.user.sellerId,
            },
            include: {
                sales: {
                    include: {
                        items: {
                            include: {
                                product: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error fetching customer:", error);
        return NextResponse.json(
            { error: "Failed to fetch customer" },
            { status: 500 }
        );
    }
}

// PATCH /api/customers/[id] - Update customer
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role
        if (session.user.role !== "OWNER" && session.user.role !== "OPERATIONS") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, phone, email } = body;

        // Verify customer belongs to seller
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                id: params.id,
                sellerId: session.user.sellerId,
            },
        });

        if (!existingCustomer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // If phone is being changed, check for duplicates
        if (phone && phone !== existingCustomer.phone) {
            const duplicatePhone = await prisma.customer.findFirst({
                where: {
                    sellerId: session.user.sellerId,
                    phone: phone,
                    id: { not: params.id },
                },
            });

            if (duplicatePhone) {
                return NextResponse.json(
                    { error: "A customer with this phone number already exists" },
                    { status: 409 }
                );
            }
        }

        // Update customer
        const customer = await prisma.customer.update({
            where: { id: params.id },
            data: {
                ...(name && { name }),
                ...(phone && { phone }),
                ...(email !== undefined && { email: email || null }),
            },
        });

        return NextResponse.json(customer);
    } catch (error) {
        console.error("Error updating customer:", error);
        return NextResponse.json(
            { error: "Failed to update customer" },
            { status: 500 }
        );
    }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check role
        if (session.user.role !== "OWNER") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Verify customer belongs to seller
        const customer = await prisma.customer.findFirst({
            where: {
                id: params.id,
                sellerId: session.user.sellerId,
            },
            include: {
                _count: {
                    select: {
                        sales: true,
                    },
                },
            },
        });

        if (!customer) {
            return NextResponse.json(
                { error: "Customer not found" },
                { status: 404 }
            );
        }

        // Prevent deletion if customer has sales
        if (customer._count.sales > 0) {
            return NextResponse.json(
                {
                    error:
                        "Cannot delete customer with existing sales. Consider archiving instead.",
                },
                { status: 400 }
            );
        }

        // Delete customer
        await prisma.customer.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting customer:", error);
        return NextResponse.json(
            { error: "Failed to delete customer" },
            { status: 500 }
        );
    }
}
