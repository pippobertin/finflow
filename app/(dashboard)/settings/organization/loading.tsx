function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function OrganizationSettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}
