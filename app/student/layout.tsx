import { StudentSidebar } from "@/components/layout/student-sidebar";

export default function StudentDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <StudentSidebar />
            </div>
            <main className="md:pl-72 h-full">
                <div className="p-8 h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
