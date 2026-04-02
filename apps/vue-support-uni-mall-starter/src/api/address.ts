import { http } from "./http";
import type { AddressEntity } from "../entity/order";
import type { ApiResponse } from "../entity/user";

export const getAddressList = (): Promise<ApiResponse<AddressEntity[]>> =>
  http.get("/api/mall/addresses");

export const getDefaultAddress = (): Promise<ApiResponse<AddressEntity>> =>
  http.get("/api/mall/addresses/default");

export const setDefaultAddress = (id: string): Promise<ApiResponse<null>> =>
  http.put(`/api/mall/addresses/${id}/default`);
