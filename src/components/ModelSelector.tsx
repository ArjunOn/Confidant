'use client';

import React, { useState, useEffect } from 'react';
import { useConfidantStore } from '@/lib/store';
import { AVAILABLE_MODELS, aiAdapter } from '@/lib/ai/adapter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export const ModelSelector = () => {
    const { selectedModel, setSelectedModel } = useConfidantStore();
    const [availability, setAvailability] = useState<Record<string, boolean>>({});
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const checkAvailability = async () => {
            setChecking(true);
            const results: Record<string, boolean> = {};

            for (const model of AVAILABLE_MODELS) {
                results[model.id] = await aiAdapter.checkModelAvailability(model.id);
            }

            setAvailability(results);
            setChecking(false);
        };

        checkAvailability();
    }, []);

    // Self-healing: Reset to default if selected model is removed
    const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel);
    React.useEffect(() => {
        if (!currentModel && AVAILABLE_MODELS.length > 0) {
            setSelectedModel(AVAILABLE_MODELS[0].id);
        }
    }, [currentModel, setSelectedModel]);

    const handleModelSelect = (modelId: string) => {
        setSelectedModel(modelId);
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold">AI Model Selection</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Choose which AI model powers your conversations
                </p>
            </div>

            <div className="grid gap-3">
                {AVAILABLE_MODELS.map((model) => {
                    const isSelected = model.id === selectedModel;
                    const isAvailable = availability[model.id];

                    return (
                        <Card
                            key={model.id}
                            className={cn(
                                "border-2 transition-all cursor-pointer hover:shadow-md",
                                isSelected && "border-primary bg-primary/5",
                                !isSelected && "hover:border-primary/50"
                            )}
                            onClick={() => handleModelSelect(model.id)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{model.icon}</span>
                                        <div>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {model.name}
                                                {isSelected && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                                                        <Check className="w-3 h-3" />
                                                        Active
                                                    </span>
                                                )}
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                {model.description}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {checking ? (
                                        <span className="text-xs text-muted-foreground">...</span>
                                    ) : isAvailable ? (
                                        <span className="text-xs text-green-500 font-semibold">✓ Ready</span>
                                    ) : (
                                        <span className="text-xs text-amber-500 font-semibold">⚠️ Setup Needed</span>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {model.strengths.map((strength) => (
                                        <span
                                            key={strength}
                                            className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 bg-muted rounded-md"
                                        >
                                            {strength}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Context: {model.contextWindow.toLocaleString()} tokens</span>
                                    {model.requiresApiKey && !isAvailable && (
                                        <Button
                                            variant="link"
                                            size="sm"
                                            className="h-auto p-0 text-xs"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(
                                                    model.provider === 'gemini'
                                                        ? 'https://aistudio.google.com/app/apikey'
                                                        : 'https://console.groq.com/keys',
                                                    '_blank'
                                                );
                                            }}
                                        >
                                            Get API Key <ExternalLink className="w-3 h-3 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border text-xs space-y-2">
                <p className="font-semibold">💡 Pro Tip:</p>
                <p className="text-muted-foreground leading-relaxed">
                    Use the <strong>model badge</strong> next to the input bar to quickly switch models for a specific conversation.
                    This setting controls your default model for all new conversations.
                </p>
            </div>
        </div>
    );
};
