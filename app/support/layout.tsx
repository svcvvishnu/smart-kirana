import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";

export default async function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Only SUPPORT can access support panel
    if (session.user.role !== "SUPPORT") {
        redirect("/dashboard");
    }

    return (
        <AppShell user={{ name: session.user.name || "Support", role: "SUPPORT" }}>
            {children}
        </AppShell>
    );
}
