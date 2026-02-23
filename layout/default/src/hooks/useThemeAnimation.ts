
/**
 * 主题切换动画封装
 * 目前为安全起见，暂时关闭 View Transitions 动画，直接执行回调
 * 避免在部分浏览器 / 路由切换场景下出现递归调用导致的栈溢出
 */
export function useThemeAnimation(callback: () => void, _event?: MouseEvent) {
  callback();
}
