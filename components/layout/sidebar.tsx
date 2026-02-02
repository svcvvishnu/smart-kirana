"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/LogoutButton";
import {
    ChevronLeft,
    ChevronRight,
    ShoppingBag,
} from "lucide-react";
import {
    NavSection,
    UserRole,
    getNavItemsForRole,
    getRoleDisplayName,
    getRoleBrandColor,
} from "./nav-items";

interface SidebarProps {
    user: {
        name: string;
        email?: string;
        role: UserRole;
    };
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const navSections = getNavItemsForRole(user.role);
    const roleDisplayName = getRoleDisplayName(user.role);
    const brandColor = getRoleBrandColor(user.role);

    // Handle responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };

        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const isActive = (href: string) => {
        if (href === "/dashboard" || href === "/admin" || href === "/support") {
            return pathname === href;
        }
        return pathname === href || pathname.startsWith(href + "/");
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-200 ease-in-out flex flex-col",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className={cn(
                "flex items-center border-b border-gray-200 h-16 px-4",
                collapsed ? "justify-center" : "justify-between"
            )}>
                <Link href={user.role === "ADMIN" ? "/admin" : user.role === "SUPPORT" ? "/support" : "/dashboard"} className="flex items-center gap-3">
                    <div className={cn("flex items-center justify-center rounded-lg h-9 w-9", brandColor)}>
                        <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 text-sm">Smart Kirana</span>
                            <span className="text-xs text-gray-500">{roleDisplayName}</span>
                        </div>
                    )}
                </Link>
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                            collapsed && "absolute -right-3 top-6 bg-white border border-gray-200 shadow-sm rounded-full"
                        )}
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navSections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className={cn(sectionIndex > 0 && "mt-6")}>
                        {section.title && !collapsed && (
                            <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {section.title}
                            </h3>
                        )}
                        {collapsed && section.title && sectionIndex > 0 && (
                            <div className="mx-auto w-8 h-px bg-gray-200 mb-3" />
                        )}
                        <ul className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                                                active
                                                    ? "bg-indigo-50 text-indigo-700"
                                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                                                collapsed && "justify-center px-2"
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <Icon className={cn(
                                                "flex-shrink-0",
                                                active ? "text-indigo-600" : "text-gray-400",
                                                collapsed ? "h-5 w-5" : "h-5 w-5"
                                            )} />
                                            {!collapsed && <span>{item.label}</span>}
                                            {!collapsed && item.badge && (
                                                <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* User Section */}
            <div className={cn(
                "border-t border-gray-200 p-3",
                collapsed && "flex flex-col items-center"
            )}>
                {collapsed ? (
                    <div className="flex flex-col items-center gap-2">
                        <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium", brandColor)}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <LogoutButton />
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0", brandColor)}>
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user.name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {roleDisplayName}
                                </p>
                            </div>
                        </div>
                        <LogoutButton />
                    </div>
                )}
            </div>
        </aside>
    );
}

export function SidebarSpacer({ collapsed = false }: { collapsed?: boolean }) {
    return (
        <div className={cn(
            "flex-shrink-0 transition-all duration-200",
            collapsed ? "w-16" : "w-64",
            "lg:block hidden"
        )} />
    );
}
