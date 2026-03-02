
import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * POST: Extract text from uploaded file and return it with the AI prompt + API key.
 * The actual Gemini AI call happens on the CLIENT side to bypass Vercel's 300s timeout.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "TEACHER") {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
        return new NextResponse("No file uploaded", { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const importType = formData.get("importType") as string || "MCQ";

    // --- Build the AI prompt (kept 100% identical) ---
    let promptIntro = "You are an expert AI for digitizing English exams (IELTS Reading, Listening, TNPT format, and general English tests).";
    if (importType === "LISTENING") {
        promptIntro = "You are an expert at analyzing English exam papers, specifically IELTS LISTENING tests. The output MUST be grouped by Parts (Part 1, Part 2, etc.)";
    }

    const promptBase = `
${promptIntro}

RULES:
1. Extract the ENTIRE document from first to last page. Do NOT skip or truncate any content.
2. Count extracted questions to match the document's numbering — ensure NOTHING is missing.
3. Scan the document (especially last pages) for "Answer Key", "Đáp án", "KEY", "Answers", "ĐÁP ÁN". If found, use those answers. If NOT found, predict answers and set "predictedAnswer": true.
4. For GAP_FILL: correctAnswer = the EXACT word(s) that fill the blank. Never leave it empty.
5. EVERY section with reading questions MUST include the FULL reading passage in "passage". The "passage" field must contain ONLY the reading passage text — do NOT include task instructions, note structures, or question text in "passage".
6. Preserve ALL task instructions ("Choose TWO letters", "Write NO MORE THAN TWO WORDS", etc.) in the first question's "content" field.
7. Each question's "content" must be COMPLETE — include all text, bullet points, mini-passages. Use \\n for line breaks. Never truncate.
8. If a section has BOTH text AND a table/form: text → "passage", HTML table → "passageTable" (or "notePassage" if it's a gap-fill table). **Crucially**: Preserve original formatting.
9. No duplicate questions. Each question appears ONCE.
10. **GAP_FILL IN PASSAGE (CRITICAL):**
    - If a reading passage has numbered blanks (e.g., "(10) ______" or "11. _____"), you MUST REPLACE the original number AND blank with a SINGLE {N} marker.
    - IMPORTANT: Do NOT keep BOTH formats. REPLACE "(10) ______" with just "{10}". Never output "(10) {10}" — that is WRONG and causes duplication.
    - Example: "Are you passionate about (10) _____ causes?" → "Are you passionate about {10} causes?"
    - Example: "11. _____ encouraging young people" → "{11} encouraging young people"
11. **GAP_FILL NOTE/SUMMARY COMPLETION (CRITICAL):** For note completion, table completion, summary completion, diagram labeling:
    - Put the main READING PASSAGE in "passage" (as normal).
    - Put the NOTE/SUMMARY/TABLE structure (with blanks) in a SEPARATE field called "notePassage".
    - In "notePassage", REPLACE each blank position with a SINGLE {N} marker (N = question number). Do NOT keep both "(N)" and "{N}" — only "{N}".
    - Use \\n for line breaks to preserve the original layout perfectly.
    - KEEP FULL FORMATTING: If the note has headings, bullet points, or bold text, YOU MUST PRESERVE THEM EXACTLY. DO NOT STRIP FORMATTING.
12. **EXPLANATION (REQUIRED):** For EVERY question, you MUST provide a concise explanation in Vietnamese in the "explanation" field.

FORMATTING (CRITICAL - DO NOT IGNORE):
- You MUST preserve original text formatting perfectly using Markdown.
- Headings/Titles: Use Markdown headings (# Heading 1, ## Heading 2, ### Heading 3). DO NOT output plain text for titles.
- Bold: **text**, Italic: *text*, Underline: <u>text</u>
- Lists: Preserve bullet points (•, -, *) and numbered lists (1., 2.).
- Tables: HTML format (<table border="1" style="border-collapse: collapse; width: 100%;">...</table>). Ensure table headers and alignment are preserved.
- Line breaks: Use \\n for EVERY line break from the original document. Do not merge paragraphs!

QUESTION TYPES:
- ORDERING: items=["a. ...", "b. ..."], options=["A. a-b-c", "B. c-b-a", ...]
- TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN: type="MCQ", options=["TRUE","FALSE","NOT GIVEN"] or ["YES","NO","NOT GIVEN"], correctAnswer="TRUE"/"FALSE"/"NOT GIVEN"
- GAP_FILL: correctAnswer = exact fill text. In passage, mark blank position with {N} where N is questionNumber.
- MCQ: The "content" field MUST contain ONLY the question stem (the question sentence with blank). Do NOT include options like "A. xxx B. yyy C. zzz D. www" in the "content" field. The "options" array MUST contain the FULL TEXT of each choice (e.g., ["physicist", "physician", "physical", "physics"]), NOT just letters like ["A", "B", "C", "D"]. correctAnswer = letter (A/B/C/D).
- PHONETICS/PRONUNCIATION/STRESS MCQ (CRITICAL): For questions about pronunciation or word stress (e.g., "the word whose underlined part differs", "the word that has different stress"), you MUST wrap the underlined letters/syllables in <u></u> tags within EACH option. Example: options=["sh<u>ow</u>", "p<u>o</u>st", "l<u>o</u>ck", "n<u>o</u>te"]. NEVER omit the <u> tags for these question types — students need to see which part is underlined.

OUTPUT JSON:
{
  "hasAnswerKey": true,
  "sections": [
    {
      "title": "Part 1: Questions 1-7",
      "type": "READING",
      "passage": "[FULL reading passage text ONLY — no instructions or note structures]",
      "notePassage": "[For GAP_FILL note/summary/diagram completion sections ONLY: the note structure with {N} markers. Use \\n for line breaks. Leave empty string for MCQ/other sections]",
      "passageTable": "",
      "passageTranslation": "",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ",
          "content": "What is the main idea?",
          "items": [],
          "options": ["The history", "The purpose", "The location", "The ceremony"],
          "correctAnswer": "B",
          "predictedAnswer": false,
          "explanation": "Đáp án B đúng vì đoạn văn chủ yếu nói về mục đích (the purpose) của sự kiện."
        }
      ]
    }
  ]
}
`;

    // --- Extract text from the uploaded file ---
    try {
        let extractedText = "";
        let fileType: "pdf" | "docx" | "text" = "text";

        if (fileName.endsWith(".pdf")) {
            // For PDF: send as base64 for client-side multimodal input
            const arrayBuffer = await file.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString("base64");

            return NextResponse.json({
                prompt: promptBase,
                fileType: "pdf",
                base64Data,
                apiKey: process.env.GOOGLE_API_KEY || "",
            });
        } else if (fileName.endsWith(".docx")) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const result = await mammoth.extractRawText({ buffer });
            extractedText = result.value;
            fileType = "docx";
        } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
            extractedText = await file.text();
            fileType = "text";
        } else {
            return new NextResponse("Unsupported file format. Please upload .docx or .pdf", { status: 400 });
        }

        // For text-based files (DOCX, TXT): return extracted text
        return NextResponse.json({
            prompt: promptBase,
            fileType,
            extractedText: extractedText.substring(0, 80000),
            apiKey: process.env.GOOGLE_API_KEY || "",
        });

    } catch (error) {
        console.log("[IMPORT_EXTRACT_ERROR]", error);
        return new NextResponse("Error extracting text from file", { status: 500 });
    }
}
