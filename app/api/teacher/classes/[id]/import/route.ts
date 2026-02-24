
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

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

    // Optimized model config: JSON mode + low temperature for speed & accuracy
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
        }
    });

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
5. EVERY section with reading questions MUST include the FULL reading passage in "passage". If multiple question groups share one passage, DUPLICATE the full passage into each group.
6. Preserve ALL task instructions ("Choose TWO letters", "Write NO MORE THAN TWO WORDS", etc.) in "passage" or the first question's "content".
7. Each question's "content" must be COMPLETE — include all text, bullet points, mini-passages. Use \\n for line breaks. Never truncate.
8. If a section has BOTH text AND a table/form: text → "passage", HTML table → "passageTable".
9. No duplicate questions. Each question appears ONCE.

FORMATTING:
- Bold: **text**, Italic: *text*, Underline: __text__
- Tables: HTML format (<table border="1" style="border-collapse: collapse; width: 100%;">...</table>)
- Line breaks: \\n

QUESTION TYPES:
- ORDERING: items=["a. ...", "b. ..."], options=["A. a-b-c", "B. c-b-a", ...]
- TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN: type="MCQ", options=["TRUE","FALSE","NOT GIVEN"] or ["YES","NO","NOT GIVEN"], correctAnswer="TRUE"/"FALSE"/"NOT GIVEN"
- GAP_FILL: correctAnswer = exact fill text
- MCQ: options MUST include all choices. correctAnswer = letter (A/B/C/D)

OUTPUT JSON:
{
  "hasAnswerKey": true,
  "sections": [
    {
      "title": "Part 1: Questions 1-7",
      "type": "READING",
      "passage": "[FULL reading passage text]\\n\\n**Choose the correct letter A, B, C or D.**",
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
          "explanation": ""
        }
      ]
    }
  ]
}
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

    // Direct non-streaming call — faster than SSE since we need full JSON
    try {
        const result = await model.generateContent(promptParts);
        const response = await result.response;
        const fullText = response.text();

        // With responseMimeType: application/json, output should be clean JSON
        // But still do safety extraction in case of edge cases
        let jsonString = fullText.trim();
        if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
        }
        const firstBrace = jsonString.indexOf("{");
        const lastBrace = jsonString.lastIndexOf("}");
        if (firstBrace > 0 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }

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
