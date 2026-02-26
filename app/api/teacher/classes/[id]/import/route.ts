
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
5. EVERY section with reading questions MUST include the FULL reading passage in "passage". The "passage" field must contain ONLY the reading passage text — do NOT include task instructions, note structures, or question text in "passage". If multiple question groups share one passage, DUPLICATE the full passage into each group.
6. Preserve ALL task instructions ("Choose TWO letters", "Write NO MORE THAN TWO WORDS", etc.) in the first question's "content" field.
7. Each question's "content" must be COMPLETE — include all text, bullet points, mini-passages. Use \\n for line breaks. Never truncate.
8. If a section has BOTH text AND a table/form: text → "passage", HTML table → "passageTable".
9. No duplicate questions. Each question appears ONCE.
10. **GAP_FILL NOTE/SUMMARY COMPLETION (CRITICAL):** For note completion, table completion, summary completion, diagram labeling, or ANY section where blanks appear inside structured text:
    - Put the READING PASSAGE in "passage" (as normal, no markers).
    - Put the NOTE/SUMMARY/DIAGRAM structure (with blanks) in a SEPARATE field called "notePassage".
    - In "notePassage", embed markers {N} at the EXACT position of each blank (N = question number).
    - Use \\n for line breaks between bullet points/items in "notePassage" to preserve the original layout.
    - Example notePassage: "**New Zealand's kākāpō**\\nA type of parrot:\\n• diet consists of fern fronds, various parts of a tree and {7}\\n• nests are created {8} in where eggs are laid."
    - The "content" field for each GAP_FILL question should still contain the surrounding context text.
    - This separates the reading passage (shown on the left) from the note form (shown on the right).

FORMATTING:
- Bold: **text**, Italic: *text*, Underline: __text__
- Tables: HTML format (<table border="1" style="border-collapse: collapse; width: 100%;">...</table>)
- Line breaks: \\n

QUESTION TYPES:
- ORDERING: items=["a. ...", "b. ..."], options=["A. a-b-c", "B. c-b-a", ...]
- TRUE/FALSE/NOT GIVEN or YES/NO/NOT GIVEN: type="MCQ", options=["TRUE","FALSE","NOT GIVEN"] or ["YES","NO","NOT GIVEN"], correctAnswer="TRUE"/"FALSE"/"NOT GIVEN"
- GAP_FILL: correctAnswer = exact fill text. In passage, mark blank position with {N} where N is questionNumber.
- MCQ: The "content" field MUST contain ONLY the question stem (the question sentence with blank). Do NOT include options like "A. xxx B. yyy C. zzz D. www" in the "content" field. The "options" array MUST contain the FULL TEXT of each choice (e.g., ["physicist", "physician", "physical", "physics"]), NOT just letters like ["A", "B", "C", "D"]. correctAnswer = letter (A/B/C/D).

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

            // Post-process: Clean up options and extract inline options from content
            if (data.sections) {
                for (const section of data.sections) {
                    for (const q of section.questions || []) {
                        if (q.options && Array.isArray(q.options)) {
                            // Clean up duplicate letter prefixes first
                            q.options = q.options.map((opt: string) => {
                                return opt.replace(/^([A-D])\.\s*\1\.\s*/i, '$1. ')
                                    .replace(/^([A-D])\.\s*/i, '').trim();
                            });

                            // Detect if AI returned only letters (A, B, C, D) as options
                            // while the actual choices are embedded in the question content
                            const allSingleLetters = q.options.every((opt: string) =>
                                /^[A-Da-d]$/.test(opt.trim())
                            );

                            if (allSingleLetters && q.content) {
                                // Try to extract options from content text
                                // Pattern: "A. physicist B. physician C. physical D. physics"
                                const inlinePattern = /\b([A-D])\.\s+([^A-D]*?)(?=\s+[A-D]\.\s|$)/g;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const matches: any[] = Array.from(q.content.matchAll(inlinePattern));

                                if (matches.length >= 2) {
                                    // Extract the actual option text
                                    const extractedOptions = matches.map((m: any) => m[2].trim());

                                    // Remove inline options from content (keep only the question stem)
                                    const firstMatchIndex = q.content.indexOf(matches[0][0]);
                                    if (firstMatchIndex > 0) {
                                        q.content = q.content.substring(0, firstMatchIndex).trim();
                                    }

                                    q.options = extractedOptions;
                                }
                            }

                            // Also handle case where options have full text but content still has inline options
                            if (!allSingleLetters && q.content) {
                                // Check if content ends with "A. xxx B. yyy C. zzz D. www" pattern
                                const trailingPattern = /\s+[A-D]\.\s+\S+(?:\s+[A-D]\.\s+\S+){1,3}\s*$/;
                                if (trailingPattern.test(q.content)) {
                                    // Remove trailing options from content
                                    q.content = q.content.replace(/\s+[A-D]\.\s+[^A-D]*(?:\s+[A-D]\.\s+[^A-D]*)*\s*$/, '').trim();
                                }
                            }
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
