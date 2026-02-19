import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

type UserRole = "OPERATIONS" | "OWNER" | "SUPPORT" | "ADMIN"

export const { handlers, signIn, signOut, auth } = NextAuth({
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                }) as any

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    sellerId: user.sellerId,
                    mustChangePassword: user.mustChangePassword ?? false,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role as UserRole
                token.sellerId = user.sellerId as string | null
                token.mustChangePassword = (user.mustChangePassword as boolean) ?? false
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
                session.user.sellerId = token.sellerId as string | null
                session.user.mustChangePassword = Boolean(token.mustChangePassword)
            }
            return session
        },
    },
})
