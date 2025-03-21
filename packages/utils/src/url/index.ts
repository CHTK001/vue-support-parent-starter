type ImageInfo = { width: number; height: number };
/**
 * url图片信息
 * @param {string} url
 * @return {*}
 */
export const urlImageInfo = (url: string): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = function () {
      console.log("无法加载图片，请检查URL是否正确。");
      reject(false);
    };

    img.src = url;
  });
};
