import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";

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
        <AppShell user={{ name: session.user.name || "Admin", role: "ADMIN" }}>
            {children}
        </AppShell>
    );
}
