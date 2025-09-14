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

#### 主要功能模块

##### 1. 视频搜索 (/video/search)
- 支持关键词搜索
- 多维度筛选（分类、来源、格式、时长、评分等）
- 搜索结果展示和排序
- 搜索历史记录
- 热门搜索推荐

##### 2. 视频管理 (/video/manage)
- 视频列表展示和管理
- 视频详情查看和编辑
- 视频上传和导入
- 批量操作支持
- 视频状态管理

##### 3. 视频解析 (/video/parse)
- 支持多平台视频链接解析
- 解析接口管理和配置
- 解析历史记录
- 解析结果缓存
- 解析失败重试机制

##### 4. 配置管理 (/video/config)
- 系统配置参数管理
- 解析接口配置
- 同步配置管理
- 配置导入导出

##### 5. 数据分析 (/video/analytics)
- 视频播放统计
- 用户行为分析
- 系统性能监控
- 数据报表生成

##### 6. 系统设置 (/video/settings)
- 系统参数配置
- 用户权限管理
- 接口配置管理
- 系统维护工具

#### API接口

##### 视频管理接口
```typescript
// 获取视频列表
GET /api/video/list
// 获取视频详情
GET /api/video/detail/:id
// 添加视频
POST /api/video/add
// 更新视频
PUT /api/video/update/:id
// 删除视频
DELETE /api/video/delete/:id
```

##### 视频搜索接口
```typescript
// 搜索视频
POST /api/video/search
// 获取搜索建议
GET /api/video/search/suggestions
// 获取热门搜索
GET /api/video/search/hot
// 获取搜索历史
GET /api/video/search/history
```

##### 视频解析接口
```typescript
// 解析视频链接
POST /api/video/parse
// 获取解析接口列表
GET /api/video/parse/interfaces
// 获取解析历史
GET /api/video/parse/history
```

##### 配置管理接口
```typescript
// 获取配置列表
GET /api/video/config/list
// 获取配置详情
GET /api/video/config/detail/:id
// 更新配置
PUT /api/video/config/update/:id
// 同步配置
POST /api/video/config/sync
```

#### 数据类型定义

##### 视频信息类型
```typescript
interface VideoInfo {
  id: string;                    // 视频ID
  title: string;                 // 视频标题
  description?: string;          // 视频描述
  cover?: string;               // 视频封面
  duration?: number;            // 视频时长（秒）
  size?: number;                // 视频大小（字节）
  format?: string;              // 视频格式
  resolution?: string;          // 视频分辨率
  url: string;                  // 视频URL
  source?: string;              // 视频来源
  category?: string;            // 视频分类
  tags?: string[];              // 视频标签
  status?: VideoStatus;         // 视频状态
  createTime?: string;          // 创建时间
  updateTime?: string;          // 更新时间
}
```

##### 搜索请求参数
```typescript
interface VideoSearchRequest {
  keyword?: string;             // 搜索关键词
  category?: string;            // 视频分类
  source?: string;              // 视频来源
  format?: string;              // 视频格式
  minDuration?: number;         // 最小时长
  maxDuration?: number;         // 最大时长
  minRating?: number;           // 最小评分
  maxRating?: number;           // 最大评分
  status?: VideoStatus;         // 视频状态
  current?: number;             // 当前页码
  size?: number;                // 每页大小
}
```

##### 解析结果类型
```typescript
interface ParseResult {
  success: boolean;             // 解析是否成功
  videoInfo?: VideoInfo;        // 视频信息
  errorMessage?: string;        // 错误信息
  duration: number;             // 解析耗时（毫秒）
  interfaceId: string;          // 使用的接口
  parseTime: string;            // 解析时间
}
```

#### 权限配置

视频模块支持基于角色的权限控制：

- `video:search:view` - 视频搜索查看权限
- `video:manage:view` - 视频管理查看权限
- `video:manage:add` - 视频添加权限
- `video:manage:edit` - 视频编辑权限
- `video:manage:delete` - 视频删除权限
- `video:config:view` - 配置查看权限
- `video:config:edit` - 配置编辑权限
- `video:analytics:view` - 数据分析查看权限
- `video:settings:view` - 系统设置查看权限
- `video:settings:edit` - 系统设置编辑权限

#### 访问路径

```
/video/search          # 视频搜索
/video/manage          # 视频管理
/video/config          # 配置管理
/video/parse           # 视频解析
/video/analytics       # 数据分析
/video/settings        # 系统设置
```

## 应用

### Vue Support Monitor Starter

监控应用，提供系统监控和WebRTC统计功能。

#### 特性

- 📊 **系统监控**: 实时系统状态监控
- 📈 **WebRTC统计**: WebRTC连接和性能统计
- 📋 **房间管理**: WebRTC房间管理功能
- 🔧 **配置管理**: 系统配置管理

## 开发指南

### 代码规范

1. **Java代码规范**:
   - 遵循阿里代码规范
   - 使用Lombok代替Getter/Setter和构造方法
   - 添加完整的注释(作者[CH]、创建时间、版本)
   - 方法需要入参、出参说明和方法说明
   - 重要代码需要添加日志和debug日志
   - SQL语句必须在XML文件中，不允许出现在Java文件中

2. **前端代码规范**:
   - 使用TypeScript进行类型检查
   - 遵循Vue 3 Composition API最佳实践
   - 组件需要添加完整的类型定义
   - 重要功能需要添加注释

### 文档要求

修改/新增功能都要完善项目中的文档(README.MD, CHANGELOG.MD)，必须能够让前端模块能够清晰的了解到新增的功能、接口、参数、说明(包括接口说明,字段说明等)。

### 提交规范

使用约定式提交规范:

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

## 更新日志

### v2.0.0 (2025-01-17)

#### ScSearch组件重大更新

- 🚀 **重大更新**: 从Options API重构为Composition API + TypeScript
- ✨ **新增功能**:
  - 支持时间选择器和时间范围选择器
  - 支持级联选择器
  - 支持开关控件
  - 支持复选框组
  - 添加防抖搜索功能
  - 添加表单验证支持
  - 添加v-model支持
  - 暴露组件方法供外部调用
- 🎨 **界面优化**:
  - 改进响应式布局
  - 优化移动端适配
  - 增强无障碍访问支持
- 🐛 **问题修复**:
  - 修复表单重置问题
  - 修复展开/收起状态管理
  - 修复图标显示问题

#### WebRTC监控模块

- ✨ **新增功能**: 添加getRoomHistory函数，支持房间历史数据查询
- 🐛 **问题修复**: 修复API导入路径问题

#### Holiday节假日模块

- ✨ **新增功能**: 完整的节假日模块实现
- 📅 **日历组件**: 基于Element Plus Calendar的节假日展示
- 🔄 **数据同步**: 支持节假日数据同步功能
- 🎨 **响应式设计**: 完美适配各种设备

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request来帮助改进这个项目。

## 联系方式

如有问题，请联系开发团队。