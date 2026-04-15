"use client";

import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface MarketRadarProps {
    data: any[];
}

export function MarketRadar({ data }: MarketRadarProps) {
    if (!data || data.length === 0) return null;

    // Transform data for Radar (3 axes: Energy, Accuracy, Integrity)
    // We want 3 polygon layers: Special, Normal, VIP
    const radarData = [
        { axis: 'Energy', A: data[0].energy, B: data[1].energy, C: data[2].energy },
        { axis: 'Accuracy', A: data[0].accuracy, B: data[1].accuracy, C: data[2].accuracy },
        { axis: 'Integrity', A: data[0].integrity, B: data[1].integrity, C: data[2].integrity },
        { axis: 'Density', A: data[0].density === 'HIGH' ? 95 : 60, B: data[1].density === 'HIGH' ? 95 : 60, C: data[2].density === 'HIGH' ? 95 : 60 },
        { axis: 'Stability', A: 85, B: 90, C: 88 } // Base stability
    ];

    return (
        <div className="glass-card p-4 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-4 bg-[var(--accent-blue)] rounded-full"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white">Market Energy Radar</h3>
            </div>
            
            <div className="flex-grow min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7294', fontSize: 8 }} />
                        <Radar
                            name="Special"
                            dataKey="A"
                            stroke="#f43f5e"
                            fill="#f43f5e"
                            fillOpacity={0.4}
                        />
                        <Radar
                            name="Normal"
                            dataKey="B"
                            stroke="#3b82f6"
                            fill="#3b82f6"
                            fillOpacity={0.3}
                        />
                        <Radar
                            name="VIP"
                            dataKey="C"
                            stroke="#8b5cf6"
                            fill="#8b5cf6"
                            fillOpacity={0.2}
                        />
                        <Legend wrapperStyle={{ fontSize: '8px', paddingTop: '10px' }} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
