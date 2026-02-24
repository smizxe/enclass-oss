import { EssayEditor } from "@/components/essay-editor";

interface EssayQuestionProps {
    question: {
        id: string;
        content: string;
        points: number;
    };
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export const EssayQuestion = ({
    question,
    value = "",
    onChange,
    disabled
}: EssayQuestionProps) => {
    return (
        <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-lg">
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                    {/* Parse content if it's JSON */}
                    {(() => {
                        try {
                            const parsed = JSON.parse(question.content);
                            return parsed.text || question.content;
                        } catch {
                            return question.content;
                        }
                    })()}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                    Bài làm của bạn: (Writing / Essay)
                </label>
                <EssayEditor
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                />
            </div>
        </div>
    );
};
