type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: Record<string, any>;
  userId?: string;
  requestId?: string;
  duration?: number;
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const CURRENT_LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "INFO";

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL];
}

function formatLog(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level}] [${entry.module}] ${entry.message}`;
  const extras: string[] = [];
  
  if (entry.userId) extras.push(`userId=${entry.userId}`);
  if (entry.requestId) extras.push(`requestId=${entry.requestId}`);
  if (entry.duration !== undefined) extras.push(`duration=${entry.duration}ms`);
  if (entry.data) extras.push(`data=${JSON.stringify(entry.data)}`);
  
  return extras.length > 0 ? `${base} | ${extras.join(" | ")}` : base;
}

function log(level: LogLevel, module: string, message: string, options?: {
  data?: Record<string, any>;
  userId?: string;
  requestId?: string;
  duration?: number;
}): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    ...options,
  };
  
  const formatted = formatLog(entry);
  
  switch (level) {
    case "ERROR":
      console.error(formatted);
      break;
    case "WARN":
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export function createLogger(module: string) {
  return {
    debug: (message: string, options?: Parameters<typeof log>[3]) => log("DEBUG", module, message, options),
    info: (message: string, options?: Parameters<typeof log>[3]) => log("INFO", module, message, options),
    warn: (message: string, options?: Parameters<typeof log>[3]) => log("WARN", module, message, options),
    error: (message: string, options?: Parameters<typeof log>[3]) => log("ERROR", module, message, options),
    
    withRequest: (requestId: string) => ({
      debug: (message: string, options?: Parameters<typeof log>[3]) => log("DEBUG", module, message, { ...options, requestId }),
      info: (message: string, options?: Parameters<typeof log>[3]) => log("INFO", module, message, { ...options, requestId }),
      warn: (message: string, options?: Parameters<typeof log>[3]) => log("WARN", module, message, { ...options, requestId }),
      error: (message: string, options?: Parameters<typeof log>[3]) => log("ERROR", module, message, { ...options, requestId }),
    }),
    
    withUser: (userId: string) => ({
      debug: (message: string, options?: Parameters<typeof log>[3]) => log("DEBUG", module, message, { ...options, userId }),
      info: (message: string, options?: Parameters<typeof log>[3]) => log("INFO", module, message, { ...options, userId }),
      warn: (message: string, options?: Parameters<typeof log>[3]) => log("WARN", module, message, { ...options, userId }),
      error: (message: string, options?: Parameters<typeof log>[3]) => log("ERROR", module, message, { ...options, userId }),
    }),

    time: (label: string) => {
      const start = Date.now();
      return {
        end: (message?: string) => {
          const duration = Date.now() - start;
          log("DEBUG", module, message || label, { duration });
          return duration;
        },
      };
    },
  };
}
