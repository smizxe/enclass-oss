"use client";

import { FileText } from "lucide-react";

interface LectureViewerProps {
    title: string;
    content: string | null;
}

export const LectureViewer = ({ title, content }: LectureViewerProps) => {
    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Title Card */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                <div className="max-w-[1800px] mx-auto w-full">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50">
                            <FileText className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                                    Bài giảng
                                </span>
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 break-words">
                                {title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-[1800px] mx-auto">
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
            </div>
        </div>
    );
};
