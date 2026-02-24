
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Grade a student submission using Google Gemini AI
 * Supports SPEAKING (audio) and WRITING/ESSAY (text) question types
 */
export async function gradeSubmission(
    questionType: string,
    questionContent: string,
    userAnswer: string,
    rubric: string,
    maxPoints: number,
    contextPassage?: string
): Promise<{ score: number; feedback: string }> {
    if (!apiKey) {
        console.error("GOOGLE_API_KEY is missing");
        return { score: 0, feedback: "Chưa cấu hình API Key cho AI chấm điểm." };
    }

    if (!userAnswer || userAnswer.trim() === "") {
        return { score: 0, feedback: "Học viên chưa nộp bài." };
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const isSpeaking = questionType === "SPEAKING";
        const isWriting = questionType === "WRITING" || questionType === "ESSAY";

        // Build the prompt parts
        const parts: any[] = [];

        // System instruction prompt - encourage rich markdown formatting
        const systemPrompt = `Bạn là một giáo viên tiếng Anh nghiêm khắc nhưng tận tâm. Hãy chấm điểm bài nộp của học viên.

**ĐỀ BÀI:** ${questionContent}
${contextPassage ? `
**NGỮ CẢNH / BÀI ĐỌC:**
"""
${contextPassage}
"""
` : ""}
**THANG ĐIỂM TỐI ĐA:** ${maxPoints} điểm
**TIÊU CHÍ CHẤM:** ${rubric || "Chấm dựa trên ngữ pháp, từ vựng, sự mạch lạc và hoàn thành yêu cầu đề bài."}

**ĐỊNH DẠNG TRẢ VỀ:**
Trả về theo định dạng sau (KHÔNG bọc trong code block):

SCORE: [số điểm từ 0 đến ${maxPoints}]
FEEDBACK:
[Nhận xét chi tiết bằng tiếng Việt, có thể dùng markdown như:
- **Bold** cho tiêu đề
- *Italic* cho nhấn mạnh
- Bullet points với dấu -
- Numbered lists với 1. 2. 3.
- Xuống dòng tự do để dễ đọc]

Hãy đưa ra nhận xét chi tiết, bao gồm điểm mạnh, điểm yếu và gợi ý cải thiện.`;

        parts.push({ text: systemPrompt });

        // Add student submission
        if (isWriting) {
            parts.push({ text: `**BÀI LÀM CỦA HỌC VIÊN:**\n"${userAnswer}"` });
        } else if (isSpeaking) {
            // Fetch and attach audio for speaking
            try {
                const response = await fetch(userAnswer);
                if (!response.ok) {
                    throw new Error(`Failed to fetch audio: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();
                const base64Audio = Buffer.from(arrayBuffer).toString("base64");

                // Determine mime type from URL or default to webm
                let mimeType = "audio/webm";
                if (userAnswer.includes(".mp3")) mimeType = "audio/mpeg";
                else if (userAnswer.includes(".ogg")) mimeType = "audio/ogg";
                else if (userAnswer.includes(".wav")) mimeType = "audio/wav";

                parts.push({
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                });
                parts.push({ text: "**BÀI NÓI CỦA HỌC VIÊN:** (File âm thanh đính kèm ở trên)" });
            } catch (e) {
                console.error("Error fetching audio for AI grading:", e);
                return {
                    score: 0,
                    feedback: "Lỗi khi tải file âm thanh để chấm điểm. Vui lòng thử lại hoặc liên hệ giáo viên."
                };
            }
        }

        // Call AI
        const result = await model.generateContent(parts);
        const responseText = result.response.text();

        console.log("AI Raw Response:", responseText);

        // Parse the SCORE: and FEEDBACK: format
        const parsed = parseScoreFeedbackFormat(responseText, maxPoints);

        return {
            score: parsed.score,
            feedback: parsed.feedback
        };

    } catch (error) {
        console.error("AI Grading Error:", error);
        return {
            score: 0,
            feedback: "Đã xảy ra lỗi khi AI chấm điểm. Giáo viên sẽ xem xét bài của bạn sau."
        };
    }
}

/**
 * Parse the SCORE: and FEEDBACK: format from AI response
 * This format is simpler and allows rich markdown in feedback
 */
function parseScoreFeedbackFormat(responseText: string, maxPoints: number): { score: number; feedback: string } {
    const fallback = {
        score: 0,
        feedback: "AI không thể phân tích kết quả. Giáo viên sẽ chấm thủ công."
    };

    if (!responseText || responseText.trim() === "") {
        return fallback;
    }

    try {
        // Try to find SCORE: pattern
        const scoreMatch = responseText.match(/SCORE\s*:\s*(\d+(?:\.\d+)?)/i);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;

        // Try to find FEEDBACK: pattern and get everything after it
        const feedbackMatch = responseText.match(/FEEDBACK\s*:\s*([\s\S]*)/i);
        let feedback = feedbackMatch ? feedbackMatch[1].trim() : "";

        // If we didn't find the format, try JSON fallback
        if (!scoreMatch && !feedbackMatch) {
            return tryJsonFallback(responseText, maxPoints);
        }

        // If no feedback found but we have score, use the rest of text
        if (!feedback && score > 0) {
            // Get everything after the score line
            const afterScore = responseText.split(/SCORE\s*:\s*\d+(?:\.\d+)?/i)[1];
            if (afterScore) {
                feedback = afterScore.replace(/^[:\s]+/, "").trim();
            }
        }

        // If still no feedback, use everything as feedback
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

/**
 * Fallback: try to parse as JSON if the simple format failed
 */
function tryJsonFallback(responseText: string, maxPoints: number): { score: number; feedback: string } {
    const fallback = {
        score: 0,
        feedback: "AI không thể phân tích kết quả. Giáo viên sẽ chấm thủ công."
    };

    try {
        // Clean up
        let cleaned = responseText
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();

        // Find JSON object
        const startIndex = cleaned.indexOf("{");
        const endIndex = cleaned.lastIndexOf("}");

        if (startIndex !== -1 && endIndex > startIndex) {
            const jsonStr = cleaned.substring(startIndex, endIndex + 1);
            const parsed = JSON.parse(jsonStr);

            let feedback = parsed.feedback || "";
            // Convert escaped newlines to real newlines
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

/**
 * Validate and clamp score to valid range
 */
function validateScore(score: any, maxPoints: number): number {
    const num = typeof score === "number" ? score : parseFloat(score);
    if (isNaN(num)) return 0;
    return Math.max(0, Math.min(Math.round(num * 10) / 10, maxPoints)); // Allow 1 decimal place
}
