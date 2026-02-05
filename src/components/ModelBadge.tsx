'use client';

import React, { useState } from 'react';
import { useConfidantStore } from '@/lib/store';
import { AVAILABLE_MODELS, aiAdapter } from '@/lib/ai/adapter';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModelBadge = () => {
    const { selectedModel, setSelectedModel } = useConfidantStore();
    const [isOpen, setIsOpen] = useState(false);
    const [availability, setAvailability] = useState<Record<string, boolean>>({});

    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);

    // Check availability on mount and when dropdown opens
    React.useEffect(() => {
        if (isOpen) {
            AVAILABLE_MODELS.forEach(async (model) => {
                const isAvail = await aiAdapter.checkModelAvailability(model.id);
                setAvailability(prev => ({ ...prev, [model.id]: isAvail }));
            });
        }
    }, [isOpen]);

    // Self-healing: Reset to default if selected model is removed (e.g. Gemini)
    React.useEffect(() => {
        if (!currentModel && AVAILABLE_MODELS.length > 0) {
            setSelectedModel(AVAILABLE_MODELS[0].id);
        }
    }, [currentModel, setSelectedModel]);

    const handleModelSelect = (modelId: string) => {
        setSelectedModel(modelId);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                className="h-8 gap-2 text-xs font-semibold"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-base">{currentModel?.icon}</span>
                <span className="hidden sm:inline">{currentModel?.name}</span>
                <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
            </Button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <Card className="absolute bottom-full mb-2 right-0 w-80 z-50 shadow-2xl border-2">
                        <CardContent className="p-3 space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                                Quick Switch Model
                            </p>

                            {/* Group by provider */}
                            {['Local', 'Cloud - Smart', 'Cloud - Fast'].map((group, idx) => {
                                const groupModels = AVAILABLE_MODELS.filter(m =>
                                    (group === 'Local' && m.provider === 'ollama') ||
                                    (group === 'Cloud - Smart' && m.provider === 'gemini') ||
                                    (group === 'Cloud - Fast' && m.provider === 'groq')
                                );

                                if (groupModels.length === 0) return null;

                                return (
                                    <div key={group}>
                                        {idx > 0 && <div className="h-px bg-border my-2" />}
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 px-2">
                                            {group}
                                        </p>
                                        {groupModels.map(model => {
                                            const isAvailable = availability[model.id];
                                            const isSelected = model.id === selectedModel;

                                            return (
                                                <button
                                                    key={model.id}
                                                    onClick={() => handleModelSelect(model.id)}
                                                    disabled={isAvailable === false}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all text-sm",
                                                        isSelected && "bg-primary text-primary-foreground",
                                                        !isSelected && isAvailable !== false && "hover:bg-muted",
                                                        isAvailable === false && "opacity-40 cursor-not-allowed"
                                                    )}
                                                >
                                                    <span className="text-lg">{model.icon}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold truncate">{model.name}</p>
                                                        <p className={cn(
                                                            "text-xs truncate",
                                                            isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                                                        )}>
                                                            {model.description}
                                                        </p>
                                                    </div>
                                                    {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                                                    {isAvailable === false && !isSelected && (
                                                        <span className="text-[10px] text-destructive font-bold">⚠️ ERROR</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
};
