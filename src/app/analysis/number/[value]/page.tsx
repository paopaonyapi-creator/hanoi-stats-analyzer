"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Target, Clock, TrendingUp, Zap, Hash } from "lucide-react";

type AnalysisColor = "rose" | "amber" | "emerald" | "gray";
type DrawBadgeType = "SPECIAL" | "NORMAL" | "VIP";

interface NumberAnalysisResponse {
  value: string;
  type: "2D" | "3D";
  totalHits: number;
  currentGap: number;
  latestHit: {
    date: string;
    type: DrawBadgeType;
    result: string;
  } | null;
  aiAnalysis: {
    confidence: number;
    recommendation: string;
    color: AnalysisColor;
  };
  topCompanions: Array<{ val: string; count: number }>;
  recentHits: Array<{
    date: string;
    type: DrawBadgeType;
    last2: string;
    last3: string;
  }>;
}

const ANALYSIS_COLORS: Record<AnalysisColor, { value: string; glow: string }> = {
  rose: {
    value: "var(--accent-rose)",
    glow: "0 0 34px rgba(244, 63, 94, 0.28)",
  },
  amber: {
    value: "var(--accent-amber)",
    glow: "0 0 34px rgba(245, 158, 11, 0.28)",
  },
  emerald: {
    value: "var(--accent-emerald)",
    glow: "0 0 34px rgba(16, 185, 129, 0.28)",
  },
  gray: {
    value: "var(--text-muted)",
    glow: "0 0 28px rgba(100, 116, 139, 0.2)",
  },
};

