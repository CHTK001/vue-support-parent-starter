//#region ../../packages/utils/src/trigger/CronExpression.ts
/**
* Cron 表达式解析引擎
*
* 本文件是服务端 `com.chua.common.support.task.scheduler.CronExpression` 的逐行镜像，
* 判定与触发时刻必须与服务端一致（ReCron 的合法性提示与预览时间依赖此处）。
*
* 支持的表达式语法：
*  - `*` —— 所有值
*  - `?` —— 不指定值（仅用于日和周字段）
*  - `-` —— 范围（如 1-5）
*  - `,` —— 列表（如 MON,WED,FRI）
*  - `/` —— 步进（如 `*&#47;5`）
*  - `L` —— 最后一天或最后一个工作日
*  - `W` —— 最近的工作日
*  - `#` —— 第 N 个星期几（如 3#2 表示第二个星期二）
*/
/** 位图容量：与 BitSet 一样允许越界置位（如周字段写 8），置位后永不匹配即判非法 */
var BITS_CAPACITY = 64;
/** 计算下一次执行时间的最大回溯年数，超过即认定表达式永不匹配 */
var MAX_LOOKAHEAD_YEARS = 5;
/** 单次推进最少 1 秒，5 年回溯的步数上界兜底，防止表达式病态时拖住 UI 线程 */
var MAX_ITERATIONS = 4e5;
var CronExpression = class {
	/** 秒字段位图（0-59） */
	seconds = new Array(BITS_CAPACITY).fill(false);
	/** 分钟字段位图（0-59） */
	minutes = new Array(BITS_CAPACITY).fill(false);
	/** 小时字段位图（0-23） */
	hours = new Array(BITS_CAPACITY).fill(false);
	/** 日期字段位图（1-31） */
	daysOfMonth = new Array(BITS_CAPACITY).fill(false);
	/** 月份字段位图（1-12） */
	months = new Array(BITS_CAPACITY).fill(false);
	/** 星期字段位图（0-7，0 和 7 均表示周日） */
	daysOfWeek = new Array(BITS_CAPACITY).fill(false);
	/** 是否使用月末标记（L） */
	lastDayOfMonth = false;
	/** 是否使用最后一个工作日标记（L，星期字段） */
	lastDayOfWeek = false;
	/** 最近的工作日（W 修饰符） */
	nearestWeekday = null;
	/** 第几个星期（5#3 表示当月第 3 个星期五，# 后是序号，# 前按 0=周日 编号表示星期） */
	nthDayOfWeek = null;
	/** 星期字段写成 `dL` 时的星期编号（0=周日），表示当月最后一个星期 d */
	lastWeekdayOfMonth = null;
	/**
	* 构造一个 Cron 表达式解析器
	*
	* @param expression 6 字段 Cron 表达式
	* @throws Error 如果表达式格式不正确、字段数不为 6 或含无法解析的数值
	*/
	constructor(expression) {
		const fields = expression.trim().split(/\s+/);
		if (fields.length !== 6) throw new Error("Cron expression must have 6 fields (second minute hour day-of-month month day-of-week)");
		this.parseSeconds(fields[0]);
		this.parseMinutes(fields[1]);
		this.parseHours(fields[2]);
		this.parseDaysOfMonth(fields[3]);
		this.parseMonths(fields[4]);
		this.parseDaysOfWeek(fields[5]);
	}
	/** 解析秒字段（0-59） */
	parseSeconds(field) {
		this.parseField(field, 0, 59, this.seconds);
	}
	/** 解析分钟字段（0-59） */
	parseMinutes(field) {
		this.parseField(field, 0, 59, this.minutes);
	}
	/** 解析小时字段（0-23） */
	parseHours(field) {
		this.parseField(field, 0, 23, this.hours);
	}
	/** 解析月份字段（1-12），支持 JAN-DEC 英文缩写 */
	parseMonths(field) {
		const resolved = this.resolveNames(field, "JAN,FEB,MAR,APR,MAY,JUN,JUL,AUG,SEP,OCT,NOV,DEC");
		this.parseField(resolved, 1, 12, this.months);
	}
	/** 解析日期字段（1-31），支持 L、W 修饰符 */
	parseDaysOfMonth(field) {
		if (field === "?") return;
		if (field === "L") {
			this.lastDayOfMonth = true;
			return;
		}
		if (field.startsWith("LW")) {
			this.lastDayOfMonth = true;
			return;
		}
		if (field.endsWith("W") && field.length > 1) {
			this.nearestWeekday = this.parseInt(field.substring(0, field.length - 1));
			return;
		}
		this.parseField(field, 1, 31, this.daysOfMonth);
	}
	/** 解析星期字段（0-7），支持 L、dL、# 修饰符和 SUN-SAT 英文缩写 */
	parseDaysOfWeek(field) {
		if (field === "?") return;
		const resolved = this.resolveWeekdayNames(field).replace(/7/g, "0");
		if (resolved === "L") {
			this.lastDayOfWeek = true;
			return;
		}
		if (resolved.endsWith("L") && resolved.length > 1) {
			const weekday = this.parseInt(resolved.substring(0, resolved.length - 1));
			this.lastDayOfWeek = true;
			this.lastWeekdayOfMonth = weekday;
			this.daysOfWeek[weekday] = true;
			return;
		}
		if (resolved.includes("#")) {
			const parts = resolved.split("#");
			this.nthDayOfWeek = this.parseInt(parts[1]);
			this.daysOfWeek[this.parseInt(parts[0]) % 7] = true;
			return;
		}
		this.parseField(resolved, 0, 7, this.daysOfWeek);
		if (this.daysOfWeek[7]) this.daysOfWeek[0] = true;
	}
	/**
	* 将英文星期名解析为标准 cron 数字（SUN=0、MON=1 … SAT=6）
	*
	* 不复用 resolveNames：该方法按数组下标从 1 开始编号，用于星期字段会让 MON-FRI 整体偏移一天。
	*
	* @param field 原始字段值
	* @returns 名称替换为数字后的字段值
	*/
	resolveWeekdayNames(field) {
		const names = [
			"SUN",
			"MON",
			"TUE",
			"WED",
			"THU",
			"FRI",
			"SAT"
		];
		let result = field.toUpperCase();
		for (let i = 0; i < names.length; i++) result = result.replace(names[i], String(i));
		return result;
	}
	/**
	* 将英文名称解析为数字
	*
	* @param field 原始字段值
	* @param names 逗号分隔的名称列表
	* @returns 将名称替换为数字后的字段值
	*/
	resolveNames(field, names) {
		const nameArr = names.split(",");
		let result = field.toUpperCase();
		for (let i = 0; i < nameArr.length; i++) result = result.replace(nameArr[i], String(i + 1));
		return result;
	}
	/** 解析标准字段（支持 *、逗号列表） */
	parseField(field, min, max, bits) {
		if (field === "*") {
			for (let i = min; i <= max; i++) bits[i] = true;
			return;
		}
		for (const part of field.split(",")) this.parseFieldPart(part, min, max, bits);
	}
	/** 解析字段中的单个部分（支持范围 - 和步进 /） */
	parseFieldPart(part, min, max, bits) {
		let step = 1;
		const slash = part.indexOf("/");
		if (slash !== -1) {
			step = this.parseInt(part.substring(slash + 1));
			part = part.substring(0, slash);
		}
		let rangeMin;
		let rangeMax;
		const dash = part.indexOf("-");
		if (part === "*") {
			rangeMin = min;
			rangeMax = max;
		} else if (dash !== -1) {
			rangeMin = this.parseInt(part.substring(0, dash));
			rangeMax = this.parseInt(part.substring(dash + 1));
		} else {
			rangeMin = this.parseInt(part);
			rangeMax = rangeMin;
		}
		if (slash !== -1 && rangeMax === rangeMin) rangeMax = max;
		for (let i = rangeMin; i <= rangeMax; i += step) if (i >= 0 && i < BITS_CAPACITY) bits[i] = true;
	}
	/** 解析整数字段，非法字符与 Java Integer.parseInt 一样报错 */
	parseInt(text) {
		const value = Number(text.trim());
		if (!Number.isInteger(value)) throw new Error(`For input string: "${text}"`);
		return value;
	}
	/** 判断位图是否为空 */
	isEmpty(bits) {
		return bits.every((v) => !v);
	}
	/**
	* 计算从指定时间之后的下一个匹配时间点
	*
	* 按照年-月-日-时-分-秒的层级逐级递增匹配：
	*  1. 先匹配月份，不匹配则跳到下个月第一天
	*  2. 再匹配日期和星期，日期与星期各自独立约束，写 `?` 的一侧不参与判定
	*  3. 然后匹配小时、分钟、秒
	*
	* @param from 基准时间
	* @returns 下一个匹配的 Cron 时间点，表达式永不匹配时为 null
	*/
	nextExecutionTime(from) {
		const candidate = new Date(from);
		candidate.setMilliseconds(0);
		candidate.setSeconds(candidate.getSeconds() + 1);
		const deadline = new Date(from);
		deadline.setFullYear(deadline.getFullYear() + MAX_LOOKAHEAD_YEARS);
		let guard = 0;
		while (guard++ < MAX_ITERATIONS) {
			if (candidate > deadline) return null;
			const y = candidate.getFullYear();
			const m = candidate.getMonth() + 1;
			if (!this.months[m]) {
				candidate.setFullYear(y, m, 1);
				candidate.setHours(0, 0, 0, 0);
				continue;
			}
			const dom = candidate.getDate();
			const dow = candidate.getDay();
			let domMatch = this.daysOfMonth[dom] || this.lastDayOfMonth && dom === this.lengthOfMonth(y, m);
			let dowMatch = this.daysOfWeek[dow] || this.lastDayOfWeek && this.isLastWeekDay(candidate);
			if (this.nthDayOfWeek !== null) dowMatch = this.isNthDayOfWeek(candidate);
			if (this.lastWeekdayOfMonth !== null) dowMatch = dow === this.lastWeekdayOfMonth && dom + 7 > this.lengthOfMonth(y, m);
			if (this.nearestWeekday !== null) domMatch = this.isNearestWeekday(y, m, candidate);
			if (this.isEmpty(this.daysOfMonth) && !this.lastDayOfMonth && this.nearestWeekday === null) domMatch = true;
			if (this.isEmpty(this.daysOfWeek) && !this.lastDayOfWeek && this.nthDayOfWeek === null) dowMatch = true;
			if (!domMatch || !dowMatch) {
				candidate.setDate(dom + 1);
				candidate.setHours(0, 0, 0, 0);
				continue;
			}
			const h = candidate.getHours();
			if (!this.hours[h]) {
				candidate.setHours(h + 1, 0, 0, 0);
				continue;
			}
			const min = candidate.getMinutes();
			if (!this.minutes[min]) {
				candidate.setMinutes(min + 1, 0, 0);
				continue;
			}
			const sec = candidate.getSeconds();
			if (!this.seconds[sec]) {
				candidate.setSeconds(sec + 1, 0);
				continue;
			}
			return new Date(candidate);
		}
		return null;
	}
	/**
	* 从指定时间开始获取 N 个执行时间点
	*
	* @param count 需要获取的数量
	* @param from  基准时间
	* @returns 执行时间点列表
	*/
	getFireTimes(count, from) {
		const result = [];
		let current = new Date(from);
		for (let i = 0; i < count; i++) {
			const next = this.nextExecutionTime(current);
			if (next === null) break;
			result.push(next);
			current = new Date(next);
			current.setSeconds(current.getSeconds() + 1);
		}
		return result;
	}
	/** 获取指定月份的天数 */
	lengthOfMonth(year, month) {
		return new Date(year, month, 0).getDate();
	}
	/** 判断是否为该月最后一个工作日（周五为最后一个工作日时，周六日往后顺延） */
	isLastWeekDay(dt) {
		const year = dt.getFullYear();
		const month = dt.getMonth() + 1;
		const lastDay = this.lengthOfMonth(year, month);
		return dt.getDate() === lastDay || dt.getDay() === new Date(year, month - 1, lastDay).getDay();
	}
	/** 判断是否为第 N 个星期几 */
	isNthDayOfWeek(dt) {
		const weekOfMonth = Math.floor((dt.getDate() - 1) / 7) + 1;
		const dow = dt.getDay();
		return this.daysOfWeek[dow] && weekOfMonth === this.nthDayOfWeek;
	}
	/**
	* 判断是否为最近的工作日（W 修饰符）
	*
	* 如果指定日期是周六，则返回周五；如果是周日，则返回周一；如果调整后跨月，则向前取最近的工作日。
	*/
	isNearestWeekday(year, month, dt) {
		const nearest = this.nearestWeekday;
		const target = new Date(year, month - 1, nearest);
		let adjusted = new Date(target);
		const day = target.getDay();
		if (day === 6) adjusted = new Date(year, month - 1, nearest - 1);
		else if (day === 0) adjusted = new Date(year, month - 1, nearest + 1);
		if (adjusted.getMonth() + 1 !== month) adjusted = new Date(year, month - 1, nearest - 1);
		return dt.getFullYear() === adjusted.getFullYear() && dt.getMonth() === adjusted.getMonth() && dt.getDate() === adjusted.getDate();
	}
};
//#endregion
export { CronExpression as t };
