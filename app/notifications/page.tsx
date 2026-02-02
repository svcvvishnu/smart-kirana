import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { NotificationsClient } from "./notifications-client";
import { checkAndCreateStockAlerts } from "@/lib/notifications";

export default async function NotificationsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    const sellerId = session.user.sellerId;
    if (!sellerId) {
        redirect("/dashboard");
    }

    // Check for stock alerts on page load
    await checkAndCreateStockAlerts(sellerId);

    // Fetch notifications
    const notifications = await prisma.notification.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    const unreadCount = await prisma.notification.count({
        where: { sellerId, isRead: false },
    });

    return (
        <NotificationsClient
            initialNotifications={notifications}
            initialUnreadCount={unreadCount}
        />
    );
}
