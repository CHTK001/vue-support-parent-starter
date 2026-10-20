import { g as computed, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { Cn as resolveGeoLocation, Sn as getWeatherOverview, ot as getAppStorage } from "./src-CEonioA3.js";
//#region ../../packages/theme/src/composables/useWeather.ts
/**
* 顶栏 / 首页天气组件数据源（@repo/theme）
*
* 只做"契约结构 → 组件展示字段"的映射，不关心数据来自后台还是三方：
* 链路选择（HEAD 探测后台 → 后台优先 → 三方归一化）由 @repo/core 的
* getWeatherOverview / resolveGeoLocation 收口，UI 消费的是同一套字段。
*
* 缓存策略保持不变：实况 + 预报 1 小时，定位 24 小时。
*/
var CACHE_KEY = "weather-cache";
var LOCATION_KEY = "weather-location";
var CACHE_TTL = 36e5;
var LOCATION_TTL = 864e5;
/** 逐日预报天数 */
var FORECAST_DAYS = 7;
/** 逐小时点数 */
var FORECAST_HOURS = 24;
/** WMO 天气代码 → 中文描述（后台与三方共用同一套代码，UI 侧只需一份表） */
var WMO_DESC = {
	0: "晴",
	1: "大部晴朗",
	2: "局部多云",
	3: "阴",
	45: "雾",
	48: "冻雾",
	51: "小毛毛雨",
	53: "毛毛雨",
	55: "浓毛毛雨",
	61: "小雨",
	63: "中雨",
	65: "大雨",
	71: "小雪",
	73: "中雪",
	75: "大雪",
	80: "阵雨",
	81: "强阵雨",
	82: "暴雨",
	95: "雷暴"
};
var dayForecast = ref([]);
var nightForecast = ref([]);
var hourForecast = ref([]);
var sourcePublishTime = ref("");
var weatherCode = ref(null);
var temp = ref(null);
var feelsLike = ref(null);
var humidity = ref(null);
var windSpeed = ref(null);
var windDir = ref("");
var location = ref("本地");
var updatedAt = ref("");
/** 本次数据来源：backend / open-meteo-direct 等，用于确认链路是否按预期降级 */
var source = ref("");
var forecast = ref([]);
var hourlyForecast = ref([]);
var loading = ref(false);
var error = ref("");
var hasWeather = computed(() => temp.value != null);
/** WMO 天气代码 → 中文描述（实况 / 逐小时 / 逐日图标悬浮提示共用同一份表） */
function wmoToDesc(wmo) {
	return wmo != null ? WMO_DESC[wmo] ?? "天气" : "天气";
}
var weatherDesc = computed(() => wmoToDesc(weatherCode.value));
function wmoToFluentIcon(wmo) {
	if (wmo == null) return "fluent:weather-sunny-24-regular";
	if (wmo === 0) return "fluent:weather-sunny-24-regular";
	if (wmo <= 2) return "fluent:weather-partly-cloudy-day-24-regular";
	if (wmo <= 3) return "fluent:weather-cloudy-24-regular";
	if (wmo <= 48) return "fluent:weather-haze-24-regular";
	if (wmo <= 55) return "fluent:weather-drizzle-24-regular";
	if (wmo <= 57) return "fluent:weather-rain-24-regular";
	if (wmo <= 62) return "fluent:weather-rain-24-regular";
	if (wmo <= 64) return "fluent:weather-rain-24-regular";
	if (wmo <= 67) return "fluent:weather-rain-24-regular";
	if (wmo <= 72) return "fluent:weather-snow-24-regular";
	if (wmo <= 74) return "fluent:weather-snow-24-regular";
	if (wmo <= 77) return "fluent:weather-snow-24-regular";
	if (wmo <= 82) return "fluent:weather-rain-showers-day-24-regular";
	if (wmo <= 86) return "fluent:weather-snow-showers-day-24-regular";
	if (wmo <= 99) return "fluent:weather-thunderstorm-24-regular";
	return "fluent:weather-sunny-24-regular";
}
function windDegToDir(deg) {
	if (deg == null) return "无持续风向";
	return [
		"北",
		"东北",
		"东",
		"东南",
		"南",
		"西南",
		"西",
		"西北"
	][Math.round(deg / 45) % 8] + "风";
}
function formatTime12(isoStr) {
	if (!isoStr) return "--:--";
	try {
		const [hh, mm] = (isoStr.split("T")[1] ?? isoStr).split(":");
		return `${hh}:${mm}`;
	} catch {
		return "--:--";
	}
}
/** 契约里的时刻字段可能是 HH:mm 或完整 ISO，统一成 HH:mm */
function clockText(value) {
	if (!value) return "--:--";
	return formatTime12(value.includes("T") ? value : value.slice(0, 5));
}
function readCache(key, ttl) {
	try {
		const raw = getAppStorage().get(key);
		if (!raw) return null;
		const data = typeof raw === "string" ? JSON.parse(raw) : raw;
		if (Date.now() - data.timestamp > ttl) return null;
		return data;
	} catch {
		return null;
	}
}
function writeCache(key, payload) {
	try {
		getAppStorage().set(key, {
			...payload,
			timestamp: Date.now()
		});
	} catch {}
}
/** 本会话内已解析的定位，避免每次刷新都重新走定位链路 */
var cachedLocation = null;
/**
* 解析展示定位。
*
* 实际链路（后台定位接口 → 浏览器定位 → IP 定位 → app.yaml 配置）由 @repo/core
* 收口，这里只叠加 24 小时本地缓存。
*/
async function resolveLocation() {
	if (cachedLocation) return cachedLocation;
	const cached = readCache(LOCATION_KEY, LOCATION_TTL);
	if (cached?.latitude && cached?.longitude) {
		cachedLocation = {
			...cached,
			city: cached.city || "本地"
		};
		return cachedLocation;
	}
	const geo = await resolveGeoLocation();
	writeCache(LOCATION_KEY, { ...geo });
	cachedLocation = geo;
	return geo;
}
function markHourlyNow(nowMs) {
	const list = hourlyForecast.value;
	if (!list.length) return;
	const d = new Date(nowMs);
	const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	let changed = false;
	list.forEach((item) => {
		const diffMin = (nowMs - (/* @__PURE__ */ new Date(`${dateStr}T${item.hour}:00`)).getTime()) / 6e4;
		const nextPast = diffMin > 60;
		const nextNow = diffMin >= 0 && diffMin <= 60;
		if (item.isPast !== nextPast || item.isNow !== nextNow) {
			item.isPast = nextPast;
			item.isNow = nextNow;
			changed = true;
		}
	});
	if (changed) hourlyForecast.value = [...list];
}
/** 契约逐日预报 → 组件字段 */
function toForecastDays(daily) {
	const dayNames = [
		"周日",
		"周一",
		"周二",
		"周三",
		"周四",
		"周五",
		"周六"
	];
	return daily.map((item) => {
		const d = /* @__PURE__ */ new Date(`${item.date}T00:00:00`);
		return {
			day: dayNames[d.getDay()] ?? "",
			date: item.date.slice(5),
			weatherCode: item.weatherCode,
			tempMax: Math.round(item.tempMax),
			tempMin: Math.round(item.tempMin),
			feelsMax: Math.round(item.feelsMax ?? item.tempMax),
			feelsMin: Math.round(item.feelsMin ?? item.tempMin),
			precip: item.precipitation ?? 0,
			precipProb: item.precipitationProbability ?? 0,
			wind: Math.round(item.windSpeed ?? 0),
			windDir: windDegToDir(item.windDirection),
			uv: item.uvIndex ?? 0,
			sunrise: clockText(item.sunrise),
			sunset: clockText(item.sunset)
		};
	});
}
/** 契约逐小时预报 → 组件字段（hour 取 HH:00，供当天横向滚动条使用） */
function toHourlyPoints(hourly) {
	return hourly.map((item) => ({
		hour: `${item.time.slice(11, 13)}:00`,
		temp: Math.round(item.temperature),
		feelsLike: Math.round(item.feelsLike ?? item.temperature),
		humidity: Math.round(item.humidity ?? 0),
		wind: Math.round(item.windSpeed ?? 0),
		windDir: windDegToDir(item.windDirection),
		precip: item.precipitation ?? 0,
		weatherCode: item.weatherCode ?? 0,
		isPast: false,
		isNow: false
	}));
}
/** 观测时间 → "MM-dd HH:mm" 展示串 */
function formatPublishTime(observedAt) {
	const d = observedAt ? new Date(observedAt) : /* @__PURE__ */ new Date();
	if (Number.isNaN(d.getTime())) return "";
	return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ` + d.toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit"
	});
}
/** 契约结构 → 组件全部展示字段（缓存命中与实时拉取共用同一条赋值链路） */
function applyOverview(overview) {
	location.value = overview.location || "本地";
	temp.value = Math.round(overview.temperature);
	feelsLike.value = Math.round(overview.feelsLike ?? overview.temperature);
	humidity.value = Math.round(overview.humidity ?? 0);
	windSpeed.value = Math.round(overview.windSpeed ?? 0);
	windDir.value = windDegToDir(overview.windDirection);
	weatherCode.value = overview.weatherCode ?? 0;
	updatedAt.value = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", {
		hour: "2-digit",
		minute: "2-digit"
	});
	sourcePublishTime.value = formatPublishTime(overview.observedAt);
	source.value = overview.source ?? "";
	forecast.value = toForecastDays(overview.daily ?? []);
	hourlyForecast.value = toHourlyPoints(overview.hourly ?? []);
	buildDerivedForecasts(forecast.value, hourlyForecast.value);
	markHourlyNow(Date.now());
}
async function fetchWeather() {
	const cached = readCache(CACHE_KEY, CACHE_TTL);
	if (cached?.overview) {
		applyOverview(cached.overview);
		return;
	}
	loading.value = true;
	try {
		const loc = await resolveLocation();
		location.value = loc.city;
		const overview = await getWeatherOverview({
			latitude: loc.latitude,
			longitude: loc.longitude,
			city: loc.city,
			days: FORECAST_DAYS,
			hours: FORECAST_HOURS
		});
		const merged = {
			...overview,
			location: overview.location || loc.city || "本地"
		};
		writeCache(CACHE_KEY, { overview: merged });
		applyOverview(merged);
	} catch (e) {
		error.value = e instanceof Error ? e.message : String(e);
	} finally {
		loading.value = false;
	}
}
function buildDerivedForecasts(daily, hourly) {
	const d = WMO_DESC;
	dayForecast.value = daily.map((f) => ({
		dateText: f.date,
		weatherCode: f.weatherCode,
		weatherDesc: d[f.weatherCode] ?? "天气",
		tempMax: f.tempMax,
		tempMin: f.tempMin,
		windDir: f.windDir,
		precipProb: f.precipProb
	}));
	nightForecast.value = daily.map((f) => ({
		dateText: f.date,
		weatherCode: f.weatherCode,
		weatherDesc: d[f.weatherCode] ?? "天气",
		tempMax: f.tempMax,
		tempMin: f.tempMin,
		windDir: f.windDir,
		precipProb: f.precipProb
	}));
	const nowHour = (/* @__PURE__ */ new Date()).getHours();
	hourForecast.value = hourly.map((h) => {
		const hourNum = parseInt(h.hour, 10);
		return {
			time: h.hour,
			weatherCode: h.weatherCode,
			temp: h.temp,
			windDir: h.windDir,
			isNow: hourNum === nowHour,
			isPast: hourNum < nowHour
		};
	});
}
function useWeather() {
	return {
		weatherCode,
		temp,
		feelsLike,
		humidity,
		windSpeed,
		windDir,
		location,
		updatedAt,
		source,
		sourcePublishTime,
		forecast,
		hourlyForecast,
		dayForecast,
		nightForecast,
		hourForecast,
		loading,
		error,
		hasWeather,
		weatherDesc,
		fetchWeather,
		resolveLocation,
		markHourlyNow,
		wmoToFluentIcon,
		windDegToDir,
		formatTime12
	};
}
//#endregion
export { wmoToDesc as n, useWeather as t };
