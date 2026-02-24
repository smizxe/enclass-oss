// Redirect or reuse same component with param
import { redirect } from "next/navigation";

export default function ClassCommunityPage() {
    redirect("/student/community?tab=class");
}
