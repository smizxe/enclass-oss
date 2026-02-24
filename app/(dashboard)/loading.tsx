export default function DashboardLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-28 rounded-xl bg-slate-200" />
                <div className="h-28 rounded-xl bg-slate-200" />
                <div className="h-28 rounded-xl bg-slate-200" />
            </div>
            <div className="h-80 rounded-2xl bg-slate-200" />
        </div>
    );
}
