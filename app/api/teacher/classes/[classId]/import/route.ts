
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

    // --- GEMINI PROMPT with Sections ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI assistant specialized in digitizing Vietnamese English exams (TNPT format).
Analyze the following exam text and extract ALL questions into SECTIONS.

**CRITICAL: Output must be grouped into SECTIONS**

Each section represents a group of questions that share a common passage or context.

**SECTION TYPES:**
1. **GAP_FILL**: Questions that fill blanks in a passage (e.g., Questions 1-6, 7-12)
2. **READING**: Reading comprehension with shared passage (e.g., Questions 23-30, 31-40)
3. **STANDALONE**: Independent MCQ questions without shared passage

**OUTPUT FORMAT (strictly valid JSON):**
{
  "sections": [
    {
      "title": "Gap Fill (Questions 1-6)",
      "type": "GAP_FILL",
      "passage": "The shared passage text with blanks like (1) _______, (2) _______ etc.",
      "passageTranslation": "Vietnamese translation if available, otherwise null",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ",
          "content": "Question 1 content (can be empty if the blank is in the passage)",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "D",
          "explanation": "Vietnamese explanation or null"
        }
      ]
    },
    {
      "title": "Reading (Questions 23-30)",
      "type": "READING",
      "passage": "Full reading passage text...",
      "passageTranslation": "Vietnamese translation if available",
      "questions": [...]
    }
  ]
}

**EXTRACTION RULES:**
1. Group questions by their shared passage/context
2. For GAP_FILL: passage contains the blanks, questions have the options for each blank
3. For READING: passage is the reading text, questions ask about the passage
4. Extract Vietnamese explanations (look for "Giải thích:", "Tạm dịch:", "🡪Chọn đáp án")
5. correctAnswer should be just the letter (A, B, C, or D)
6. Remove "Question X." prefixes from content

**EXAM TEXT TO ANALYZE:**
"""
${text.substring(0, 60000)}
"""

Return ONLY the JSON object, no markdown code blocks.
`;

    // Use streaming for faster response
    const streamResult = await model.generateContentStream(prompt);

    let fullText = "";
    for await (const chunk of streamResult.stream) {
      fullText += chunk.text();
    }

    // Clean up markdown code blocks if present
    const jsonString = fullText.replace(/```json/g, "").replace(/```/g, "").trim();

    let data;
    try {
      data = JSON.parse(jsonString);
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
