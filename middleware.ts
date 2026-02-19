import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role
    const mustChangePassword = (req.auth?.user as any)?.mustChangePassword

    // Public routes
    const publicRoutes = ["/login"]
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)

    if (isPublicRoute) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL(getDashboardForRole(userRole), nextUrl))
        }
        return NextResponse.next()
    }

    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl))
    }

    // Force password change redirect
    if (mustChangePassword && nextUrl.pathname !== "/change-password") {
        return NextResponse.redirect(new URL("/change-password", nextUrl))
    }

    const path = nextUrl.pathname

    // Operations role restrictions
    if (userRole === "OPERATIONS") {
        const allowedPaths = ["/dashboard", "/billing", "/sales", "/change-password"]
        if (!allowedPaths.some((p) => path.startsWith(p))) {
            return NextResponse.redirect(new URL("/dashboard", nextUrl))
        }
    }

    // Owner role can access most paths except admin and support panels
    if (userRole === "OWNER") {
        if (path.startsWith("/admin") || path.startsWith("/support")) {
            return NextResponse.redirect(new URL("/dashboard", nextUrl))
        }
    }

    // Support role restrictions
    if (userRole === "SUPPORT") {
        const allowedPaths = ["/support", "/change-password"]
        if (!allowedPaths.some((p) => path.startsWith(p))) {
            return NextResponse.redirect(new URL("/support", nextUrl))
        }
    }

    return NextResponse.next()
})

function getDashboardForRole(role?: string) {
    switch (role) {
        case "OPERATIONS":
            return "/dashboard"
        case "OWNER":
            return "/dashboard"
        case "SUPPORT":
            return "/support"
        case "ADMIN":
            return "/admin"
        default:
            return "/login"
    }
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
