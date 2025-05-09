import { ref } from "vue";
export enum DesType {
  phone,
  card,
  name,
}

/**
 * 深度清理对象中的undefined属性
 * 该函数递归地遍历对象的每个属性，如果属性值为undefined，则从对象中删除该属性
 * @param obj 要进行深度清理的对象
 */
export function deepClean(obj: any) {
  // 检查obj是否为对象类型，因为只有对象类型才有属性
  if (typeof obj === "object") {
    // 遍历对象的所有属性
    for (var key in obj) {
      delete obj[key];
    }
  }
}

/**
 *
 * 随机获取字符数组数据
 * @param urls  字符串数据，多个字符串用分隔符分开
 * @param separator 分隔符，默认为逗号
 * @returns 随机选择的一个字符串
 */
export function getRandomString(urls: string, separator: string = ",") {
  if (!urls || urls.trim() === "") {
    return "";
  }

  // 将字符串按分隔符拆分成数组
  const urlArray = urls.split(separator).filter((item) => item.trim() !== "");

  // 如果数组为空，返回空字符串
  if (urlArray.length === 0) {
    return "";
  }

  // 随机选择数组中的一个元素
  const randomIndex = Math.floor(Math.random() * urlArray.length);
  return urlArray[randomIndex];
}

/**
 * 深拷贝对象的函数
 * 该函数将目标对象的属性深拷贝到源对象中，如果源对象中有同名属性，则替换；如果源对象中缺少目标对象的属性，则添加
 * @param source 源对象，将被拷贝的对象
 * @param target 目标对象，其属性将被拷贝到源对象中
 */
export function deepCopy(source: any, target: any) {
  Object.keys(source).forEach((key) => {
    if (target[key]) {
      source[key] = target[key];
      return;
    }
    delete source[key];
  });
  Object.keys(target).forEach((key) => {
    if (!source[key]) {
      source[key] = target[key];
      return;
    }
  });
}
/**
 *
 * 统计字符串中某字符的个数
 * @param str 统计字符串中某字符的个数
 * @param search  要统计的字符串
 * @returns
 */
export function countOccurrences(str, search) {
  const regex = new RegExp(search, "g");
  const matches = str.match(regex);
  return matches ? matches.length : 0;
}
/**
 * 合并对象
 * @param obj1 - 要合并的对象
 * @param obj2 - 要合并的对象
 * @returns 合并后的对象
 */
export function mergeObjects(obj1, obj2) {
  for (var key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj1.hasOwnProperty(key) && typeof obj1[key] === "object" && typeof obj2[key] === "object") {
        mergeObjects(obj1[key], obj2[key]);
      } else {
        obj1[key] = obj2[key];
      }
    }
  }
  return obj1;
}
/**
 * 将字符串转换为对象
 * @param input - 要转换的对象或数组
 */
export const toObject = (input: any): object => {
  // 检查输入是否为字符串
  if (typeof input === "string") {
    try {
      // 尝试将字符串解析为 JSON 对象
      return JSON.parse(input);
    } catch (error) {
      // 如果解析失败，返回 null 或者其他错误处理
      console.error("解析字符串到对象时出错:", error);
      return {};
    }
  }
  return {};
};
/**
 * 获取url参数
 * @param name
 * @returns
 */
export const getParameter = (name: string) => {
  const search = window.location.search;
  const pattern = new RegExp("[?&]" + encodeURIComponent(name) + "=([^&]*)");
  const matches = search.match(pattern);
  const searchParam = matches ? decodeURIComponent(matches[1]) : null;
  return searchParam;
};

// 函数接收一个参数，表示监测的最大帧数，这里默认值是 1000
// 如果说你渲染的东西特别多可以传入一个值
export function useDefer(maxFrameCount = 1000) {
  // 然后开始计数
  const frameCount = ref(0);
  const refreshFrameCount = () => {
    requestAnimationFrame(() => {
      // 每一次 requestAnimationFrame 就计数加一
      // 表示当前渲染的帧数变多了一帧
      frameCount.value++;
      // 只要当前帧数小于最大帧数就递归执行
      if (frameCount.value < maxFrameCount) {
        refreshFrameCount();
      }
    });
  };
  refreshFrameCount();
  // 返回一个函数，接收传递进来的 n
  return function (showInFrameCount) {
    // 判断当前渲染的帧数有没有大于 n
    return frameCount.value >= showInFrameCount;
  };
}
const emailList = [
  { value: "@gmail.com" },
  { value: "@qq.com" },
  { value: "@vip.qq.com" },
  { value: "@yahoo.com" },
  { value: "@126.com" },
  { value: "@vip.126.com" },
  { value: "@139.com" },
  { value: "@163.com" },
  { value: "@vip.163.com" },
  { value: "@foxmail.com" },
  { value: "@sohu.com" },
  { value: "@aliyun.com" },
  { value: "@sina.com" },
  { value: "@vip.sina.com" },
  { value: "@sina.cn" },
  { value: "@vip.sina.cn" },
  { value: "@yeah.net" },
  { value: "@msn.com" },
  { value: "@hotmail.com" },
  { value: "@live.com" },
];
/**
 * 邮箱查询
 * @param queryString
 * @param callback
 */
