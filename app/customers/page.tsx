import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Check if user is OWNER
    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    // Fetch customers with stats
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

    // Calculate stats
    const customersWithStats = await Promise.all(
        customers.map(async (customer) => {
            const totalPurchases = await prisma.sale.aggregate({
                where: {
                    customerId: customer.id,
                },
                _sum: {
                    total: true,
                },
            });

            return {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                email: customer.email,
                totalSpent: totalPurchases._sum.total || 0,
                purchaseCount: customer._count.sales,
                lastPurchase: customer.sales[0]?.createdAt || null,
            };
        })
    );

    return <CustomersClient initialCustomers={customersWithStats} />;
}
