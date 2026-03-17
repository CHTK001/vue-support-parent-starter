# 任务文档：热点配置扩展 + IndexedDB 存储与定时上报

## T1：扩展 HeatmapConfig 类型
- [ ] 在 `packages/config/src/types/config.ts` 的 `HeatmapConfig` 接口末尾追加 `show`、`aiAnalysis`、`aiAnalysisUrl` 三个字段

## T2：app.yaml 新增 Heatmap 配置节
- [ ] 在 `apps/vue-support-hotspot-starter/src/app.yaml` 末尾追加完整注释的 `Heatmap` 配置节

## T3：heatmap/index.ts 存储层切换为 IndexedDB
- [ ] 引入 `localForage`，创建独立 heatmap store
- [ ] `DEFAULTS` 补充 `show`、`aiAnalysis`、`aiAnalysisUrl` 默认值
- [ ] `persist()` 改为异步，使用 localForage 写入
- [ ] `restore()` 改为异步，使用 localForage 读取
- [ ] `initHeatmap()` 改为 async，await restore() 后再注册监听器
- [ ] `destroyHeatmap()` 改为 async，await persist()

## T4：getDiagnostics 验证
- [ ] 验证 `packages/config/src/types/config.ts`
- [ ] 验证 `packages/utils/src/heatmap/index.ts`
