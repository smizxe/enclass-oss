
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { isAnthropicModel, isOpenAIModel } from "./ai-models";

const googleApiKey = process.env.GOOGLE_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;
const anthropicApiKey = process.env.CLAUDE_API_KEY;

const genAI = new GoogleGenerativeAI(googleApiKey || "");
const openai = new OpenAI({ apiKey: openaiApiKey || "" });
const anthropic = new Anthropic({ apiKey: anthropicApiKey || "" });

/**
 * Grade a student submission using AI (Google Gemini or OpenAI)
 * Supports SPEAKING (audio) and WRITING/ESSAY (text) question types
 */
export async function gradeSubmission(
    questionType: string,
    questionContent: string,
    userAnswer: string,
    rubric: string,
    maxPoints: number,
    contextPassage?: string,
    correctAnswer?: string,
    modelId?: string
): Promise<{ score: number; feedback: string }> {
    const effectiveModel = modelId || "gemini-3.1-pro-preview";
    const useOpenAI = isOpenAIModel(effectiveModel);
    const useAnthropic = isAnthropicModel(effectiveModel);

    if (useOpenAI && !openaiApiKey) {
        return { score: 0, feedback: "Chưa cấu hình OPENAI_API_KEY." };
    }
    if (useAnthropic && !anthropicApiKey) {
        return { score: 0, feedback: "Chưa cấu hình CLAUDE_API_KEY." };
    }
    if (!useOpenAI && !useAnthropic && !googleApiKey) {
        return { score: 0, feedback: "Chưa cấu hình GOOGLE_API_KEY." };
    }

    if (!userAnswer || userAnswer.trim() === "") {
        return { score: 0, feedback: "Học viên chưa nộp bài." };
    }

    const isSpeaking = questionType === "SPEAKING";
    const isWriting = questionType === "WRITING" || questionType === "ESSAY";

    const systemPrompt = buildGradingPrompt(questionContent, contextPassage, correctAnswer, maxPoints, rubric);

    try {
        if (useOpenAI) {
            return await gradeWithOpenAI(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        } else if (useAnthropic) {
            return await gradeWithAnthropic(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        } else {
            return await gradeWithGemini(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        }
    } catch (error) {
        console.error("AI Grading Error:", error);
        return { score: 0, feedback: "Đã xảy ra lỗi khi AI chấm điểm. Giáo viên sẽ xem xét bài của bạn sau." };
    }
}

/**
 * Grade a student submission using AI (Streaming Version)
 */
export async function* gradeSubmissionStream(
    questionType: string,
    questionContent: string,
    userAnswer: string,
    rubric: string,
    maxPoints: number,
    contextPassage?: string,
    correctAnswer?: string,
    modelId?: string
) {
    const effectiveModel = modelId || "gemini-3.1-pro-preview";
    const useOpenAI = isOpenAIModel(effectiveModel);
    const useAnthropic = isAnthropicModel(effectiveModel);

    if (useOpenAI && !openaiApiKey) {
        yield "Lỗi: Chưa cấu hình OPENAI_API_KEY.";
        return;
    }
    if (useAnthropic && !anthropicApiKey) {
        yield "Lỗi: Chưa cấu hình CLAUDE_API_KEY.";
        return;
    }
    if (!useOpenAI && !useAnthropic && !googleApiKey) {
        yield "Lỗi: Chưa cấu hình GOOGLE_API_KEY.";
        return;
    }

    if (!userAnswer || userAnswer.trim() === "") {
        yield "Học viên chưa nộp bài.";
        return;
    }

    const isSpeaking = questionType === "SPEAKING";
    const isWriting = questionType === "WRITING" || questionType === "ESSAY";

    const systemPrompt = buildGradingPrompt(questionContent, contextPassage, correctAnswer, maxPoints, rubric);

    try {
        if (useOpenAI) {
            yield* streamWithOpenAI(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        } else if (useAnthropic) {
            yield* streamWithAnthropic(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        } else {
            yield* streamWithGemini(effectiveModel, systemPrompt, questionType, userAnswer, isSpeaking, isWriting, maxPoints);
        }
    } catch (error) {
        console.error("AI Streaming Error:", error);
        yield "\n[LỖI] Đã xảy ra lỗi khi kết nối với AI. Hệ thống không thể hoàn thành việc chấm điểm.";
    }
}

// ============= SHARED HELPERS =============

function buildGradingPrompt(
    questionContent: string,
    contextPassage?: string,
    correctAnswer?: string,
    maxPoints: number = 1,
    rubric?: string
): string {
    return `Bạn là một giáo viên tiếng Anh nghiêm khắc nhưng tận tâm. Hãy chấm điểm bài nộp của học viên.

**ĐỀ BÀI:** ${questionContent}
${contextPassage ? `
**NGỮ CẢNH / BÀI ĐỌC:**
"""
${contextPassage}
"""
` : ""}
${correctAnswer ? `**ĐÁP ÁN ĐÚNG / GỢI Ý CHUẨN:** ${correctAnswer}\n*(Hãy dùng đáp án chuẩn này làm cơ sở đánh giá độ chính xác của câu trả lời học viên)*\n` : ""}
**THANG ĐIỂM TỐI ĐA:** ${maxPoints} điểm
**TIÊU CHÍ CHẤM:** ${rubric || "Chấm dựa trên ngữ pháp, từ vựng, sự mạch lạc và hoàn thành yêu cầu đề bài."}

**ĐỊNH DẠNG TRẢ VỀ:**
Trả về theo định dạng sau (KHÔNG bọc trong code block, KHÔNG in lại bài làm của học viên):

SCORE: [số điểm từ 0 đến ${maxPoints}]
FEEDBACK:
[Nhận xét chi tiết bằng tiếng Việt, có thể dùng markdown như:
- **Bold** cho tiêu đề
- *Italic* cho nhấn mạnh
- Bullet points với dấu -
- Numbered lists với 1. 2. 3.
- Xuống dòng tự do để dễ đọc]

Hãy đưa ra nhận xét thẳng thắn, chi tiết, bao gồm điểm mạnh, điểm yếu và gợi ý cải thiện. Tuyệt đối KHÔNG trích dẫn lại toàn bộ câu trả lời của học viên.`;
}

async function fetchAudioAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    let mimeType = "audio/webm";
    if (url.includes(".mp3")) mimeType = "audio/mpeg";
    else if (url.includes(".ogg")) mimeType = "audio/ogg";
    else if (url.includes(".wav")) mimeType = "audio/wav";

    return { base64, mimeType };
}

// ============= GEMINI IMPLEMENTATION =============

async function gradeWithGemini(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
): Promise<{ score: number; feedback: string }> {
    const model = genAI.getGenerativeModel({ model: modelId });
    const parts: any[] = [{ text: systemPrompt }];

    if (isWriting) {
        parts.push({ text: `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"` });
    } else if (isSpeaking) {
        const { base64, mimeType } = await fetchAudioAsBase64(userAnswer);
        parts.push({ inlineData: { mimeType, data: base64 } });
        parts.push({ text: "**BÀI NÓI CỦA HỌC VIÊN:** (File âm thanh đính kèm ở trên)" });
    }

    const result = await model.generateContent(parts);
    const responseText = result.response.text();
    return parseScoreFeedbackFormat(responseText, maxPoints);
}

async function* streamWithGemini(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
) {
    const model = genAI.getGenerativeModel({ model: modelId });
    const parts: any[] = [{ text: systemPrompt }];

    if (isWriting) {
        parts.push({ text: `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"` });
    } else if (isSpeaking) {
        const { base64, mimeType } = await fetchAudioAsBase64(userAnswer);
        parts.push({ inlineData: { mimeType, data: base64 } });
        parts.push({ text: "**BÀI NÓI CỦA HỌC VIÊN:** (File âm thanh đính kèm ở trên)" });
    }

    const resultStream = await model.generateContentStream(parts);
    for await (const chunk of resultStream.stream) {
        const text = chunk.text();
        if (text) yield text;
    }
}

// ============= OPENAI IMPLEMENTATION =============

async function transcribeAudioWithWhisper(audioUrl: string): Promise<string> {
    const response = await fetch(audioUrl);
    if (!response.ok) throw new Error(`Failed to fetch audio: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine file extension
    let ext = "webm";
    if (audioUrl.includes(".mp3")) ext = "mp3";
    else if (audioUrl.includes(".ogg")) ext = "ogg";
    else if (audioUrl.includes(".wav")) ext = "wav";

    const file = new File([buffer], `audio.${ext}`, { type: `audio/${ext}` });

    const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: file,
        language: "en",
    });

    return transcription.text;
}

async function gradeWithOpenAI(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
): Promise<{ score: number; feedback: string }> {
    // Check if model starts with gpt-4o or gpt-5 (they support native audio)
    const supportsAudio = modelId.startsWith("gpt-4o") || modelId.startsWith("gpt-5");

    if (isSpeaking && supportsAudio) {
        // Use Native Audio Input
        const { base64, mimeType } = await fetchAudioAsBase64(userAnswer);
        const format = mimeType.split("/")[1] === "mpeg" ? "mp3" : "wav"; // OpenAI accepts wav or mp3

        const completion = await openai.chat.completions.create({
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "**BÀI NÓI CỦA HỌC VIÊN:** (File audio đính kèm)" },
                        {
                            type: "input_audio",
                            input_audio: {
                                data: base64,
                                format: format as "wav" | "mp3"
                            }
                        }
                    ]
                }
            ],
            temperature: 0.3,
        });

        const responseText = completion.choices[0]?.message?.content || "";
        return parseScoreFeedbackFormat(responseText, maxPoints);
    }

    // Fallback or Writing path
    let studentInput = "";

    if (isSpeaking) {
        // Fallback to Whisper if model doesn't support audio
        const transcript = await transcribeAudioWithWhisper(userAnswer);
        studentInput = `**BÀI NÓI CỦA HỌC VIÊN (Phiên âm tự động):**\n"${transcript}"`;
    } else {
        studentInput = `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"`;
    }

    const completion = await openai.chat.completions.create({
        model: modelId,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: studentInput }
        ],
        temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content || "";
    return parseScoreFeedbackFormat(responseText, maxPoints);
}

async function* streamWithOpenAI(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
) {
    const supportsAudio = modelId.startsWith("gpt-4o") || modelId.startsWith("gpt-5");

    if (isSpeaking && supportsAudio) {
        // Use Native Audio Input streaming
        const { base64, mimeType } = await fetchAudioAsBase64(userAnswer);
        const format = mimeType.split("/")[1] === "mpeg" ? "mp3" : "wav";

        const stream = await openai.chat.completions.create({
            model: modelId,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: [
                        { type: "text", text: "**BÀI NÓI CỦA HỌC VIÊN:** (File audio đính kèm)" },
                        {
                            type: "input_audio",
                            input_audio: {
                                data: base64,
                                format: format as "wav" | "mp3"
                            }
                        }
                    ]
                }
            ],
            temperature: 0.3,
            stream: true,
        });

        for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
        return;
    }

    // Fallback or Writing path
    let studentInput = "";

    if (isSpeaking) {
        const transcript = await transcribeAudioWithWhisper(userAnswer);
        studentInput = `**BÀI NÓI CỦA HỌC VIÊN (Phiên âm tự động):**\n"${transcript}"`;
    } else {
        studentInput = `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"`;
    }

    const stream = await openai.chat.completions.create({
        model: modelId,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: studentInput }
        ],
        temperature: 0.3,
        stream: true,
    });

    for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
    }
}

