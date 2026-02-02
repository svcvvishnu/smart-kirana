import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode; // For action buttons (legacy)
    actions?: ReactNode; // For action buttons (preferred)
    className?: string;
}

export function PageHeader({ title, description, children, actions, className }: PageHeaderProps) {
    const actionContent = actions || children;
    
    return (
        <div className={cn("mb-6", className)}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
                {actionContent && (
                    <div className="flex items-center gap-3">
                        {actionContent}
                    </div>
                )}
            </div>
        </div>
    );
}

interface PageSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function PageSection({ title, description, children, className }: PageSectionProps) {
    return (
        <section className={cn("mb-6", className)}>
            {(title || description) && (
                <div className="mb-4">
                    {title && (
                        <h2 className="text-lg font-semibold text-gray-900">
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="mt-1 text-sm text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
            )}
            {children}
        </section>
    );
}