export function queryEmail(queryString, callback) {
  let results = [];
  let queryList = [];
  emailList.map((item) => queryList.push({ value: queryString.split("@")[0] + item.value }));
  results = queryString ? queryList.filter((item) => item.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0) : queryList;
  callback(results);
}
/**
 * 拼接对象为请求字符串
 * @param {Object} obj - 待拼接的对象
 * @returns {string} - 拼接成的请求字符串
 * Auth:WANGJIAN
 */
export function encodeSearchParams(obj) {
  const params = [];

  Object.keys(obj).forEach((key) => {
    let value = obj[key];
    // 如果值为undefined我们将其置空
    if (typeof value === "undefined") {
      value = "";
    }
    // 对于需要编码的文本（比如说中文）我们要进行编码
    params.push([key, encodeURIComponent(value)].join("="));
  });

  return params.join("&");
}

/**
 * 分页
 * @param array
 * @param pageSize
 * @param pageNumber
 */
export function paginate(array, pageSize, pageNumber, filter) {
  --pageNumber; // 因为数组索引从0开始
  if (!filter) {
    return {
      data: array.slice(pageNumber * pageSize, (pageNumber + 1) * pageSize),
      total: array.length,
    };
  }
  const rs: any = [];
  const start: number = pageNumber * pageSize;
  const max: number = (pageNumber + 1) * pageSize;
  for (let i = 0; i < array.length; i++) {
    if (filter(array[i])) {
      rs.push(array[i]);
    }
  }

  return {
    data: rs.slice(start, max),
    total: rs.length,
  };
}
/**
 * 生成随机数
 */
export function guid() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }
  return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
}

/**
 * 生成UUID
 */
export function uuid(len, radix) {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
  var uuid = [],
    i;
  radix = radix || chars.length;

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)];
  } else {
    // rfc4122, version 4 form
    var r;

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = "-";
    uuid[14] = "4";

    // Fill in random data. At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16);
        uuid[i] = chars[i == 19 ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  return uuid.join("");
}

/**
 * 生成UUID
 */
export function generateUUID() {
  var d = new Date().getTime();
  var uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
  return uuid;
}
/**
 * 脱敏
 * @param val 脱敏数据
 * @param fillChar 填充字段
 * @param type 类型
 */
export const des = (val, fillChar = "*", type: DesType = DesType.phone) => {
  if (type === DesType.phone) {
    return desPhone(val, fillChar);
  }

  if (type === DesType.card) {
    return desensitizeCardNumber(val, fillChar);
  }

  if (type === DesType.name) {
    return desensitizeName(val);
  }

  return val;
};

export const clearObject = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
};

/**
 * 比对两组数据是否一致
 * @param news
 * @param old
 * @returns {boolean}
 */
export function judementSameArr(news, old) {
  // console.log(news)
  // console.log(old)
  let count = 0;
  const leng = news.length;
  for (let i in news) {
    for (let j in old) {
      if (news[i] === old[j]) {
        count++;
        // console.log(news[i])
      }
    }
  }
  // console.log('相同的数量', count)
  return count === leng;
}

/*********************************************************** */
/**
 * 姓名脱敏
 * @param name 姓名
 * @returns
 */
function desensitizeName(name, fillChar = "*") {
  // 获取姓名长度
  const length = name.length;

  // 如果姓名长度小于等于1，则无需脱敏，直接返回原始姓名
  if (length <= 1) {
    return name;
  }

  // 取出第一个字符
  const firstChar = name.substring(0, 1);

  // 构造脱敏字符串，除了第一个字符外，其余字符都用 "*" 替换
  const desensitizedPart = fillChar.repeat(length - 1);

  // 组合成脱敏后的姓名
  const desensitizedName = firstChar + desensitizedPart;

  return desensitizedName;
}
function desensitizeCardNumber(cardNumber, fillChar = "*") {
  // 获取银行卡号长度
  const length = cardNumber.length;

  // 如果银行卡号长度小于等于4，则无需脱敏，直接返回原始银行卡号
  if (length <= 4) {
    return cardNumber;
  }

  // 取出前四位
  const firstTwo = cardNumber.substring(0, 2);
  // 取出后四位
  const lastFour = cardNumber.substring(length - 4);
  // 构造脱敏字符串，中间的数字用 "*" 替换
  const middle = fillChar.repeat(length - 6);

  // 组合成脱敏后的银行卡号
  const desensitizedCardNumber = firstTwo + middle + lastFour;

  return desensitizedCardNumber;
}
/**
 * 清空对象
 * @param obj
 */

