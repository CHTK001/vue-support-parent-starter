import type { Router } from "vue-router";
import { getGlobalSocketService } from "@repo/core";

export function setupFullscreenSocket(router: Router) {
  router.afterEach(async (to) => {
    if (to?.meta && (to.meta as any).fullScreen) {
      // 确保全局 socket 已连接；具体订阅由页面自行按需处理
      getGlobalSocketService()?.connect();
    }
  });
}
