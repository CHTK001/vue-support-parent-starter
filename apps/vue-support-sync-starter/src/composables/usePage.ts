import { ref, type Ref } from "vue";
import { ElMessage } from "element-plus";
import type { ApiResponse } from "../utils/api";
import { request } from "../utils/api";

/**
 * 分页参数
 */
export interface PageParams {
  page: number;
  pageSize: number;
  [key: string]: any;
}

/**
 * 分页响应
 */
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 数据同步配置
 */
export interface PageSyncConfig<T = any> {
  /**
   * 数据获取函数
   */
  fetchFn: (params: PageParams) => Promise<ApiResponse<PageResponse<T>>>;
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
}

/**
 * Page composable，统一处理数据同步
 */
export function usePage<T = any>(config: PageSyncConfig<T>) {
  const { fetchFn, initialParams = {}, autoLoad = true, onError } = config;

  // 数据列表
  const list: Ref<T[]> = ref([]);
  // 加载状态
  const loading = ref(false);
  // 分页参数
  const pageParams = ref<PageParams>({
    page: 1,
    pageSize: 10,
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
      if (response.data) {
        list.value = response.data.list || [];
        total.value = response.data.total || 0;
        pageParams.value = { ...finalParams, page: response.data.page || finalParams.page, pageSize: response.data.pageSize || finalParams.pageSize };
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
      pageSize: 10,
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
    pageParams.value.pageSize = pageSize;
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

