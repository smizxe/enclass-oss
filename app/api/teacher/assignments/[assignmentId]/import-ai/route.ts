import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
    revalidateStudentsForClass,
    revalidateTeacherTags
} from "@/lib/cache-invalidation";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// The prompt for Gemini to extract questions intelligently
const EXTRACTION_PROMPT = `You are an expert at analyzing English exam papers, especially IELTS Listening and Reading tests.

🔴🔴🔴 ABSOLUTE RULE - COMPLETE DOCUMENT EXTRACTION (HIGHEST PRIORITY) 🔴🔴🔴
You MUST read and process the ENTIRE document from the VERY FIRST line/page to the VERY LAST line/page.
- Do NOT skip any content at the BEGINNING of the document (page 1, headers, titles, instructions).
- Do NOT skip any content at the END of the document (last pages, answer keys, appendices).
- Do NOT truncate or summarize. Extract EVERY SINGLE question, passage, and section.
- Process ALL pages: page 1, page 2, page 3... until the very last page.
- If the document has 50 questions, output ALL 50. If it has 100, output ALL 100.
- Count your extracted questions and compare with question numbers in the document to ensure NOTHING is missing.

Analyze the following exam content and extract ALL questions in a structured JSON format.

🔴 CRITICAL RULE #1 - ANSWER KEY DETECTION (VERY IMPORTANT):
   1. FIRST, scan the ENTIRE document (especially the LAST pages) for a section named "Answer Key", "Đáp án", "KEY", "Answers", "Lời giải", "ĐÁP ÁN", "ANSWER KEY" or similar.
   2. If found, use those answers to populate "correctAnswer" for each question.
   3. If NOT found anywhere in the document, you MUST predict the most likely answer based on:
      - Context clues in the passage
      - Grammar rules
      - Logical reasoning
   4. Add "predictedAnswer": true to each question where you predicted (not found in answer key).

🔴 CRITICAL RULE #2 - GAP_FILL ANSWER EXTRACTION:
   For GAP_FILL questions (fill-in-the-blank):
   1. The correctAnswer should be the EXACT word(s) that fill the blank.
   2. Look in the Answer Key section for the gap fill answers.
   3. If the answer key shows "1. information" or "1. TRUE" etc., use that exact text.
   4. Do NOT leave correctAnswer empty for gap fill questions.

🔴 CRITICAL RULE #3 - TABLE SEPARATION (MUST FOLLOW):
   IF a section contains BOTH intro text AND a table/form:
   ✅ CORRECT: Put intro text in "passage" field, put ONLY the <table>...</table> HTML code in "passageTable" field
   ❌ WRONG: Do NOT put the table HTML inside "passage" field
   
   Example CORRECT output:
   {
     "passage": "Complete the form below. Write ONE WORD AND/OR A NUMBER for each answer.",
     "passageTable": "<table border='1'><tr><th>Name</th><td>______</td></tr></table>"
   }

🔴🔴🔴 CRITICAL RULE #4 - READING PASSAGE MUST BE LINKED (VERY IMPORTANT) 🔴🔴🔴
   For IELTS Reading tests, EVERY section/part that has questions about a reading passage MUST include the FULL reading passage text in the "passage" field.
   - If the document has a long reading passage followed by multiple question groups (e.g., Questions 1-5 MCQ, Questions 6-10 GAP_FILL), ALL those groups MUST include the SAME full reading passage in their "passage" field.
   - Do NOT create a section with questions but an empty/missing passage if those questions reference a reading text.
   - If multiple Parts share one reading passage, DUPLICATE the full passage into each Part's "passage" field.
   - The passage must be COMPLETE - do NOT shorten, summarize, or truncate it.
   
   ❌ WRONG: { "sectionTitle": "Part 2: Questions 6-10", "passage": "", "questions": [...] }
   ✅ CORRECT: { "sectionTitle": "Part 2: Questions 6-10", "passage": "[THE FULL READING PASSAGE TEXT]", "questions": [...] }

🔴 CRITICAL RULE #5 - PRESERVE ALL TASK INSTRUCTIONS AND INTRO TEXT:
   Many IELTS sections have instruction lines BEFORE the questions, such as:
   - "Choose TWO letters, A-E."
   - "Complete the sentences below. Write NO MORE THAN TWO WORDS."
   - "Which paragraph contains the following information?"
   - A list of items/statements to match (like bullet lists)
   - A small descriptive paragraph explaining the task
   
   These MUST be preserved! Rules:
   1. If the instruction applies to ALL questions in the section, put it at the BEGINNING of the "passage" field (before the reading text, separated by a newline).
   2. If the instruction is a task-specific intro that only applies to a sub-group of questions, include it in the FIRST question's "text" field of that sub-group, prefixed before the actual question.
   3. NEVER drop or skip instruction lines. They are critical for students to understand what to do.
   
   Example: If the exam says:
   "Questions 8-9: Choose TWO letters, A-E. Which TWO of the following are mentioned?"
   Then question 8's text should be: "**Choose TWO letters, A-E.**\\nWhich TWO of the following are mentioned?"

🔴 CRITICAL RULE #6 - COMPLETE QUESTION CONTENT (NEVER TRUNCATE):
   Each question's "text" field must contain ALL text that belongs to that question:
   - If a question has a mini-passage, introductory sentence, or context paragraph before the actual question stem, include ALL of it.
   - If there are bullet points, numbered lists, or example items within a question, include ALL of them.
   - If the question references a small text excerpt (not the main passage), include it in the "text" field.
   - NEVER drop the first line of a question's content. The first line often contains critical context.
   
   ❌ WRONG (first line dropped): { "text": "What is the main purpose of the center?" }
   ✅ CORRECT (all content preserved): { "text": "Read the following announcement and answer the question.\\nThe Riverside Community Center opened in 2019...\\nWhat is the main purpose of the center?" }

IMPORTANT RULES:
1. Identify sections/parts (e.g., "Part 1", "Section 1", "Questions 1-5").
2. For each question, determine the type:
   - "MCQ" for multiple choice questions (has options A, B, C, D)
   - "GAP_FILL" for fill-in-the-blank / write-in questions
   - "ORDERING" for ordering/arrangement questions
3. Extract the question text, options (for MCQ), and correct answer.
4. If there's a passage or audio transcript description, include it.
5. Assign 1 point per question unless specified otherwise.

FORMATTING RULES FOR TEXT CONTENT:
   - Bold text: **text**
   - Italic text: *text*
   - Underline text: __text__
   - **Tables / Gap Fills in Tables**: ALWAYS extract tables separately into "passageTable" field. Use HTML Table format ('<table border="1" style="border-collapse: collapse; width: 100%;">...</table>'). DO NOT use Markdown tables.
   - Preserve paragraph breaks with double newlines.

**QUESTION TYPES:**
1. **ORDERING** (Sắp xếp câu):
   - Type: "ORDERING"
   - **items**: ["a. Sentence 1", "b. Sentence 2", ...]
   - **options**: ["A. a-b-c", "B. c-b-a", ...]

2. **READING / GAP_FILL**:
   - Group questions sharing a passage.
   - **passage**: The FULL reading passage text + any task instructions. Do NOT shorten or omit.
   - **passageTable**: The COMPLETE HTML Table code (\`<table...>...</table>\`) if present. ALWAYS separate tables from text.

3. **MCQ**: Standard multiple choice.
   - **passage**: Reading passage + intro text.
   - **passageTable**: HTML Table (if any) goes HERE, NOT in "passage".

OUTPUT FORMAT (JSON):
{
    "hasAnswerKey": true/false,
    "sections": [
        {
            "sectionTitle": "Part 1: Questions 1-7",
            "sectionType": "READING",
            "passage": "Read the following passage and answer Questions 1-7.\\n\\n[THE FULL READING PASSAGE TEXT - NEVER OMIT THIS]",
            "passageTable": "",
            "questions": [
                {
                    "type": "MCQ",
                    "text": "**Choose the correct letter A, B, C or D.**\\nWhat is the main idea of the first paragraph?",
                    "options": ["A. The history of the building", "B. The purpose of the center", "C. The location details", "D. The opening ceremony"],
                    "correctAnswer": "B",
                    "predictedAnswer": false,
                    "points": 1
                }
            ]
        },
        {
            "sectionTitle": "Part 2: Questions 8-13",
            "sectionType": "READING",
            "passage": "[SAME FULL READING PASSAGE if questions reference the same text]\\n\\n**Complete the sentences below. Write NO MORE THAN TWO WORDS for each answer.**",
            "questions": [
                {
                    "type": "GAP_FILL",
                    "text": "The center was originally built as a _____.",
                    "correctAnswer": "warehouse",
                    "predictedAnswer": false,
                    "points": 1
                }
            ]
        }
    ]
}

For MCQ, the correctAnswer should be the letter (A, B, C, or D).
For GAP_FILL, the correctAnswer should be the expected text to fill in.
For ORDERING, the correctAnswer should be the correct sequence (e.g., "B" if option B is correct).

⚠️ FINAL CHECKLIST BEFORE OUTPUTTING:
- Have I extracted content from the FIRST page? ✅
- Have I extracted content from the LAST page? ✅
- Did I count questions to match the document's numbering? ✅
- ALWAYS include "hasAnswerKey" field at the root level ✅
- Set "predictedAnswer": true if you predicted the answer ✅
- Does EVERY question have a "correctAnswer" filled? ✅
- If you see a table/form, is it in "passageTable" field, NOT in "passage" field? ✅
- Does EVERY Reading section include the FULL reading passage in "passage"? ✅
- Are ALL task instructions (Choose TWO, Write NO MORE THAN...) preserved? ✅
- Is EVERY question's "text" field COMPLETE with no truncated content? ✅

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

        // Call Gemini AI
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
