interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div className={`chart-card animate-fade-in ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
