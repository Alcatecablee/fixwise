import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Info, Bug, Terminal } from "lucide-react";
import type { ExecutionLog, LogLevel } from "@shared/schema";

interface ExecutionLogPanelProps {
  runId: string;
  logs?: ExecutionLog[];
}

export function ExecutionLogPanel({ runId, logs = [] }: ExecutionLogPanelProps) {
  const displayLogs = logs;

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "debug":
        return <Bug className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getLogBadgeVariant = (level: LogLevel): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Card className="border-muted">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          <CardTitle className="text-lg font-medium">Execution Logs</CardTitle>
        </div>
        <CardDescription>Real-time output from fix execution</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] rounded-md border bg-muted/30 p-4">
          {displayLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <Terminal className="h-12 w-12 text-muted-foreground/50" />
              <div>
                <h3 className="font-medium text-muted-foreground">No logs yet</h3>
                <p className="text-sm text-muted-foreground/80 mt-1">
                  Run a fix to see execution logs here
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 font-mono text-sm">
              {displayLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0"
                  data-testid={`log-entry-${log.id}`}
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    {getLogIcon(log.level)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getLogBadgeVariant(log.level)} className="text-xs font-mono">
                        {log.level.toUpperCase()}
                      </Badge>
                      {log.layerId && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.layerId}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-foreground break-words" data-testid={`log-message-${log.id}`}>
                      {log.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
