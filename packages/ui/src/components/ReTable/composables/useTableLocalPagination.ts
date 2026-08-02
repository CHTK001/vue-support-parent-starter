/**
 * useTableLocalPagination - 本地分页 composable
 * 
 * 对静态数据进行分页切片
 */
import { ref, computed, watch, type Ref, type ComputedRef } from "vue";

export interface LocalPaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface LocalPaginationReturn<T = any> {
  currentPage: Ref<number>;
  pageSize: Ref<number>;
  total: ComputedRef<number>;
  pageData: ComputedRef<T[]>;
  totalPages: ComputedRef<number>;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  reset: () => void;
  /** 测试用：重新计算 */
  refresh: () => void;
}

export function useTableLocalPagination<T = any>(
  data: Ref<T[]> | T[],
  options: LocalPaginationOptions = {},
): LocalPaginationReturn<T> {
  const { page = 1, pageSize = 10 } = options;

  const currentPage = ref(page);
  const pageSizeRef = ref(pageSize);

  const dataRef = ref<T[]>(Array.isArray(data) ? data : data.value);

  if (!Array.isArray(data)) {
    watch(data, (newData) => {
      dataRef.value = newData;
    });
  }

  const total = computed(() => dataRef.value.length);
  const totalPages = computed(() => Math.ceil(total.value / pageSizeRef.value) || 1);

  const pageData = computed(() => {
    const start = (currentPage.value - 1) * pageSizeRef.value;
    const end = start + pageSizeRef.value;
    return dataRef.value.slice(start, end);
  });

  const goToPage = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages.value));
    if (clamped !== currentPage.value) {
      currentPage.value = clamped;
    }
  };

  const setPageSize = (size: number) => {
    if (size > 0 && size !== pageSizeRef.value) {
      pageSizeRef.value = size;
      if (currentPage.value > totalPages.value) {
        currentPage.value = totalPages.value;
      }
    }
  };

  const reset = () => {
    currentPage.value = page;
    pageSizeRef.value = pageSize;
  };

  const refresh = () => {
    // 触发 computed 重计算
  };

  return {
    currentPage,
    pageSize: pageSizeRef,
    total,
    pageData,
    totalPages,
    goToPage,
    setPageSize,
    reset,
    refresh,
  } as LocalPaginationReturn<T>;
}

export default useTableLocalPagination;