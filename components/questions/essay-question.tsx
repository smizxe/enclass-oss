import { Textarea } from "@/components/ui/textarea";

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
                    {question.content}
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                    Bài làm của bạn:
                </label>
                <Textarea
                    placeholder="Nhập câu trả lời của bạn tại đây..."
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                    disabled={disabled}
                    className="min-h-[200px]"
                />
            </div>
        </div>
    );
};
