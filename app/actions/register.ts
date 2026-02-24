"use server";

export async function registerStudent(prevState: any, formData: FormData) {
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    const target = formData.get("target") as string;

    if (!name || !phone || !target) {
        return {
            success: false,
            message: "Vui lòng điền đầy đủ thông tin"
        };
    }

    const scriptUrl = process.env.GOOGLE_SHEETS_SCRIPT_URL;

    if (!scriptUrl) {
        console.error("GOOGLE_SHEETS_SCRIPT_URL not configured");
        return {
            success: false,
            message: "Lỗi hệ thống: Chưa cấu hình URL (Liên hệ Admin)"
        };
    }

    try {
        const response = await fetch(scriptUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                name,
                phone,
                target,
                timestamp: new Date().toISOString()
            }).toString()
        });

        if (!response.ok) {
            throw new Error(`Google Script returned ${response.status}`);
        }

        return {
            success: true,
            message: "Đăng ký thành công! Thầy Điệp sẽ liên hệ sớm."
        };

    } catch (error) {
        console.error("Registration error:", error);
        return {
            success: false,
            message: "Có lỗi xảy ra khi gửi đăng ký. Vui lòng thử lại sau."
        };
    }
}
