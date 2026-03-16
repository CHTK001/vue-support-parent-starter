# UI/AI 功能增强 - 任务文档

## 第一阶段：SettingAdvanced 拆分（R1）

- [ ] T1: 新建 SettingAdvancedCore.vue（从 SettingAdvanced.vue 逐行复制高级功能区块）
- [ ] T2: 新建 SettingAccessibility.vue（从 SettingAdvanced.vue 逐行复制无障碍区块）
- [ ] T3: 新建 SettingDevTools.vue（从 SettingAdvanced.vue 逐行复制 DevTools 区块）
- [ ] T4: 新建 SettingCloudSync.vue（从 SettingAdvanced.vue 逐行复制云同步区块）
- [ ] T5: 改造 SettingAdvanced.vue 为聚合组件（引入4个子组件，透传 props）
- [ ] T6: getDiagnostics 检查 5 个文件无 TS 错误

## 第二阶段：BaseSetting.vue 组件顺序调整（R2）

- [ ] T7: 调整 BaseSetting.vue template 中组件顺序为：主题→布局→标签页→工具栏→显示→菜单→消息→AI→高级
- [ ] T8: getDiagnostics 检查 BaseSetting.vue 无 TS 错误

## 第三阶段：AI 聊天替换为 web-llm（R3）

- [ ] T9: 新建 webLlmClient.ts（实现 ensureWebLlmLoaded + generateByWebLlm）
- [ ] T10: 修改 aiChatProvider.ts，vendor="hf" 分支改调 webLlmClient
- [ ] T11: 更新 SettingAiChat.vue 的 vendor 标签（"hf"→"WebLLM（本地）"）和模型选项（4个 MLC 模型）
- [ ] T12: 在 layout/default/package.json 中添加 @mlc-ai/web-llm 依赖
- [ ] T13: getDiagnostics 检查 webLlmClient.ts、aiChatProvider.ts、SettingAiChat.vue 无 TS 错误

## 第四阶段：ScWebLLM standalone 模块（R4）

- [ ] T14: 新建 packages/standalone/ScWebLLM/package.json
- [ ] T15: 新建 packages/standalone/ScWebLLM/worker.ts（Transformers.js pipeline Worker）
- [ ] T16: 新建 packages/standalone/ScWebLLM/index.ts（useWebLLM composable）
- [ ] T17: getDiagnostics 检查 ScWebLLM 模块无 TS 错误

## 第五阶段：Heatmap 用户热度功能（R5）

- [ ] T18: 在 packages/config/src/types/config.ts 中新增 HeatmapConfig 接口和 Heatmap 字段
- [ ] T19: 新建 packages/utils/src/heatmap/index.ts（HeatmapTracker 实现）
- [ ] T20: 在 packages/utils/src/index.ts 中导出 heatmap 模块
- [ ] T21: 更新 5 个 app.template.yml，新增 Heatmap 配置节注释
- [ ] T22: getDiagnostics 检查 config.ts、heatmap/index.ts 无 TS 错误
