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