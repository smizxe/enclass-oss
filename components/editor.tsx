"use client";

import dynamic from "next/dynamic";
// @ts-ignore
import { useMemo } from "react";
import "react-quill-new/dist/quill.snow.css";

interface EditorProps {
    onChange: (value: string) => void;
    value: string;
}

export const Editor = ({ onChange, value }: EditorProps) => {
    // Dynamic import to avoid SSR issues with Quill
    const ReactQuill = useMemo(() => dynamic(() => import("react-quill-new"), { ssr: false }), []);

    return (
        <div className="bg-white">
            <ReactQuill
                theme="snow"
                value={value}
                onChange={onChange}
                modules={{
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        // link and image, video
                        ['link', 'video'],
                        ['code-block'],
                        ['clean']
                        // Table support is tricky in Quill 1.x without proper CSS/Module. 
                        // However, preventing stripping is key. 
                        // 'react-quill-new' might bundle it. Let's try attempting to preserve logic.
                    ],
                    // By default Quill 1.3.7 (which react-quill usually wraps) requires explicit table module to Handle it 
                    // otherwise it strips it. 
                    clipboard: {
                        matchVisual: false // Helps with pasting
                    }
                }}
            // We are using a simplified approach. If table stripping continues, we might need a raw HTML toggle.
            />
            <div className="text-xs text-slate-400 mt-1 px-2 pb-2">
                * Lưu ý: Nếu nội dung có bảng (Table), vui lòng cẩn thận khi chỉnh sửa để tránh mất định dạng.
            </div>
        </div>
    );
};
