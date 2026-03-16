# BaseSetting.vue 组件化重构 - 设计文档

## 目录结构

```
themes/
  components/
    AiChatAppearanceSetting.vue   ← 已有，不动
    SettingTheme.vue              ← 新建
    SettingLayout.vue             ← 新建
    SettingDisplay.vue            ← 新建
    SettingMenu.vue               ← 新建
    SettingTabs.vue               ← 新建
    SettingToolbar.vue            ← 新建
    SettingMessage.vue            ← 新建
    SettingAiChat.vue             ← 新建
    SettingAdvanced.vue           ← 新建
  composables/                    ← 已有，不动
  BaseSetting.vue                 ← 保留，大幅瘦身
  BaseSetting.scss
  BaseSetting.global.scss
  LoaderStyleSetting.vue          ← 已有，不动
  Default.vue
  FutureTech.vue
```

## 通信设计

### 核心原则

`settings` 是 `BaseSetting.vue` 中的 `reactive` 对象，Vue 响应式系统保证子组件接收到的是同一个引用，子组件直接修改 `settings.xxx` 即可触发父组件响应，**无需 emit 回传**。

handler 函数（含 `storageConfigureChange`、`emitter.emit` 等副作用）**全部保留在 `BaseSetting.vue`**，通过 props 传入子组件。

### 子组件 Props 模式

```ts
// 每个子组件统一接收以下 props
defineProps<{
  settings: ReturnType<typeof useSettings>   // reactive 对象引用
  // 各组件按需额外接收
}>()
```

### 各子组件额外 Props 清单

| 子组件 | 额外 Props |
|---|---|
| `SettingTheme.vue` | `isDark`, `dataTheme`, `overallStyle`, `layoutTheme`, `themeColors`, `isNonDefaultTheme`, `themeOptions`, `themeAnimationModeOptions`, `handleOverallStyleChange`, `handleSetLayoutThemeColor`, `switchSystemTheme`, `themeAnimationModeChange`, `themeAnimationDirectionChange` |
| `SettingLayout.vue` | `layoutTheme`, `verticalRef`, `horizontalRef`, `mixRef`, `hoverRef`, `mobileRef`, `doubleRef`, `drawerRef`, `setLayoutModel`, `stretchTypeOptions`, `stretchSwitchChange`, `stretchTypeChange`, `contentMarginChange`, `layoutRadiusChange`, `adjustValue`, `handleKeydown`, `handleInput`, `doubleNavExpandModeChange`, `doubleNavAutoExpandAllChange`, `drawerHamburgerPositionChange` |
| `SettingDisplay.vue` | `isDark`, `logoVal`, `cardBodyVal`, `cardColorMode`, `cardColorOptions`, `isPerformanceMonitorVisible`, `fpsMonitorEnabled`, 性能监控相关 refs 和 handlers, `logoChange`, `cardBodyChange`, `onCardColorModeChange`, `greyChange`, `weekChange`, `invertChange`, `monochromeChange`, `showBreadcrumbChange`, `breadcrumbModeChange`, `showTagIconChange`, `hideFooterChange`, `keepAliveChange` |
| `SettingMenu.vue` | `menuAnimationChange`, `transitionTypeChange`, `transitionTypeOptions`, `showNewMenuChange`, `newMenuTextChange`, `newMenuTimeLimitChange`, `newMenuAnimationChange` |
| `SettingTabs.vue` | `isNonDefaultTheme`, `markValue`, `markOptions`, `onChange`, `tagsChange`, `multiTagsCacheChange` |
| `SettingToolbar.vue` | `showSearchChange`, `showFullscreenChange`, `showHeaderClockChange`, `headerClockSecondEnabledChange`, `headerClockSecondTimezoneChange`, `headerClockTimezoneOptions` |
| `SettingMessage.vue` | `showMessageChange`, `messageDropdownPositionChange`, `sendDevDefaultMessage`, `isDevelopment`, `isTest` |
| `SettingAiChat.vue` | `aiChatThemeOptions`, `aiChatPositionOptions`, `aiChatSkinOptions`, `aiChatVendorOptions`, `aiChatModelOptions`, `aiChatEnabledChange`, `aiChatPositionChange`, `aiChatApiKeyChange`, `aiChatApiUrlChange`, `aiChatVendorChange`, `aiChatModelChange`, `aiChatSkinChange` |
| `SettingAdvanced.vue` | `isDevelopment`, `isTest`, `showCloudSync`, `cloudSyncUrl`, `syncLoading`, `syncToCloud`, `syncFromCloud`, `keepAliveChange`, `debugModeChange`, `autoLogoutChange`, `sessionTimeoutMinutesChange`, `screenReaderModeChange`, `highContrastModeChange`, `uiScaleChange`, `devLiteToolsChange`, `devRulerChange`, `devGridChange`, `devHoverInspectorChange`, `MIN_SESSION_TIMEOUT_MINUTES`, `MAX_SESSION_TIMEOUT_MINUTES` |

## BaseSetting.vue 瘦身后结构

拆分后 `BaseSetting.vue` 只保留：

1. 所有 `import`（精简为只引入子组件和必要工具）
2. `settings` reactive 对象定义
3. 所有 handler 函数（`storageConfigureChange`、各 `xxxChange` 函数）
4. `watch`、`onBeforeMount`、`onUnmounted` 生命周期
5. 布局 ref（`verticalRef`、`horizontalRef` 等）
6. computed（`themeOptions`、`markOptions`、`stretchTypeOptions` 等）
7. `<template>` 中只剩 `<LayPanel>` 包裹 9 个子组件的调用

## 样式处理

- `BaseSetting.scss` 中的 `.setting-section`、`.setting-group`、`.setting-item` 等公共样式**保持不动**
- 子组件使用 `scoped` 样式，仅写自身特有样式
- 子组件通过 `:deep()` 或直接使用父级 class 名（因为父级 scss 是 scoped，子组件内的 class 不受影响）

## 字体加密区块

`BaseSetting.vue` 中存在字体加密区块（`fontEncryptionEnabled` 等），需确认其在 template 中的位置后归入 `SettingDisplay.vue` 或单独处理。读取 template 时确认。

## 注意事项

1. 子组件内禁止直接调用 `storageConfigureChange`，统一通过 props 传入的 handler 调用
2. 子组件内禁止直接 `import emitter`，通过 props handler 间接触发
3. `BaseSetting.vue` 中的 `emitter.on("settingResetToDefault")` 等监听保留在父组件
4. `LoaderStyleSetting.vue` 已是独立组件，直接在 `SettingTheme.vue` 中引用
