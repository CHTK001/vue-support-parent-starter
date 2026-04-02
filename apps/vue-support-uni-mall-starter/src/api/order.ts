import { http } from "./http";
import type { OrderEntity, OrderPageEntity } from "../entity/order";
import type { ApiResponse } from "../entity/user";

export interface CreateOrderParams {
  cartItemIds?: string[];
  addressId: string;
  remark?: string;
}

export interface OrderListParams {
  status?: OrderEntity["status"] | "all";
  page?: number;
  pageSize?: number;
}

/** 创建订单 */
export const createOrder = (
  params: CreateOrderParams,
): Promise<ApiResponse<OrderEntity>> =>
  http.post("/api/mall/orders", params as unknown as Record<string, unknown>);

/** 订单列表 */
export const getOrderPage = (
  params: OrderListParams = {},
): Promise<ApiResponse<OrderPageEntity>> =>
  http.get("/api/mall/orders", params as Record<string, unknown>);

/** 订单详情 */
export const getOrderById = (id: string): Promise<ApiResponse<OrderEntity>> =>
  http.get(`/api/mall/orders/${id}`);

/** 取消订单 */
export const cancelOrder = (id: string): Promise<ApiResponse<null>> =>
  http.put(`/api/mall/orders/${id}/cancel`);

/** 确认收货 */
export const confirmReceipt = (id: string): Promise<ApiResponse<null>> =>
  http.put(`/api/mall/orders/${id}/confirm`);

/** 申请退款 */
export const applyRefund = (
  id: string,
  reason: string,
): Promise<ApiResponse<null>> =>
  http.post(`/api/mall/orders/${id}/refund`, { reason });
