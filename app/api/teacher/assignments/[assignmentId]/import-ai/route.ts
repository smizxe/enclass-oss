import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// extractTextFromPDF removed - using Multimodal input

// The prompt for Gemini to extract questions intelligently
const EXTRACTION_PROMPT = `You are an expert at analyzing English exam papers, especially IELTS Listening and Reading tests.

Analyze the following exam content and extract ALL questions in a structured JSON format.

IMPORTANT RULES:
1. Identify sections/parts (e.g., "Part 1", "Section 1", "Questions 1-5").
2. For each question, determine the type:
   - "MCQ" for multiple choice questions (has options A, B, C, D)
   - "GAP_FILL" for fill-in-the-blank / write-in questions
   - "ORDERING" for ordering/arrangement questions
3. Extract the question text, options (for MCQ), and correct answer if visible.
4. If there's a passage or audio transcript description, include it.
5. Assign 1 point per question unless specified otherwise.

FORMATTING RULES FOR TEXT CONTENT:
   - Bold text: **text**
   - Italic text: *text*
   - Underline text: __text__
   - **Tables / Gap Fills in Tables**: MUST use **HTML Table** format ('<table border="1" style="border-collapse: collapse; width: 100%;">...</table>'). DO NOT use Markdown tables.
   - Preserve paragraph breaks with double newlines.

**QUESTION TYPES:**
1. **ORDERING** (Sắp xếp câu):
   - Type: "ORDERING"
   - **items**: ["a. Sentence 1", "b. Sentence 2", ...]
   - **options**: ["A. a-b-c", "B. c-b-a", ...]

2. **READING / GAP_FILL**:
   - Group questions sharing a passage.
   - **passage**: Full text with **bold** formatting preserved. If the passage is a form/table, use HTML '<table>'.

3. **MCQ**: Standard multiple choice.
   - **passage**: Full text with **bold** formatting preserved. If the passage is a form/table, use HTML '<table>'.

OUTPUT FORMAT (JSON array):
[
  {
    "sectionTitle": "Part 1: Personal Information",
    "sectionType": "LISTENING",
    "passage": "Audio transcript or context description if any...",
    "questions": [
      {
        "type": "MCQ",
        "text": "What is the speaker's name?",
        "options": ["A. John", "B. Jane", "C. Jack", "D. Jill"],
        "correctAnswer": "A",
        "points": 1
      },
      {
        "type": "GAP_FILL",
        "text": "The meeting is scheduled for _______ o'clock.",
                                    "correctAnswer": "10",
                                    "points": 1
                                }
                            ]
}
]

If you cannot determine the correct answer, use an empty string "".
For GAP_FILL, the correctAnswer should be the expected text to fill in.
For MCQ, the correctAnswer should be the letter(A, B, C, or D).

Here is the exam content to analyze:

`;

export async function POST(
    req: Request,
    { params }: { params: Promise<{ assignmentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "TEACHER") {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { assignmentId } = await params;

        // Verify ownership
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { class: true }
        });

        if (!assignment || assignment.class.teacherId !== session.user.id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return new NextResponse("No file uploaded", { status: 400 });
        }

        const importType = formData.get("importType") as string || "MCQ";

        let dynamicPrompt = EXTRACTION_PROMPT;
        if (importType === "LISTENING") {
            dynamicPrompt = EXTRACTION_PROMPT.replace(
                "especially IELTS Listening and Reading tests",
                "specifically for an IELTS LISTENING test. The output MUST be grouped by Parts (Part 1, Part 2, etc.)"
            );
        }

        // Initialize Mammoth for DOCX
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mammoth = require("mammoth");

        let promptParts: any[] = [];
        let promptText = dynamicPrompt;

        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".pdf")) {
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString("base64");

            // Multimodal input for PDF (Full context)
            promptParts = [
                { text: dynamicPrompt },
                {
                    inlineData: {
                        mimeType: "application/pdf",
                        data: base64Data
                    }
                }
            ];
        } else if (fileName.endsWith(".docx")) {
            // Extract text for DOCX to save tokens
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            const docxText = result.value;

            promptParts = [
                { text: dynamicPrompt + "\n\n" + docxText }
            ];
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
            // Raw text
            const textContent = await file.text();
            promptParts = [
                { text: dynamicPrompt + "\n\n" + textContent }
            ];
        } else {
            return new NextResponse("Unsupported file type. Please upload PDF, DOCX, or TXT.", { status: 400 });
        }

        // Call Gemini AI
        // Using gemini-2.5-flash which supports PDF input
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = response.text();

        // Parse AI response
        // Clean up the response (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.slice(7);
        }
        if (jsonText.startsWith("```")) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith("```")) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        let sections;
        try {
            sections = JSON.parse(jsonText);
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            return new NextResponse("AI response parsing failed. Please try again.", { status: 500 });
        }

        if (!Array.isArray(sections) || sections.length === 0) {
            return new NextResponse("No questions extracted from the file", { status: 400 });
        }

        // Create questions in database
        const questionsToCreate = [];

        for (const section of sections) {
            const sectionTitle = section.sectionTitle || "Imported Questions";
            const sectionType = section.sectionType || "STANDALONE";
            const passage = section.passage || "";

            for (const q of section.questions || []) {
                // Build content JSON
                const contentJson = {
                    text: q.text || "",
                    options: q.options || [],
                    items: q.items || [],
                    sectionTitle: sectionTitle,
                    sectionType: sectionType,
                    passage: passage,
                    passageTranslation: ""
                };

                questionsToCreate.push({
                    assignmentId,
                    type: q.type || "MCQ",
                    content: JSON.stringify(contentJson),
                    correctAnswer: q.correctAnswer || "",
                    points: q.points || 1
                });
            }
        }

        if (questionsToCreate.length === 0) {
            return new NextResponse("No valid questions found in AI response", { status: 400 });
        }

        // Batch create questions
        await prisma.question.createMany({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data: questionsToCreate as any
        });

        return NextResponse.json({
            success: true,
            count: questionsToCreate.length,
            sections: sections.length
        });

    } catch (error) {
        console.error("[IMPORT_AI]", error);
        return new NextResponse("Internal Error: " + (error instanceof Error ? error.message : "Unknown"), { status: 500 });
    }
}
