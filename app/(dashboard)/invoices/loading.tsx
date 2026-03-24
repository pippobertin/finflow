function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function InvoicesLoading() {
  return (
    <div className="space-y-4 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <SkeletonBlock className="h-10 w-64" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-10 w-64" />
        <SkeletonBlock className="h-10 w-40" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}
