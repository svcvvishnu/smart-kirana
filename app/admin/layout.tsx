import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import { 
    LayoutDashboard, 
    Store, 
    CreditCard,
    Settings,
} from "lucide-react";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only ADMIN can access admin panel
    if (session.user.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-900">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-800 border-r border-slate-700">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    <p className="text-sm text-slate-400 mt-1">Smart Kirana</p>
                </div>
                
                <nav className="px-4 space-y-1">
                    <NavLink href="/admin" icon={<LayoutDashboard className="h-5 w-5" />}>
                        Dashboard
                    </NavLink>
                    <NavLink href="/admin/sellers" icon={<Store className="h-5 w-5" />}>
                        Sellers
                    </NavLink>
                    <NavLink href="/admin/subscriptions" icon={<CreditCard className="h-5 w-5" />}>
                        Subscriptions
                    </NavLink>
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-white">{session.user.name}</p>
                            <p className="text-xs text-slate-400">Administrator</p>
                        </div>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-64 min-h-screen">
                {children}
            </main>
        </div>
    );
}

function NavLink({
    href,
    icon,
    children,
}: {
    href: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
        >
            {icon}
            {children}
        </Link>
    );
}
