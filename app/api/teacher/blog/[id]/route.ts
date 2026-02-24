import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch a single blog post
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        const post = await prisma.post.findFirst({
            where: {
                id,
                authorId: session.user.id,
                category: "BLOG",
            },
        });

        if (!post) {
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("[BLOG_GET_ONE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// PATCH: Update a blog post
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { title, content, bannerUrl, bannerType, excerpt, published, pinned } = body;

        // Verify ownership
        const existing = await prisma.post.findFirst({
            where: { id, authorId: session.user.id, category: "BLOG" },
        });

        if (!existing) {
            return new NextResponse("Not found", { status: 404 });
        }

        const post = await prisma.post.update({
            where: { id },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(content !== undefined && { content }),
                ...(bannerUrl !== undefined && { bannerUrl: bannerUrl || null }),
                ...(bannerType !== undefined && { bannerType: bannerType || null }),
                ...(excerpt !== undefined && { excerpt: excerpt || null }),
                ...(published !== undefined && { published }),
                ...(pinned !== undefined && { pinned }),
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[BLOG_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// DELETE: Delete a blog post
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        // Verify ownership
        const existing = await prisma.post.findFirst({
            where: { id, authorId: session.user.id, category: "BLOG" },
        });

        if (!existing) {
            return new NextResponse("Not found", { status: 404 });
        }

        await prisma.post.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[BLOG_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
