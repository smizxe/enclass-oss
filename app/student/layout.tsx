import { StudentSidebar } from "@/components/layout/student-sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getStudentProgressCounts } from "./data";

export default async function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const counts = await getStudentProgressCounts();
    const totalAssignments = counts?.totalAssignments || 0;
    const completedAssignments = counts?.completedAssignments || 0;

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <StudentSidebar
                    progressCount={completedAssignments}
                    totalCount={totalAssignments}
                />
            </div>
            <main className="md:pl-72 h-full">
                <div className="p-8 h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
