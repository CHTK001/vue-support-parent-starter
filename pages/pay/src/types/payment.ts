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

export interface RefundOrder {
  id: number;
  refundNo: string;
  orderId: number;
  orderNo: string;
  merchantId: number;
  merchantName?: string;
  channelId?: number;
  channelName?: string;
  sourceOrderStatus?: string;
  sourceOrderStatusDesc?: string;
  thirdPartyRefundNo?: string;
  refundAmount: number;
  status: string;
  statusDesc?: string;
  reason?: string;
  notifyStatus?: number;
  requestPayload?: string;
  responsePayload?: string;
  operator?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MerchantPaymentConfig {
  merchantId: number;
  orderReusable?: boolean;
  orderTimeoutMinutes?: number;
  pendingOrderLimit?: number;
  autoCancelTimeoutOrder?: boolean;
}

export interface MerchantWalletLimit {
  merchantId: number;
  singleRechargeLimit?: number;
  dailyRechargeLimit?: number;
  singleWithdrawLimit?: number;
  dailyWithdrawLimit?: number;
  singleTransferLimit?: number;
  dailyTransferLimit?: number;
  balanceLimit?: number;
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

export interface WalletOrder {
  id: number;
  orderNo: string;
  orderType: string;
  merchantId: number;
  userId?: number;
  relatedUserId?: number;
  amount: number;
  status: string;
  thirdPartyOrderNo?: string;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  requestPayload?: string;
  responsePayload?: string;
  operator?: string;
  remark?: string;
  notifyUrl?: string;
  completedAt?: string;
  createTime?: string;
  updateTime?: string;
}

export interface WalletAccount {
  id: number;
  merchantId: number;
  userId: number;
  availableBalance: number;
  frozenBalance: number;
  status: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletAccountLog {
  id: number;
  merchantId: number;
  userId: number;
  bizType: string;
  bizNo: string;
  changeType: string;
  changeAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  operator?: string;
  remark?: string;
  createdAt?: string;
}

export interface PaymentSchedulerTask {
  taskKey: string;
  taskName: string;
  cronExpression: string;
  enabled: boolean;
  description?: string;
  scheduled: boolean;
  nextExecutionTime?: string;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastRunStatus?: string;
  lastRunMessage?: string;
}

export interface PaymentCallbackAudit {
  callbackType: string;
  callbackName: string;
  recommendedPattern: string;
  scopedIdentifier: string;
  strictScoped: boolean;
  effectivePriority: string;
  notes?: string;
}

export interface PaymentOrderNumberStrategy {
  businessType: string;
  fieldName: string;
  generationRule: string;
  callerOverrideField: string;
  idempotentRule: string;
  notes?: string;
}

export interface PaymentOpsOverview {
  callbackAudits: PaymentCallbackAudit[];
  orderNumberStrategies: PaymentOrderNumberStrategy[];
}

export interface PaymentNotifyLog {
  id: number;
  notifyType: string;
  merchantId?: number;
  channelId?: number;
  channelType?: string;
  channelSubType?: string;
  orderNo?: string;
  refundNo?: string;
  requestBody?: string;
  requestParams?: string;
  processStatus?: string;
  processResult?: string;
  errorMessage?: string;
  retryCount?: number;
  receivedTime?: string;
  processedTime?: string;
}

export interface PaymentNotifyError {
  id: number;
  notifyLogId: number;
  notifyType: string;
  merchantId?: number;
  orderNo?: string;
  refundNo?: string;
  errorType?: string;
  errorMessage?: string;
  retryCount?: number;
  maxRetryCount?: number;
  nextRetryTime?: string;
  status?: string;
  resolvedAt?: string;
  remark?: string;
  createTime?: string;
}

export interface WechatPayScoreOrder {
  id: number;
  merchantId: number;
  channelId: number;
  userId?: number;
  outOrderNo: string;
  serviceOrderNo?: string;
  appId?: string;
  serviceId: string;
  openId: string;
  state: string;
  totalAmount?: number;
  notifyUrl?: string;
  serviceIntroduction?: string;
  startTime?: string;
  endTime?: string;
  finishType?: string;
  reason?: string;
  finishReason?: string;
  packageInfo?: string;
  attach?: string;
  requestPayload?: string;
  responsePayload?: string;
  remark?: string;
  completedAt?: string;
  cancelledAt?: string;
  createTime?: string;
  updateTime?: string;
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

export interface RefundOperateForm {
  operator?: string;
  remark?: string;
  refundAmount?: number;
  thirdPartyRefundNo?: string;
}

export interface WalletRechargeForm {
  merchantId: number;
  userId?: number;
  rechargeNo?: string;
  notifyUrl?: string;
  amount: number;
  operator?: string;
  remark?: string;
}

export interface WalletTransferForm {
  merchantId: number;
  fromUserId?: number;
  toUserId?: number;
  transferNo?: string;
  notifyUrl?: string;
  amount: number;
  operator?: string;
  remark?: string;
}

export interface WalletWithdrawForm {
  merchantId: number;
  userId?: number;
  withdrawNo?: string;
  notifyUrl?: string;
  amount: number;
  bankAccount?: string;
  bankName?: string;
  accountName?: string;
  operator?: string;
  remark?: string;
}

export interface WalletOrderNotifyForm {
  status: string;
  thirdPartyOrderNo?: string;
  payload?: string;
  reason?: string;
}

export interface WechatPayScoreCreateForm {
  merchantId: number;
  channelId: number;
  userId?: number;
  outOrderNo?: string;
  serviceId?: string;
  openId: string;
  totalAmount?: number;
  notifyUrl?: string;
  serviceIntroduction?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  finishType?: string;
  needUserConfirm?: boolean;
  attach?: string;
  postPayments?: Array<Record<string, unknown>>;
  postDiscounts?: Array<Record<string, unknown>>;
  extraParams?: Record<string, unknown>;
  remark?: string;
}

export interface WechatPayScoreCompleteForm {
  totalAmount?: number;
  finishType?: string;
  reason?: string;
  endTime?: string;
  postPayments?: Array<Record<string, unknown>>;
  postDiscounts?: Array<Record<string, unknown>>;
  extraParams?: Record<string, unknown>;
  remark?: string;
}

export interface WechatPayScoreCancelForm {
  reason?: string;
  extraParams?: Record<string, unknown>;
  remark?: string;
}

export interface PaymentSchedulerTaskUpdateForm {
  cronExpression?: string;
  enabled?: boolean;
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

export const WalletOrderTypeMap: Record<string, string> = {
  RECHARGE: "充值",
  TRANSFER: "转账",
  WITHDRAW: "提现",
};

export const WalletOrderStatusMap: Record<string, string> = {
  PENDING: "待处理",
  PROCESSING: "处理中",
  SUCCESS: "成功",
  FAILED: "失败",
};

export const WechatPayScoreStateMap: Record<string, string> = {
  CREATED: "已创建",
  DOING: "服务中",
  COMPLETED: "已完结",
  CANCELED: "已取消",
  CANCELLED: "已取消",
  SUCCESS: "成功",
};

export const SchedulerRunStatusMap: Record<string, string> = {
  NEVER: "未执行",
  RUNNING: "执行中",
  SUCCESS: "成功",
  FAILED: "失败",
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
