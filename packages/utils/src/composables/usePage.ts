import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import type { ReturnResult } from "../http";

/**
 * 分页参数
 */
export interface PageParams {
  page?: number;
  size?: number;
  [key: string]: any;
}

/**
 * 分页响应数据格式
 */
export interface PageData<T> {
  records: T[];
  total: number;
  size?: number;
  current?: number;
  pages?: number;
}

/**
 * 数据同步配置
 */
export interface PageSyncConfig<T = any> {
  /**
   * 数据获取函数，返回 ReturnResult<PageData<T>>
   */
  fetchFn: (params: PageParams) => Promise<ReturnResult<PageData<T>>>;
  /**
   * 初始参数
   */
  initialParams?: Partial<PageParams>;
  /**
   * 是否自动加载
   */
  autoLoad?: boolean;
  /**
   * 错误处理函数
   */
  onError?: (error: Error) => void;
  /**
   * 数据转换函数，用于将响应数据转换为列表
   */
  transform?: (data: PageData<T>) => T[];
}

/**
 * Page composable，统一处理数据同步
 */
export function usePage<T = any>(config: PageSyncConfig<T>) {
  const { fetchFn, initialParams = {}, autoLoad = true, onError, transform } = config;

  // 数据列表
  const list: Ref<T[]> = ref([]);
  // 加载状态
  const loading = ref(false);
  // 分页参数
  const pageParams = ref<PageParams>({
    page: 1,
    size: 10,
    ...initialParams,
  });
  // 总数
  const total = ref(0);

  /**
   * 加载数据
   */
  const loadData = async (params?: Partial<PageParams>) => {
    try {
      loading.value = true;
      const finalParams = { ...pageParams.value, ...params };
      const response = await fetchFn(finalParams);
      
      if (response.success && response.data) {
        const pageData = response.data;
        // 使用 transform 函数或默认处理
        if (transform) {
          list.value = transform(pageData);
        } else {
          list.value = pageData.records || [];
        }
        total.value = pageData.total || 0;
        // 更新分页参数
        if (pageData.current !== undefined) {
          pageParams.value.page = pageData.current;
        }
        if (pageData.size !== undefined) {
          pageParams.value.size = pageData.size;
        }
      } else {
        const errorMsg = response.msg || response.message || "数据加载失败";
        if (onError) {
          onError(new Error(errorMsg));
        } else {
          ElMessage.error(errorMsg);
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) {
        onError(err);
      } else {
        ElMessage.error(err.message || "数据加载失败");
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新数据
   */
  const refresh = () => {
    return loadData();
  };

  /**
   * 重置并加载
   */
  const reset = () => {
    pageParams.value = {
      page: 1,
      size: 10,
      ...initialParams,
    };
    return loadData();
  };

  /**
   * 改变页码
   */
  const changePage = (page: number) => {
    pageParams.value.page = page;
    return loadData();
  };

  /**
   * 改变每页条数
   */
  const changePageSize = (pageSize: number) => {
    pageParams.value.size = pageSize;
    pageParams.value.page = 1;
    return loadData();
  };

  // 自动加载
  if (autoLoad) {
    loadData();
  }

  return {
    list,
    loading,
    pageParams,
    total,
    loadData,
    refresh,
    reset,
    changePage,
    changePageSize,
  };
}

