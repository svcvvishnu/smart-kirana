import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./analytics-client";

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

    return <AnalyticsClient />;
}
