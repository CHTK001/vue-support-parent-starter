//获得本周周一~周日的年月日
export const getThisWeekData = () => {
  const thisweek = {
    start_day: "",
    end_day: ""
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
    end_day: ""
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
    S: date.getMilliseconds() //毫秒
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