/**
 * 脱敏手机号码
 *
 * @param content 待脱敏的手机号内容
 * @param fillChar 脱敏填充字符，默认为 "*"
 * @returns 脱敏后的手机号字符串
 */
function desPhone(content, fillChar = "*") {
  if (!content) {
    return "";
  }

  // 非字符串转换为字符串
  content = content.toString();

  if (content.length < 11) {
    return content;
  }

  let index = 1;
  let result = "";

  for (let char of content) {
    if (index < 4 || index > content.length - 4) {
      result += char;
    } else {
      result += fillChar;
    }
    index++;
  }
  return result;
}
/**
 * 格式化文件大小
 * @param bytes
 */
export function formatSize(bytes, onlyGb = false, showUnit = true) {
  if (onlyGb) {
    const gb = 1024 * 1024 * 1024; // 1 GB 的字节数
    const sizeInGB = bytes / gb;
    return `${sizeInGB.toFixed(2)}` + (showUnit ? "GB" : "");
  }
  if (bytes === 0) return "0 字节";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${showUnit ? sizes[i] : ""}`;
}
/**
 * 获取持续时间
 * @param milliseconds
 */
export function formatDurationObject(milliseconds) {
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const days = Math.floor(milliseconds / day);
  const hours = Math.floor((milliseconds % day) / hour);
  const minutes = Math.floor(((milliseconds % day) % hour) / minute);
  const seconds = Math.floor((((milliseconds % day) % hour) % minute) / second);

  let formatted = "";

  const res = {
    day: 0,
    hour: 0,
    minute: 0,
    second: 0,
  };
  if (days > 0) {
    res.day = days;
  }

  if (hours > 0) {
    res.hour = hours;
  }
  if (minutes > 0) {
    res.minute = minutes;
  }
  if (seconds > 0 || (seconds === 0 && formatted === "")) {
    res.second = seconds;
  }

  return res;
}
/**
 * 获取持续时间
 * @param milliseconds
 */
export function formatDuration(milliseconds, showUnit = true, showOne = false) {
  const second = 1000;
  const minute = second * 60;
  const hour = minute * 60;
  const day = hour * 24;

  const days = Math.floor(milliseconds / day);
  const hours = Math.floor((milliseconds % day) / hour);
  const minutes = Math.floor(((milliseconds % day) % hour) / minute);
  const seconds = Math.floor((((milliseconds % day) % hour) % minute) / second);

  let formatted = "";

  if (days > 0) {
    formatted += `${days} ` + (showUnit ? "天 " : "");
    if (showOne) {
      return formatted;
    }
  }
  if (hours > 0) {
    formatted += `${hours} ` + (showUnit ? "小时 " : "");
    if (showOne) {
      return formatted;
    }
  }
  if (minutes > 0) {
    formatted += `${minutes} ` + (showUnit ? "分 " : "");
    if (showOne) {
      return formatted;
    }
  }
  if (seconds > 0 || (seconds === 0 && formatted === "")) {
    formatted += `${seconds}` + (showUnit ? "秒" : "");
    if (showOne) {
      return formatted;
    }
  }

  return formatted.trim();
}
/**
 * 格式化路径
 * @param filePrefix {string | null} 前缀路径（可选）
 * @param filePath {string} 文件路径
 * @returns {string} 格式化后的完整路径
 */
export const formatFilePath = (filePrefix: string | null, filePath: string): string => {
  // 如果路径已经是完整的 URL，则直接返回
  if (filePath.startsWith("http://") || filePath.startsWith("https://") || filePath.startsWith("ftp://")) {
    return filePath;
  }
  // 将 Windows 路径的反斜杠替换为正斜杠
  let formattedPath = filePath.replace(/\\/g, "/");

  // 去除多余的重复斜杠（包括连续的正斜杠）
  formattedPath = formattedPath.replace(/\/+/g, "/");

  // 如果有前缀路径，将其与文件路径拼接
  if (filePrefix) {
    // 确保前缀路径以正斜杠结尾
    const prefix = filePrefix.endsWith("/") ? filePrefix : filePrefix + "/";
    formattedPath = prefix + formattedPath;
  }

  // 返回最终的格式化路径
  return formattedPath;
};

/**
 * 兼容requestAnimationFrame
 */
window.requestAnimationFrame = (function () {
  return (
    window.requestAnimationFrame ||
    // @ts-ignore
    window?.webkitRequestAnimationFrame ||
    // @ts-ignore
    window?.mozRequestAnimationFrame ||
    // @ts-ignore
    window?.oRequestAnimationFrame ||
    // @ts-ignore
    window?.msRequestAnimationFrame ||
    function (callback) {
      return window.setTimeout(callback, 1000 / 60);
    }
  );
})();
