"use client";

import { useState } from "react";
import useSWR from "swr";
import {
    format,
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks
} from "date-fns";
import { vi } from "date-fns/locale";
import {
    Loader2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Search,
    TrendingUp,
    BarChart3
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StudentProgress {
    id: string;
    name: string;
    email: string;
    totalAssignments: number;
    completedTotal: number;
    completionPercentage: number;
    completedInWeek: number;
    avgScore: number;
    weeklyActivity: boolean;
}

interface ProgressDashboardProps {
    classId: string;
}

export const ProgressDashboard = ({ classId }: ProgressDashboardProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    const { data: responseData, isLoading: loading } = useSWR<{ students: StudentProgress[] }>(
        `/api/teacher/classes/${classId}/progress/weekly?${params}`
    );

    const data = responseData?.students || [];

    const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
    const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));

    const filteredData = data.filter((student: StudentProgress) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sortedData = [...filteredData].sort((a, b) => b.completionPercentage - a.completionPercentage);

    return (
        <div className="space-y-6">
            {/* Header / Week Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Tiến độ học tập
                </h3>

                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                    <button
                        onClick={handlePrevWeek}
                        className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-600"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 px-2 text-sm font-medium text-slate-700 min-w-[200px] justify-center">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {format(startDate, "dd/MM", { locale: vi })} - {format(endDate, "dd/MM/yyyy", { locale: vi })}
                    </div>
                    <button
                        onClick={handleNextWeek}
                        className="p-1.5 hover:bg-slate-100 rounded-md transition text-slate-600"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Overview for Week */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hoạt động trong tuần</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.filter((s: StudentProgress) => s.weeklyActivity).length} / {data.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Học sinh có hoạt động
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bài tập hoàn thành</CardTitle>
                        <TrendingUp className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {data.reduce((acc: number, s: StudentProgress) => acc + s.completedInWeek, 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Tổng số bài nộp trong tuần
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 max-w-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Tìm kiếm học sinh..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="rounded-md border bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Học sinh</TableHead>
                                <TableHead className="text-center">Hoàn thành (Tuần)</TableHead>
                                <TableHead className="text-center">Điểm TB (Tuần)</TableHead>
                                <TableHead className="w-[300px]">Tiến độ tổng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <div className="flex justify-center items-center">
                                            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : sortedData.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                                        Không tìm thấy học sinh nào
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedData.map((student) => (
                                    <TableRow key={student.id} className="hover:bg-slate-50/50">
                                        <TableCell>
                                            <div className="font-medium text-slate-900">{student.name}</div>
                                            <div className="text-xs text-slate-500">{student.email}</div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.completedInWeek > 0 ? (
                                                <span className="font-semibold text-emerald-600">
                                                    {student.completedInWeek} bài
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {student.completedInWeek > 0 ? (
                                                <span className={`font-semibold ${student.avgScore >= 8 ? 'text-emerald-600' :
                                                    student.avgScore >= 5 ? 'text-indigo-600' :
                                                        'text-red-500'
                                                    }`}>
                                                    {student.avgScore.toFixed(1)}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1.5">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-slate-600">
                                                        {student.completedTotal}/{student.totalAssignments} bài
                                                    </span>
                                                    <span className="font-medium text-slate-900">
                                                        {student.completionPercentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                                <Progress value={student.completionPercentage} className="h-2" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};
