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
