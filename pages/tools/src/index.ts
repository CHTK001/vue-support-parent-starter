import { http } from "@repo/utils";

/**
 * 幻影图像生成
 * @param formData - 包含两张图片的 FormData
 */
export function fetchToolPhantom(formData: FormData) {
  return http.post("/tools/phantom", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
