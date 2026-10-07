/**
 * 三方登录回跳参数启动期快照
 *
 * <p><b>为什么必须在启动期捕获：</b>三方回调由后端 302 到前端
 * {@code origin + pathname}（如 {@code http://host/?redirectParam=...&thirdMsg=...}）。
 * history 模式下初始导航是 {@code /}，路由守卫发现无 token 会
 * {@code return { path: loginPath, replace: true }} —— <b>不携带 query</b>，
 * 等登录组件 onMounted 时 {@code route.query} 与 {@code location.search}
 * 都已被改写清空，参数永远拿不到。因此在模块求值期（ES import 早于
 * createApp / 首次导航）就把参数快照下来，一次性取用。</p>
 *
 * <p>同时兼容 hash 模式：参数可能落在 {@code #/login?xxx} 的 hash query 内，
 * 两处合并解析，先到先得。</p>
 *
 * @since 2026/10/07
 * @author CH
 */

/** 三方回跳参数快照 */
export interface ThirdCallbackParams {
  /** 回调签发的一次性换票凭证（登录成功路径） */
  redirectParam: string;
  /** 回调错误提示（失败路径，跨域回跳 flash 必丢，query 才活着） */
  thirdMsg: string;
  /** 登录成功后的跳转目标（可选） */
  redirect: string;
}

function emptyParams(): ThirdCallbackParams {
  return { redirectParam: "", thirdMsg: "", redirect: "" };
}

function capture(): ThirdCallbackParams {
  if (typeof window === "undefined") {
    return emptyParams();
  }
  const captured = emptyParams();
  try {
    const merged = new URLSearchParams(window.location.search);
    // hash 模式：#/path?a=b 的 query 不在 location.search 里，需单独解析
    const hash = window.location.hash;
    const idx = hash.indexOf("?");
    if (idx >= 0) {
      new URLSearchParams(hash.slice(idx + 1)).forEach((value, key) => {
        if (!merged.has(key)) merged.set(key, value);
      });
    }
    captured.redirectParam = merged.get("redirectParam") || "";
    captured.thirdMsg = merged.get("thirdMsg") || "";
    captured.redirect = merged.get("redirect") || "";
  } catch {
    // 解析异常按无参数处理，绝不阻断应用启动
  }
  return captured;
}

// 模块求值期立即快照：ES import 链在 main.ts 执行 createApp 之前全部完成，
// 早于路由守卫的任何 replace 改写。
let snapshot: ThirdCallbackParams | null = capture();

/**
 * 取出三方回跳参数快照（一次性：首次调用后内部标记为已消费）
 *
 * <p>调用方消费后应自行用 router.replace 剥离 URL 上的残留参数，
 * 避免用户刷新页面时重复提示或重放凭证。</p>
 *
 * @returns 三方回跳参数，无参数时各字段为空串
 */
export function takeThirdCallbackParams(): ThirdCallbackParams {
  const value = snapshot ?? emptyParams();
  snapshot = null;
  return value;
}

/**
 * 预览三方回跳参数（不消费，供测试与调试使用）
 *
 * @returns 三方回跳参数副本
 */
export function peekThirdCallbackParams(): ThirdCallbackParams {
  return { ...(snapshot ?? emptyParams()) };
}
