/**
 * ECharts 生命周期小工具
 *
 * 原先每个图表都要手写一遍「init → onMounted 渲染 → resize 监听 → dispose」，
 * 拆成面板后有两个图表组件，重复四份没有意义。
 *
 * <p>每次重画都 dispose 再 init：主题切换后 option 里的颜色是渲染时从 CSS 变量
 * 解析出来的真实值，旧实例上残留的是上一个主题的颜色，重建最省心。</p>
 *
 * <p><b>echarts 按需加载</b>：整包在 dev 预构建后有 10MB 左右，而抓包页刚打开时
 * 一张图都不画（统计 / 会话流都在会话详情弹层的标签页里，未选会话时根本不渲染）。
 * 之前这里静态 `import * as echarts from 'echarts'`，把整包挂在「抓包分析」菜单的
 * 打开路径上，实测该菜单 2.9s 里 2.6s 是在等 echarts。
 * 改成第一次真正要画图时才 import，菜单打开只剩业务模块。</p>
 */
import { onBeforeUnmount, onMounted } from 'vue'
import type { Ref } from 'vue'

/** 模块级共享同一个加载 Promise，多个图表不会各拉一次 */
let echartsPromise: Promise<typeof import('echarts')> | null = null

function loadEcharts(): Promise<typeof import('echarts')> {
  if (!echartsPromise) {
    echartsPromise = import('echarts')
  }
  return echartsPromise
}

export function useEchart(
  el: Ref<HTMLElement | null>,
  draw: (chart: import('echarts').ECharts) => void,
) {
  let chart: import('echarts').ECharts | null = null
  /** 每次 render 递增；异步回来的旧请求据此丢弃，避免覆盖新图 */
  let ticker = 0
  let disposed = false
  /** 容器尺寸变化监听：详情从弹窗换成全屏抽屉后，图表的可用高度会变，
      只监听 window resize 不够（容器自己变大不会触发 window resize） */
  let observer: ResizeObserver | null = null
  let observed: HTMLElement | null = null

  /** 重建并绘制；容器还没上屏（标签页未激活）时静默跳过 */
  function render() {
    const node = el.value
    if (!node) return
    const tag = ++ticker
    void loadEcharts().then((echarts) => {
      if (disposed || tag !== ticker || !el.value) return
      chart?.dispose()
      chart = echarts.init(el.value)
      draw(chart)
      if (typeof ResizeObserver !== 'undefined') {
        if (!observer) observer = new ResizeObserver(() => chart?.resize())
        if (observed !== el.value) {
          observer.disconnect()
          observer.observe(el.value)
          observed = el.value
        }
      }
    })
  }

  function resize() {
    chart?.resize()
  }

  onMounted(() => {
    render()
    window.addEventListener('resize', resize)
  })

  onBeforeUnmount(() => {
    disposed = true
    window.removeEventListener('resize', resize)
    observer?.disconnect()
    observer = null
    observed = null
    chart?.dispose()
    chart = null
  })

  return { render }
}
