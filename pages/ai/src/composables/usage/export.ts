/**
 * 用量看板 · 导出
 *
 * <p>走 `/usage/export` 拿 blob，再触发一次 `<a download>`。为什么不用
 * `window.open(url)`：该接口要带鉴权头，直接开新窗口拿不到 token，只会下回一个
 * 401 的 JSON。这里复用已装配的请求管线（含鉴权拦截器），拿到二进制后本地存盘。</p>
 */

import { ref } from "vue";
import { message } from "@repo/core";
import { usageApi } from "@/services/javaApi";
import type { TimeParams } from "./types";

export function useUsageExport(getTimeParams: () => TimeParams) {
  const exporting = ref(false);

  /** 文件名后缀：连续导几个区间时不会互相覆盖，也省得回头猜是哪个区间 */
  function rangeSuffix(): string {
    const { startTime, endTime } = getTimeParams();
    if (startTime && endTime) return `${startTime.slice(0, 10)}_${endTime.slice(0, 10)}`;
    return "all";
  }

  async function handleExport() {
    if (exporting.value) return;
    exporting.value = true;
    try {
      const res: any = await usageApi.export({ ...getTimeParams() });
      // createClient(unwrap:false) 返回的是 axios 的 body；responseType=blob 时即 Blob。
      // 后端若因鉴权/参数返回 JSON 错误，body 也会是 Blob（type=application/json），
      // 这里读出来当错误处理，避免「下载了一个坏文件却毫无提示」。
      const blob: Blob = res instanceof Blob ? res : new Blob([res]);
      if (blob.type.includes("json")) {
        const text = await blob.text();
        let msg = text;
        try {
          const parsed = JSON.parse(text);
          msg = parsed?.msg || parsed?.message || text;
        } catch { /* 非 JSON 就原样展示 */ }
        throw new Error(msg || "导出失败");
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usage_${rangeSuffix()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // 立刻 revoke 会让部分浏览器来不及读流，延后一拍更稳
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      message.success("导出已开始下载");
    } catch (e: any) {
      message.error("导出失败: " + (e?.message || e));
    } finally {
      exporting.value = false;
    }
  }

  return { exporting, handleExport };
}
