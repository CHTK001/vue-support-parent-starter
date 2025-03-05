/**
 * 检查图片是否存在
 * @param url 图片地址
 * @returns Promise<boolean>
 */
export const checkImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image(); // 创建一个 Image 对象
    img.src = url; // 设置图片的 URL

    img.onload = () => {
      resolve(url); // 图片有效
    };

    img.onerror = () => {
      reject(false); // 图片无效
    };
  });
};
