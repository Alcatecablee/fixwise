import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle2, FileCode, Wrench, ChevronRight } from "lucide-react";
import type { DetectedIssue, Severity } from "@shared/schema";

interface IssueListProps {
  issues: DetectedIssue[];
}

export function IssueList({ issues }: IssueListProps) {
  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      case "low":
        return "bg-blue-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSeverityIcon = (severity: Severity) => {
    if (severity === "critical" || severity === "high") {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <FileCode className="h-4 w-4" />;
  };

  const groupedBySeverity = issues.reduce((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity].push(issue);
    return acc;
  }, {} as Record<Severity, DetectedIssue[]>);

  const severityOrder: Severity[] = ["critical", "high", "medium", "low"];
  const sortedSeverities = severityOrder.filter((sev) => groupedBySeverity[sev]?.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {severityOrder.map((severity) => {
          const count = groupedBySeverity[severity]?.length || 0;
          const fixed = groupedBySeverity[severity]?.filter((i) => i.fixed === 1).length || 0;

          return (
            <Card key={severity} className="hover-elevate" data-testid={`card-summary-${severity}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">{severity}</p>
                    <p className="text-2xl font-semibold mt-1" data-testid={`count-${severity}`}>
                      {count}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fixed} fixed
                    </p>
                  </div>
                  <Badge className={getSeverityColor(severity)}>
                    {getSeverityIcon(severity)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Issue List by Severity */}
      {sortedSeverities.map((severity) => (
        <Card key={severity} data-testid={`section-issues-${severity}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={getSeverityColor(severity)}>
                  {getSeverityIcon(severity)}
                  <span className="ml-2 capitalize">{severity}</span>
                </Badge>
                <CardTitle className="text-lg font-medium">
                  {groupedBySeverity[severity].length} Issues
                </CardTitle>
              </div>
            </div>
            <CardDescription>
              {groupedBySeverity[severity].filter((i) => i.fixed === 1).length} resolved,{" "}
              {groupedBySeverity[severity].filter((i) => i.fixed === 0).length} pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedBySeverity[severity].map((issue, index) => (
                <div key={issue.id}>
                  <div
                    className="flex items-start justify-between gap-4 p-4 rounded-md border hover-elevate active-elevate-2"
                    data-testid={`issue-${issue.id}`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {issue.fixed === 1 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <Badge variant="outline" className="font-mono text-xs">
                          {issue.type}
                        </Badge>
                        <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                          {issue.file}
                        </code>
                      </div>
                      <div>
                        <p className="font-medium text-sm" data-testid={`issue-description-${issue.id}`}>
                          {issue.issue}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                          <Wrench className="h-3 w-3" />
                          {issue.fix}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-view-issue-${issue.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  {index < groupedBySeverity[severity].length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {issues.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Issues Found</h3>
            <p className="text-sm text-muted-foreground">
              Your codebase appears to be in excellent shape!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
