import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const userRole = req.auth?.user?.role

    // Public routes
    const publicRoutes = ["/login"]
    const isPublicRoute = publicRoutes.includes(nextUrl.pathname)

    // Allow public routes
    if (isPublicRoute) {
        if (isLoggedIn) {
            // Redirect logged-in users to their dashboard
            return NextResponse.redirect(new URL(getDashboardForRole(userRole), nextUrl))
        }
        return NextResponse.next()
    }

    // Require authentication for all other routes
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/login", nextUrl))
    }

    // Role-based access control
    const path = nextUrl.pathname

    // Operations role restrictions
    if (userRole === "OPERATIONS") {
        const allowedPaths = ["/dashboard", "/billing"]
        if (!allowedPaths.some((p) => path.startsWith(p))) {
            return NextResponse.redirect(new URL("/dashboard", nextUrl))
        }
    }

    // Owner role can access most paths except admin
    if (userRole === "OWNER") {
        if (path.startsWith("/admin")) {
            return NextResponse.redirect(new URL("/dashboard", nextUrl))
        }
    }

    // Support role restrictions
    if (userRole === "SUPPORT") {
        const allowedPaths = ["/support"]
        if (!allowedPaths.some((p) => path.startsWith(p))) {
            return NextResponse.redirect(new URL("/support", nextUrl))
        }
    }

    // Admin can access everything

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
