import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Dynamic import to keep xlsx out of the main bundle
        const XLSX = await import("xlsx");

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

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách học viên");

        // Write workbook to buffer
        const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": 'attachment; filename="mau-nhap-hoc-vien.xlsx"',
            },
        });
    } catch (error) {
        console.error("[STUDENTS_TEMPLATE] Error:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
