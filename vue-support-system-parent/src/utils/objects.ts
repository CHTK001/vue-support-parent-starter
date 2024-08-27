export enum DesType {
  phone,
  card,
  name
}
/**
 * 脱敏
 * @param val 脱敏数据
 * @param fillChar 填充字段
 * @param type 类型
 */
export const des = (val, fillChar = "*", type: DesType) => {
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
  Object.keys(obj).forEach(key => {
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
