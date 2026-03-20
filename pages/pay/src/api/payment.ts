import { http, type ReturnResult } from "@repo/utils";

export interface PageResponse<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

export interface Merchant {
  id: number;
  merchantNo: string;
  merchantName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessLicense?: string;
  legalPerson?: string;
  defaultNotifyUrl?: string;
  defaultReturnUrl?: string;
  walletEnabled: boolean;
  compositeEnabled: boolean;
  autoCloseEnabled: boolean;
  autoCloseMinutes?: number;
  remark?: string;
  status: number;
  statusDesc?: string;
  channelCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantForm {
  merchantName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessLicense?: string;
  legalPerson?: string;
  defaultNotifyUrl?: string;
  defaultReturnUrl?: string;
  walletEnabled?: boolean;
  compositeEnabled?: boolean;
  autoCloseEnabled?: boolean;
  autoCloseMinutes?: number;
  remark?: string;
}

export interface MerchantChannel {
  id: number;
  merchantId: number;
  merchantName?: string;
  channelType: string;
  channelSubType: string;
  channelName: string;
  appId?: string;
  merchantNo?: string;
  apiKeyConfigured: boolean;
  privateKeyConfigured: boolean;
  publicKeyConfigured: boolean;
  certConfigured: boolean;
  sandboxMode: number;
  notifyUrl?: string;
  returnUrl?: string;
  onboardingStatus: string;
  onboardingStatusDesc?: string;
  onboardingLink?: string;
  status: number;
  statusDesc?: string;
  extConfig?: string;
  providerSpi?: string;
  guideTitle?: string;
  guideUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChannelForm {
  merchantId: number;
  channelType: string;
  channelSubType: string;
  channelName: string;
  appId?: string;
  merchantNo?: string;
  sandboxMode?: number;
  notifyUrl?: string;
  returnUrl?: string;
  providerSpi?: string;
  extConfig?: string;
}

export interface PaymentMethodGuide {
  channelType: string;
  channelSubType: string;
  title: string;
  officialName?: string;
  officialUrl?: string;
  applyUrl?: string;
  sandboxUrl?: string;
  summary?: string;
  defaultProviderSpi?: string;
  availableProviderSpis?: string[];
  requiredMaterials: string[];
  steps: string[];
}

export interface ProviderSpiOption {
  spiClass: string;
  displayName: string;
  description?: string;
}

export interface PaymentOrder {
  id: number;
  orderNo: string;
  merchantId: number;
  merchantName?: string;
  channelType?: string;
  channelSubType?: string;
  subject: string;
  body?: string;
  amount: number;
  currency: string;
  status: string;
  statusDesc?: string;
  payType?: string;
  notifyUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  deviceInfo?: string;
  extParams?: string;
  providerOrderNo?: string;
  providerErrCode?: string;
  providerErrMsg?: string;
  paidAt?: string;
  expiredAt?: string;
  closedAt?: string;
  refundedAmount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderForm {
  merchantId: number;
  channelId?: number;
  subject: string;
  body?: string;
  amount: number;
  currency?: string;
  notifyUrl?: string;
  returnUrl?: string;
  clientIp?: string;
  deviceInfo?: string;
  extParams?: string;
  expireMinutes?: number;
}

export interface OrderPayForm {
  channelId: number;
  payType?: string;
  openId?: string;
  authCode?: string;
  extParams?: string;
}

export interface OrderOperateForm {
  remark?: string;
}

export interface RefundForm {
  refundAmount: number;
  refundReason?: string;
}

export interface PaymentLaunchResult {
  orderNo: string;
  payUrl?: string;
  qrCode?: string;
  appPayParams?: string;
  h5PayUrl?: string;
  formHtml?: string;
  extData?: Record<string, unknown>;
}

export interface TransactionRecord {
  id: number;
  transactionNo: string;
  orderNo: string;
  merchantId: number;
  merchantName?: string;
  channelType?: string;
  amount: number;
  currency: string;
  transactionType: string;
  status: string;
  providerTransactionNo?: string;
  createdAt?: string;
}

export interface OrderStateLog {
  id: number;
  orderId: number;
  fromStatus: string;
  toStatus: string;
  operator?: string;
  remark?: string;
  createdAt?: string;
}

// Merchant APIs
export const getMerchantList = (params: Record<string, unknown>) =>
  http.request<ReturnResult<PageResponse<Merchant>>>("get", "/api/merchant/list", { params });

export const getMerchantDetail = (id: number) =>
  http.request<ReturnResult<Merchant>>("get", `/api/merchant/${id}`);

export const createMerchant = (data: MerchantForm) =>
  http.request<ReturnResult<Merchant>>("post", "/api/merchant", { data });

export const updateMerchant = (id: number, data: MerchantForm) =>
  http.request<ReturnResult<Merchant>>("put", `/api/merchant/${id}`, { data });

export const activateMerchant = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/merchant/${id}/activate`);

export const deactivateMerchant = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/merchant/${id}/deactivate`);

export const deleteMerchant = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/api/merchant/${id}`);

// Channel APIs
export const getChannelCatalog = () =>
  http.request<ReturnResult<PaymentMethodGuide[]>>("get", "/api/channel/catalog");

export const getProviderOptions = (channelType: string) =>
  http.request<ReturnResult<ProviderSpiOption[]>>("get", "/api/channel/provider-options", { params: { channelType } });

export const getMerchantChannels = (merchantId: number, params?: Record<string, unknown>) =>
  http.request<ReturnResult<MerchantChannel[]>>("get", `/api/channel/merchant/${merchantId}`, { params });

export const createChannel = (data: ChannelForm) =>
  http.request<ReturnResult<MerchantChannel>>("post", "/api/channel", { data });

export const updateChannel = (id: number, data: Partial<ChannelForm>) =>
  http.request<ReturnResult<MerchantChannel>>("put", `/api/channel/${id}`, { data });

export const deleteChannel = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/api/channel/${id}`);

export const enableChannel = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/channel/${id}/enable`);

export const disableChannel = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/channel/${id}/disable`);

