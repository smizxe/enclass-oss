export default function TeacherStudentsLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 w-72 rounded bg-slate-200" />
            <div className="h-12 w-full rounded-xl bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
                <div className="h-24 rounded-xl bg-slate-200" />
            </div>
            <div className="h-96 rounded-2xl bg-slate-200" />
        </div>
    );
}
