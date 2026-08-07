# ReDialog 弹窗组件

统一的弹窗组件，**三种布局 + headless 无头模式 + 响应式 + 边缘拖拽放大**。

## 三种布局对比

| layout | 渲染方式 | 拖拽移动 | 8 方向缩放 | 最大化 / 全屏 | 半屏 (Aero Snap) | 最小化浮标 | 响应式 | headless 关闭 |
|---|---|---|---|---|---|---|---|---|
| `el` | el-dialog 透传 | ✅ 头部 | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ FAB |
| `modern` | 自渲染（Teleport） | ✅ 头部 | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ FAB |
| `windows` | 自渲染（Teleport） | ✅ 标题栏 | ✅ 8 方向 | ✅ | ✅ 左右 | ✅ 左下角浮标 | ✅ | ✅ FAB |

## Props 新增

| 属性 | 类型 | 默认 | 说明 |
|---|---|---|---|
| `layout` | `"el" \| "modern" \| "windows"` | `"el"` | 布局变体 |
| `headless` | `boolean` | `false` | 无头模式：隐藏 header，**圆心右上角圆形关闭 FAB** 替代（hover 旋 90° + 主色发光） |
| `responsive` | `boolean` | `true` | 启用 @vueuse/core 响应式（移动端自动全屏） |
| `mobileBreakpoint` | `number` | `768` | 移动端断点 |
| `mobileFullscreen` | `boolean` | `true` | 移动端是否自动全屏 |

其他原有属性（`draggable` / `fullscreenable` / `fullscreen` / `showFooter` / `id` / `width` / …）保留。

## Headless 用法

```vue
<ReDialog
  v-model="show"
  layout="modern"
  headless
  :show-footer="false"
  :width="480"
>
  <div class="login-card">
    <h2>欢迎回来</h2>
    <ReInput />
  </div>
</ReDialog>
```

关闭按钮：
- 位置：圆心绝对定位右上角（`top: 12px; right: 12px`）
- 形状：32×32 圆形，半透明白底 + 8px backdrop-filter blur
- 交互：hover 旋转 90° + 主色变红 + 12px 红色发光
- 焦点：3px 主色 ring
- reduced-motion 兜底

## 响应式用法（el/modern）

```vue
<ReDialog
  v-model="show"
  responsive
  :width="'640px'"
  :mobile-breakpoint="768"
  title="详情"
>
  内容...
</ReDialog>
```

> 视口 ≤ mobileBreakpoint → 自动 `100vw × 100vh` 全屏，无须写两套。

## Windows 8 方向缩放

```vue
<ReDialog
  v-model="show"
  layout="windows"
  id="ai-chat"
  title="AI 助手"
  fullscreenable
  :default-width="720"
  :default-height="540"
  :min-width="400"
>
  <AIChat />
</ReDialog>
```

8 方向手柄：
```
  nw —— n —— ne
   |              |
   w       •       e
   |              |
  sw —— s —— se
```

**Aero Snap**：
- 拖到顶部边缘 → 最大化
- 拖到底部边缘 → 最小化（落左下角浮标）
- 拖到左边缘 → 半屏贴左
- 拖到右边缘 → 半屏贴右
- 半屏 / 最大化状态下按住标题栏拖 → 自动恢复可拖尺寸

## 持久化（windows）

`id` 传入后自动 localStorage 记录 `{ x, y, w, h, minimized, maximized, halfSnap, visible }`，key 前缀统一（`getStorageKey('dialog-win:${id}')`）。

## 实现细节

- `composables/useResponsiveDialog.ts`：`@vueuse/core` 的 `useMediaQuery` 监听 4 条媒体查询，返回 `{ width, top, fullscreen, breakpoint, isMobile, elStyle }`
- `CloseFab.vue`：复用 `ReIcon icon="close"`，圆心 FAB，@prefers-reduced-motion 兜底
- Windows 缩放使用 `mousemove/mouseup` 全局监听，每个方向独立 cursor 提示（ns-resize / ew-resize / nesw-resize / nwse-resize）

## Demo 页面

`apps/vue-support-template-starter/src/views/dialog/DialogDemo.vue`
