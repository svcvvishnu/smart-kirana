import { DefaultSession } from "next-auth"

type UserRole = "OPERATIONS" | "OWNER" | "SUPPORT" | "ADMIN"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            sellerId: string | null
            mustChangePassword: boolean
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        sellerId: string | null
        mustChangePassword: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        sellerId: string | null
        mustChangePassword: boolean
    }
}
