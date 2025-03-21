type FileInfo = { base64: string };
type ImageInfo = { width: number; height: number } & FileInfo;
/**
 * 将文件对象转换为Base64编码的字符串
 * @param file 文件对象
 * @returns 包含Base64编码的字符串
 */
export function fileToBase64(file: File): Promise<FileInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      if (event.target.readyState === FileReader.DONE) {
        const base64String: any = event.target.result;
        if (file && file.type.startsWith("image/")) {
          const img = new Image();
          img.onload = function () {
            resolve({
              base64: base64String,
              width: img.width,
              height: img.height,
            } as ImageInfo);
          };
          img.src = base64String;
          return;
        }
        resolve({ base64: base64String });
        return base64String;
      }
    };

    reader.onerror = function (event) {
      console.error("文件读取错误:", event);
      reject(event);
    };
    reader.readAsDataURL(file);
  });
}
