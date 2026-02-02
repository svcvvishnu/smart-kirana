"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Bell,
    Home,
    Package,
    AlertTriangle,
    TrendingUp,
    CheckCheck,
    Trash2,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
    metadata: any;
}

interface NotificationsClientProps {
    initialNotifications: Notification[];
    initialUnreadCount: number;
}

export function NotificationsClient({
    initialNotifications,
    initialUnreadCount,
}: NotificationsClientProps) {
    const router = useRouter();
    const [notifications, setNotifications] = useState(initialNotifications);
    const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [loading, setLoading] = useState(false);

    const handleMarkAllRead = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markAllRead" }),
            });

            if (res.ok) {
                setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOld = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/notifications?daysOld=30", {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            }
        } catch (error) {
            console.error("Failed to delete old notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markRead", notificationIds: [id] }),
            });

            if (res.ok) {
                setNotifications(
                    notifications.map((n) =>
                        n.id === id ? { ...n, isRead: true } : n
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "LOW_STOCK":
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
            case "OUT_OF_STOCK":
                return <Package className="h-5 w-5 text-red-600" />;
            case "DAILY_SUMMARY":
                return <TrendingUp className="h-5 w-5 text-green-600" />;
            default:
                return <Bell className="h-5 w-5 text-blue-600" />;
        }
    };

    const getBackgroundColor = (type: string, isRead: boolean) => {
        if (isRead) return "bg-white border-gray-200";
        switch (type) {
            case "LOW_STOCK":
                return "bg-yellow-50 border-yellow-200";
            case "OUT_OF_STOCK":
                return "bg-red-50 border-red-200";
            case "DAILY_SUMMARY":
                return "bg-green-50 border-green-200";
            default:
                return "bg-blue-50 border-blue-200";
        }
    };

    const filteredNotifications = filter === "unread"
        ? notifications.filter((n) => !n.isRead)
        : notifications;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            {/* Header */}
            <div className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:bg-white/20"
                                >
                                    <Home className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold flex items-center gap-2">
                                    <Bell className="h-8 w-8" />
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="ml-2 px-2 py-1 text-sm bg-white/20 rounded-full">
                                            {unreadCount} unread
                                        </span>
                                    )}
                                </h1>
                                <p className="text-blue-100 mt-1">
                                    Alerts and important updates
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {unreadCount > 0 && (
                                <Button
                                    variant="secondary"
                                    onClick={handleMarkAllRead}
                                    disabled={loading}
                                >
                                    <CheckCheck className="h-4 w-4 mr-2" />
                                    Mark All Read
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={handleDeleteOld}
                                disabled={loading}
                                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear Old
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <Button
                        variant={filter === "all" ? "default" : "outline"}
                        onClick={() => setFilter("all")}
                    >
                        All ({notifications.length})
                    </Button>
                    <Button
                        variant={filter === "unread" ? "default" : "outline"}
                        onClick={() => setFilter("unread")}
                    >
                        Unread ({unreadCount})
                    </Button>
                </div>

                {/* Notifications List */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {filter === "unread" ? "Unread Notifications" : "All Notifications"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredNotifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    {filter === "unread"
                                        ? "No unread notifications"
                                        : "No notifications yet"}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${getBackgroundColor(
                                            notification.type,
                                            notification.isRead
                                        )}`}
                                        onClick={() => {
                                            if (!notification.isRead) {
                                                handleMarkRead(notification.id);
                                            }
                                        }}
                                    >
                                        <div className="flex-shrink-0 p-2 rounded-lg bg-white shadow-sm">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                                                    {notification.title}
                                                </p>
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0 h-2 w-2 rounded-full bg-blue-500 mt-2" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>
                                                    {formatDistanceToNow(new Date(notification.createdAt), {
                                                        addSuffix: true,
                                                    })}
                                                </span>
                                                <span>
                                                    {format(new Date(notification.createdAt), "MMM dd, yyyy HH:mm")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
