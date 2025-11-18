import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye,
  Zap,
  Layers,
  Shield,
  Terminal
} from "lucide-react";
import { LayerCard } from "@/components/layer-card";
import { StatsCard } from "@/components/stats-card";
import { ExecutionLogPanel } from "@/components/execution-log-panel";
import { IssueList } from "@/components/issue-list";
import { ControlPanel } from "@/components/control-panel";
import { useState, useEffect } from "react";
import { useWebSocket, type WebSocketMessage } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ExecutionRun, FixLayer, DetectedIssue, ExecutionLog } from "@shared/schema";

export default function Dashboard() {
  const [selectedLayers, setSelectedLayers] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [realtimeLogs, setRealtimeLogs] = useState<ExecutionLog[]>([]);
  const [realtimeIssues, setRealtimeIssues] = useState<DetectedIssue[]>([]);
  const { toast } = useToast();

  // Fetch layers
  const { data: layers = [], isLoading: layersLoading } = useQuery<FixLayer[]>({
    queryKey: ["/api/layers"],
  });

  // Fetch recent runs
  const { data: recentRuns = [], isLoading: runsLoading } = useQuery<ExecutionRun[]>({
    queryKey: ["/api/runs"],
  });

  // Fetch current run logs
  const { data: currentRunLogs = [] } = useQuery<ExecutionLog[]>({
    queryKey: ["/api/runs", currentRunId, "logs"],
    enabled: !!currentRunId,
  });

  // Fetch current run issues
  const { data: currentRunIssues = [] } = useQuery<DetectedIssue[]>({
    queryKey: ["/api/runs", currentRunId, "issues"],
    enabled: !!currentRunId,
  });

  // Execute mutation
  const executeMutation = useMutation({
    mutationFn: async ({ layerIds, dryRun }: { layerIds: string[]; dryRun: boolean }) => {
      return await apiRequest("POST", "/api/execute", { layerIds, dryRun });
    },
    onSuccess: (data: any) => {
      setCurrentRunId(data.runId);
      setIsExecuting(true);
      setRealtimeLogs([]);
      setRealtimeIssues([]);
      toast({
        title: "Execution Started",
        description: "Fix scripts are now running...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Detect issues mutation
  const detectIssuesMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/detect-issues", {});
    },
    onSuccess: (data: any) => {
      setCurrentRunId(data.runId);
      setRealtimeLogs([]);
      setRealtimeIssues([]);
      toast({
        title: "Issue Detection Started",
        description: "Scanning codebase for issues...",
      });
    },
  });

  // WebSocket for real-time updates
  useWebSocket((message: WebSocketMessage) => {
    switch (message.type) {
      case 'log':
        setRealtimeLogs(prev => [...prev, message.data]);
        break;
      case 'issue-detected':
        setRealtimeIssues(prev => [...prev, message.data]);
        break;
      case 'run-updated':
        // Invalidate queries to refresh stats
        queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
        break;
      case 'run-completed':
        setIsExecuting(false);
        queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/runs", currentRunId, "issues"] });
        queryClient.invalidateQueries({ queryKey: ["/api/runs", currentRunId, "logs"] });
        toast({
          title: "Execution Completed",
          description: "All fixes have been applied successfully!",
        });
        break;
      case 'run-failed':
        setIsExecuting(false);
        queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
        toast({
          title: "Execution Failed",
          description: message.data.error,
          variant: "destructive",
        });
        break;
    }
  });

  // Calculate stats from real data
  const stats = {
    totalFixes: recentRuns.reduce((sum, run) => sum + (run.totalIssuesFixed || 0), 0),
    criticalIssues: recentRuns[0]?.criticalIssues || 0,
    lastRunTime: recentRuns[0] ? getTimeAgo(recentRuns[0].startTime) : "Never",
    successRate: calculateSuccessRate(recentRuns),
  };

  // Combine real-time logs with fetched logs
  const displayLogs = currentRunId ? [...currentRunLogs, ...realtimeLogs] : realtimeLogs;
  const displayIssues = currentRunId ? [...currentRunIssues, ...realtimeIssues] : realtimeIssues;

  const handleExecute = () => {
    if (selectedLayers.length === 0) {
      toast({
        title: "No Layers Selected",
        description: "Please select at least one layer to execute.",
        variant: "destructive",
      });
      return;
    }
    executeMutation.mutate({ layerIds: selectedLayers, dryRun: false });
  };

  const handleDryRun = () => {
    detectIssuesMutation.mutate();
  };

  // Select all layers by default
  useEffect(() => {
    if (layers.length > 0 && selectedLayers.length === 0) {
      setSelectedLayers(layers.map(l => l.id));
    }
  }, [layers]);

  if (layersLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-app-title">Fixwise</h1>
                <p className="text-xs text-muted-foreground">Automated Code Fixing Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" data-testid="button-settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total Fixes Applied"
            value={stats.totalFixes.toString()}
            icon={CheckCircle2}
            trend={recentRuns.length > 0 ? "From recent runs" : "No runs yet"}
            data-testid="card-stat-total-fixes"
          />
          <StatsCard
            title="Critical Issues"
            value={stats.criticalIssues.toString()}
            icon={AlertCircle}
            trend={stats.criticalIssues > 0 ? "Needs attention" : "All clear"}
            variant={stats.criticalIssues > 0 ? "warning" : "success"}
            data-testid="card-stat-critical-issues"
          />
          <StatsCard
            title="Last Run"
            value={stats.lastRunTime}
            icon={Clock}
            trend={recentRuns[0]?.buildStatus === "passed" ? "All checks passed" : "N/A"}
            data-testid="card-stat-last-run"
          />
          <StatsCard
            title="Success Rate"
            value={`${stats.successRate}%`}
            icon={Activity}
            trend="Based on recent runs"
            variant="success"
            data-testid="card-stat-success-rate"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="layers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md" data-testid="tabs-main">
            <TabsTrigger value="layers" data-testid="tab-layers">
              <Layers className="h-4 w-4 mr-2" />
              Layers
            </TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues">
              <Shield className="h-4 w-4 mr-2" />
              Issues ({displayIssues.length})
            </TabsTrigger>
            <TabsTrigger value="logs" data-testid="tab-logs">
              <Terminal className="h-4 w-4 mr-2" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="layers" className="space-y-6">
            {/* Control Panel */}
            <ControlPanel
              layers={layers}
              selectedLayers={selectedLayers}
              onLayerSelectionChange={setSelectedLayers}
              isExecuting={isExecuting}
              onExecute={handleExecute}
              onDryRun={handleDryRun}
            />

            {/* Layer Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {layers.map((layer) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  isSelected={selectedLayers.includes(layer.id)}
                  onToggleSelect={() => {
                    setSelectedLayers((prev) =>
                      prev.includes(layer.id)
                        ? prev.filter((id) => id !== layer.id)
                        : [...prev, layer.id]
                    );
                  }}
                  onRunLayer={() => {
                    executeMutation.mutate({ layerIds: [layer.id], dryRun: false });
                  }}
                  data-testid={`card-layer-${layer.layerNumber}`}
                />
              ))}
            </div>

            {/* Recent Runs */}
            {recentRuns.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Recent Executions</CardTitle>
                  <CardDescription>Latest fix runs and their results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentRuns.slice(0, 5).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center justify-between p-4 rounded-md border hover-elevate active-elevate-2"
                        data-testid={`row-run-${run.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            {run.status === "completed" && run.buildStatus === "passed" ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            ) : run.status === "failed" ? (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-yellow-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">
                              {run.runType === "all" ? "Full Fix Run" : run.runType === "dry-run" ? "Issue Detection" : `Single Layer`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {run.totalIssuesFixed || 0} of {run.totalIssuesFound || 0} issues fixed
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {new Date(run.startTime).toLocaleTimeString()}
                            </div>
                            <Badge variant={run.buildStatus === "passed" ? "default" : "secondary"} className="text-xs">
                              {run.buildStatus || run.status}
                            </Badge>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setCurrentRunId(run.id)}
                            data-testid={`button-view-${run.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <IssueList issues={displayIssues} />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <ExecutionLogPanel runId={currentRunId || ""} logs={displayLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function calculateSuccessRate(runs: ExecutionRun[]): number {
  if (runs.length === 0) return 100;
  const successful = runs.filter(r => r.buildStatus === "passed").length;
  return Math.round((successful / runs.length) * 100);
}
