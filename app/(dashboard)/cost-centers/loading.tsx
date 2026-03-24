function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function CostCentersLoading() {
  return (
    <div className="p-6">
      <SkeletonBlock className="mb-6 h-16 w-full" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}
