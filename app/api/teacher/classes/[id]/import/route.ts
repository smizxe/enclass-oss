
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Helper to send SSE messages
function sendSSE(controller: ReadableStreamDefaultController, event: string, data: any) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
}

export async function POST(
    req: Request
) {
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
    const useStreaming = formData.get("streaming") === "true";

    // Fast model for speed
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let promptIntro = "You are an expert AI for digitizing Vietnamese English exams (TNPT format).";
    if (importType === "LISTENING") {
        promptIntro = "You are an expert at analyzing English exam papers, specifically IELTS LISTENING tests. The output MUST be grouped by Parts (Part 1, Part 2, etc.)";
    }

    const promptBase = `
${promptIntro}

🔴🔴🔴 ABSOLUTE RULE - COMPLETE DOCUMENT EXTRACTION (HIGHEST PRIORITY) 🔴🔴🔴
You MUST read and process the ENTIRE document from the VERY FIRST line/page to the VERY LAST line/page.
- Do NOT skip any content at the BEGINNING of the document (page 1, headers, titles, instructions).
- Do NOT skip any content at the END of the document (last pages, answer keys, appendices).
- Do NOT truncate or summarize. Extract EVERY SINGLE question, passage, and section.
- Process ALL pages: page 1, page 2, page 3... until the very last page.
- If the document has 50 questions, output ALL 50. If it has 100, output ALL 100.
- Count your extracted questions and compare with question numbers in the document to ensure NOTHING is missing.

Extract ALL questions into structured JSON sections.

**🔴 CRITICAL RULE #1 - ANSWER KEY DETECTION (VERY IMPORTANT):**
1. FIRST, scan the ENTIRE document (especially the LAST pages) for a section named "Answer Key", "Đáp án", "KEY", "Answers", "Lời giải", "ĐÁP ÁN", "ANSWER KEY" or similar.
2. If found, use those answers to populate "correctAnswer" for each question.
3. If NOT found anywhere in the document, you MUST predict the most likely answer based on:
   - Context clues in the passage
   - Grammar rules
   - Logical reasoning
4. Add "predictedAnswer": true to each question where you predicted (not found in answer key).

**🔴 CRITICAL RULE #2 - GAP_FILL ANSWER EXTRACTION:**
For GAP_FILL questions (fill-in-the-blank):
1. The correctAnswer should be the EXACT word(s) that fill the blank.
2. Look in the Answer Key section for the gap fill answers.
3. If the answer key shows "1. information" or "1. TRUE" etc., use that exact text.
4. Do NOT leave correctAnswer empty for gap fill questions.

**🔥 OTHER CRITICAL RULES 🔥**
1. **NO LOOPS/DUPLICATES**: Each question appears ONCE.
2. **SPEED**: Output ONLY valid JSON. No preamble, no explanation, no markdown fences.
3. **FORMATTING**: Use **markdown** for formatting:
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
   - **passage**: COMPLETE full text with **bold** formatting preserved. Do NOT shorten the passage. If the passage is a form/table, use HTML '<table>'.

3. **MCQ**: Standard multiple choice.

**JSON STRUCTURE:**
{
  "hasAnswerKey": true,
  "sections": [
    {
      "title": "Section Title",
      "type": "GAP_FILL | READING | STANDALONE | ORDERING",
      "passage": "Full passage text...",
      "passageTranslation": "",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ | GAP_FILL | ORDERING",
          "content": "Question text...",
          "items": [],
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correctAnswer": "A",
          "predictedAnswer": false,
          "explanation": ""
        }
      ]
    }
  ]
}

⚠️ FINAL CHECKLIST BEFORE OUTPUTTING:
- Have I extracted content from the FIRST page? ✅
- Have I extracted content from the LAST page? ✅
- Have I checked for Answer Key at the END of the document? ✅
- Is "hasAnswerKey" set correctly? ✅
- Does EVERY question have a "correctAnswer"? ✅
- Are GAP_FILL answers filled with actual words (not just letters)? ✅
- Did I count questions to match the document's numbering? ✅

**RETURN VALID JSON ONLY. NO MARKDOWN FENCES. NO PREAMBLE.**
`;

    // Prepare prompt parts based on file type
    let promptParts: any[] = [];

    if (fileName.endsWith(".pdf")) {
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString("base64");

        promptParts = [
            { text: promptBase },
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: base64Data
                }
            }
        ];
    } else if (fileName.endsWith(".docx")) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const result = await mammoth.extractRawText({ buffer });
        const docxText = result.value;

        promptParts = [
            { text: promptBase + `\n\n**INPUT CONTENT:**\n"""\n${docxText.substring(0, 80000)}\n"""` }
        ];
    } else if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        const textContent = await file.text();
        promptParts = [
            { text: promptBase + `\n\n**INPUT CONTENT:**\n"""\n${textContent.substring(0, 80000)}\n"""` }
        ];
    } else {
        return new NextResponse("Unsupported file format. Please upload .docx or .pdf", { status: 400 });
    }

    // STREAMING MODE: Use Server-Sent Events for real-time progress
    if (useStreaming) {
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial progress
                    sendSSE(controller, "progress", { stage: "analyzing", message: "Đang phân tích tài liệu..." });

                    // Use streaming generation
                    const result = await model.generateContentStream(promptParts);

                    let fullText = "";
                    let chunkCount = 0;

                    sendSSE(controller, "progress", { stage: "extracting", message: "Đang trích xuất câu hỏi..." });

                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        fullText += chunkText;
                        chunkCount++;

                        // Send progress updates every few chunks
                        if (chunkCount % 3 === 0) {
                            sendSSE(controller, "progress", {
                                stage: "extracting",
                                message: `Đang xử lý... (${Math.min(chunkCount * 10, 95)}%)`
                            });
                        }
                    }

                    sendSSE(controller, "progress", { stage: "parsing", message: "Đang hoàn tất..." });

                    // Parse the complete response
                    const jsonString = fullText.replace(/```json/g, "").replace(/```/g, "").trim();

                    try {
                        const data = JSON.parse(jsonString);

                        // Post-process: Clean up duplicate option prefixes
                        if (data.sections) {
                            for (const section of data.sections) {
                                for (const q of section.questions || []) {
                                    if (q.options && Array.isArray(q.options)) {
                                        q.options = q.options.map((opt: string) => {
                                            return opt.replace(/^([A-D])\.\s*\1\.\s*/i, '$1. ')
                                                .replace(/^([A-D])\.\s*/i, '');
                                        });
                                    }
                                }
                            }
                        }

                        sendSSE(controller, "complete", data);
                    } catch (e) {
                        console.error("JSON Parse Error:", e);
                        sendSSE(controller, "error", { message: "Lỗi phân tích kết quả AI" });
                    }

                    controller.close();
                } catch (error) {
                    console.error("[IMPORT_STREAM_ERROR]", error);
                    sendSSE(controller, "error", { message: "Lỗi kết nối AI" });
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });
    }

    // NON-STREAMING MODE: Standard request/response
    try {
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const fullText = response.text();

        const jsonString = fullText.replace(/```json/g, "").replace(/```/g, "").trim();

        let data;
        try {
            data = JSON.parse(jsonString);

            // Post-process: Clean up duplicate option prefixes
            if (data.sections) {
                for (const section of data.sections) {
                    for (const q of section.questions || []) {
                        if (q.options && Array.isArray(q.options)) {
                            q.options = q.options.map((opt: string) => {
                                return opt.replace(/^([A-D])\.\s*\1\.\s*/i, '$1. ')
                                    .replace(/^([A-D])\.\s*/i, '');
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Output:", jsonString.substring(0, 1000));
            return new NextResponse("Failed to parse AI response", { status: 500 });
        }

        return NextResponse.json(data);

    } catch (error) {
        console.log("[IMPORT_EXAM_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
