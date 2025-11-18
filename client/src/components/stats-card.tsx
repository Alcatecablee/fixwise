import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "error";
  "data-testid"?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  "data-testid": dataTestId,
}: StatsCardProps) {
  const variantStyles = {
    default: "bg-card",
    success: "bg-green-500/5 border-green-500/20",
    warning: "bg-yellow-500/5 border-yellow-500/20",
    error: "bg-red-500/5 border-red-500/20",
  };

  const iconStyles = {
    default: "text-muted-foreground",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  return (
    <Card className={`hover-elevate ${variantStyles[variant]}`} data-testid={dataTestId}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h3 className="text-2xl font-semibold tracking-tight" data-testid={`${dataTestId}-value`}>
                {value}
              </h3>
            </div>
            {trend && (
              <p className="text-xs text-muted-foreground mt-2" data-testid={`${dataTestId}-trend`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`rounded-md bg-muted p-3 ${iconStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
