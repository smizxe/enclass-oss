"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Send, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { registerStudent } from "@/app/actions/register";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

const initialState = {
    success: false,
    message: ""
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2"
        >
            {pending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang gửi...
                </>
            ) : (
                <>
                    Gửi đăng ký
                    <Send className="w-4 h-4" />
                </>
            )}
        </button>
    );
}

export const RegistrationForm = () => {
    const [state, formAction] = useFormState(registerStudent, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast.success(state.message);
                formRef.current?.reset();
            } else {
                toast.error(state.message);
            }
        }
    }, [state]);

    return (
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Đăng ký Tư vấn Học
            </h3>

            {state.success ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">Đăng ký thành công!</h4>
                    <p className="text-slate-600 text-sm">
                        Cảm ơn bạn đã quan tâm. Đội ngũ tư vấn sẽ liên hệ với bạn trong vòng 24h tới.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 text-indigo-600 font-medium text-sm hover:underline"
                    >
                        Gửi đăng ký khác
                    </button>
                </div>
            ) : (
                <form ref={formRef} action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Họ và tên học viên
                        </label>
                        <input
                            type="text"
                            name="name"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm font-medium text-slate-800"
                            placeholder="Ví dụ: Nguyễn Văn A"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Số điện thoại (Zalo)
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            required
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm font-medium text-slate-800"
                            placeholder="09xxxxxxx"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                            Mục tiêu của bạn
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="target"
                                    value="IELTS"
                                    defaultChecked
                                    className="peer sr-only"
                                />
                                <div className="px-4 py-3 rounded-lg border border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 text-slate-600 text-sm font-medium text-center transition hover:bg-slate-50">
                                    IELTS
                                </div>
                            </label>
                            <label className="cursor-pointer">
                                <input
                                    type="radio"
                                    name="target"
                                    value="TOEIC"
                                    className="peer sr-only"
                                />
                                <div className="px-4 py-3 rounded-lg border border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 text-slate-600 text-sm font-medium text-center transition hover:bg-slate-50">
                                    TOEIC
                                </div>
                            </label>
                        </div>
                    </div>

                    {state.message && !state.success && (
                        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {state.message}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            )}

            <p className="text-center text-xs text-slate-400 mt-4">
                Thầy Điệp sẽ liên hệ lại trong vòng 24h.
            </p>
        </div>
    );
};
