'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
    state: 'idle' | 'listening' | 'speaking';
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ state }) => {
    return (
        <div className="relative flex items-center justify-center w-64 h-64">
            {/* Outer Pulse */}
            <div
                className={cn(
                    "absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-700",
                    state === 'idle' && "animate-pulse scale-100",
                    state === 'listening' && "animate-ping scale-150 border-primary/40",
                    state === 'speaking' && "animate-pulse scale-110 border-primary/60"
                )}
            />

            {/* J.A.R.V.I.S. Style Ring */}
            <div
                className={cn(
                    "relative w-32 h-32 rounded-full border-4 border-primary flex items-center justify-center transition-all duration-500",
                    state === 'listening' && "shadow-[0_0_30px_rgba(var(--primary),0.5)] scale-110",
                    state === 'speaking' && "scale-105"
                )}
            >
                {/* Core */}
                <div
                    className={cn(
                        "w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center transition-all duration-300",
                        state === 'listening' && "bg-primary/40",
                        state === 'speaking' && "bg-primary/60"
                    )}
                >
                    <div className={cn(
                        "w-4 h-4 rounded-full bg-primary transition-all duration-300",
                        state === 'listening' && "scale-150 animate-bounce",
                        state === 'speaking' && "scale-125 blur-[1px]"
                    )} />
                </div>

                {/* Orbiting Elements (Speaking Mode) */}
                {state === 'speaking' && (
                    <div className="absolute inset-0 border-t-4 border-primary/40 rounded-full animate-spin" />
                )}
            </div>
        </div>
    );
};
