export default function TeacherGradingLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="h-56 rounded-2xl bg-slate-200" />
                <div className="h-56 rounded-2xl bg-slate-200" />
                <div className="h-56 rounded-2xl bg-slate-200" />
            </div>
        </div>
    );
}
