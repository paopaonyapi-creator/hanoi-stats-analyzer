"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { LoadingState } from "@/components/common/loading-state";
import { EmptyState } from "@/components/common/empty-state";
import { DRAW_TYPE_LABELS } from "@/lib/constants";
import type { DrawResultRecord, PaginatedResponse, DrawType } from "@/types";

export default function ResultsPage() {
  const [results, setResults] = useState<PaginatedResponse<DrawResultRecord> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [drawType, setDrawType] = useState<string>("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [last2, setLast2] = useState("");
  const [last3, setLast3] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("drawDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (drawType !== "ALL") params.set("drawType", drawType);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (last2) params.set("last2", last2);
    if (last3) params.set("last3", last3);
    if (search) params.set("search", search);
    params.set("page", String(page));
    params.set("pageSize", "20");
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);

    try {
      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      setResults(data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [drawType, dateFrom, dateTo, last2, last3, search, page, sortBy, sortOrder]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="ผลย้อนหลัง"
        description="ตารางข้อมูลผลทั้งหมดในระบบ"
      >
        <a 
          href="/api/results/export" 
          download 
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </PageHeader>

      {/* Filter Bar */}
      <div className="glass-card p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              className="input-field pl-10"
              placeholder="ค้นหาเลข..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Type */}
          <select
            className="input-field"
            value={drawType}
            onChange={(e) => {
              setDrawType(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">ทุกประเภท</option>
            <option value="SPECIAL">ฮานอยพิเศษ</option>
            <option value="NORMAL">ฮานอยปกติ</option>
            <option value="VIP">ฮานอยวีไอพี</option>
          </select>

          {/* Date From */}
          <input
            type="date"
            className="input-field"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />

          {/* Date To */}
          <input
            type="date"
            className="input-field"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />

          {/* Last2 */}
          <input
            type="text"
            className="input-field"
            placeholder="เลข 2 ตัวท้าย"
            maxLength={2}
            value={last2}
            onChange={(e) => {
              setLast2(e.target.value.replace(/\D/g, ""));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState />
      ) : !results || results.total === 0 ? (
        <EmptyState
          title="ไม่พบข้อมูล"
          message="ลองเปลี่ยนเงื่อนไขการค้นหา หรือนำเข้าข้อมูลก่อน"
        />
      ) : (
        <>
          <div className="glass-card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th
                      className="cursor-pointer hover:text-[var(--text-primary)]"
                      onClick={() => handleSort("drawDate")}
                    >
                      วันที่{" "}
                      {sortBy === "drawDate" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>ประเภท</th>
                    <th>เวลา</th>
                    <th
                      className="cursor-pointer hover:text-[var(--text-primary)]"
                      onClick={() => handleSort("resultDigits")}
                    >
                      ผล{" "}
                      {sortBy === "resultDigits" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="cursor-pointer hover:text-[var(--text-primary)]"
                      onClick={() => handleSort("last2")}
                    >
                      2 ตัวท้าย{" "}
                      {sortBy === "last2" &&
                        (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                    <th>3 ตัวท้าย</th>
                    <th>วัน</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {results.data.map((r: any) => (
                    <tr key={r.id}>
                      <td>
                        {new Date(r.drawDate).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td>
                        <span className={`badge badge-${r.drawType.toLowerCase()}`}>
                          {DRAW_TYPE_LABELS[r.drawType as DrawType]}
                        </span>
                      </td>
                      <td className="text-[var(--text-muted)]">{r.drawTime || "-"}</td>
                      <td className="font-mono font-bold text-lg">{r.resultDigits}</td>
                      <td className="font-mono text-[var(--accent-amber)] font-semibold">
                        {r.last2}
                      </td>
                      <td className="font-mono text-[var(--accent-violet)]">{r.last3}</td>
                      <td className="text-[var(--text-muted)]">
                        {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][r.weekday]}
                      </td>
                      <td>
                        <Link
                          href={`/results/${r.id}`}
                          className="text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span className="text-xs">ดู</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--text-muted)]">
              แสดง {(results.page - 1) * results.pageSize + 1}–
              {Math.min(results.page * results.pageSize, results.total)} จาก{" "}
              {results.total} รายการ
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary text-xs px-3 py-2"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-[var(--text-secondary)]">
                หน้า {results.page} / {results.totalPages}
              </span>
              <button
                className="btn-secondary text-xs px-3 py-2"
                disabled={page >= results.totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
