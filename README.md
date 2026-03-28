# Vue Support Parent Starter

一个基于Vue 3 + TypeScript的企业级前端项目模板，包含多个子应用和共享组件库。

## 项目结构

```
vue-support-parent-starter/
├── apps/                          # 应用目录
│   ├── vue-support-monitor-starter/  # 监控应用
│   └── ...
├── back/                          # 后端相关
├── docs/                          # 文档
├── layout/                        # 布局组件
├── packages/                      # 共享包
│   ├── components/               # 共享组件库
│   │   ├── ScSearch/            # 搜索组件
│   │   └── ...
│   └── ...
├── pages/                         # 页面模块
│   ├── holiday/                  # 节假日模块
│   └── ...
└── README.md
```

## 特性

- 🚀 **Vue 3 + TypeScript**: 使用最新的Vue 3 Composition API和TypeScript
- 📦 **Monorepo**: 使用monorepo架构管理多个应用和包
- 🎨 **Element Plus**: 基于Element Plus UI组件库
- 🔧 **共享组件**: 提供丰富的共享组件库
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🌐 **国际化**: 支持多语言
- 🔒 **权限控制**: 完整的权限管理系统
- 🧭 **多种导航模式**: 支持纵向、横向、混合、悬停、卡片、双栏等多种导航布局
- 🎭 **多主题支持**: 内置多套精美主题皮肤，支持深度定制的节日主题（如深度定制的万圣节主题），提供一致的视觉体验
- 💅 **Stitch MCP 设计系统**: 集成 Stitch Design System，提供统一的视觉规范、圆角系统、间距标准和动效反馈
- 📱 **全新移动端布局**: 采用 .lay-mobile 独立命名空间，提供 280px 侧滑抽屉与 52px 精简顶部栏，带来原生级触控体验
- ♿ **无障碍支持 (A11y)**: 遵循 WCAG 2.1 AA 标准，确保高对比度、键盘导航和屏幕阅读器友好

## Design System & Accessibility

本项目集成了 Stitch MCP 设计系统，致力于提供美观、易用且无障碍的用户体验。

### 🎨 Stitch Design System
- **色彩系统**: 统一的主色、辅助色和语义色，适配亮色/暗色模式
- **排版**: 规范的字体层级和行高
- **间距**: 基于 8px 网格系统的间距规范
- **圆角**: 统一的组件圆角 (2px/4px/8px/16px)
- **动效**: 平滑的过渡动画和微交互

### ♿ Accessibility (无障碍)
我们致力于让所有人都能无障碍地使用系统：
- **颜色对比度**: 关键交互元素满足 WCAG 2.1 AA 标准 (4.5:1)
- **键盘导航**: 支持全键盘操作
- **语义化标签**: 正确使用 ARIA 属性和 HTML5 语义标签

查看详细报告：
- [无障碍测试报告](docs/ACCESSIBILITY_REPORT.md)
- [交互状态规范文档](docs/INTERACTION_GUIDE.md)

## 主题系统

本项目采用灵活的动态主题架构，支持系统主题、自定义皮肤及节日主题的自动切换。

### 核心特性

- **动态加载**: 使用 `useThemeComponent` Hook 实现主题组件的按需加载，优化首屏性能。
- **节日主题**: 内置节日检测算法 (`detectFestivalTheme`)，在特定日期（如春节、万圣节）自动激活专属主题。
- **样式隔离**: 采用 SCSS 变量与 CSS Modules 结合，确保不同主题间的样式互不干扰。
- **持久化**: 用户的主题偏好会自动保存至本地存储。

### 开发指南

#### 新增主题

1. 在 `layout/default/src/themes` 目录下创建新的主题 SCSS 文件。
2. 在 `layout/default/src/themes/index.ts` 中注册新主题。
3. 如果需要专用组件，请在 `layout/default/src/components/lay-sidebar/components/themes` 下创建对应组件。

#### 使用 `useThemeComponent`

```typescript
import { useThemeComponent } from "/@/hooks/useThemeComponent";

// 动态获取当前主题对应的侧边栏组件
const { component } = useThemeComponent("SidebarItem");
```

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0 或 yarn >= 1.22.0

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 文档导航

- [文档索引](./docs/README.md)
- [vue-monitor 爬虫模块接入文档](./docs/spider-monitor-integration.md)
- [vue-monitor 测试报告（2026-03-28）](./docs/monitor-test-report-20260328.md)
- [单元测试与回归验证说明](./docs/unit-test.md)

