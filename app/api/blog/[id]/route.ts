import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const post = await prisma.post.findFirst({
            where: {
                id,
                category: "BLOG",
                published: true,
            },
            select: {
                id: true,
                title: true,
                content: true,
                excerpt: true,
                bannerUrl: true,
                bannerType: true,
                createdAt: true,
                author: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!post) {
            return new NextResponse("Not found", { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error) {
        console.error("[PUBLIC_BLOG_GET_ONE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
