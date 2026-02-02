import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { 
    checkAndCreateStockAlerts, 
    markAllNotificationsAsRead 
} from "@/lib/notifications";

// GET /api/notifications - Fetch notifications
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limitParam = searchParams.get("limit");
        const unreadOnly = searchParams.get("unreadOnly") === "true";
        const checkStock = searchParams.get("checkStock") === "true";
        
        const limit = limitParam ? Math.max(1, Math.min(100, parseInt(limitParam, 10) || 20)) : 20;

        // Optionally check for stock alerts
        if (checkStock) {
            await checkAndCreateStockAlerts(session.user.sellerId);
        }

        const notifications = await prisma.notification.findMany({
            where: {
                sellerId: session.user.sellerId,
                ...(unreadOnly && { isRead: false }),
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                sellerId: session.user.sellerId,
                isRead: false,
            },
        });

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST /api/notifications - Mark notifications as read
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

        const { action, notificationIds } = body;

        if (action === "markAllRead") {
            await markAllNotificationsAsRead(session.user.sellerId);
            return NextResponse.json({ success: true });
        }

        if (action === "markRead" && Array.isArray(notificationIds)) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    sellerId: session.user.sellerId,
                },
                data: {
                    isRead: true,
                },
            });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("Error updating notifications:", error);
        return NextResponse.json(
            { error: "Failed to update notifications" },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications - Delete old notifications
export async function DELETE(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.sellerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const daysOld = parseInt(searchParams.get("daysOld") || "30", 10);

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const result = await prisma.notification.deleteMany({
            where: {
                sellerId: session.user.sellerId,
                createdAt: { lt: cutoffDate },
                isRead: true,
            },
        });

        return NextResponse.json({ 
            success: true, 
            deletedCount: result.count 
        });
    } catch (error) {
        console.error("Error deleting notifications:", error);
        return NextResponse.json(
            { error: "Failed to delete notifications" },
            { status: 500 }
        );
    }
}
