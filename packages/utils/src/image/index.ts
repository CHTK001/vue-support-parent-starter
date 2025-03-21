/**
 * 检查图片是否存在
 * @param url 图片的 URL 地址
 * @returns 一个 Promise，当图片存在时 resolve 图片的 URL，当图片不存在时 reject 一个错误信息
 */
export const checkImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 创建一个 Image 对象用于加载图片
    const img = new Image();
    // 设置 Image 对象的 src 属性为传入的图片 URL
    img.src = url;

    // 当图片成功加载时，触发 onload 事件，此时说明图片存在，resolve 图片的 URL
    img.onload = () => {
      resolve(url);
    };

    // 当图片加载失败时，触发 onerror 事件，此时说明图片不存在，reject 一个错误信息
    img.onerror = () => {
      reject(new Error(`图片 ${url} 不存在或无法加载`));
    };
  });
};
