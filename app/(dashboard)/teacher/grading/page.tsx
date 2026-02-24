import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import GradingPageClient from "./grading-page-client";
import { getTeacherClassesForGrading } from "../data";

export default async function GradingPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "TEACHER") {
        return redirect("/");
    }

    const classes = await getTeacherClassesForGrading(session.user.id);

    return <GradingPageClient initialClasses={classes} />;
}
