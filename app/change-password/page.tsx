"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function ChangePasswordPage() {
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError("New password must be at least 8 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (currentPassword === newPassword) {
            setError("New password must be different from current password");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Failed to change password");
                return;
            }

            setSuccess(true);
            // Sign out so the user logs in with the new password and gets a fresh session
            setTimeout(async () => {
                await signOut({ callbackUrl: "/login" });
            }, 2000);
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4">
            <Card className="w-full max-w-md shadow-2xl border-0">
                <CardHeader className="space-y-4 text-center pb-8">
                    <div className="mx-auto bg-gradient-to-br from-indigo-600 to-cyan-600 p-3 rounded-2xl w-fit">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            Change Your Password
                        </CardTitle>
                        <CardDescription className="text-base mt-2">
                            Please set a new secure password for your account
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center py-4">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                                <Lock className="h-6 w-6 text-green-600" />
                            </div>
                            <p className="text-green-600 font-medium">Password changed successfully!</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Redirecting to login...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="h-11"
                                />
                            </div>
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                                    {error}
                                </div>
                            )}
                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700"
                                disabled={loading}
                            >
                                {loading ? "Changing Password..." : "Change Password"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
