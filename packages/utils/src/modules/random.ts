/**
 * 随机数 / uuid 工具（迁移自 koi/utils/random.ts）
 */

/** 获取随机整数 */
export function randomInt(m: number, n: number) {
  const num = Math.floor(Math.random() * (m - n) + n);
  return num;
}

/** 生成随机数：1 参为 [1,min]，2 参为 [min,max] */
export function randomNum(min: number, max: number) {
  switch (arguments.length) {
    case 1:
      return parseInt((Math.random() * min + 1).toString(), 10);
    case 2:
      return parseInt((Math.random() * (max - min + 1) + min).toString(), 10);
    default:
      return 0;
  }
}

const hexList: string[] = [];
for (let i = 0; i <= 15; i++) {
  hexList[i] = i.toString(16);
}

/** 生成 uuid */
export function uuid(): string {
  let u = "";
  for (let i = 1; i <= 36; i++) {
    if (i === 9 || i === 14 || i === 19 || i === 24) {
      u += "-";
    } else if (i === 15) {
      u += 4;
    } else if (i === 20) {
      u += hexList[(Math.random() * 4) | 8];
    } else {
      u += hexList[(Math.random() * 16) | 0];
    }
  }
  return u;
}

/** 生成唯一 uuid（generateUUID 别名，与 koi 旧实现一致） */
export function generateUUID(): string {
  let uuidStr = "";
  for (let i = 0; i < 32; i++) {
    const random = (Math.random() * 16) | 0;
    if (i === 8 || i === 12 || i === 16 || i === 20) uuidStr += "-";
    uuidStr += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
  }
  return uuidStr;
}

/** 时间段问候语 */
export const getDayText = () => {
  const now = new Date();
  const hours = now.getHours();
  if (hours >= 6 && hours < 10) return `早上好，新的一天开始了，愿您充满活力！`;
  if (hours >= 10 && hours < 14) return `中午好，记得好好吃饭，小憩一下～`;
  if (hours >= 14 && hours < 18) return `下午好，继续加油，今天依然美好！`;
  if (hours >= 18 && hours < 24) return `晚上好，放下疲惫，早点休息哟。`;
  return `凌晨好，夜已深，注意身体，早点睡吧。`;
};

/** 获取浏览器默认语言 */
export const getBrowserLang = () => {
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    const browserLang = navigator.language || (navigator as any).browserLanguage;
    const lang = browserLang?.toLowerCase() || "";
    if (["cn", "zh", "zh-cn"].includes(lang)) {
      return "zh";
    }
  }
  return "en";
};

/** 数字转换为 K 单位 */
export const getFormatToK = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return String(num);
};
