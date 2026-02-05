'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { useConfidantStore } from '@/lib/store';
import { cn } from '@/lib/utils';

export const ConfidantLayout = ({ children }: { children: React.ReactNode }) => {
    const { sidebarOpen } = useConfidantStore();

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Sidebar */}
            <div className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out border-r border-border bg-zinc-50 dark:bg-zinc-950",
                sidebarOpen ? "w-[280px]" : "w-[60px]"
            )}>
                <div className="w-full h-full">
                    <Sidebar />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-full relative z-0 overflow-hidden">
                {children}
            </main>
        </div>
    );
};
