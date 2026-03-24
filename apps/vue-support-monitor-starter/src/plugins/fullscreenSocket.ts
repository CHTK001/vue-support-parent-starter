import type { Router } from "vue-router";
import { getGlobalSocket } from "./globalSocket";

export function setupFullscreenSocket(router: Router) {
  router.afterEach(async (to) => {
    if (to?.meta && (to.meta as any).fullScreen) {
      const gs = getGlobalSocket();
      await gs.connect();
      // 只负责建立连接；具体订阅由页面自行按需处理
    }
  });
}


