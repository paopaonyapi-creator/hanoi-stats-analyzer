export function LoadingState({ message = "กำลังโหลดข้อมูล..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="spinner mb-4" />
      <p className="text-sm text-[var(--text-muted)]">{message}</p>
    </div>
  );
}
