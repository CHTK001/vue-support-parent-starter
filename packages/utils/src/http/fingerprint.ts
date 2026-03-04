import { createFingerprint } from "@repo/core";
import { localStorageProxy } from "../storage";

/** 访问指纹存储 Key */
const VISIT_ID_KEY = "visitId";

/** 指纹初始化是否已触发 */
let fingerprintInitStarted = false;

/**
 * 获取或创建访问指纹
 * 优先使用浏览器指纹插件生成的指纹，不再使用随机数
 */
export const getOrCreateFingerprint = (): string => {
  const rawFingerprint = localStorageProxy().getItem<unknown>(VISIT_ID_KEY);
  const normalized = !rawFingerprint? ""
    : String(rawFingerprint).trim();

  // 如果存储里不是 string（例如被写成 number），这里统一规范化并回写，避免 header 变成数字
  if (normalized) {
    localStorageProxy().setItem(VISIT_ID_KEY, normalized);
    return normalized;
  }

  if (!fingerprintInitStarted) {
    fingerprintInitStarted = true;
    void createFingerprint((fingercode: string) => {
      const fingerprint = fingercode ? String(fingercode).trim() : "";
      if (fingerprint) {
        localStorageProxy().setItem(VISIT_ID_KEY, fingerprint);
      }
    }).catch((e: unknown) => {
      if (process.env.NODE_ENV === "development") {
        // 指纹初始化失败仅在开发环境输出日志，避免干扰线上
        console.error("[HTTP][Fingerprint] 指纹插件初始化失败:", e);
      }
    });
  }
  return "";
};


