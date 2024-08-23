/**
 * 清空对象
 * @param obj
 */
export const clearObject = obj => {
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
