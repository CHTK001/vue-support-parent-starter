/**
 * useGateway —— 网关管理 composable
 *
 * 统一管理网关状态请求、刷新与踢出操作，供 GatewayManage 页面调用。
 */
import { onMounted, ref, type Ref } from "vue";
import { message } from "@repo/core";
import { fetchGatewayInfo, kickController as kickControllerApi } from "../api/gatewayApi";
import type { GatewayInfo } from "../api/types";

export interface UseGatewayReturn {
  /** 网关完整信息（健康/控制端/被控端） */
  info: Ref<GatewayInfo | null>;
  /** 加载状态 */
  loading: Ref<boolean>;
  /** 错误信息 */
  error: Ref<string | null>;
  /** 拉取网关信息 */
  fetchInfo: () => Promise<void>;
  /** 踢出控制端 */
  kickController: (id: string) => Promise<void>;
}

export function useGateway(): UseGatewayReturn {
  const info = ref<GatewayInfo | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchInfo() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetchGatewayInfo();
      if (res.code === 0 && res.data) {
        info.value = res.data;
      } else {
        error.value = res.msg || "获取网关信息失败";
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : "网络异常";
    } finally {
      loading.value = false;
    }
  }

  async function kickController(id: string) {
    try {
      const res = await kickControllerApi(id);
      if (res.code === 0) {
        message.success("已踢出控制端");
        await fetchInfo();
      } else {
        message.error(res.msg || "踢出失败");
      }
    } catch (e: unknown) {
      message.error(e instanceof Error ? e.message : "网络异常");
    }
  }

  onMounted(fetchInfo);

  return { info, loading, error, fetchInfo, kickController };
}