import * as crypto from "./index";

// 定义基本的类型接口
interface PureHttpRequestConfig {
  data?: any;
  url?: string;
  headers?: Record<string, any>;
}

interface PureHttpResponse {
  status?: number;
  data?: any;
  headers?: Record<string, any>;
}

/** uu2 */
export const uu2 = (request: PureHttpRequestConfig) => {
  const body = request.data;
  const url = request.url;
  if (url?.startsWith("/v2/setting")) {
    return request;
  }
  if (!body) {
    return request;
  }

  // 模拟getConfig函数
  const getConfig = (key: string): string | undefined => {
    if (key === "requestCodecOpen") return "true";
    if (key === "codecRequestKey") return "defaultKey";
    return undefined;
  };

  const requestCodecOpen = getConfig("requestCodecOpen");
  const codecRequestKey = getConfig("codecRequestKey");
  
  if (!requestCodecOpen || !codecRequestKey) {
    return request;
  }

  const isArray = body instanceof Array;
  if (!isArray) {
    const keys = Object.keys(body);
    if (
      keys.filter((item) => {
        const val = body[item];
        if (val instanceof File) {
          return true;
        }

        if (val instanceof Blob) {
          return true;
        }

        return false;
      }).length > 0
    ) {
      return request;
    }
  }
  var data1 = JSON.stringify(body);
  try {
    // 使用WASM版本的加密函数，传递整个请求对象
    const processedRequest = crypto.uu2_wasm(request);
    return processedRequest;
  } catch (error) {
    return request;
  }
};

/** uu1 */
export const uu1 = (response: PureHttpResponse) => {
  // 直接调用index.js中的uu1函数处理响应解密
  return crypto.uu1(response);
};

/** uu3 */
export const uu3 = (value: string) => {
  // 使用WASM版本的解密函数
  return crypto.uu3(value);
};

/** uu4 */
export const uu4 = (response: any) => {
  var data = response?.data;
  if (!data?.startsWith("02")) {
    return response;
  }
  var origin = response?.uuid;
  if (origin) {
    const ts = response?.timestamp;
    try {
      // 使用WASM版本的解密函数
      return JSON.parse(
        crypto.uu4(
          data,
          origin.toString(),
          ts?.toString() || ""
        ),
      );
    } catch (err) {}
  }
  return {};
};