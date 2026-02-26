import FingerprintJS from "@fingerprintjs/fingerprintjs";

/**
 * 创建浏览器指纹
 * @param callback 回调函数，入参为指纹字符串
 */
export const createFingerprint = async (
  callback: (fingercode: string) => void,
): Promise<void> => {
  // 使用官方 FingerprintJS v4 生成浏览器指纹
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  // 这里直接使用库提供的 visitorId 作为指纹
  callback(result.visitorId);
};
