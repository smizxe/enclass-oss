
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

// Allow streaming responses up to 5 minutes
export const maxDuration = 300;

export async function POST(
    req: Request
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

        // --- MAMMOTH: Extract HTML to preserve formatting ---
        try {
            const options = {
                buffer,
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "b => strong",
                    "i => em",
                    "u => u",
                    "strike => s"
                ]
            };

            const result = await mammoth.convertToHtml(options);
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
You are an expert AI specialized in digitizing English exams (TNPT format).
Your task is to extract questions from the provided HTML/Text content into a structured JSON.

**🔥 CRITICAL PERFORMANCE & PRECISION RULES 🔥**
1.  **NO LOOPS**: Process questions sequentially. DO NOT repeat questions. If you see the same question twice, ignore the duplicate.
2.  **SPEED**: Output ONLY the JSON. No preamble.
3.  **FORMATTING PRESERVATION (VERY IMPORTANT)**:
    -   The input contains HTML tags like **<strong>**, *<em>*, <u><u></u>.
    -   **YOU MUST PRESERVE THESE TAGS** in the "content" and "passage" fields.
    -   Example: "Choose the word <u>closest</u> in meaning" -> Keep the <u> tag.
    -   Preserve paragraph breaks. Use HTML <p> tags or double newlines \\n\\n for passages.

**QUESTION TYPES:**
1.  **ORDERING** (Sắp xếp câu):
    -   Identify questions where sentences are labeled (a, b, c...) and need reordering.
    -   Output type: "ORDERING".
    -   **items**: Array of sentences ["a. Text...", "b. Text..."].
    -   **options**: Array of answer choices ["A. a-b-c", "B. c-b-a"].
2.  **READING / GAP_FILL**:
    -   Group questions sharing a passage.
    -   **passage**: *Keep rich text formatting (bold/italic/underline)*.
3.  **MCQ**: Standard multiple choice.

**OUTPUT STRUCTURE (Strict JSON):**
{
  "sections": [
    {
      "title": "Section Title",
      "type": "GAP_FILL | READING | STANDALONE | ORDERING",
      "passage": "Full passage with <b>HTML</b> tags and <p>paragraphs</p>...",
      "passageTranslation": "Vietnamese translation (optional)",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ | ORDERING",
          "content": "Question text with <u>formatting</u>...",
          "items": ["a. Item 1", "b. Item 2"], // Only for ORDERING
          "options": ["A. Option 1", "B. Option 2"],
          "correctAnswer": "A",
          "explanation": "Explanation..."
        }
      ]
    }
  ]
}

**INPUT CONTENT (HTML):**
"""
${text.substring(0, 80000)}
"""

**FINAL REMINDER:**
-   **PRESERVE <u>, <strong>, <em> TAGS.**
-   **DO NOT LOOP.**
-   **RETURN VALID JSON ONLY.**
`;

        // --- STREAMING RESPONSE ---
        const result = await model.generateContentStream(prompt);

        // Create a readable stream for SSE
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    for await (const chunk of result.stream) {
                        const chunkText = chunk.text();
                        // Send data as SSE event
                        const data = JSON.stringify({ chunk: chunkText });
                        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    }
                    // Signal completion
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                    controller.close();
                } catch (err) {
                    console.error("Stream error:", err);
                    controller.error(err);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.log("[IMPORT_STREAM_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
