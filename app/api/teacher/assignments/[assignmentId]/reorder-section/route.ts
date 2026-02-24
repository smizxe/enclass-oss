import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

interface ParsedContent {
    sectionTitle?: string;
    [key: string]: any;
}

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
        const body = await req.json();
        const { sectionTitle, direction } = body; // direction: "UP" | "DOWN"

        if (!sectionTitle || !direction) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 403 });
        }

        // 1. Fetch all questions ordered by current orderIndex
        const questions = await prisma.question.findMany({
            where: { assignmentId },
            orderBy: [
                { orderIndex: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        // 2. Group questions by sectionTitle
        // We replicate the frontend grouping logic essentially: sequential grouping
        const groups: { title: string, questions: typeof questions }[] = [];
        let currentGroup: { title: string, questions: typeof questions } | null = null;

        for (const q of questions) {
            let parsed: ParsedContent = {};
            try {
                parsed = JSON.parse(q.content);
            } catch { }

            const qSectionTitle = parsed.sectionTitle || "General";

            if (!currentGroup || currentGroup.title !== qSectionTitle) {
                if (currentGroup) groups.push(currentGroup);
                currentGroup = {
                    title: qSectionTitle,
                    questions: []
                };
            }
            currentGroup.questions.push(q);
        }
        if (currentGroup) groups.push(currentGroup);

        // 3. Find target section index
        const targetIndex = groups.findIndex(g => g.title === sectionTitle);
        if (targetIndex === -1) {
            return new NextResponse("Section not found", { status: 404 });
        }

        // 4. Determine swap index
        let swapIndex = -1;
        if (direction === "UP") {
            swapIndex = targetIndex - 1;
        } else if (direction === "DOWN") {
            swapIndex = targetIndex + 1;
        }

        if (swapIndex < 0 || swapIndex >= groups.length) {
            // Cannot move further (already at top or bottom)
            // Just return success with no changes
            return NextResponse.json({ message: "No change needed" });
        }

        // 5. Swap groups
        const temp = groups[targetIndex];
        groups[targetIndex] = groups[swapIndex];
        groups[swapIndex] = temp;

        // 6. Flatten and prepare updates
        const updates: any[] = [];
        let newOrderIndex = 0;

        for (const group of groups) {
            for (const q of group.questions) {
                // Only update if orderIndex changed
                if (q.orderIndex !== newOrderIndex) {
                    updates.push(
                        prisma.question.update({
                            where: { id: q.id },
                            data: { orderIndex: newOrderIndex }
                        })
                    );
                }
                newOrderIndex++;
            }
        }

        // 7. Execute updates transactionally
        if (updates.length > 0) {
            await prisma.$transaction(updates);
        }

        return NextResponse.json({ success: true, swappedWith: groups[targetIndex].title });

    } catch (error) {
        console.error("[REORDER_SECTION]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
