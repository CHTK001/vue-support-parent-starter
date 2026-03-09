// 订单状态枚举
export enum OrderStatus {
  CREATED = 10000,
  PAYING = 20000,
  PAID = 20001,
  CANCELING = 30000,
  CANCELED = 30001,
  REFUNDING = 40000,
  REFUNDED = 40001,
  PARTIAL_REFUNDED = 40002,
  TRANSFERRING = 50000,
  TRANSFERRED = 50001,
  TRANSFER_FAILED = 50002,
  CLOSED = 60000,
  PAY_FAILED = 70000,
  REFUND_FAILED = 70001,
}

// 订单状态描述映射
export const OrderStatusMap: Record<OrderStatus, string> = {
  [OrderStatus.CREATED]: '已创建',
  [OrderStatus.PAYING]: '支付中',
  [OrderStatus.PAID]: '已支付',
  [OrderStatus.CANCELING]: '取消中',
  [OrderStatus.CANCELED]: '已取消',
  [OrderStatus.REFUNDING]: '退款中',
  [OrderStatus.REFUNDED]: '已退款',
  [OrderStatus.PARTIAL_REFUNDED]: '部分退款',
  [OrderStatus.TRANSFERRING]: '转账中',
  [OrderStatus.TRANSFERRED]: '已转账',
  [OrderStatus.TRANSFER_FAILED]: '转账失败',
  [OrderStatus.CLOSED]: '已关闭',
  [OrderStatus.PAY_FAILED]: '支付失败',
  [OrderStatus.REFUND_FAILED]: '退款失败',
};

// 订单实体
export interface Order {
  id?: number;
  orderNo: string;
  userId: string;
  amount: number;
  paidAmount?: number;
  refundAmount?: number;
  subject: string;
  status: OrderStatus;
  thirdOrderNo?: string;
  createTime?: string;
  payTime?: string;
  refundTime?: string;
}

// 支付配置
export interface PaymentConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  certPath?: string;
  notifyUrl: string;
  returnUrl?: string;
  alipayPublicKey?: string;
  sandbox: boolean;
}

// 支付请求
export interface PaymentRequest {
  outTradeNo: string;
  tradeType: string;
  subject: string;
  body?: string;
  totalAmount: number;
  currency?: string;
  expireMinutes?: number;
  openid?: string;
  attach?: string;
  goodsTag?: string;
  extraParams?: Record<string, any>;
}

// 支付响应
export interface PaymentResponse {
  success: boolean;
  errorCode?: string;
  errorMsg?: string;
  outTradeNo?: string;
  codeUrl?: string;
  prepayId?: string;
  mwebUrl?: string;
  appPayParams?: string;
  jsapiPayParams?: string;
  rawData?: string;
}

// 退款请求
export interface RefundRequest {
  outTradeNo: string;
  tradeNo?: string;
  outRefundNo: string;
  totalAmount: number;
  refundAmount: number;
  refundReason?: string;
  notifyUrl?: string;
}

// 退款响应
export interface RefundResponse {
  success: boolean;
  errorCode?: string;
  errorMsg?: string;
  outTradeNo?: string;
  tradeNo?: string;
  outRefundNo?: string;
  refundId?: string;
  refundAmount?: number;
  refundStatus?: string;
  rawData?: string;
}

// 转账请求
export interface TransferRequest {
  outTransferNo: string;
  payeeAccount: string;
  payeeName?: string;
  amount: number;
  description: string;
  remark?: string;
  extraParams?: Record<string, any>;
}

// 转账响应
export interface TransferResponse {
  success: boolean;
  errorCode?: string;
  errorMsg?: string;
  outTransferNo?: string;
  transferId?: string;
  transferStatus?: string;
  amount?: number;
  payeeAccount?: string;
  transferTime?: number;
  rawData?: string;
}

// 商户配置
export interface MerchantConfig {
  id?: number;
  merchantName: string;
  provider: 'wechat' | 'alipay' | 'ijpay';
  appId: string;
  mchId?: string;
  apiKey: string;
  certPath?: string;
  notifyUrl: string;
  returnUrl?: string;
  alipayPublicKey?: string;
  sandbox: boolean;
  enabled: boolean;
  createTime?: string;
  updateTime?: string;
}

// 分页请求
export interface PageRequest {
  page: number;
  pageSize: number;
}

// 分页响应
export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

// API响应
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}
