'use client';

import React from 'react';
import { useConfidantStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
    Plus,
    MessageSquare,
    Trash2,
    PanelLeftClose,
    PanelLeft,
    Settings,
    History,
    FileText,
    Brain,
    PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const Sidebar = () => {
    const {
        sessions,
        activeSessionId,
        setActiveSession,
        deleteSession,
        createSession,
        activePersonaId,
        personas,
        sidebarOpen,
        toggleSidebar,
        currentMode,
        setMode
    } = useConfidantStore();

    const sortedSessions = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

    const handleNewChat = () => {
        // Clear active session to show the New Chat Wizard (renderWelcome in page.tsx)
        setActiveSession(null);
        setMode('chat');
    };

    // --- Collapsed View ---
    if (!sidebarOpen) {
        return (
            <div className="h-full flex flex-col items-center py-4 gap-4 w-full">
                {/* Expand Button */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-10 w-10 text-muted-foreground hover:text-foreground">
                                <PanelLeftOpen className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Expand Sidebar</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* New Chat */}
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleNewChat}
                                className="bg-primary/10 text-primary hover:bg-primary/20 h-10 w-10 rounded-xl"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">New Chat</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <div className="w-8 h-px bg-border/50 my-2" />

                {/* History Quick Access (Last 3) */}
                <div className="flex flex-col gap-2">
                    {sortedSessions.slice(0, 3).map(session => (
                        <TooltipProvider key={session.id} delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        className={cn(
                                            "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                                            activeSessionId === session.id
                                                ? "bg-muted text-foreground"
                                                : "text-muted-foreground hover:bg-muted/50"
                                        )}
                                        onClick={() => setActiveSession(session.id)}
                                    >
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p className="max-w-[200px] truncate">{session.title}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>

                <div className="mt-auto flex flex-col gap-2 items-center">
                    {/* Settings Shortcut */}
                    <TooltipProvider delayDuration={0}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={currentMode === 'settings' ? 'secondary' : 'ghost'}
                                    size="icon"
                                    onClick={() => setMode('settings')}
                                    className="h-10 w-10"
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Settings</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {/* User Profile / Avatar Mock */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold select-none cursor-pointer">
                        U
                    </div>
                </div>
            </div>
        );
    }

    // --- Expanded View ---
    return (
        <aside className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h1 className="font-serif text-lg font-bold tracking-tight">Confidant</h1>
                </div>
                <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <PanelLeftClose className="w-4 h-4" />
                </Button>
            </div>

            {/* New Chat Button */}
            <div className="px-3 pb-2">
                <Button
                    className="w-full justify-start gap-2 bg-primary/90 hover:bg-primary shadow-sm h-10"
                    variant="default"
                    onClick={handleNewChat}
                >
                    <Plus className="w-4 h-4" />
                    <span className="font-medium">New Chat</span>
                </Button>
            </div>

            {/* Navigation */}
            <div className="px-3 py-2 space-y-0.5">
                <Button
                    variant={currentMode === 'settings' ? 'secondary' : 'ghost'}
                    className={cn("w-full justify-start text-sm font-medium h-9 px-2", currentMode === 'settings' && "bg-muted")}
                    onClick={() => setMode('settings')}
                >
                    <Settings className="w-4 h-4 mr-2 opacity-70" />
                    Configuration
                </Button>
                {/* Placeholder for future features */}
                <Button variant="ghost" className="w-full justify-start text-sm font-medium h-9 px-2 text-muted-foreground">
                    <FileText className="w-4 h-4 mr-2 opacity-70" />
                    Artifacts (Coming Soon)
                </Button>
            </div>


            {/* Recent Chats List */}
            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
                <h3 className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-2">Recent Chats</h3>

                {sortedSessions.length === 0 && (
                    <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                        No chats yet.
                    </div>
                )}

                {sortedSessions.map(session => (
                    <div
                        key={session.id}
                        className={cn(
                            "group flex items-center justify-between rounded-lg px-2 py-2 text-sm transition-colors cursor-pointer",
                            activeSessionId === session.id
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        )}
                        onClick={() => setActiveSession(session.id)}
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                            <span className="truncate leading-none">
                                {(() => {
                                    // Prefer session title, but if it's default/empty, show Persona Name
                                    if (session.title && session.title !== 'New Chat') return session.title;
                                    const sessionPersona = personas.find(p => p.id === session.personaId);
                                    return sessionPersona ? sessionPersona.name : 'New Chat';
                                })()}
                            </span>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/80 hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                            }}
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border mt-auto">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xs text-white font-bold">
                        U
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">User</p>
                        <p className="text-xs text-muted-foreground truncate">Free Plan</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
