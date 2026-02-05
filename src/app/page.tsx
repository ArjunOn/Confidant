'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useConfidantStore } from '@/lib/store';
import { processInput } from '@/lib/mockIntelligence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, Send, Brain, Sparkles, User, Settings, Shield, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ModelSelector } from '@/components/ModelSelector';
import { ModelBadge } from '@/components/ModelBadge';
import { PersonaManager } from '@/components/PersonaManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConfidantLayout } from '@/components/layout/ConfidantLayout';
import { Sidebar } from '@/components/layout/Sidebar'; // Layout handles this, but ensures imports are correct

// Voice Visualizer Component (Simple Mock)
const VoiceVisualizer = ({ state }: { state: 'listening' | 'processing' | 'speaking' | 'idle' }) => {
  if (state === 'idle') return <div className="h-12 flex items-center justify-center opacity-20"><Brain className="w-8 h-8" /></div>;
  return (
    <div className="h-12 flex items-center gap-1 justify-center">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1 bg-primary rounded-full transition-all duration-300",
            state === 'listening' ? "animate-[bounce_0.5s_infinite]" :
              state === 'processing' ? "animate-[pulse_1s_infinite] h-4" :
                "h-2"
          )}
          style={{ animationDelay: `${i * 0.1}s`, height: state === 'listening' ? `${Math.random() * 24 + 8}px` : undefined }}
        />
      ))}
    </div>
  );
};

