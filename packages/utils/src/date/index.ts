/**
 * 获取最近几天的日期
 */
export const getRecentDays = (dayNum: number) => {
  const oneDay = 24 * 60 * 60 * 1000; // 这里定义一天的毫秒数
  const resultArray = [];
  for (let i = dayNum - 1; i >= 0; i--) {
    const currentDate = new Date(Date.now() - i * oneDay); // 计算出每天的日期
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // 月份需要补零
    const day = String(currentDate.getDate()).padStart(2, "0"); // 日期也需要补零
    const formattedDate = `${year}-${month}-${day}`; // 格式化日期为 yyyy-mm-dd 的形式
    resultArray.push(formattedDate);
  }
  return resultArray;
};

//获得本周周一~周日的年月日
export const getThisWeekData = () => {
  const thisweek = {
    start_day: "",
    end_day: "",
  };
  var date = new Date();
  // 本周一的日期
  date.setDate(date.getDate() - date.getDay() + 1);
  thisweek.start_day = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

  // 本周日的日期
  date.setDate(date.getDate() + 6);
  thisweek.end_day = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  return thisweek;
};
//获得上周周一~周日的年月日
export const getLastWeekData = () => {
  const lastweek = {
    start_day: "",
    end_day: "",
  };
  var date = new Date();
  // 上周一的日期
  date.setDate(date.getDate() - 7 - date.getDay() + 1);
  lastweek.start_day = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

  // 上周日的日期
  date.setDate(date.getDate() + 6);
  lastweek.end_day = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
  return lastweek;
};
/**
 * 获取日期范围
 */
export const getDateRang: any = (val: any, fmt: string = "yyyy-MM-dd hh:mm:ss") => {
  const now = new Date(); // 当前日期
  const nowDayOfWeek = now.getDay(); // 今天本周的第几天
  const nowDay = now.getDate(); // 当前日
  const nowMonth = now.getMonth(); // 当前月
  const nowYear = now.getFullYear(); // 当前年
  const jd = Math.ceil((nowMonth + 1) / 3);
  let startTime;
  let endTime;
  let customTime = [];
  switch (val) {
    case "today": // 今天
      startTime = new Date(nowYear, nowMonth, nowDay, 0, 0, 0);
      endTime = new Date(nowYear, nowMonth, nowDay, 23, 59, 59);
      break;
    case "yesterday": // 昨日
      startTime = new Date(nowYear, nowMonth, nowDay - 1);
      endTime = new Date(nowYear, nowMonth, nowDay - 1);
      break;
    case "week": // 本周
      startTime = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
      endTime = new Date(nowYear, nowMonth, nowDay + 6 - nowDayOfWeek);
      break;
    case "pastWeek": // 近 7 日
      startTime = new Date(nowYear, nowMonth, nowDay - 6);
      endTime = new Date(nowYear, nowMonth, nowDay);
      break;
    case "month": // 本月
      startTime = new Date(nowYear, nowMonth, 1);
      endTime = new Date(nowYear, nowMonth + 1, 0);
      break;
    case "pastMonth": // 近 31 日
      startTime = new Date(nowYear, nowMonth, nowDay - 30);
      endTime = new Date(nowYear, nowMonth, nowDay);
      break;
    case "quarter": // 本季度
      startTime = new Date(nowYear, (jd - 1) * 3, 1);
      endTime = new Date(nowYear, jd * 3, 0);
      break;
    case "year": // 今年
      startTime = new Date(nowYear, 0, 1);
      endTime = new Date(nowYear, 11, 31);
      break;
    default: // 自定义时间
      customTime = val.split(" - ");
      break;
  }
  return customTime.length ? customTime : [dateFormat(startTime, fmt), dateFormat(endTime, fmt)];
};
/**
 * 日期格式化
 */
export const dateFormat = (date, fmt = "yyyy-MM-dd hh:mm:ss") => {
  date = new Date(date);
  var o = {
    "M+": date.getMonth() + 1, //月份
    "d+": date.getDate(), //日
    "h+": date.getHours(), //小时
    "m+": date.getMinutes(), //分
    "s+": date.getSeconds(), //秒
    "q+": Math.floor((date.getMonth() + 3) / 3), //季度
    S: date.getMilliseconds(), //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
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
  const now = Date.now(); // 获取当前时间的时间戳（UTC）

  // 将传入的 expirationTime 转换为时间戳（UTC）
  let expirationTimestamp: number;

  if (expirationTime instanceof Date) {
    // 如果传入的是 Date 对象，直接获取其 UTC 时间戳
    expirationTimestamp = expirationTime.getTime();
  } else if (typeof expirationTime === "string") {
    // 如果传入的是时间字符串，尝试将其转换为 UTC 时间戳
    const parsedDate = new Date(expirationTime);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("无效的时间字符串格式");
    }
    expirationTimestamp = parsedDate.getTime();
  } else if (typeof expirationTime === "number") {
    // 如果传入的是时间戳（毫秒），直接使用
    expirationTimestamp = expirationTime;
  } else {
    // 如果传入的类型不正确，抛出错误
    throw new TypeError("expirationTime 必须是 Date 对象、时间字符串或时间戳（毫秒）");
  }

  // 比较当前时间的时间戳是否超过指定时间的时间戳
  return now < expirationTimestamp;
};
