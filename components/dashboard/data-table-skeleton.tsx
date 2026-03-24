interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
}

function SkeletonComponent({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded ${className ?? ""}`} />;
}

export function DataTableSkeleton({ columns = 5, rows = 8 }: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonComponent key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, col) => (
            <SkeletonComponent key={col} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
