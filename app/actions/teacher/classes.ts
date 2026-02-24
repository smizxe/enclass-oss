"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createClass(data: { title: string; description?: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return { success: false, error: "Unauthorized" };
        }

        const newClass = await prisma.class.create({
            data: {
                title: data.title,
                description: data.description,
                teacherId: session.user.id,
            },
        });

        revalidatePath("/teacher/classes");
        return { success: true, class: newClass };
    } catch (error) {
        console.error("Failed to create class:", error);
        return { success: false, error: "Failed to create class" };
    }
}

export async function updateClass(classId: string, data: { title: string; description?: string }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id: classId },
        });

        if (!existingClass || existingClass.teacherId !== session.user.id) {
            return { success: false, error: "Unauthorized or Class not found" };
        }

        const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: {
                title: data.title,
                description: data.description,
            },
        });

        revalidatePath("/teacher/classes");
        return { success: true, class: updatedClass };
    } catch (error) {
        console.error("Failed to update class:", error);
        return { success: false, error: "Failed to update class" };
    }
}

export async function deleteClass(classId: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return { success: false, error: "Unauthorized" };
        }

        // Verify ownership
        const existingClass = await prisma.class.findUnique({
            where: { id: classId },
        });

        if (!existingClass || existingClass.teacherId !== session.user.id) {
            return { success: false, error: "Unauthorized or Class not found" };
        }

        // Transaction to delete dependencies if not handled by DB cascade
        // Based on schema, ClassMember might need manual deletion if strict
        await prisma.$transaction([
            prisma.classMember.deleteMany({
                where: { classId: classId },
            }),
            prisma.assignment.deleteMany({
                where: { classId: classId },
            }),
            prisma.post.deleteMany({
                where: { classId: classId },
            }),
            prisma.class.delete({
                where: { id: classId },
            }),
        ]);

        revalidatePath("/teacher/classes");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete class:", error);
        return { success: false, error: "Failed to delete class" };
    }
}
