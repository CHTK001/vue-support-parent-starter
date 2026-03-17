# 需求文档：热点配置扩展 + IndexedDB 存储与定时上报

## 背景

热点应用（vue-support-hotspot-starter）需要支持用户行为热力图功能，包括：
1. `app.yaml` 新增 `Heatmap` 配置节，支持显示开关、推送地址、推送周期、AI 分析等配置
2. 热点数据默认存入 IndexedDB，配置了后端接口后按推送周期定时批量提交

## 功能范围

### F1：扩展 HeatmapConfig 类型

在 `packages/config/src/types/config.ts` 的 `HeatmapConfig` 接口中补充字段：
- `show`：热力图显示开关（开发调试用，默认 false，一般不开启）
- `aiAnalysis`：AI 分析开关（默认 false）
- `aiAnalysisUrl`：AI 分析接口地址（可选）

### F2：app.yaml 新增 Heatmap 配置节

在 `apps/vue-support-hotspot-starter/src/app.yaml` 新增 `Heatmap` 配置节，包含所有字段的注释说明。

### F3：IndexedDB 存储工具类

新建 `packages/heatmap/src/storage.ts`（或在热点应用内），实现：
- `saveHeatmapEntry(entry)`：存入一条热点数据
- `getHeatmapEntries()`：读取所有数据
- `clearHeatmapEntries()`：清空数据
- 超过 `maxLocalEntries` 时自动淘汰最旧数据

### F4：定时上报逻辑

在热点数据采集模块中实现：
- 有 `reportUrl` 时，按 `flushInterval` 毫秒间隔定时批量提交
- 提交成功后清空已提交数据
- 无 `reportUrl` 时仅本地存储，不上报

### F5：热点视图集成

在热点应用的热力图相关视图/组件中集成上述存储和上报逻辑。

## 验收标准

1. `HeatmapConfig` 类型包含 `show`、`aiAnalysis`、`aiAnalysisUrl` 字段
2. `app.yaml` 有完整注释的 `Heatmap` 配置节
3. 热点数据能正确写入 IndexedDB 并读取
4. 配置 `reportUrl` 后，数据按 `flushInterval` 定时上报
5. 未配置 `reportUrl` 时数据仅存 IndexedDB，不发起请求
6. 超过 `maxLocalEntries` 时自动淘汰旧数据
