'use client';

import React, { useState } from 'react';
import { useConfidantStore, Persona, RelationshipMode } from '@/lib/store';
import { PersonaEditor } from './PersonaEditor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Trash2, Check, User, Shield, Sparkles, AlertCircle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PersonaManager = () => {
    const {
        personas,
        activePersonaId,
        addPersona,
        updatePersona,
        deletePersona,
        setActivePersona,
        userName,
        setUserName,
        migrateUserProfile,
        userProfile,
        setMode
    } = useConfidantStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

    // Auto-migrate if needed (safety check, though store handles hydration)
    React.useEffect(() => {
        if (userProfile && personas.length === 0) {
            migrateUserProfile();
        }
    }, [userProfile, personas.length, migrateUserProfile]);

    const handleSavePersona = (personaData: Omit<Persona, 'id' | 'createdAt'>) => {
        if (isCreating) {
            addPersona(personaData);
            setIsCreating(false);
        } else if (editingId) {
            updatePersona(editingId, personaData);
            setEditingId(null);
        }
    };

    const handleDelete = (id: string) => {
        deletePersona(id);
        setShowDeleteConfirm(null);
    };

    if (isCreating || editingId) {
        const initialPersona = editingId
            ? personas.find(p => p.id === editingId)
            : undefined;

        return (
            <Card className="border-2 border-primary/20">
                <CardHeader>
                    <CardTitle>{isCreating ? 'Create New Persona' : 'Edit Persona'}</CardTitle>
                    <CardDescription>Configure your AI companion's personality.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PersonaEditor
                        initialPersona={initialPersona}
                        onSave={handleSavePersona}
                        onCancel={() => {
                            setIsCreating(false);
                            setEditingId(null);
                        }}
                    />
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-8">
            {/* Global User Settings */}
            <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-primary/5 p-6 flex flex-row items-center gap-4 space-y-0">
                    <User className="w-8 h-8 text-primary opacity-80" />
                    <div className="flex flex-col justify-center">
                        <CardTitle className="text-lg">User Configuration</CardTitle>
                        <CardDescription>How the AI should address you.</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Your Name</label>
                        <Input
                            value={userName || ''}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="What should the AI call you?"
                            className="text-lg font-medium h-12"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Personas List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <Shield className="w-5 h-5" /> AI Personas
                        </h3>
                        <p className="text-sm text-muted-foreground">Manage your different AI personalities.</p>
                    </div>
                    <Button onClick={() => setIsCreating(true)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {personas.map((persona) => {
                        const isActive = persona.id === activePersonaId;
                        const isDeleteConfirming = showDeleteConfirm === persona.id;

                        return (
                            <Card
                                key={persona.id}
                                className={cn(
                                    "relative transition-all border-l-4 overflow-hidden group",
                                    isActive ? "border-l-primary shadow-md bg-muted/30" : "border-l-transparent hover:border-l-primary/50"
                                )}
                            >
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg">{persona.name}</h4>
                                                {isActive && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                                {persona.isDefault && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                {persona.relationshipMode}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(persona.id)}>
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => setShowDeleteConfirm(persona.id)}
                                                disabled={personas.length <= 1} // Prevent deleting last persona
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Quick Stats */}
                                    <div className="flex gap-3 text-xs text-muted-foreground pt-2 border-t mt-2">
                                        <span>Voice: {persona.voiceSettings.rate}x / {persona.voiceSettings.pitch}</span>
                                        {persona.systemPrompt && <span>• Custom Prompt Active</span>}
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1 h-8 text-xs font-semibold"
                                            onClick={() => {
                                                setActivePersona(persona.id);
                                                setMode('chat');
                                                // Create new session or resume? User said 'takes control to chat window'.
                                                // We'll let the Sidebar/Page logic handle session creation if null, 
                                                // but for direct 'Chat' button, usually implies 'New Chat with this Persona' or 'Go to Chat'.
                                                // Let's create a fresh session to be safe, or just clear session to let user start.
                                                // Actually, let's trigger a new session immediately for smooth UX.
                                                // We need 'createSession' from store, but we are inside component. 
                                                // We'll use the hook's createSession.
                                                const { createSession } = useConfidantStore.getState();
                                                createSession(persona.id);
                                            }}
                                        >
                                            <MessageSquare className="w-3 h-3 mr-2" />
                                            Chat
                                        </Button>
                                        {!isActive && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1 h-8 text-xs font-semibold"
                                                onClick={() => setActivePersona(persona.id)}
                                            >
                                                Switch to
                                            </Button>
                                        )}
                                    </div>

                                    {/* Delete Confirmation Overlay */}
                                    {isDeleteConfirming && (
                                        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-200">
                                            <AlertCircle className="w-6 h-6 text-destructive mb-2" />
                                            <p className="text-sm font-semibold mb-3">Delete "{persona.name}"?</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
                                                <Button size="sm" variant="destructive" onClick={() => handleDelete(persona.id)}>Delete</Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}

                    {personas.length === 0 && (
                        <div className="col-span-1 md:col-span-2 p-8 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                            <p>No personas found. Create your first AI companion!</p>
                            <Button variant="link" onClick={() => setIsCreating(true)}>Create Persona</Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
