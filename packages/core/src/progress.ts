/**
 * 全局进度条（nprogress 封装）
 *
 * 由 core 统一管理，供路由守卫与 HTTP 请求动画开关使用：
 *  - 路由守卫：beforeEach start / afterEach done
 *  - HTTP：config.http.showLoading 为 true 时 start，响应/错误时 done
 *
 * 注意：nprogress 的 css 是全局注入的，避免在多个包重复引入，
 * 统一在此文件 import 一次即可。
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

export default NProgress;
