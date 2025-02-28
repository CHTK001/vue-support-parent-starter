/**
 * 生成 0 到 N-1 范围内的随机整数
 * @description: 生成随机数
 * @param {number} n
 * @return {number}
 */
export const getRandomIntBelow = (n: number): number => {
  return Math.floor(Math.random() * n);
};
/**
 * 生成 -N 到 N 范围内的随机整数
 * @description: 生成随机数
 * @param {number} n
 * @return {number}
 */
export const getRandomSignedInt = (n: number): number => {
  return Math.floor(Math.random() * (2 * n + 1)) - n;
};

/**
 * 生成指定长度的随机数组
 * @description: 生成随机数组
 * @param {number} length
 * @param {number} min
 * @param {number} max
 * @return {number[]}
 */
export const getRandomIntArray = (length: number, min: number, max: number): number[] => {
  return Array.from({ length }, () => getRandomInt(min, max));
};
/**
 * 生成指定范围内的随机数
 * @description: 生成随机数
 * @param {number} min
 * @param {number} max
 * @return {number}
 */
export const getRandomInt = (min: number, max: number): number => {
  min = Math.ceil(min); // 向上取整，确保 min 是整数
  max = Math.floor(max) || min; // 向下取整，确保 max 是整数
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
