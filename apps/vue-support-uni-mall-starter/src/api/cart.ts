import { http } from "./http";
import type { CartSummaryEntity } from "../entity/cart";
import type { ApiResponse } from "../entity/user";

/** 获取购物车 */
export const getCart = (): Promise<ApiResponse<CartSummaryEntity>> =>
  http.get("/api/mall/cart");

/** 加入购物车 */
export const addToCart = (
  productId: string,
  quantity: number,
  skuId?: string,
): Promise<ApiResponse<null>> =>
  http.post("/api/mall/cart/items", { productId, quantity, skuId });

/** 修改购物车数量 */
export const updateCartQuantity = (
  itemId: string,
  quantity: number,
): Promise<ApiResponse<null>> =>
  http.put(`/api/mall/cart/items/${itemId}`, { quantity });

/** 删除购物车条目 */
export const removeCartItem = (itemId: string): Promise<ApiResponse<null>> =>
  http.delete(`/api/mall/cart/items/${itemId}`);

/** 清空购物车 */
export const clearCart = (): Promise<ApiResponse<null>> =>
  http.delete("/api/mall/cart");

/** 切换选中状态 */
export const toggleCartItemSelected = (
  itemId: string,
  selected: boolean,
): Promise<ApiResponse<null>> =>
  http.put(`/api/mall/cart/items/${itemId}/selected`, { selected });
