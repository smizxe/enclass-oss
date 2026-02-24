import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { compare, hash } from "bcryptjs";

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        if (newPassword.length < 6) {
            return new NextResponse("Mật khẩu mới phải có ít nhất 6 ký tự", { status: 400 });
        }

        // Get the user from database
        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id
            }
        });

        if (!user || !user.password) {
            return new NextResponse("User not found or no password set", { status: 404 });
        }

        // Verify current password
        const isPasswordValid = await compare(currentPassword, user.password);

        if (!isPasswordValid) {
            return new NextResponse("Mật khẩu hiện tại không đúng", { status: 400 });
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: {
                id: session.user.id
            },
            data: {
                password: hashedPassword
            }
        });

        return new NextResponse("Mật khẩu đã được cập nhật thành công", { status: 200 });
    } catch (error) {
        console.error("[SETTINGS_PASSWORD_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
