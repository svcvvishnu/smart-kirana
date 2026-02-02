import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    trend?: {
        value: string;
        type: "up" | "down" | "neutral";
    };
    subtitle?: string;
    variant?: "default" | "primary" | "success" | "warning" | "danger";
    className?: string;
}

const variantStyles = {
    default: {
        card: "",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
    },
    primary: {
        card: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-white",
        iconBg: "bg-indigo-600",
        iconColor: "text-white",
    },
    success: {
        card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white",
        iconBg: "bg-emerald-600",
        iconColor: "text-white",
    },
    warning: {
        card: "border-amber-200 bg-gradient-to-br from-amber-50 to-white",
        iconBg: "bg-amber-600",
        iconColor: "text-white",
    },
    danger: {
        card: "border-red-200 bg-gradient-to-br from-red-50 to-white",
        iconBg: "bg-red-600",
        iconColor: "text-white",
    },
};

const trendStyles = {
    up: { color: "text-emerald-600", icon: TrendingUp },
    down: { color: "text-red-600", icon: TrendingDown },
    neutral: { color: "text-gray-500", icon: Minus },
};

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    variant = "default",
    className,
}: StatCardProps) {
    const styles = variantStyles[variant];
    const TrendIcon = trend ? trendStyles[trend.type].icon : null;

    return (
        <Card className={cn("overflow-hidden", styles.card, className)}>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">
                            {title}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-gray-900">
                            {value}
                        </p>
                        {(trend || subtitle) && (
                            <div className="mt-2 flex items-center gap-2">
                                {trend && TrendIcon && (
                                    <span className={cn("flex items-center gap-1 text-sm", trendStyles[trend.type].color)}>
                                        <TrendIcon className="h-4 w-4" />
                                        {trend.value}
                                    </span>
                                )}
                                {subtitle && (
                                    <span className="text-sm text-gray-500">
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {Icon && (
                        <div className={cn("p-3 rounded-xl flex-shrink-0", styles.iconBg)}>
                            <Icon className={cn("h-5 w-5", styles.iconColor)} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface StatGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}

export function StatGrid({ children, columns = 4, className }: StatGridProps) {
    const gridCols = {
        2: "md:grid-cols-2",
        3: "md:grid-cols-3",
        4: "md:grid-cols-2 lg:grid-cols-4",
    };

    return (
        <div className={cn("grid gap-4", gridCols[columns], className)}>
            {children}
        </div>
    );
}
