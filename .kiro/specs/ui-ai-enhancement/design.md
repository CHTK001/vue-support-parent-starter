# UI/AI 功能增强设计文档

## 整体架构

本次改造涉及 4 个层次：
1. **设置面板组件层**（layout/default/src/components/lay-setting/themes/）
2. **AI 推理服务层**（layout/default/src/components/lay-ai-chat/services/）
3. **standalone 独立包层**（packages/standalone/ScWebLLM/）
4. **配置与工具层**（packages/config/src/types/ + packages/utils/src/heatmap/）

---

## D1：SettingAdvanced 拆分设计

### 目录结构

```
lay-setting/themes/components/
  SettingAdvanced.vue          # 改为聚合组件（仅引入4个子组件）
  SettingAdvancedCore.vue      # 新建：高级功能开关
  SettingAccessibility.vue     # 新建：无障碍与缩放
  SettingDevTools.vue          # 新建：DevTools 精简版
  SettingCloudSync.vue         # 新建：云同步
```

### 各子组件 Props 设计

**SettingAdvancedCore.vue**
```ts
interface Props {
  settings: Record<string, any>
  minSessionTimeoutMinutes: number
  maxSessionTimeoutMinutes: number
  isDevelopment: boolean
  isTest: boolean
  keepAliveChange: () => void
  stretchSwitchChange: (enabled: boolean) => void
  debugModeChange: (enabled: boolean) => void
  autoLogoutChange: (enabled: boolean) => void
  sessionTimeoutMinutesChange: (value: number) => void
}
```

**SettingAccessibility.vue**
```ts
interface Props {
  settings: Record<string, any>
  screenReaderModeChange: (enabled: boolean) => void
  highContrastModeChange: (enabled: boolean) => void
  uiScaleChange: (scale: number) => void
}
```

**SettingDevTools.vue**
```ts
interface Props {
  settings: Record<string, any>
  isDevelopment: boolean
  isTest: boolean
  devLiteToolsChange: (enabled: boolean) => void
  devRulerChange: (enabled: boolean) => void
  devGridChange: (enabled: boolean) => void
  devHoverInspectorChange: (enabled: boolean) => void
}
```

**SettingCloudSync.vue**
```ts
interface Props {
  showCloudSync: boolean
  cloudSyncUrl: string
  syncLoading: boolean
  syncToCloud: () => void
  syncFromCloud: () => void
}
```

### 改造后的 SettingAdvanced.vue（聚合）

```vue
<template>
  <div>
    <SettingAdvancedCore v-bind="coreProps" />
    <SettingAccessibility v-bind="accessibilityProps" />
    <SettingDevTools v-if="isDevelopment || isTest" v-bind="devToolsProps" />
    <SettingCloudSync v-if="showCloudSync" v-bind="cloudSyncProps" />
  </div>
</template>
```

原 SettingAdvanced.vue 的所有 Props 保持不变，聚合组件透传给各子组件，外部调用方（BaseSetting.vue）无需修改。

---

## D2：BaseSetting.vue 组件顺序调整

### 调整前后对比

| 位置 | 调整前 | 调整后 |
|------|--------|--------|
| 1 | SettingTheme | SettingTheme |
| 2 | SettingLayout | SettingLayout |
| 3 | SettingDisplay | SettingTabs |
| 4 | SettingMenu | SettingToolbar |
| 5 | SettingTabs | SettingDisplay |
| 6 | SettingToolbar | SettingMenu |
| 7 | SettingMessage | SettingMessage |
| 8 | SettingAiChat | SettingAiChat |
| 9 | SettingAdvanced | SettingAdvanced |

只调整 template 中的组件顺序，不修改任何逻辑。

---

## D3：AI 聊天替换为 @mlc-ai/web-llm

### 文件变更

```
lay-ai-chat/services/
  hfTransformersClient.ts      # 保留（R4 standalone 模块会用到其思路）
  webLlmClient.ts              # 新建：@mlc-ai/web-llm 推理客户端
  aiChatProvider.ts            # 修改：vendor="hf" 分支改调 webLlmClient
```

### webLlmClient.ts 设计

```ts
import { CreateMLCEngine, type MLCEngine } from "@mlc-ai/web-llm"
import type { ChatMessage } from "../types"

// 引擎单例
let engine: MLCEngine | null = null
let loadedModel = ""

// 加载模型（首次或切换模型时）
export async function ensureWebLlmLoaded(
  model: string,
  onProgress?: (progress: number, text: string) => void
): Promise<void>

// 推理入口
export async function generateByWebLlm(
  history: ChatMessage[],
  message: string,
  model?: string
): Promise<string>
```

