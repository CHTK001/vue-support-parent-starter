import { watch, onMounted, onBeforeUnmount } from "vue";
import { useMessageStore } from "@repo/pinia";
import { getConfig } from "@repo/config";

/**
 * 未读消息浏览器标签页闪烁提示。
 *
 * <p>当页面不在焦点且有未读消息时，浏览器标签页标题在原始标题和
 * "【新消息】(n)" 之间周期性闪烁，提醒用户有未读消息。</p>
 *
 * <p>页面获得焦点后自动恢复原始标题并停止闪烁。</p>
 */
export function useUnreadFlash() {
  const messageStore = useMessageStore();

  /** 原始标题（缓存） */
  let originalTitle = "";

  /** 闪烁定时器 */
  let flashTimer: ReturnType<typeof setInterval> | null = null;

  /** 当前是否闪烁中 */
  let flashing = false;

  /** 页面是否可见 */
  let visible = true;

  /** 获取应用标题 */
  function getAppTitle(): string {
    const cfg = getConfig();
    return cfg.app?.title || document.title;
  }

  /**
   * 获取通知标题。
   *
   * @param count 未读数
   * @return 通知标题
   */
  function getNotifyTitle(count: number): string {
    const appTitle = getAppTitle();
    return `【新消息】(${count}) ${appTitle}`;
  }

  /** 开始闪烁 */
  function startFlash(count: number) {
    if (flashing) return;
    flashing = true;
    originalTitle = document.title;

    flashTimer = setInterval(() => {
      if (document.title === originalTitle) {
        document.title = getNotifyTitle(count);
      } else {
        document.title = originalTitle;
      }
    }, 800);
  }

  /** 停止闪烁并恢复标题 */
  function stopFlash() {
    if (flashTimer) {
      clearInterval(flashTimer);
      flashTimer = null;
    }
    flashing = false;
    if (originalTitle) {
      document.title = originalTitle;
    }
  }

  /** 页面可见性变化处理 */
  function onVisibilityChange() {
    visible = !document.hidden;
    if (visible) {
      stopFlash();
    } else {
      checkAndFlash();
    }
  }

  /** 页面获得焦点处理 */
  function onFocus() {
    visible = true;
    stopFlash();
  }

  /** 检查是否需要闪烁 */
  function checkAndFlash() {
    if (visible || messageStore.unread <= 0) {
      return;
    }
    startFlash(messageStore.unread);
  }

  /** 监听未读数的变化 */
  function setupWatcher() {
    watch(
      () => messageStore.unread,
      (count) => {
        if (count > 0 && !visible) {
          startFlash(count);
        } else if (count <= 0) {
          stopFlash();
        }
      },
    );
  }

  onMounted(() => {
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    setupWatcher();
  });

  onBeforeUnmount(() => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("focus", onFocus);
    stopFlash();
  });
}