"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import type { CsvPreviewRow } from "@/types";
import { parseCsvText } from "@/lib/csv/parse";

interface ImportResult {
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  error?: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsvText(text);
      setPreview(parsed.rows);
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    const validRows = preview.filter((r) => r.status === "valid");
    if (validRows.length === 0) return;

    setImporting(true);
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file?.name || "manual-import",
          rows: validRows.map((r) => ({
            date: r.date,
            type: r.type,
            time: r.time,
            result: r.result,
          })),
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setResult({
        totalRows: 0,
        importedRows: 0,
        skippedRows: 0,
        errorRows: 0,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
  };

  const validCount = preview.filter((r) => r.status === "valid").length;
  const invalidCount = preview.filter((r) => r.status === "invalid").length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="นำเข้าข้อมูล"
        description="Import ข้อมูลจาก CSV file"
      >
        <a
          href="/samples/hanoi-sample.csv"
          download
          className="btn-secondary text-sm"
        >
          <Download className="w-4 h-4 inline mr-1" />
          ตัวอย่าง CSV
        </a>
      </PageHeader>

      {/* Upload Area */}
      {!file && (
        <div
          className={`dropzone mb-6 ${dragActive ? "active" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Upload className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] mb-2">
            ลากไฟล์ CSV มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            รองรับ fields: date, type, time, result
            (หรือ draw_date, draw_type, draw_time, number, value)
          </p>
        </div>
      )}

      {/* File Info */}
      {file && !result && (
        <div className="glass-card p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-[var(--accent-blue)]" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {file.name}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {(file.size / 1024).toFixed(1)} KB · {preview.length} rows
                </p>
              </div>
            </div>
            <button className="btn-secondary text-xs" onClick={handleClear}>
              <X className="w-3 h-3 inline mr-1" />
              ล้าง
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-[var(--accent-emerald)]" />
              <span className="text-[var(--text-secondary)]">
                Valid: {validCount}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-[var(--accent-rose)]" />
              <span className="text-[var(--text-secondary)]">
                Invalid: {invalidCount}
              </span>
            </div>
          </div>

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="overflow-x-auto mb-4" style={{ maxHeight: "400px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Result</th>
                    <th>Parsed</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row) => (
                    <tr key={row.rowIndex}>
                      <td className="text-[var(--text-muted)]">
                        {row.rowIndex}
                      </td>
                      <td>
                        {row.status === "valid" ? (
                          <CheckCircle className="w-4 h-4 text-[var(--accent-emerald)]" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-[var(--accent-rose)]" />
                        )}
                      </td>
                      <td>{row.date}</td>
                      <td>{row.type}</td>
                      <td>{row.time}</td>
                      <td className="font-mono">{row.result}</td>
                      <td className="font-mono text-[var(--accent-amber)]">
                        {row.parsedDigits || "-"}
                      </td>
                      <td className="text-xs text-[var(--accent-rose)]">
                        {row.reason || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import Button */}
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={handleClear}>
              ยกเลิก
            </button>
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={importing || validCount === 0}
            >
              {importing ? (
                <>
                  <span className="spinner inline-block w-4 h-4 mr-2" />
                  กำลังนำเข้า...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 inline mr-1" />
                  นำเข้า {validCount} รายการ
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-card p-6 mb-6 animate-slide-up">
          {result.error ? (
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-[var(--accent-rose)] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--accent-rose)] mb-2">
                เกิดข้อผิดพลาด
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {result.error}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-[var(--accent-emerald)] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                นำเข้าสำเร็จ
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-3 rounded-lg bg-[var(--bg-input)]">
                  <p className="text-xs text-[var(--text-muted)]">ทั้งหมด</p>
                  <p className="text-xl font-bold">{result.totalRows}</p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-input)]">
                  <p className="text-xs text-[var(--text-muted)]">นำเข้าแล้ว</p>
                  <p className="text-xl font-bold text-[var(--accent-emerald)]">
                    {result.importedRows}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-input)]">
                  <p className="text-xs text-[var(--text-muted)]">ข้าม (ซ้ำ)</p>
                  <p className="text-xl font-bold text-[var(--accent-amber)]">
                    {result.skippedRows}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-input)]">
                  <p className="text-xs text-[var(--text-muted)]">Error</p>
                  <p className="text-xl font-bold text-[var(--accent-rose)]">
                    {result.errorRows}
                  </p>
                </div>
              </div>
              <button className="btn-primary" onClick={handleClear}>
                นำเข้าเพิ่มเติม
              </button>
            </div>
          )}
        </div>
      )}

      {/* CSV Format Guide */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          รูปแบบ CSV ที่รองรับ
        </h3>
        <pre className="text-xs text-[var(--text-secondary)] bg-[var(--bg-input)] p-4 rounded-lg overflow-x-auto">
{`date,type,time,result
2025-03-01,SPECIAL,17:05,48273
2025-03-01,NORMAL,18:10,91652
2025-03-01,VIP,19:15,37491`}
        </pre>
        <div className="mt-3 text-xs text-[var(--text-muted)] space-y-1">
          <p>
            • รองรับ aliases: draw_date, draw_type, draw_time, number, value, result5
          </p>
          <p>
            • Type: SPECIAL, NORMAL, VIP (หรือ ฮานอยพิเศษ, ฮานอยปกติ, ฮานอยวีไอพี)
          </p>
          <p>• Date formats: yyyy-MM-dd, dd/MM/yyyy, ISO 8601</p>
          <p>• ระบบจะข้ามรายการซ้ำอัตโนมัติ</p>
        </div>
      </div>
    </div>
  );
}
