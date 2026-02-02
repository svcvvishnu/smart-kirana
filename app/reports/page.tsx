import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ReportsClient } from "./reports-client";
import { AppShell } from "@/components/layout";

export default async function ReportsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only OWNER can view reports
    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" }}>
            <ReportsClient />
        </AppShell>
    );
}
