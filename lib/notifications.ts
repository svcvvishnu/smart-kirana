import { prisma } from "./db";

// Notification types
export type NotificationType = "LOW_STOCK" | "OUT_OF_STOCK" | "DAILY_SUMMARY";

interface CreateNotificationInput {
    sellerId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: object;
}

// Create a new notification
export async function createNotification(input: CreateNotificationInput) {
    return prisma.notification.create({
        data: {
            sellerId: input.sellerId,
            type: input.type,
            title: input.title,
            message: input.message,
            metadata: input.metadata as object | undefined,
        },
    });
}

// Create low stock notification
export async function createLowStockNotification(
    sellerId: string,
    productId: string,
    productName: string,
    currentStock: number,
    minStockLevel: number
) {
    // Check if a similar notification was created recently (within 24 hours)
    const existingNotification = await prisma.notification.findFirst({
        where: {
            sellerId,
            type: "LOW_STOCK",
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
            metadata: {
                path: ["productId"],
                equals: productId,
            },
        },
    });

    if (existingNotification) {
        return existingNotification;
    }

    return createNotification({
        sellerId,
        type: "LOW_STOCK",
        title: `Low Stock Alert: ${productName}`,
        message: `${productName} has only ${currentStock} units left. Minimum level is ${minStockLevel}.`,
        metadata: { productId, productName, currentStock, minStockLevel },
    });
}

// Create out of stock notification
export async function createOutOfStockNotification(
    sellerId: string,
    productId: string,
    productName: string
) {
    // Check if a similar notification was created recently
    const existingNotification = await prisma.notification.findFirst({
        where: {
            sellerId,
            type: "OUT_OF_STOCK",
            createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
            metadata: {
                path: ["productId"],
                equals: productId,
            },
        },
    });

    if (existingNotification) {
        return existingNotification;
    }

    return createNotification({
        sellerId,
        type: "OUT_OF_STOCK",
        title: `Out of Stock: ${productName}`,
        message: `${productName} is out of stock. Please restock soon.`,
        metadata: { productId, productName },
    });
}

// Create daily sales summary notification
export async function createDailySummaryNotification(
    sellerId: string,
    totalSales: number,
    totalProfit: number,
    orderCount: number,
    date: Date
) {
    const dateStr = date.toISOString().split("T")[0];
    
    // Check if summary already exists for today
    const existingSummary = await prisma.notification.findFirst({
        where: {
            sellerId,
            type: "DAILY_SUMMARY",
            createdAt: {
                gte: new Date(dateStr),
            },
        },
    });

    if (existingSummary) {
        return existingSummary;
    }

    return createNotification({
        sellerId,
        type: "DAILY_SUMMARY",
        title: "Daily Sales Summary",
        message: `Today's sales: ₹${totalSales.toFixed(2)} | Profit: ₹${totalProfit.toFixed(2)} | Orders: ${orderCount}`,
        metadata: { totalSales, totalProfit, orderCount, date: dateStr },
    });
}

// Check products for low stock and create notifications
export async function checkAndCreateStockAlerts(sellerId: string) {
    const products = await prisma.product.findMany({
        where: {
            sellerId,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            currentStock: true,
            minStockLevel: true,
        },
    });

    const notifications = [];

    for (const product of products) {
        if (product.currentStock === 0) {
            const notification = await createOutOfStockNotification(
                sellerId,
                product.id,
                product.name
            );
            notifications.push(notification);
        } else if (product.currentStock < product.minStockLevel) {
            const notification = await createLowStockNotification(
                sellerId,
                product.id,
                product.name,
                product.currentStock,
                product.minStockLevel
            );
            notifications.push(notification);
        }
    }

    return notifications;
}

// Get unread notification count
export async function getUnreadNotificationCount(sellerId: string) {
    return prisma.notification.count({
        where: {
            sellerId,
            isRead: false,
        },
    });
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds: string[], sellerId: string) {
    return prisma.notification.updateMany({
        where: {
            id: { in: notificationIds },
            sellerId,
        },
        data: {
            isRead: true,
        },
    });
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(sellerId: string) {
    return prisma.notification.updateMany({
        where: {
            sellerId,
            isRead: false,
        },
        data: {
            isRead: true,
        },
    });
}
