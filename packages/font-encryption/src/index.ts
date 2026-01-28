/**
 * 字体加密工具
 * @description 通过@font-face字体映射实现真正的字体加密，防止复制
 * 优先使用 WASM 实现，如果 WASM 未加载则降级到 JS 实现
 * @author CH
 * @date 2025-12-16
 */

import { 
  fontEncryptText as wasmFontEncryptText,
  fontDecryptText as wasmFontDecryptText,
  fontIsEncryptedChar as wasmFontIsEncryptedChar,
  fontGetMappedCharCount as wasmFontGetMappedCharCount,
  fontGetMaps as wasmFontGetMaps,
  isWasmLoaded
} from "@repo/codec-wasm";

/**
 * 数字字符列表（0-9）
 */
const NUMBER_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * 数字映射目标字符列表（字母 a-j）
 */
const NUMBER_TARGET_CHARS = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

/**
 * 常用汉字列表（需要加密的汉字）
 */
const CHINESE_CHARS = [
  // 数字汉字
  "零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "百", "千", "万", "亿",
  // 高频汉字
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "这", "中", "大", "为", "上",
  "个", "国", "他", "时", "来", "用", "们", "生", "到", "作", "地", "于",
  // 继续使用可打印 ASCII
  "出", "分", "对", "成", "会", "可", "主", "发", "年", "动", "同", "工", "也", "能", "下",
  "过", "子", "说", "产", "种", "面", "而", "方", "后", "多", "定", "行", "学", "法", "所",
  "民", "得",
  // 使用私有区（从 U+E000 开始）
  "电", "力", "里", "如", "水", "化", "高", "自", "理", "心", "实", "比", "量", "制", "使",
  "点", "业", "体", "集", "号", "文", "次", "思", "通", "但", "条", "较", "克", "又", "公",
  "孔", "领", "军", "流", "入", "接", "席", "位", "情", "运", "器", "并", "习", "原", "油",
  "放", "立", "题", "质", "指", "建", "区", "验", "活", "众", "很", "教", "决", "特", "此",
  "常", "石", "强", "极", "少", "根", "共", "直", "团", "统", "式", "转", "别", "造", "切",
  "你", "取", "西", "持", "总", "料", "连", "任", "志", "观", "调", "么", "山", "程", "报",
  "更", "见", "必", "真", "保", "热", "委", "手", "改", "管", "处", "已", "修", "支", "识",
  "病", "象", "先", "老", "光", "专", "几", "什", "型", "具", "示", "复", "安", "带", "每",
  "东", "增", "则", "完", "风", "回", "南", "广", "劳", "轮", "科", "北", "打", "积", "车",
  "计", "给", "节", "做", "务", "被", "整", "联", "步", "类", "列", "温", "装",
];

/**
 * 汉字映射目标字符列表
 * @description
 * - 映射目标字符必须"稳定可显示"，不能使用空格/换行/Tab/空字符等控制字符
 * - 当可打印 ASCII 不够时，使用 Unicode 私有区（U+E000 起）承载映射
 */
