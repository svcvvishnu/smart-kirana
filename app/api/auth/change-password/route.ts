import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// POST /api/auth/change-password - Change user's password
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Current password and new password are required" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "New password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json(
                { error: "Current password is incorrect" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                password: hashedPassword,
                mustChangePassword: false,
            },
        });

        return NextResponse.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json(
            { error: "Failed to change password" },
            { status: 500 }
        );
    }
}
