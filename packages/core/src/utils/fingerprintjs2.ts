import Fingerprint2 from "fingerprintjs2";

/**
 * 创建浏览器指纹
 * @param callback
 */
export const createFingerprint = (callback: (fingercode: string) => void) => {
  // 浏览器指纹
  Fingerprint2.get((components: any) => {
    const values = components.map((component: any) => component.value);
    const fingercode = Fingerprint2.x64hash128(values.join(""), 31);
    callback(fingercode);
  });
};
