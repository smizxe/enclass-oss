import { Sidebar } from "@/components/layout/sidebar";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    const isStudent = session?.user?.role === "STUDENT";

    return (
        <div className="h-full relative">
            <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                {isStudent ? <StudentSidebar /> : <Sidebar />}
            </div>
            <main className="md:pl-72 h-full">
                <div className="p-8 h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
