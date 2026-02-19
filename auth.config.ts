import type { NextAuthConfig } from "next-auth"

// This file is Edge-compatible (no Prisma, no bcrypt)
export const authConfig = {
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnLoginPage = nextUrl.pathname === "/login"

            if (isOnLoginPage) {
                if (isLoggedIn) return false // Redirect to dashboard
                return true // Allow access to login page
            }

            return isLoggedIn // Protect all other routes
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.sellerId = user.sellerId
                token.mustChangePassword = (user as any).mustChangePassword ?? false
            }
            return token
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as "OPERATIONS" | "OWNER" | "SUPPORT" | "ADMIN"
                session.user.sellerId = token.sellerId as string | null
                ;(session.user as any).mustChangePassword = token.mustChangePassword ?? false
            }
            return session
        },
    },
    providers: [], // Providers added in auth.ts
} satisfies NextAuthConfig
