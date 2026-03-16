# BaseSetting.vue 组件化重构 - 需求文档

## 背景

`BaseSetting.vue` 当前是一个 7705 行的超大单文件组件，包含十几个功能区块，维护困难，需要按功能区块拆分为独立子组件。

## 功能范围

### 需要拆分的功能区块（共 9 个子组件）

| 子组件文件名 | 对应区块 |
|---|---|
| `SettingTheme.vue` | 主题风格 + 主题色 + 主题动画 + 主题皮肤 + 加载动画样式 |
| `SettingLayout.vue` | 布局模式 + 双栏导航配置 + 抽屉导航配置 + 页面宽度 + 布局参数 |
| `SettingDisplay.vue` | 界面显示（视觉效果 + 界面元素 + 功能设置 + 性能监控） |
| `SettingMenu.vue` | 菜单设置（菜单动画 + 新菜单显示） |
| `SettingTabs.vue` | 标签页样式 |
| `SettingToolbar.vue` | 顶部工具栏配置 |
| `SettingMessage.vue` | 消息配置 |
| `SettingAiChat.vue` | AI 设置 |
| `SettingAdvanced.vue` | 高级设置（高级功能开关 + 无障碍与缩放 + DevTools + 云同步） |

### 不拆分的部分

- `BaseSetting.vue` 保留：顶层 `<script setup>` 中的 `settings` reactive 对象、所有 handler 函数、`$storage` 读写逻辑、`watch`、`onBeforeMount` 等生命周期
- 子组件通过 `v-model:settings` 或 props + emits 与父组件通信

## 通信方式

子组件统一采用以下模式：

```ts
// 子组件接收
const props = defineProps<{
  settings: typeof import('../BaseSetting.vue').settings  // 实际用具体类型
  // 其他必要 props（如 isDark、layoutTheme 等）
}>()

// 子组件向上通知变更
const emit = defineEmits<{
  (e: 'update:settings', val: typeof props.settings): void
  (e: 'change', key: string, val: unknown): void
}>()
```

实际实现时，`settings` 是 `reactive` 对象，子组件直接接收引用即可（Vue 响应式穿透），无需 emit 回传，只需 emit 触发副作用（如 `emitter.emit`、`storageConfigureChange`）的 handler。

## 验收标准

1. 拆分后 `BaseSetting.vue` 行数降至 1500 行以内
2. 所有子组件 TS 无报错
3. 功能与拆分前完全一致，不丢失任何设置项
4. 子组件放置在 `themes/components/` 目录下
5. 现有已有的子组件（`AiChatAppearanceSetting.vue`、`NewMenuAnimationSelector.vue`、`LoaderStyleSetting.vue`）保持不动，直接在新子组件中引用
