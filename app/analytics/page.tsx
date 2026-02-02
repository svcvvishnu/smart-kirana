import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";
import { AppShell } from "@/components/layout";

export default async function AnalyticsPage() {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only OWNER can view analytics
    if (session.user.role !== "OWNER") {
        redirect("/dashboard");
    }

    if (!session.user.sellerId) {
        redirect("/dashboard");
    }

    return (
        <AppShell user={{ name: session.user.name || "User", role: session.user.role as "OWNER" }}>
            <AnalyticsClient />
        </AppShell>
    );
}
