import { getConfig } from "@repo/config";
import { getErrorHandlerConfig } from "./request-config";
import { getOrCreateFingerprint } from "./fingerprint";

/** 错误上报队列（防刷机制） */
const errorReportQueue: Map<string, number> = new Map();
const ERROR_REPORT_INTERVAL = 60000;

/** 上报错误到服务器 */
export const reportErrorToServer = async (error: any, url: string) => {
  const config = getErrorHandlerConfig();
  if (!config.enable || !config.reportToServer) {
    return;
  }

  const errorKey = `${error.code || "unknown"}_${url}`;
  const lastReportTime = errorReportQueue.get(errorKey);
  const now = Date.now();

  if (lastReportTime && now - lastReportTime < ERROR_REPORT_INTERVAL) {
    return;
  }

  errorReportQueue.set(errorKey, now);

  errorReportQueue.forEach((time, key) => {
    if (now - time > ERROR_REPORT_INTERVAL) {
      errorReportQueue.delete(key);
    }
  });

  try {
    const baseUrl = getConfig().ApiAddress || getConfig().BaseUrl;
    await fetch(baseUrl + config.reportUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        code: error.code,
        message: error.msg || error.message,
        timestamp: now,
        userAgent: navigator.userAgent,
        fingerprint: getOrCreateFingerprint(),
      }),
    });
  } catch (e) {
    if (config.logToConsole) {
      // 上报失败仅在控制台打印，避免影响主流程
      console.warn("Error report failed:", e);
    }
  }
};


