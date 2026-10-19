/**
 * ECharts 生命周期小工具
 *
 * 原先每个图表都要手写一遍「init → onMounted 渲染 → resize 监听 → dispose」，
 * 拆成面板后有两个图表组件，重复四份没有意义。
 *
 * <p>每次重画都 dispose 再 init：主题切换后 option 里的颜色是渲染时从 CSS 变量
 * 解析出来的真实值，旧实例上残留的是上一个主题的颜色，重建最省心。</p>
 */
import { onBeforeUnmount, onMounted } from 'vue'
import * as echarts from 'echarts'
import type { Ref } from 'vue'

export function useEchart(
  el: Ref<HTMLElement | null>,
  draw: (chart: echarts.ECharts) => void,
) {
  let chart: echarts.ECharts | null = null

  /** 重建并绘制；容器还没上屏（标签页未激活）时静默跳过 */
  function render() {
    const node = el.value
    if (!node) return
    chart?.dispose()
    chart = echarts.init(node)
    draw(chart)
  }

  function resize() {
    chart?.resize()
  }

  onMounted(() => {
    render()
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resize)
    chart?.dispose()
    chart = null
  })

  return { render }
}
