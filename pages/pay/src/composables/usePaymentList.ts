import { reactive, ref } from "vue";

export interface ListQueryParams {
  merchantId?: number | string;
  orderNo?: string;
  [key: string]: unknown;
}

export function usePaymentList<T, F extends Record<string, unknown> = Record<string, unknown>>(
  fetchFn: (params: Record<string, unknown>) => Promise<{ data: { records?: T[]; total?: number } }>,
) {
  const tableRef = ref();
  const loading = ref(false);
  const queryForm = reactive({} as F);
  const stats = reactive({ total: 0, success: 0, processing: 0, failed: 0 });

  async function handleSearch() {
    await tableRef.value?.reload({ ...queryForm }, 1);
  }

  function handleReset(defaultForm?: F) {
    if (defaultForm) {
      Object.assign(queryForm, defaultForm);
    } else {
      Object.keys(queryForm).forEach((key) => {
        (queryForm as Record<string, unknown>)[key] = undefined;
      });
    }
    handleSearch();
  }

  async function reloadAll() {
    loading.value = true;
    try {
      await tableRef.value?.reload({ ...queryForm }, 1);
    } finally {
      loading.value = false;
    }
  }

  return {
    tableRef,
    loading,
    queryForm,
    stats,
    handleSearch,
    handleReset,
    reloadAll,
  };
}
