import { reactive, ref } from "vue";
import type { Merchant } from "../types/payment";

export function usePaymentMerchants(fetchFn: () => Promise<{ data: { records?: Merchant[] } }>) {
  const merchantOptions = ref<Merchant[]>([]);

  async function loadMerchants() {
    const res = await fetchFn();
    merchantOptions.value = res.data.records || [];
  }

  return { merchantOptions, loadMerchants };
}
