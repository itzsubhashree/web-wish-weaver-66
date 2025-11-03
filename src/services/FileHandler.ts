/**
 * FILE HANDLING: FileHandler class manages local storage of emergency logs
 * Demonstrates file handling concept using browser localStorage
 */

export interface EmergencyLog {
  id: string;
  userId: string;
  type: string;
  message: string;
  location: { lat: number; lng: number } | null;
  locationAddress: string;
  timestamp: Date;
  status: string;
  notificationResults?: any[];
}

export class FileHandler {
  private static readonly STORAGE_KEY = "emergency_logs";
  private static readonly MAX_LOGS = 100; // Maximum logs to store

  // FILE HANDLING: Write log to storage
  static saveLog(log: EmergencyLog): void {
    try {
      const logs = this.readLogs();
      logs.unshift(log); // Add to beginning

      // Keep only MAX_LOGS entries
      const trimmedLogs = logs.slice(0, this.MAX_LOGS);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedLogs));
      console.log(`📝 Log saved: ${log.id}`);
    } catch (error) {
      console.error("Failed to save log:", error);
    }
  }

  // FILE HANDLING: Read all logs from storage
  static readLogs(): EmergencyLog[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const logs = JSON.parse(data);
      // Convert timestamp strings back to Date objects
      return logs.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp),
      }));
    } catch (error) {
      console.error("Failed to read logs:", error);
      return [];
    }
  }

  // FILE HANDLING: Read logs for specific user
  static readUserLogs(userId: string): EmergencyLog[] {
    const allLogs = this.readLogs();
    return allLogs.filter((log) => log.userId === userId);
  }

  // FILE HANDLING: Delete specific log
  static deleteLog(logId: string): void {
    try {
      const logs = this.readLogs();
      const filteredLogs = logs.filter((log) => log.id !== logId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredLogs));
      console.log(`🗑️ Log deleted: ${logId}`);
    } catch (error) {
      console.error("Failed to delete log:", error);
    }
  }

  // FILE HANDLING: Clear all logs
  static clearAllLogs(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log("🗑️ All logs cleared");
    } catch (error) {
      console.error("Failed to clear logs:", error);
    }
  }

  // FILE HANDLING: Export logs to JSON file
  static exportLogs(): void {
    const logs = this.readLogs();
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `emergency_logs_${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log("📥 Logs exported");
  }

  // Get statistics
  static getStatistics(userId?: string): {
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  } {
    const logs = userId ? this.readUserLogs(userId) : this.readLogs();

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    logs.forEach((log) => {
      byType[log.type] = (byType[log.type] || 0) + 1;
      byStatus[log.status] = (byStatus[log.status] || 0) + 1;
    });

    return {
      total: logs.length,
      byType,
      byStatus,
    };
  }
}
