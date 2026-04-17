interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex w-full flex-wrap items-center gap-3 md:w-auto md:justify-end">
          {children}
        </div>
      )}
    </div>
  );
}
