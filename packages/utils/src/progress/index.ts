import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({
  // 动画方式 - 使用更平滑的缓动
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
  // 递增进度条的速度 - 加快以提高响应感
  speed: 400,
  // 显示加载图标，提供更明显的视觉反馈
  showSpinner: true,
  // 自动递增间隔 - 缩短以显示更活跃的进度
  trickleSpeed: 150,
  // 初始化时的最小百分比
  minimum: 0.15,
  // 禁用父元素选择，确保进度条始终在顶部
  parent: "body",
});

export default NProgress;
