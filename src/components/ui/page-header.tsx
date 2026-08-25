import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
    /** Main heading / page title (e.g. "Products") */
    title: ReactNode;
    /** Feature singular name (e.g. "Product") -> auto-generates label "Create Product" */
    featureName?: string;
    /** Explicit button label (e.g. "Create Product" or "Add Item"). Overrides featureName. */
    buttonLabel?: ReactNode;
    /** Alias for buttonLabel for backwards compatibility */
    buttonText?: ReactNode;
    /** Action callback when the primary button is clicked */
    onCreate?: () => void;
    /** Alias for onCreate */
    onButtonClick?: () => void;
    /** Custom icon for the action button (default: <Plus className="h-4 w-4" />) */
    buttonIcon?: ReactNode;
    /** Set to true to hide the create button even if handler is provided */
    hideButton?: boolean;
    /** Additional action elements/buttons rendered next to the create button */
    actions?: ReactNode;
    /** Children rendered in the action area */
    children?: ReactNode;
    /** Optional subtitle / description below the title */
    description?: ReactNode;
    /** Optional badge or tag next to title */
    badge?: ReactNode;
    /** Optional leading icon before the title */
    titleIcon?: ReactNode;
    /** Container class name */
    className?: string;
    /** Custom class for the action button */
    buttonClassName?: string;
}

export function PageHeader({
    title,
    featureName,
    buttonLabel,
    buttonText,
    onCreate,
    onButtonClick,
    buttonIcon,
    hideButton = false,
    actions,
    children,
    description,
    badge,
    titleIcon,
    className,
    buttonClassName,
}: PageHeaderProps) {
    const handleAction = onCreate || onButtonClick;
    const resolvedLabel =
        buttonLabel ||
        buttonText ||
        (featureName ? `Create ${featureName}` : undefined);
    const showCreateButton = !hideButton && (handleAction || resolvedLabel);

    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
            <div>
                <div className="flex items-center gap-2">
                    {titleIcon}
                    <h1 className="text-2xl font-bold text-foreground font-heading tracking-tight flex items-center gap-2">
                        {title}
                    </h1>
                    {badge}
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2.5">
                {children}
                {actions}

                {showCreateButton && (
                    <Button
                        onClick={handleAction}
                        className={cn(
                            "h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm flex items-center gap-2 transition-all cursor-pointer",
                            buttonClassName
                        )}
                    >
                        {buttonIcon !== undefined ? buttonIcon : <Plus className="h-4 w-4" />}
                        {resolvedLabel || "Create"}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default PageHeader;