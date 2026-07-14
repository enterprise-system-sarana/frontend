import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    buttonText?: string;
    onButtonClick?: () => void;
    children?: ReactNode;
};

export default function PageHeader({
    title,
    buttonText,
    onButtonClick,
    children,
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between">
            <div>

                <h1 className="text-2xl font-bold">{title}</h1>
            </div>

            <div className="flex items-center gap-2">
                {children}

                {buttonText && (
                    <Button onClick={onButtonClick}>
                        <Plus />    {buttonText}
                    </Button>
                )}
            </div>
        </div>
    );
}