import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AIMessage } from './ai/types';

export type RelationshipMode = 'Strict Professional' | 'Supportive Friend' | 'Chaos Buddy' | 'Wise Mentor' | 'Custom';

export interface UserProfile {
  name: string;
  aiName: string;
  relationshipMode: RelationshipMode;
  voiceSettings: {
    pitch: number;
    rate: number;
  };
}

export interface Persona {
  id: string;
  name: string;
  relationshipMode: string | RelationshipMode;
  voiceSettings: {
    pitch: number;
    rate: number;
    voice?: string;
  };
  systemPrompt?: string;
  isDefault: boolean;
  createdAt: number;
}

export interface Memory {
  id: string;
  personaId?: string; // Optional for backward compatibility, global if undefined
  text: string;
  type: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  due?: string;
  status: 'pending' | 'completed';
}

export interface ChatSession {
  id: string;
  personaId: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

interface ConfidantState {
  // Global User Settings
  userName: string | null;

  // Persona Management
  personas: Persona[];
  activePersonaId: string | null;

  // Chat Sessions
  sessions: ChatSession[];
  activeSessionId: string | null;

  // App State
  memories: Memory[];
  tasks: Task[];
  isOnboarded: boolean;
  currentMode: 'chat' | 'settings'; // Simplified modes
  isMuted: boolean;
  selectedModel: string;
  sidebarOpen: boolean;

  // Legacy (deprecated)
  userProfile: UserProfile | null;

  // Actions
  setUserName: (name: string) => void;

  // Persona Actions
  addPersona: (persona: Omit<Persona, 'id' | 'createdAt'>) => void;
  updatePersona: (id: string, updates: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  setActivePersona: (id: string) => void;

  // Session Actions
  createSession: (personaId: string) => string; // returns new session ID
  setActiveSession: (sessionId: string | null) => void;
  deleteSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: AIMessage) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  clearSession: (sessionId: string) => void;

  // Migration
  migrateUserProfile: () => void;
  setUserProfile: (profile: UserProfile) => void; // Legacy support

  addOnboarded: () => void;
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => void;
  deleteMemory: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setMode: (mode: ConfidantState['currentMode']) => void;
  toggleMute: () => void;
  setSelectedModel: (modelId: string) => void;
  toggleSidebar: () => void;
}

export const useConfidantStore = create<ConfidantState>()(
  persist(
    (set, get) => ({
      userName: null,
      personas: [],
      activePersonaId: null,
      sessions: [],
      activeSessionId: null,
      userProfile: null,
      memories: [],
      tasks: [],
      isOnboarded: false,
      currentMode: 'chat',
      isMuted: false,
      selectedModel: 'ollama-llama3.2',
      sidebarOpen: true,

      setUserName: (name) => set({ userName: name }),

      addPersona: (personaData) => set((state) => {
        const newPersona: Persona = {
          ...personaData,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        };
        const shouldActivate = state.personas.length === 0 || personaData.isDefault;
        const updatedPersonas = personaData.isDefault
          ? state.personas.map(p => ({ ...p, isDefault: false }))
          : state.personas;

        return {
          personas: [...updatedPersonas, newPersona],
          activePersonaId: shouldActivate ? newPersona.id : state.activePersonaId
        };
      }),

      updatePersona: (id, updates) => set((state) => {
        let updatedPersonas = state.personas.map(p =>
          p.id === id ? { ...p, ...updates } : p
        );
        if (updates.isDefault) {
          updatedPersonas = updatedPersonas.map(p =>
            p.id === id ? p : { ...p, isDefault: false }
          );
        }
        return { personas: updatedPersonas };
      }),

      deletePersona: (id) => set((state) => {
        const newPersonas = state.personas.filter(p => p.id !== id);
        const nextActiveId = state.activePersonaId === id && newPersonas.length > 0 ? newPersonas[0].id : state.activePersonaId;
        return {
          personas: newPersonas,
          activePersonaId: nextActiveId,
          // Also delete associated sessions? Maybe keep them but they become orphaned/read-only?
          // For now, let's keep them.
        };
      }),

      setActivePersona: (id) => set((state) => {
        // When switching persona, we might want to start a new chat or switch to last active one.
        // For now just set active ID.
        return { activePersonaId: id };
      }),

      // Session Actions
      createSession: (personaId) => {
        // Find persona name for immediate title
        const persona = get().personas.find(p => p.id === personaId);
        const title = persona ? persona.name : 'New Chat';

        const newSession: ChatSession = {
          id: crypto.randomUUID(),
          personaId,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        set(state => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
          activePersonaId: personaId,
          currentMode: 'chat'
        }));
        return newSession.id;
      },

      setActiveSession: (sessionId: string | null) => set(state => {
        if (!sessionId) {
          return { activeSessionId: null, currentMode: 'chat' };
        }
        const session = state.sessions.find(s => s.id === sessionId);
        if (session) {
          return { activeSessionId: sessionId, activePersonaId: session.personaId, currentMode: 'chat' };
        }
        return {};
      }),

      deleteSession: (sessionId) => set(state => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
      })),

      addMessageToSession: (sessionId, message) => set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? {
          ...s,
          messages: [...s.messages, { ...message, timestamp: message.timestamp || Date.now() }],
          updatedAt: Date.now()
        } : s)
      })),

      updateSessionTitle: (sessionId, title) => set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, title } : s)
      })),

      clearSession: (sessionId) => set(state => ({
        sessions: state.sessions.map(s => s.id === sessionId ? { ...s, messages: [] } : s)
      })),

      migrateUserProfile: () => {
        const state = get();
        if (state.userProfile && state.personas.length === 0) {
          const legacyProfile = state.userProfile;
          const defaultId = crypto.randomUUID();

          const newPersona: Persona = {
            id: defaultId,
            name: legacyProfile.aiName,
            relationshipMode: legacyProfile.relationshipMode,
            voiceSettings: legacyProfile.voiceSettings,
            isDefault: true,
            createdAt: Date.now()
          };

          // Create initial session
          const initialSession: ChatSession = {
            id: crypto.randomUUID(),
            personaId: defaultId,
            title: 'Welcome Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
          };

          set({
            userName: legacyProfile.name,
            personas: [newPersona],
            activePersonaId: defaultId,
            sessions: [initialSession],
            activeSessionId: initialSession.id
          });
        }
      },

      setUserProfile: (profile) => set(state => ({ userProfile: profile })), // Minimal implementation for legacy

      addOnboarded: () => set({ isOnboarded: true }),
      addMemory: (memory) => set((state) => ({
        memories: [...state.memories, {
          ...memory,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          personaId: state.activePersonaId || undefined
        }]
      })),
      deleteMemory: (id) => set((state) => ({
        memories: state.memories.filter(m => m.id !== id)
      })),
      addTask: (task) => set((state) => ({
        tasks: [...state.tasks, { ...task, id: crypto.randomUUID(), status: 'pending' }]
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      toggleTask: (id) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t)
      })),
      setMode: (mode) => set({ currentMode: mode }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'confidant-storage-v2', // Increment version to ensure clean slate or use migration
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.userProfile && state.personas.length === 0) {
          state.migrateUserProfile();
        }
      }
    }
  )
);
