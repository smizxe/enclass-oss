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
    PanelLeftOpen,
    Sparkles,
    Lock,
    X
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
    const [lockModal, setLockModal] = useState<{ prereqTitle: string; prereqId: string } | null>(null);

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

    // Helper: Check if assignment is locked due to prerequisite
    const isAssignmentLocked = (assignment: any): { locked: boolean; prereqTitle: string; prereqId: string } => {
        const prereqId = (assignment.settings as any)?.prerequisiteAssignmentId;
        if (!prereqId) return { locked: false, prereqTitle: "", prereqId: "" };

        // Find the prerequisite assignment in the class's assignments list
        const allAssignments = [
            ...(classItem.assignments || []),
            ...(classItem.assignmentGroups?.flatMap((g: any) => g.assignments || []) || [])
        ];
        const prereqAssignment = allAssignments.find((a: any) => a.id === prereqId);
        if (!prereqAssignment) return { locked: false, prereqTitle: "", prereqId: "" };

        const prereqCompleted = prereqAssignment.progress?.length > 0 &&
            prereqAssignment.progress[0]?.status === "COMPLETED";

        return {
            locked: !prereqCompleted,
            prereqTitle: prereqAssignment.title || "bài tập trước",
            prereqId
        };
    };

    const renderAssignmentItem = (assignment: any, index: number) => {
        const isActive = pathname?.includes(assignment.id);
        const isCompleted = assignment.progress?.length > 0 &&
            assignment.progress[0]?.status === "COMPLETED";
        const lockStatus = isAssignmentLocked(assignment);
        const AssignmentIcon = lockStatus.locked ? Lock : isCompleted ? CheckCircle : getAssignmentIcon(assignment.type);

        if (isCollapsed) {
            return (
                <button
                    key={assignment.id}
                    onClick={() => {
                        if (lockStatus.locked) {
                            setLockModal({ prereqTitle: lockStatus.prereqTitle, prereqId: lockStatus.prereqId });
                        } else {
                            onClick(assignment.id);
                        }
                    }}
                    className={cn(
                        "w-full flex items-center justify-center py-3 mx-0 mb-2 rounded-xl transition-all duration-300",
                        lockStatus.locked
                            ? "opacity-40 cursor-not-allowed"
                            : isActive
                                ? "bg-white text-indigo-600 shadow-lg shadow-indigo-900/20 scale-105"
                                : "hover:bg-white/10 text-indigo-200 hover:text-white",
                        isCompleted && !isActive && !lockStatus.locked && "opacity-60"
                    )}
                    title={lockStatus.locked ? `🔒 Phải hoàn thành: ${lockStatus.prereqTitle}` : assignment.title}
                >
                    <AssignmentIcon className={cn(
                        "w-5 h-5",
                        lockStatus.locked ? "text-slate-400" : isActive ? "text-indigo-600" : isCompleted ? "text-emerald-400" : "text-indigo-300"
                    )} />
                </button>
            );
        }

        return (
            <button
                key={assignment.id}
                onClick={() => {
                    if (lockStatus.locked) {
                        setLockModal({ prereqTitle: lockStatus.prereqTitle, prereqId: lockStatus.prereqId });
                    } else {
                        onClick(assignment.id);
                    }
                }}
                className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 mx-2 rounded-xl text-left transition-all duration-300 max-w-[95%] mb-2 backdrop-blur-sm",
                    lockStatus.locked
                        ? "opacity-50 cursor-not-allowed border border-transparent"
                        : isActive
                            ? "bg-white text-indigo-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] scale-[1.02] font-semibold border border-white/50"
                            : "hover:bg-white/10 text-indigo-100/90 border border-transparent hover:border-white/10",
                    isCompleted && !isActive && !lockStatus.locked && "opacity-75"
                )}
            >
                <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors shadow-sm",
                    lockStatus.locked
                        ? "bg-slate-700/50 text-slate-400 border border-slate-600/50"
                        : isCompleted
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : isActive
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-indigo-800/50 text-indigo-300 border border-indigo-700/50"
                )}>
                    {lockStatus.locked ? <Lock className="w-3.5 h-3.5" /> : isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <AssignmentIcon className={cn(
                            "w-4 h-4 shrink-0",
                            lockStatus.locked ? "text-slate-500" : isActive ? "text-indigo-500" : isCompleted ? "text-emerald-400" : "text-indigo-400"
                        )} />
                        <span className={cn(
                            "text-sm truncate",
                            lockStatus.locked ? "text-slate-400" : isActive ? "text-indigo-900" : "text-indigo-50"
                        )}>
                            {assignment.title}
                        </span>
                    </div>
                    {/* Lock info badge */}
                    {lockStatus.locked && (
                        <div className="flex items-center gap-1 mt-1 ml-6">
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-slate-600/30 text-slate-400 truncate max-w-[180px]">
                                🔒 Hoàn thành: {lockStatus.prereqTitle}
                            </span>
                        </div>
                    )}
                    {/* Time Limit & Deadline Badges */}
                    {!lockStatus.locked && (() => {
                        const settings = assignment.settings as { timeLimitMinutes?: number; deadline?: string } | null;
                        const hasTimer = settings?.timeLimitMinutes && settings.timeLimitMinutes > 0;
                        const hasDeadline = settings?.deadline;
                        if (!hasTimer && !hasDeadline) return null;

                        const deadlineDate = hasDeadline ? new Date(settings!.deadline!) : null;
                        const isUrgent = deadlineDate && (deadlineDate.getTime() - Date.now() < 24 * 60 * 60 * 1000);
                        const isExpired = deadlineDate && deadlineDate < new Date();

                        return (
                            <div className="flex items-center gap-1.5 mt-1 ml-6">
                                {hasTimer && (
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                        isActive ? "bg-amber-100 text-amber-700" : "bg-amber-500/20 text-amber-300"
                                    )}>
                                        ⏱️ {Math.floor(settings!.timeLimitMinutes! / 60) > 0 ? `${Math.floor(settings!.timeLimitMinutes! / 60)}h` : ""}{settings!.timeLimitMinutes! % 60 > 0 ? `${settings!.timeLimitMinutes! % 60}m` : ""}
                                    </span>
                                )}
                                {deadlineDate && (
                                    <span className={cn(
                                        "text-[10px] px-1.5 py-0.5 rounded-full font-medium truncate",
                                        isExpired
                                            ? (isActive ? "bg-red-100 text-red-600" : "bg-red-500/20 text-red-300")
                                            : isUrgent
                                                ? (isActive ? "bg-orange-100 text-orange-600" : "bg-orange-500/20 text-orange-300")
                                                : (isActive ? "bg-slate-100 text-slate-500" : "bg-white/10 text-indigo-300")
                                    )}>
                                        {isExpired ? "Hết hạn" : `${deadlineDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`}
                                    </span>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </button>
        );
    }

    const ungroupedAssignments = classItem.assignments?.filter((a: any) => !a.groupId) || [];

    return (
        <div className={cn(
            "hidden md:flex flex-col h-full transition-all duration-500 ease-in-out relative z-10",
            // Glassmorphism Container
            "bg-gradient-to-b from-indigo-950 via-[#1e1b4b] to-indigo-950 border-r border-indigo-800/30 shadow-2xl",
            isCollapsed ? "w-24" : "w-80"
        )}>
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-40 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={cn(
                        "absolute -right-3 top-8 z-50 bg-white shadow-lg shadow-indigo-900/20 border border-indigo-50 rounded-full p-1.5 text-indigo-600 hover:scale-110 hover:bg-indigo-50 transition-all duration-300",
                        isCollapsed && "rotate-180 right-[-12px]"
                    )}
                    title={isCollapsed ? "Mở rộng" : "Thu gọn"}
                >
                    <PanelLeftClose className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className={cn(
                    "transition-all duration-300 border-b border-white/5 backdrop-blur-md",
                    isCollapsed ? "p-4 flex flex-col items-center" : "p-6"
                )}>
                    <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "mb-6")}>
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/30 ring-1 ring-white/20">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        {!isCollapsed && (
                            <div className="min-w-0 animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="font-bold text-white text-lg line-clamp-1 tracking-tight">
                                    {classItem.title}
                                </h1>
                                <p className="text-xs text-indigo-300 flex items-center gap-1.5 mt-1">
                                    <Sparkles className="w-3 h-3 text-amber-300" />
                                    {totalAssignments} bài tập
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Progress */}
                    {!isCollapsed && (
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-indigo-200 font-medium">Tiến độ học tập</span>
                                <span className="font-bold text-white">{progressPercent}%</span>
                            </div>
                            <div className="w-full bg-black/20 h-2.5 rounded-full overflow-hidden p-[2px]">
                                <div className="h-full w-full rounded-full overflow-hidden bg-transparent">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000 ease-out relative"
                                        style={{ width: `${progressPercent}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className={cn(
                    "flex-1 overflow-y-auto custom-scrollbar-dark",
                    isCollapsed ? "px-2 py-6" : "py-4"
                )}>
                    {/* Groups */}
                    {classItem.assignmentGroups?.map((group: any) => {
                        const isExpanded = expandedGroups.has(group.id);
                        const groupAssignments = group.assignments || [];

                        if (isCollapsed) {
                            return (
                                <div key={group.id} className="mb-6 flex flex-col items-center gap-2">
                                    <div className="p-2.5 rounded-xl bg-white/5 text-indigo-300 mb-1 ring-1 ring-white/10" title={group.title}>
                                        <Folder className="w-4 h-4" />
                                    </div>
                                    {groupAssignments.map((assignment: any, idx: number) => renderAssignmentItem(assignment, idx))}
                                </div>
                            );
                        }

                        return (
                            <div key={group.id} className="mb-4 px-2">
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 cursor-pointer rounded-xl transition-all duration-200 group select-none",
                                        isExpanded ? "bg-white/5" : "hover:bg-white/5"
                                    )}
                                    onClick={() => toggleGroup(group.id)}
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-lg transition-colors",
                                        isExpanded ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-slate-400 group-hover:text-indigo-300"
                                    )}>
                                        <Folder className="w-4 h-4" />
                                    </div>
                                    <span className="flex-1 truncate text-indigo-100 font-medium text-sm group-hover:text-white transition-colors">
                                        {group.title}
                                    </span>
                                    {isExpanded ?
                                        <ChevronDown className="w-4 h-4 text-indigo-400" /> :
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    }
                                </div>

                                <div className={cn(
                                    "grid transition-all duration-300 ease-in-out overflow-hidden",
                                    isExpanded ? "grid-rows-[1fr] opacity-100 mt-2 pl-2" : "grid-rows-[0fr] opacity-0"
                                )}>
                                    <div className="min-h-0 border-l border-white/10 pl-2 ml-4">
                                        {groupAssignments.map((assignment: any, idx: number) => renderAssignmentItem(assignment, idx))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Ungrouped */}
                    {(ungroupedAssignments.length > 0 || (classItem.assignmentGroups?.length === 0 && ungroupedAssignments.length > 0)) && (
                        <div className={cn("mt-2", isCollapsed && "flex flex-col items-center gap-1 border-t border-white/10 pt-4")}>
                            {!isCollapsed && classItem.assignmentGroups?.length > 0 && (
                                <div className="px-6 py-3 text-xs font-bold text-indigo-400 uppercase tracking-widest opacity-80">
                                    Bài tập khác
                                </div>
                            )}
                            {ungroupedAssignments.map((assignment: any, index: number) => renderAssignmentItem(assignment, index))}
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Scrollbar Styles injected for this component */}
            <style jsx global>{`
                .custom-scrollbar-dark::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.1);
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}</style>

            {/* Lock Modal */}
            {lockModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-[360px] max-w-[90vw] animate-in zoom-in-95 fade-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-orange-50 rounded-lg">
                                    <Lock className="w-5 h-5 text-orange-600" />
                                </div>
                                <h3 className="font-bold text-slate-900">Bài tập bị khóa</h3>
                            </div>
                            <button
                                onClick={() => setLockModal(null)}
                                className="p-1 rounded-lg hover:bg-slate-100 transition"
                            >
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <p className="text-sm text-slate-600 mb-4">
                            Bạn cần hoàn thành bài tập <span className="font-semibold text-orange-600">&quot;{lockModal.prereqTitle}&quot;</span> trước khi có thể làm bài tập này.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    router.push(`/learn/${classItem.id}/assignments/${lockModal.prereqId}`);
                                    setLockModal(null);
                                }}
                                className="flex-1 bg-indigo-600 text-white text-sm font-medium py-2.5 px-4 rounded-xl hover:bg-indigo-700 transition shadow-sm"
                            >
                                Đi đến bài tập
                            </button>
                            <button
                                onClick={() => setLockModal(null)}
                                className="px-4 py-2.5 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
