
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;
        const body = await req.json();
        const { questionIds, sectionTitle, passage, passageTable, passageTranslation } = body;

        if (!Array.isArray(questionIds) || questionIds.length === 0) {
            return new NextResponse("Invalid question IDs", { status: 400 });
        }

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // Fetch the questions to update
        const questions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                assignmentId: assignmentId
            }
        });

        // Update each question's content
        await prisma.$transaction(
            questions.map((q) => {
                let parsedContent;
                try {
                    parsedContent = JSON.parse(q.content);
                } catch {
                    parsedContent = { text: q.content };
                }

                // Update section data
                parsedContent.sectionTitle = sectionTitle;
                parsedContent.passage = passage;
                parsedContent.passageTable = passageTable;
                parsedContent.passageTranslation = passageTranslation;
                if (body.sectionAudio !== undefined) {
                    parsedContent.sectionAudio = body.sectionAudio;
                }
                if (body.sectionImages !== undefined) {
                    parsedContent.sectionImages = body.sectionImages;
                }

                return prisma.question.update({
                    where: { id: q.id },
                    data: {
                        content: JSON.stringify(parsedContent)
                    }
                });
            })
        );

        return new NextResponse("Section updated successfully", { status: 200 });
    } catch (error) {
        console.error("[SECTION_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
