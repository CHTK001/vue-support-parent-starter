import ReTime from "D:/ch/project/vue-support-parent-starter/packages/ui/src/components/ReTime/ReTime.vue";
//#region ../../packages/ui/src/components/ReTime/utils.ts
/** 把任意输入归一为毫秒时间戳。失败返回 NaN。 */
function toMs(value) {
	if (value === null || value === void 0 || value === "") return NaN;
	if (value instanceof Date) {
		const ms = value.getTime();
		return Number.isFinite(ms) ? ms : NaN;
	}
	if (typeof value === "number") {
		const ms = value < 0xe8d4a51000 ? value * 1e3 : value;
		return Number.isFinite(ms) ? ms : NaN;
	}
	if (typeof value === "string") {
		if (/^-?\d+(\.\d+)?$/.test(value)) return toMs(Number(value));
		const parsed = Date.parse(value);
		return Number.isFinite(parsed) ? parsed : NaN;
	}
	return NaN;
}
/** 数字前补零 */
function pad(n, len = 2) {
	return String(n).padStart(len, "0");
}
/** 内部支持的 token */
var TOKEN_RE = /\[([^\]]+)\]|YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|SSS/g;
/**
* 按 token 格式化日期对象。
* - YYYY: 4 位年；YY: 2 位年
* - MM/M: 月（补零/不补零）
* - DD/D: 日
* - HH/H: 时（24h）
* - mm/m: 分
* - ss/s: 秒
* - SSS: 毫秒
* - \[...\]: 转义原样输出
*/
function formatByPattern(date, pattern) {
	const Y = date.getFullYear();
	const M = date.getMonth() + 1;
	const D = date.getDate();
	const h = date.getHours();
	const m = date.getMinutes();
	const s = date.getSeconds();
	const ms = date.getMilliseconds();
	return pattern.replace(TOKEN_RE, (_, esc) => {
		if (esc !== void 0) return esc;
		switch (_) {
			case "YYYY": return String(Y);
			case "YY": return String(Y).slice(-2);
			case "MM": return pad(M);
			case "M": return String(M);
			case "DD": return pad(D);
			case "D": return String(D);
			case "HH": return pad(h);
			case "H": return String(h);
			case "mm": return pad(m);
			case "m": return String(m);
			case "ss": return pad(s);
			case "s": return String(s);
			case "SSS": return pad(ms, 3);
			default: return _;
		}
	});
}
/** 主格式化入口 */
function formatValue(value, format) {
	const ms = toMs(value);
	if (!Number.isFinite(ms)) return "";
	if (format === "duration") return formatDuration(value);
	if (format === "ms") return String(Math.round(ms));
	const date = new Date(ms);
	switch (format) {
		case "timestamp": return String(ms);
		case "timestamp-s": return String(Math.floor(ms / 1e3));
		case "iso": return date.toISOString();
		case "YYYY-MM-DD HH:mm:ss":
		case "YYYY-MM-DD":
		case "HH:mm:ss":
		case "HH:mm":
		case "YYYY/MM/DD":
		case "YYYY/MM/DD HH:mm:ss": return formatByPattern(date, format);
		default: return formatByPattern(date, format);
	}
}
/**
* 中文相对时间：返回 "3 分钟前" / "刚刚" / "2 天后" 等。
* @param value 目标时间
* @param base 基准时间（默认 now）
*/
function relativeTime(value, base = Date.now()) {
	const ms = toMs(value);
	if (!Number.isFinite(ms)) return "";
	const diff = ms - base;
	const abs = Math.abs(diff);
	const future = diff > 0;
	if (abs < 45e3) return "刚刚";
	if (abs < 6e4) return future ? "即将" : "刚刚";
	for (const u of [
		{
			ms: 31536e6,
			single: "年",
			many: "年"
		},
		{
			ms: 2592e6,
			single: "个月",
			many: "个月"
		},
		{
			ms: 6048e5,
			single: "周",
			many: "周"
		},
		{
			ms: 864e5,
			single: "天",
			many: "天"
		},
		{
			ms: 36e5,
			single: "小时",
			many: "小时"
		},
		{
			ms: 6e4,
			single: "分钟",
			many: "分钟"
		},
		{
			ms: 1e3,
			single: "秒",
			many: "秒"
		}
	]) if (abs >= u.ms) {
		const label = `${Math.floor(abs / u.ms)} ${u.many}`;
		return future ? `${label}后` : `${label}前`;
	}
	return "";
}
/**
* 自动最佳粒度显示时长（毫秒输入）：
*   800  -> "800 毫秒"
*   30000 -> "30 秒"
*   90000 -> "1.5 分钟"
*/
function formatDuration(value) {
	const raw = typeof value === "number" ? value : toMs(value);
	if (!Number.isFinite(raw)) return "";
	const ms = Math.max(0, raw);
	if (ms < 1e3) return `${Math.floor(ms)} 毫秒`;
	const s = ms / 1e3;
	if (s < 60) return `${trimNumber(s)} 秒`;
	const m = s / 60;
	if (m < 60) return `${trimNumber(m)} 分钟`;
	const h = m / 60;
	if (h < 24) return `${trimNumber(h)} 小时`;
	const d = h / 24;
	if (d < 30) return `${trimNumber(d)} 天`;
	return `${trimNumber(d / 30)} 个月`;
}
function trimNumber(n) {
	const rounded = Math.round(n * 100) / 100;
	return String(rounded);
}
//#endregion
//#region ../../packages/ui/src/components/ReTime/index.ts
var plugin = { install(app) {
	app.component("ReTime", ReTime);
} };
var ReTime_default = ReTime;
//#endregion
export { ReTime_default as default, formatDuration, formatValue, plugin as install, relativeTime, toMs };
