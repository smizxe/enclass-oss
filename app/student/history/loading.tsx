export default function StudentHistoryLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-64 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
            </div>
            <div className="space-y-3 rounded-2xl bg-white p-4">
                <div className="h-20 rounded-xl bg-slate-200" />
                <div className="h-20 rounded-xl bg-slate-200" />
                <div className="h-20 rounded-xl bg-slate-200" />
            </div>
        </div>
    );
}
