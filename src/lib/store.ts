import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type RelationshipMode = 'Strict Professional' | 'Supportive Friend' | 'Chaos Buddy';

export interface UserProfile {
  name: string;
  aiName: string;
  relationshipMode: RelationshipMode;
  voiceSettings: {
    pitch: number;
    rate: number;
  };
}

export interface Memory {
  id: string;
  text: string;
  type: string;
}

export interface Task {
  id: string;
  title: string;
  due?: string;
  status: 'pending' | 'completed';
}

interface ConfidantState {
  userProfile: UserProfile | null;
  memories: Memory[];
  tasks: Task[];
  isOnboarded: boolean;
  currentMode: 'secretary' | 'friend' | 'memories' | 'settings';
  isMuted: boolean;

  // Actions
  setUserProfile: (profile: UserProfile) => void;
  addOnboarded: () => void;
  addMemory: (memory: Omit<Memory, 'id'>) => void;
  deleteMemory: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'status'>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setMode: (mode: ConfidantState['currentMode']) => void;
  toggleMute: () => void;
}

export const useConfidantStore = create<ConfidantState>()(
  persist(
    (set) => ({
      userProfile: null,
      memories: [],
      tasks: [],
      isOnboarded: false,
      currentMode: 'friend',
      isMuted: false,

      setUserProfile: (profile) => set({ userProfile: profile }),
      addOnboarded: () => set({ isOnboarded: true }),
      addMemory: (memory) => set((state) => ({
        memories: [...state.memories, { ...memory, id: crypto.randomUUID() }]
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
    }),
    {
      name: 'confidant-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
