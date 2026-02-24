import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET: Fetch blog posts by the teacher with pagination
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));

        const where = {
            authorId: session.user.id,
            category: "BLOG" as const,
        };

        const [totalCount, posts] = await Promise.all([
            prisma.post.count({ where }),
            prisma.post.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    title: true,
                    excerpt: true,
                    bannerUrl: true,
                    bannerType: true,
                    published: true,
                    createdAt: true,
                    updatedAt: true,
                },
            })
        ]);

        return NextResponse.json({
            data: posts,
            pagination: {
                page,
                limit,
                totalCount,
                totalPages: Math.ceil(totalCount / limit)
            }
        });
    } catch (error) {
        console.error("[BLOG_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

// POST: Create a new blog post
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { title, content, bannerUrl, bannerType, excerpt, published } = body;

        if (!title?.trim()) {
            return new NextResponse("Title is required", { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                title: title.trim(),
                content: content || "",
                category: "BLOG",
                bannerUrl: bannerUrl || null,
                bannerType: bannerType || null,
                excerpt: excerpt || null,
                published: published || false,
                authorId: session.user.id,
                images: [],
            },
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("[BLOG_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
