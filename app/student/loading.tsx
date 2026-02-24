export default function StudentLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-72 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="h-80 rounded-2xl bg-slate-200 lg:col-span-2" />
                <div className="h-80 rounded-2xl bg-slate-200" />
            </div>
        </div>
    );
}
