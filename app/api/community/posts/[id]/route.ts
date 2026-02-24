import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        } // Ideally authorize that user is the author or admin

        const body = await req.json();
        const { title, content, images, pinned } = body;

        const post = await prisma.post.update({
            where: {
                id: id
            },
            data: {
                title,
                content,
                images,
                pinned
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[POST_UPDATE]", error);
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

        await prisma.post.delete({
            where: {
                id: id
            }
        });

        return NextResponse.json({ message: "Deleted" });
    } catch (error) {
        console.error("[POST_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
