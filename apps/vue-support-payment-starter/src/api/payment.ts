import axios from 'axios';
import type {
  Order,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  TransferRequest,
  TransferResponse,
  MerchantConfig,
  PageRequest,
  PageResponse,
  ApiResponse,
} from '../types/payment';

const request = axios.create({
  baseURL: '/api/payment',
  timeout: 30000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ========== 订单管理 ==========

/**
 * 创建订单并支付
 */
export function createOrderAndPay(order: Partial<Order>, paymentRequest: PaymentRequest) {
  return request.post<ApiResponse<PaymentResponse>>('/order/create-and-pay', {
    order,
    paymentRequest,
  });
}

/**
 * 查询订单列表
 */
export function getOrderList(params: PageRequest & { userId?: string; status?: number }) {
  return request.get<ApiResponse<PageResponse<Order>>>('/order/list', { params });
}

/**
 * 查询订单详情
 */
export function getOrderDetail(orderNo: string) {
  return request.get<ApiResponse<Order>>(`/order/${orderNo}`);
}

/**
 * 查询支付状态
 */
export function queryPaymentStatus(orderNo: string) {
  return request.get<ApiResponse<any>>(`/order/${orderNo}/payment-status`);
}

/**
 * 取消订单
 */
export function cancelOrder(orderNo: string) {
  return request.post<ApiResponse<boolean>>(`/order/${orderNo}/cancel`);
}

/**
 * 申请退款
 */
export function refundOrder(orderNo: string, refundRequest: RefundRequest) {
  return request.post<ApiResponse<RefundResponse>>(`/order/${orderNo}/refund`, refundRequest);
}

/**
 * 查询退款状态
 */
export function queryRefundStatus(orderNo: string, outRefundNo: string) {
  return request.get<ApiResponse<any>>(`/order/${orderNo}/refund/${outRefundNo}`);
}

/**
 * 转账
 */
export function transferOrder(orderNo: string, transferRequest: TransferRequest) {
  return request.post<ApiResponse<TransferResponse>>(`/order/${orderNo}/transfer`, transferRequest);
}

/**
 * 统计订单数量
 */
export function countOrders(params: { userId?: string; status?: number }) {
  return request.get<ApiResponse<number>>('/order/count', { params });
}

/**
 * 统计订单金额
 */
export function sumOrderAmount(params: { userId?: string; status?: number }) {
  return request.get<ApiResponse<number>>('/order/sum-amount', { params });
}

// ========== 商户管理 ==========

/**
 * 获取商户列表
 */
export function getMerchantList(params: PageRequest) {
  return request.get<ApiResponse<PageResponse<MerchantConfig>>>('/merchant/list', { params });
}

/**
 * 获取商户详情
 */
export function getMerchantDetail(id: number) {
  return request.get<ApiResponse<MerchantConfig>>(`/merchant/${id}`);
}

/**
 * 创建商户
 */
export function createMerchant(merchant: Partial<MerchantConfig>) {
  return request.post<ApiResponse<MerchantConfig>>('/merchant', merchant);
}

/**
 * 更新商户
 */
export function updateMerchant(id: number, merchant: Partial<MerchantConfig>) {
  return request.put<ApiResponse<MerchantConfig>>(`/merchant/${id}`, merchant);
}

/**
 * 删除商户
 */
export function deleteMerchant(id: number) {
  return request.delete<ApiResponse<boolean>>(`/merchant/${id}`);
}

/**
 * 测试商户连接
 */
export function testMerchantConnection(id: number) {
  return request.post<ApiResponse<boolean>>(`/merchant/${id}/test`);
}

// ========== 支付管理 ==========

/**
 * 创建支付
 */
export function createPayment(paymentRequest: PaymentRequest) {
  return request.post<ApiResponse<PaymentResponse>>('/payment/create', paymentRequest);
}

/**
 * 查询支付
 */
export function queryPayment(outTradeNo: string) {
  return request.get<ApiResponse<any>>(`/payment/query/${outTradeNo}`);
}

/**
 * 关闭支付
 */
export function closePayment(outTradeNo: string) {
  return request.post<ApiResponse<boolean>>(`/payment/close/${outTradeNo}`);
}

/**
 * 下载对账单
 */
export function downloadBill(billDate: string, billType: string) {
  return request.get<ApiResponse<string>>('/payment/bill', {
    params: { billDate, billType },
  });
}

// ========== 系统配置 ==========

/**
 * 获取系统配置
 */
export function getSystemConfig() {
  return request.get<ApiResponse<any>>('/config');
}

/**
 * 更新系统配置
 */
export function updateSystemConfig(config: any) {
  return request.put<ApiResponse<any>>('/config', config);
}
