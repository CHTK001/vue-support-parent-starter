// import path from "node:path";
import path from "path-browserify";
import { ref } from "vue";
export enum DesType {
  phone,
  card,
  name,
}
export function resolvePath(relative: string, base: string) {
  return path.posix.resolve(relative, base);
}

/**
 * 获取本地图
 * @param name // 文件名 如 doc.png
 * @returns {*|string}
 */
export function getAssetsImages(name) {
  if (name) {
    name = name.toLowerCase();
  }
  if (name.indexOf(".") == -1) {
    name = name + ".png";
  }
  const url = new URL(`/src/assets/images/${name}`).href;
  if (url && !url.endsWith("undefined")) {
    return url;
  }
  /* @vite-ignore*/
  return new URL(`/src/assets/images/unknown.png`).href;
}

export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = "#";
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).substr(-2);
  }
  return color;
}
/**
 * 获取文件后缀
 * @param fileName
 */
export function normalizePath(path) {
  const isWindows = path.match(/^[A-Za-z]:\\/);
  if (isWindows) {
    path = path.replace(/\\/g, "/"); // 将Windows路径中的反斜杠转换为正斜杠
  }
  const parts = path.split("/"); // 使用split将路径分割为数组
  const newParts = [];
  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "..") {
      newParts.pop(); // 遇到'..'时，弹出最后一个路径部分
    } else if (parts[i] === "." || parts[i] === "") {
      continue; // 忽略'.'和空字符串
    } else {
      newParts.push(parts[i]); // 添加有效路径部分
    }
  }
  path = newParts.join("/"); // 将处理后的部分重新合并为路径
  if (isWindows) {
    path = path.replace(/^\//, ""); // 移除开头的斜杠（如果存在）
    path = path.replace(/^([A-Za-z]):\//, "$1:/"); // 格式化Windows驱动器路径
  }
  return path;
}
/**
 * 格式化文件大小
 * @param fileSizeInBytes
 */
export function sizeFormat(fileSizeInBytes) {
  const sizeUnit = ["B", "K", "M", "G", "T"];
  const sizeType = parseInt(Math.floor(Math.log(fileSizeInBytes) / Math.log(1024)).toString());
  const size = (fileSizeInBytes / Math.pow(1024, sizeType)).toFixed(2);
  return size + sizeUnit[sizeType];
}
/**
 * 文件url类型
 */
export function getUrlType(url) {
  return new Promise((resolve, reject) => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      // Wait for header to become available.
      var contentType = xhr.getResponseHeader("Content-Type");
      if (contentType) {
        resolve(contentType);
        xhr.abort();
      } else {
        reject();
      }
    };
    xhr.send();
  });
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
/**
 * 邮箱查询
 * @param queryString
 * @param callback
 */
export function queryEmail(queryString, callback) {
  const emailList = [{ value: "@qq.com" }, { value: "@gmail.com" }, { value: "@yahoo.com" }, { value: "@126.com" }, { value: "@163.com" }];
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

export const clearObject = (obj, props = {}) => {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (!value) {
      return;
    }

    if (value instanceof Array) {
      obj[key] = [];
      return;
    }

    if (typeof value === "number") {
      obj[key] = 0;
      return;
    }
    if (typeof value === "boolean") {
      obj[key] = false;
      return;
    }
    obj[key] = "";
  });
  Object.assign(obj, props);
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
