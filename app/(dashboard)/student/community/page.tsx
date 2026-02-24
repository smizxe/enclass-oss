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

export default function CommunityPage() {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("global");

    // In a real app, we would fetch the user's classes to populate tabs
    // For now, we'll just have Global and a generic "My Classes" view or fetch from an endpoint
    // To support "Community các lớp của mình", we might need to fetch *all* posts from user's classes
    // or provide a selector for classes.
    // Let's implement Global first.

    const fetchPosts = async (classId?: string) => {
        setLoading(true);
        try {
            const url = classId
                ? `/api/community/posts?classId=${classId}`
                : `/api/community/posts`;
            const response = await axios.get(url);
            setPosts(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "global") {
            fetchPosts();
        } else {
            // Fetch for specific class if tab is a classId
            // OR if tab is "classes", fetch aggregate?
            // The request says: "bấm vào trang thì nó sẽ hiện ra community các lớp của mình"
            // Maybe show a list of classes?
            // Let's stick to Global for MVP step, and assume we can add class tabs if we fetch user classes.
        }
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

            <Tabs defaultValue="global" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="mb-6 w-full justify-start h-auto p-1 bg-slate-100 rounded-xl overflow-x-auto">
                    <TabsTrigger value="global" className="flex items-center gap-2 px-4 py-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Globe className="w-4 h-4" />
                        Cộng đồng chung
                    </TabsTrigger>
                    {/* Placeholder for dynamic class tabs */}
                    {/* We would map through user.enrolledClasses here */}
                </TabsList>

                <TabsContent value="global" className="space-y-6">
                    {/* Post Editor */}
                    <PostEditor onSuccess={() => fetchPosts()} />

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
                                        fetchPosts();
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
