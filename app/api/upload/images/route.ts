import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file received." }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const filename = `community/${Date.now()}_${file.name.replaceAll(" ", "_")}`;

        // Upload to Supabase Storage 'images' bucket
        const { data, error } = await supabase
            .storage
            .from('images')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error("Supabase storage error:", error);
            return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
        }

        // Get Public URL
        const { data: publicUrlData } = supabase
            .storage
            .from('images')
            .getPublicUrl(filename);

        return NextResponse.json({
            url: publicUrlData.publicUrl,
            success: true
        });
    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Upload failed." }, { status: 500 });
    }
}
