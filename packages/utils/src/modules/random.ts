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

/** 每日动态问候语（每时段 14 句，按当天 yyyy-mm-dd 选不同一句） */
const DAY_GREETINGS: Record<"dawn" | "morning" | "noon" | "afternoon" | "evening" | "night", string[]> = {
  // 凌晨 0~5
  dawn: [
    "凌晨好，夜已深，注意身体，早点睡吧。",
    "夜深人静，记得给自己倒杯温水，别熬太晚。",
    "万籁俱寂的夜晚，适合发呆与整理思绪。",
    "夜很长，星星也在陪你，请你好好休息。",
    "抬头看看窗外，月色刚好，安心入眠吧。",
    "如果还在电脑前，建议起身拉伸一下肩颈。",
    "夜深了，一句'辛苦了'送给自己。",
    "把手机放下，闭眼深呼吸三次，你能睡得更好。",
    "凌晨的咖啡最易上头，不如换成温水。",
    "这个世界还在等你醒来，先好好休息。",
    "夜无声，灯未灭，小心眼睛，别再盯屏幕了。",
    "记一笔明日清单，把今夜留给睡眠。",
    "如果已睡，那便很好；如果未睡，请对自己温柔。",
    "星夜安好，明天会是值得期待的一天。",
  ],
  // 早上 6~10
  morning: [
    "早上好，新的一天开始了，愿您充满活力！",
    "早安，愿第一缕阳光带给你整日的好心情。",
    "新的一天，不慌不忙，按自己的节奏来。",
    "起床啦！先喝杯水，再给今天定个小目标。",
    "早安，世界温柔待你，你也温柔待自己。",
    "今天也请加油，一切尽在掌握。",
    "晨光熹微，先深呼吸三下，再开始工作。",
    "早安，又是值得期待的一天。",
    "愿今天所有的小目标，都能稳稳落地。",
    "新的一天，从一个微笑开始。",
    "别忘了吃早餐，照顾好胃才能乘风破浪。",
    "凡是过往，皆为序章，今天是新的开始。",
    "早安，先给自己一个大大的拥抱。",
    "阳光正好，今天也要元气满满哦。",
  ],
  // 中午 10~14
  noon: [
    "中午好，记得好好吃饭，小憩一下～",
    "正午啦！别错过这顿能量满满的午餐。",
    "午间半小时，闭眼养神，下午会更清醒。",
    "今天食堂 / 外卖 / 自带？选个爱吃的犒劳自己。",
    "饭后走一走，比趴着刷手机更舒坦。",
    "把没回的消息，下午再处理也不迟。",
    "中午好，留给自己一段不被打扰的时光。",
    "把桌面收拾干净，下午效率翻倍。",
    "午餐不必奢华，但务必吃饱。",
    "午后阳光正好，记得给自己倒杯茶。",
    "别让繁忙吞掉你吃午饭的权利。",
    "吃到一半的菜，是最香的时候。",
    "今天有什么想偷笑的瞬间吗？记录一下。",
    "趁中午，给重要的人发一句问候。",
  ],
  // 下午 14~18
  afternoon: [
    "下午好，继续加油，今天依然美好！",
    "下午是个容易犯困的时段，起身接杯水吧。",
    "做一件小事当作奖励，给自己续上能量。",
    "距下班还有多久？数数更开心的小目标。",
    "下午茶时间，吃点点心犒劳努力的自己。",
    "再坚持一下，下午的任务完成就能喘口气。",
    "心情有点闷？来，把窗开一条缝。",
    "下午过半，复盘一下今天的进展，挺有成就感。",
    "给自己一点肯定，今天已经做了很多。",
    "眼睛累了？远眺 6 米外的物体，看 20 秒。",
    "把待办清单分成 3 块，一块块来。",
    "深呼吸一次，迎接下半天。",
    "若今日不顺，没关系，还有明天。",
    "做点不一样的小事，给下午添点新鲜感。",
  ],
  // 晚上 18~24
  evening: [
    "晚上好，放下疲惫，早点休息哟。",
    "晚餐吃了吗？辛苦了，记得好好吃饭。",
    "晚上是和自己对话的好时光，复盘一下今天。",
    "夜里散步五公里，是最便宜的好心情。",
    "今晚想看什么？读几页书、追一集剧都好。",
    "给自己泡个脚、冲杯热饮，温暖一整晚。",
    "把明天的第一件事记下来，安心入梦。",
    "晚上好，别再盯着屏幕太久，护眼要紧。",
    "和家人聊聊天，是最好的充电方式。",
    "一天结束了，给今天的自己打个合格。",
    "愿你今晚做个好梦。",
    "关掉闹钟的焦虑，让今天安静收尾。",
    "深呼吸三次，今晚或许能睡得更香。",
    "晚风轻拂，愿所有的好，都向你靠近。",
  ],
  // 备用兜底（被 night 段覆盖）
  night: [],
};

/** 把今天日期转成一个稳定整数 seed */
const todaySeed = (): number => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
};

/** 字符串 hash（djb2） */
const hash = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** 时间段问候语（每天同一时段不同一句话，14 天一轮） */
export const getDayText = (): string => {
  const now = new Date();
  const hours = now.getHours();
  const period: keyof typeof DAY_GREETINGS =
    hours >= 0 && hours < 6
      ? "dawn"
      : hours >= 6 && hours < 10
      ? "morning"
      : hours >= 10 && hours < 14
      ? "noon"
      : hours >= 14 && hours < 18
      ? "afternoon"
      : hours >= 18 && hours < 24
      ? "evening"
      : "dawn";
  const list = DAY_GREETINGS[period];
  const seed = todaySeed() ^ hash(period);
  const idx = seed % list.length;
  return list[idx];
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
