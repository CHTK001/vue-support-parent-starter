import { createFingerprint } from "@repo/core";
import { localStorageProxy } from "../storage";
import { storageLocal } from "@pureadmin/utils";

/** 访问指纹存储 Key */
const VISIT_ID_KEY = "visitId";

/** 指纹初始化是否已触发 */
let fingerprintInitStarted = false;

/**
 * 获取或创建访问指纹
 * 指纹必须以明文存储和读取，不能经过加密，否则签名计算会用密文导致后端验签失败
 * 兼容两种存储方式：加密key（systemvisitId）和原始key（visitId）
 */
export const getOrCreateFingerprint = (): string => {
  // 优先从加密proxy读取（key会被转为systemvisitId）
  let rawFingerprint = localStorageProxy().getItem<unknown>(VISIT_ID_KEY);

  // 如果加密proxy读不到，尝试直接读原始key（FingerprintJS直接写入的）
  if (!rawFingerprint) {
    try {
      const raw = storageLocal().getItem(VISIT_ID_KEY);
      if (raw) {
        // 可能是JSON字符串，尝试解析
        try {
          rawFingerprint = JSON.parse(raw as string);
        } catch {
          rawFingerprint = raw;
        }
      }
    } catch {
      rawFingerprint = null;
    }
  }

  const normalized = !rawFingerprint ? "" : String(rawFingerprint).trim().replace(/^"|"$/g, "");

  if (normalized) {
    // 写入加密proxy，确保下次能从加密key读到
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
        console.error("[HTTP][Fingerprint] 指纹插件初始化失败:", e);
      }
    });
  }
  return "";
};
