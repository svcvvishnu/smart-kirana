import { DefaultSession } from "next-auth"

type UserRole = "OPERATIONS" | "OWNER" | "SUPPORT" | "ADMIN"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: UserRole
            sellerId: string | null
        } & DefaultSession["user"]
    }

    interface User {
        role: UserRole
        sellerId: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        sellerId: string | null
    }
}