const CHINESE_TARGET_CHARS = [
  // 数字汉字映射目标（k-y）
  "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y",
  // 高频汉字映射目标（可打印 ASCII）
  "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N",
  "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
  // 继续使用可打印 ASCII
  "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+", "[",
  "]", "{", "}", "|", "\\", ";", ":", "'", '"', "<", ">", ",", ".", "?", "/",
  "`", "~",
  // ASCII 不够时使用私有区（从 U+E000 开始顺延）
  "\uE000", "\uE001", "\uE002", "\uE003", "\uE004", "\uE005", "\uE006", "\uE007",
  "\uE008", "\uE009", "\uE00A", "\uE00B", "\uE00C", "\uE00D", "\uE00E", "\uE00F",
  "\uE010", "\uE011", "\uE012", "\uE013", "\uE014", "\uE015", "\uE016", "\uE017",
  "\uE018", "\uE019", "\uE01A", "\uE01B", "\uE01C", "\uE01D", "\uE01E", "\uE01F",
  "\uE020", "\uE021", "\uE022", "\uE023", "\uE024", "\uE025", "\uE026", "\uE027",
  "\uE028", "\uE029", "\uE02A", "\uE02B", "\uE02C", "\uE02D", "\uE02E", "\uE02F",
  "\uE030", "\uE031", "\uE032", "\uE033", "\uE034", "\uE035", "\uE036", "\uE037",
  "\uE038", "\uE039", "\uE03A", "\uE03B", "\uE03C", "\uE03D", "\uE03E", "\uE03F",
  "\uE040", "\uE041", "\uE042", "\uE043", "\uE044", "\uE045", "\uE046", "\uE047",
  "\uE048", "\uE049", "\uE04A", "\uE04B", "\uE04C", "\uE04D", "\uE04E", "\uE04F",
  "\uE050", "\uE051", "\uE052", "\uE053", "\uE054", "\uE055", "\uE056", "\uE057",
  "\uE058", "\uE059", "\uE05A", "\uE05B", "\uE05C", "\uE05D", "\uE05E", "\uE05F",
  "\uE060", "\uE061", "\uE062", "\uE063", "\uE064", "\uE065", "\uE066", "\uE067",
  "\uE068", "\uE069", "\uE06A", "\uE06B", "\uE06C", "\uE06D", "\uE06E", "\uE06F",
  "\uE070", "\uE071", "\uE072", "\uE073", "\uE074", "\uE075", "\uE076", "\uE077",
  "\uE078", "\uE079", "\uE07A", "\uE07B", "\uE07C", "\uE07D", "\uE07E", "\uE07F",
  "\uE080", "\uE081", "\uE082", "\uE083", "\uE084", "\uE085", "\uE086", "\uE087",
  "\uE088", "\uE089", "\uE08A", "\uE08B", "\uE08C", "\uE08D", "\uE08E", "\uE08F",
  "\uE090", "\uE091", "\uE092", "\uE093",
];

/**
 * 简单随机数生成器（基于时间戳和随机数）
 * @description 使用线性同余生成器（LCG）生成伪随机数
 */
class SimpleRandom {
  private seed: number;

  constructor(seed?: number) {
    // 使用时间戳 + 随机数作为种子，确保每次刷新都不同
    this.seed = seed ?? (Date.now() + Math.random() * 1000000);
  }

  /**
   * 生成 0 到 max-1 之间的随机整数
   */
  nextInt(max: number): number {
    // 线性同余生成器
    this.seed = (this.seed * 1664525 + 1013904223) % 2 ** 32;
    return Math.floor((this.seed / 2 ** 32) * max);
  }
}

/**
 * Fisher-Yates 洗牌算法
 * @param array 要洗牌的数组
 * @param random 随机数生成器
 */
function shuffle<T>(array: T[], random: SimpleRandom): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = random.nextInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * 生成动态映射表（JS 降级实现）
 * @description 每次页面刷新时生成不同的映射关系，增加破解难度
 */
function generateMaps(): {
  numberMap: Record<string, string>;
  chineseMap: Record<string, string>;
  reverseNumberMap: Record<string, string>;
  reverseChineseMap: Record<string, string>;
} {
  // 创建随机数生成器（每次页面加载时生成新的种子）
  const random = new SimpleRandom();

  // 复制数组以避免修改原始数组
  const shuffledNumberTargets = [...NUMBER_TARGET_CHARS];
  const shuffledChineseTargets = [...CHINESE_TARGET_CHARS];

  // 随机打乱映射目标字符
  shuffle(shuffledNumberTargets, random);
  shuffle(shuffledChineseTargets, random);

  // 生成数字映射表
  const numberMap: Record<string, string> = {};
  for (let i = 0; i < NUMBER_CHARS.length; i++) {
    numberMap[NUMBER_CHARS[i]] = shuffledNumberTargets[i];
  }

  // 生成汉字映射表
  const chineseMap: Record<string, string> = {};
  for (let i = 0; i < CHINESE_CHARS.length; i++) {
    chineseMap[CHINESE_CHARS[i]] = shuffledChineseTargets[i];
  }

  // 生成反向映射表（用于解密）
  const reverseNumberMap: Record<string, string> = Object.fromEntries(
    Object.entries(numberMap).map(([k, v]) => [v, k])
  );

  const reverseChineseMap: Record<string, string> = Object.fromEntries(
    Object.entries(chineseMap).map(([k, v]) => [v, k])
  );

  return {
    numberMap,
    chineseMap,
    reverseNumberMap,
    reverseChineseMap,
  };
}

