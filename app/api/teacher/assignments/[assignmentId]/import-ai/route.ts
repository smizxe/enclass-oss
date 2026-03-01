import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

// Allow the function to run for the maximum time on Vercel (up to 5 mins on Pro)
export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Trimmed & optimized prompt for speed
const EXTRACTION_PROMPT = `You are an expert at analyzing English exam papers, especially IELTS Listening and Reading tests.

RULES:
1. Extract the ENTIRE document from first to last page. Do NOT skip or truncate any content.
2. Count extracted questions to match the document's numbering — ensure NOTHING is missing.
3. Scan the document (especially last pages) for "Answer Key", "Đáp án", "KEY", "ĐÁP ÁN". If found, use those answers. If NOT found, predict answers and set "predictedAnswer": true.
4. For GAP_FILL: correctAnswer = the EXACT word(s) that fill the blank. Never leave it empty.
5. EVERY section with reading questions MUST include the FULL reading passage in "passage". If multiple question groups share one passage, DUPLICATE the full passage into each group.
6. Preserve ALL task instructions ("Choose TWO letters", "Write NO MORE THAN TWO WORDS", etc.) in "passage" or the first question's "text".
7. Each question's "text" must be COMPLETE — include all text, bullet points, mini-passages. Use \\n for line breaks. Never truncate.
8. If a section has BOTH text AND a table/form: text → "passage", HTML table → "passageTable".
9. No duplicate questions. Each question appears ONCE.
10. Assign 1 point per question unless specified otherwise.
11. **GAP_FILL INLINE MARKERS (CRITICAL):** For note completion, table completion, summary completion, diagram labeling, or ANY section where blanks appear inside structured text:
    - In "passage", embed markers {N} at the EXACT position of each blank (N = question number).
    - Example: if question 7's blank is after "various parts of a tree and", write: "various parts of a tree and {7}"
    - The "text" field for each GAP_FILL question should still contain the surrounding context text.
    - This preserves the original exam layout so students see the structured notes with blanks in context.

FORMATTING:
- Bold: **text**, Italic: *text*, Underline: __text__
- Tables: HTML format (<table border="1" style="border-collapse: collapse; width: 100%;">...</table>)
- Line breaks: \\n

QUESTION TYPES:
- MCQ: options MUST include all choices. correctAnswer = letter (A/B/C/D)
- GAP_FILL: correctAnswer = exact fill text. In passage, mark blank position with {N} where N is questionNumber.
- ORDERING: items=["a. ..."], options=["A. a-b-c", ...]
- TRUE/FALSE/NOT GIVEN: type="MCQ", options=["TRUE","FALSE","NOT GIVEN"], correctAnswer="TRUE"/"FALSE"/"NOT GIVEN"

OUTPUT JSON:
{
    "hasAnswerKey": true,
    "sections": [
        {
            "sectionTitle": "Part 1: Questions 1-7",
            "sectionType": "READING",
            "passage": "[FULL reading passage]\\n\\n**Choose the correct letter A, B, C or D.**",
            "passageTable": "",
            "questions": [
                {
                    "type": "MCQ",
                    "text": "What is the main idea?",
                    "options": ["A. The history", "B. The purpose", "C. The location", "D. The ceremony"],
                    "correctAnswer": "B",
                    "predictedAnswer": false,
                    "points": 1
                }
            ]
        }
    ]
}

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

        // Optimized model config: JSON mode + low temperature for speed & accuracy
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-pro-preview",
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
            }
        });

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const text = response.text();

        // Parse AI response (JSON mode produces clean output, but add safety fallback)
        let jsonText = text.trim();
        if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        const firstBrace = jsonText.indexOf("{");
        const lastBrace = jsonText.lastIndexOf("}");
        if (firstBrace > 0 && lastBrace !== -1) {
            jsonText = jsonText.substring(firstBrace, lastBrace + 1);
        }

        let sections;
        let hasAnswerKey = true; // Assume has answer key unless told otherwise
        try {
            const parsed = JSON.parse(jsonText);

            // Handle new format: { hasAnswerKey: boolean, sections: [...] }
            if (parsed.sections && Array.isArray(parsed.sections)) {
                sections = parsed.sections;
                hasAnswerKey = parsed.hasAnswerKey ?? true;
            }
            // Handle old format: direct array of sections
            else if (Array.isArray(parsed)) {
                sections = parsed;
            } else {
                throw new Error("Invalid response format");
            }
        } catch (parseError) {
            console.error("Failed to parse AI response:", text);
            return new NextResponse("AI response parsing failed. Please try again.", { status: 500 });
        }

        if (!Array.isArray(sections) || sections.length === 0) {
            return new NextResponse("No questions extracted from the file", { status: 400 });
        }

        // Log warning if answers were predicted
        if (!hasAnswerKey) {
            console.log("[IMPORT_AI] ⚠️ No Answer Key found - AI predicted answers");
        }

        // 🔧 POST-PROCESSING: Clean up duplicate option prefixes (e.g., "A. A. text" -> "A. text")
        for (const section of sections) {
            for (const q of section.questions || []) {
                if (q.options && Array.isArray(q.options)) {
                    q.options = q.options.map((opt: string) => {
                        // Remove duplicate letter prefixes like "A. A." or "B. B."
                        return opt.replace(/^([A-D])\.\s*\1\.\s*/i, '$1. ');
                    });
                }
            }
        }

        // 🔧 POST-PROCESSING: Auto-extract tables from passage if AI missed it
        for (const section of sections) {
            if (section.passage && !section.passageTable) {
                // Check if passage contains table HTML
                const tableMatch = section.passage.match(/<table[\s\S]*?<\/table>/i);

                if (tableMatch) {
                    // Extract table HTML
                    section.passageTable = tableMatch[0];

                    // Remove table from passage
                    section.passage = section.passage.replace(/<table[\s\S]*?<\/table>/i, '').trim();

                    console.log(`[POST-PROCESSING] Extracted table from passage in section: ${section.sectionTitle}`);
                }
            }
        }

        // Create questions in database
        const questionsToCreate = [];

        for (const section of sections) {
            const sectionTitle = section.sectionTitle || "Imported Questions";
            const sectionType = section.sectionType || "STANDALONE";
            const passage = section.passage || "";
            const passageTable = section.passageTable || "";

            for (const q of section.questions || []) {
                // Build content JSON
                const contentJson = {
                    text: q.text || "",
                    options: q.options || [],
                    items: q.items || [],
                    sectionTitle: sectionTitle,
                    sectionType: sectionType,
                    passage: passage,
                    passageTable: passageTable,
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

        revalidateTeacherTags(session.user.id);
        await revalidateStudentsForClass(assignment.classId);

        return NextResponse.json({
            success: true,
            count: questionsToCreate.length,
            sections: sections.length,
            hasAnswerKey: hasAnswerKey,
            message: hasAnswerKey
                ? `Đã import ${questionsToCreate.length} câu hỏi thành công.`
                : `⚠️ Không tìm thấy Answer Key - AI đã tự dự đoán đáp án cho ${questionsToCreate.length} câu. Vui lòng kiểm tra lại!`
        });

    } catch (error) {
        console.error("[IMPORT_AI]", error);
        return new NextResponse("Internal Error: " + (error instanceof Error ? error.message : "Unknown"), { status: 500 });
    }
}
