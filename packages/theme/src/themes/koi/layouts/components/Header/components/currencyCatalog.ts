/**
 * 顶栏汇率组件用到的币种目录
 *
 * <p>只承担「代码 → 中文名 / 符号 / 检索别名」的展示映射，不含任何汇率数值。
 * 汇率一律由 {@link useExchangeRate} 或后台 {@code /v2/exchange-rate/overview}
 * 提供，避免在前端硬编码价格。</p>
 *
 * <p>别名用于搜索：用户输入 {@code rmb} 要能命中人民币，输入 {@code 乌克兰}
 * 要能命中乌克兰格里夫纳，因此除了代码和中文名，还收录口语叫法。</p>
 */

/** 币种元信息 */
export interface CurrencyMeta {
  /** ISO 4217 三字母代码 */
  code: string;
  /** 中文名（面板与下拉统一展示） */
  name: string;
  /** 货币符号（顶栏硬币、列表徽标） */
  sign: string;
  /** 检索别名：口语叫法、常见误写 */
  alias?: string[];
}

/**
 * 币种目录（常用币种在前，其余按字母序）
 *
 * <p>顺序即选择器的展示顺序：第一屏尽量是用户真正会用的币种。</p>
 */
export const CURRENCY_CATALOG: readonly CurrencyMeta[] = [
  { code: "CNY", name: "人民币", sign: "¥", alias: ["rmb", "元", "软妹币", "人民币元"] },
  { code: "USD", name: "美元", sign: "$", alias: ["美金", "刀", "usdollar"] },
  { code: "EUR", name: "欧元", sign: "€", alias: ["欧罗巴"] },
  { code: "GBP", name: "英镑", sign: "£", alias: ["英磅"] },
  { code: "JPY", name: "日元", sign: "¥", alias: ["日币", "日圆"] },
  { code: "HKD", name: "港币", sign: "HK$", alias: ["港元"] },
  { code: "TWD", name: "新台币", sign: "NT$", alias: ["台币", "台湾币"] },
  { code: "SGD", name: "新加坡元", sign: "S$", alias: ["新币", "星币"] },
  { code: "KRW", name: "韩元", sign: "₩", alias: ["韩币"] },
  { code: "AUD", name: "澳大利亚元", sign: "A$", alias: ["澳元"] },
  { code: "CAD", name: "加拿大元", sign: "C$", alias: ["加元"] },
  { code: "CHF", name: "瑞士法郎", sign: "Fr", alias: ["瑞郎"] },
  { code: "NZD", name: "新西兰元", sign: "NZ$", alias: ["纽元"] },
  { code: "UAH", name: "乌克兰格里夫纳", sign: "₴", alias: ["乌克兰", "格里夫纳", "荷林夫纳"] },
  { code: "RUB", name: "俄罗斯卢布", sign: "₽", alias: ["卢布"] },
  { code: "THB", name: "泰铢", sign: "฿" },
  { code: "MYR", name: "马来西亚林吉特", sign: "RM", alias: ["马币", "林吉特"] },
  { code: "IDR", name: "印尼盾", sign: "Rp", alias: ["印度尼西亚盾"] },
  { code: "PHP", name: "菲律宾比索", sign: "₱" },
  { code: "VND", name: "越南盾", sign: "₫" },
  { code: "INR", name: "印度卢比", sign: "₹" },
  { code: "PKR", name: "巴基斯坦卢比", sign: "₨" },
  { code: "BDT", name: "孟加拉塔卡", sign: "৳" },
  { code: "LKR", name: "斯里兰卡卢比", sign: "Rs" },
  { code: "NPR", name: "尼泊尔卢比", sign: "Rs" },
  { code: "MMK", name: "缅元", sign: "K", alias: ["缅甸币"] },
  { code: "KHR", name: "柬埔寨瑞尔", sign: "៛" },
  { code: "LAK", name: "老挝基普", sign: "₭" },
  { code: "MNT", name: "蒙古图格里克", sign: "₮" },
  { code: "KZT", name: "哈萨克斯坦坚戈", sign: "₸" },
  { code: "TRY", name: "土耳其里拉", sign: "₺" },
  { code: "AED", name: "阿联酋迪拉姆", sign: "د.إ" },
  { code: "SAR", name: "沙特里亚尔", sign: "﷼" },
  { code: "ILS", name: "以色列新谢克尔", sign: "₪" },
  { code: "EGP", name: "埃及镑", sign: "E£" },
  { code: "ZAR", name: "南非兰特", sign: "R" },
  { code: "BRL", name: "巴西雷亚尔", sign: "R$" },
  { code: "MXN", name: "墨西哥比索", sign: "MX$" },
  { code: "ARS", name: "阿根廷比索", sign: "AR$" },
  { code: "CLP", name: "智利比索", sign: "CL$" },
  { code: "COP", name: "哥伦比亚比索", sign: "COL$" },
  { code: "PEN", name: "秘鲁索尔", sign: "S/" },
  { code: "PLN", name: "波兰兹罗提", sign: "zł" },
  { code: "SEK", name: "瑞典克朗", sign: "kr" },
  { code: "NOK", name: "挪威克朗", sign: "kr" },
  { code: "DKK", name: "丹麦克朗", sign: "kr" },
  { code: "CZK", name: "捷克克朗", sign: "Kč" },
  { code: "HUF", name: "匈牙利福林", sign: "Ft" },
  { code: "RON", name: "罗马尼亚列伊", sign: "lei" },
  { code: "BGN", name: "保加利亚列弗", sign: "лв" },
  { code: "ISK", name: "冰岛克朗", sign: "kr" },
];

/** 代码 → 元信息 */
const BY_CODE = new Map<string, CurrencyMeta>(CURRENCY_CATALOG.map((item) => [item.code, item]));

/** 取币种元信息（未收录返回 undefined） */
export function findCurrency(code: string | undefined | null): CurrencyMeta | undefined {
  if (!code) return undefined;
  return BY_CODE.get(code.trim().toUpperCase());
}

/** 取中文名：未收录时回落为代码本身，保证界面不会出现空串 */
export function currencyName(code: string | undefined | null): string {
  if (!code) return "";
  return findCurrency(code)?.name ?? code.trim().toUpperCase();
}

/** 取货币符号：未收录时回落为代码前两位，保证硬币里始终有字 */
export function currencySign(code: string | undefined | null): string {
  if (!code) return "¤";
  return findCurrency(code)?.sign ?? code.trim().toUpperCase().slice(0, 2);
}

/**
 * 按关键字检索币种（空关键字返回全量）。
 *
 * <p>匹配范围：代码、中文名、别名。用户输入 {@code rmb} / {@code 乌克兰}
 * 这类非代码关键字时，靠中文名与别名命中。</p>
 */
export function searchCurrencies(keyword: string): CurrencyMeta[] {
  const raw = keyword.trim();
  if (!raw) return [...CURRENCY_CATALOG];
  const lower = raw.toLowerCase();
  return CURRENCY_CATALOG.filter((item) => {
    if (item.code.toLowerCase().includes(lower)) return true;
    if (item.name.includes(raw)) return true;
    return (item.alias ?? []).some((alias) => alias.toLowerCase().includes(lower));
  });
}
