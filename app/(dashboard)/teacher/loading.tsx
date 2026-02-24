
export default function TeacherDashboardLoading() {
    return (
        <div className="p-6 space-y-8 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-8 w-64 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-32">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                            <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="h-8 w-12 bg-slate-200 rounded-lg mb-2"></div>
                        <div className="h-4 w-24 bg-slate-200 rounded-lg"></div>
                    </div>
                ))}
            </div>

            {/* Recent Classes Section */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="h-6 w-40 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-20 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-slate-100 rounded-xl border border-slate-200"></div>
                    ))}
                </div>
            </div>
        </div>
    );
}
