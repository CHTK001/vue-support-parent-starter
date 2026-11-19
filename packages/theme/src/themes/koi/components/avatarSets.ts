/**
 * 组合套装字典（纯前端内置，不落库）
 *
 * <p>套装 = 头像框 + 挂件 + 昵称牌的推荐组合。服务端没有「套装」概念，
 * 一键佩戴时拆成既有契约：头像框走 PUT /v2/user/update（AvatarFramePanel），
 * 挂件/昵称牌走 wearOrnament → PUT /v2/ornament/mine（ornaments/store）。</p>
 *
 * <p>编码引用 sys_ornament_code（含内置兜底编码）；头像框 ID 引用
 * sys_avatar_frame 主键（常规 101-106 / 灵动 111-116 / 生肖 2xx / 星座 3xx）。</p>
 */
export interface AvatarSet {
  key: string;
  name: string;
  desc: string;
  /** 头像框字典 ID */
  frameId: number;
  /** 挂件 / 昵称牌编码（按数组顺序逐件佩戴） */
  ornamentCodes: string[];
}

export const AVATAR_SETS: readonly AvatarSet[] = [
  {
    key: "gold-crown",
    name: "鎏金礼赞",
    desc: "鎏金框 · 王冠 · 鎏金牌",
    frameId: 101,
    ornamentCodes: ["avatar-crown", "plate-gold"],
  },
  {
    key: "sakura-night",
    name: "樱语春宵",
    desc: "樱雪环 · 樱瓣 · 玫瑰牌",
    frameId: 114,
    ornamentCodes: ["avatar-sakura", "plate-rose"],
  },
  {
    key: "nebula-orb",
    name: "星海灵珠",
    desc: "星漩环 · 灵珠 · 海盐牌",
    frameId: 116,
    ornamentCodes: ["avatar-orb", "plate-ocean"],
  },
  {
    key: "ember-heart",
    name: "炽焰之章",
    desc: "焰心环 · 炽焰 · 极光牌",
    frameId: 112,
    ornamentCodes: ["avatar-flame", "plate-aurora"],
  },
  {
    key: "aurora-dream",
    name: "极光幻境",
    desc: "极光环 · 音弦 · 墨玉牌",
    frameId: 111,
    ornamentCodes: ["avatar-note", "plate-ink"],
  },
  {
    key: "storm-tide",
    name: "雷鸣潮声",
    desc: "雷弧环 · 星辉 · 海盐牌",
    frameId: 115,
    ornamentCodes: ["avatar-spark", "plate-ocean"],
  },
];

/* ==================== 生日彩蛋：生肖 / 星座推荐 ==================== */

export interface BirthdayPick {
  /** 生肖框 ID（201-212） */
  zodiacFrameId: number;
  /** 星座框 ID（301-312） */
  constellationFrameId: number;
  /** 展示名，如「辰龙 · 狮子座」 */
  label: string;
}

const ZODIAC_NAMES = [
  "子鼠", "丑牛", "寅虎", "卯兔", "辰龙", "巳蛇",
  "午马", "未羊", "申猴", "酉鸡", "戌狗", "亥猪",
];
const CONSTELLATION_NAMES = [
  "白羊座", "金牛座", "双子座", "巨蟹座", "狮子座", "处女座",
  "天秤座", "天蝎座", "射手座", "摩羯座", "水瓶座", "双鱼座",
];
/** 各星座的起始（月, 日），公历；未到起始日归上一段 */
const CONSTELLATION_STARTS: Array<[number, number]> = [
  [3, 21], [4, 20], [5, 21], [6, 22], [7, 23], [8, 23],
  [9, 23], [10, 24], [11, 23], [12, 22], [1, 20], [2, 19],
];

/**
 * 按生日推荐生肖框 + 星座框。
 *
 * <p>生肖按公历年 (year-4) mod 12（0=子鼠）；星座按公历月日分段。
 * 生日为空或解析失败返回 null（不展示彩蛋）。</p>
 */
export function recommendByBirthday(birthday: string): BirthdayPick | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec((birthday || "").trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const zodiacIdx = (((year - 4) % 12) + 12) % 12;
  let constellationIdx = 9; // 摩羯座收尾段（12/22 之后）
  for (let i = 0; i < CONSTELLATION_STARTS.length; i++) {
    const [sm, sd] = CONSTELLATION_STARTS[i];
    if (month !== sm) continue;
    constellationIdx = day >= sd ? i : (i + 11) % 12;
    break;
  }
  return {
    zodiacFrameId: 201 + zodiacIdx,
    constellationFrameId: 301 + constellationIdx,
    label: `${ZODIAC_NAMES[zodiacIdx]} · ${CONSTELLATION_NAMES[constellationIdx]}`,
  };
}
