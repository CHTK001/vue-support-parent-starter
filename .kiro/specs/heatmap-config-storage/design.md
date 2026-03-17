# 设计文档：热点配置扩展 + IndexedDB 存储与定时上报

## 现有架构分析

### 已有实现
- `packages/utils/src/heatmap/index.ts`：完整的热力图追踪器，事件采集、缓冲区管理、定时上报均已实现，但存储层使用 **localStorage**
- `packages/utils/src/repo-localforage/index.ts`：基于 localforage 的 IndexedDB 封装，支持过期时间
- `packages/config/src/types/config.ts`：`HeatmapConfig` 接口已有 8 个字段，缺 `show`、`aiAnalysis`、`aiAnalysisUrl`
- `apps/vue-support-hotspot-starter/src/app.yaml`：无 `Heatmap` 配置节

### 改造策略
不新建包，直接在现有 `heatmap/index.ts` 中将存储层从 localStorage 切换为 IndexedDB（localforage），并补充缺失配置字段。

---

## 技术方案

### T1：扩展 HeatmapConfig 类型

文件：`packages/config/src/types/config.ts`

在 `HeatmapConfig` 接口末尾追加：
```ts
/** 是否显示热力图覆盖层（开发调试用，默认 false，生产环境不建议开启） */
show?: boolean;
/** 是否启用 AI 分析（默认 false） */
aiAnalysis?: boolean;
/** AI 分析接口地址（aiAnalysis=true 时生效） */
aiAnalysisUrl?: string;
```

### T2：app.yaml 新增 Heatmap 配置节

文件：`apps/vue-support-hotspot-starter/src/app.yaml`

在文件末尾追加完整注释的 `Heatmap` 配置节：
```yaml
# ===========================================
# 热力图配置（默认不启用）
# ===========================================
# Heatmap:
#   enable: false              # 是否启用热力图追踪（默认: false）
#   show: false                # 是否显示热力图覆盖层（开发调试用，默认: false）
#   sampleRate: 1              # 采样率（0-1），1 表示全量采集
#   reportUrl: ""              # 上报接口地址，为空则仅本地存储
#   pushInterval: 5000         # 推送周期（毫秒，默认: 5000）
#   maxLocalEntries: 1000      # 本地最大存储条数（默认: 1000）
#   trackClick: true           # 是否追踪点击事件
#   trackMouseMove: false      # 是否追踪鼠标移动（数据量大，默认关闭）
#   trackScroll: true          # 是否追踪滚动事件
#   aiAnalysis: false          # 是否启用 AI 分析（默认: false）
#   aiAnalysisUrl: ""          # AI 分析接口地址
```

### T3：heatmap/index.ts 存储层切换为 IndexedDB

文件：`packages/utils/src/heatmap/index.ts`

**改造点**：
1. 引入 `localForage`，创建专用 heatmap store（name: `heatmap-store`，storeName: `entries`）
2. `persist()` 改为异步，调用 `localForage().setItem(STORAGE_KEY, buffer)`
3. `restore()` 改为异步，调用 `localForage().getItem(STORAGE_KEY)`
4. `initHeatmap()` 改为 `async`，await restore() 后再注册监听器
5. `DEFAULTS` 补充 `show: false`、`aiAnalysis: false`、`aiAnalysisUrl: ""`
6. `flushInterval` 字段语义对齐（现有字段名已是 `flushInterval`，app.yaml 注释用 `pushInterval` 作为别名说明）

**IndexedDB 存储方案**：
- 使用独立 localforage 实例（避免与全局 `pure-admin` store 混用）
- key：`__heatmap_entries__`，value：`HeatmapEntry[]`
- 超出 `maxLocalEntries` 时在 `push()` 中截断最旧数据（内存层控制，persist 时写入）

**定时上报流程**：
```
setInterval(flushInterval) → flush()
  ├─ buffer 为空 → return
  ├─ persist() → 写入 IndexedDB
  ├─ reportUrl 为空 → return（仅本地存储）
  └─ fetch(reportUrl, payload)
       ├─ 成功 → buffer=[], 清除 IndexedDB
       └─ 失败 → 保留本地数据，下次重试
```

### T4：DEFAULTS 同步更新

`DEFAULTS` 中补充新字段默认值，确保 `cfg` 类型完整：
```ts
show: false,
aiAnalysis: false,
aiAnalysisUrl: "",
```

---

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `packages/config/src/types/config.ts` | 修改 | HeatmapConfig 追加 3 个字段 |
| `apps/vue-support-hotspot-starter/src/app.yaml` | 修改 | 追加 Heatmap 配置节注释 |
| `packages/utils/src/heatmap/index.ts` | 修改 | 存储层切换为 IndexedDB，补充新字段 |

---

## 不变更内容

- `packages/utils/src/repo-localforage/index.ts`：直接复用，不修改
- 热点视图文件：`initHeatmap()` 调用方式不变，无需改动
- `packages/utils/index.ts`：heatmap 导出已存在，无需改动
