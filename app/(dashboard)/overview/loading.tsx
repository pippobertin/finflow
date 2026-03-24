function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function OverviewLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Navbar placeholder */}
      <SkeletonBlock className="h-16 w-full" />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>

      {/* Chart */}
      <SkeletonBlock className="h-[400px]" />

      {/* Two charts side by side */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkeletonBlock className="h-[350px]" />
        <SkeletonBlock className="h-[350px]" />
      </div>
    </div>
  );
}