## 组件库

### ScSearch 搜索组件

一个功能强大、高度可定制的Vue 3搜索表单组件。

#### 特性

- 🚀 **Vue 3 + TypeScript**: 使用Composition API重构，提供完整的类型支持
- 🎨 **多种控件类型**: 支持输入框、选择器、日期选择器、时间选择器、级联选择器、开关等
- ⚡ **性能优化**: 内置防抖搜索、响应式布局优化
- 🔧 **高度可定制**: 支持自定义验证规则、样式配置
- 📱 **响应式设计**: 完美适配移动端和桌面端
- ♿ **无障碍访问**: 支持键盘导航和屏幕阅读器

#### 基础用法

```vue
<template>
  <ScSearch
    :columns="searchColumns"
    :model-value="searchForm"
    @update:model-value="handleFormChange"
    @search="handleSearch"
    @reset="handleReset"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScSearch, { type SearchFormItem } from '@repo/components/ScSearch'

const searchForm = ref({
  name: '',
  status: '',
  dateRange: []
})

const searchColumns: SearchFormItem[] = [
  {
    prop: 'name',
    label: '用户名',
    type: 'input',
    placeholder: '请输入用户名',
    clearable: true
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    placeholder: '请选择状态',
    clearable: true,
    children: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 }
    ]
  },
  {
    prop: 'dateRange',
    label: '创建时间',
    type: 'daterange',
    placeholder: '请选择时间范围',
    clearable: true,
    valueFormat: 'YYYY-MM-DD'
  }
]

const handleFormChange = (form: Record<string, any>) => {
  searchForm.value = form
}

const handleSearch = (form: Record<string, any>) => {
  console.log('搜索参数:', form)
}

const handleReset = (form: Record<string, any>) => {
  console.log('重置后的表单:', form)
}
</script>
```

#### 支持的表单控件类型

- `input` - 输入框
- `textarea` - 文本域
- `select` - 下拉选择器
- `datepicker` - 日期选择器
- `daterange` - 日期范围选择器
- `time` - 时间选择器
- `timerange` - 时间范围选择器
- `radio` - 单选按钮组
- `checkbox` - 复选框组
- `number` - 数字输入框
- `segmented` - 分段控制器
- `switch` - 开关
- `cascader` - 级联选择器

详细文档请查看: [ScSearch组件文档](./packages/components/ScSearch/README.md)

### MenuNewBadge 菜单新增标识组件

一个用于在菜单项上显示"新增"标识的Vue 3组件，帮助用户快速识别最近添加的菜单项。

#### 特性

- 🚀 **Vue 3 + TypeScript**: 使用Composition API，提供完整的类型支持
- ⏰ **时间控制**: 可配置新菜单标识的显示时间限制
- 🎨 **样式自定义**: 支持多种标识样式和自定义文本
- 🌓 **主题适配**: 支持暗色主题和响应式设计
- ✨ **动画效果**: 包含脉冲动画和光泽效果
- 🔧 **全局配置**: 可通过系统设置全局控制

#### 基础用法

```vue
<template>
  <!-- 基础用法 -->
  <ReMenuNewBadge 
    :createTime="'2025-01-14T10:00:00Z'"
  />
  
  <!-- 自定义样式和文本 -->
  <ReMenuNewBadge 
    :createTime="'2025-01-14T10:00:00Z'"
    type="success"
    customText="最新"
  />
  
  <!-- 强制显示 -->
  <ReMenuNewBadge 
    :createTime="'2025-01-01T00:00:00Z'"
    :forceShow="true"
    type="warning"
    customText="热门"
  />
</template>

<script setup>
import ReMenuNewBadge from "@repo/components/MenuNewBadge";
</script>
```

#### 支持的样式类型

- `default` - 灰色渐变背景
- `primary` - 蓝色渐变背景（默认）
- `success` - 绿色渐变背景
- `warning` - 橙色渐变背景
- `danger` - 红色渐变背景

#### 工具函数

