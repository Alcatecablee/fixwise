import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Settings2, CheckCircle2 } from "lucide-react";
import type { FixLayer } from "@shared/schema";

interface LayerCardProps {
  layer: FixLayer;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRunLayer?: () => void;
  "data-testid"?: string;
}

export function LayerCard({ layer, isSelected, onToggleSelect, onRunLayer, "data-testid": dataTestId }: LayerCardProps) {
  const getSeverityColor = (layerNumber: number): string => {
    // Assign colors based on typical severity of each layer
    if (layerNumber === 1 || layerNumber === 4) return "bg-orange-500/10 border-l-orange-500";
    if (layerNumber === 2 || layerNumber === 3) return "bg-yellow-500/10 border-l-yellow-500";
    return "bg-blue-500/10 border-l-blue-500";
  };

  return (
    <Card
      className={`relative border-l-4 hover-elevate active-elevate-2 transition-all ${getSeverityColor(
        layer.layerNumber
      )} ${isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}
      data-testid={dataTestId}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              data-testid={`checkbox-layer-${layer.layerNumber}`}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  Layer {layer.layerNumber}
                </Badge>
              </div>
              <CardTitle className="text-base font-medium mt-2">{layer.name}</CardTitle>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm">{layer.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onRunLayer}
            data-testid={`button-run-layer-${layer.layerNumber}`}
          >
            <Play className="h-3 w-3 mr-2" />
            Run Layer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            data-testid={`button-details-layer-${layer.layerNumber}`}
          >
            <Settings2 className="h-3 w-3" />
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <code className="rounded bg-muted px-2 py-1 font-mono text-xs">{layer.scriptName}</code>
        </div>
      </CardContent>
    </Card>
  );
}
