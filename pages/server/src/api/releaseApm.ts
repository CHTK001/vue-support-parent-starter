/**
 * 发布管理 APM 探测接口。
 *
 * <p>目前只有 SkyWalking OAP 的可达性：agent 配的是 gRPC 端口，查询端是 HTTP，
 * 由后端从 {@code swBackendService} 推 HTTP 地址并探测，前端不做跨域请求。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { http, unwrapResult } from "@repo/utils";

/** SkyWalking OAP 探测结果 */
export interface SkywalkingHealth {
  enabled: boolean;
  reachable?: boolean;
  url?: string;
  status?: number;
  elapsedMs?: number;
  error?: string;
}

/**
 * 探测发布绑定的 SkyWalking OAP。
 *
 * <p>失败按「不可用」处理：状态灯是可选信息，不该让页面因此报错。</p>
 *
 * @param releaseId 发布 ID
 * @returns 探测结果
 */
export const getSkywalkingHealth = async (releaseId: number): Promise<SkywalkingHealth> => {
  try {
    const res = await http()
      .get("/ms/server/release/apm/skywalking/health")
      .query({ releaseId });
    const data = unwrapResult<SkywalkingHealth>(res);
    return data || { enabled: false };
  } catch {
    return { enabled: false };
  }
};
