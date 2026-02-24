import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import ClassesClient from "./_components/client";

export default async function ClassesPage() {
    const session = await getServerSession(authOptions);

    if (!session) {
        return redirect("/");
    }

    const classes = await prisma.class.findMany({
        where: {
            teacherId: session.user.id,
        },
        orderBy: {
            createdAt: "desc",
        },
        select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            _count: {
                select: { members: true }
            }
        }
    });

    return <ClassesClient data={classes} />;
}