```typescript
import { MenuNewUtils, createNewMenu } from '@repo/utils'

// 检查是否应该显示新增标识
const shouldShow = MenuNewUtils.shouldShowNewBadge('2025-01-14T10:00:00Z')

// 创建带有新增标识的菜单项
const newMenuItem = createNewMenu(
  { path: '/new-feature', name: 'NewFeature', meta: { title: '新功能' } },
  '2025-01-14T10:00:00Z',
  'primary',
  '新增'
)
```

详细文档请查看: [菜单新增标识功能说明](./docs/菜单新增标识功能说明.md)

### ScSwitch 开关组件

一个功能丰富、样式多样的Vue 3开关组件。

#### 特性

- 🎨 **多种布局**: 支持 `default`、`card`、`slider`、`modern` 四种布局样式
- 🚀 **Vue 3 + TypeScript**: 使用Composition API，提供完整的类型支持
- 🎯 **高度可定制**: 支持自定义颜色、图标、文本、尺寸等
- ⚡ **流畅动画**: 内置平滑过渡动画和视觉反馈
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- ♿ **无障碍访问**: 支持键盘操作和屏幕阅读器

#### 基础用法

```vue
<template>
  <!-- 默认布局 -->
  <ScSwitch v-model="switchValue" />
  
  <!-- 卡片布局 -->
  <ScSwitch 
    v-model="switchValue" 
    layout="card" 
    active-text="开启" 
    inactive-text="关闭" 
  />
  
  <!-- 滑块布局 -->
  <ScSwitch 
    v-model="switchValue" 
    layout="slider" 
    active-icon="ep:check" 
    inactive-icon="ep:close" 
  />
  
  <!-- 现代布局 -->
  <ScSwitch 
    v-model="switchValue" 
    layout="modern" 
    active-text="ON" 
    inactive-text="OFF" 
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScSwitch from '@repo/components/ScSwitch'

const switchValue = ref(false)
</script>
```

#### 布局样式

- **default**: 基于Element Plus的默认开关样式
- **card**: 卡片式布局，适合表单场景
- **slider**: 滑块式布局，提供更丰富的视觉效果
- **modern**: 现代化布局，具有渐变背景和阴影效果

#### 主要属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| modelValue | boolean | false | 开关状态 |
| layout | string | 'default' | 布局类型：default/card/slider/modern |
| size | string | 'default' | 尺寸：small/default/large |
| disabled | boolean | false | 是否禁用 |
| loading | boolean | false | 是否加载中 |
| activeText | string | - | 开启时的文字描述 |
| inactiveText | string | - | 关闭时的文字描述 |
| activeIcon | string | - | 开启时的图标 |
| inactiveIcon | string | - | 关闭时的图标 |
| activeColor | string | - | 开启时的背景色 |
| inactiveColor | string | - | 关闭时的背景色 |

详细文档请查看: [ScSwitch组件文档](./packages/components/ScSwitch/README.md)

### ScMessageDialog 实时消息对话框组件

一个功能强大的实时消息对话框组件，支持多种位置、样式配置和交互功能。

#### 特性

- 🚀 **Vue 3 + TypeScript**: 使用Composition API，提供完整的类型支持
- 📍 **多种位置**: 支持四个角落定位（top-left、top-right、bottom-left、bottom-right）
- 🎨 **样式自定义**: 支持自定义宽度、高度、透明度等样式配置
- 📊 **进度监控**: 内置进度条支持，可显示任务执行进度
- 🔄 **自动功能**: 支持自动展开、自动滚动到最新消息
- 📝 **Markdown渲染**: 支持Markdown格式的消息内容渲染
- 🎯 **模板支持**: 支持自定义消息模板和插槽
- ⚡ **实时更新**: 适用于WebSocket实时消息展示

#### 基础用法