关键实现细节：
- 使用 `CreateMLCEngine(modelId, { initProgressCallback })` 初始化
- 调用 `engine.chat.completions.create({ messages, stream: false })` 推理
- 模型切换时重新初始化引擎（`engine.unload()` + 重建）
- 推理失败时抛出中文错误信息

### SettingAiChat.vue 模型选项更新

```ts
const aiChatModelOptions = [
  { label: "Llama-3.2-1B（轻量）", value: "Llama-3.2-1B-Instruct-q4f32_1-MLC", ... },
  { label: "Qwen2.5-1.5B（均衡）", value: "Qwen2.5-1.5B-Instruct-q4f32_1-MLC", ... },
  { label: "Qwen2.5-0.5B（极速）", value: "Qwen2.5-0.5B-Instruct-q3f16_1-MLC", ... },
  { label: "TinyLlama-1.1B（1K上下文）", value: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k", ... },
]
```

vendor 选项标签：`"hf"` → 显示为 `"WebLLM（本地）"`

### layout/default/package.json 依赖

新增：`"@mlc-ai/web-llm": "^0.2.x"`（使用最新稳定版）

---

## D4：ScWebLLM standalone 模块设计

### 目录结构

```
packages/standalone/ScWebLLM/
  package.json      # 依赖 @huggingface/transformers
  index.ts          # 导出 useWebLLM composable
  worker.ts         # Worker 线程：pipeline 推理
```

### package.json

```json
{
  "name": "@repo/scWebLLM",
  "version": "1.0.0",
  "description": "浏览器端 Transformers.js 推理模块",
  "private": true,
  "main": "index.ts",
  "dependencies": {
    "@huggingface/transformers": "^3.x",
    "vue": "catalog:"
  }
}
```

### index.ts — useWebLLM composable

```ts
export interface WebLLMOptions {
  model: string        // HF 模型 ID
  maxNewTokens?: number
  temperature?: number
}

export interface UseWebLLMReturn {
  isLoading: Ref<boolean>
  loadProgress: Ref<number>   // 0-100
  isReady: Ref<boolean>
  error: Ref<string | null>
  load: (model: string) => Promise<void>
  generate: (prompt: string) => Promise<string>
  reset: () => void
}

export function useWebLLM(options?: WebLLMOptions): UseWebLLMReturn
```

### worker.ts — Worker 线程

使用 `@huggingface/transformers` 的 `pipeline('text-generation', modelId)` 实现，与现有 `transformers.worker.ts` 逻辑一致，但作为独立模块存在。

消息协议（与现有 Worker 保持一致）：
- `{ type: "load", id, payload: { model } }` → `{ type: "loaded", id }`
- `{ type: "generate", id, payload: { prompt, maxNewTokens, temperature } }` → `{ type: "result", id, payload: { result } }`
- `{ type: "progress", id, payload: { status, progress } }` → 进度回调

### 支持的模型映射

| 配置 ID | HF 模型 ID |
|---------|-----------|
| `Llama-3.2-1B-Instruct-q4f32_1-MLC` | `onnx-community/Llama-3.2-1B-Instruct` |
| `Qwen2.5-1.5B-Instruct-q4f32_1-MLC` | `Qwen/Qwen2.5-1.5B-Instruct` |
| `Qwen2.5-0.5B-Instruct-q3f16_1-MLC` | `Qwen/Qwen2.5-0.5B-Instruct` |
| `TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k` | `TinyLlama/TinyLlama-1.1B-Chat-v1.0` |

---

## D5：Heatmap 用户热度功能设计

### 配置类型（packages/config/src/types/config.ts）

```ts
export interface HeatmapConfig {
  enable?: boolean          // 是否启用
  mode?: "auto" | "basic" | "ai"  // auto=自动检测 | basic=纯事件 | ai=AI增强
  reportUrl?: string        // 上报地址（空则仅本地）
  sampleRate?: number       // 采样率 0.0-1.0
  trackClick?: boolean
  trackScroll?: boolean
  trackHover?: boolean      // 性能敏感，默认 false
  trackInput?: boolean      // 隐私敏感，默认 false
  aiEnhanced?: boolean      // AI 环境下语义分析
  aiModel?: string          // 空则用 aiChatModel
  storageKey?: string
  maxEvents?: number
}
```

