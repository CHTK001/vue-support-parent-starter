import { http } from "./http";
import type { ProductEntity, ProductPageEntity } from "../entity/product";
import type { ApiResponse } from "../entity/user";

export interface ProductListParams {
  categoryId?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "price_asc" | "price_desc" | "sales" | "newest";
  featured?: boolean;
}

/** 商品分页列表 */
export const getProductPage = (
  params: ProductListParams = {},
): Promise<ApiResponse<ProductPageEntity>> =>
  http.get("/api/mall/products", params as Record<string, unknown>);

/** 商品详情 */
export const getProductById = (id: string): Promise<ApiResponse<ProductEntity>> =>
  http.get(`/api/mall/products/${id}`);

/** 精选商品 */
export const getFeaturedProducts = (): Promise<ApiResponse<ProductEntity[]>> =>
  http.get("/api/mall/products/featured");

/** 搜索商品 */
export const searchProducts = (
  keyword: string,
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<ProductPageEntity>> =>
  http.get("/api/mall/products/search", { keyword, page, pageSize });
