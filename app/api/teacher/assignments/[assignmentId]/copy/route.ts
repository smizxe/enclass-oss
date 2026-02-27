import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidateStudentsForClass, revalidateTeacherTags } from "@/lib/cache-invalidation";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;
        const { targetClassIds } = await req.json();

        if (!targetClassIds || !Array.isArray(targetClassIds) || targetClassIds.length === 0) {
            return new NextResponse("Danh sách lớp đích không hợp lệ", { status: 400 });
        }

        // 1. Fetch original assignment and its questions
        const originalAssignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
                questions: true,
            }
        });

        if (!originalAssignment) {
            return new NextResponse("Không tìm thấy bài tập gốc", { status: 404 });
        }

        if (originalAssignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Validate target classes ownership
        const targetClasses = await prisma.class.findMany({
            where: {
                id: { in: targetClassIds },
                teacherId: session.user.id,
            }
        });

        if (targetClasses.length !== targetClassIds.length) {
            return new NextResponse("Một số lớp đích không tồn tại hoặc bạn không có quyền truy cập", { status: 403 });
        }

        // 3. For each target class, create a copy of the assignment
        for (const targetClassId of targetClassIds) {
            // Find the highest orderIndex in the target class
            const lastAssignment = await prisma.assignment.findFirst({
                where: { classId: targetClassId },
                orderBy: { orderIndex: "desc" },
            });
            const nextOrderIndex = (lastAssignment?.orderIndex ?? -1) + 1;

            // Prepare questions data for creation (omit id and assignmentId)
            const newQuestionsData = originalAssignment.questions.map(q => ({
                type: q.type,
                content: q.content,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                points: q.points,
                orderIndex: q.orderIndex,
            }));

            // Create new Assignment
            await prisma.assignment.create({
                data: {
                    title: `${originalAssignment.title} (Bản sao)`, // Add distinguishing suffix
                    content: originalAssignment.content,
                    type: originalAssignment.type,
                    settings: originalAssignment.settings || {},
                    isTestMode: originalAssignment.isTestMode,
                    classId: targetClassId,
                    orderIndex: nextOrderIndex,
                    questions: {
                        create: newQuestionsData,
                    }
                }
            });

            // Revalidate cache for target class
            await revalidateStudentsForClass(targetClassId);
        }

        // Revalidate teacher's general tags
        revalidateTeacherTags(session.user.id);

        return NextResponse.json({ success: true, message: "Đã sao chép bài tập thành công." });
    } catch (error) {
        console.error("[ASSIGNMENT_COPY]", error);
        return new NextResponse("Lỗi hệ thống khi sao chép bài tập", { status: 500 });
    }
}
