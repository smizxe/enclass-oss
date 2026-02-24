
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Polyfills for pdf-parse in Node.js environment
if (!global.DOMMatrix) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).DOMMatrix = class DOMMatrix {
    constructor() { }
  };
}
if (!global.ImageData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).ImageData = class ImageData {
    constructor() { }
  };
}
if (!global.Path2D) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Path2D = class Path2D {
    constructor() { }
  };
}

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
    const fileName = file.name.toLowerCase();
    let text = "";

    // --- FILE PARSING: Support both DOCX and PDF ---
    try {
      if (fileName.endsWith(".docx")) {
        // Extract raw text for DOCX (formatting will be handled by AI using markdown)
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (fileName.endsWith(".pdf")) {
        // Extract text from PDF using dynamic import
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } else {
        return new NextResponse("Unsupported file format. Please upload .docx or .pdf", { status: 400 });
      }
    } catch (error) {
      console.error("File parsing error:", error);
      return new NextResponse("Error reading file", { status: 500 });
    }

    if (!text.trim()) {
      return new NextResponse("Empty file content", { status: 400 });
    }

    const importType = formData.get("importType") as string || "MCQ";

    // --- GEMINI PROMPT with Markdown Formatting ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let promptIntro = "You are an expert AI for digitizing Vietnamese English exams (TNPT format).";
    if (importType === "LISTENING") {
      promptIntro = "You are an expert at analyzing English exam papers, specifically IELTS LISTENING tests. The output MUST be grouped by Parts (Part 1, Part 2, etc.)";
    }

    const prompt = `
${promptIntro}
Extract ALL questions into structured JSON sections.

**🔥 CRITICAL RULES 🔥**
1. **NO LOOPS/DUPLICATES**: Each question appears ONCE.
2. **SPEED**: Output ONLY valid JSON. No preamble.
3. **FORMATTING**: Use **markdown** for formatting:
   - Bold text: **text**
   - Italic text: *text*
   - Underline text: __text__
   - Preserve paragraph breaks with double newlines.

**QUESTION TYPES:**
1. **ORDERING** (Sắp xếp câu):
   - Type: "ORDERING"
   - **items**: ["a. Sentence 1", "b. Sentence 2", ...]
   - **options**: ["A. a-b-c", "B. c-b-a", ...]

2. **READING / GAP_FILL**:
   - Group questions sharing a passage.
   - **passage**: Full text with **bold** formatting preserved.

3. **MCQ**: Standard multiple choice.

**JSON STRUCTURE:**
{
  "sections": [
    {
      "title": "Section Title",
      "type": "GAP_FILL | READING | STANDALONE | ORDERING",
      "passage": "Full passage with **bold** and *italic* using markdown...",
      "passageTranslation": "Vietnamese translation (optional)",
      "questions": [
        {
          "questionNumber": 1,
          "type": "MCQ | ORDERING",
          "content": "Question with **bold words**...",
          "items": ["a. Item 1", "b. Item 2"],
          "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
          "correctAnswer": "A",
          "explanation": "Explanation..."
        }
      ]
    }
  ]
}

**INPUT CONTENT:**
"""
${text.substring(0, 80000)}
"""

**RETURN VALID JSON ONLY.**
`;

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
