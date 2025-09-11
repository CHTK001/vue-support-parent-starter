import { http, type ReturnResult } from "@repo/utils";

export interface FaceRequest {
  //请求ID，用于标识一次图片处理请求
  requestId: string;
  //模型名称，指定使用的图片处理模型
  model: string;
  //图片处理服务提供商，指定图片处理服务提供商
  provider: string;
}
/**
 * 人脸检测
 */
export const fetchFaceDetection = (params: FaceRequest, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/face/detect", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    params,
  });
};

/**
 * 人脸特征提取
 */
export const fetchFaceFeature = (params: FaceRequest, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/face/feature", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    params,
  });
};

/**
 * 人脸识别
 */
export const fetchFaceRecognizer = (params: FaceRequest, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/face/recognizer", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    params,
  });
};

/**
 * 人脸对比
 */
export const fetchFaceCompare = (params: FaceRequest, file: File, file2: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file2", file2);
  return http.request<ReturnResult<object[]>>("post", "/v2/ai/image/face/compare", {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: formData,
    params,
  });
};
