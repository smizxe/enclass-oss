import { GraduationCap } from "lucide-react";
import Link from "next/link";

export const HomeFooter = () => {
    return (
        <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-xl font-bold text-slate-900">
                            Thầy Điệp <span className="text-indigo-600">English</span>
                        </span>
                    </div>

                    <div className="flex gap-8 text-sm font-medium text-slate-500">
                        <Link href="/#" className="hover:text-indigo-600">
                            Về Thầy Điệp
                        </Link>
                        <Link href="/#" className="hover:text-indigo-600">
                            Lịch khai giảng
                        </Link>
                        <Link href="/#" className="hover:text-indigo-600">
                            Góc học viên
                        </Link>
                    </div>
                </div>

                <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <p>Địa chỉ: 123 Đường Cầu Giấy, Hà Nội | Hotline: 09xx.xxx.xxx</p>
                    <p>© 2024 DiepClass LMS. Powered by PrepMaster.</p>
                </div>
            </div>
        </footer>
    );
};
