import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create Admin
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@smartkirana.com" },
        update: {},
        create: {
            email: "admin@smartkirana.com",
            password: adminPassword,
            name: "Admin User",
            role: "ADMIN",
        },
    });
    console.log("✅ Created admin user");

    // Create Support User
    const supportPassword = await bcrypt.hash("support123", 10);
    const support = await prisma.user.upsert({
        where: { email: "support@smartkirana.com" },
        update: {},
        create: {
            email: "support@smartkirana.com",
            password: supportPassword,
            name: "Support User",
            role: "SUPPORT",
        },
    });
    console.log("✅ Created support user");

    // Create Subscription Plans
    const freePlan = await prisma.subscriptionPlan.upsert({
        where: { tier: "FREE" },
        update: {},
        create: {
            name: "Free Plan",
            tier: "FREE",
            price: 0,
            features: {},
            maxProducts: 50,
            maxUsers: 2,
            hasAnalytics: false,
            hasReports: false,
            hasExports: false,
            hasCustomerInsights: false,
        },
    });

    const proPlan = await prisma.subscriptionPlan.upsert({
        where: { tier: "PRO" },
        update: {},
        create: {
            name: "Pro Plan",
            tier: "PRO",
            price: 499,
            features: {},
            hasAnalytics: true,
            hasReports: true,
            hasExports: true,
            hasCustomerInsights: true,
        },
    });
    console.log("✅ Created subscription plans");

    // Create default system units (sellerId = null means system-wide)
    const defaultUnits = [
        { name: "Piece", abbreviation: "pc" },
        { name: "Kg", abbreviation: "kg" },
        { name: "Gram", abbreviation: "g" },
        { name: "Liter", abbreviation: "L" },
        { name: "Milliliter", abbreviation: "ml" },
        { name: "Box", abbreviation: "box" },
        { name: "Pack", abbreviation: "pack" },
        { name: "Dozen", abbreviation: "dz" },
    ];
    for (const unit of defaultUnits) {
        const existing = await prisma.unit.findFirst({
            where: { name: unit.name, sellerId: null },
        });
        if (!existing) {
            await prisma.unit.create({
                data: { name: unit.name, abbreviation: unit.abbreviation, sellerId: null },
            });
        }
    }
    console.log("✅ Created default system units");

    // Create a demo seller
    const seller = await prisma.seller.create({
        data: {
            shopName: "Demo General Store",
            businessType: "GENERAL_STORE",
            ownerName: "Raj Kumar",
            phone: "+91 98765 43210",
            email: "raj@demostore.com",
            address: "123 Main Street, Mumbai, India",
        },
    });
    console.log("✅ Created demo seller");

    // Create subscription for seller
    await prisma.subscription.create({
        data: {
            sellerId: seller.id,
            planId: proPlan.id,
            isActive: true,
        },
    });
    console.log("✅ Assigned subscription to seller");

    // Create users for the seller
    const ownerPassword = await bcrypt.hash("password123", 10);
    const owner = await prisma.user.create({
        data: {
            email: "owner@test.com",
            password: ownerPassword,
            name: "Raj Kumar",
            role: "OWNER",
            sellerId: seller.id,
        },
    });

    const operationsPassword = await bcrypt.hash("password123", 10);
    const operations = await prisma.user.create({
        data: {
            email: "cashier@test.com",
            password: operationsPassword,
            name: "Cashier User",
            role: "OPERATIONS",
            sellerId: seller.id,
        },
    });
    console.log("✅ Created owner and operations users");

    // Create categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: "Groceries",
                sellerId: seller.id,
            },
        }),
        prisma.category.create({
            data: {
                name: "Beverages",
                sellerId: seller.id,
            },
        }),
        prisma.category.create({
            data: {
                name: "Snacks",
                sellerId: seller.id,
            },
        }),
    ]);
    console.log("✅ Created product categories");

    // Create products
    const products = await Promise.all([
        prisma.product.create({
            data: {
                name: "Rice - 1kg",
                categoryId: categories[0].id,
                sellerId: seller.id,
                purchasePrice: 40,
                sellingPrice: 50,
                currentStock: 100,
                minStockLevel: 10,
            },
        }),
        prisma.product.create({
            data: {
                name: "Wheat Flour - 1kg",
                categoryId: categories[0].id,
                sellerId: seller.id,
                purchasePrice: 35,
                sellingPrice: 45,
                currentStock: 8, // Low stock
                minStockLevel: 10,
            },
        }),
        prisma.product.create({
            data: {
                name: "Coca Cola - 500ml",
                categoryId: categories[1].id,
                sellerId: seller.id,
                purchasePrice: 20,
                sellingPrice: 30,
                currentStock: 50,
                minStockLevel: 15,
            },
        }),
        prisma.product.create({
            data: {
                name: "Lays Chips - 50g",
                categoryId: categories[2].id,
                sellerId: seller.id,
                purchasePrice: 10,
                sellingPrice: 20,
                currentStock: 75,
                minStockLevel: 20,
            },
        }),
    ]);
    console.log("✅ Created demo products");

    // Create sample customers
    const customers = await Promise.all([
        prisma.customer.create({
            data: {
                name: "Amit Sharma",
                phone: "+91 99999 11111",
                email: "amit@example.com",
                sellerId: seller.id,
            },
        }),
        prisma.customer.create({
            data: {
                name: "Priya Singh",
                phone: "+91 99999 22222",
                sellerId: seller.id,
            },
        }),
    ]);
    console.log("✅ Created demo customers");

    // Create sample sales
    const sale = await prisma.sale.create({
        data: {
            saleNumber: "INV-20260128-001",
            sellerId: seller.id,
            customerId: customers[0].id,
            subtotal: 100,
            discountType: "PERCENTAGE",
            discountValue: 10,
            discountAmount: 10,
            total: 90,
            profit: 30,
            createdBy: owner.id,
            items: {
                create: [
                    {
                        productId: products[0].id,
                        quantity: 2,
                        purchasePrice: 40,
                        sellingPrice: 50,
                        subtotal: 100,
                        profit: 20,
                    },
                ],
            },
        },
    });
    console.log("✅ Created sample sale");

    console.log("\n🎉 Database seeded successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("━".repeat(50));
    console.log("SELLER USERS (Shop: Demo General Store):");
    console.log("  Owner Account:");
    console.log("    Email: owner@test.com");
    console.log("    Password: password123");
    console.log("  Operations/Cashier Account:");
    console.log("    Email: cashier@test.com");
    console.log("    Password: password123");
    console.log("\nPLATFORM USERS:");
    console.log("  Admin Account:");
    console.log("    Email: admin@smartkirana.com");
    console.log("    Password: admin123");
    console.log("  Support Account:");
    console.log("    Email: support@smartkirana.com");
    console.log("    Password: support123");
    console.log("━".repeat(50));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
