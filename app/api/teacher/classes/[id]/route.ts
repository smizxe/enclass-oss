import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTeacherTags } from "@/lib/cache-invalidation";

const classSchema = z.object({
    published: z.boolean().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
});

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;
        const values = await req.json();

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const parsedValues = classSchema.parse(values);
        const ownedClass = await prisma.class.findFirst({
            where: {
                id,
                teacherId: session.user.id
            },
            select: { id: true }
        });

        if (!ownedClass) {
            return new NextResponse("Not Found", { status: 404 });
        }

        const classObj = await prisma.class.update({
            where: {
                id: id,
            },
            data: {
                ...parsedValues,
            },
        });

        revalidateTeacherTags(session.user.id);

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const view = searchParams.get("view");

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        if (view === "grading") {
            const classObj = await prisma.class.findUnique({
                where: {
                    id: id,
                },
                include: {
                    assignments: {
                        orderBy: {
                            orderIndex: "asc",
                        },
                        select: {
                            id: true,
                            title: true,
                            type: true,
                            classId: true
                        }
                    },
                    _count: {
                        select: { members: true }
                    }
                }
            });

            if (!classObj || classObj.teacherId !== session.user.id) {
                return new NextResponse("Not Found", { status: 404 });
            }

            return NextResponse.json(classObj);
        }

        const classObj = await prisma.class.findUnique({
            where: {
                id: id,
            },
            include: {
                assignments: {
                    orderBy: {
                        orderIndex: "asc",
                    },
                    include: {
                        questions: true
                    }
                },
                _count: {
                    select: { members: true }
                }
            }
        });

        if (!classObj || classObj.teacherId !== session.user.id) {
            return new NextResponse("Not Found", { status: 404 });
        }

        return NextResponse.json(classObj);
    } catch (error) {
        console.error("[CLASS_ID_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const classObj = await prisma.class.findFirst({
            where: {
                id,
                teacherId: session.user.id
            },
            include: {
                assignments: {
                    select: { id: true }
                }
            }
        });

        if (!classObj) {
            return new NextResponse("Not Found", { status: 404 });
        }

        // Import supabase to handle storage cleanup
        const { supabase } = await import("@/lib/supabase");

        // 1. Storage Cleanup: Clean up audio files for assignments
        for (const assignment of classObj.assignments) {
            const audioPathPrefix = `audio/${id}/${assignment.id}/`;
            try {
                const { data: files } = await supabase
                    .storage
                    .from('class_assets')
                    .list(audioPathPrefix);

                if (files && files.length > 0) {
                    const paths = files.map(f => `${audioPathPrefix}${f.name}`);
                    await supabase.storage.from('class_assets').remove(paths);
                }
            } catch (err) {
                console.error("Failed to delete audio assets for assignment", assignment.id, err);
            }
        }

        // 2. Storage Cleanup: Clean up images for community posts belonging to this class
        const postImagesPrefix = `posts/${id}/`;
        try {
            const { data: imgFiles } = await supabase
                .storage
                .from('class_assets') // Assuming posts use the same bucket, otherwise update this
                .list(postImagesPrefix);

            if (imgFiles && imgFiles.length > 0) {
                const paths = imgFiles.map(f => `${postImagesPrefix}${f.name}`);
                await supabase.storage.from('class_assets').remove(paths);
            }
        } catch (err) {
            console.error("Failed to delete post image assets for class", id, err);
        }

        // 3. Database Cleanup (Cascading via Transaction)
        // Note: Assignment and AssignmentGroup have onDelete: Cascade from Class
        // Question has onDelete: Cascade from Assignment
        // We need to manually delete Progress, Submission, Post, Comment, and ClassMember

        await prisma.$transaction(async (tx) => {
            // Find all assignment IDs in this class
            const assignmentIds = classObj.assignments.map(a => a.id);

            if (assignmentIds.length > 0) {
                // Find all progress records for these assignments
                const progressRecords = await tx.assignmentProgress.findMany({
                    where: { assignmentId: { in: assignmentIds } },
                    select: { id: true }
                });
                const progressIds = progressRecords.map(p => p.id);

                if (progressIds.length > 0) {
                    // Delete all submissions
                    await tx.submission.deleteMany({
                        where: { assignmentProgressId: { in: progressIds } }
                    });
                }

                // Delete all progress
                await tx.assignmentProgress.deleteMany({
                    where: { assignmentId: { in: assignmentIds } }
                });
            }

            // Find all posts for this class
            const posts = await tx.post.findMany({
                where: { classId: id },
                select: { id: true }
            });
            const postIds = posts.map(p => p.id);

            if (postIds.length > 0) {
                // Delete comments on those posts
                await tx.comment.deleteMany({
                    where: { postId: { in: postIds } }
                });

                // Delete the posts
                await tx.post.deleteMany({
                    where: { classId: id }
                });
            }

            // Unlink/Delete members
            await tx.classMember.deleteMany({
                where: { classId: id }
            });

            // Finally, delete the class itself (Assignments and Questions cascade automatically)
            await tx.class.delete({
                where: { id: id }
            });
        });

        revalidateTeacherTags(session.user.id);

        return new NextResponse("Class deleted successfully", { status: 200 });
    } catch (error) {
        console.error("[CLASS_ID_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

