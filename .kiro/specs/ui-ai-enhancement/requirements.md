# UI/AI 功能增强需求文档

## 背景

对现有设置面板、AI 聊天模块、standalone 包和应用配置进行一批改造，提升组件粒度、AI 推理能力和用户行为分析能力。

---

## 需求列表

### R1：SettingAdvanced 拆分为 4 个独立子组件

**现状**：`SettingAdvanced.vue` 将高级设置、无障碍、DevTools、云同步 4 个区块混在一个文件中。

**目标**：拆分为 4 个独立组件：
- `SettingAdvancedCore.vue` — 高级功能开关（组件缓存、页宽、调试模式、超时退出）
- `SettingAccessibility.vue` — 无障碍与缩放（读屏模式、高对比度、页面缩放）
- `SettingDevTools.vue` — DevTools 精简版（标尺、网格、悬停检查，仅开发/测试环境）
- `SettingCloudSync.vue` — 云同步（上传/下载配置）

**验收标准**：
- 原 `SettingAdvanced.vue` 改为聚合组件，引入上述 4 个子组件
- 每个子组件独立接收所需 props，不依赖父组件内部状态
- TypeScript 无报错

---

### R2：BaseSetting.vue 组件顺序按热度调整

**现状**：组件顺序为 主题→布局→显示→菜单→标签页→工具栏→消息→AI→高级

**目标**：按用户使用热度重新排序（高频在前）：
1. 主题（SettingTheme）— 最常用
2. 布局（SettingLayout）— 高频
3. 标签页（SettingTabs）— 高频
4. 工具栏（SettingToolbar）— 中频
5. 显示（SettingDisplay）— 中频
6. 菜单（SettingMenu）— 中频
7. 消息（SettingMessage）— 低频
8. AI（SettingAiChat）— 低频
9. 高级（SettingAdvanced）— 最低频

**验收标准**：
- `BaseSetting.vue` template 中组件顺序与上述一致
- 视觉渲染顺序正确

---

### R3：AI 聊天替换为 @mlc-ai/web-llm

**现状**：`vendor="hf"` 时使用 Transformers.js（Worker + pipeline）进行浏览器端推理。

**目标**：将 `hf` vendor 的推理实现替换为 `@mlc-ai/web-llm`，保留 `chrome` 和 `other` vendor 不变。

具体变更：
- `hfTransformersClient.ts` → 替换为 `webLlmClient.ts`（使用 `@mlc-ai/web-llm` 的 `CreateMLCEngine`）
- `aiChatProvider.ts` 中 `vendor="hf"` 分支改为调用 `webLlmClient`
- `SettingAiChat.vue` 中 vendor 选项标签从 "Hugging Face" 改为 "WebLLM（本地）"
- 模型选项更新为 web-llm 支持的 MLC 格式模型 ID：
  - `Llama-3.2-1B-Instruct-q4f32_1-MLC`
  - `Qwen2.5-1.5B-Instruct-q4f32_1-MLC`
  - `Qwen2.5-0.5B-Instruct-q3f16_1-MLC`
  - `TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k`
- `AiChatVendor` 类型中 `"hf"` 保持不变（避免破坏已有存储数据）

**验收标准**：
- `@mlc-ai/web-llm` 已添加到 layout/default 的依赖
- `webLlmClient.ts` 实现 `generateByWebLlm(history, message, model)` 接口
- TypeScript 无报错

---

### R4：packages/standalone 新增 ScWebLLM 模块（Transformers.js）

**目标**：在 `packages/standalone/ScWebLLM/` 下创建独立的 Transformers.js 功能模块，供其他项目按需引入。

支持的模型（通过 `@huggingface/transformers` 的 `pipeline`）：
- `Llama-3.2-1B-Instruct-q4f32_1-MLC`（映射到 HF 模型 ID）
- `Qwen2.5-1.5B-Instruct-q4f32_1-MLC`
- `Qwen2.5-0.5B-Instruct-q3f16_1-MLC`
- `TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k`

模块结构：
```
ScWebLLM/
  package.json
  index.ts          # 导出 useWebLLM composable
  index.vue         # 演示组件（可选）
  worker.ts         # Worker 线程（pipeline 推理）
```

**验收标准**：
- `package.json` 中 `@huggingface/transformers` 作为依赖
- `useWebLLM` composable 导出 `load(model)` 和 `generate(prompt)` 方法
- TypeScript 无报错

---

### R5：app.yml 添加用户热度（Heatmap）配置

**目标**：在各 apps 项目的 `app.template.yml` 和 `PlatformConfigs` 类型中新增 `Heatmap` 配置节，支持在有 AI 和无 AI 两种环境下注入用户行为数据，用于热点图分析。

配置结构：
```yaml
Heatmap:
  enable: false              # 是否启用用户行为采集
  mode: auto                 # auto=自动检测AI环境 | basic=无AI纯事件 | ai=AI增强分析
  reportUrl: ""              # 数据上报地址（空则仅本地存储）
  sampleRate: 1.0            # 采样率 0.0-1.0
  trackClick: true           # 采集点击事件
  trackScroll: true          # 采集滚动事件
  trackHover: false          # 采集悬停事件（性能敏感）
  trackInput: false          # 采集输入事件（隐私敏感，默认关闭）
  aiEnhanced: false          # AI 环境下启用语义分析增强
  aiModel: ""                # AI 分析使用的模型（空则使用当前 aiChatModel）
  storageKey: "heatmap-data" # 本地存储键名
  maxEvents: 1000            # 本地最大缓存事件数
```

需要同步更新的文件：
- `packages/config/src/types/config.ts` — 新增 `HeatmapConfig` 接口和 `Heatmap` 字段
- 所有 apps 下的 `dist/app.template.yml` — 新增 Heatmap 配置节注释
- `packages/utils` 或新建 `packages/utils/src/heatmap/index.ts` — 实现行为采集逻辑

**验收标准**：
- `PlatformConfigs.Heatmap` 类型定义完整
- `app.template.yml` 中有完整注释说明
- `heatmap/index.ts` 实现 `init(config)`、`track(event)` 方法
- 在有 AI（`aiChatEnabled=true`）和无 AI 两种环境下均能正常采集
- TypeScript 无报错

---

## 优先级

R1 > R2 > R3 > R4 > R5
