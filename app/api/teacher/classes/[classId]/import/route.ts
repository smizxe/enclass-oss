
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export async function POST(
    req: Request,
    { params: _params }: { params: { classId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = "";

        try {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } catch (error) {
            console.error("Mammoth error:", error);
            return new NextResponse("Error reading file", { status: 500 });
        }

        if (!text.trim()) {
            return new NextResponse("Empty file content", { status: 400 });
        }

        // --- GEMINI PROMPT ---
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
    You are an AI assistant helping a teacher digitize their exams.
    Extract questions from the following text and return a valid JSON array.
    
    The text is from a docx file and might contain random line breaks or formatting artifacts.
    Identify Multiple Choice Questions (MCQ) and Essay questions (if any).
    
    Output format must be a strictly valid JSON array of objects:
    [
      {
        "type": "MCQ", // or "ESSAY"
        "content": "Question content here...",
        "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"], // Only for MCQ. remove "A.", "B." prefix if possible, but keep it if unsure.
        "correctAnswer": "Option 1" // For MCQ, try to identify the correct answer if marked (e.g. bold, underlined, asterisk, or answer key at end). If unknown, leave empty string.
      }
    ]

    If there are reading passages, include them in the "content" of the question or as a separate "ESSAY" type if it's a writing prompt.
    For MCQ, ensure "options" is an array of strings.
    For Essay, "options" and "correctAnswer" can be omitted or null.

    Text content to analyze:
    """
    ${text.substring(0, 30000)} 
    """
    `;
        // Limit text to 30k chars to be safe with tokens, though Flash can handle more.

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonString = response.text();

        // Clean up markdown code blocks if Gemini returns them
        jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

        let questions = [];
        try {
            questions = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Output:", jsonString);
            return new NextResponse("Failed to parse AI response", { status: 500 });
        }

        return NextResponse.json(questions);

    } catch (error) {
        console.log("[IMPORT_EXAM_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
