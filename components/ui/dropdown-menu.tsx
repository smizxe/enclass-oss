"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child)) {
                    // @ts-ignore
                    return React.cloneElement(child, { isOpen, setIsOpen });
                }
                return child;
            })}
        </div>
    );
};

const DropdownMenuTrigger = ({ children, asChild, isOpen, setIsOpen, className }: any) => {
    const Comp = asChild ? React.Fragment : "button";
    // If asChild is true, we need to clone the child to add onClick
    if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children, {
            onClick: (e: any) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
                children.props.onClick && children.props.onClick(e);
            }
        } as any);
    }

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
            }}
            className={className}
        >
            {children}
        </button>
    );
};

const DropdownMenuContent = ({ children, align = "end", className, isOpen }: any) => {
    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "absolute z-50 mt-2 rounded-md border border-slate-200 bg-white p-1 shadow-md animate-in fade-in-80 zoom-in-95",
                align === "end" ? "right-0" : "left-0",
                className
            )}
        >
            {children}
        </div>
    );
};

const DropdownMenuItem = ({ children, onClick, className }: any) => {
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
            className={cn(
                "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-slate-100 hover:text-indigo-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
        >
            {children}
        </div>
    );
};

// Simplified exports matching Shadcn structure for compatibility
export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
};
