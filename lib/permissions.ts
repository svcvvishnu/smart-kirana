import { Prisma } from '@prisma/client'

type UserRole = Prisma.UserRole
type SubscriptionTier = Prisma.SubscriptionTier

export interface FeaturePermissions {
    canViewAnalytics: boolean
    canExportReports: boolean
    canViewCustomerInsights: boolean
    canManageProducts: boolean
    canAdjustStock: boolean
    canCreateBills: boolean
    canViewProfits: boolean
    canManageUsers: boolean
}

// Role-based permissions
export function getRolePermissions(role: UserRole): FeaturePermissions {
    switch (role) {
        case 'OPERATIONS':
            return {
                canViewAnalytics: false,
                canExportReports: false,
                canViewCustomerInsights: false,
                canManageProducts: false,
                canAdjustStock: false,
                canCreateBills: true,
                canViewProfits: false,
                canManageUsers: false,
            }
        case 'OWNER':
            return {
                canViewAnalytics: true, // But gated by subscription
                canExportReports: true, // But gated by subscription
                canViewCustomerInsights: true, // But gated by subscription
                canManageProducts: true,
                canAdjustStock: true,
                canCreateBills: true,
                canViewProfits: true,
                canManageUsers: true,
            }
        case 'SUPPORT':
            return {
                canViewAnalytics: false,
                canExportReports: false,
                canViewCustomerInsights: false,
                canManageProducts: false,
                canAdjustStock: false,
                canCreateBills: false,
                canViewProfits: false,
                canManageUsers: false,
            }
        case 'ADMIN':
            return {
                canViewAnalytics: true,
                canExportReports: true,
                canViewCustomerInsights: true,
                canManageProducts: true,
                canAdjustStock: true,
                canCreateBills: true,
                canViewProfits: true,
                canManageUsers: true,
            }
        default:
            return {
                canViewAnalytics: false,
                canExportReports: false,
                canViewCustomerInsights: false,
                canManageProducts: false,
                canAdjustStock: false,
                canCreateBills: false,
                canViewProfits: false,
                canManageUsers: false,
            }
    }
}

// Subscription-based feature access
export function getSubscriptionFeatures(tier: SubscriptionTier) {
    switch (tier) {
        case 'FREE':
            return {
                hasAnalytics: false,
                hasReports: false,
                hasExports: false,
                hasCustomerInsights: false,
                maxProducts: 50,
                maxUsers: 2,
            }
        case 'BASIC':
            return {
                hasAnalytics: true,
                hasReports: false,
                hasExports: false,
                hasCustomerInsights: false,
                maxProducts: 200,
                maxUsers: 5,
            }
        case 'PRO':
            return {
                hasAnalytics: true,
                hasReports: true,
                hasExports: true,
                hasCustomerInsights: true,
                maxProducts: null, // Unlimited
                maxUsers: 10,
            }
        case 'ENTERPRISE':
            return {
                hasAnalytics: true,
                hasReports: true,
                hasExports: true,
                hasCustomerInsights: true,
                maxProducts: null,
                maxUsers: null,
            }
        default:
            return getSubscriptionFeatures('FREE')
    }
}

// Combined permission check
export function canAccessFeature(
    role: UserRole,
    subscriptionTier: SubscriptionTier,
    feature: keyof ReturnType<typeof getSubscriptionFeatures>
): boolean {
    const rolePerms = getRolePermissions(role)
    const subFeatures = getSubscriptionFeatures(subscriptionTier)

    // Admin bypasses subscription checks
    if (role === 'ADMIN') return true

    // For owner role, check both role permission and subscription
    if (role === 'OWNER') {
        return subFeatures[feature] === true || subFeatures[feature] === null
    }

    return false
}
