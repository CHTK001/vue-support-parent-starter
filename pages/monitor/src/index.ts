/**
 * @pages/monitor 包根入口。
 *
 * <p>只做「导出收敛」：把本包的路由工厂与监控侧 API 暴露给宿主 app，
 * 宿主按需深导入（{@code @pages/monitor/src/...}）即可，无需在 app shell 里再抄一份。</p>
 *
 * <p>路由工厂：{@link createMonitorRoutes} / {@link createMonitorManageRoutes}
 * （来自 ./routes，视图与 API 同源）。</p>
 *
 * <p>监控侧 API 桶：./api 聚合了资产 / 告警 / 抓包 / 服务管理 / AI / 在线节点等，
 * 另保留 ./api/monitorApi —— 从监控台 app 搬迁来的完整 API 段（含主机运行时 / 主机画像等），
 * 由宿主深导入使用。</p>
 *
 * @author CH
 * @since 4.0.0.45
 */
export {
  createMonitorRoutes,
  createMonitorManageRoutes,
  type MonitorRoutesOptions,
} from "./routes";