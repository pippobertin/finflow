function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function AdvancedSettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <SkeletonBlock className="h-48" />
      <SkeletonBlock className="h-48" />
      <SkeletonBlock className="h-32" />
    </div>
  );
}
