function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function ConnectorsLoading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
