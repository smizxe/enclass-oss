"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Loader2, Users, Globe } from "lucide-react";
import { PostCard } from "@/components/community/post-card";
import { PostEditor } from "@/components/community/post-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
    id: string;
    title: string;
    content: string;
    images: string[];
    author: {
        name: string | null;
        image?: string;
    };
    createdAt: string;
    pinned: boolean;
    classId: string | null;
}

export function CommunityPageContent() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("global");
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        const fetchClasses = async () => {
            if (!session?.user?.role) return;
            try {
                // If teacher, fetch managed classes. If student, fetch enrolled classes.
                // Assuming endpoints: /api/teacher/classes for teacher
                // /api/student/classes/available (or similar) for student... wait, student classes endpoint needs verification
                // Let's assume /api/teacher/classes returns list for teacher.
                // For student, we might need a different endpoint.
                // Given the user request is specifically about TEACHER ("admin o day la teacher"), let's prioritize teacher classes.

                if (session.user.role === "TEACHER") {
                    const response = await axios.get("/api/teacher/classes");
                    setClasses(response.data);
                } else if (session.user.role === "STUDENT") {
                    // For student, we usually have /api/student/classes (enrolled)
                    // Let's try that, or fallback to empty if separate endpoint exists
                    const response = await axios.get("/api/student/classes");
                    setClasses(response.data);
                }
            } catch (error) {
                console.error("Failed to fetch classes", error);
            }
        };
        fetchClasses();
    }, [session?.user?.role]);

    const fetchPosts = async (classId?: string) => {
        setLoading(true);
        try {
            const url = classId && classId !== "global"
                ? `/api/community/posts?classId=${classId}`
                : `/api/community/posts`;
            const response = await axios.get(url);
            setPosts(response.data?.data || response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts(activeTab === "global" ? undefined : activeTab);
    }, [activeTab]);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-100 rounded-xl">
                    <Users className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Cộng đồng học tập</h1>
                    <p className="text-slate-500">Trao đổi, chia sẻ kiến thức và cùng nhau tiến bộ</p>
                </div>
            </div>

            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar">
                    <TabsTrigger value="global" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Globe className="w-4 h-4" />
                        Cộng đồng chung
                    </TabsTrigger>
                    {classes.map((cls) => (
                        <TabsTrigger key={cls.id} value={cls.id} className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap">
                            <Users className="w-4 h-4" />
                            {cls.title}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-6">
                    {/* Post Editor - only show if global or specific class selected */}
                    <PostEditor
                        classId={activeTab === "global" ? undefined : activeTab}
                        classTitle={activeTab === "global" ? "Cộng đồng chung" : classes.find(c => c.id === activeTab)?.title}
                        onSuccess={() => fetchPosts(activeTab === "global" ? undefined : activeTab)}
                    />

                    {/* Posts Feed */}
                    <div className="space-y-6">
                        {loading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-xl border p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-10 w-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-3 w-24" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-32 w-full rounded-lg" />
                                </div>
                            ))
                        ) : posts.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-slate-900 font-medium mb-1">Chưa có bài viết nào</h3>
                                <p className="text-slate-500 text-sm">Hãy là người đầu tiên chia sẻ!</p>
                            </div>
                        ) : (
                            posts.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
                                    isTeacher={session?.user?.role === "TEACHER"}
                                    onDelete={async (id) => {
                                        if (!confirm("Bạn có chắc muốn xóa?")) return;
                                        await axios.delete(`/api/community/posts/${id}`);
                                        fetchPosts(activeTab === "global" ? undefined : activeTab);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
