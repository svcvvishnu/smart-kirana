"use client";

import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { UserRole } from "./nav-items";
import { cn } from "@/lib/utils";

interface AppShellProps {
    children: ReactNode;
    user: {
        name: string;
        email?: string;
        role: UserRole;
    };
    className?: string;
}

export function AppShell({ children, user, className }: AppShellProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar user={user} />
            
            {/* Main Content */}
            <main className={cn(
                "lg:ml-64 min-h-screen transition-all duration-200",
                "ml-16", // Always account for collapsed sidebar on mobile
                className
            )}>
                {children}
            </main>
        </div>
    );
}

// Server component wrapper that can be used in page.tsx files
export function AppShellContainer({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn("p-6", className)}>
            {children}
        </div>
    );
}
