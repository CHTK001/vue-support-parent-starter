import { ref } from "vue";

export interface UniRequestOptions<T> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: Record<string, unknown>;
  header?: Record<string, string>;
  /** 请求前置处理，可用于注入 token */
  beforeRequest?: (options: UniRequestOptions<T>) => UniRequestOptions<T>;
  /** 响应后置处理，可用于统一解包 */
  afterResponse?: (res: UniApp.RequestSuccessCallbackResult) => T;
}

export interface UniRequestResult<T> {
  loading: ReturnType<typeof ref<boolean>>;
  data: ReturnType<typeof ref<T | null>>;
  error: ReturnType<typeof ref<string | null>>;
  execute: () => Promise<T | null>;
}

const defaultAfterResponse = <T>(res: UniApp.RequestSuccessCallbackResult): T =>
  res.data as T;

export function useUniRequest<T>(
  options: UniRequestOptions<T>,
): UniRequestResult<T> {
  const loading = ref(false);
  const data = ref<T | null>(null) as ReturnType<typeof ref<T | null>>;
  const error = ref<string | null>(null);

  const execute = (): Promise<T | null> => {
    loading.value = true;
    error.value = null;

    const resolved = options.beforeRequest ? options.beforeRequest(options) : options;
    const afterResponse = options.afterResponse ?? defaultAfterResponse<T>;

    return new Promise((resolve) => {
      uni.request({
        url: resolved.url,
        method: resolved.method ?? "GET",
        data: resolved.data,
        header: resolved.header,
        success: (res) => {
          const result = afterResponse(res);
          data.value = result;
          resolve(result);
        },
        fail: (err) => {
          error.value = err.errMsg ?? "请求失败";
          resolve(null);
        },
        complete: () => {
          loading.value = false;
        },
      });
    });
  };

  return { loading, data, error, execute };
}

/** 简单封装，适用于一次性请求 */
export function uniRequest<T>(
  url: string,
  options?: Omit<UniRequestOptions<T>, "url">,
): Promise<T | null> {
  const { execute } = useUniRequest<T>({ url, ...options });
  return execute();
}
