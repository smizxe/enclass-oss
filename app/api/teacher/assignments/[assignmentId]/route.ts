import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const assignmentSchema = z.object({
    title: z.string().min(1),
    content: z.string().optional(),
    type: z.enum(["LECTURE", "QUIZ", "TEST", "ESSAY"]),
    settings: z.any().optional(),
});

// Partial schema for PATCH (all fields optional)
const assignmentPatchSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    type: z.enum(["LECTURE", "QUIZ", "TEST", "ESSAY"]).optional(),
    settings: z.any().optional(),
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Allow if teacher owns class OR if admin (future proof)
        if (assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("[ASSIGNMENT_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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
        const validatedData = assignmentPatchSchema.parse(body);

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Build update data object with only provided fields
        const updateData: any = {};
        if (validatedData.title !== undefined) updateData.title = validatedData.title;
        if (validatedData.content !== undefined) updateData.content = validatedData.content;
        if (validatedData.type !== undefined) updateData.type = validatedData.type;
        if (validatedData.settings !== undefined) updateData.settings = validatedData.settings;

        const updatedAssignment = await prisma.assignment.update({
            where: {
                id: assignmentId,
            },
            data: updateData,
        });

        return NextResponse.json(updatedAssignment);
    } catch (error) {
        console.error("[ASSIGNMENT_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;

        const assignment = await prisma.assignment.findUnique({
            where: {
                id: assignmentId,
            },
            include: {
                class: true,
            }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Cleanup Supabase Storage Files
        // 1. Fetch all questions to find images/audio
        const questions = await prisma.question.findMany({
            where: { assignmentId },
            select: { id: true, content: true }
        });

        const filesToDelete: string[] = [];

        // Check Assignment Settings for Global Audio
        if (assignment.settings) {
            const settings = assignment.settings as any;
            if (settings.audioUrl) {
                try {
                    const path = settings.audioUrl.split('/storage/v1/object/public/images/')[1];
                    if (path) filesToDelete.push(decodeURIComponent(path));
                } catch { }
            }
        }

        // Check Questions for Section Images/Audio
        for (const q of questions) {
            try {
                const parsed = JSON.parse(q.content);

                // Section Images
                if (parsed.sectionImages && Array.isArray(parsed.sectionImages)) {
                    parsed.sectionImages.forEach((url: string) => {
                        try {
                            const path = url.split('/storage/v1/object/public/images/')[1];
                            if (path) filesToDelete.push(decodeURIComponent(path));
                        } catch { }
                    });
                }

                // Section Audio
                if (parsed.sectionAudio) {
                    try {
                        const path = parsed.sectionAudio.split('/storage/v1/object/public/images/')[1];
                        if (path) filesToDelete.push(decodeURIComponent(path));
                    } catch { }
                }
            } catch { }
        }

        // Initialize Supabase Admin Client
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        if (filesToDelete.length > 0) {
            await supabase.storage.from('images').remove(filesToDelete);
        }

        // Cleanup Student Submission Files (Audio)
        // Files are stored at: submissions/{assignmentId}/{questionId}/{filename}
        try {
            // We need to clean up question by question because they are in subfolders
            for (const q of questions) {
                // List files in the question folder
                const folderPath = `submissions/${assignmentId}/${q.id}`;
                const { data: files, error } = await supabase
                    .storage
                    .from('submissions')
                    .list(folderPath);

                if (files && files.length > 0) {
                    const pathsToDelete = files.map(f => `${folderPath}/${f.name}`);
                    await supabase.storage.from('submissions').remove(pathsToDelete);
                }
            }
        } catch (error) {
            console.error("Error cleaning up submission files:", error);
            // Continue with deletion of assignment record even if storage cleanup fails partially
        }

        const deletedAssignment = await prisma.assignment.delete({
            where: {
                id: assignmentId,
            },
        });

        return NextResponse.json(deletedAssignment);
    } catch (error) {
        console.error("[ASSIGNMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
