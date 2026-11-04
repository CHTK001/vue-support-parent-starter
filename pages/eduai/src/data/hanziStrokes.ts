/**
 * 汉字笔顺演示数据（100x100 SVG 坐标）。
 *
 * <p>与 collect 模块的 HanziStrokeDialog 同一套内置数据口径；
 * 教学库中无真实笔顺数据源时，悬停书写动画可先用这些常见字演示。</p>
 */

export interface HanziStrokeMeta {
  label: string;
  path: string;
}

export interface HanziStrokeData {
  char: string;
  strokes: HanziStrokeMeta[];
}

export const HANZI_STROKE_BUILTIN: Record<string, HanziStrokeData> = {
  永: {
    char: "永",
    strokes: [
      { label: "点", path: "M52 18 C56 16 61 18 62 21 C63 25 58 29 52 32 C48 34 44 34 43 32" },
      { label: "横折钩", path: "M34 43 L78 43 L78 58 L68 72 L46 67" },
      { label: "横撇", path: "M35 40 L50 64 L50 80 L46 84 L42 80" },
      { label: "竖钩", path: "M50 40 L50 88 L47 91" },
      { label: "提", path: "M28 62 L43 52" },
      { label: "撇", path: "M61 49 L74 64 L69 70" },
      { label: "短撇", path: "M64 73 L79 66" },
      { label: "捺", path: "M57 72 L78 87 L80 89" },
    ],
  },
  汉: {
    char: "汉",
    strokes: [
      { label: "点", path: "M39 18 C44 15 52 17 53 23 C54 28 49 31 42 33" },
      { label: "点", path: "M59 22 L66 28" },
      { label: "提", path: "M54 38 L69 43" },
      { label: "横撇", path: "M46 37 L45 56 L62 60" },
      { label: "捺", path: "M54 64 L75 88 L78 91" },
      { label: "竖提", path: "M62 40 L62 78 L58 82" },
      { label: "撇", path: "M67 41 L80 57" },
      { label: "点", path: "M70 66 L75 76" },
    ],
  },
  字: {
    char: "字",
    strokes: [
      { label: "点", path: "M47 15 C52 13 58 16 58 21 C58 25 53 28 47 30" },
      { label: "点", path: "M62 18 L69 24" },
      { label: "横钩", path: "M36 25 L75 25 L75 35 L65 40" },
      { label: "横撇", path: "M37 39 L52 58 L58 63" },
      { label: "横撇", path: "M60 43 L72 59 L78 63" },
      { label: "竖钩", path: "M42 62 L42 89 L38 92" },
      { label: "横", path: "M26 65 L64 65" },
      { label: "横", path: "M27 80 L64 80" },
    ],
  },
  中: {
    char: "中",
    strokes: [
      { label: "竖", path: "M49 14 L49 88 L45 91" },
      { label: "横折", path: "M31 24 L70 24 L70 70 L31 70" },
      { label: "横", path: "M31 50 L70 50" },
      { label: "横", path: "M25 83 L75 83" },
    ],
  },
  国: {
    char: "国",
    strokes: [
      { label: "竖", path: "M37 12 L37 88 L34 91" },
      { label: "横折", path: "M37 20 L72 20 L72 84 L37 84" },
      { label: "横", path: "M43 34 L67 34 L67 70 L43 70" },
      { label: "横", path: "M47 43 L63 43 L63 61 L47 61" },
      { label: "横", path: "M33 93 L78 93" },
    ],
  },
  一: {
    char: "一",
    strokes: [{ label: "横", path: "M20 52 L80 52" }],
  },
  二: {
    char: "二",
    strokes: [
      { label: "横", path: "M30 36 L70 36" },
      { label: "横", path: "M18 70 L82 70" },
    ],
  },
  三: {
    char: "三",
    strokes: [
      { label: "横", path: "M30 24 L70 24" },
      { label: "横", path: "M18 52 L82 52" },
      { label: "横", path: "M30 78 L70 78" },
    ],
  },
  十: {
    char: "十",
    strokes: [
      { label: "横", path: "M22 40 L78 40" },
      { label: "竖", path: "M50 12 L50 88" },
    ],
  },
  人: {
    char: "人",
    strokes: [
      { label: "撇", path: "M53 12 L39 50 L35 62" },
      { label: "捺", path: "M47 30 L67 70 L73 80" },
    ],
  },
  大: {
    char: "大",
    strokes: [
      { label: "横", path: "M24 28 L76 28" },
      { label: "撇", path: "M50 28 L39 63 L31 80" },
      { label: "捺", path: "M50 32 L66 70 L73 82" },
    ],
  },
  小: {
    char: "小",
    strokes: [
      { label: "竖钩", path: "M50 18 L50 72 L46 78" },
      { label: "撇", path: "M49 34 L28 58" },
      { label: "点", path: "M52 36 L73 60" },
    ],
  },
  山: {
    char: "山",
    strokes: [
      { label: "竖折", path: "M30 30 L30 68 L52 68" },
      { label: "竖", path: "M50 12 L50 82" },
      { label: "竖", path: "M71 30 L71 80" },
    ],
  },
  水: {
    char: "水",
    strokes: [
      { label: "竖钩", path: "M50 10 L50 76 L46 82" },
      { label: "横撇", path: "M29 24 L56 24 L61 44" },
      { label: "撇", path: "M36 38 L28 78" },
      { label: "捺", path: "M60 40 L76 72 L79 84" },
    ],
  },
  火: {
    char: "火",
    strokes: [
      { label: "点", path: "M48 16 C51 14 55 16 56 21 C56 26 52 29 47 31" },
      { label: "撇", path: "M51 24 L45 55 L39 76" },
      { label: "撇", path: "M53 24 L61 55 L69 74" },
      { label: "捺", path: "M55 28 L81 57 L85 64" },
    ],
  },
  木: {
    char: "木",
    strokes: [
      { label: "横", path: "M22 30 L78 30" },
      { label: "竖", path: "M50 12 L50 84 L47 88" },
      { label: "撇", path: "M49 42 L34 78" },
      { label: "捺", path: "M51 46 L69 78 L74 84" },
    ],
  },
  日: {
    char: "日",
    strokes: [
      { label: "竖", path: "M42 16 L42 76 L39 80" },
      { label: "横折", path: "M42 20 L67 20 L67 76 L42 76" },
      { label: "横", path: "M42 46 L67 46" },
      { label: "横", path: "M38 84 L70 84" },
    ],
  },
  月: {
    char: "月",
    strokes: [
      { label: "撇", path: "M59 12 L40 36 L35 49" },
      { label: "横折钩", path: "M42 18 L67 18 L67 70 L58 83 L37 79" },
      { label: "横", path: "M45 44 L62 44" },
      { label: "横", path: "M44 62 L62 62" },
    ],
  },
  天: {
    char: "天",
    strokes: [
      { label: "横", path: "M21 24 L79 24" },
      { label: "横", path: "M27 45 L73 45" },
      { label: "撇", path: "M49 45 L37 80" },
      { label: "捺", path: "M50 48 L70 80 L75 87" },
    ],
  },
  上: {
    char: "上",
    strokes: [
      { label: "竖", path: "M50 12 L50 74" },
      { label: "横", path: "M30 32 L70 32" },
      { label: "横", path: "M24 80 L76 80" },
    ],
  },
  下: {
    char: "下",
    strokes: [
      { label: "横", path: "M22 27 L78 27" },
      { label: "竖", path: "M50 27 L50 83" },
      { label: "点", path: "M56 32 L76 53 L79 57" },
    ],
  },
  口: {
    char: "口",
    strokes: [
      { label: "竖", path: "M36 18 L36 70 L33 74" },
      { label: "横折", path: "M36 22 L69 22 L69 72 L36 72" },
      { label: "横", path: "M32 79 L73 79" },
    ],
  },
  田: {
    char: "田",
    strokes: [
      { label: "竖", path: "M31 16 L31 74 L28 78" },
      { label: "横折", path: "M31 20 L68 20 L68 72 L31 72" },
      { label: "横", path: "M31 45 L68 45" },
      { label: "竖", path: "M50 20 L50 72" },
      { label: "横", path: "M27 80 L72 80" },
    ],
  },
  土: {
    char: "土",
    strokes: [
      { label: "横", path: "M26 28 L74 28" },
      { label: "竖", path: "M50 12 L50 82" },
      { label: "横", path: "M18 70 L82 70" },
    ],
  },
  王: {
    char: "王",
    strokes: [
      { label: "横", path: "M27 22 L73 22" },
      { label: "横", path: "M27 47 L73 47" },
      { label: "竖", path: "M50 12 L50 83" },
      { label: "横", path: "M21 76 L79 76" },
    ],
  },
  生: {
    char: "生",
    strokes: [
      { label: "撇", path: "M44 14 L37 30 L34 40" },
      { label: "横", path: "M26 34 L78 34" },
      { label: "横", path: "M22 50 L80 50" },
      { label: "竖", path: "M50 10 L50 84" },
      { label: "横", path: "M24 66 L78 66" },
    ],
  },
  子: {
    char: "子",
    strokes: [
      { label: "横撇", path: "M28 24 L66 24 L74 42" },
      { label: "竖钩", path: "M44 40 L44 86 L40 90" },
      { label: "横", path: "M28 60 L74 60" },
    ],
  },
  六: {
    char: "六",
    strokes: [
      { label: "点", path: "M49 14 C53 12 57 14 57 19 C57 23 52 25 47 26" },
      { label: "横", path: "M19 34 L81 34" },
      { label: "撇", path: "M47 44 L32 80" },
      { label: "点", path: "M53 44 L72 78" },
    ],
  },
  七: {
    char: "七",
    strokes: [
      { label: "横", path: "M20 28 L83 28" },
      { label: "竖弯钩", path: "M60 28 L60 57 L28 57 L28 70 L32 76" },
    ],
  },
  八: {
    char: "八",
    strokes: [
      { label: "撇", path: "M39 18 L28 56 L25 66" },
      { label: "捺", path: "M60 20 L73 58 L76 68" },
    ],
  },
  九: {
    char: "九",
    strokes: [
      { label: "撇", path: "M52 12 L35 46 L30 58" },
      { label: "横折弯钩", path: "M54 16 L74 16 L74 54 L53 54 L53 72 L57 78" },
    ],
  },
  儿: {
    char: "儿",
    strokes: [
      { label: "撇", path: "M42 14 L31 48 L28 58" },
      { label: "竖弯钩", path: "M58 16 L62 52 L36 52 L36 68 L41 75" },
    ],
  },
};