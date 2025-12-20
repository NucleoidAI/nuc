import fs from "fs";
import path from "path";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
}

export class FileSystemLogger {
  private logDir: string;
  private logFileName: string;
  private maxFileSize: number; // in bytes
  private maxFiles: number;

  constructor(
    options: {
      logDir?: string;
      logFileName?: string;
      maxFileSize?: number;
      maxFiles?: number;
    } = {}
  ) {
    this.logDir = options.logDir || path.join(process.cwd(), "logs");
    this.logFileName = options.logFileName || "email-service.log";
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.maxFiles = options.maxFiles || 5;

    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    return path.join(this.logDir, this.logFileName);
  }

  private formatLogEntry(entry: LogEntry): string {
    const metadataStr = entry.metadata
      ? `\n${JSON.stringify(entry.metadata, null, 2)}`
      : "";
    return `[${entry.timestamp}] [${entry.level}] ${entry.message}${metadataStr}\n`;
  }

  private rotateLogsIfNeeded(): void {
    const logPath = this.getLogFilePath();

    if (!fs.existsSync(logPath)) {
      return;
    }

    const stats = fs.statSync(logPath);
    if (stats.size < this.maxFileSize) {
      return;
    }

    // Rotate existing logs
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldPath = `${logPath}.${i}`;
      const newPath = `${logPath}.${i + 1}`;

      if (fs.existsSync(oldPath)) {
        if (i === this.maxFiles - 1) {
          fs.unlinkSync(oldPath); // Delete oldest log
        } else {
          fs.renameSync(oldPath, newPath);
        }
      }
    }

    // Rename current log to .1
    fs.renameSync(logPath, `${logPath}.1`);
  }

  private writeLog(level: LogLevel, message: string, metadata?: any): void {
    this.rotateLogsIfNeeded();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    const logLine = this.formatLogEntry(entry);
    const logPath = this.getLogFilePath();

    try {
      fs.appendFileSync(logPath, logLine, "utf8");
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }

  debug(message: string, metadata?: any): void {
    this.writeLog(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: any): void {
    this.writeLog(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.writeLog(LogLevel.WARN, message, metadata);
  }

  error(message: string, metadata?: any): void {
    this.writeLog(LogLevel.ERROR, message, metadata);
  }

  // Specialized method for email logging
  logEmail(
    action: string,
    details: {
      to?: string;
      subject?: string;
      success?: boolean;
      messageId?: string;
      error?: string;
    }
  ): void {
    const level = details.success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Email ${action}: ${details.success ? "Success" : "Failed"}`;

    this.writeLog(level, message, {
      action,
      ...details,
    });
  }

  // Read recent logs
  readLogs(lines: number = 100): string[] {
    const logPath = this.getLogFilePath();

    if (!fs.existsSync(logPath)) {
      return [];
    }

    try {
      const content = fs.readFileSync(logPath, "utf8");
      const allLines = content.split("\n").filter((line) => line.trim());
      return allLines.slice(-lines);
    } catch (error) {
      console.error("Failed to read log file:", error);
      return [];
    }
  }

  // Clear all logs
  clearLogs(): void {
    const logPath = this.getLogFilePath();

    if (fs.existsSync(logPath)) {
      fs.unlinkSync(logPath);
    }

    // Clear rotated logs
    for (let i = 1; i <= this.maxFiles; i++) {
      const rotatedPath = `${logPath}.${i}`;
      if (fs.existsSync(rotatedPath)) {
        fs.unlinkSync(rotatedPath);
      }
    }

    this.info("Logs cleared");
  }
}

// Singleton instance
export const logger = new FileSystemLogger();