const TYPE_STYLES: Record<DrawBadgeType, { label: string; color: string; bg: string }> = {
  SPECIAL: {
    label: "SPECIAL",
    color: "var(--accent-amber)",
    bg: "rgba(245, 158, 11, 0.12)",
  },
  NORMAL: {
    label: "NORMAL",
    color: "var(--accent-blue)",
    bg: "rgba(59, 130, 246, 0.12)",
  },
  VIP: {
    label: "VIP",
    color: "var(--accent-violet)",
    bg: "rgba(139, 92, 246, 0.12)",
  },
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function NumberDetailPage() {
  const params = useParams<{ value: string | string[] }>();
  const rawValue = params.value;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;

  const [data, setData] = useState<NumberAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setError("ไม่พบเลขที่ต้องการวิเคราะห์");
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function loadDetail() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/analysis/number/${value}`);
        const payload = await response.json();

        if (!response.ok || payload.error) {
          throw new Error(payload.error || "โหลดข้อมูลไม่สำเร็จ");
        }

        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        if (isMounted) {
          setData(null);
          setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [value]);

  const accent = data ? ANALYSIS_COLORS[data.aiAnalysis.color] : ANALYSIS_COLORS.gray;

  return (
    <div className="relative overflow-hidden animate-fade-in">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 44%), radial-gradient(circle at top right, rgba(139,92,246,0.16), transparent 38%), radial-gradient(circle at center, rgba(244,63,94,0.12), transparent 42%)",
        }}
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/analysis"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition-all hover:border-[var(--border-hover)] hover:bg-[var(--bg-card-hover)]"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับสู่ Analysis
        </Link>
      </div>

      <section className="glass-card relative overflow-hidden px-6 py-7 md:px-8 md:py-9">
        <div
          aria-hidden
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.06), transparent 32%, rgba(59,130,246,0.06) 68%, rgba(139,92,246,0.12))",
          }}
        />
        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--text-muted)]">
                Number Intelligence Deep Dive
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div
                  className="rounded-[28px] border px-6 py-4"
                  style={{
                    borderColor: "rgba(255,255,255,0.08)",
                    background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="text-6xl font-black leading-none text-[var(--text-primary)] md:text-7xl">
                    {value || "--"}
                  </div>
                </div>
                <span
                  className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-black uppercase tracking-[0.22em]"
                  style={{
                    color: "var(--accent-blue)",
                    borderColor: "rgba(59,130,246,0.3)",
                    background: "rgba(59,130,246,0.12)",
                    boxShadow: "0 0 20px rgba(59,130,246,0.18)",
                  }}
                >
                  {data?.type ?? (value?.length === 3 ? "3D" : "2D")}
                </span>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)] md:text-base">
                มุมมองเชิงลึกของความถี่ ระยะห่าง สหสัมพันธ์ และสัญญาณ AI สำหรับเลขนี้ในฐานข้อมูลย้อนหลังล่าสุด
              </p>
            </div>

            <div
              className="rounded-[26px] border px-5 py-4"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(6, 11, 24, 0.56)",
                boxShadow: "0 24px 60px rgba(2, 6, 23, 0.35)",
              }}
            >
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                Live Oracle State
              </div>
              <div className="mt-2 text-3xl font-black" style={{ color: accent.value }}>
                {data?.aiAnalysis.confidence ?? 0}%
              </div>
              <div className="mt-1 text-sm text-[var(--text-secondary)]">AI confidence score</div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[22px] border p-5 animate-pulse"
                  style={{
                    borderColor: "var(--border-color)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <div className="mb-4 h-3 w-24 rounded bg-[rgba(255,255,255,0.08)]" />
                  <div className="h-8 w-28 rounded bg-[rgba(255,255,255,0.1)]" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              className="rounded-[22px] border px-5 py-4 text-sm"
              style={{
                borderColor: "rgba(244,63,94,0.32)",
                color: "var(--accent-rose)",
                background: "rgba(244,63,94,0.08)",
              }}
            >
              {error}
            </div>
          ) : data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[22px] border p-5" style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.03)" }}>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  <Target className="h-4 w-4 text-[var(--accent-violet)]" />
                  Total Hits
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)]">{data.totalHits}</div>
              </div>
              <div className="rounded-[22px] border p-5" style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.03)" }}>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  <Clock className="h-4 w-4 text-[var(--accent-blue)]" />
                  Current Gap
                </div>
                <div className="text-3xl font-black text-[var(--text-primary)]">{data.currentGap}</div>
              </div>
              <div className="rounded-[22px] border p-5" style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.03)" }}>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  <TrendingUp className="h-4 w-4 text-[var(--accent-emerald)]" />
                  Latest Hit
                </div>
                <div className="text-xl font-black text-[var(--text-primary)]">{formatDate(data.latestHit?.date)}</div>
                <div className="mt-2 text-xs text-[var(--text-muted)]">
                  {data.latestHit ? data.latestHit.result : "ยังไม่พบการออก"}
                </div>
              </div>
              <div className="rounded-[22px] border p-5" style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.03)" }}>
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                  <Zap className="h-4 w-4" style={{ color: accent.value }} />
                  AI Confidence
                </div>
                <div className="text-3xl font-black" style={{ color: accent.value }}>
                  {data.aiAnalysis.confidence}%
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="relative overflow-hidden rounded-[28px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[28px] border animate-pulse"
            style={{
              borderColor: accent.value,
              boxShadow: accent.glow,
            }}
          />
          <div className="relative">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="rounded-full p-3"
                style={{ background: "rgba(255,255,255,0.05)", color: accent.value }}
              >
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">
                  AI Analysis
                </div>
                <div className="text-xl font-black text-[var(--text-primary)]">
                  {data?.aiAnalysis.recommendation ?? "กำลังประมวลผล"}
                </div>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
              สัญญาณนี้สะท้อนจากพฤติกรรม gap ล่าสุด ความถี่สะสม และความร้อนแรงของเลขในบริบทข้อมูลย้อนหลังของระบบ
            </p>
          </div>
        </section>

        <section className="glass-card p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-[rgba(139,92,246,0.14)] p-3 text-[var(--accent-violet)]">
              <Hash className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[var(--text-muted)]">
                Top Companions
              </div>
              <div className="text-lg font-black text-[var(--text-primary)]">
                3 ตัวที่เดินคู่บ่อยที่สุด
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {data?.topCompanions.length ? (
              data.topCompanions.map((item, index) => (
                <div
                  key={`${item.val}-${index}`}
                  className="flex items-center justify-between rounded-[20px] border px-4 py-4"
                  style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      #{index + 1}
                    </span>
                    <span className="text-2xl font-black text-[var(--text-primary)]">{item.val}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      Correlation
                    </div>
                    <div className="text-lg font-black text-[var(--accent-violet)]">{item.count}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[20px] border border-[var(--border-color)] bg-[rgba(255,255,255,0.03)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                ยังไม่มี companion data
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass-card mt-6 p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.32em] text-[var(--text-muted)]">
              Recent Hits
            </div>
            <div className="text-2xl font-black text-[var(--text-primary)]">Timeline ล่าสุด 10 งวด</div>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">วันที่, ประเภท, และผล last2 / last3</div>
        </div>

        <div className="space-y-4">
          {data?.recentHits.length ? (
            data.recentHits.map((hit, index) => {
              const typeStyle = TYPE_STYLES[hit.type];

              return (
                <div key={`${hit.date}-${hit.type}-${index}`} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className="mt-1 h-3 w-3 rounded-full"
                      style={{ background: typeStyle.color, boxShadow: `0 0 16px ${typeStyle.color}` }}
                    />
                    {index !== data.recentHits.length - 1 ? (
                      <div className="mt-2 h-full w-px bg-[rgba(255,255,255,0.08)]" />
                    ) : null}
                  </div>

                  <div
                    className="flex-1 rounded-[22px] border px-4 py-4 md:px-5"
                    style={{ borderColor: "var(--border-color)", background: "rgba(255,255,255,0.025)" }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-black text-[var(--text-primary)]">{formatDate(hit.date)}</div>
                        <div className="mt-1 text-xs text-[var(--text-muted)]">Occurrence #{index + 1}</div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className="inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em]"
                          style={{
                            borderColor: typeStyle.color,
                            color: typeStyle.color,
                            background: typeStyle.bg,
                          }}
                        >
                          {typeStyle.label}
                        </span>
                        <div className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-sm font-bold text-[var(--text-primary)]">
                          last2 {hit.last2}
                        </div>
                        <div className="rounded-full border border-[var(--border-color)] bg-[var(--bg-input)] px-3 py-1 text-sm font-bold text-[var(--text-primary)]">
                          last3 {hit.last3}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-[var(--border-color)] bg-[rgba(255,255,255,0.03)] px-5 py-10 text-center text-sm text-[var(--text-muted)]">
              ยังไม่พบประวัติการออกของเลขนี้
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
