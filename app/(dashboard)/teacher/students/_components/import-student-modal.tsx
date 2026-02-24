"use client";

import { useState, useRef } from "react";
import { X, Upload, FileSpreadsheet, Loader2, Download, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface ImportStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ImportStudentModal({ isOpen, onClose, onSuccess }: ImportStudentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [results, setResults] = useState<{
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        // Create template workbook
        const wb = XLSX.utils.book_new();
        const templateData = [
            { name: "Nguyễn Văn A", email: "nguyenvana@example.com", password: "matkhau123", class: "Lớp 10A" },
            { name: "Trần Thị B", email: "tranthib@example.com", password: "matkhau456", class: "Lớp 10A" },
            { name: "Lê Văn C", email: "levanc@example.com", password: "matkhau789", class: "Lớp 10B" },
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        ws["!cols"] = [
            { wch: 25 }, // name
            { wch: 30 }, // email
            { wch: 15 }, // password
            { wch: 20 }, // class
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Danh sách học viên");
        XLSX.writeFile(wb, "mau-nhap-hoc-vien.xlsx");
        toast.success("Đã tải xuống template!");
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
                toast.error("Vui lòng chọn file Excel (.xlsx hoặc .xls)");
                return;
            }
            setFile(selectedFile);
            setResults(null);
        }
    };

    const handleImport = async () => {
        if (!file) {
            toast.error("Vui lòng chọn file");
            return;
        }

        setIsImporting(true);
        setResults(null);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/teacher/students/import", {
                method: "POST",
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
                if (data.success > 0) {
                    toast.success(`Đã import ${data.success} học viên thành công!`);
                    onSuccess();
                }
                if (data.failed > 0) {
                    toast.error(`${data.failed} học viên không thể import`);
                }
            } else {
                const error = await response.text();
                toast.error(error || "Có lỗi xảy ra khi import");
            }
        } catch (error) {
            console.error("Import error:", error);
            toast.error("Có lỗi xảy ra");
        } finally {
            setIsImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setResults(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-900">Import học viên từ Excel</h2>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 rounded-lg transition">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Download Template */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                                <Download className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-slate-900 mb-1">Bước 1: Tải template mẫu</h3>
                                <p className="text-sm text-slate-500 mb-3">
                                    Tải file Excel mẫu, điền thông tin học viên theo định dạng có sẵn.
                                </p>
                                <button
                                    onClick={handleDownloadTemplate}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-500 text-sm font-medium text-slate-700 rounded-lg transition"
                                >
                                    <Download className="w-4 h-4" />
                                    Tải Template (.xlsx)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Upload File */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                <Upload className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-medium text-slate-900 mb-1">Bước 2: Upload file đã điền</h3>
                                <p className="text-sm text-slate-500 mb-3">
                                    Chọn file Excel chứa danh sách học viên để import.
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-emerald-500 text-sm font-medium text-slate-700 rounded-lg transition"
                                >
                                    <Upload className="w-4 h-4" />
                                    Chọn file
                                </button>
                                {file && (
                                    <span className="ml-3 text-sm text-emerald-600 font-medium">
                                        {file.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">Lưu ý:</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-600">
                                    <li>Cột <strong>name</strong>, <strong>email</strong>, <strong>password</strong> là bắt buộc</li>
                                    <li>Cột <strong>class</strong> không bắt buộc, nếu lớp chưa có sẽ tự động tạo mới</li>
                                    <li>Email không được trùng lặp</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {results && (
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h3 className="font-medium text-slate-900 mb-3">Kết quả Import:</h3>
                            <div className="flex gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                    <span className="text-sm text-slate-700">
                                        Thành công: <strong className="text-emerald-600">{results.success}</strong>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-5 h-5 text-red-500" />
                                    <span className="text-sm text-slate-700">
                                        Thất bại: <strong className="text-red-600">{results.failed}</strong>
                                    </span>
                                </div>
                            </div>
                            {results.errors.length > 0 && (
                                <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2 max-h-24 overflow-y-auto">
                                    {results.errors.slice(0, 5).map((err, i) => (
                                        <div key={i}>{err}</div>
                                    ))}
                                    {results.errors.length > 5 && (
                                        <div className="text-slate-500">...và {results.errors.length - 5} lỗi khác</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition"
                    >
                        Đóng
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={!file || isImporting}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang import...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Import
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
