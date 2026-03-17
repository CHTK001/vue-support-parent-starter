# 任务文档：语音朗读 + 热点工具（热力图覆盖层）

## 任务列表

### T1：BaseSetting.vue 新增 settings 字段和 handler
- [ ] 在 settings reactive 对象中新增 `voiceReadEnabled` 字段（默认 false）
- [ ] 在 settings reactive 对象中新增 `devHeatmap` 字段（默认 false）
- [ ] 新增 `voiceReadEnabledChange(enabled: boolean)` handler 函数
- [ ] 新增 `devHeatmapChange(enabled: boolean)` handler 函数

### T2：SettingAccessibility.vue 新增语音朗读开关
- [ ] Props 新增 `voiceReadEnabledChange: (enabled: boolean) => void`
- [ ] 新增语音朗读开关 ScSwitch（含 speechSynthesis 支持检测，不支持时 disabled）
- [ ] 组件内实现 focus 监听逻辑（attachVoiceRead / detachVoiceRead）
- [ ] watch settings.voiceReadEnabled 控制监听的挂载/卸载
- [ ] onBeforeUnmount 清理监听

### T3：SettingDevTools.vue 新增热点工具开关
- [ ] Props 新增 `devHeatmapChange: (enabled: boolean) => void`
- [ ] 新增热点工具 ScSwitch（仅开发/测试环境显示，已由 v-if 控制）

### T4：SettingAdvanced.vue 透传新增 props
- [ ] Props 新增 `voiceReadEnabledChange`
- [ ] Props 新增 `devHeatmapChange`
- [ ] 模板中透传给 SettingAccessibility 和 SettingDevTools

### T5：BaseSetting.vue 模板透传新增 props
- [ ] SettingAdvanced 组件标签新增 `:voice-read-enabled-change` 绑定
- [ ] SettingAdvanced 组件标签新增 `:dev-heatmap-change` 绑定

### T6：新建 HeatmapOverlay.vue
- [ ] 实现可拖动浮层（mousedown/mousemove/mouseup，默认右下角）
- [ ] 从 $storage.configure 读取 devHeatmap 状态，仅开发/测试环境且开启时显示
- [ ] 实现「热力图展示」切换按钮（heatmapVisible ref）
- [ ] 实现「清除数据」按钮
- [ ] 实现全屏 canvas 覆盖层（pointer-events: none，z-index: 9998）
- [ ] 实现 click 事件监听 + 坐标收集（20px 内合并）
- [ ] 实现 canvas 热力图渲染（径向渐变，蓝→绿→黄→红）
- [ ] watch heatmapVisible 控制监听挂载/卸载
- [ ] onBeforeUnmount 清理所有监听

### T7：index.vue 挂载 HeatmapOverlay
- [ ] import HeatmapOverlay
- [ ] 在 `<LiteInspector />` 后追加 `<HeatmapOverlay />`

### T8：getDiagnostics 验证所有修改文件
- [ ] 验证 SettingAccessibility.vue
- [ ] 验证 SettingDevTools.vue
- [ ] 验证 SettingAdvanced.vue
- [ ] 验证 BaseSetting.vue
- [ ] 验证 HeatmapOverlay.vue
- [ ] 验证 index.vue
