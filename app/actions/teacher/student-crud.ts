"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateStudent(studentId: string, data: { name?: string; email?: string }) {
    try {
        await prisma.user.update({
            where: { id: studentId },
            data: {
                ...data,
            },
        });
        revalidatePath("/teacher/students");
        return { success: true };
    } catch (error) {
        console.error("Failed to update student:", error);
        return { success: false, error: "Failed to update student" };
    }
}

export async function changeStudentPassword(studentId: string, newPassword: string) {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: studentId },
            data: {
                password: hashedPassword,
            },
        });
        revalidatePath("/teacher/students");
        return { success: true };
    } catch (error) {
        console.error("Failed to change password:", error);
        return { success: false, error: "Failed to change password" };
    }
}

export async function addStudentToClass(studentId: string, classId: string) {
    try {
        await prisma.classMember.create({
            data: {
                userId: studentId,
                classId: classId,
            },
        });
        revalidatePath("/teacher/students");
        return { success: true };
    } catch (error) {
        console.error("Failed to add student to class:", error);
        return { success: false, error: "Failed to add student to class" };
    }
}

export async function removeStudentFromClass(studentId: string, classId: string) {
    try {
        await prisma.classMember.deleteMany({
            where: {
                userId: studentId,
                classId: classId,
            },
        });
        revalidatePath("/teacher/students");
        return { success: true };
    } catch (error) {
        console.error("Failed to remove student from class:", error);
        return { success: false, error: "Failed to remove student from class" };
    }
}

export async function getAvailableClasses() {
    try {
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        return classes;
    } catch (error) {
        console.error("Failed to fetch classes:", error);
        return [];
    }
}
