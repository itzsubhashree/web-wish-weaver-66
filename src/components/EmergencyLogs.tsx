/**
 * COMPONENT: EmergencyLogs - Demonstrates FILE HANDLING
 * Uses FileHandler class to read and display emergency logs from localStorage
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileHandler, EmergencyLog } from "@/services/FileHandler";
import { Download, Trash2, MapPin, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmergencyLogsProps {
  userId?: string;
}

export function EmergencyLogs({ userId }: EmergencyLogsProps) {
  const [logs, setLogs] = useState<EmergencyLog[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof FileHandler.getStatistics>>();

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = () => {
    // OOP: Using FileHandler to read logs (FILE HANDLING)
    const allLogs = userId ? FileHandler.readUserLogs(userId) : FileHandler.readLogs();
    setLogs(allLogs);
    setStats(FileHandler.getStatistics(userId));
  };

  const handleExport = () => {
    // OOP: Using FileHandler to export logs
    FileHandler.exportLogs();
    toast({
      title: "Logs exported",
      description: "Emergency logs have been downloaded as JSON file",
    });
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all logs?")) {
      FileHandler.clearAllLogs();
      loadLogs();
      toast({
        title: "Logs cleared",
        description: "All emergency logs have been removed",
      });
    }
  };

  const getAlertTypeColor = (type: string) => {
    const colors = {
      medical: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      fire: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      police: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
      general: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      acknowledged: "bg-green-500/10 text-green-500 border-green-500/20",
      resolved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      {stats && (
        <Card className="border-accent/20 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📊 Emergency Statistics</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="border-success/30 hover:bg-success/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-destructive/30 hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-3xl font-bold text-primary">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Alerts</div>
              </div>
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>📝 Emergency Logs (Local Storage)</CardTitle>
          <CardDescription>
            Logs are stored locally using FileHandler class - demonstrates FILE HANDLING concept
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No emergency logs found</p>
              <p className="text-sm mt-2">Triggered alerts will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={getAlertTypeColor(log.type)}>
                          {log.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      {log.message && (
                        <p className="text-sm">{log.message}</p>
                      )}
                      
                      {log.location && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs">{log.locationAddress}</span>
                        </div>
                      )}
                      
                      {log.notificationResults && log.notificationResults.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {log.notificationResults.map((result, idx) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs"
                            >
                              {result.type}: {result.success ? "✓" : "✗"}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