// Order APIs
export const getOrderList = (params: Record<string, unknown>) =>
  http.request<ReturnResult<PageResponse<PaymentOrder>>>("get", "/api/order/page", { params });

export const getOrderDetail = (id: number) =>
  http.request<ReturnResult<PaymentOrder>>("get", `/api/order/${id}`);

export const createOrder = (data: OrderForm) =>
  http.request<ReturnResult<PaymentOrder>>("post", "/api/order", { data });

export const launchOrderPay = (id: number, data: OrderPayForm) =>
  http.request<ReturnResult<PaymentLaunchResult>>("post", `/api/order/${id}/pay`, { data });

export const getOrderStateLogs = (id: number) =>
  http.request<ReturnResult<OrderStateLog[]>>("get", `/api/order/${id}/state-logs`);

export const closeOrder = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/close`);

export const syncOrder = (id: number) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/sync`);

export const startOrderPay = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/pay-start`, { data: data ?? {} });

export const markOrderPaid = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/pay-success`, { data: data ?? {} });

export const markOrderPayFail = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/pay-fail`, { data: data ?? {} });

export const completeOrder = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/complete`, { data: data ?? {} });

export const cancelOrder = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/cancel`, { data: data ?? {} });

export const applyRefund = (id: number, data: RefundForm) =>
  http.request<ReturnResult<boolean>>("post", `/api/order/${id}/refund`, { data });

export const markRefundSuccess = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/refund-success`, { data: data ?? {} });

export const markRefundFail = (id: number, data?: OrderOperateForm) =>
  http.request<ReturnResult<boolean>>("put", `/api/order/${id}/refund-fail`, { data: data ?? {} });

export const deleteOrder = (id: number) =>
  http.request<ReturnResult<boolean>>("delete", `/api/order/${id}`);

// Transaction APIs
export const getTransactionList = (params: Record<string, unknown>) =>
  http.request<ReturnResult<PageResponse<TransactionRecord>>>("get", "/api/transaction/page", { params });
