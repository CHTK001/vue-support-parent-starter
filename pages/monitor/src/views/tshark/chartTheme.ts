/**
 * 图表取色
 *
 * <p>原实现把 `var(--metric-cpu)` 这样的 CSS 变量字符串直接塞进 ECharts 的
 * `itemStyle.color`。ECharts 画的是 canvas，浏览器不会在 canvas 里解析 CSS 变量，
 * 于是所有协议色实际都退化成了默认调色板 —— 饼图和协议列的配色对不上，
 * 而且换暗色主题也不会跟随。</p>
 *
 * <p>这里改成渲染前用 `getComputedStyle` 把变量解析成真实颜色值再交给 ECharts，
 * 因此图表颜色会跟随主题切换（亮/暗色都能取到当次的值）。同时给「不认识的协议」
 * 准备了一组轮转调色板：原实现里未知协议统一落到灰色，十几个协议时几乎分不出来。</p>
 */

export interface ChartTheme {
  font: string
  primary: string
  success: string
  warning: string
  danger: string
  cpu: string
  net: string
  jvm: string
  disk: string
  secondary: string
  tertiary: string
}

/** 读取当前主题下的图表用色（每次渲染时调用，跟随主题切换） */
export function readChartTheme(): ChartTheme {
  const pick = (name: string, fallback: string) => {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || fallback
  }
  return {
    font: "'Inter', -apple-system, 'Segoe UI', sans-serif",
    primary: pick('--el-color-primary', '#1677ff'),
    success: pick('--el-color-success', '#16c916'),
    warning: pick('--el-color-warning', '#ff9730'),
    danger: pick('--el-color-danger', '#ff4c4c'),
    cpu: pick('--metric-cpu', '#3b82f6'),
    net: pick('--metric-net', '#06b6d4'),
    jvm: pick('--metric-jvm', '#14b8a6'),
    disk: pick('--metric-disk', '#f59e0b'),
    secondary: pick('--el-text-color-secondary', '#4e5359'),
    tertiary: pick('--el-text-color-placeholder', '#8d9196'),
  }
}

/**
 * 常见协议的固定色相。
 *
 * 固定而非轮转：TCP 在饼图、协议表和报文列表三处都出现，颜色必须一致，
 * 否则用户没法把「饼图那一块」和「表格那一行」对应起来。
 */
const NAMED: Record<string, keyof ChartTheme> = {
  TCP: 'cpu',
  UDP: 'success',
  HTTP: 'disk',
  HTTPS: 'disk',
  TLS: 'tertiary',
  DNS: 'danger',
  ICMP: 'jvm',
  ARP: 'disk',
  SSH: 'net',
  QUIC: 'secondary',
}

/** 未知协议的轮转调色板（避开上面已用掉的固定色相，减少撞色） */
function palette(t: ChartTheme): string[] {
  return [t.net, t.warning, t.jvm, t.primary, t.success, t.danger, t.cpu, t.disk, t.secondary, t.tertiary]
}

/**
 * 为一批协议生成「协议 → 颜色」映射
 *
 * @param protocols 参与图例的协议名（按展示顺序传入，保证同一批数据每次配色一致）
 */
export function buildProtoColors(protocols: string[], t: ChartTheme): Record<string, string> {
  const ring = palette(t)
  const colors: Record<string, string> = {}
  let cursor = 0
  for (const p of protocols) {
    const key = NAMED[p]
    colors[p] = key ? t[key] : ring[cursor++ % ring.length]
  }
  return colors
}

/** 单个协议的颜色（协议表等零散取色处用） */
export function protoColor(protocol: string, t: ChartTheme): string {
  const key = NAMED[protocol]
  return key ? t[key] : t.tertiary
}
