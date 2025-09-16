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
import { ReMenuNewBadge } from '@repo/components'
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

- 用途：提供 类型/年代/地区/语言 多选筛选，支持“全部”快捷逻辑与更多/收起。
- 引用路径：`@/view/video/components/VideoFilter.vue`
- Props
  - `modelValue?: { types: string[]; years: string[]; districts: string[]; languages: string[] }`
  - `autoSearch?: boolean` 默认 true；为 false 时显示“搜索”按钮
- Emits
  - `update:modelValue` 返回与 modelValue 相同结构
  - `filter-change` 筛选改变时触发（autoSearch=true 时自动触发）
  - `search` 当 autoSearch=false，点击确认按钮触发
- 选项来源
  - 类型：`@/view/video/data/categories` → `movieTypes`
  - 年代：`generateYearOptions()` 生成，含“全部”与常用分组
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

- 过滤器到接口字段的映射（多选使用英文逗号拼接，含“全部”时忽略该维度）：
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