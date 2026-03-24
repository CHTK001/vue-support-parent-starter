import axios from "axios";
import type {
  ApiResponse,
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantPaymentConfig,
  MerchantWalletLimit,
  MerchantForm,
  OrderForm,
  OrderOperateForm,
  OrderPayForm,
  OrderStateLog,
  PageResponse,
  PaymentNotifyError,
  PaymentNotifyLog,
  PaymentOpsOverview,
  PaymentSchedulerTask,
  PaymentSchedulerTaskUpdateForm,
  PaymentLaunchResult,
  PaymentMethodGuide,
  PaymentOrder,
  ProviderSpiOption,
  RefundForm,
  RefundOperateForm,
  RefundOrder,
  TransactionRecord,
  WalletAccount,
  WalletAccountLog,
  WalletOrderNotifyForm,
  WalletOrder,
  WalletRechargeForm,
  WalletTransferForm,
  WalletWithdrawForm,
  WechatPayScoreCancelForm,
  WechatPayScoreCompleteForm,
  WechatPayScoreCreateForm,
  WechatPayScoreOrder,
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
  (response) => {
    const payload = response.data;
    if (payload && typeof payload === "object" && "data" in payload) {
      const outerData = (payload as { data?: unknown }).data;
      if (
        outerData &&
        typeof outerData === "object" &&
        "data" in outerData &&
        ("code" in outerData || "message" in outerData || "msg" in outerData)
      ) {
        return outerData;
      }
    }
    return payload;
  },
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

export function getMerchantPaymentConfig(merchantId: number): ApiPromise<MerchantPaymentConfig> {
  return request.get(`/api/merchant/${merchantId}/payment-config`);
}

export function updateMerchantPaymentConfig(
  merchantId: number,
  data: MerchantPaymentConfig,
): ApiPromise<MerchantPaymentConfig> {
  return request.put(`/api/merchant/${merchantId}/payment-config`, data);
}

export function getMerchantWalletLimit(merchantId: number): ApiPromise<MerchantWalletLimit> {
  return request.get(`/api/merchant/${merchantId}/wallet-limit`);
}

export function updateMerchantWalletLimit(
  merchantId: number,
  data: MerchantWalletLimit,
): ApiPromise<MerchantWalletLimit> {
  return request.put(`/api/merchant/${merchantId}/wallet-limit`, data);
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

export function deleteChannel(id: number): ApiPromise<boolean> {
  return request.delete(`/api/channel/${id}`);
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

export function getRefundList(params: Record<string, unknown>): ApiPromise<PageResponse<RefundOrder>> {
  return request.get("/api/refund/page", { params });
}

export function getRefundDetail(id: number): ApiPromise<RefundOrder> {
  return request.get(`/api/refund/${id}`);
}

export function markRefundOrderSuccess(id: number, data?: RefundOperateForm): ApiPromise<boolean> {
  return request.put(`/api/refund/${id}/success`, data ?? {});
}

export function markRefundOrderFail(id: number, data?: RefundOperateForm): ApiPromise<boolean> {
  return request.put(`/api/refund/${id}/fail`, data ?? {});
}

export function getPaymentOpsOverview(): ApiPromise<PaymentOpsOverview> {
  return request.get("/api/ops/overview");
}

export function getSchedulerTasks(): ApiPromise<PaymentSchedulerTask[]> {
  return request.get("/api/ops/scheduler/tasks");
}

export function updateSchedulerTask(
  taskKey: string,
  data: PaymentSchedulerTaskUpdateForm,
): ApiPromise<PaymentSchedulerTask> {
  return request.put(`/api/ops/scheduler/tasks/${taskKey}`, data);
}

export function triggerSchedulerTask(taskKey: string): ApiPromise<PaymentSchedulerTask> {
  return request.post(`/api/ops/scheduler/tasks/${taskKey}/trigger`);
}

export function getNotifyLogs(params: Record<string, unknown>): ApiPromise<PageResponse<PaymentNotifyLog>> {
  return request.get("/api/ops/notify/log/page", { params });
}

export function getNotifyErrors(params: Record<string, unknown>): ApiPromise<PageResponse<PaymentNotifyError>> {
  return request.get("/api/ops/notify/error/page", { params });
}

export function retryNotifyError(id: number): ApiPromise<boolean> {
  return request.post(`/api/ops/notify/error/${id}/retry`);
}

export function getWalletOrderList(params: Record<string, unknown>): ApiPromise<PageResponse<WalletOrder>> {
  return request.get("/api/wallet/order/page", { params });
}

export function getWalletAccount(params: {
  merchantId: number;
  userId: number;
}): ApiPromise<WalletAccount> {
  return request.get("/api/wallet/account", { params });
}

export function rechargeWalletAccount(data: WalletRechargeForm): ApiPromise<WalletAccount> {
  return request.post("/api/wallet/account/recharge", data);
}

export function getWalletAccountLogs(params: Record<string, unknown>): ApiPromise<PageResponse<WalletAccountLog>> {
  return request.get("/api/wallet/account/log/page", { params });
}

export function getWalletOrderDetail(orderNo: string): ApiPromise<WalletOrder> {
  return request.get(`/api/wallet/order/${orderNo}`);
}

export function createWalletRechargeOrder(data: WalletRechargeForm): ApiPromise<WalletOrder> {
  return request.post("/api/wallet/order/recharge", data);
}

export function createWalletTransferOrder(data: WalletTransferForm): ApiPromise<WalletOrder> {
  return request.post("/api/wallet/order/transfer", data);
}

export function createWalletWithdrawOrder(data: WalletWithdrawForm): ApiPromise<WalletOrder> {
  return request.post("/api/wallet/order/withdraw", data);
}

export function simulateWalletOrderNotify(orderNo: string, data: WalletOrderNotifyForm): ApiPromise<WalletOrder> {
  return request.post(`/api/wallet/order/${orderNo}/simulate-notify`, data);
}

export function getWechatPayScoreList(params: Record<string, unknown>): ApiPromise<PageResponse<WechatPayScoreOrder>> {
  return request.get("/api/wechat/payscore/order/page", { params });
}

export function getWechatPayScoreDetail(outOrderNo: string): ApiPromise<WechatPayScoreOrder> {
  return request.get(`/api/wechat/payscore/order/${outOrderNo}`);
}

export function createWechatPayScoreOrder(data: WechatPayScoreCreateForm): ApiPromise<WechatPayScoreOrder> {
  return request.post("/api/wechat/payscore/order", data);
}

export function syncWechatPayScoreOrder(outOrderNo: string): ApiPromise<WechatPayScoreOrder> {
  return request.post(`/api/wechat/payscore/order/${outOrderNo}/sync`);
}

export function completeWechatPayScoreOrder(
  outOrderNo: string,
  data?: WechatPayScoreCompleteForm,
): ApiPromise<WechatPayScoreOrder> {
  return request.post(`/api/wechat/payscore/order/${outOrderNo}/complete`, data ?? {});
}

export function cancelWechatPayScoreOrder(
  outOrderNo: string,
  data?: WechatPayScoreCancelForm,
): ApiPromise<WechatPayScoreOrder> {
  return request.post(`/api/wechat/payscore/order/${outOrderNo}/cancel`, data ?? {});
}
