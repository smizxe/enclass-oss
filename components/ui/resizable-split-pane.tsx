"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface ResizableSplitPaneProps {
    left: React.ReactNode;
    right: React.ReactNode;
    initialLeftWidth?: number; // percentage, e.g., 40
    minLeftWidth?: number; // percentage
    maxLeftWidth?: number; // percentage
}

export const ResizableSplitPane = ({
    left,
    right,
    initialLeftWidth = 40,
    minLeftWidth = 20,
    maxLeftWidth = 80,
}: ResizableSplitPaneProps) => {
    const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isDragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const newLeftWidth =
                ((e.clientX - containerRect.left) / containerRect.width) * 100;

            if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
                setLeftWidth(newLeftWidth);
            }
        },
        [isDragging, minLeftWidth, maxLeftWidth]
    );

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } else {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            className="flex h-full w-full overflow-hidden relative"
            style={{ cursor: isDragging ? "col-resize" : "default" }}
        >
            {/* Left Pane */}
            <div
                className="h-full overflow-y-auto no-scrollbar scroll-smooth"
                style={{ width: `${leftWidth}%` }}
            >
                {left}
            </div>

            {/* Resizer Handle */}
            <div
                className={`w-1.5 h-full cursor-col-resize flex items-center justify-center hover:bg-indigo-300 transition-colors z-10 shrink-0 select-none ${isDragging ? "bg-indigo-500" : "bg-slate-200"
                    }`}
                onMouseDown={handleMouseDown}
            >
                {/* Visual indicator (dots or line) */}
                <div className="w-0.5 h-8 bg-slate-400 rounded-full" />
            </div>

            {/* Right Pane */}
            <div
                className="flex-1 h-full overflow-y-auto no-scrollbar scroll-smooth bg-slate-50"
            >
                {right}
            </div>

            {/* Overlay to prevent iframe capturing mouse events while dragging (if any) */}
            {isDragging && (
                <div className="fixed inset-0 z-50 cursor-col-resize" />
            )}
        </div>
    );
};
