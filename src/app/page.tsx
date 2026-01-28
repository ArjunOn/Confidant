'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useConfidantStore } from '@/lib/store';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { useVoiceInput, useVoiceOutput } from '@/hooks/useVoice';
import { processInput } from '@/lib/mockIntelligence';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mic, Send, Calendar, MessageSquare, Brain, Settings, CheckCircle2, Volume2, VolumeX, Trash2, Heart, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function Dashboard() {
  const {
    isOnboarded, userProfile, currentMode, setMode,
    addTask, deleteTask, toggleTask, tasks,
    addMemory, deleteMemory, memories,
    isMuted, toggleMute, setUserProfile
  } = useConfidantStore();

  const [inputValue, setInputValue] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isListening, transcript, startListening, stopListening } = useVoiceInput();
  const { speak } = useVoiceOutput();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcript) setInputValue(transcript);
  }, [transcript]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, currentMode]);

  if (!isOnboarded) {
    return <OnboardingWizard />;
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !userProfile || isLoading) return;

    const userMessage = inputValue;
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await processInput(userMessage, userProfile.name, userProfile.aiName, chatHistory);

      if (response.type === 'TASK') {
        if (response.data?.action === 'delete') {
          // Logic to find and delete task by title
          const query = response.data.query.toLowerCase();
          const taskToDelete = tasks.find(t => t.title.toLowerCase().includes(query));
          if (taskToDelete) {
            deleteTask(taskToDelete.id);
            response.text = `Task "${taskToDelete.title}" has been removed. — ${userProfile.aiName}`;
          } else {
            response.text = `I couldn't find a task matching "${query}". — ${userProfile.aiName}`;
          }
        } else {
          setMode('secretary');
          addTask({ title: response.data?.title || userMessage });
        }
      } else if (response.type === 'MEMORY') {
        addMemory(response.data);
      } else {
        setMode('friend');
      }

      setChatHistory(prev => [...prev, { role: 'ai', text: response.text }]);
      speak(response.text);
    } catch (error) {
      console.error('Intelligence error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const voiceState = isListening ? 'listening' : (isLoading ? 'speaking' : (chatHistory[chatHistory.length - 1]?.role === 'ai' ? 'speaking' : 'idle'));

  return (
    <div className="flex h-screen bg-background overflow-hidden text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 backdrop-blur-xl flex flex-col p-4 space-y-4">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl tracking-tight leading-none">{userProfile?.aiName}<br /><span className="text-[10px] font-normal opacity-50 uppercase tracking-widest">Active System</span></span>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<MessageSquare />} label="Chat" active={currentMode === 'friend'} onClick={() => setMode('friend')} />
          <NavItem icon={<Calendar />} label="Tasks" active={currentMode === 'secretary'} onClick={() => setMode('secretary')} />
          <NavItem icon={<Brain />} label="Memory Bank" active={currentMode === 'memories'} onClick={() => setMode('memories')} />
          <NavItem
            icon={isMuted ? <VolumeX className="text-destructive" /> : <Volume2 className="text-primary" />}
            label={isMuted ? "Unmute" : "Mute Voice"}
            onClick={toggleMute}
          />
          <div className="pt-4 mt-4 border-t border-border">
            <NavItem icon={<Settings />} label="Settings" active={currentMode === 'settings'} onClick={() => setMode('settings')} />
          </div>
        </nav>

        <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
          <p className="text-xs font-semibold text-primary/60 uppercase">System Status</p>
          <p className="text-sm font-medium mt-1">Logic Kernel: Online</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className={cn(
        "flex-1 flex flex-col transition-colors duration-500 relative bg-zinc-50/50 dark:bg-black",
        currentMode === 'friend' && "bg-gradient-to-br from-background to-purple-900/10"
      )}>

        {/* Workspace Content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 pb-40">

          {currentMode === 'secretary' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Directives</h2>
                  <p className="text-muted-foreground mt-1">Active tasks and reminders for your day.</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">{tasks.filter(t => t.status === 'pending').length} Remaining</span>
                </div>
              </div>
              <div className="grid gap-3">
                {tasks.length === 0 ? (
                  <div className="py-20 text-center border-2 border-dashed border-border rounded-xl">
                    <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground italic">No pending directives, {userProfile?.name}.</p>
                  </div>
                ) : (
                  tasks.sort((a, b) => a.status === 'completed' ? 1 : -1).map(task => (
                    <Card key={task.id} className={cn(
                      "bg-card border-border transition-all hover:shadow-md",
                      task.status === 'completed' && "opacity-60 bg-muted/50"
                    )}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <button
                          onClick={() => toggleTask(task.id)}
                          className={cn(
                            "w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center transition-all",
                            task.status === 'completed' ? "bg-primary" : "hover:bg-primary/10"
                          )}
                        >
                          {task.status === 'completed' && <div className="w-2 h-2 bg-background rounded-full" />}
                        </button>
                        <span className={cn("flex-1 text-lg font-medium", task.status === 'completed' && "line-through")}>{task.title}</span>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => deleteTask(task.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {currentMode === 'friend' && (
            <div className="max-w-3xl mx-auto space-y-4">
              {chatHistory.length === 0 && (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                  <VoiceVisualizer state="idle" />
                  <p className="text-xl font-medium max-w-sm">
                    How can I assist you today, {userProfile?.name}?
                  </p>
                </div>
              )}
              {chatHistory.map((chat, i) => (
                <div key={i} className={cn(
                  "flex flex-col max-w-[85%] p-4 rounded-2xl animate-in slide-in-from-bottom-2 duration-300",
                  chat.role === 'user' ? "ml-auto bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "mr-auto bg-card border border-border"
                )}>
                  <p className="text-[10px] font-bold mb-1 opacity-70 uppercase tracking-widest">
                    {chat.role === 'user' ? userProfile?.name : userProfile?.aiName}
                  </p>
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {chat.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto bg-card border border-border p-4 rounded-2xl animate-pulse flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="text-sm font-medium text-muted-foreground ml-2">{userProfile?.aiName} is thinking...</span>
                </div>
              )}
            </div>
          )}

          {currentMode === 'memories' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Memory Bank</h2>
                <p className="text-muted-foreground mt-1">Things I've learned about you over time.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {memories.length === 0 ? (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
                    <Brain className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground italic">I haven't learned anything specific yet. Try saying "I love coffee!"</p>
                  </div>
                ) : (
                  memories.map(memory => (
                    <Card key={memory.id} className="bg-card border-border hover:border-primary/30 transition-all group">
                      <CardContent className="p-4 flex items-start gap-3">
                        <Heart className="w-4 h-4 text-primary mt-1 fill-primary opacity-20 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1">
                          <p className="text-base font-medium leading-relaxed italic">"{memory.text}"</p>
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMemory(memory.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {currentMode === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
                <p className="text-muted-foreground mt-1">Adjust your companion's core parameters.</p>
              </div>
              <Card className="bg-card border-border overflow-hidden">
                <CardHeader className="bg-primary/5 pb-6">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                      <CardTitle>Identity & Persona</CardTitle>
                      <CardDescription>How you and {userProfile?.aiName} interact.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">User Name</label>
                      <Input value={userProfile?.name} readOnly className="bg-muted/50 cursor-not-allowed border-none font-medium h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">AI Name</label>
                      <Input value={userProfile?.aiName} readOnly className="bg-muted/50 cursor-not-allowed border-none font-medium h-12" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Relationship Mode</label>
                      <div className="h-12 flex items-center px-4 bg-muted/50 rounded-md font-medium">
                        <Sparkles className="w-4 h-4 text-primary mr-2" />
                        {userProfile?.relationshipMode}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Voice Tone</label>
                      <div className="h-12 flex items-center px-4 bg-muted/50 rounded-md font-medium">
                        Rate: {userProfile?.voiceSettings.rate} / Pitch: {userProfile?.voiceSettings.pitch}
                      </div>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-border mt-4 flex justify-between items-center opacity-50">
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
            </div>
          )}
        </div>

        {/* Omni-Input Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
            <div className="relative bg-card border border-border rounded-xl flex items-center p-2 shadow-2xl">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-lg transition-colors",
                  isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "hover:bg-primary/10"
                )}
                onClick={isListening ? stopListening : startListening}
              >
                <Mic className={cn("w-6 h-6", isListening && "animate-pulse")} />
              </Button>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentMode === 'friend' ? `Talk to ${userProfile?.aiName}...` : `Type a directive for ${userProfile?.aiName}...`}
                className="flex-1 bg-transparent border-none text-lg h-12 focus-visible:ring-0 placeholder:opacity-50 font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="rounded-lg ml-2 h-10 w-10 shadow-lg" onClick={handleSend}>
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-all",
        active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
      )}
    >
      <div className="w-5 h-5 flex items-center justify-center">
        {icon}
      </div>
      {label}
    </button>
  );
}
