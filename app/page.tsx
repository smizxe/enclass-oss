import Link from "next/link";
import Image from "next/image";
import {
    GraduationCap,
    User,
    ArrowRight,
    Monitor,
    Flame,
    Home,
    BookOpen,
    Laptop,
    BarChart3,
    TrendingUp,
    FileText,
    CheckCircle,
    ChevronRight,
    Trophy,
    Send,
    CheckCircle2
} from "lucide-react";

export default function HomePage() {
    return (
        <div className="text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 scroll-smooth">
            {/* Navigation */}
            <nav className="fixed w-full top-0 z-50 glass-nav transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-900">
                            Diep<span className="text-indigo-600">Class</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
                        <a href="#benefits" className="hover:text-indigo-600 transition-colors">Lợi ích</a>
                        <a href="#system" className="hover:text-indigo-600 transition-colors">Hệ thống</a>
                        <a href="#results" className="hover:text-indigo-600 transition-colors">Thành tích HV</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                            <User className="w-4 h-4" />
                            Học viên đăng nhập
                        </Link>
                        <a href="#register" className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition shadow-lg shadow-slate-900/20">
                            Đăng ký học
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-slate-50">
                <div className="absolute inset-0 hero-pattern opacity-40"></div>
                {/* Gradient blobs - Fixed visibility */}
                <div className="absolute top-10 -right-20 w-[700px] h-[700px] bg-indigo-200 rounded-full blur-[120px] opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-[500px] h-[500px] bg-blue-200 rounded-full blur-[120px] opacity-40"></div>

                <div className="max-w-5xl mx-auto px-6 text-center fade-enter">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Dành riêng cho học viên lớp Thầy Điệp
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-[1.1] mb-6">
                        Hệ thống luyện thi &amp; <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Bài tập về nhà 4.0</span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Không chỉ học trên lớp, học viên được cấp tài khoản VIP luyện đề IELTS/TOEIC trên giao diện thi thật. Chấm điểm tự động, giải thích chi tiết, cam kết tăng band điểm.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <a href="#register" className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-600/25 flex items-center justify-center gap-2 group">
                            Đăng ký tư vấn lộ trình
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="#system" className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 transition flex items-center justify-center gap-2">
                            <Laptop className="w-5 h-5" />
                            Xem giao diện thi
                        </a>
                    </div>

                    {/* UI Mockup: Student Dashboard View */}
                    <div className="relative max-w-5xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl opacity-10 blur-xl"></div>
                        <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[450px] md:h-[550px]">
                            {/* Sidebar Mockup */}
                            <div className="w-16 md:w-60 border-r border-slate-100 bg-slate-50/50 p-4 flex-col gap-3 hidden md:flex">
                                <div className="flex items-center gap-3 mb-6 px-2">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="Avatar" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold text-slate-900">Nguyễn Văn A</div>
                                        <div className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">Lớp IELTS 6.5+</div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-9 w-full bg-indigo-50 text-indigo-700 rounded-lg flex items-center px-3 gap-3 text-xs font-semibold border border-indigo-100/50">
                                        <Home className="w-4 h-4" /> Tổng quan
                                    </div>
                                    <div className="h-9 w-full hover:bg-white hover:shadow-sm rounded-lg flex items-center px-3 gap-3 text-slate-600 text-xs font-medium transition cursor-pointer">
                                        <BookOpen className="w-4 h-4" /> Bài tập về nhà <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">2</span>
                                    </div>
                                    <div className="h-9 w-full hover:bg-white hover:shadow-sm rounded-lg flex items-center px-3 gap-3 text-slate-600 text-xs font-medium transition cursor-pointer">
                                        <Laptop className="w-4 h-4" /> Thi thử Mocktest
                                    </div>
                                    <div className="h-9 w-full hover:bg-white hover:shadow-sm rounded-lg flex items-center px-3 gap-3 text-slate-600 text-xs font-medium transition cursor-pointer">
                                        <BarChart3 className="w-4 h-4" /> Bảng thành tích
                                    </div>
                                </div>

                                <div className="mt-auto bg-indigo-900 rounded-xl p-4 text-white relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="text-xs opacity-80 mb-1">Dự đoán điểm</div>
                                        <div className="text-2xl font-bold">7.5</div>
                                        <div className="text-[10px] mt-2 flex items-center gap-1 opacity-80">
                                            <TrendingUp className="w-3 h-3" /> Tăng 0.5 so với tháng trước
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Mockup */}
                            <div className="flex-1 bg-white flex flex-col">
                                {/* Top bar */}
                                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">Chào Nguyễn Văn A! 👋</h3>
                                        <p className="text-xs text-slate-500">Hôm nay bạn có 2 bài tập Reading cần hoàn thành.</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="h-9 px-4 rounded-lg bg-slate-100 flex items-center text-xs font-medium text-slate-600">
                                            <Flame className="w-4 h-4 text-orange-500 mr-1.5" /> 12 ngày liên tiếp
                                        </div>
                                    </div>
                                </div>

                                {/* Content area */}
                                <div className="p-8 overflow-y-auto bg-slate-50/30 flex-1">
                                    {/* Cards row */}
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-xs text-slate-500 mb-2">Bài tập đã làm</div>
                                            <div className="text-2xl font-bold text-slate-900">48</div>
                                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3">
                                                <div className="w-3/4 bg-blue-500 h-1.5 rounded-full"></div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-xs text-slate-500 mb-2">Điểm trung bình</div>
                                            <div className="text-2xl font-bold text-slate-900">8.0</div>
                                            <div className="text-[10px] text-emerald-600 mt-1">Excellent!</div>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                            <div className="text-xs text-slate-500 mb-2">Thời gian luyện</div>
                                            <div className="text-2xl font-bold text-slate-900">12h</div>
                                            <div className="text-[10px] text-slate-400 mt-1">Tuần này</div>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-900 mb-4">Bài tập về nhà (Deadline: Tối nay)</h4>
                                    <div className="space-y-3">
                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition cursor-pointer group">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-semibold text-slate-900">Cam 18 - Test 2 - Passage 1</span>
                                                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-0.5 rounded">Chưa làm</span>
                                                </div>
                                                <div className="text-xs text-slate-500">Reading • 13 câu hỏi • 20 phút</div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                                                <ChevronRight className="w-4 h-4" />
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-300 transition cursor-pointer group opacity-75">
                                            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                                <CheckCircle className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-semibold text-slate-900">Listening Practice - Section 2</span>
                                                    <span className="text-xs text-emerald-600 font-bold">9.0</span>
                                                </div>
                                                <div className="text-xs text-slate-500">Đã hoàn thành lúc 14:30 hôm nay</div>
                                            </div>
                                            <div className="text-xs font-medium text-indigo-600 underline">Xem lại bài</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Value Props for Student/Parents */}
            <section id="benefits" className="py-24 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Tại sao Học viên thích học tại lớp Thầy Điệp?</h2>
                        <p className="text-slate-500 text-lg">Hệ thống công nghệ giúp việc học trở nên thú vị, bám sát thực tế và hiệu quả hơn gấp 3 lần so với phương pháp truyền thống.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Benefit 1 */}
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                <Monitor className="w-24 h-24 text-indigo-600" />
                            </div>
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm border border-indigo-50">
                                <Laptop className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Giao diện thi như thật</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Học viên được làm quen với giao diện thi máy (Computer-based) của IDP/BC ngay từ ngày đầu. Vào phòng thi thật sẽ không bị bỡ ngỡ.</p>
                        </div>

                        {/* Benefit 2 */}
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                <CheckCircle className="w-24 h-24 text-emerald-600" />
                            </div>
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm border border-emerald-50">
                                <CheckCircle className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Chấm điểm &amp; Giải thích ngay</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Không cần đợi thầy chấm. Hệ thống trả điểm Reading/Listening ngay lập tức kèm giải thích chi tiết vì sao đúng/sai cho từng câu.</p>
                        </div>

                        {/* Benefit 3 */}
                        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-lg transition duration-300 relative group overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                                <TrendingUp className="w-24 h-24 text-orange-600" />
                            </div>
                            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-orange-500 mb-6 shadow-sm border border-orange-50">
                                <BarChart3 className="w-7 h-7" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Phụ huynh nắm rõ tiến độ</h3>
                            <p className="text-slate-600 leading-relaxed text-sm">Phụ huynh có thể đăng nhập để xem biểu đồ chuyên cần và điểm số của con. Biết rõ con đang yếu kỹ năng nào để đôn đốc.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Student Journey Step */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <h2 className="text-3xl font-bold text-center mb-16">Quy trình &quot;Cày cuốc&quot; tại lớp thầy Điệp</h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="text-center relative">
                            <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                📚
                            </div>
                            <h3 className="text-lg font-bold mb-2">1. Học trên lớp</h3>
                            <p className="text-sm text-slate-400">Học kiến thức mới, chiến thuật làm bài trực tiếp với thầy Điệp.</p>
                            <div className="hidden md:block absolute top-10 -right-[50%] w-full h-0.5 bg-gradient-to-r from-slate-700 to-transparent"></div>
                        </div>

                        <div className="text-center relative">
                            <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                💻
                            </div>
                            <h3 className="text-lg font-bold mb-2">2. Luyện trên Web</h3>
                            <p className="text-sm text-slate-400">Đăng nhập DiepClass làm bài tập về nhà theo đúng thời gian quy định.</p>
                            <div className="hidden md:block absolute top-10 -right-[50%] w-full h-0.5 bg-gradient-to-r from-slate-700 to-transparent"></div>
                        </div>

                        <div className="text-center relative">
                            <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-3xl mb-6 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                                📊
                            </div>
                            <h3 className="text-lg font-bold mb-2">3. Xem phân tích</h3>
                            <p className="text-sm text-slate-400">Hệ thống chỉ ra lỗi sai. Xem video chữa chi tiết các câu khó.</p>
                            <div className="hidden md:block absolute top-10 -right-[50%] w-full h-0.5 bg-gradient-to-r from-slate-700 to-transparent"></div>
                        </div>

                        <div className="text-center relative">
                            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-3xl mb-6 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse">
                                🚀
                            </div>
                            <h3 className="text-lg font-bold mb-2">4. Tăng Band</h3>
                            <p className="text-sm text-slate-400">Cải thiện điểm số sau mỗi tuần. Tự tin đi thi thật.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* System Preview Gallery */}
            <section id="system" className="py-24 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 mb-12">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Trải nghiệm phòng thi ngay tại nhà</h2>
                    <p className="text-slate-500">Xem trước giao diện mà các bạn học viên đang sử dụng hàng ngày.</p>
                </div>

                <div className="flex gap-6 overflow-x-auto px-6 pb-12 snap-x snap-mandatory scrollbar-hide">
                    {/* Card 1: Exam UI */}
                    <div className="min-w-[300px] md:min-w-[700px] snap-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
                        <div className="h-10 bg-slate-900 flex items-center px-4 justify-between">
                            <span className="text-white text-xs font-medium">IELTS Reading Simulation</span>
                            <span className="text-white text-xs font-mono bg-slate-700 px-2 py-1 rounded">58:20 left</span>
                        </div>
                        <div className="p-0 flex h-[350px]">
                            <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 bg-slate-50 text-slate-600 text-sm leading-7">
                                <h4 className="font-bold text-slate-900 mb-3 text-lg">The Life of Bees</h4>
                                <p className="mb-4">Bees are winged insects closely related to wasps and ants, known for their roles in pollination and, in the case of the best-known bee species, the western honey bee, for producing honey...</p>
                                <p>Bees are found on every continent except Antarctica, in every habitat on the planet that contains insect-pollinated flowering plants.</p>
                            </div>
                            <div className="w-1/2 p-6 overflow-y-auto">
                                <div className="mb-4">
                                    <h5 className="text-sm font-bold text-slate-900 mb-2">Questions 1-3</h5>
                                    <p className="text-xs text-slate-500 mb-3">Choose the correct letter, A, B, C or D.</p>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs font-medium text-slate-800 mb-2">1. Where can bees be found?</p>
                                            <div className="space-y-1.5">
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" name="q1" className="accent-indigo-600" />
                                                    <span className="text-xs text-slate-600 group-hover:text-indigo-600">Only in Europe</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <input type="radio" name="q1" className="accent-indigo-600" defaultChecked />
                                                    <span className="text-xs text-slate-900 font-semibold bg-indigo-50 px-2 py-0.5 rounded w-full">Every continent except Antarctica</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Leaderboard */}
                    <div className="min-w-[300px] md:min-w-[500px] snap-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col">
                        <div className="h-14 bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center px-6 gap-3">
                            <Trophy className="w-6 h-6 text-white" />
                            <span className="text-white font-bold text-lg">Bảng Vàng Tháng 10</span>
                        </div>
                        <div className="p-6 flex-1 bg-white">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                                    <div className="font-bold text-yellow-600 text-lg w-6">1</div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Annie" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-900">Trần Minh Tú</div>
                                        <div className="text-xs text-slate-500">Lớp IELTS Fighter</div>
                                    </div>
                                    <div className="font-bold text-indigo-600">8.5</div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
                                    <div className="font-bold text-slate-400 text-lg w-6">2</div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Bob" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-900">Lê Hoàng</div>
                                        <div className="text-xs text-slate-500">Lớp TOEIC 600+</div>
                                    </div>
                                    <div className="font-bold text-indigo-600">8.0</div>
                                </div>
                                <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
                                    <div className="font-bold text-slate-400 text-lg w-6">3</div>
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=Cait" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-slate-900">Phạm Hương</div>
                                        <div className="text-xs text-slate-500">Lớp Foundation</div>
                                    </div>
                                    <div className="font-bold text-indigo-600">7.5</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Registration / Contact Section */}
            <section id="register" className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-900 -z-20"></div>
                {/* Decorations */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-screen filter blur-[120px] opacity-30"></div>

                <div className="max-w-6xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-block px-3 py-1 bg-indigo-800 text-indigo-200 rounded-full text-xs font-semibold mb-4 border border-indigo-700">Tuyển sinh Khoá mới</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-6">Muốn trải nghiệm hệ thống này?</h2>
                            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
                                Đăng ký tư vấn lộ trình học ngay hôm nay để nhận tài khoản trải nghiệm miễn phí hệ thống DiepClass và bài test đầu vào.
                            </p>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=1" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=2" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-indigo-900 bg-slate-200 overflow-hidden">
                                        <Image src="https://api.dicebear.com/7.x/notionists/svg?seed=3" alt="Avatar" width={40} height={40} className="w-full h-full" unoptimized />
                                    </div>
                                </div>
                                <div className="text-white text-sm font-medium">
                                    <span className="font-bold text-yellow-400">2,500+</span> học viên đã tham gia
                                </div>
                            </div>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3 text-white font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Test trình độ đầu vào miễn phí
                                </li>
                                <li className="flex items-center gap-3 text-white font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Cấp tài khoản Premium trọn đời khoá học
                                </li>
                                <li className="flex items-center gap-3 text-white font-medium">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                    Cam kết đầu ra bằng văn bản
                                </li>
                            </ul>
                        </div>

                        <div className="bg-white rounded-2xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" />
                                Đăng ký Tư vấn Học
                            </h3>
                            <form className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Họ và tên học viên</label>
                                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm font-medium text-slate-800" placeholder="Ví dụ: Nguyễn Văn A" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Số điện thoại (Zalo)</label>
                                    <input type="tel" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition text-sm font-medium text-slate-800" placeholder="09xxxxxxx" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Mục tiêu của bạn</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className="cursor-pointer">
                                            <input type="radio" name="target" className="peer sr-only" />
                                            <div className="px-4 py-3 rounded-lg border border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 text-slate-600 text-sm font-medium text-center transition">IELTS</div>
                                        </label>
                                        <label className="cursor-pointer">
                                            <input type="radio" name="target" className="peer sr-only" />
                                            <div className="px-4 py-3 rounded-lg border border-slate-200 peer-checked:border-indigo-600 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 text-slate-600 text-sm font-medium text-center transition">TOEIC</div>
                                        </label>
                                    </div>
                                </div>
                                <button type="button" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 mt-2">
                                    Gửi đăng ký
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                            <p className="text-center text-xs text-slate-400 mt-4">Thầy Điệp sẽ liên hệ lại trong vòng 24h.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-bold text-slate-900">Thầy Điệp <span className="text-indigo-600">English</span></span>
                        </div>

                        <div className="flex gap-8 text-sm font-medium text-slate-500">
                            <a href="#" className="hover:text-indigo-600">Về Thầy Điệp</a>
                            <a href="#" className="hover:text-indigo-600">Lịch khai giảng</a>
                            <a href="#" className="hover:text-indigo-600">Góc học viên</a>
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                        <p>Địa chỉ: 123 Đường Cầu Giấy, Hà Nội | Hotline: 09xx.xxx.xxx</p>
                        <p>© 2024 DiepClass LMS. Powered by PrepMaster.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
