import { http } from "./http";
import type { CategoryEntity, CategoryTreeEntity } from "../entity/category";
import type { ApiResponse } from "../entity/user";

/** 获取分类列表（扁平） */
export const getCategoryList = (): Promise<ApiResponse<CategoryEntity[]>> =>
  http.get("/api/mall/categories");

/** 获取分类树 */
export const getCategoryTree = (): Promise<ApiResponse<CategoryTreeEntity[]>> =>
  http.get("/api/mall/categories/tree");

/** 获取分类详情 */
export const getCategoryById = (id: string): Promise<ApiResponse<CategoryEntity>> =>
  http.get(`/api/mall/categories/${id}`);
