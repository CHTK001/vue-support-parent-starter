import { reactive } from "vue";

export interface PaymentStats {
  total: number;
  success: number;
  processing: number;
  failed: number;
}

export function usePaymentStats() {
  const stats = reactive<PaymentStats>({ total: 0, success: 0, processing: 0, failed: 0 });

  function computeStats<T extends { status?: number }>(records: T[]) {
    stats.total = records.length;
    stats.success = records.filter((item) => item.status === 1).length;
    stats.processing = records.filter((item) => item.status === 2).length;
    stats.failed = records.filter((item) => item.status && item.status > 2).length;
    return stats;
  }

  function resetStats() {
    stats.total = 0;
    stats.success = 0;
    stats.processing = 0;
    stats.failed = 0;
  }

  return { stats, computeStats, resetStats };
}