```vue
<template>
  <!-- 基础用法 -->
  <ScMessageDialog
    :visible="dialogVisible"
    title="消息监控"
    :data="messages"
    position="top-right"
    width="400px"
    height="300px"
    @close="dialogVisible = false"
  />
  
  <!-- 唯一进度条模式 -->
  <ScMessageDialog
    :visible="progressVisible"
    title="任务进度"
    :data="progressMessages"
    position="bottom-right"
    width="500px"
    height="400px"
    :progress-unique="true"
    @close="progressVisible = false"
  />
  
  <!-- Markdown内容展示 -->
  <ScMessageDialog
    :visible="markdownVisible"
    title="Markdown演示"
    :markdown-content="markdownContent"
    position="top-left"
    width="600px"
    height="450px"
    :enable-markdown="true"
    @close="markdownVisible = false"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ScMessageDialog } from "@repo/components/ScMessageDialog";

const dialogVisible = ref(false)
const progressVisible = ref(false)
const markdownVisible = ref(false)

const messages = ref([
  {
    title: '系统启动',
    message: '系统启动成功',
    time: new Date().toISOString()
  },
  {
    title: '数据同步',
    message: '数据同步完成',
    time: new Date().toISOString(),
    progress: 100
  }
])

const progressMessages = ref([
  {
    title: '任务1',
    message: '正在处理数据...',
    time: new Date().toISOString(),
    progress: 30
  },
  {
    title: '任务2',
    message: '数据处理完成',
    time: new Date().toISOString(),
    progress: 100
  }
])

const markdownContent = ref(`
# 标题

这是一个 **Markdown** 示例。

- 列表项1
- 列表项2

\`\`\`javascript
console.log('Hello World');
\`\`\`
`)
</script>
```

#### 消息数据格式

```typescript
interface DataItem {
  title?: string               // 消息标题
  message?: string             // 消息内容
  time?: string | Date         // 时间戳
  progress?: number            // 进度值（0-100）
  step?: {                     // 步骤进度
    current: number            // 当前步骤
    total: number              // 总步骤数
  }
  [key: string]: any          // 其他自定义字段
}
```

#### 主要属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|---------|
| visible | boolean | false | 对话框显示状态 |
| title | string | '消息' | 对话框标题 |
| content | string | - | 普通文本内容 |
| markdownContent | string | - | Markdown格式内容 |
| data | MessageItem[] | [] | 消息数据数组 |
| position | string | 'bottom-right' | 位置：top-left/top-right/bottom-left/bottom-right |
| width | string\|number | '400px' | 对话框宽度 |
| height | string\|number | '300px' | 对话框高度 |
| opacity | number | 0.95 | 透明度（0-1） |
| defaultCollapsed | boolean | false | 是否默认收缩 |
| autoExpandOnData | boolean | true | 有数据时是否自动展开 |
| autoScroll | boolean | true | 是否自动滚动到底部 |
| stopAutoScrollOnManual | boolean | true | 手动滚动时是否停止自动滚动 |
| **progressUnique** | **boolean** | **true** | **进度条是否唯一显示（仅在底部显示一条进度）** |
| **enableMarkdown** | **boolean** | **false** | **是否启用Markdown解析** |

#### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| close | - | 关闭对话框时触发 |
| message-click | message: MessageItem | 点击消息时触发 |
| clear | - | 清空消息时触发 |

#### 插槽

| 插槽名 | 参数 | 说明 |
|--------|------|------|
| message | { message: MessageItem, index: number } | 自定义消息模板 |
| header | { title: string } | 自定义头部内容 |
| footer | { messages: MessageItem[] } | 自定义底部内容 |

#### 外部方法

通过组件 ref 可以调用以下方法：

| 方法名 | 参数 | 说明 |
|--------|------|------|
| clear | - | 清除所有消息内容 |
| close | - | 关闭对话框 |
| toggleCollapse | - | 切换折叠状态 |
| scrollToBottom | - | 滚动到底部 |

#### 使用场景

- **实时监控**: WebSocket消息实时展示
- **进度跟踪**: 任务执行进度监控
- **系统通知**: 系统状态和通知消息
- **数据同步**: 数据同步过程展示
- **日志查看**: 实时日志信息展示
- **消息管理**: 支持一键清除所有消息内容

详细文档请查看: [ScMessageDialog组件文档](./packages/components/ScMessageDialog/README.md)

## 工具库

### Storage 存储工具

提供多种存储操作方式，包括同步和异步版本，以及支持加密的版本。

#### 特性

- 🔄 **双版本支持**: 同时提供异步（支持加密）和同步（不支持加密）两个版本
- ⚡ **性能优化**: 同步版本无需等待Promise.resolve，直接返回结果
- 🔧 **使用灵活**: 开发者可根据需求选择合适的版本
- 📦 **API一致**: 两个版本提供完全一致的API接口，便于切换
- 🔒 **数据加密**: 异步版本支持WASM数据加密，提供更高的安全性

#### 基础用法

```typescript
// 同步版本 - 无需await
import { syncLocalStorageProxy, syncSessionStorageProxy } from "@repo/utils";

