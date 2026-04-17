export function LoadingState({ message = "กำลังโหลดข้อมูล..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6" aria-live="polite">
      {/* Animated rings */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--border-color)]" />
        <div className="absolute inset-0 rounded-full border-2 border-t-[var(--accent-blue)] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-1 rounded-full border border-t-[var(--accent-violet)] border-r-transparent border-b-transparent border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:0.6s]" />
      </div>
      <p className="text-sm font-medium text-[var(--text-muted)] tracking-widest uppercase">{message}</p>

      {/* Shimmer skeleton cards */}
      <div className="w-full max-w-2xl space-y-3 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-4 animate-shimmer rounded-xl h-14" />
        ))}
      </div>
    </div>
  );
}
