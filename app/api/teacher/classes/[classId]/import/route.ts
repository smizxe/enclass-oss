
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        const prompt = `
You are an AI assistant specialized in digitizing Vietnamese English exams (TNPT format).
Analyze the following exam text and extract ALL questions into a structured JSON format.

**CRITICAL INSTRUCTIONS:**

1. **Question Types:**
   - MCQ (Multiple Choice): Has 4 options (A, B, C, D)
   - READING_MCQ: MCQ questions that reference a reading passage
   - ARRANGEMENT: Sentence/paragraph arrangement questions

2. **Reading Passages:**
   - For questions that reference a reading passage (e.g., "Read the following passage..."), include the FULL passage in the question's "passage" field.
   - Questions 23-30, 31-40 typically have reading passages.

3. **Explanations (Lời giải):**
   - IMPORTANT: After each question, there is usually a Vietnamese explanation starting with patterns like:
     - "Giải thích:", "Kiến thức:", "Tạm dịch:", "Thông tin:", "🡪Chọn đáp án"
   - Extract this ENTIRE explanation text into the "explanation" field.
   - If no explanation exists, set explanation to null.

4. **Content Extraction:**
   - Remove question number prefixes like "Question 1.", "Câu 1." from content.
   - For gap-fill questions, keep the blank indicator (e.g., "(1) _______").
   - Keep the original question text intact without translation.

5. **Correct Answer:**
   - Look for indicators: "🡪Chọn đáp án X", "Chọn đáp án X", "→ Chọn đáp án X"
   - Store only the answer letter (A, B, C, or D) in correctAnswer field.

**OUTPUT FORMAT (strictly valid JSON array):**
\`\`\`json
[
  {
    "type": "MCQ",
    "content": "The question text with _______ for blanks",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "A",
    "explanation": "Vietnamese explanation text here or null",
    "passage": "Full reading passage text if applicable, otherwise null"
  }
]
\`\`\`

**EXAM TEXT TO ANALYZE:**
"""
${text.substring(0, 60000)}
"""

Return ONLY the JSON array, no markdown code blocks, no additional text.
`;

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
            console.log("Raw Output:", jsonString.substring(0, 500));
            return new NextResponse("Failed to parse AI response", { status: 500 });
        }

        return NextResponse.json(questions);

    } catch (error) {
        console.log("[IMPORT_EXAM_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
