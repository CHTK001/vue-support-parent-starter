/**
 * 全局进度条（nprogress 封装）
 *
 * 由 core 统一管理，供路由守卫与 HTTP 请求动画开关使用：
 *  - 路由守卫：beforeEach start / afterEach done
 *  - HTTP：config.http.showLoading 为 true 时 start，响应/错误时 done
 *
 * 注意：
 *  1. nprogress 的 css 是全局注入的，避免在多个包重复引入，
 *     统一在此文件 import 一次即可。
 *  2. nprogress 是全局单例，并发请求下直接 start/done 会互相干扰
 *     （先完成的请求会把进度条提前隐藏）。因此提供引用计数包装
 *     startLoading / doneLoading：计数归零才真正隐藏进度条。
 *     并发场景请一律使用计数版本，避免进度条悬挂或提前消失。
 */
import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  easing: "ease", // 动画方式
  speed: 500, // 递增进度条的速度
  showSpinner: true, // 是否显示加载ico
  trickleSpeed: 200, // 自动递增间隔
  minimum: 0.3, // 初始化时的最小百分比
});

/** 进行中的加载计数（并发请求共享，归零才隐藏进度条） */
let loadingCount = 0;

/** 开始一次加载：计数 +1，首个请求才真正 start */
export function startLoading(): void {
  loadingCount++;
  if (loadingCount === 1) {
    NProgress.start();
  }
}

/** 结束一次加载：计数 -1，归零才真正 done（防并发提前隐藏 / 防多调误隐藏） */
export function doneLoading(): void {
  if (loadingCount <= 0) {
    return;
  }
  loadingCount--;
  if (loadingCount === 0) {
    NProgress.done();
  }
}

/** 强制归零并隐藏（异常兜底，如整页卸载时清理残留进度条） */
export function forceDoneLoading(): void {
  loadingCount = 0;
  NProgress.done();
}

export default NProgress;
