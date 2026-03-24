import { Badge } from "@/components/ui/badge";

interface CostCenterBadgeProps {
  name: string;
  color: string;
  className?: string;
}

export function CostCenterBadge({ name, color, className }: CostCenterBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      <span
        className="mr-1.5 inline-block h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name}
    </Badge>
  );
}
