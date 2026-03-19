import axios from "axios";
import type {
  ApiResponse,
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantForm,
  OrderForm,
  OrderOperateForm,
  OrderPayForm,
  OrderStateLog,
  PageResponse,
  PaymentLaunchResult,
  PaymentMethodGuide,
  PaymentOrder,
  ProviderSpiOption,
  RefundForm,
  TransactionRecord,
} from "../types/payment";

const request = axios.create({
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

type ApiPromise<T> = Promise<ApiResponse<T>>;

export function getMerchantList(params: Record<string, unknown>): ApiPromise<PageResponse<Merchant>> {
  return request.get("/api/merchant/list", { params });
}

export function getMerchantDetail(id: number): ApiPromise<Merchant> {
  return request.get(`/api/merchant/${id}`);
}

export function createMerchant(data: MerchantForm): ApiPromise<Merchant> {
  return request.post("/api/merchant", data);
}

export function updateMerchant(id: number, data: MerchantForm): ApiPromise<Merchant> {
  return request.put(`/api/merchant/${id}`, data);
}

export function activateMerchant(id: number): ApiPromise<boolean> {
  return request.put(`/api/merchant/${id}/activate`);
}

export function deactivateMerchant(id: number): ApiPromise<boolean> {
  return request.put(`/api/merchant/${id}/deactivate`);
}

export function deleteMerchant(id: number): ApiPromise<boolean> {
  return request.delete(`/api/merchant/${id}`);
}

export function getChannelCatalog(): ApiPromise<PaymentMethodGuide[]> {
  return request.get("/api/channel/catalog");
}

export function getProviderOptions(channelType: string): ApiPromise<ProviderSpiOption[]> {
  return request.get("/api/channel/provider-options", {
    params: { channelType },
  });
}

export function getMerchantChannels(merchantId: number, params?: Record<string, unknown>): ApiPromise<MerchantChannel[]> {
  return request.get(`/api/channel/merchant/${merchantId}`, { params });
}

export function createChannel(data: ChannelForm): ApiPromise<MerchantChannel> {
  return request.post("/api/channel", data);
}

export function updateChannel(id: number, data: ChannelForm): ApiPromise<MerchantChannel> {
  return request.put(`/api/channel/${id}`, data);
}

export function enableChannel(id: number): ApiPromise<boolean> {
  return request.put(`/api/channel/${id}/enable`);
}

export function disableChannel(id: number): ApiPromise<boolean> {
  return request.put(`/api/channel/${id}/disable`);
}

export function getOrderList(params: Record<string, unknown>): ApiPromise<PageResponse<PaymentOrder>> {
  return request.get("/api/order/list", { params });
}

export function getOrderDetail(id: number): ApiPromise<PaymentOrder> {
  return request.get(`/api/order/${id}`);
}

export function getOrderLogs(id: number): ApiPromise<OrderStateLog[]> {
  return request.get(`/api/order/${id}/logs`);
}

export function createOrder(data: OrderForm): ApiPromise<PaymentOrder> {
  return request.post("/api/order", data);
}

export function payOrder(id: number, data?: OrderPayForm): ApiPromise<PaymentLaunchResult> {
  return request.post(`/api/order/${id}/pay`, data ?? {});
}

export function syncOrder(id: number): ApiPromise<PaymentOrder> {
  return request.post(`/api/order/${id}/sync`);
}

export function startOrderPay(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/pay-start`, data ?? {});
}

export function markOrderPaid(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/pay-success`, data ?? {});
}

export function markOrderPayFail(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/pay-fail`, data ?? {});
}

export function completeOrder(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/complete`, data ?? {});
}

export function cancelOrder(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/cancel`, data ?? {});
}

export function applyRefund(id: number, data: RefundForm): ApiPromise<boolean> {
  return request.post(`/api/order/${id}/refund`, data);
}

export function markRefundSuccess(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/refund-success`, data ?? {});
}

export function markRefundFail(id: number, data?: OrderOperateForm): ApiPromise<boolean> {
  return request.put(`/api/order/${id}/refund-fail`, data ?? {});
}

export function deleteOrder(id: number): ApiPromise<boolean> {
  return request.delete(`/api/order/${id}`);
}

export function getTransactionList(params: Record<string, unknown>): ApiPromise<PageResponse<TransactionRecord>> {
  return request.get("/api/transaction/page", { params });
}
