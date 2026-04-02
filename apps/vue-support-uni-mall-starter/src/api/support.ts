import { http } from "./http";
import type { SupportCenterEntity } from "../entity/support";
import type { ApiResponse } from "../entity/user";

export const getSupportCenter = (): Promise<ApiResponse<SupportCenterEntity>> =>
  http.get("/api/mall/support");
