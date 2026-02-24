
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

    // --- GEMINI PROMPT with Enhanced Question Types ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI assistant specialized in digitizing Vietnamese English exams (TNPT format).
Analyze the following exam text and extract ALL questions into properly structured SECTIONS.

**CRITICAL FORMATTING RULES:**

1. **ORDERING/ARRANGEMENT QUESTIONS** (e.g., "sắp xếp câu", sentences to arrange):
   - These have multiple sentences labeled a, b, c, d, e that students must put in order
   - Output as type "ORDERING" with an "items" array
   - Each item should be on its own line, formatted as: "a. [sentence text]"
   - The options are the possible orderings (e.g., "b-e-d-a-c", "a-d-b-c-e")

2. **READING COMPREHENSION**:
   - Group questions that share the same reading passage
   - The passage MUST be stored in the section's "passage" field
   - Keep passage formatting with proper paragraphs

3. **GAP FILL (CLOZE)**:
   - Questions where students fill blanks in a passage
   - Store the passage with blanks like (1)___, (2)___ in section's "passage" field

**OUTPUT FORMAT (strictly valid JSON):**
{
  "sections": [
    {
      "title": "Section title (e.g., Gap Fill 1-6)",
      "type": "GAP_FILL | READING | STANDALONE | ORDERING",
      "passage": "Shared passage text if any, otherwise null",
      "passageTranslation": "Vietnamese translation if available, otherwise null",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ",
          "content": "Question text (for ORDERING: describe what to arrange)",
          "items": ["a. First sentence", "b. Second sentence", "c. Third sentence"],
          "options": ["A. a-b-c-d-e", "B. b-a-c-e-d", "C. c-a-b-d-e", "D. d-c-b-a-e"],
          "correctAnswer": "B",
          "explanation": "Vietnamese explanation or null"
        }
      ]
    }
  ]
}

**QUESTION TYPE RULES:**
- **MCQ**: Standard multiple choice with A, B, C, D options
- **ORDERING**: Sentence arrangement - MUST have "items" array with each sentence on separate line
- For ORDERING questions, the "content" should be a brief instruction like "Arrange the sentences in the correct order:"
- For ORDERING, "items" array contains sentences like ["a. First sentence here.", "b. Second sentence here.", ...]

**EXTRACTION RULES:**
1. Group questions by their shared passage/context
2. Look for "Đọc đoạn văn sau", "Read the following passage" to identify reading sections
3. Look for sentence arrangement clues like "a.", "b.", "c.", "d.", "e." followed by sentences
4. Extract Vietnamese explanations (look for "Giải thích:", "Tạm dịch:", "→Chọn đáp án")
5. correctAnswer should be just the letter (A, B, C, or D)
6. Remove "Question X." prefixes from content
7. Preserve paragraph breaks in passages using \\n

**EXAM TEXT:**
"""
${text.substring(0, 60000)}
"""

Return ONLY the JSON object, no markdown code blocks.
`;

    // Use standard generation to avoid stream parsing errors on Vercel
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fullText = response.text();

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
