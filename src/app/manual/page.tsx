/* eslint-disable react/no-unescaped-entities */
"use client";

import { PageHeader } from "@/components/layout/page-header";
import { 
  Brain, 
  Zap, 
  Target, 
  Activity, 
  Tv, 
  ShieldCheck, 
  ChevronRight
} from "lucide-react";

export default function ManualPage() {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto pb-20">
            <PageHeader 
                title="Master Manual" 
                description="คู่มือการใช้งานระบบวิเคราะห์ปัญญาประดิษฐ์ (Hanoi Intelligence Platform)"
            />

            <div className="space-y-12 mt-8">
                {/* 1. Truth Engine section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.1)] flex items-center justify-center">
                            <Brain className="w-6 h-6 text-[var(--accent-violet)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Truth Engine (กลไกแห่งความจริง)</h2>
                            <p className="text-xs text-[var(--text-muted)]">Neural Intelligence Backbone</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 space-y-4">
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                            <strong>Truth Engine</strong> คือหัวใจหลักของระบบที่ใช้คำนวณ "คะแนนความน่าจะเป็น" โดยมีการใช้น้ำหนัก (Neural Weights) ใน 2 มิติหลัก:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)]">
                                <h4 className="text-sm font-bold text-[var(--accent-blue)] mb-2">Frequency Weight (ค่าน้ำหนักความถี่)</h4>
                                <p className="text-xs text-[var(--text-muted)]">วิเคราะห์ว่าเลขใดออกบ่อยที่สุดในอดีต เหมาะสำหรับช่วงที่ตลาดมีพฤติกรรมเลขซ้ำ (Hot Numbers)</p>
                            </div>
                            <div className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border-color)]">
                                <h4 className="text-sm font-bold text-[var(--accent-emerald)] mb-2">Sequence Weight (ค่าน้ำหนักลำดับ)</h4>
                                <p className="text-xs text-[var(--text-muted)]">วิเคราะห์ "สืบทอด" (เลขมักจะออกตามกัน) เช่น ถ้าออก 24 งวดหน้ามีโอกาสเป็นเลขอะไร เหมาะสำหรับหาเลขกระโดด</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. AI Simulation Lab section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-[rgba(6,182,212,0.1)] flex items-center justify-center">
                            <Zap className="w-6 h-6 text-[var(--accent-cyan)]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">AI Simulation Lab</h2>
                            <p className="text-xs text-[var(--text-muted)]">Backtesting & Strategy Discovery</p>
                        </div>
                    </div>
                    <div className="glass-card p-6 space-y-4">
                        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                            ใช้สำหรับการ "ย้อนเวลา" เพื่อทดสอบกลยุทธ์ของคุณ:
                        </p>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-[var(--accent-cyan)] mt-0.5" />
                                <span className="text-xs"><strong>Optimize Strategy:</strong> AI จะประมวลผลการคำนวณนับแสนครั้งเพื่อหาว่า "ถ้าย้อนไป 30 วัน น้ำหนักแบบไหนจะทำให้ถูกรางวัลมากที่สุด"</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-[var(--accent-cyan)] mt-0.5" />
                                <span className="text-xs"><strong>Apply Champion Weights:</strong> เมื่อพบค่าที่ดีที่สุด (Winning Weights) คุณสามารถกด "Apply to Settings" เพื่อใช้ค่านั้นในการทำนายจริงได้ทันที</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* 3. Gap Matrix & Radar section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="w-6 h-6 text-[var(--accent-rose)]" />
                            <h2 className="text-lg font-bold">Gap Matrix</h2>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                ตาราง 10x10 ที่ใช้ในการดู "ความค้าง" ของตัวเลข 00-99 หากเลขใดเป็นสีแดงเข้ม แสดงว่าเลขนั้นไม่ได้ออกมานานมากแล้ว (Overdue) ซึ่งเป็นสัญญาณที่มืออาชีพใช้ในการวางแผน "ดัก" ตัวเลข
                            </p>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="w-6 h-6 text-[var(--accent-amber)]" />
                            <h2 className="text-lg font-bold">Market Radar</h2>
                        </div>
                        <div className="glass-card p-5">
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                กราฟเรดาร์ที่แสดง "พลังงานผันรวม" (Total Energy) ของตลาดแต่ละแห่ง หากกราฟขยายกว้าง แสดงว่าตลาดนั้นมีความแม่นยำทางสถิติและข้อมูลมีความพร้อมสูงที่สุดในขณะนั้น
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. Broadcast TV section */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Tv className="w-6 h-6 text-[var(--accent-rose)]" />
                        <h2 className="text-xl font-bold">Broadcast Mode (Hanoi TV)</h2>
                    </div>
                    <div className="glass-card p-6 border border-[var(--accent-rose)]/20">
                        <p className="text-sm text-[var(--text-secondary)] mb-4">
                            ออกแบบมาสำหรับเปิดบนหน้าจอขนาดใหญ่ (Big Screen) ในร้านหรือออฟฟิศ:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--accent-rose)] text-[10px] font-bold">Full Screen Ready</span>
                            <span className="px-3 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--accent-rose)] text-[10px] font-bold">Auto Refresh</span>
                            <span className="px-3 py-1 rounded-full bg-[rgba(239,68,68,0.1)] text-[var(--accent-rose)] text-[10px] font-bold">High Visibility</span>
                        </div>
                    </div>
                </section>

                {/* Final Safety Note */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-[rgba(59,130,246,0.1)] border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-[var(--accent-emerald)]" />
                        <h3 className="text-sm font-bold text-white">System Integrity & Verification</h3>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                        ระบบมีการตรวจสอบความถูกต้องของข้อมูล (Integrity Auditor) อยู่ตลอดเวลา หากค่า Integrity ต่ำกว่า 70% 
                        แนะนำให้ทำการตรวจสอบหน้า Import ข้อมูลหรือ Re-Sync ข้อมูลใหม่เพื่อให้ AI ทำงานได้แม่นยำที่สุด
                    </p>
                </div>

                <div className="text-center pt-8">
                    <p className="text-[10px] text-[var(--text-muted)]">Hanoi Intelligence Platform — Enterprise Edition</p>
                    <p className="text-[9px] text-[var(--text-muted)] mt-1">Design & Intelligence by Antigravity AI Engine</p>
                </div>
            </div>
        </div>
    );
}