在 `PlatformConfigs` 中新增：`Heatmap?: HeatmapConfig`

### 工具实现（packages/utils/src/heatmap/index.ts）

```ts
class HeatmapTracker {
  private config: HeatmapConfig
  private events: HeatmapEvent[]
  private isAiEnv: boolean   // 检测 aiChatEnabled

  init(config: HeatmapConfig): void
  track(event: HeatmapEvent): void
  flush(): Promise<void>     // 上报到 reportUrl
  getEvents(): HeatmapEvent[]
  clear(): void
}

export interface HeatmapEvent {
  type: "click" | "scroll" | "hover" | "input"
  x?: number
  y?: number
  target?: string            // CSS selector
  path?: string              // 路由路径
  timestamp: number
  meta?: Record<string, any> // AI 增强时附加语义信息
}

export const heatmapTracker = new HeatmapTracker()
export function initHeatmap(config: HeatmapConfig): void
```

### 两种环境下的行为注入

**无 AI 环境（mode=basic 或 aiChatEnabled=false）**：
- 监听 `document` 的 `click`、`scroll` 事件
- 记录坐标、目标元素、路由路径
- 按 `sampleRate` 采样
- 达到 `maxEvents` 时自动 flush

**有 AI 环境（mode=ai 或 aiChatEnabled=true + aiEnhanced=true）**：
- 在 basic 基础上，额外记录用户操作的语义上下文
- 通过 `emitter.on("aiChatMessage")` 监听 AI 对话，关联用户行为序列
- 上报时附加 `meta.aiContext` 字段

### app.template.yml 新增节

```yaml
# ===========================================
# 用户热度（Heatmap）配置
# ===========================================
# Heatmap:
#   enable: false            # 是否启用用户行为采集
#   mode: auto               # auto=自动检测AI环境 | basic=无AI纯事件 | ai=AI增强分析
#   reportUrl: ""            # 数据上报地址（空则仅本地存储）
#   sampleRate: 1.0          # 采样率 0.0-1.0
#   trackClick: true         # 采集点击事件
#   trackScroll: true        # 采集滚动事件
#   trackHover: false        # 采集悬停事件（性能敏感）
#   trackInput: false        # 采集输入事件（隐私敏感，默认关闭）
#   aiEnhanced: false        # AI 环境下启用语义分析增强
#   aiModel: ""              # AI 分析模型（空则使用当前 aiChatModel）
#   storageKey: "heatmap-data"
#   maxEvents: 1000
```

### 涉及的 app.template.yml 文件（5个）

- `apps/vue-support-system-parent/dist/app.template.yml`
- `apps/vue-support-hotspot-starter/dist/app.template.yml`
- `apps/vue-support-monitor-starter/dist/app.template.yml`
- `apps/vue-support-swagger-starter/dist/app.template.yml`
- `apps/vue-support-sync-starter/dist/app.template.yml`

---

## 文件变更清单

| 文件 | 操作 |
|------|------|
| `lay-setting/themes/components/SettingAdvanced.vue` | 改为聚合组件 |
| `lay-setting/themes/components/SettingAdvancedCore.vue` | 新建 |
| `lay-setting/themes/components/SettingAccessibility.vue` | 新建 |
| `lay-setting/themes/components/SettingDevTools.vue` | 新建 |
| `lay-setting/themes/components/SettingCloudSync.vue` | 新建 |
| `lay-setting/themes/BaseSetting.vue` | 调整 template 组件顺序 |
| `lay-ai-chat/services/webLlmClient.ts` | 新建 |
| `lay-ai-chat/services/aiChatProvider.ts` | 修改 hf 分支 |
| `lay-ai-chat/types.ts` | 无需修改（保持 "hf" 兼容） |
| `lay-setting/themes/components/SettingAiChat.vue` | 更新 vendor 标签和模型选项 |
| `layout/default/package.json` | 新增 @mlc-ai/web-llm 依赖 |
| `packages/standalone/ScWebLLM/package.json` | 新建 |
| `packages/standalone/ScWebLLM/index.ts` | 新建 |
| `packages/standalone/ScWebLLM/worker.ts` | 新建 |
| `packages/config/src/types/config.ts` | 新增 HeatmapConfig + Heatmap 字段 |
| `packages/utils/src/heatmap/index.ts` | 新建 |
| `packages/utils/src/index.ts` | 导出 heatmap |
| 5个 `app.template.yml` | 新增 Heatmap 配置节 |
