/**
 * 获取最近几天的日期
 * @param dayNum {number} 要获取的天数
 * @returns {string[]} 包含最近几天日期的数组，日期格式为 'yyyy-MM-dd'
 */
export const getRecentDays = (dayNum: number): string[] => {
  const oneDayMs = 24 * 60 * 60 * 1000; // 一天的毫秒数
  const result: string[] = [];
  for (let i = dayNum - 1; i >= 0; i--) {
    const currentDate = new Date(Date.now() - i * oneDayMs);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    result.push(formattedDate);
  }
  return result;
};

/**
 * 获得本周周一~周日的年月日
 * @returns {{start_day: string, end_day: string}} 包含本周周一和周日日期的对象，日期格式为 'yyyy-MM-dd'
 */
export const getThisWeekData = (): { start_day: string; end_day: string } => {
  const thisWeek = {
    start_day: "",
    end_day: "",
  };
  const date = new Date();
  // 计算本周一的日期
  date.setDate(date.getDate() - date.getDay() + 1);
  thisWeek.start_day = formatDate(date);

  // 计算本周日的日期
  date.setDate(date.getDate() + 6);
  thisWeek.end_day = formatDate(date);
  return thisWeek;
};

/**
 * 获得上周周一~周日的年月日
 * @returns {{start_day: string, end_day: string}} 包含上周周一和周日日期的对象，日期格式为 'yyyy-MM-dd'
 */
export const getLastWeekData = (): { start_day: string; end_day: string } => {
  const lastWeek = {
    start_day: "",
    end_day: "",
  };
  const date = new Date();
  // 计算上周一的日期
  date.setDate(date.getDate() - 7 - date.getDay() + 1);
  lastWeek.start_day = formatDate(date);

  // 计算上周日的日期
  date.setDate(date.getDate() + 6);
  lastWeek.end_day = formatDate(date);
  return lastWeek;
};

/**
 * 格式化日期为 'yyyy-MM-dd' 格式
 * @param date {Date} 要格式化的日期对象
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * 获取日期范围
 * @param val {string} 日期范围的标识，如 'today', 'yesterday' 等
 * @param fmt {string} 日期格式化字符串，默认为 'yyyy-MM-dd hh:mm:ss'
 * @returns {string[]} 包含开始日期和结束日期的数组，日期格式由 fmt 参数指定
 */
export const getDateRang = (val: string, fmt: string = "yyyy-MM-dd hh:mm:ss"): string[] => {
  const now = new Date();
  const nowDayOfWeek = now.getDay();
  const nowDay = now.getDate();
  const nowMonth = now.getMonth();
  const nowYear = now.getFullYear();
  const quarter = Math.ceil((nowMonth + 1) / 3);
  let startTime: Date;
  let endTime: Date;
  let customTime: string[] = [];

  switch (val) {
    case "today":
      startTime = new Date(nowYear, nowMonth, nowDay, 0, 0, 0);
      endTime = new Date(nowYear, nowMonth, nowDay, 23, 59, 59);
      break;
    case "yesterday":
      startTime = new Date(nowYear, nowMonth, nowDay - 1);
      endTime = new Date(nowYear, nowMonth, nowDay - 1);
      break;
    case "week":
      startTime = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
      endTime = new Date(nowYear, nowMonth, nowDay + 6 - nowDayOfWeek);
      break;
    case "pastWeek":
      startTime = new Date(nowYear, nowMonth, nowDay - 6);
      endTime = new Date(nowYear, nowMonth, nowDay);
      break;
    case "month":
      startTime = new Date(nowYear, nowMonth, 1);
      endTime = new Date(nowYear, nowMonth + 1, 0);
      break;
    case "pastMonth":
      startTime = new Date(nowYear, nowMonth, nowDay - 30);
      endTime = new Date(nowYear, nowMonth, nowDay);
      break;
    case "quarter":
      startTime = new Date(nowYear, (quarter - 1) * 3, 1);
      endTime = new Date(nowYear, quarter * 3, 0);
      break;
    case "year":
      startTime = new Date(nowYear, 0, 1);
      endTime = new Date(nowYear, 11, 31);
      break;
    default:
      customTime = val.split(" - ");
      break;
  }
  return customTime.length ? customTime : [dateFormat(startTime, fmt), dateFormat(endTime, fmt)];
};

/**
 * 日期格式化
 * @param date {Date | string | number} 要格式化的日期，可以是 Date 对象、日期字符串或时间戳
 * @param fmt {string} 日期格式化字符串，默认为 'yyyy-MM-dd hh:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export const dateFormat = (date: Date | string | number, fmt: string = "yyyy-MM-dd hh:mm:ss"): string => {
  date = new Date(date);
  const o: { [key: string]: number } = {
    "M+": date.getMonth() + 1, // 月份
    "d+": date.getDate(), // 日
    "h+": date.getHours(), // 小时
    "m+": date.getMinutes(), // 分
    "s+": date.getSeconds(), // 秒
    "q+": Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k].toString() : ("00" + o[k]).substr(("" + o[k]).length));
    }
  }
  return fmt;
};

/**
 * 判断时间是否过期
 * @param expirationTime {Date | string | number} 过期时间，可以是 Date 对象、时间字符串或时间戳（毫秒）
 * @returns {boolean} 如果当前时间超过过期时间，则返回 true，否则返回 false
 */
export const isTimeExpired = (expirationTime: Date | string | number): boolean => {
  const now = Date.now();
  let expirationTimestamp: number;

  if (expirationTime instanceof Date) {
    expirationTimestamp = expirationTime.getTime();
  } else if (typeof expirationTime === "string") {
    const parsedDate = new Date(expirationTime);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("无效的时间字符串格式");
    }
    expirationTimestamp = parsedDate.getTime();
  } else if (typeof expirationTime === "number") {
    expirationTimestamp = expirationTime;
  } else {
    throw new TypeError("expirationTime 必须是 Date 对象、时间字符串或时间戳（毫秒）");
  }

  return now > expirationTimestamp;
};

/**
 * 将传入的日期转换为几天前，几小时前，几分钟前，几周前，几个月前的格式
 * @param date {Date | string} 要转换的日期，可以是 Date 对象或日期字符串
 * @returns {string} 转换后的时间描述
 */
export const getTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const targetDate = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = now.getMonth() - targetDate.getMonth() + (now.getFullYear() - targetDate.getFullYear()) * 12;
  const diffYear = now.getFullYear() - targetDate.getFullYear();

  if (diffSec < 60) {
    return `${diffSec} 秒前`;
  } else if (diffMin < 60) {
    return `${diffMin} 分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour} 小时前`;
  } else if (diffDay < 7) {
    return `${diffDay} 天前`;
  } else if (diffWeek < 4) {
    return `${diffWeek} 周前`;
  } else if (diffMonth < 12) {
    return `${diffMonth} 个月前`;
  } else {
    return `${diffYear} 年前`;
  }
};
