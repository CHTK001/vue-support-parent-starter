import {
  MerchantStatusMap,
  OrderStatusMap,
  RefundStatusMap,
  TransactionStatusMap,
} from "../types/payment";

export type StatusMap = Record<string | number, string>;

export function statusTag(status: number | string | undefined, map: StatusMap, fallback = "未知"): string {
  if (status === undefined || status === null) return fallback;
  return map[status] ?? fallback;
}

export function statusType(status: number | undefined): "success" | "warning" | "danger" | "info" {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status && status > 2) return "danger";
  return "info";
}

export function isExecutableChannel(channelType?: string): boolean {
  if (!channelType) return false;
  const executable = ["ALIPAY", "WECHAT", "WECHAT_OFFICIAL", "QQPAY"];
  return executable.includes(channelType);
}

export { MerchantStatusMap, OrderStatusMap, RefundStatusMap, TransactionStatusMap };
