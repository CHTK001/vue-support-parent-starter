# BaseSetting.vue 组件化重构 - 任务文档

## 任务列表

### 第一阶段：确认字体加密区块位置

- [x] T1: 读取 BaseSetting.vue template 中字体加密区块，确认其归属子组件（SettingDisplay 还是单独处理）

### 第二阶段：创建子组件（逐个从 BaseSetting.vue 原文逐行复制）

- [x] T2: 创建 SettingTheme.vue（主题风格 + 主题色 + 主题动画 + 主题皮肤 + 加载动画）
- [x] T3: 创建 SettingLayout.vue（布局模式 + 双栏导航 + 抽屉导航 + 页面宽度 + 布局参数）
- [x] T4: 创建 SettingDisplay.vue（界面显示 + 视觉效果 + 界面元素 + 功能设置 + 性能监控 + 字体加密）
- [x] T5: 创建 SettingMenu.vue（菜单动画 + 新菜单显示）
- [x] T6: 创建 SettingTabs.vue（标签页样式）
- [x] T7: 创建 SettingToolbar.vue（顶部工具栏配置）
- [x] T8: 创建 SettingMessage.vue（消息配置）
- [x] T9: 创建 SettingAiChat.vue（AI 设置）
- [x] T10: 创建 SettingAdvanced.vue（高级设置 + 无障碍 + DevTools + 云同步）

### 第三阶段：改造 BaseSetting.vue

- [x] T11: 在 BaseSetting.vue 中引入所有子组件，替换 template 中对应区块为子组件调用，传入所需 props
- [x] T12: 清理 BaseSetting.vue 中已迁移到子组件的 import（SVG 图标、组件等）

### 第四阶段：验证

- [x] T13: getDiagnostics 检查所有新建子组件和 BaseSetting.vue 无 TS 错误
- [x] T14: 确认 BaseSetting.vue 行数降至 1500 行以内
