/**
 * 文本混淆工具 - 防止爬虫抓取
 * 
 * 功能：
 * 1. 字符映射混淆 - DOM 中显示乱码，但视觉上正常
 * 2. Unicode 私有区映射 - 使用自定义字体
 * 3. 零宽字符插入 - 干扰文本复制
 */

// Unicode 私有区范围 (U+E000 到 U+F8FF)
const PRIVATE_USE_AREA_START = 0xE000;

/**
 * 生成字符映射表
 * 将常用字符映射到 Unicode 私有区
 */
export function generateCharacterMap(): Map<string, string> {
  const charMap = new Map<string, string>();
  
  // 数字映射
  const digits = '0123456789';
  digits.split('').forEach((char, index) => {
    charMap.set(char, String.fromCharCode(PRIVATE_USE_AREA_START + index));
  });
  
  // 大写字母映射
  const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  upperLetters.split('').forEach((char, index) => {
    charMap.set(char, String.fromCharCode(PRIVATE_USE_AREA_START + 10 + index));
  });
  
  // 小写字母映射
  const lowerLetters = 'abcdefghijklmnopqrstuvwxyz';
  lowerLetters.split('').forEach((char, index) => {
    charMap.set(char, String.fromCharCode(PRIVATE_USE_AREA_START + 36 + index));
  });
  
  // 常用中文字符映射（示例）
  const commonChars = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严';
  commonChars.split('').forEach((char, index) => {
    if (index < 1000) { // 限制映射数量
      charMap.set(char, String.fromCharCode(PRIVATE_USE_AREA_START + 62 + index));
    }
  });
  
  return charMap;
}

/**
 * 混淆文本 - 将文本转换为私有区字符
 */
export function obfuscateText(text: string, charMap?: Map<string, string>): string {
  const map = charMap || generateCharacterMap();
  return text.split('').map(char => map.get(char) || char).join('');
}

/**
 * 反混淆文本 - 将私有区字符转换回原文
 */
export function deobfuscateText(text: string, charMap?: Map<string, string>): string {
  const map = charMap || generateCharacterMap();
  const reverseMap = new Map<string, string>();
  map.forEach((value, key) => reverseMap.set(value, key));
  
  return text.split('').map(char => reverseMap.get(char) || char).join('');
}

/**
 * 零宽字符混淆 - 在文本中插入不可见字符
 */
const ZERO_WIDTH_CHARS = [
  '\u200B', // 零宽空格
  '\u200C', // 零宽非连接符
  '\u200D', // 零宽连接符
  '\uFEFF', // 零宽非断空格
];

export function insertZeroWidthChars(text: string, density: number = 0.3): string {
  const chars = text.split('');
  const result: string[] = [];
  
  chars.forEach((char, index) => {
    result.push(char);
    // 随机插入零宽字符
    if (Math.random() < density && index < chars.length - 1) {
      const randomZeroWidth = ZERO_WIDTH_CHARS[Math.floor(Math.random() * ZERO_WIDTH_CHARS.length)];
      result.push(randomZeroWidth);
    }
  });
  
  return result.join('');
}

/**
 * 移除零宽字符
 */
export function removeZeroWidthChars(text: string): string {
  return text.replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
}

/**
 * 生成字体 CSS 映射
 * 用于创建自定义字体文件的 CSS
 */
export function generateFontFaceCSS(fontFamily: string = 'ObfuscatedFont'): string {
  const charMap = generateCharacterMap();
  const mappings: string[] = [];
  
  charMap.forEach((unicode, original) => {
    const unicodeHex = unicode.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
    mappings.push(`  /* ${original} -> U+${unicodeHex} */`);
  });
  
  return `
@font-face {
  font-family: '${fontFamily}';
  src: url('/fonts/${fontFamily}.woff2') format('woff2'),
       url('/fonts/${fontFamily}.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

/* 字符映射说明 */
/*
${mappings.join('\n')}
*/

.obfuscated-text {
  font-family: '${fontFamily}', sans-serif;
  user-select: none; /* 防止选择 */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
`;
}

/**
 * 导出字符映射为 JSON
 */
export function exportCharMapToJSON(charMap?: Map<string, string>): string {
  const map = charMap || generateCharacterMap();
  const obj: Record<string, string> = {};
  map.forEach((value, key) => {
    obj[key] = value;
  });
  return JSON.stringify(obj, null, 2);
}
