import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId"); // If null, fetch global

        const posts = await prisma.post.findMany({
            where: {
                classId: classId || null // Explicitly null for global
            },
            include: {
                author: {
                    select: {
                        name: true,
                        // Add avatar if available
                    }
                }
            },
            orderBy: [
                { pinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("[POSTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, content, images, classId, pinned } = body;

        if (!title || !content) {
            return new NextResponse("Missing fields", { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                title,
                content,
                images: images || [],
                classId: classId || null,
                pinned: pinned || false,
                authorId: session.user.id
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[POSTS_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
