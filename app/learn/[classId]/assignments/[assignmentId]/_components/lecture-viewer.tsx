"use client";

interface LectureViewerProps {
    content: string | null;
}

export const LectureViewer = ({ content }: LectureViewerProps) => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {content ? (
                <div
                    className="prose prose-slate max-w-none prose-headings:font-bold prose-p:text-slate-600 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            ) : (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📖</span>
                    </div>
                    <h3 className="font-medium text-slate-900 mb-1">Chưa có nội dung</h3>
                    <p className="text-sm text-slate-500">Bài giảng này chưa được cập nhật nội dung.</p>
                </div>
            )}
        </div>
    );
};
