import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title = "ไม่พบข้อมูล",
  message = "ยังไม่มีข้อมูลในระบบ ลองนำเข้าข้อมูลก่อน",
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--bg-card)] flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-secondary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] mb-4 max-w-md">
        {message}
      </p>
      {action}
    </div>
  );
}
