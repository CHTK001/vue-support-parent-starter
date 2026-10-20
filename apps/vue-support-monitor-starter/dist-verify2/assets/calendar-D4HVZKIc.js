//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/dateKey.ts
/**
* 日期键（{@code YYYY-MM-DD}）工具
*
* <p>全仓统一用「本地时区的日历日」作主键，而不是 UTC 时刻或时间戳 ——
* 日历要回答的是「今天几号」，而不是「现在几点」。所有换算都在本地日期上做，
* 因此运行在东八区之外的机器上结果同样正确。</p>
*
* <p>抽成独立模块是为了让 {@link ./lunar}、{@link ./solarTerms}、{@link ./statutory}、
* {@link ./dayInfo} 共用同一套实现 —— 四处各写一份改一处必然漏三处。</p>
*/
/** 日期键格式校验 */
var DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;
/**
* 两位补零。
*
* @param n 数值
* @returns 不足两位时前面补 {@code 0} 的字符串
*/
function pad2(n) {
	return n < 10 ? `0${n}` : String(n);
}
/**
* Date → 日期键（按其本地年月日）。
*
* @param d 日期
* @returns {@code YYYY-MM-DD}
*/
function toDateKey(d) {
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/**
* 日期键加一天。
*
* <p>走 {@link Date} 构造而非手工进位，闰年与月末都不需要特判。</p>
*
* @param key {@code YYYY-MM-DD}
* @returns 次日的日期键
*/
function nextDateKey(key) {
	return addDateKeyDays(key, 1);
}
/**
* 日期键加 n 天（n 可为负）。
*
* @param key {@code YYYY-MM-DD}
* @param days 偏移天数
* @returns 偏移后的日期键
*/
function addDateKeyDays(key, days) {
	const y = Number(key.slice(0, 4));
	const m = Number(key.slice(5, 7));
	const d = Number(key.slice(8, 10));
	return toDateKey(new Date(y, m - 1, d + days));
}
/**
* 日期键 → 本地 Date。
*
* @param key {@code YYYY-MM-DD}
* @returns 本地零点时刻的 Date
*/
function fromDateKey(key) {
	return new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8, 10)));
}
/**
* 日期键是否合法。
*
* @param key 待校验字符串
* @returns 形如 {@code YYYY-MM-DD} 返回 {@code true}
*/
function isDateKey(key) {
	return DATE_KEY_RE.test(key);
}
/**
* 两个日期键相差的天数（{@code b - a}）。
*
* @param a 起 {@code YYYY-MM-DD}
* @param b 止 {@code YYYY-MM-DD}
* @returns 天数差；入参非法返回 {@code NaN}
*/
function diffDays(a, b) {
	const ta = Date.UTC(Number(a.slice(0, 4)), Number(a.slice(5, 7)) - 1, Number(a.slice(8, 10)));
	const tb = Date.UTC(Number(b.slice(0, 4)), Number(b.slice(5, 7)) - 1, Number(b.slice(8, 10)));
	return Math.round((tb - ta) / 864e5);
}
/** 星期中文短名，索引与 {@link Date.getDay} 对齐 */
var WEEKDAY_NAMES = [
	"日",
	"一",
	"二",
	"三",
	"四",
	"五",
	"六"
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/lunar.ts
/**
* 农历（夏历）换算核心
*
* <p>数据来源：1900—2100 年农历压缩表 {@link LUNAR_INFO}，每年 1 个 16 位整数，
* 位含义为业界通用约定：</p>
* <ul>
*   <li>bits 4..15（掩码 {@code 0x10} ~ {@code 0x8000}）：正月至十二月的大小，
*       该位为 {@code 0} → 该月 29 天，为 {@code 1} → 30 天；</li>
*   <li>bits 0..3（掩码 {@code 0x0f}）：闰月月份（1—12），{@code 0} 表示当年无闰月；</li>
*   <li>bit 16（掩码 {@code 0x10000}）：闰月大小，{@code 1} → 闰月 30 天，{@code 0} → 29 天。</li>
* </ul>
*
* <p>纪元锚点：公历 <b>1900-01-31</b> 为农历 1900 年正月初一，因此「与纪元的自然日差」
* 就是逐日累加的月份偏移量。</p>
*
* <p>农历只在「区间内」可信。超出 {@link LUNAR_MIN_YEAR} / {@link LUNAR_MAX_YEAR}
* 的日期一律返回 {@code null}，由调用方降级为只展示公历 —— 宁可少显示，
* 也不显示错误的农历。</p>
*/
/** 农历数据表起始年（与表下标 {@code 0} 对应） */
var LUNAR_MIN_YEAR = 1900;
/** 纪元日：公历 1900-01-31 = 农历 1900 年正月初一 */
var EPOCH_UTC = Date.UTC(1900, 0, 31);
/**
* 1900—2100 年农历压缩表。
*
* <p>每 10 个一行，行尾注释为该行首项对应的公历年份。</p>
*/
var LUNAR_INFO = [
	19416,
	19168,
	42352,
	21717,
	53856,
	55632,
	91476,
	22176,
	39632,
	21970,
	19168,
	42422,
	42192,
	53840,
	119381,
	46400,
	54944,
	44450,
	38320,
	84343,
	18800,
	42160,
	46261,
	27216,
	27968,
	109396,
	11104,
	38256,
	21234,
	18800,
	25958,
	54432,
	59984,
	28309,
	23248,
	11104,
	100067,
	37600,
	116951,
	51536,
	54432,
	120998,
	46416,
	22176,
	107956,
	9680,
	37584,
	53938,
	43344,
	46423,
	27808,
	46416,
	86869,
	19872,
	42416,
	83315,
	21168,
	43432,
	59728,
	27296,
	44710,
	43856,
	19296,
	43748,
	42352,
	21088,
	62051,
	55632,
	23383,
	22176,
	38608,
	19925,
	19152,
	42192,
	54484,
	53840,
	54616,
	46400,
	46752,
	103846,
	38320,
	18864,
	43380,
	42160,
	45690,
	27216,
	27968,
	44870,
	43872,
	38256,
	19189,
	18800,
	25776,
	29859,
	59984,
	27480,
	21952,
	43872,
	38613,
	37600,
	51552,
	55636,
	54432,
	55888,
	30034,
	22176,
	43959,
	9680,
	37584,
	51893,
	43344,
	46240,
	47780,
	44368,
	21977,
	19360,
	42416,
	86390,
	21168,
	43312,
	31060,
	27296,
	44368,
	23378,
	19296,
	42726,
	42208,
	53856,
	60005,
	54576,
	23200,
	30371,
	38608,
	19195,
	19152,
	42192,
	118966,
	53840,
	54560,
	56645,
	46496,
	22224,
	21938,
	18864,
	42359,
	42160,
	43600,
	111189,
	27936,
	44448,
	84835,
	37744,
	18936,
	18800,
	25776,
	92326,
	59984,
	27424,
	108228,
	43744,
	41696,
	53987,
	51552,
	54615,
	54432,
	55888,
	23893,
	22176,
	42704,
	21972,
	21200,
	43448,
	43344,
	46240,
	46758,
	44368,
	21920,
	43940,
	42416,
	21168,
	45683,
	26928,
	29495,
	27296,
	44368,
	84821,
	19296,
	42352,
	21732,
	53600,
	59752,
	54560,
	55968,
	92838,
	22224,
	19168,
	43476,
	41680,
	53584,
	62034,
	54560
];
/** 农历月的中文序数名（十一月称「冬月」、十二月称「腊月」） */
var MONTH_NAMES = [
	"正月",
	"二月",
	"三月",
	"四月",
	"五月",
	"六月",
	"七月",
	"八月",
	"九月",
	"十月",
	"冬月",
	"腊月"
];
/** 农历日的十位中文（初一…初十） */
var DAY_TENS = [
	"初",
	"十",
	"廿",
	"卅"
];
/** 农历日的个位中文（子丑…） */
var DAY_UNITS = [
	"十",
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"七",
	"八",
	"九"
];
/** 天干（用于干支纪年） */
var HEAVENLY_STEMS = [
	"甲",
	"乙",
	"丙",
	"丁",
	"戊",
	"己",
	"庚",
	"辛",
	"壬",
	"癸"
];
/** 地支 */
var EARTHLY_BRANCHES = [
	"子",
	"丑",
	"寅",
	"卯",
	"辰",
	"巳",
	"午",
	"未",
	"申",
	"酉",
	"戌",
	"亥"
];
/** 生肖（按地支顺序；1900 年庚子为鼠年，故下标 0 对应「鼠」） */
var ZODIACS = [
	"鼠",
	"牛",
	"虎",
	"兔",
	"龙",
	"蛇",
	"马",
	"羊",
	"猴",
	"鸡",
	"狗",
	"猪"
];
/**
* 取农历年压缩数据。
*
* @param year 农历年
* @returns 压缩表条目；超出数据范围返回 {@code 0}
*/
function info(year) {
	const idx = year - LUNAR_MIN_YEAR;
	if (idx < 0 || idx >= LUNAR_INFO.length) return 0;
	return LUNAR_INFO[idx];
}
/**
* 某农历年闰哪个月。
*
* @param year 农历年
* @returns 闰月月份（1—12）；无闰月返回 {@code 0}
*/
function leapMonth(year) {
	return info(year) & 15;
}
/**
* 闰月天数。
*
* @param year 农历年
* @returns 29 或 30；无闰月返回 {@code 0}
*/
function leapMonthDays(year) {
	if (!leapMonth(year)) return 0;
	return info(year) & 65536 ? 30 : 29;
}
/**
* 农历某月（不含闰月）的天数。
*
* @param year 农历年
* @param month 农历月（1—12）
* @returns 29 或 30；参数非法时返回 {@code 0}
*/
function monthDays(year, month) {
	if (month < 1 || month > 12) return 0;
	return info(year) & 65536 >> month ? 30 : 29;
}
/**
* 农历某年的总天数（12 个月 + 可能的闰月）。
*
* @param year 农历年
* @returns 该年天数（354 / 355 / 383 / 384 / 385）
*/
function lunarYearDays(year) {
	let sum = 348;
	for (let bit = 32768; bit > 8; bit >>= 1) if (info(year) & bit) sum += 1;
	return sum + leapMonthDays(year);
}
/**
* 取农历年首日（正月初一）距纪元的自然日偏移量。
*
* @param year 农历年
* @returns 偏移天数；year 早于 {@link LUNAR_MIN_YEAR} 返回 {@code -1}
*/
function yearStartOffset(year) {
	let offset = 0;
	for (let y = LUNAR_MIN_YEAR; y < year; y += 1) offset += lunarYearDays(y);
	return offset;
}
/**
* 公历日期转农历。
*
* <p>只用「本地日期的年月日」构造 UTC 时刻做差，因此<b>与时区无关</b>：
* 不存在「东八区凌晨转成 UTC 后退一天」的经典错误。</p>
*
* @param date 公历日期（只读取其年月日）
* @returns 农历日期；超出 1900—2100 范围返回 {@code null}
*/
function solarToLunar(date) {
	const y = date.getFullYear();
	if (y < 1900 || y > 2100) return null;
	const target = Date.UTC(y, date.getMonth(), date.getDate());
	const diff = Math.round((target - EPOCH_UTC) / 864e5);
	let year = LUNAR_MIN_YEAR;
	let remaining = diff;
	while (remaining < 0 && year > 1900) {
		year -= 1;
		remaining += lunarYearDays(year);
	}
	let offset = yearStartOffset(year);
	while (true) {
		const total = lunarYearDays(year);
		if (remaining < offset + total) break;
		if (year >= 2100) return null;
		year += 1;
		offset += total;
	}
	const dayOfYear = remaining - offset;
	const leap = leapMonth(year);
	let month = 1;
	let isLeap = false;
	let used = 0;
	while (month <= 12) {
		const days = monthDays(year, month);
		if (used + days > dayOfYear) break;
		used += days;
		if (month === leap && used <= dayOfYear) {
			const ldays = leapMonthDays(year);
			if (used + ldays > dayOfYear) {
				isLeap = true;
				break;
			}
			used += ldays;
		}
		month += 1;
	}
	const mdays = isLeap ? leapMonthDays(year) : monthDays(year, month);
	const day = dayOfYear - used + 1;
	return {
		year,
		month,
		day,
		isLeap,
		monthDays: mdays,
		monthName: (isLeap ? "闰" : "") + MONTH_NAMES[month - 1],
		dayName: formatLunarDayNumber(day),
		zodiac: ZODIACS[(year - 4) % 12],
		ganzhi: HEAVENLY_STEMS[(year - 4) % 10] + EARTHLY_BRANCHES[(year - 4) % 12],
		yearDays: lunarYearDays(year)
	};
}
/**
* 农历日数字转中文（如 1 → 「初一」，13 → 「十三」，20 → 「二十」，30 → 「三十」）。
*
* @param day 农历日（1—30）
* @returns 中文日名；参数非法时返回空串
*/
function formatLunarDayNumber(day) {
	if (day < 1 || day > 30) return "";
	if (day === 10) return "初十";
	if (day === 20) return "二十";
	if (day === 30) return "三十";
	return DAY_TENS[Math.floor(day / 10)] + DAY_UNITS[day % 10];
}
/**
* 农历日期的短文本。
*
* <p>初一显示月名（如「八月」），其余显示日名（如「十三」）—— 这是中文日历的通行做法，
* 因为「初一」本身信息量等于零。</p>
*
* @param lunar 农历日期；传 {@code null} 返回空串
* @returns 如「八月」「八月十三」
*/
function lunarShortText(lunar) {
	if (!lunar) return "";
	return lunar.day === 1 ? lunar.monthName : lunar.dayName;
}
/**
* 农历日期的完整文本。
*
* @param lunar 农历日期；传 {@code null} 返回空串
* @returns 如「丙午年 八月十三」
*/
function lunarFullText(lunar) {
	if (!lunar) return "";
	return `${lunar.ganzhi}年 ${lunar.monthName}${lunar.dayName}`;
}
/**
* 求某农历年的除夕（正月初一的前一天）。
*
* <p><b>注意</b>：除夕总是落在<b>春节之前</b>的公历日（1 月下旬或 2 月上旬），
* 而不是「该农历年的最后一天」。例如 2025 年的除夕是 2025-01-28，
* 它属于农历甲辰年腊月，而 2025 年的正月初一要到 2025-01-29 才到 ——
* 农历年与公历年相差约一个月，直接用「该年最后一天」当除夕会算到 2026-02-16。</p>
*
* @param year 农历年（该年的春节）
* @returns 除夕对应的公历日期；超出数据范围返回 {@code null}
*/
function lunarNewYearEve(year) {
	if (year < 1900 || year > 2100) return null;
	const offset = yearStartOffset(year) - 1;
	return new Date(EPOCH_UTC + offset * 864e5);
}
/**
* 求某农历年的正月初一（春节）。
*
* @param year 农历年
* @returns 春节对应的公历日期；超出数据范围返回 {@code null}
*/
function lunarNewYear(year) {
	if (year < 1900 || year > 2100) return null;
	const offset = yearStartOffset(year);
	return new Date(EPOCH_UTC + offset * 864e5);
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/solarTerms.ts
/**
* 二十四节气换算
*
* <p>节气按<b>太阳视黄经</b>定义：太阳黄经每过 15° 为一个节气，序列为
* 小寒 285° → 大寒 300° → 立春 315° → …… → 冬至 270°（即 -90°）。
* 本模块用 Meeus《Astronomical Algorithms》的低精度太阳位置公式求出黄经，
* 再二分法求过零点，因此不依赖「平气」近似，年代漂移极小。</p>
*
* <p>节气时刻按<b>北京时间（东八区）</b>归属日期 —— 这是国内历书的通行口径。
* 换算只做一次经度平移后读取 UTC 字段，不经过本地时区，
* 因此运行在东八区之外的机器上结果也一致。</p>
*/
/** 北京时区偏移（毫秒） */
var BEIJING_OFFSET_MS = 288e5;
/** 儒略日 epoch（1970-01-01T00:00:00Z 对应的 JD） */
var JD_EPOCH_OFFSET = 2440587.5;
/** 节气名，索引 0 为小寒（黄经 285°），每项递增 15° */
var SOLAR_TERM_NAMES = [
	"小寒",
	"大寒",
	"立春",
	"雨水",
	"惊蛰",
	"春分",
	"清明",
	"谷雨",
	"立夏",
	"小满",
	"芒种",
	"夏至",
	"小暑",
	"大暑",
	"立秋",
	"处暑",
	"白露",
	"秋分",
	"寒露",
	"霜降",
	"立冬",
	"小雪",
	"大雪",
	"冬至"
];
/** 「某年某月第几个星期几」型节日用的星期序号（与 {@link Date.getDay} 一致） */
var MS_PER_DAY = 864e5;
/**
* 计算给定儒略日时刻的太阳视黄经（度，可能大于 360）。
*
* <p>返回未取模的值，便于调用方直接做「目标黄经 − 当前黄经」的差值迭代。</p>
*
* @param jd 儒略日（UTC 基准）
* @returns 太阳视黄经，单位度
*/
function apparentSolarLongitude(jd) {
	const t = (jd - 2451545) / 36525;
	const l0 = 280.46646 + 36000.76983 * t + 3032e-7 * t * t;
	const mr = (357.52911 + 35999.05029 * t - 1537e-7 * t * t) * Math.PI / 180;
	const trueLong = l0 + ((1.914602 - .004817 * t - 14e-6 * t * t) * Math.sin(mr) + (.019993 - 101e-6 * t) * Math.sin(2 * mr) + 289e-6 * Math.sin(3 * mr));
	const omega = (125.04 - 1934.136 * t) * Math.PI / 180;
	return trueLong - .00569 - .00478 * Math.sin(omega);
}
/**
* 儒略日转北京时间日期键。
*
* @param jd 儒略日（UTC 基准）
* @returns {@code YYYY-MM-DD}（北京时间）
*/
function jdToBeijingDateKey(jd) {
	const ms = (jd - JD_EPOCH_OFFSET) * MS_PER_DAY + BEIJING_OFFSET_MS;
	const d = new Date(ms);
	return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
/** 日期键转儒略日（该日北京时间 00:00 对应的 JD） */
function dateKeyToJd(key) {
	const [y, m, d] = key.split("-").map(Number);
	return Date.UTC(y, m - 1, d) / MS_PER_DAY + JD_EPOCH_OFFSET - BEIJING_OFFSET_MS / MS_PER_DAY;
}
/**
* 求「目标黄经还差多少度」。
*
* <p>归一到 {@code (-180, 180]} 是必需的：黄经在 0°/360° 处会回绕，
* 直接比较 {@code target - lon} 会让 359.9° 与 0.1° 得出完全相反的符号，
* 二分法随之发散。归一后「差值为正」严格等价于「目标时刻还没到」。</p>
*
* @param jd 儒略日
* @param target 目标黄经（度）
* @returns 目标黄经减去当前黄经，归一到 {@code (-180, 180)}
*/
function deltaToTarget(jd, target) {
	return ((target - apparentSolarLongitude(jd)) % 360 + 540) % 360 - 180;
}
/**
* 求某年某节气的儒略日时刻。
*
* @param year 公历年
* @param index 节气索引（0 = 小寒，23 = 冬至）
* @returns 该节气交点的儒略日；索引非法返回 {@code NaN}
*/
function termJd(year, index) {
	if (index < 0 || index >= SOLAR_TERM_NAMES.length) return NaN;
	const target = 285 + 15 * index;
	const approx = dateKeyToJd(`${year}-01-05`) + index * (365.2422 / 24);
	let lo = approx - 3;
	let hi = approx + 3;
	for (let i = 0; i < 60; i += 1) {
		const mid = (lo + hi) / 2;
		if (deltaToTarget(mid, target) > 0) lo = mid;
		else hi = mid;
	}
	return (lo + hi) / 2;
}
/** 一年的 24 项缓存：年份 → 24 个节气的日期键 */
var termCache = /* @__PURE__ */ new Map();
/**
* 取某公历年的全部节气日期。
*
* <p>同一个年份只算一次，重复调用直接命中缓存。</p>
*
* @param year 公历年
* @returns 长度 24 的日期键数组，下标与 {@link SOLAR_TERM_NAMES} 对齐
*/
function getYearSolarTerms(year) {
	const cached = termCache.get(year);
	if (cached) return cached;
	const list = [];
	for (let i = 0; i < SOLAR_TERM_NAMES.length; i += 1) {
		const jd = termJd(year, i);
		list.push(Number.isNaN(jd) ? "" : jdToBeijingDateKey(jd));
	}
	termCache.set(year, list);
	return list;
}
/**
* 查某一天是否为节气，以及节气名。
*
* @param dateKey {@code YYYY-MM-DD}
* @returns 节气名；当天不是节气返回 {@code null}
*/
function getSolarTerm(dateKey) {
	const year = Number(dateKey.slice(0, 4));
	if (!Number.isFinite(year)) return null;
	const idx = [...getYearSolarTerms(year), ...getYearSolarTerms(year + 1)].indexOf(dateKey);
	if (idx < 0) return null;
	return SOLAR_TERM_NAMES[idx % SOLAR_TERM_NAMES.length];
}
/**
* 求某年某个节气的日期键。
*
* @param year 公历年
* @param name 节气名（如「清明」）
* @returns {@code YYYY-MM-DD}；节气名不合法返回 {@code null}
*/
function getSolarTermDate(year, name) {
	const idx = SOLAR_TERM_NAMES.indexOf(name);
	if (idx < 0) return null;
	return getYearSolarTerms(year)[idx] ?? null;
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/festivals.ts
/**
* 公历固定日节日。
*
* <p>元组为 {@code [日期, 全称, 类别, 级别, 短名?]}，短名只给放不下全称的条目。</p>
* <p>键为 {@code MM-DD}，值可能是<b>多个</b>节日 —— 3 月 12 日既是植树节又是
* 孙中山先生逝世纪念日，7 月 1 日既是建党纪念日又是香港回归纪念日。
* 早先这里用 {@code Map<string, Festival>}，同一天只能存一个，
* 后注册的那个会把前一个挤掉，所以改成数组。</p>
*/
var SOLAR_TABLE = [
	[
		"01-01",
		"元旦",
		"statutory",
		1
	],
	[
		"01-10",
		"警察节",
		"memorial",
		3
	],
	[
		"02-14",
		"情人节",
		"other",
		3
	],
	[
		"03-05",
		"学雷锋纪念日",
		"memorial",
		3
	],
	[
		"03-08",
		"妇女节",
		"other",
		2
	],
	[
		"03-12",
		"植树节",
		"other",
		3
	],
	[
		"03-12",
		"孙中山逝世纪念日",
		"memorial",
		3,
		"中山纪念"
	],
	[
		"03-15",
		"消费者权益日",
		"other",
		3
	],
	[
		"04-01",
		"愚人节",
		"other",
		3
	],
	[
		"04-22",
		"地球日",
		"other",
		3
	],
	[
		"04-23",
		"世界读书日",
		"other",
		3
	],
	[
		"05-01",
		"劳动节",
		"statutory",
		1
	],
	[
		"05-04",
		"青年节",
		"memorial",
		2
	],
	[
		"05-12",
		"防灾减灾日",
		"memorial",
		3
	],
	[
		"06-01",
		"儿童节",
		"other",
		2
	],
	[
		"07-01",
		"建党节",
		"memorial",
		2
	],
	[
		"07-01",
		"香港回归纪念日",
		"memorial",
		3,
		"香港回归"
	],
	[
		"08-01",
		"建军节",
		"memorial",
		2
	],
	[
		"09-03",
		"抗战胜利纪念日",
		"memorial",
		2,
		"抗战胜利"
	],
	[
		"09-10",
		"教师节",
		"other",
		3
	],
	[
		"09-18",
		"九一八纪念日",
		"memorial",
		3,
		"九一八"
	],
	[
		"09-30",
		"烈士纪念日",
		"memorial",
		2,
		"烈士纪念"
	],
	[
		"10-01",
		"国庆节",
		"statutory",
		1
	],
	[
		"10-19",
		"抗美援朝出国作战纪念日",
		"memorial",
		3,
		"抗美援朝"
	],
	[
		"10-25",
		"台湾光复纪念日",
		"memorial",
		3
	],
	[
		"10-31",
		"万圣夜",
		"other",
		3
	],
	[
		"11-01",
		"万圣节",
		"other",
		3
	],
	[
		"11-11",
		"双十一",
		"other",
		3
	],
	[
		"12-04",
		"国家宪法日",
		"memorial",
		3,
		"宪法日"
	],
	[
		"12-13",
		"国家公祭日",
		"memorial",
		3
	],
	[
		"12-20",
		"澳门回归纪念日",
		"memorial",
		3,
		"澳门回归"
	],
	[
		"12-24",
		"平安夜",
		"other",
		3
	],
	[
		"12-25",
		"圣诞节",
		"other",
		3
	]
];
/** 公历固定日节日表（{@code MM-DD} → 该日的全部节日） */
var SOLAR_FESTIVALS = (() => {
	const grouped = /* @__PURE__ */ new Map();
	for (const [md, name, kind, level, short] of SOLAR_TABLE) {
		const list = grouped.get(md);
		const item = short ? {
			name,
			short,
			kind,
			level
		} : {
			name,
			kind,
			level
		};
		if (list) list.push(item);
		else grouped.set(md, [item]);
	}
	return grouped;
})();
/** 农历固定月日节日表（{@code M-D} → 节日） */
var LUNAR_FESTIVALS = new Map([
	[
		1,
		1,
		"春节",
		1
	],
	[
		1,
		15,
		"元宵节",
		2
	],
	[
		2,
		2,
		"龙抬头",
		3
	],
	[
		3,
		3,
		"上巳节",
		3
	],
	[
		5,
		5,
		"端午节",
		1
	],
	[
		7,
		7,
		"七夕节",
		2
	],
	[
		7,
		15,
		"中元节",
		3
	],
	[
		8,
		15,
		"中秋节",
		1
	],
	[
		9,
		9,
		"重阳节",
		2
	],
	[
		10,
		1,
		"寒衣节",
		3
	],
	[
		12,
		8,
		"腊八节",
		3
	],
	[
		12,
		23,
		"小年",
		2
	]
].map(([m, d, name, level]) => [`${m}-${d}`, {
	name,
	kind: "lunar",
	level
}]));
/** 「第 N 个星期 X」型节日表 */
var WEEK_FESTIVALS = [
	{
		name: "母亲节",
		month: 5,
		nth: 2,
		weekday: 0,
		level: 2
	},
	{
		name: "父亲节",
		month: 6,
		nth: 3,
		weekday: 0,
		level: 2
	},
	{
		name: "感恩节",
		month: 11,
		nth: 4,
		weekday: 4,
		level: 3
	}
];
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/statutory.ts
/**
* 法定节假日与调休上班日
*
* <p><b>数据可信度分层</b> —— 这是本模块最要紧的设计：</p>
* <ol>
*   <li><b>已公布</b>（{@link PUBLISHED_YEARS}）：国务院办公厅逐年发文明确放假区间与
*       调休上班日，{@code StatutoryPeriod.provisional} 为 {@code false}，可直接上屏；</li>
*   <li><b>未公布</b>：年份既不在已公布表内、又晚于最后一次通告的年份。
*       国务院办公厅通常在<b>前一年 11 月</b>发布次年安排，因此当年 1—10 月的数据
*       在 11 月前是「已公布」，11—12 月则尚未公布。</li>
* </ol>
*
* <p>未公布的年份只按《全国年节及纪念日放假办法》<b>推算法定假日当天</b>，
* <b>不编造调休上班日</b> —— 调休完全取决于当年双休日的排布，无据可推。
* 宁可少标一个「班」，也不能让用户按错的日子请假上班。
* 推算结果 {@code provisional === true}，UI 需据此弱化展示。</p>
*/
/**
* 官方公布的放假安排。
*
* <p>逐年取自中国政府网《国务院办公厅关于 X 年部分节假日安排的通知》原文。</p>
*/
var PUBLISHED = {
	2025: [
		{
			name: "元旦",
			start: "2025-01-01",
			end: "2025-01-01",
			workdays: [],
			provisional: false
		},
		{
			name: "春节",
			start: "2025-01-28",
			end: "2025-02-04",
			workdays: ["2025-01-26", "2025-02-08"],
			provisional: false
		},
		{
			name: "清明节",
			start: "2025-04-04",
			end: "2025-04-06",
			workdays: [],
			provisional: false
		},
		{
			name: "劳动节",
			start: "2025-05-01",
			end: "2025-05-05",
			workdays: ["2025-04-27"],
			provisional: false
		},
		{
			name: "端午节",
			start: "2025-05-31",
			end: "2025-06-02",
			workdays: [],
			provisional: false
		},
		{
			name: "国庆节、中秋节",
			start: "2025-10-01",
			end: "2025-10-08",
			workdays: ["2025-09-28", "2025-10-11"],
			provisional: false
		}
	],
	2026: [
		{
			name: "元旦",
			start: "2026-01-01",
			end: "2026-01-03",
			workdays: ["2026-01-04"],
			provisional: false
		},
		{
			name: "春节",
			start: "2026-02-15",
			end: "2026-02-23",
			workdays: ["2026-02-14", "2026-02-28"],
			provisional: false
		},
		{
			name: "清明节",
			start: "2026-04-04",
			end: "2026-04-06",
			workdays: [],
			provisional: false
		},
		{
			name: "劳动节",
			start: "2026-05-01",
			end: "2026-05-05",
			workdays: ["2026-05-09"],
			provisional: false
		},
		{
			name: "端午节",
			start: "2026-06-19",
			end: "2026-06-21",
			workdays: [],
			provisional: false
		},
		{
			name: "中秋节",
			start: "2026-09-25",
			end: "2026-09-27",
			workdays: [],
			provisional: false
		},
		{
			name: "国庆节",
			start: "2026-10-01",
			end: "2026-10-07",
			workdays: ["2026-09-20", "2026-10-10"],
			provisional: false
		}
	]
};
/** 已有官方数据的年份 */
var PUBLISHED_YEARS = Object.keys(PUBLISHED).map(Number).sort((a, b) => a - b);
/**
* 最后一次官方通告所覆盖的公历年。
*
* <p>国务院办公厅在 11 月发布次年安排，故截止到本表最大年份为止都算「已公布」；
* 再往后的年份只能推算。</p>
*/
var LAST_PUBLISHED_YEAR = PUBLISHED_YEARS[PUBLISHED_YEARS.length - 1];
/**
* 按《全国年节及纪念日放假办法》（2024-11 修订，2025 年起施行）推算的法定假日。
*
* <p>依据：元旦 1 天、春节 4 天（除夕、正月初一至初三）、清明 1 天、劳动节 2 天、
* 端午 1 天、中秋 1 天、国庆 3 天，合计 13 天。
* <b>调休上班日一律留空</b>，见文件头说明。</p>
*
* @param year 公历年
* @returns 推算的放假区间；农历换算失败时返回已知的部分
*/
function derivePeriods(year) {
	const out = [];
	const push = (name, start, days) => {
		if (!start || !isDateKey(start)) return;
		out.push({
			name,
			start,
			end: addDateKeyDays(start, days - 1),
			workdays: [],
			provisional: true
		});
	};
	push("元旦", `${year}-01-01`, 1);
	const eve = lunarNewYearEve(year);
	push("春节", eve ? toDateKey(eve) : null, 4);
	push("清明节", getSolarTermDate(year, "清明"), 1);
	push("劳动节", `${year}-05-01`, 2);
	push("端午节", firstLunarDayOfYear(year, 5, 5), 1);
	push("中秋节", firstLunarDayOfYear(year, 8, 15), 1);
	push("国庆节", `${year}-10-01`, 3);
	return out.sort((a, b) => a.start.localeCompare(b.start));
}
/**
* 求某公历年内，指定农历月日首次出现的那一天。
*
* <p>端午（农历五月初五）与中秋（八月十五）在公历上必定落在 1—12 月内，
* 因此扫描「今年 1 月 1 日起 370 天」必然命中。</p>
*
* @param year 公历年
* @param month 农历月
* @param day 农历日
* @returns 日期键；农历数据不可用时返回 {@code null}
*/
function firstLunarDayOfYear(year, month, day) {
	const start = `${year}-01-01`;
	for (let i = 0; i < 370; i += 1) {
		const local = fromDateKey(addDateKeyDays(start, i));
		const lunar = solarToLunar(local);
		if (lunar && !lunar.isLeap && lunar.month === month && lunar.day === day) return toDateKey(local);
	}
	return null;
}
/** 按年缓存 */
var yearCache = /* @__PURE__ */ new Map();
/**
* 取某公历年的全部法定放假区间。
*
* <p>同一年度只算一次。返回的数组按放假开始日升序。</p>
*
* @param year 公历年
* @returns 该年放假区间；官方未公布时 {@code provisional} 为 {@code true} 且
*          {@code workdays} 为空
*/
function getStatutoryPeriods(year) {
	const cached = yearCache.get(year);
	if (cached) return cached;
	const list = year <= LAST_PUBLISHED_YEAR ? PUBLISHED[year] ?? [] : derivePeriods(year);
	yearCache.set(year, list);
	return list;
}
/**
* 该年放假安排是否已由官方公布。
*
* @param year 公历年
* @returns 已公布返回 {@code true}
*/
function isStatutoryPublished(year) {
	return year <= LAST_PUBLISHED_YEAR;
}
var indexCache = /* @__PURE__ */ new Map();
/**
* 某年放假区间的日期索引。
*
* @param year 公历年
* @returns 日期键到区间的映射，以及调休上班日映射
*/
function indexOfYear(year) {
	const cached = indexCache.get(year);
	if (cached) return cached;
	const byDate = /* @__PURE__ */ new Map();
	const workdayOf = /* @__PURE__ */ new Map();
	for (const p of getStatutoryPeriods(year)) {
		let cur = p.start;
		for (let guard = 0; guard < 40 && cur <= p.end; guard += 1) {
			byDate.set(cur, p);
			cur = nextDateKey(cur);
		}
		for (const w of p.workdays) if (isDateKey(w)) workdayOf.set(w, p.name);
	}
	const idx = {
		byDate,
		workdayOf
	};
	indexCache.set(year, idx);
	return idx;
}
/**
* 查某天是否落在法定放假区间内。
*
* @param dateKey {@code YYYY-MM-DD}
* @returns 命中的放假区间；不在区间内返回 {@code null}
*/
function getStatutoryPeriod(dateKey) {
	const year = Number(dateKey.slice(0, 4));
	if (!Number.isFinite(year)) return null;
	return indexOfYear(year).byDate.get(dateKey) ?? null;
}
/**
* 查某天是否为调休上班日。
*
* @param dateKey {@code YYYY-MM-DD}
* @returns 所属节日名；非调休上班日返回 {@code null}
*/
function getMakeupWorkday(dateKey) {
	const year = Number(dateKey.slice(0, 4));
	if (!Number.isFinite(year)) return null;
	return indexOfYear(year).workdayOf.get(dateKey) ?? null;
}
/**
* 某法定节日在某公历年的主节日日（如国庆节的 10 月 1 日）。
*
* <p>用于在格子里显示节日名，而不是只显示「第 3 天」。</p>
*
* @param dateKey {@code YYYY-MM-DD}
* @param periodName 节日名
* @returns 主节日日的日期键；未找到返回 {@code null}
*/
function getMainFestivalDay(dateKey, periodName) {
	const year = Number(dateKey.slice(0, 4));
	if (!Number.isFinite(year)) return null;
	const hit = getStatutoryPeriod(dateKey);
	if (!hit || hit.name !== periodName) return null;
	if (periodName.includes("中秋") && !periodName.includes("国庆")) return firstLunarDayOfYear(year, 8, 15);
	if (periodName.includes("国庆")) return `${year}-10-01`;
	if (periodName.includes("元旦")) return `${year}-01-01`;
	if (periodName.includes("春节")) {
		const ny = lunarNewYear(year);
		return ny ? toDateKey(ny) : null;
	}
	if (periodName.includes("清明")) return getSolarTermDate(year, "清明");
	if (periodName.includes("劳动节")) return `${year}-05-01`;
	if (periodName.includes("端午")) return firstLunarDayOfYear(year, 5, 5);
	return hit.start;
}
/**
* 求「当前或即将到来」的法定放假区间。
*
* <p>逐日推进并以 {@code horizonDays} 为界，因此：</p>
* <ul>
*   <li>今天就在假期中 → 立即返回该区间（含元旦 / 春节横跨年末的情况，
*       按「从起始年 + 1、+2 三年」展开不会漏）；</li>
*   <li>超出期限 → 返回 {@code null}，而不是返回一个明年才有的区间把「还有多久」算错。</li>
* </ul>
*
* @param fromDateKey 从哪天起算（含）
* @param horizonDays 最多向后找多少天
* @returns 命中的区间；期限内没有则返回 {@code null}
*/
function findNextHoliday(fromDateKey, horizonDays = 400) {
	let cursor = fromDateKey;
	for (let i = 0; i <= horizonDays; i += 1) {
		const hit = getStatutoryPeriod(cursor);
		if (hit) return hit;
		cursor = addDateKeyDays(cursor, 1);
	}
	return null;
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/remoteHolidays.ts
/**
* 后台下发的节假日数据（覆盖层）
*
* <p>后台 {@code GET /v2/holiday/get?year=} 按<b>日期逐行</b>返回
* {@code { date, name, isHoliday }}（{@code isHoliday=1} 休息、{@code 0} 补班），
* 一段 7 天的假期就是 7 行同名记录。本模块负责把这些行归一成一个按日期键索引的覆盖层。</p>
*
* <p><b>与本地表的关系</b>：后台是管理员可维护的事实来源，因此<b>只覆盖它给出的那些日期</b>，
* 其余日期仍走 {@link ./statutory} 的内置表与推算。这样后台只下发一年也不会让其余年份变空 ——
* 拿掉覆盖层（{@link clearRemoteHolidays}）即完全退回本地行为。</p>
*
* <p>本模块<b>不依赖任何运行时设施</b>（无 http、无 Vue），
* 便于独立核验；取数与装配由 widget 层接线（core 不反向依赖 theme）。</p>
*/
/** 日期键 → 记录 */
var byDate = /* @__PURE__ */ new Map();
/** 已有数据的年份集合 */
var years = /* @__PURE__ */ new Set();
/**
* 用后台数据覆盖某一年。
*
* <p><b>整年替换</b>而非增量合并：后台是权威来源，若某一年此前下发过 30 行、
* 现在只下发 10 行，说明后台删了 20 条，增量合并会让已删除的日期继续显示放假 ——
* 那是「日历说有假、后台说没有」的最坏情形。</p>
*
* @param year 公历年
* @param list 该年的全部记录（日期重复时以最后一条为准）
* @returns 实际收录的条数（跳过日期非法或名称为空的行）
*/
function setRemoteHolidays(year, list) {
	for (const key of [...byDate.keys()]) if (key.startsWith(`${year}-`)) byDate.delete(key);
	let count = 0;
	for (const item of list) {
		if (!isDateKey(item.key) || !item.name?.trim()) continue;
		byDate.set(item.key, {
			key: item.key,
			name: item.name.trim(),
			isHoliday: !!item.isHoliday
		});
		count += 1;
	}
	years.add(year);
	return count;
}
/**
* 某天是否有后台记录。
*
* @param key {@code YYYY-MM-DD}
* @returns 命中返回记录；否则 {@code null}
*/
function getRemoteHoliday(key) {
	return byDate.get(key) ?? null;
}
/**
* 取某年后台下发的全部记录，按日期升序。
*
* @param year 公历年
* @returns 该年的记录；无数据返回空数组
*/
function getRemoteHolidays(year) {
	const prefix = `${year}-`;
	return [...byDate.values()].filter((h) => h.key.startsWith(prefix)).sort((a, b) => a.key.localeCompare(b.key));
}
//#endregion
//#region ../../packages/theme/src/themes/koi/views/home/widgets/calendar/dayInfo.ts
/**
* 日历「一天」的统一视图
*
* <p>把农历、节气、节日、法定放假调休聚合成一个对象，供日历格子与节日面板直接渲染。
* 之所以要有这一层：这些来源各自独立计算（农历查表、节气解方程、节日查表、
* 放假查区间），若让每个 UI 调用点各算一遍，同一个格子会出现「格子说放假、
* 面板说不放假」这类不一致。</p>
*
* <p>结果按日期键缓存，日历翻月时同一批格子只算一次。</p>
*/
/** 日期键 → 公历各字段（缓存，避免重复 split / new Date） */
var fieldCache = /* @__PURE__ */ new Map();
var dayCache = /* @__PURE__ */ new Map();
/** 缓存上限：日历最多翻到前后一两年，超出即淘汰最旧项，防止长期使用无界增长 */
var CACHE_LIMIT = 4e3;
/**
* 取日期键的公历字段。
*
* @param key {@code YYYY-MM-DD}
* @returns 年 / 月 / 日 / 星期 / 今日键
*/
function fieldsOf(key) {
	const hit = fieldCache.get(key);
	if (hit) return hit;
	const rec = {
		y: Number(key.slice(0, 4)),
		m: Number(key.slice(5, 7)),
		d: Number(key.slice(8, 10)),
		w: fromDateKey(key).getDay(),
		today: toDateKey(/* @__PURE__ */ new Date())
	};
	fieldCache.set(key, rec);
	return rec;
}
/**
* 判断某农历日是否为除夕（腊月最后一天）。
*
* @param key {@code YYYY-MM-DD}
* @param lunar 该日的农历信息
* @returns 是除夕返回 {@code true}
*/
function isChuxi(key, lunar) {
	if (!lunar || lunar.isLeap || lunar.month !== 12) return false;
	return lunar.day === lunar.monthDays;
}
/**
* 求「某月第 N 个星期 X」型节日在该日是否命中。
*
* @param key {@code YYYY-MM-DD}
* @param y 公历年
* @param m 公历月
* @param w 星期几
* @returns 命中的节日；无则返回 {@code null}
*/
function matchWeekFestival(key, y, m, w) {
	for (const def of WEEK_FESTIVALS) {
		if (def.month !== m || def.weekday !== w) continue;
		const first = new Date(y, m - 1, 1).getDay();
		const day = 1 + (def.weekday - first + 7) % 7 + (def.nth - 1) * 7;
		if (day > new Date(y, m, 0).getDate()) continue;
		if (`${y}-${pad2(m)}-${pad2(day)}` === key) return {
			name: def.name,
			kind: "week",
			level: def.level
		};
	}
	return null;
}
/**
* 某一天各类节日在格子里的展示优先级：数字越小越靠前。
*
* <p>法定节假日压过一切 —— 春节当天的「情人节」不该抢格子里的那一行。</p>
* <p>{@code memorial} 与 {@code other} 同级，由 {@link Festival.level} 决胜：
* 同一天既是植树节又是孙中山逝世纪念日时，二者级别相同，
* 按登记先后（植树节在前）展示前者，另一个名字仍出现在悬浮提示与面板里。</p>
*/
var KIND_RANK = {
	statutory: 0,
	lunar: 1,
	solar: 1,
	week: 2,
	memorial: 3,
	other: 3,
	term: 4
};
/**
* 汇总某一天的全部信息。
*
* @param key {@code YYYY-MM-DD}
* @returns 该日的综合信息
*/
function getDayInfo(key) {
	const hit = dayCache.get(key);
	if (hit) return hit;
	const f = fieldsOf(key);
	const lunar = solarToLunar(new Date(f.y, f.m - 1, f.d));
	const term = getSolarTerm(key);
	const remote = getRemoteHoliday(key);
	const period = remote ? null : getStatutoryPeriod(key);
	const makeup = remote ? null : getMakeupWorkday(key);
	const list = [];
	const chuxi = isChuxi(key, lunar);
	if (remote) list.push({
		name: remote.name,
		kind: "statutory",
		level: remote.isHoliday ? 1 : 2
	});
	else if (makeup) list.push({
		name: makeup,
		kind: "statutory",
		level: 2
	});
	else if (period) {
		const main = getMainFestivalDay(key, period.name);
		list.push({
			name: chuxi ? "除夕" : period.name,
			kind: "statutory",
			level: chuxi || main === key ? 1 : 2
		});
	}
	for (const solarHit of SOLAR_FESTIVALS.get(key.slice(5)) ?? []) list.push(solarHit);
	if (lunar && !lunar.isLeap) {
		const lunarHit = LUNAR_FESTIVALS.get(`${lunar.month}-${lunar.day}`);
		if (lunarHit) list.push(lunarHit);
	}
	if (chuxi && !period) list.push({
		name: "除夕",
		kind: "lunar",
		level: 2
	});
	const weekHit = matchWeekFestival(key, f.y, f.m, f.w);
	if (weekHit) list.push(weekHit);
	if (term) list.push({
		name: term,
		kind: "term",
		level: 3
	});
	list.sort((a, b) => KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.level - b.level);
	const seen = /* @__PURE__ */ new Set();
	const festivals = list.filter((f) => {
		if (seen.has(f.name)) return false;
		seen.add(f.name);
		return true;
	});
	const isWeekend = f.w === 0 || f.w === 6;
	const isMakeupWork = remote ? !remote.isHoliday : makeup !== null;
	const isRest = remote ? remote.isHoliday : isMakeupWork ? false : period !== null || isWeekend;
	const info = {
		key,
		year: f.y,
		month: f.m,
		day: f.d,
		weekday: f.w,
		isToday: key === f.today,
		isWeekend,
		lunar,
		lunarText: lunarShortText(lunar),
		term,
		festivals,
		festivalText: festivals.length ? festivals[0].name : "",
		period,
		provisional: remote ? false : period ? period.provisional : !isStatutoryPublished(f.y),
		isRest,
		isMakeupWork,
		badge: isMakeupWork ? "班" : isRest && (period !== null || remote) ? "休" : "",
		fromRemote: remote !== null
	};
	if (dayCache.size >= CACHE_LIMIT) {
		let drop = Math.floor(CACHE_LIMIT / 10);
		for (const k of dayCache.keys()) {
			if (drop-- <= 0) break;
			dayCache.delete(k);
		}
	}
	dayCache.set(key, info);
	return info;
}
/**
* 节日的格子短名。
*
* <p>日历格子的宽度由表格自动分配（Element Plus 的 {@code td} 无宽度规则），
* 放不下的条目返回 {@link Festival.short} 简称；没有简称则原样返回。
* 全称始终保留在 {@link Festival.name}，由悬浮提示与节日面板展示。</p>
*
* @param f 节日条目
* @returns 用于格子那一行的文本
*/
function festivalDisplayText(f) {
	if (!f) return "";
	return f.short ?? f.name;
}
/**
* 取从某天起未来若干天的节日与假期。
*
* <p>两处刻意的收敛，否则列表会被噪声淹没：</p>
* <ul>
*   <li><b>整段假期折成一条</b>：国庆 7 天若逐日列，就是 7 行一模一样的「国庆节」。
*       用户要问的是「哪天开始放、能连休几天」，不是「10 月 4 日是什么节」；</li>
*   <li><b>只收 1—2 级节日</b>：「消费者权益日」这类 3 级条目会把列表刷满。</li>
* </ul>
*
* @param fromDateKey 起始日期（含）
* @param days 向前看的天数
* @returns 按开始日升序的条目
*/
function getUpcomingItems(fromDateKey, days = 120) {
	const out = [];
	const emitted = /* @__PURE__ */ new Set();
	let cursor = fromDateKey;
	for (let i = 0; i < days; i += 1) {
		const info = getDayInfo(cursor);
		if (info.isRest && info.fromRemote) {
			const name = info.festivalText;
			let last = i;
			let cursorEnd = cursor;
			while (last + 1 < days) {
				const nxt = getDayInfo(addDateKeyDays(cursorEnd, 1));
				if (!nxt.isRest || !nxt.fromRemote || nxt.festivalText !== name) break;
				last += 1;
				cursorEnd = addDateKeyDays(cursorEnd, 1);
			}
			out.push({
				key: cursor,
				name,
				days: i,
				spanDays: last - i + 1,
				ongoing: false,
				kind: "statutory",
				isRest: true,
				provisional: false,
				level: 1
			});
			cursor = addDateKeyDays(cursorEnd, 1);
			i += last - i;
			continue;
		}
		if (info.period && !emitted.has(info.period)) {
			emitted.add(info.period);
			out.push({
				key: info.period.start,
				name: info.period.name,
				days: diffDays(fromDateKey, info.period.start),
				spanDays: diffDays(info.period.start, info.period.end) + 1,
				ongoing: info.period.start < fromDateKey && info.period.end >= fromDateKey,
				kind: "statutory",
				isRest: true,
				provisional: info.period.provisional,
				level: 1
			});
		}
		if (info.isMakeupWork) out.push({
			key: cursor,
			name: `${info.festivalText || "法定节假日"} 调休上班`,
			days: i,
			spanDays: 1,
			ongoing: false,
			kind: "makeup",
			isRest: false,
			provisional: info.provisional,
			level: 2
		});
		else if (!info.period && !info.fromRemote) {
			const primary = info.festivals.find((f) => f.level <= 2);
			if (primary) out.push({
				key: cursor,
				name: primary.name,
				days: i,
				spanDays: 1,
				ongoing: false,
				kind: primary.kind,
				isRest: info.isRest,
				provisional: false,
				level: primary.level
			});
		}
		cursor = addDateKeyDays(cursor, 1);
	}
	return out;
}
/**
* 清空缓存。
*
* <p>跨零点时调用，否则「今天」的高亮会停在昨天。</p>
*/
function invalidateDayCache() {
	fieldCache.clear();
	dayCache.clear();
}
//#endregion
export { toDateKey as _, getRemoteHolidays as a, getStatutoryPeriods as c, getYearSolarTerms as d, lunarFullText as f, fromDateKey as g, diffDays as h, invalidateDayCache as i, isStatutoryPublished as l, addDateKeyDays as m, getDayInfo as n, setRemoteHolidays as o, WEEKDAY_NAMES as p, getUpcomingItems as r, findNextHoliday as s, festivalDisplayText as t, SOLAR_TERM_NAMES as u };
