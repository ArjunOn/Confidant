'use client';

import React, { useState } from 'react';
import { useConfidantStore, RelationshipMode } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Bot, User, Volume2 } from 'lucide-react';

export const OnboardingWizard = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [aiName, setAiName] = useState('');
    const [relationship, setRelationship] = useState<number>(50); // 0: Professional, 50: Friend, 100: Chaos
    const [voiceSettings, setVoiceSettings] = useState({ pitch: 1, rate: 1 });

    const setUserProfile = useConfidantStore((state) => state.setUserProfile);
    const addOnboarded = useConfidantStore((state) => state.addOnboarded);

    const getRelationshipMode = (val: number): RelationshipMode => {
        if (val < 33) return 'Strict Professional';
        if (val < 66) return 'Supportive Friend';
        return 'Chaos Buddy';
    };

    const handleComplete = () => {
        setUserProfile({
            name,
            aiName,
            relationshipMode: getRelationshipMode(relationship),
            voiceSettings,
        });
        addOnboarded();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-lg border-2 border-primary/20 shadow-2xl animate-in fade-in zoom-in duration-500">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent flex justify-center items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                        The Awakening
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 py-6">

                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <User className="w-5 h-5" />
                                <p>Welcome. What should I call you?</p>
                            </div>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="text-lg h-12"
                                onKeyDown={(e) => e.key === 'Enter' && name && setStep(2)}
                            />
                            <Button
                                className="w-full h-12 text-lg"
                                disabled={!name}
                                onClick={() => setStep(2)}
                            >
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <Bot className="w-5 h-5" />
                                <p>And what will you call me?</p>
                            </div>
                            <Input
                                value={aiName}
                                onChange={(e) => setAiName(e.target.value)}
                                placeholder="AI Companion Name"
                                className="text-lg h-12"
                                onKeyDown={(e) => e.key === 'Enter' && aiName && setStep(3)}
                            />
                            <Button
                                className="w-full h-12 text-lg"
                                disabled={!aiName}
                                onClick={() => setStep(3)}
                            >
                                Initialize Logic
                            </Button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="space-y-2">
                                <p className="text-muted-foreground text-center">Define our connection</p>
                                <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-primary/60">
                                    <span>Professional</span>
                                    <span>Friend</span>
                                    <span>Chaos</span>
                                </div>
                                <Slider
                                    value={[relationship]}
                                    onValueChange={(vals) => setRelationship(vals[0])}
                                    max={100}
                                    step={1}
                                />
                            </div>
                            <Card className="bg-muted/50 border-none p-4">
                                <p className="text-sm text-center font-medium">
                                    Result: <span className="text-primary">{getRelationshipMode(relationship)}</span>
                                </p>
                            </Card>
                            <Button className="w-full h-12 text-lg" onClick={() => setStep(4)}>
                                Finalize Tone
                            </Button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6 animate-in slide-in-from-right duration-300">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Volume2 className="w-5 h-5" />
                                    <p>Voice Calibration</p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <label>Pitch</label>
                                        <span className="text-primary">{voiceSettings.pitch.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        value={[voiceSettings.pitch]}
                                        onValueChange={(vals) => setVoiceSettings(prev => ({ ...prev, pitch: vals[0] }))}
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <label>Rate</label>
                                        <span className="text-primary">{voiceSettings.rate.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        value={[voiceSettings.rate]}
                                        onValueChange={(vals) => setVoiceSettings(prev => ({ ...prev, rate: vals[0] }))}
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                    />
                                </div>
                            </div>
                            <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={handleComplete}>
                                WAKE UP
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};
