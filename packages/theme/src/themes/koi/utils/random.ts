/**
 * 获取随机整数
 */
export function randomInt(m: number, n: number) {
  var num = Math.floor(Math.random() * (m - n) + n);
  return num;
}

/**
 * 生成随机数
 * @param min 最小值
 * @param max 最大值
 * @returns 生成的随机数
 */
export function randomNum(min: number, max: number) {
  switch (arguments.length) {
    case 1:
      return parseInt((Math.random() * min + 1).toString(), 10);
      break;
    case 2:
      return parseInt((Math.random() * (max - min + 1) + min).toString(), 10);
      break;
    default:
      return 0;
      break;
  }
}

const hexList: string[] = [];
for (let i = 0; i <= 15; i++) {
  hexList[i] = i.toString(16);
}

/**
 * 生成全球唯一标识
 * @returns uuid
 */
export function uuid(): string {
  let uuid = "";
  for (let i = 1; i <= 36; i++) {
    if (i === 9 || i === 14 || i === 19 || i === 24) {
      uuid += "-";
    } else if (i === 15) {
      uuid += 4;
    } else if (i === 20) {
      uuid += hexList[(Math.random() * 4) | 8];
    } else {
      uuid += hexList[(Math.random() * 16) | 0];
    }
  }
  return uuid;
}

/**
 * 时间段问候语
 */
export const getDayText = () => {
  const now = new Date();
  const hours = now.getHours();

  if (hours >= 6 && hours < 10) return `早上好，新的一天开始了，愿您充满活力！`;
  if (hours >= 10 && hours < 14) return `中午好，记得好好吃饭，小憩一下～`;
  if (hours >= 14 && hours < 18) return `下午好，继续加油，今天依然美好！`;
  if (hours >= 18 && hours < 24) return `晚上好，放下疲惫，早点休息哟。`;
  // 0-5点
  return `凌晨好，夜已深，注意身体，早点睡吧。`;
};

/** ElementPlus 前端假数据分页，:data="tableList.slice((searchParams.pageNo - 1) * searchParams.pageSize, searchParams.pageNo * searchParams.pageSize)" */
