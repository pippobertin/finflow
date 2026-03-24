function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`bg-muted animate-pulse rounded-lg ${className ?? ""}`} />;
}

export default function CashflowLoading() {
  return (
    <div className="space-y-6 p-6">
      <SkeletonBlock className="h-16 w-full" />
      <div className="flex gap-4">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-10 w-64" />
      </div>
      <SkeletonBlock className="h-[400px]" />
      <SkeletonBlock className="h-[300px]" />
    </div>
  );
}