// 存储数据
syncLocalStorageProxy().setItem('key', 'value');
syncSessionStorageProxy().setItem('key', 'value');

// 读取数据
const localValue = syncLocalStorageProxy().getItem('key');
const sessionValue = syncSessionStorageProxy().getItem('key');

// 异步版本 - 需要await
import { localStorageProxy, sessionStorageProxy } from "@repo/utils";

// 存储数据
await localStorageProxy().setItem('key', 'value');
await sessionStorageProxy().setItem('key', 'value');

// 读取数据
const localValue = await localStorageProxy().getItem('key');
const sessionValue = await sessionStorageProxy().getItem('key');
```

#### 选择建议

1. **需要数据加密**: 使用异步版本 `localStorageProxy()` 或 `sessionStorageProxy()`
2. **不需要数据加密且希望简单直接**: 使用同步版本 `syncLocalStorageProxy()` 或 `syncSessionStorageProxy()`
3. **兼容性考虑**: 同步版本在所有环境下都能正常工作，异步版本需要浏览器支持相关API

#### 注意事项

1. 异步版本返回Promise，必须使用await或.then()处理
2. 同步版本不支持加密功能，如需加密请使用异步版本
3. 两种版本的API接口保持一致，便于切换

详细文档请查看: [Storage工具文档](./packages/utils/src/storage/README.md)

## 页面模块

### Holiday 节假日模块

提供节假日数据管理和展示功能。

#### 特性

- 📅 **日历展示**: 基于Element Plus Calendar组件
- 🔄 **数据同步**: 支持节假日数据同步
- 📱 **响应式设计**: 完美适配各种屏幕尺寸
- 🎨 **自定义样式**: 支持自定义节假日样式

#### 访问路径

```
/holiday/index
```

## 路由配置

### 页面路由

项目采用Vue Router进行路由管理，主要路由配置如下：

#### 节假日模块路由
```typescript
{
  path: '/holiday',
  name: 'Holiday',
  children: [
    {
      path: 'index',
      name: 'HolidayIndex',
      component: () => import('@/pages/holiday/index.vue'),
      meta: {
        title: '节假日管理',
        requiresAuth: true
      }
    }
  ]
}
```

#### 视频模块路由
```typescript
{
  path: '/video',
  name: 'Video',
  children: [
    {
      path: 'search',
      name: 'VideoSearch',
      component: () => import('@/pages/video/search.vue'),
      meta: {
        title: '视频搜索',
        requiresAuth: true,
        permissions: ['video:search:view']
      }
    },
    {
      path: 'manage',
      name: 'VideoManage',
      component: () => import('@/pages/video/manage.vue'),
      meta: {
        title: '视频管理',
        requiresAuth: true,
        permissions: ['video:manage:view']
      }
    },
    {
      path: 'config',
      name: 'VideoConfig',
      component: () => import('@/pages/video/config.vue'),
      meta: {
        title: '配置管理',
        requiresAuth: true,
        permissions: ['video:config:view']
      }
    },
    {
      path: 'parse',
      name: 'VideoParse',
      component: () => import('@/pages/video/parse.vue'),
      meta: {
        title: '视频解析',
        requiresAuth: true,
        permissions: ['video:parse:view']
      }
    },
    {
      path: 'analytics',
      name: 'VideoAnalytics',
      component: () => import('@/pages/video/analytics.vue'),
      meta: {
        title: '数据分析',
        requiresAuth: true,
        permissions: ['video:analytics:view']
      }
    },
    {
      path: 'settings',
      name: 'VideoSettings',
      component: () => import('@/pages/video/settings.vue'),
      meta: {
        title: '系统设置',
        requiresAuth: true,
        permissions: ['video:settings:view']
      }
    }
  ]
}
```

#### 监控应用路由
```typescript
{
  path: '/monitor',
  name: 'Monitor',
  children: [
    {
      path: 'webrtc',
      name: 'WebRTCMonitor',
      component: () => import('@/apps/vue-support-monitor-starter/views/webrtc.vue'),
      meta: {
        title: 'WebRTC监控',
        requiresAuth: true
      }
    },
    {
      path: 'room',
      name: 'RoomManage',
      component: () => import('@/apps/vue-support-monitor-starter/views/room.vue'),
      meta: {
        title: '房间管理',
        requiresAuth: true
      }
    }
  ]
}
```

### 路由守卫

项目配置了全局路由守卫，用于权限验证和页面访问控制：

```typescript
// 全局前置守卫
router.beforeEach((to, from, next) => {
  // 检查是否需要登录
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
    return
  }
  
  // 检查权限
  if (to.meta.permissions && !hasPermissions(to.meta.permissions)) {
    next('/403')
    return
  }
  
  next()
})
```

### Video 视频模块

提供完整的视频管理、搜索、解析和播放功能。

#### 特性

- 🔍 **视频搜索**: 支持多条件视频搜索和筛选
- 📹 **视频管理**: 完整的视频CRUD操作
- 🔗 **视频解析**: 支持多平台视频链接解析
- ⚙️ **配置管理**: 灵活的系统配置管理
- 📊 **数据分析**: 视频播放和使用统计分析
- 🎮 **视频播放**: 内置视频播放器支持
- 📱 **响应式设计**: 完美适配各种设备
- 🔒 **权限控制**: 基于角色的权限管理

#### 组件说明：VideoFilter 与 VideoResults

- 目标：在 `/video/manage` 集成筛选条 + 海报网格布局，统一参数与接口。
- 接口：POST `/v1/video/page`（apps/vue-support-vtools-starter/src/api/video.ts -> getVideoList）。

1) VideoFilter 组件

- 用途：提供 类型/年代/地区/语言 多选筛选，支持"全部"快捷逻辑与更多/收起。
- 引用路径：`@/view/video/components/VideoFilter.vue`
- Props
  - `modelValue?: { types: string[]; years: string[]; districts: string[]; languages: string[] }`
  - `autoSearch?: boolean` 默认 true；为 false 时显示"搜索"按钮
- Emits
  - `update:modelValue` 返回与 modelValue 相同结构
  - `filter-change` 筛选改变时触发（autoSearch=true 时自动触发）
  - `search` 当 autoSearch=false，点击确认按钮触发
- 选项来源
  - 类型：`@/view/video/data/categories` → `movieTypes`
  - 年代：`generateYearOptions()` 生成，含"全部"与常用分组
  - 地区/语言：`@/view/video/data/videoOptions`

2) VideoResults 组件

- 用途：卡片网格结果展示，内置排序（推荐/最新上线/最多播放/评分最高）与点击跳转。
- 引用路径：`@/view/video/components/VideoResults.vue`
- Props
  - `url: (params:any)=>PromiseLike<any>` 接口函数（建议传 `getVideoList`）
  - `params?: any` 接口参数对象（见下方映射）
  - `sortBy?: string` 初始排序，默认 `recommend`
  - `total?: number` 可选，外部传入总数
- Emits
  - `sort-change` 参数：`sort: string`
  - `video-click` 参数：`video: any`
  - `data-loaded` 参数：`data: any`（携带 total 时会同步组件内计数）
- 暴露方法
  - `refresh()` 触发内部 ScTable 刷新

3) 参数映射与请求示例

- 过滤器到接口字段的映射（多选使用英文逗号拼接，含"全部"时忽略该维度）：
  - `keyword` → string（关键词，来自顶部输入框）
  - `videoType` → string（由 VideoFilter.types 归一化）
  - `videoYear` → string（由 VideoFilter.years 归一化）
  - `videoDistrict` → string（由 VideoFilter.districts 归一化）
  - `videoLanguage` → string（由 VideoFilter.languages 归一化）
  - `order` → string（与排序一致，`recommend` | `newest` | `videoViews desc` | `videoScore desc`）

- 在页面 <video-manage> 中的典型用法：

```vue
<template>
  <VideoFilter v-model="filters" :autoSearch="true" @filter-change="applyFilters" />
  <VideoResults
    ref="resultsRef"
    :url="getVideoList"
    :params="requestParams"
    :sort-by="sortBy"
    @sort-change="onSortChange"
    @video-click="onVideoClick"
  />
</template>


4) ScTable 期望数据结构（简要）

- 行字段：`videoId` | `videoTitle`/`videoName` | `videoCover` | `videoScore` | `videoViews` | `videoYear` | `videoDistrict` | `videoLanguage` | `videoType`
- 说明：`videoCover` 可为逗号分隔多源；组件内处理 `videoPlatform` 兼容样式；结果卡片封面等比裁剪（2:3）。
```