// JS 降级实现的映射表（仅在 WASM 未加载时使用）
let jsMaps: ReturnType<typeof generateMaps> | null = null;

/**
 * 获取映射表（优先从 WASM 获取，每次调用都重新生成）
 * @returns 映射表对象
 */
export function getMaps(): {
  numberMap: Record<string, string>;
  chineseMap: Record<string, string>;
  reverseNumberMap: Record<string, string>;
  reverseChineseMap: Record<string, string>;
} {
  // 优先使用 WASM 实现（每次调用都重新生成）
  if (isWasmLoaded()) {
    try {
      return wasmFontGetMaps();
    } catch (error) {
      console.warn("[fontEncryption] WASM 获取映射表失败，降级到 JS 实现:", error);
    }
  }

  // JS 降级实现（每次调用都重新生成）
  return generateMaps();
}

/**
 * 获取 JS 映射表（延迟初始化，仅用于降级场景）
 */
function getJsMaps() {
  if (!jsMaps) {
    jsMaps = generateMaps();
  }
  return jsMaps;
}

/**
 * 加密文本（将数字和常用汉字替换为映射字符）
 * @param text 原始文本
 * @param encryptNumbers 是否加密数字
 * @param encryptChinese 是否加密汉字
 * @returns 加密后的文本
 */
export function encryptText(
  text: string,
  encryptNumbers: boolean = true,
  encryptChinese: boolean = true
): string {
  if (!text) {
    return text;
  }

  // 优先使用 WASM 实现
  if (isWasmLoaded()) {
    try {
      return wasmFontEncryptText(text, encryptNumbers, encryptChinese);
    } catch (error) {
      console.warn("[fontEncryption] WASM 加密失败，降级到 JS 实现:", error);
    }
  }

  // JS 降级实现
  const maps = getJsMaps();
  let result = text;

  // 加密数字
  if (encryptNumbers) {
    for (const [original, mapped] of Object.entries(maps.numberMap)) {
      result = result.replace(new RegExp(original, "g"), mapped);
    }
  }

  // 加密汉字
  if (encryptChinese) {
    for (const [original, mapped] of Object.entries(maps.chineseMap)) {
      result = result.replace(new RegExp(original, "g"), mapped);
    }
  }

  return result;
}

/**
 * 解密文本（将映射字符还原为原始字符）
 * @param text 加密后的文本
 * @returns 解密后的文本
 */
export function decryptText(text: string): string {
  if (!text) {
    return text;
  }

  // 优先使用 WASM 实现
  if (isWasmLoaded()) {
    try {
      return wasmFontDecryptText(text);
    } catch (error) {
      console.warn("[fontEncryption] WASM 解密失败，降级到 JS 实现:", error);
    }
  }

  // JS 降级实现
  const maps = getJsMaps();
  let result = text;

  // 解密汉字
  for (const [mapped, original] of Object.entries(maps.reverseChineseMap)) {
    result = result.replace(new RegExp(escapeRegExp(mapped), "g"), original);
  }

  // 解密数字
  for (const [mapped, original] of Object.entries(maps.reverseNumberMap)) {
    result = result.replace(new RegExp(mapped, "g"), original);
  }

  return result;
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 检查字符是否为加密字符
 * @param char 字符
 * @returns 是否为加密字符
 */
export function isEncryptedChar(char: string): boolean {
  // 优先使用 WASM 实现
  if (isWasmLoaded()) {
    try {
      return wasmFontIsEncryptedChar(char);
    } catch (error) {
      console.warn("[fontEncryption] WASM 检查失败，降级到 JS 实现:", error);
    }
  }

  // JS 降级实现
  const maps = getJsMaps();
  return (
    maps.reverseNumberMap.hasOwnProperty(char) ||
    maps.reverseChineseMap.hasOwnProperty(char)
  );
}

/**
 * 获取映射的字符数量
 */
export function getMappedCharCount(): { numbers: number; chinese: number } {
  // 优先使用 WASM 实现
  if (isWasmLoaded()) {
    try {
      return wasmFontGetMappedCharCount();
    } catch (error) {
      console.warn("[fontEncryption] WASM 获取数量失败，降级到 JS 实现:", error);
    }
  }

  // JS 降级实现
  const maps = getJsMaps();
  return {
    numbers: Object.keys(maps.numberMap).length,
    chinese: Object.keys(maps.chineseMap).length,
  };
}

