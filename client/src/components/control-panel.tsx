import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Play, Eye, RotateCcw, Settings, Zap } from "lucide-react";
import type { FixLayer } from "@shared/schema";

interface ControlPanelProps {
  layers: FixLayer[];
  selectedLayers: string[];
  onLayerSelectionChange: (layerIds: string[]) => void;
  isExecuting: boolean;
  onExecute: () => void;
  onDryRun: () => void;
}

export function ControlPanel({
  layers,
  selectedLayers,
  onLayerSelectionChange,
  isExecuting,
  onExecute,
  onDryRun,
}: ControlPanelProps) {
  const allSelected = selectedLayers.length === layers.length;
  const someSelected = selectedLayers.length > 0 && selectedLayers.length < layers.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onLayerSelectionChange([]);
    } else {
      onLayerSelectionChange(layers.map((l) => l.id));
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-medium">Execution Control</CardTitle>
              <CardDescription>Select layers and run automated fixes</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="font-mono" data-testid="badge-selected-count">
            {selectedLayers.length} of {layers.length} selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Layer Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                data-testid="checkbox-select-all"
                className={someSelected ? "opacity-50" : ""}
              />
              <label className="text-sm font-medium">
                {allSelected ? "Deselect All" : "Select All Layers"}
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onLayerSelectionChange([])}>
              <RotateCcw className="h-3 w-3 mr-2" />
              Reset
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`flex items-center gap-2 p-3 rounded-md border transition-all ${
                  selectedLayers.includes(layer.id)
                    ? "bg-primary/10 border-primary/30"
                    : "bg-muted/30 border-border hover-elevate"
                }`}
                data-testid={`layer-option-${layer.layerNumber}`}
              >
                <Checkbox
                  checked={selectedLayers.includes(layer.id)}
                  onCheckedChange={() => {
                    onLayerSelectionChange(
                      selectedLayers.includes(layer.id)
                        ? selectedLayers.filter((id) => id !== layer.id)
                        : [...selectedLayers, layer.id]
                    );
                  }}
                  data-testid={`checkbox-layer-${layer.layerNumber}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      L{layer.layerNumber}
                    </Badge>
                    <span className="text-sm font-medium truncate">{layer.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="lg"
            disabled={selectedLayers.length === 0 || isExecuting}
            onClick={onExecute}
            className="flex-1 min-w-[200px]"
            data-testid="button-run-selected"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? "Running..." : `Run ${selectedLayers.length > 0 ? `${selectedLayers.length} Layer${selectedLayers.length > 1 ? "s" : ""}` : "Selected"}`}
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={selectedLayers.length === 0 || isExecuting}
            onClick={onDryRun}
            data-testid="button-dry-run"
          >
            <Eye className="h-4 w-4 mr-2" />
            Dry Run
          </Button>
          <Button
            variant="outline"
            size="lg"
            disabled={isExecuting}
            data-testid="button-settings"
          >
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>

        {/* Progress (shown when executing) */}
        {isExecuting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing layer 2 of {selectedLayers.length}</span>
              <span className="font-medium">45%</span>
            </div>
            <Progress value={45} className="h-2" data-testid="progress-execution" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
