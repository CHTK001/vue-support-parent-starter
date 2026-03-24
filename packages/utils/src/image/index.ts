import { http } from "../http";
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

/**
 * 图片格式支持检测工具
 */

// 检测浏览器是否支持特定图片格式
export const checkImageFormatSupport = async (format) => {
  // 如果不在浏览器环境中，直接返回false
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  const formats = {
    avif: "image/avif",
    webp: "image/webp",
    jpeg2000: "image/jp2",
    jpeg: "image/jpeg",
    png: "image/png",
  };

  const mimeType = formats[format.toLowerCase()];
  if (!mimeType) return false;

  // 使用createImageBitmap API检测支持
  if ("createImageBitmap" in window && "ImageDecoder" in window) {
    try {
      // 创建一个1x1像素的测试图像
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType));
      if (!blob) return false;

      await createImageBitmap(blob as ImageBitmapSource);
      return true;
    } catch (e) {
      return false;
    }
  }

  // 回退方法：使用Image对象
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);

    // 创建一个base64编码的1x1像素图像
    if (format === "avif") {
      img.src =
        "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";
    } else if (format === "webp") {
      img.src = "data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA";
    } else if (format === "jpeg2000") {
      img.src = "data:image/jp2;base64,AAAADGpQICANCocKAAAAFGZ0eXBqcDIgAAAAAGpwMiAAAAAtanAyaAAAABZpaGRyAAAAAQAAAAEAAQAHAAAAAAAPY29scgEAAAAAABAAAABpanAyY/9P/1EALwAAAAAAAgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAEAAAAAAAAAAAAAAAEAAAABAAAAAQAAAAEAAAB+Pg==";
    }
  });
};

// 获取最佳图片格式
export const getBestImageFormat = async () => {
  if (await checkImageFormatSupport("avif")) {
    return "avif";
  } else if (await checkImageFormatSupport("webp")) {
    return "webp";
  } else {
    return "jpeg"; // 默认回退到jpeg
  }
};

// 转换图片URL到最佳格式
export const convertToSupportedFormat = async (url) => {
  if (!url) return url;

  // 如果URL已经包含格式查询参数，则移除它
  const urlWithoutFormat = url.replace(/(\?|&)format=\w+/, "");

  // 获取最佳格式
  const bestFormat = await getBestImageFormat();

  // 添加格式查询参数
  const separator = urlWithoutFormat.includes("?") ? "&" : "?";
  return `${urlWithoutFormat}${separator}format=${bestFormat}`;
};

//创建兼容性图片
export const createCompatibleImage = async (url: string, ossAddress: string) => {
  // 确保URL格式正确
  if (!url) return "";

  const fullUrl = url.startsWith("http") ? url : `${ossAddress}/${url}`;

  const supportsImageFormat = () => {
    return new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = fullUrl;
    });
  };

  try {
    const _supports = await supportsImageFormat();
    if (_supports) {
      return fullUrl;
    }

    return await urlToBase64(fullUrl);
  } catch (error) {
    console.error("图片兼容性检测失败:", error);
    return fullUrl; // 出错时返回原始URL
  }
};

//url转base64
export const urlToBase64 = async (url) => {
  try {
    // 使用http替代fetch，并设置请求头
    const response: any = await http.get(url, {}, {
      responseType: "blob",
      headers: {
        // 删除origin和referer
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const blob = response.data as Blob;
    // 创建一个 FileReader 实例
    const reader = new FileReader();

    // 定义一个 Promise 来处理异步读取
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        // 将结果（Base64 格式）返回
        resolve(reader.result);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      // 开始读取 Blob 数据为 Data URL
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("转换失败：", error);
    return null;
  }
};

// 创建一个Vue指令，用于自动转换图片格式
export const createImageFormatDirective = () => {
  return {
    mounted: async (el, binding) => {
      // 如果元素不是img，则查找内部的img
      const imgEl = el.tagName === "IMG" ? el : el.querySelector("img");
      if (!imgEl) return;

      // 保存原始src
      const originalSrc = imgEl.getAttribute("src");
      if (!originalSrc) return;

      // 转换为支持的格式
      const supportedSrc = await convertToSupportedFormat(originalSrc);
      imgEl.setAttribute("src", supportedSrc);

      // 添加错误处理，如果转换后的格式加载失败，回退到原始URL
      imgEl.addEventListener("error", () => {
        imgEl.setAttribute("src", originalSrc);
      });
    },
  };
};