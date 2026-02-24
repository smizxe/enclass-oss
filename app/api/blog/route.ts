import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Public API: Fetch published blog posts
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get("limit");

        let take: number | undefined = 3;
        if (limitParam === "all") {
            take = undefined;
        } else if (limitParam) {
            take = parseInt(limitParam);
        }

        const posts = await prisma.post.findMany({
            where: {
                category: "BLOG",
                published: true,
            },
            orderBy: [
                { pinned: "desc" },
                { createdAt: "desc" }
            ],
            take: take,
            select: {
                id: true,
                title: true,
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

        return NextResponse.json(posts);
    } catch (error) {
        console.error("[BLOG_PUBLIC_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