// Code Block Component with Copy Functionality
const CodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline) {
    return (
      <code className={cn("bg-muted px-1.5 py-0.5 rounded-md font-mono text-sm text-primary", className)} {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="relative my-4 rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900 overflow-hidden shadow-sm max-w-full">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/50 border-b border-border/40">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="overflow-x-auto p-4">
        <code className={cn("font-mono text-sm text-zinc-50 block min-w-full", className)} {...props}>
          {children}
        </code>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const {
    isOnboarded, userProfile, currentMode, setMode,
    addTask, deleteTask, toggleTask, tasks,
    addMemory, deleteMemory, memories,
    isMuted, toggleMute, setUserProfile,
    selectedModel,
    personas, activePersonaId, userName,
    sessions, activeSessionId, createSession, addMessageToSession, updateSessionTitle, setActiveSession
  } = useConfidantStore();

  const activePersona = personas.find(p => p.id === activePersonaId) || personas[0];
  const currentAiName = activePersona?.name || userProfile?.aiName || 'Confidant';
  const currentUserName = userName || userProfile?.name || 'User';

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const chatHistory = activeSession?.messages || [];

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Smart Scroll Logic
  const scrollToSmart = () => {
    if (!chatHistory.length) return;
    const lastMessage = chatHistory[chatHistory.length - 1];

    // If AI just replied, scroll to top of that message (so user sees start of long text)
    if (lastMessage.role === 'assistant') {
      // We need a ref to the last message element. 
      // Since we use a list, let's look for the last child container roughly.
      // Actually, relying on scrollIntoView block: 'start' on the *end* ref might not work.
      // Let's rely on the sticky header offset scroll padding if we can.
      // For now, let's try standard 'nearest' which usually keeps bottom in view, 
      // but for long text we want top.
      // Let's use a timeout to ensure render
      setTimeout(() => {
        const messagesContainer = messagesEndRef.current?.parentElement;
        if (messagesContainer) {
          const lastChild = messagesContainer.lastElementChild?.previousElementSibling; // EndRef is last, so prev is message
          if (lastChild) {
            lastChild.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }, 100);
    } else {
      // User message, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  useEffect(() => {
    scrollToSmart();
  }, [chatHistory, activeSessionId, currentMode]);

  // Voice Interaction Mock
  const startListening = () => {
    setIsListening(true);
    setTimeout(() => {
      setInputValue("Hello, are you there?");
      setIsListening(false);
    }, 2000);
  };
  const stopListening = () => setIsListening(false);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    let sessionId = activeSessionId;

    // Create new session if none exists
    if (!sessionId) {
      const personaToUse = activePersonaId || personas[0]?.id;
      if (personaToUse) {
        sessionId = createSession(personaToUse);
      } else {
        console.error("No persona available to create session");
        return;
      }
    }

    const userMessage = inputValue;
    setInputValue('');

    // Add user message to session
    addMessageToSession(sessionId!, { role: 'user', content: userMessage });

    setIsLoading(true);

    try {
      const currentHistory = sessions.find(s => s.id === sessionId)?.messages.map(m => ({
        role: m.role as 'user' | 'ai',
        text: m.content
      })) || [];

      const response = await processInput(
        userMessage,
        currentUserName,
        activePersona || currentAiName,
        currentHistory,
        selectedModel
      );

      // Handle Task/Memory actions
      if (response.type === 'TASK') {
        if (response.data?.action === 'delete') {
          const query = response.data.query.toLowerCase();
          const taskToDelete = tasks.find(t => t.title.toLowerCase().includes(query));
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            response.text = `Task "${taskToDelete.title}" has been removed.`;
          } else {
            response.text = `I couldn't find a task matching "${query}".`;
          }
        } else {
          addTask({ title: response.data.title });
        }
      } else if (response.type === 'MEMORY') {
        addMemory({ text: response.data.text, type: 'fact' });
      }

      // Add AI Response to session
      addMessageToSession(sessionId!, { role: 'assistant', content: response.text });

      // Ensure title logic relies on Persona Name if not already set (re-enforcing)
      // We removed the old title update logic that used userMessage

    } catch (error) {
      addMessageToSession(sessionId!, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  // Welcome Screen / New Chat Wizard
  const renderWelcome = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-full max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-500">
        <div className="text-center space-y-4 mb-12">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 transform rotate-3">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold font-serif tracking-tight">
            Start a New Conversation
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Choose a persona to chat with or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-4xl">
          {/* CREATE NEW CARD */}
          <div
            onClick={() => {
              setMode('settings');
              // Ideally trigger 'create' state in PersonaManager, but for now specific navigation is enough
            }}
            className="group relative flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-muted group-hover:bg-primary/20 flex items-center justify-center mb-3 transition-colors">
              <Plus className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <h3 className="font-semibold">Create New Persona</h3>
            <p className="text-xs text-muted-foreground text-center mt-1">Design a custom AI companion</p>
          </div>

          {/* EXISTING PERSONAS */}
          {personas.map(persona => (
            <div
              key={persona.id}
              onClick={() => {
                createSession(persona.id);
              }}
              className={cn(
                "group relative flex flex-col p-6 rounded-xl border border-border bg-card hover:shadow-lg hover:border-primary/50 cursor-pointer transition-all duration-300",
                persona.isDefault && "ring-1 ring-primary/20"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-xl font-serif font-bold shadow-sm",
                  persona.isDefault ? "bg-gradient-to-br from-primary to-purple-600 text-white" : "bg-muted text-foreground"
                )}>
                  {persona.name[0]}
                </div>
                {persona.isDefault && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Default
                  </span>
                )}
              </div>

              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{persona.name}</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {persona.relationshipMode}
              </p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {persona.systemPrompt ? "Custom personality active." : "Standard Confidant personality."}
              </p>

              <div className="mt-auto pt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                Start Chat <span className="ml-1">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <ConfidantLayout>
      {currentMode === 'settings' ? (
        <div className="h-full overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
              <p className="text-muted-foreground mt-1">Adjust your companion's core parameters.</p>
            </div>
            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="bg-primary/5 p-6 flex flex-row items-center gap-4 space-y-0">
                <Shield className="w-8 h-8 text-primary opacity-80" />
                <div className="flex flex-col justify-center">
                  <CardTitle className="text-lg">Identity & Persona</CardTitle>
                  <CardDescription>How you and {currentAiName} interact.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <PersonaManager />

                <div className="pt-6 border-t border-border mt-6 flex justify-between items-center opacity-50">
                  <p className="text-xs">Advanced settings currently restricted to Local Kernel logic.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                  >
                    Reset System (Full Clear)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Model Selection */}
            <ModelSelector />
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full relative bg-zinc-50/50 dark:bg-zinc-950/50">

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto scroll-smooth">
            {!activeSessionId && renderWelcome()}

            {activeSessionId && (
              <div className="min-h-full flex flex-col">
                {/* Chat Header */}
                <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-serif font-bold text-lg shadow-sm">
                      {currentAiName[0]}
                    </div>
                    <div>
                      <h2 className="font-bold text-base leading-tight">{currentAiName}</h2>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {activePersona?.relationshipMode || 'Online'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setMode('settings')} className="text-muted-foreground hover:text-foreground">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex-1 px-4 pt-16 pb-10 md:px-20 max-w-5xl mx-auto w-full space-y-8 min-h-full flex flex-col justify-end">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-12 space-y-2 opacity-50">
                      <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>Start conversation with {currentAiName}...</p>
                    </div>
                  )}

                  {chatHistory.map((chat, idx) => (
                    <div key={idx} className={cn(
                      "flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-2 duration-300",
                      chat.role === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "flex gap-4 max-w-full",
                        chat.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1",
                          chat.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        )}>
                          {chat.role === 'user' ? <User className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                        </div>
                        <div className={cn(
                          "group relative max-w-[85%] lg:max-w-[75%] rounded-2xl px-6 py-4 text-sm shadow-sm",
                          chat.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-card border border-border rounded-tl-none"
                        )}>
                          <div className="prose prose-zinc dark:prose-invert max-w-none break-words leading-relaxed">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: CodeBlock,
                                pre: ({ children }) => <>{children}</>,
                                p: ({ children }) => <div className="mb-2 last:mb-0">{children}</div>
                              }}
                            >
                              {chat.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 px-12 select-none">
                        {new Date(chat.timestamp || Date.now()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}

                  {/* Loading Indicator */}
                  {isLoading && (
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Brain className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="flex items-center gap-1 h-10 px-4 bg-transparent opacity-50">
                        <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-foreground rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-10 pb-6 px-4">
            <div className="max-w-2xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-600/20 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
              <div className="relative bg-card border border-border rounded-xl shadow-2xl flex flex-col p-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={activeSessionId ? `Reply to ${currentAiName}...` : `Message ${currentAiName}...`}
                  className="border-none shadow-none focus-visible:ring-0 text-md min-h-[48px] max-h-48 resize-none py-3"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={isLoading}
                />
                <div className="flex justify-between items-center px-1 pt-1">
                  <ModelBadge />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-lg transition-colors h-8 w-8 hover:bg-muted",
                        isListening && "text-red-500 animate-pulse"
                      )}
                      onClick={isListening ? stopListening : startListening}
                    >
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-lg shadow-sm"
                      onClick={handleSend}
                      disabled={isLoading || !inputValue.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-center mt-2 text-muted-foreground opacity-50">
                {currentAiName} can make mistakes. Please verify important information.
              </p>
            </div>
          </div>

        </div>
      )}
    </ConfidantLayout>
  );
}
