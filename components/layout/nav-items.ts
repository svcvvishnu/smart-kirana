import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Users,
    History,
    BarChart3,
    FileText,
    Receipt,
    Bell,
    Store,
    CreditCard,
    Headphones,
    LucideIcon,
} from "lucide-react";

export interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    badge?: string;
}

export interface NavSection {
    title?: string;
    items: NavItem[];
}

// Owner navigation - full access to seller features
export const ownerNavItems: NavSection[] = [
    {
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Sales",
        items: [
            { href: "/billing", label: "New Bill", icon: ShoppingCart },
            { href: "/sales", label: "Sales History", icon: History },
        ],
    },
    {
        title: "Inventory",
        items: [
            { href: "/products", label: "Products", icon: Package },
            { href: "/inventory", label: "Stock Management", icon: Warehouse },
        ],
    },
    {
        title: "Business",
        items: [
            { href: "/customers", label: "Customers", icon: Users },
            { href: "/expenses", label: "Expenses", icon: Receipt },
        ],
    },
    {
        title: "Insights",
        items: [
            { href: "/analytics", label: "Analytics", icon: BarChart3 },
            { href: "/reports", label: "Reports", icon: FileText },
            { href: "/notifications", label: "Notifications", icon: Bell },
        ],
    },
];

// Operations/Cashier navigation - limited access
export const operationsNavItems: NavSection[] = [
    {
        items: [
            { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Sales",
        items: [
            { href: "/billing", label: "New Bill", icon: ShoppingCart },
            { href: "/sales", label: "Sales History", icon: History },
        ],
    },
];

// Admin navigation - platform management
export const adminNavItems: NavSection[] = [
    {
        items: [
            { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Management",
        items: [
            { href: "/admin/sellers", label: "Sellers", icon: Store },
            { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
        ],
    },
];

// Support navigation - read-only access
export const supportNavItems: NavSection[] = [
    {
        items: [
            { href: "/support", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        title: "Support Tools",
        items: [
            { href: "/support/sellers", label: "View Sellers", icon: Store },
        ],
    },
];

export type UserRole = "OWNER" | "OPERATIONS" | "ADMIN" | "SUPPORT";

export function getNavItemsForRole(role: UserRole): NavSection[] {
    switch (role) {
        case "ADMIN":
            return adminNavItems;
        case "SUPPORT":
            return supportNavItems;
        case "OPERATIONS":
            return operationsNavItems;
        case "OWNER":
        default:
            return ownerNavItems;
    }
}

export function getRoleDisplayName(role: UserRole): string {
    switch (role) {
        case "ADMIN":
            return "Administrator";
        case "SUPPORT":
            return "Support Agent";
        case "OPERATIONS":
            return "Cashier";
        case "OWNER":
        default:
            return "Shop Owner";
    }
}

export function getRoleBrandColor(role: UserRole): string {
    switch (role) {
        case "ADMIN":
            return "bg-purple-600";
        case "SUPPORT":
            return "bg-cyan-600";
        case "OPERATIONS":
            return "bg-emerald-600";
        case "OWNER":
        default:
            return "bg-indigo-600";
    }
}
