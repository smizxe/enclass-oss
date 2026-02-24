
export default function TeacherClassesLoading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
                    <div className="h-4 w-64 bg-slate-200 rounded-lg"></div>
                </div>
                <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
            </div>

            {/* Class Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-72">
                        <div className="h-2 w-full bg-slate-200"></div>
                        <div className="p-5 space-y-4">
                            <div className="h-6 w-3/4 bg-slate-200 rounded-lg"></div>
                            <div className="h-4 w-full bg-slate-200 rounded-lg"></div>
                            <div className="h-4 w-1/2 bg-slate-200 rounded-lg"></div>
                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
                                <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
