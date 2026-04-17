"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { DRAW_TYPE_LABELS, WEEKDAY_LABELS } from "@/lib/constants";
import type { DrawResultRecord, DrawType } from "@/types";

interface ResultDetailResponse {
  record: DrawResultRecord | null;
  sameDayRecords?: DrawResultRecord[];
  prev?: DrawResultRecord | null;
  next?: DrawResultRecord | null;
}

export default function ResultDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<ResultDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/results/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!data?.record) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--text-muted)]">ไม่พบข้อมูล</p>
        <Link href="/results" className="btn-primary mt-4 inline-block">
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  const r = data.record;
  const date = new Date(r.drawDate);
  const isOdd = parseInt(r.last1) % 2 !== 0;
  const isLow = parseInt(r.last2) < 50;
  const tens = r.last2[0];
  const units = r.last2[1];
  const sameDigits = tens === units;
  const sameDayRecords = data.sameDayRecords ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`ผลงวดวันที่ ${date.toLocaleDateString("th-TH")}`}
        description={DRAW_TYPE_LABELS[r.drawType as DrawType]}
      >
        <Link href="/results" className="btn-secondary text-sm">
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          กลับ
        </Link>
      </PageHeader>

      {/* Main Info Card */}
      <div className="glass-card p-6 mb-6">
        <div className="text-center mb-6">
          <p className="text-sm text-[var(--text-muted)] mb-2">ผลเลข</p>
          <p className="text-5xl font-bold font-mono tracking-widest text-[var(--text-primary)]">
            {r.resultDigits}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Raw: {r.resultRaw}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-[var(--bg-input)]">
            <p className="text-xs text-[var(--text-muted)]">1 ตัวท้าย</p>
            <p className="text-2xl font-bold font-mono text-[var(--accent-emerald)]">
              {r.last1}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-input)]">
            <p className="text-xs text-[var(--text-muted)]">2 ตัวท้าย</p>
            <p className="text-2xl font-bold font-mono text-[var(--accent-amber)]">
              {r.last2}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-input)]">
            <p className="text-xs text-[var(--text-muted)]">3 ตัวท้าย</p>
            <p className="text-2xl font-bold font-mono text-[var(--accent-violet)]">
              {r.last3}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--bg-input)]">
            <p className="text-xs text-[var(--text-muted)]">ประเภท</p>
            <span className={`badge badge-${r.drawType.toLowerCase()}`}>
              {DRAW_TYPE_LABELS[r.drawType as DrawType]}
            </span>
          </div>
        </div>

        {/* Detail Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoItem label="วันที่" value={date.toLocaleDateString("th-TH")} />
          <InfoItem label="เวลา" value={r.drawTime || "-"} />
          <InfoItem label="วัน" value={WEEKDAY_LABELS[r.weekday]} />
          <InfoItem label="เดือน" value={r.monthKey} />
          <InfoItem label="แหล่งข้อมูล" value={r.source || "manual"} />
          <InfoItem
            label="นำเข้าเมื่อ"
            value={new Date(r.createdAt).toLocaleString("th-TH")}
          />
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card p-4 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          Analysis Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          <span
            className={`badge ${isOdd ? "badge-special" : "badge-normal"}`}
          >
            {isOdd ? "คี่ (Odd)" : "คู่ (Even)"}
          </span>
          <span className={`badge ${isLow ? "badge-normal" : "badge-vip"}`}>
            {isLow ? "ต่ำ (00-49)" : "สูง (50-99)"}
          </span>
          {sameDigits && (
            <span className="badge badge-special">เลขเบิ้ล ({r.last2})</span>
          )}
          {tens === "0" && <span className="badge badge-vip">หลักสิบ = 0</span>}
        </div>
      </div>

      {/* Same Day Records */}
      {sameDayRecords.length > 0 && (
        <div className="glass-card p-4 mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            ผลวันเดียวกัน
          </h3>
          <div className="space-y-2">
            {sameDayRecords.map((sr) => (
              <Link
                key={sr.id}
                href={`/results/${sr.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-input)] hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <span className={`badge badge-${sr.drawType.toLowerCase()}`}>
                  {DRAW_TYPE_LABELS[sr.drawType as DrawType]}
                </span>
                <span className="font-mono font-bold">{sr.resultDigits}</span>
                <span className="font-mono text-[var(--accent-amber)]">
                  {sr.last2}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        {data.prev ? (
          <Link
            href={`/results/${data.prev.id}`}
            className="btn-secondary text-sm"
          >
            <ChevronLeft className="w-4 h-4 inline mr-1" />
            ก่อนหน้า ({data.prev.resultDigits})
          </Link>
        ) : (
          <div />
        )}
        {data.next ? (
          <Link
            href={`/results/${data.next.id}`}
            className="btn-secondary text-sm"
          >
            ถัดไป ({data.next.resultDigits})
            <ChevronRight className="w-4 h-4 inline ml-1" />
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--bg-input)]">
      <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
      <p className="text-sm font-medium text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
