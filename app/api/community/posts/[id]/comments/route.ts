import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/community/posts/[id]/comments
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const comments = await prisma.comment.findMany({
            where: {
                postId: id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        // image: true // Add if User model has image
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        return NextResponse.json(comments);

    } catch (error) {
        console.error("[COMMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST /api/community/posts/[id]/comments
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { content } = body;

        if (!content) {
            return new NextResponse("Content is required", { status: 400 });
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: id,
                authorId: session.user.id
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json(comment);

    } catch (error) {
        console.error("[COMMENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
