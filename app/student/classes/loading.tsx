export default function StudentClassesLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-72 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                <div className="h-64 rounded-xl bg-slate-200" />
                <div className="h-64 rounded-xl bg-slate-200" />
                <div className="h-64 rounded-xl bg-slate-200" />
                <div className="h-64 rounded-xl bg-slate-200" />
            </div>
        </div>
    );
}
