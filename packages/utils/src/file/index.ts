// 导出文件图标工具
export * from "./fileIcon";

/**
 * 表示文件信息的类型，包含 Base64 编码的字符串
 */
type FileInfo = {
  base64: string;
};

/**
 * 表示图像信息的类型，继承自 FileInfo 并包含图像的宽度和高度
 */
type ImageInfo = {
  width: number;
  height: number;
} & FileInfo;

/**
 * 将文件对象转换为 Base64 编码的字符串
 * 如果文件是图像，还会额外返回图像的宽度和高度
 * @param file - 要转换的文件对象
 * @returns 一个 Promise，当转换成功时，根据文件类型返回 FileInfo 或 ImageInfo 对象
 */
export async function fileToBase64(file: File): Promise<FileInfo | ImageInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    // 监听文件读取完成事件
    reader.onload = (event) => {
      if (event.target?.readyState === FileReader.DONE) {
        const base64String = event.target.result as string;

        // 如果文件是图像，获取图像的宽度和高度
        if (file.type.startsWith("image/")) {
          const img = new Image();
          img.onload = () => {
            resolve({
              base64: base64String,
              width: img.width,
              height: img.height,
            });
          };
          img.src = base64String;
          return;
        }

        // 非图像文件，仅返回 Base64 编码
        resolve({ base64: base64String });
      }
    };

    // 监听文件读取错误事件
    reader.onerror = (event) => {
      console.error("文件读取错误:", event);
      reject(event);
    };

    // 开始以 DataURL 格式读取文件
    reader.readAsDataURL(file);
  });
}
