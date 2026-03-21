export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

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
  tips: string[];
}

export interface ProviderSpiOption {
  channelType: string;
  extensionName: string;
  defaultOption?: boolean;
  description?: string;
}

export interface PaymentLaunchResult {
  success: boolean;
  tradeNo?: string;
  message?: string;
  payUrl?: string;
  launchType?: string;
  formHtml?: string;
  sdkParams?: Record<string, unknown>;
  paidAmount?: number;
  status?: string;
  rawResponse?: string;
}

export interface PaymentOrder {
  id: number;
  orderNo: string;
  businessOrderNo?: string;
  merchantId: number;
  merchantName?: string;
  channelId?: number;
  channelName?: string;
  userId?: number;
  channelType: string;
  channelSubType?: string;
  orderAmount: number;
  paidAmount?: number;
  refundAmount?: number;
  discountAmount?: number;
  currency?: string;
  status: string;
  statusDesc?: string;
  subject?: string;
  body?: string;
  notifyUrl?: string;
  returnUrl?: string;
  expireTime?: string;
  payTime?: string;
  completeTime?: string;
  refundTime?: string;
  thirdPartyOrderNo?: string;
  remark?: string;
  deleted?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStateLog {
  id: number;
  orderId: number;
  fromState?: string;
  toState: string;
  event: string;
  operator?: string;
  remark?: string;
  createdAt?: string;
}

export interface TransactionRecord {
  id: number;
  transactionNo: string;
  orderId: number;
  orderNo: string;
  merchantId: number;
  channelId?: number;
  transactionType: string;
  amount: number;
  channelType: string;
  thirdPartyTransactionNo?: string;
  status: number;
  requestPayload?: string;
  responsePayload?: string;
  remark?: string;
  createdAt?: string;
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
  walletEnabled: boolean;
  compositeEnabled: boolean;
  autoCloseEnabled: boolean;
  autoCloseMinutes?: number;
  remark?: string;
}

export interface ChannelForm {
  merchantId: number;
  channelType: string;
  channelSubType: string;
  channelName?: string;
  appId?: string;
  merchantNo?: string;
  apiKey?: string;
  privateKey?: string;
  publicKey?: string;
  certPath?: string;
  sandboxMode: number;
  notifyUrl?: string;
  returnUrl?: string;
  onboardingStatus?: string;
  onboardingLink?: string;
  status?: number;
  providerSpi?: string;
  extConfig?: string;
}

export interface OrderForm {
  merchantId: number;
  channelId: number;
  userId?: number;
  businessOrderNo?: string;
  orderAmount: number;
  discountAmount?: number;
  currency?: string;
  subject?: string;
  body?: string;
  notifyUrl?: string;
  returnUrl?: string;
  expireMinutes?: number;
  remark?: string;
}

export interface OrderOperateForm {
  operator?: string;
  remark?: string;
  paidAmount?: number;
  refundAmount?: number;
  thirdPartyOrderNo?: string;
}

export interface OrderPayForm {
  operator?: string;
  payerOpenId?: string;
  clientIp?: string;
  deviceId?: string;
  userAgent?: string;
}

export interface RefundForm {
  refundAmount?: number;
  refundReason?: string;
  operator?: string;
}

export const MerchantStatusMap: Record<number, string> = {
  0: "待审核",
  1: "已激活",
  2: "已停用",
  3: "已注销",
};

export const ChannelTypeMap: Record<string, string> = {
  WECHAT: "微信支付",
  ALIPAY: "支付宝",
  COMPOSITE: "综合支付",
  WALLET: "钱包",
};

export const ChannelStatusMap: Record<number, string> = {
  0: "已禁用",
  1: "已启用",
};

export const OnboardingStatusMap: Record<string, string> = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "开通中",
  COMPLETED: "已开通",
};

export const OrderStatusMap: Record<string, string> = {
  PENDING: "待支付",
  PAYING: "支付中",
  PAID: "已支付",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  FAILED: "支付失败",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
};

export const TransactionStatusMap: Record<number, string> = {
  0: "失败",
  1: "成功",
  2: "处理中",
};

export const ChannelSubTypeOptions: Record<string, Array<{ label: string; value: string }>> = {
  WECHAT: [
    { label: "小程序", value: "MINI_PROGRAM" },
    { label: "JSAPI", value: "JSAPI" },
    { label: "H5", value: "H5" },
    { label: "APP", value: "APP" },
    { label: "Native", value: "NATIVE" },
  ],
  ALIPAY: [
    { label: "电脑网站", value: "WEB" },
    { label: "手机网站", value: "WAP" },
    { label: "APP", value: "APP" },
  ],
  COMPOSITE: [
    { label: "聚合路由", value: "AGGREGATE_ROUTE" },
  ],
  WALLET: [
    { label: "余额钱包", value: "BALANCE" },
  ],
};

const ExecutableChannelKeys = new Set([
  "WECHAT:JSAPI",
  "WECHAT:H5",
  "WECHAT:APP",
  "WECHAT:MINI_PROGRAM",
  "WECHAT:MINIPROGRAM",
  "WECHAT:NATIVE",
  "ALIPAY:WEB",
  "ALIPAY:WAP",
  "ALIPAY:APP",
  "COMPOSITE:AGGREGATE_ROUTE",
  "WALLET:BALANCE",
]);

export function isExecutableChannel(channelType?: string, channelSubType?: string) {
  if (!channelType || !channelSubType) {
    return false;
  }
  return ExecutableChannelKeys.has(`${channelType.toUpperCase()}:${channelSubType.toUpperCase()}`);
}
