import axios from "axios";

interface ApiResponse<T> {
  code: string | number;
  msg?: string;
  message?: string;
  data: T;
  timestamp?: number;
}

type ApiPromise<T> = Promise<ApiResponse<T>>;

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
    if (payload?.data && typeof payload.data === "object" && "data" in payload.data && "code" in payload.data) {
      return payload.data;
    }
    return payload;
  },
  (error) => Promise.reject(error),
);

export const getMerchantList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/merchant/list", { params });

export const getMerchantDetail = (id: number): ApiPromise<any> =>
  request.get(`/api/merchant/${id}`);

export const createMerchant = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/merchant", data);

export const updateMerchant = (id: number, data: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/merchant/${id}`, data);

export const activateMerchant = (id: number): ApiPromise<any> =>
  request.put(`/api/merchant/${id}/activate`);

export const deactivateMerchant = (id: number): ApiPromise<any> =>
  request.put(`/api/merchant/${id}/deactivate`);

export const deleteMerchant = (id: number): ApiPromise<any> =>
  request.delete(`/api/merchant/${id}`);

export const getMerchantPaymentConfig = (merchantId: number): ApiPromise<any> =>
  request.get(`/api/merchant/${merchantId}/payment-config`);

export const updateMerchantPaymentConfig = (merchantId: number, data: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/merchant/${merchantId}/payment-config`, data);

export const getMerchantWalletLimit = (merchantId: number): ApiPromise<any> =>
  request.get(`/api/merchant/${merchantId}/wallet-limit`);

export const updateMerchantWalletLimit = (merchantId: number, data: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/merchant/${merchantId}/wallet-limit`, data);

export const getChannelCatalog = (): ApiPromise<any> =>
  request.get("/api/channel/catalog");

export const getProviderOptions = (channelType: string): ApiPromise<any> =>
  request.get("/api/channel/provider-options", { params: { channelType } });

export const getMerchantChannels = (merchantId: number, params?: Record<string, unknown>): ApiPromise<any> =>
  request.get(`/api/channel/merchant/${merchantId}`, { params });

export const createChannel = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/channel", data);

export const updateChannel = (id: number, data: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/channel/${id}`, data);

export const enableChannel = (id: number): ApiPromise<any> =>
  request.put(`/api/channel/${id}/enable`);

export const disableChannel = (id: number): ApiPromise<any> =>
  request.put(`/api/channel/${id}/disable`);

export const deleteChannel = (id: number): ApiPromise<any> =>
  request.delete(`/api/channel/${id}`);

export const getOrderList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/order/list", { params });

export const getOrderDetail = (id: number): ApiPromise<any> =>
  request.get(`/api/order/${id}`);

export const createOrder = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/order", data);

export const getOrderLogs = (id: number): ApiPromise<any> =>
  request.get(`/api/order/${id}/logs`);

export const payOrder = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.post(`/api/order/${id}/pay`, data ?? {});

export const syncOrder = (id: number): ApiPromise<any> =>
  request.post(`/api/order/${id}/sync`);

export const startOrderPay = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/pay-start`, data ?? {});

export const markOrderPaid = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/pay-success`, data ?? {});

export const markOrderPayFail = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/pay-fail`, data ?? {});

export const completeOrder = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/complete`, data ?? {});

export const cancelOrder = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/cancel`, data ?? {});

export const applyRefund = (id: number, data: Record<string, unknown>): ApiPromise<any> =>
  request.post(`/api/order/${id}/refund`, data);

export const markRefundSuccess = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/refund-success`, data ?? {});

export const markRefundFail = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/order/${id}/refund-fail`, data ?? {});

export const deleteOrder = (id: number): ApiPromise<any> =>
  request.delete(`/api/order/${id}`);

export const getRefundList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/refund/page", { params });

export const getRefundDetail = (id: number): ApiPromise<any> =>
  request.get(`/api/refund/${id}`);

export const markRefundOrderSuccess = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/refund/${id}/success`, data ?? {});

export const markRefundOrderFail = (id: number, data?: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/refund/${id}/fail`, data ?? {});

export const getTransactionList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/transaction/page", { params });

export const getWalletAccount = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/wallet/account", { params });

export const rechargeWalletAccount = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/wallet/account/recharge", data);

export const getWalletAccountLogs = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/wallet/account/log/page", { params });

export const createWalletRechargeOrder = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/wallet/order/recharge", data);

export const createWalletTransferOrder = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/wallet/order/transfer", data);

export const createWalletWithdrawOrder = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/wallet/order/withdraw", data);

export const getWalletOrderDetail = (orderNo: string): ApiPromise<any> =>
  request.get(`/api/wallet/order/${orderNo}`);

export const getWalletOrderList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/wallet/order/page", { params });

export const simulateWalletOrderNotify = (orderNo: string, data?: Record<string, unknown>): ApiPromise<any> =>
  request.post(`/api/wallet/order/${orderNo}/simulate-notify`, data ?? {});

export const createWechatPayScoreOrder = (data: Record<string, unknown>): ApiPromise<any> =>
  request.post("/api/wechat/payscore/order", data);

export const getWechatPayScoreDetail = (outOrderNo: string): ApiPromise<any> =>
  request.get(`/api/wechat/payscore/order/${outOrderNo}`);

export const getWechatPayScoreList = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/wechat/payscore/order/page", { params });

export const syncWechatPayScoreOrder = (outOrderNo: string): ApiPromise<any> =>
  request.post(`/api/wechat/payscore/order/${outOrderNo}/sync`);

export const completeWechatPayScoreOrder = (outOrderNo: string, data?: Record<string, unknown>): ApiPromise<any> =>
  request.post(`/api/wechat/payscore/order/${outOrderNo}/complete`, data ?? {});

export const cancelWechatPayScoreOrder = (outOrderNo: string, data?: Record<string, unknown>): ApiPromise<any> =>
  request.post(`/api/wechat/payscore/order/${outOrderNo}/cancel`, data ?? {});

export const getPaymentOpsOverview = (): ApiPromise<any> =>
  request.get("/api/ops/overview");

export const getSchedulerTasks = (): ApiPromise<any> =>
  request.get("/api/ops/scheduler/tasks");

export const updateSchedulerTask = (taskKey: string, data: Record<string, unknown>): ApiPromise<any> =>
  request.put(`/api/ops/scheduler/tasks/${taskKey}`, data);

export const triggerSchedulerTask = (taskKey: string): ApiPromise<any> =>
  request.post(`/api/ops/scheduler/tasks/${taskKey}/trigger`);

export const getNotifyLogs = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/ops/notify/log/page", { params });

export const getNotifyErrors = (params: Record<string, unknown>): ApiPromise<any> =>
  request.get("/api/ops/notify/error/page", { params });

export const retryNotifyError = (id: number): ApiPromise<any> =>
  request.post(`/api/ops/notify/error/${id}/retry`);