// ============= ANTHROPIC IMPLEMENTATION =============

async function gradeWithAnthropic(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
): Promise<{ score: number; feedback: string }> {
    let studentInput = "";

    if (isSpeaking) {
        const transcript = await transcribeAudioWithWhisper(userAnswer);
        studentInput = `**BÀI NÓI CỦA HỌC VIÊN (Phiên âm tự động):**\n"${transcript}"`;
    } else {
        studentInput = `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"`;
    }

    const completion = await anthropic.messages.create({
        model: modelId,
        system: systemPrompt,
        messages: [
            { role: "user", content: studentInput }
        ],
        max_tokens: 2000,
        temperature: 0.3,
    });

    const responseText = (completion.content[0] as { type: "text", text: string }).text || "";
    return parseScoreFeedbackFormat(responseText, maxPoints);
}

async function* streamWithAnthropic(
    modelId: string,
    systemPrompt: string,
    questionType: string,
    userAnswer: string,
    isSpeaking: boolean,
    isWriting: boolean,
    maxPoints: number
) {
    let studentInput = "";

    if (isSpeaking) {
        const transcript = await transcribeAudioWithWhisper(userAnswer);
        studentInput = `**BÀI NÓI CỦA HỌC VIÊN (Phiên âm tự động):**\n"${transcript}"`;
    } else {
        studentInput = `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"`;
    }

    const stream = await anthropic.messages.create({
        model: modelId,
        system: systemPrompt,
        messages: [
            { role: "user", content: studentInput }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        stream: true,
    });

    for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            const text = chunk.delta.text;
            if (text) yield text;
        }
    }
}

