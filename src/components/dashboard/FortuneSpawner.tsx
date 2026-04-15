"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Zap, TrendingUp } from "lucide-react";

interface FortuneSpawnerProps {
    predictions: { number: string; confidence: number }[];
}

export function FortuneSpawner({ predictions }: FortuneSpawnerProps) {
    const [rolling, setRolling] = useState(false);
    const [luckyNumbers, setLuckyNumbers] = useState<string[]>([]);
    const [displayNumbers, setDisplayNumbers] = useState<string[]>(["??", "??", "??"]);

    const rollNumbers = () => {
        if (rolling) return;
        setRolling(true);
        setLuckyNumbers([]);

        // Get 3 lucky numbers based on AI weight (if available) or random
        const chosen: string[] = [];
        const topPool = predictions.slice(0, 10).map(p => p.number);
        
        for (let i = 0; i < 3; i++) {
            if (topPool.length > 0 && Math.random() > 0.3) {
                const idx = Math.floor(Math.random() * topPool.length);
                chosen.push(topPool[idx]);
                topPool.splice(idx, 1);
            } else {
                chosen.push(Math.floor(Math.random() * 100).toString().padStart(2, '0'));
            }
        }

        // Animation logic
        let ticks = 0;
        const interval = setInterval(() => {
            setDisplayNumbers(chosen.map((_, i) => {
                // If we've reached the tick for this column, show fixed number
                if (ticks > 15 + (i * 10)) return chosen[i];
                return Math.floor(Math.random() * 100).toString().padStart(2, '0');
            }));
            
            ticks++;
            if (ticks > 45) {
                clearInterval(interval);
                setRolling(false);
                setLuckyNumbers(chosen);
            }
        }, 80);
    };

    return (
        <div className="glass-card p-6 relative overflow-hidden group">
            {/* Background Glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[var(--accent-violet)] blur-[80px] opacity-20 transition-all duration-1000 group-hover:scale-150"></div>
            
            <div className="flex items-center justify-between mb-6">
                <div>
                   <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[var(--accent-amber)] animate-pulse" />
                      AI Fortune Spawner
                   </h3>
                   <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                      คำนวณเลขมงคลรายวินาทีด้วย AI
                   </p>
                </div>
                <button 
                    onClick={rollNumbers}
                    disabled={rolling}
                    className={`p-2 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] transition-all hover:rotate-180 disabled:opacity-50 ${rolling ? 'animate-spin' : ''}`}
                >
                    <RefreshCw className="w-4 h-4 text-[var(--accent-blue)]" />
                </button>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
                {displayNumbers.map((num, i) => (
                    <div 
                        key={i} 
                        className={`w-16 h-20 rounded-xl border flex items-center justify-center text-3xl font-black transition-all duration-300 shadow-lg
                            ${rolling ? 'border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.05)] translate-y-1' : 'border-[var(--border-color)] bg-[var(--bg-input)] scale-100'}
                            ${luckyNumbers.includes(num) && !rolling ? 'text-[var(--accent-amber)] border-[var(--accent-amber)] shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-110' : 'text-white'}
                        `}
                    >
                        {num}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                   <Zap className="w-3 h-3 text-[var(--accent-blue)]" />
                   AI Confidence Integration
                </div>
                {luckyNumbers.length > 0 && !rolling && (
                    <div className="text-[10px] font-bold text-[var(--accent-emerald)] animate-bounce">
                        LUCKY SIGNAL FOUND!
                    </div>
                )}
            </div>
        </div>
    );
}
