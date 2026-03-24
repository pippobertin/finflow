function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function ImportLoading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-8 w-28" />
        ))}
      </div>
      <SkeletonBlock className="h-64" />
    </div>
  );
}
