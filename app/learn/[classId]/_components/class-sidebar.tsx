"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    PlayCircle,
    CheckCircle,
    BookOpen,
    FileText,
    ClipboardList
} from "lucide-react";

interface ClassSidebarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    classItem: any; // Type accurately later
}

export const ClassSidebar = ({
    classItem,
}: ClassSidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const onClick = (assignmentId: string) => {
        router.push(`/learn/${classItem.id}/assignments/${assignmentId}`);
    }

    const totalAssignments = classItem.assignments?.length || 0;

    const getAssignmentIcon = (type: string) => {
        switch (type) {
            case "LECTURE":
                return FileText;
            case "QUIZ":
                return ClipboardList;
            default:
                return PlayCircle;
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Class Header */}
            <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-slate-900 line-clamp-1">
                            {classItem.title}
                        </h1>
                        <p className="text-xs text-slate-500">{totalAssignments} bài tập</p>
                    </div>
                </div>

                {/* Progress */}
                <div>
                    <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-500">Tiến độ</span>
                        <span className="font-medium text-indigo-600">0%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full">
                        <div className="w-0 bg-indigo-600 h-2 rounded-full transition-all"></div>
                    </div>
                </div>
            </div>

            {/* Assignments List (Flat) */}
            <div className="flex-1 overflow-y-auto py-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {classItem.assignments?.map((assignment: any, index: number) => {
                    const isActive = pathname?.includes(assignment.id);
                    const isCompleted = assignment.progress?.length > 0 && assignment.progress[0].completed;
                    const AssignmentIcon = isCompleted ? CheckCircle : getAssignmentIcon(assignment.type);

                    return (
                        <button
                            key={assignment.id}
                            onClick={() => onClick(assignment.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-lg text-left transition max-w-[95%]",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "hover:bg-slate-50 text-slate-600",
                                isCompleted && !isActive && "opacity-60"
                            )}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                                isActive ? "bg-indigo-200 text-indigo-700" : "bg-slate-100 text-slate-500"
                            )}>
                                {index + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <AssignmentIcon className={cn(
                                        "w-3.5 h-3.5",
                                        isActive ? "text-indigo-600" : isCompleted ? "text-emerald-500" : "text-slate-400"
                                    )} />
                                    <span className={cn(
                                        "text-sm truncate font-medium",
                                        isActive ? "text-indigo-700" : "text-slate-700"
                                    )}>
                                        {assignment.title}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