// ============= PARSERS =============

/**
 * Parse the SCORE: and FEEDBACK: format from AI response
 */
export function parseScoreFeedbackFormat(responseText: string, maxPoints: number): { score: number; feedback: string } {
    const fallback = {
        score: 0,
        feedback: "AI không thể phân tích kết quả. Giáo viên sẽ chấm thủ công."
    };

    if (!responseText || responseText.trim() === "") {
        return fallback;
    }

    try {
        const scoreMatch = responseText.match(/SCORE\s*:\s*(\d+(?:\.\d+)?)/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

        const feedbackMatch = responseText.match(/FEEDBACK\s*:\s*([\s\S]*)/i);
        let feedback = feedbackMatch ? feedbackMatch[1].trim() : "";

        if (!scoreMatch && !feedbackMatch) {
            return tryJsonFallback(responseText, maxPoints);
        }

        if (!feedback && score > 0) {
            const afterScore = responseText.split(/SCORE\s*:\s*\d+(?:\.\d+)?/i)[1];
            if (afterScore) {
                feedback = afterScore.replace(/^[:\s]+/, "").trim();
            }
        }

        if (!feedback) {
            feedback = responseText.replace(/SCORE\s*:\s*\d+(?:\.\d+)?/i, "").trim();
        }

        return {
            score: validateScore(score, maxPoints),
            feedback: feedback || fallback.feedback
        };

    } catch (e) {
        console.error("Parse error:", e);
        return tryJsonFallback(responseText, maxPoints);
    }
}

function tryJsonFallback(responseText: string, maxPoints: number): { score: number; feedback: string } {
    const fallback = {
        score: 0,
        feedback: "AI không thể phân tích kết quả. Giáo viên sẽ chấm thủ công."
    };

    try {
        let cleaned = responseText
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();

        const startIndex = cleaned.indexOf("{");
        const endIndex = cleaned.lastIndexOf("}");

        if (startIndex !== -1 && endIndex > startIndex) {
            const jsonStr = cleaned.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonStr);

            let feedback = parsed.feedback || "";
            feedback = feedback.replace(/\\n/g, "\n");

            return {
                score: validateScore(parsed.score, maxPoints),
                feedback: feedback || fallback.feedback
            };
        }

        return fallback;
    } catch (e) {
        console.error("JSON fallback failed:", e);
        return fallback;
    }
}

function validateScore(score: any, maxPoints: number): number {
    const num = typeof score === "number" ? score : parseFloat(score);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(Math.round(num * 10) / 10, maxPoints));
}
