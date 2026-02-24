"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableQuestionProps {
    question: {
        id: string;
        content: string; // JSON with { text: string, items: {id: string, text: string}[] }
    };
    value: string[] | undefined;
    onChange: (val: string[]) => void;
    disabled?: boolean;
}

export const SortableQuestion = ({
    question,
    value,
    onChange,
    disabled
}: SortableQuestionProps) => {
    const [items, setItems] = useState<{ id: string, text: string }[]>([]);
    const [prompt, setPrompt] = useState("");
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        try {
            const parsed = JSON.parse(question.content);
            setPrompt(parsed.text);

            // If value exists (user already moved things), use that order.
            // Otherwise use default shuffled order from content.
            if (value && value.length > 0) {
                const ordered = value.map(id => parsed.items.find((item: any) => item.id === id)).filter(Boolean);
                setItems(ordered);
            } else {
                setItems(parsed.items);
                // Initialize value on first load? 
                // Ideally we shouldn't until interaction, but for sortable, the initial state IS an answer.
                // But we'll leave it undefined until they drag? 
                // Or better, initializing it immediately ensures 'value' reflects what they see.
                // onChange(parsed.items.map((i: any) => i.id));
            }
        } catch (e) {
            console.error("Failed to parse Sortable content", e);
        }
    }, [question.content]); // eslint-disable-line

    const onDragEnd = (result: DropResult) => {
        if (!result.destination || disabled) return;

        const newItems = Array.from(items);
        const [reorderedItem] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reorderedItem);

        setItems(newItems);
        onChange(newItems.map(item => item.id));
    };

    if (!isMounted) return null;

    return (
        <div className="space-y-4">
            <div className="text-base font-medium">
                {prompt}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="sortable-list">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2 bg-slate-50 p-2 rounded-md border"
                        >
                            {items.map((item, index) => (
                                <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={disabled}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={cn(
                                                "flex items-center gap-x-2 bg-white p-3 rounded-md border shadow-sm text-sm select-none transition",
                                                snapshot.isDragging && "shadow-lg ring-2 ring-primary/20 z-50"
                                            )}
                                        >
                                            <GripVertical className="h-5 w-5 text-slate-400" />
                                            {item.text}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};
