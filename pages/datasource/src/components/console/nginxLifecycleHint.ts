/**
 * 生命周期操作提示文案。
 *
 * <p>这段文字解释「当前状态下该点哪个按钮」，原先写死在
 * {@code NginxLifecycleBar} 里、贴着按钮排；重构后状态带成为整页的状态出口，
 * 提示随之移到状态带上，于是抽到这里供两处共用，避免两份文案各自漂移。</p>
 */

/**
 * 按当前运行状态给出操作提示。
 *
 * @param datasourceId 数据源 ID；未选实例时提示先选
 * @param running      运行状态：RUNNING / STOPPED / UNKNOWN
 * @return 一句可照着做的提示
 */
export function lifecycleHint(datasourceId?: number, running?: string): string {
  if (!datasourceId) {
    return "请先选择数据源";
  }
  if (running === "STOPPED") {
    return "当前已停止：只有「启动」可用，拉起后再校验与重载";
  }
  if (running === "UNKNOWN") {
    return "未检测到运行中的进程（可能是 SSH 用户无权 pgrep）：可先「启动」";
  }
  return "改了配置先「校验」，通过后「重载」生效；「重启」会中断连接";
}
