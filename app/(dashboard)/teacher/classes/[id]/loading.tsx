export default function TeacherClassDetailLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-6 w-24 rounded bg-slate-200" />
            <div className="h-10 w-80 rounded bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="h-96 rounded-2xl bg-slate-200" />
                <div className="h-96 rounded-2xl bg-slate-200 lg:col-span-2" />
            </div>
        </div>
    );
}
