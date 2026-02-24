"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    className?: string;
    text?: string;
    fallbackUrl?: string; // Optional fallback if history is empty (though hard to detect reliably)
}

export const BackButton = ({
    className,
    text = "Quay lại",
    fallbackUrl
}: BackButtonProps) => {
    const router = useRouter();

    const handleClick = () => {
        router.back();
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors",
                className
            )}
            type="button"
        >
            <ArrowLeft className="w-4 h-4" />
            {text}
        </button>
    );
};
