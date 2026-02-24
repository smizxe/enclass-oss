"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    PlayCircle,
    CheckCircle,
    BookOpen,
    FileText,
    ClipboardList,
    ChevronDown,
    ChevronRight,
    Folder,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";

interface ClassSidebarProps {
    classItem: any;
}

export const ClassSidebar = ({
    classItem,
}: ClassSidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    // Expand all by default
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
        new Set(classItem.assignmentGroups?.map((g: any) => g.id) || [])
    );
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleGroup = (groupId: string) => {
        if (isCollapsed) return;
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupId)) newExpanded.delete(groupId);
        else newExpanded.add(groupId);
        setExpandedGroups(newExpanded);
    };

    const onClick = (assignmentId: string) => {
        router.push(`/learn/${classItem.id}/assignments/${assignmentId}`);
    }

    const totalAssignments = classItem.assignments?.length || 0;
    const completedAssignments = classItem.assignments?.filter((a: any) =>
        a.progress?.length > 0 && a.progress[0]?.status === "COMPLETED"
    ).length || 0;

    const progressPercent = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    const getAssignmentIcon = (type: string) => {
        switch (type) {
            case "LECTURE": return FileText;
            case "QUIZ": return ClipboardList;
            default: return PlayCircle;
        }
    };

    const renderAssignmentItem = (assignment: any, index: number) => {
        const isActive = pathname?.includes(assignment.id);
        const isCompleted = assignment.progress?.length > 0 &&
            assignment.progress[0]?.status === "COMPLETED";
        const AssignmentIcon = isCompleted ? CheckCircle : getAssignmentIcon(assignment.type);

        if (isCollapsed) {
            return (
                <button
                    key={assignment.id}
                    onClick={() => onClick(assignment.id)}
                    className={cn(
                        "w-full flex items-center justify-center py-3 mx-0 mb-1 rounded-lg transition",
                        isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "hover:bg-slate-50 text-slate-600",
                        isCompleted && !isActive && "opacity-60"
                    )}
                    title={assignment.title}
                >
                    <AssignmentIcon className={cn(
                        "w-5 h-5",
                        isActive ? "text-indigo-600" : isCompleted ? "text-emerald-500" : "text-slate-400"
                    )} />
                </button>
            );
        }

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
                    isCompleted
                        ? "bg-emerald-100 text-emerald-600"
                        : isActive
                            ? "bg-indigo-200 text-indigo-700"
                            : "bg-slate-100 text-slate-500"
                )}>
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : index + 1}
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
    }

    const ungroupedAssignments = classItem.assignments?.filter((a: any) => !a.groupId) || [];

    return (
        <div className={cn(
            "hidden md:flex flex-col border-r border-slate-200 bg-white h-full transition-all duration-300 ease-in-out relative group/sidebar",
            isCollapsed ? "w-20" : "w-80"
        )}>
            {/* Collapse Toggle Button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={cn(
                    "absolute -right-3 top-6 z-50 bg-white border border-slate-200 shadow-sm rounded-full p-1.5 text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all",
                    isCollapsed && "rotate-180 right-[-12px]"
                )}
                title={isCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
            >
                <PanelLeftClose className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className={cn(
                "border-b border-slate-100 dark:border-slate-800 transition-all",
                isCollapsed ? "p-4 flex flex-col items-center" : "p-6"
            )}>
                <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "mb-4")}>
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0">
                            <h1 className="font-semibold text-slate-900 line-clamp-1">
                                {classItem.title}
                            </h1>
                            <p className="text-xs text-slate-500">{totalAssignments} bài tập</p>
                        </div>
                    )}
                </div>

                {/* Progress */}
                {!isCollapsed && (
                    <div className="fade-in animate-in duration-300">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500">Tiến độ</span>
                            <span className="font-medium text-indigo-600">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                            <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* List */}
            <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "px-2 py-4" : "py-2")}>
                {/* Groups */}
                {classItem.assignmentGroups?.map((group: any) => {
                    const isExpanded = expandedGroups.has(group.id);
                    const groupAssignments = group.assignments || [];

                    if (isCollapsed) {
                        // In collapsed mode, showing all assignments flat might be messy if too many.
                        // Maybe just show dot indicators or still list them?
                        // Let's just list the icons of assignments in the group, possibly with a separator.
                        // Or better: Show a folder icon that does nothing or tooltip?
                        // User wants "sidebar ... minimize lại". So usually keeping navigation capability is key.
                        // Let's render assignments as icons.
                        return (
                            <div key={group.id} className="mb-4 flex flex-col items-center gap-1">
                                <div className="p-2 rounded-lg bg-slate-50 text-slate-400 mb-1" title={group.title}>
                                    <Folder className="w-4 h-4" />
                                </div>
                                {groupAssignments.map((assignment: any, idx: number) => renderAssignmentItem(assignment, idx))}
                            </div>
                        );
                    }

                    return (
                        <div key={group.id} className="mb-2">
                            <div
                                className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-slate-50 text-slate-700 font-medium text-sm select-none"
                                onClick={() => toggleGroup(group.id)}
                            >
                                {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <Folder className="w-4 h-4 text-indigo-500/70" />
                                <span className="flex-1 truncate">{group.title}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{groupAssignments.length}</span>
                            </div>

                            {isExpanded && (
                                <div className="pl-2">
                                    {groupAssignments.map((assignment: any, idx: number) => renderAssignmentItem(assignment, idx))}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Ungrouped */}
                {(ungroupedAssignments.length > 0 || (classItem.assignmentGroups?.length === 0 && ungroupedAssignments.length > 0)) && (
                    <div className={cn("mt-2", isCollapsed && "flex flex-col items-center gap-1 border-t border-slate-100 pt-2")}>
                        {!isCollapsed && classItem.assignmentGroups?.length > 0 && (
                            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Bài tập khác
                            </div>
                        )}
                        {ungroupedAssignments.map((assignment: any, index: number) => renderAssignmentItem(assignment, index))}
                    </div>
                )}
            </div>
        </div>
    );
};
