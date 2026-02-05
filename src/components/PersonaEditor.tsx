'use client';

import React, { useState, useEffect } from 'react';
import { Persona, RelationshipMode } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Briefcase, Heart, Sparkles, Zap, GraduationCap, X, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

// Helper for relationship modes
const RELATIONSHIP_MODES: { id: RelationshipMode; icon: any; description: string; color: string }[] = [
    { id: 'Strict Professional', icon: Briefcase, description: 'Efficient, formal, and task-oriented.', color: 'text-blue-500 bg-blue-500/10' },
    { id: 'Supportive Friend', icon: Heart, description: 'Warm, empathetic, and casual.', color: 'text-pink-500 bg-pink-500/10' },
    { id: 'Wise Mentor', icon: GraduationCap, description: 'Patient, educational, and guiding.', color: 'text-purple-500 bg-purple-500/10' },
    { id: 'Chaos Buddy', icon: Zap, description: 'Fun, unpredictable, and energetic.', color: 'text-orange-500 bg-orange-500/10' },
    { id: 'Custom', icon: Sparkles, description: 'Define your own unique dynamic.', color: 'text-emerald-500 bg-emerald-500/10' },
];

interface PersonaEditorProps {
    initialPersona?: Partial<Persona>;
    onSave: (persona: Omit<Persona, 'id' | 'createdAt'>) => void;
    onCancel: () => void;
}

export const PersonaEditor: React.FC<PersonaEditorProps> = ({ initialPersona, onSave, onCancel }) => {
    const [name, setName] = useState(initialPersona?.name || '');
    const [relationshipMode, setRelationshipMode] = useState<string>(initialPersona?.relationshipMode || 'Strict Professional');
    const [pitch, setPitch] = useState(initialPersona?.voiceSettings?.pitch || 1);
    const [rate, setRate] = useState(initialPersona?.voiceSettings?.rate || 1);
    const [systemPrompt, setSystemPrompt] = useState(initialPersona?.systemPrompt || '');
    const [isDefault, setIsDefault] = useState(initialPersona?.isDefault || false);

    const handleSave = () => {
        if (!name.trim()) return;

        onSave({
            name,
            relationshipMode,
            voiceSettings: { pitch, rate },
            systemPrompt: systemPrompt.trim() || undefined,
            isDefault
        });
    };

    return (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
            <div className="grid gap-6">
                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">AI Name</label>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Jarvis, Friday, HAL"
                        className="text-lg font-semibold h-12"
                    />
                </div>

                {/* Relationship Mode Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-medium">Relationship Mode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {RELATIONSHIP_MODES.map((mode) => {
                            const Icon = mode.icon;
                            const isSelected = relationshipMode === mode.id;

                            return (
                                <div
                                    key={mode.id}
                                    onClick={() => setRelationshipMode(mode.id)}
                                    className={cn(
                                        "cursor-pointer rounded-xl border-2 p-4 transition-all hover:scale-[1.02] active:scale-[0.98]",
                                        isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-transparent bg-muted/50 hover:bg-muted"
                                    )}
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={cn("p-2 rounded-lg", mode.color)}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <span className={cn("font-bold text-sm", isSelected ? "text-primary" : "text-muted-foreground")}>
                                            {mode.id}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed pl-[44px]">
                                        {mode.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Voice Settings */}
                <div className="space-y-6 p-5 border rounded-xl bg-card">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="font-semibold text-sm">Voice Configuration</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <label>Pitch</label>
                                <span>{pitch.toFixed(1)}</span>
                            </div>
                            <Slider
                                value={[pitch]}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                onValueChange={(val) => setPitch(val[0])}
                                className="[&_.range-thumb]:bg-primary"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <label>Speed (Rate)</label>
                                <span>{rate.toFixed(1)}x</span>
                            </div>
                            <Slider
                                value={[rate]}
                                min={0.5}
                                max={2.0}
                                step={0.1}
                                onValueChange={(val) => setRate(val[0])}
                            />
                        </div>
                    </div>
                </div>

                {/* System Prompt (Optional) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Custom System Prompt</label>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded">Advanced</span>
                    </div>
                    <textarea
                        value={systemPrompt}
                        onChange={(e) => setSystemPrompt(e.target.value)}
                        placeholder="Override the default personality instructions..."
                        className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                        Leave blank to use the default behavior for the selected relationship mode.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim()}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Persona
                    </Button>
                </div>
            </div>
        </div>
    );
};
