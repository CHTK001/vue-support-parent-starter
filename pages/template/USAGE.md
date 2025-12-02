# Template 模板组件使用指南

## 📦 组件列表

### 1. DashboardCard（仪表盘卡片）

用于展示关键指标和趋势数据。

**特性**：

- 支持多种类型（primary, success, warning, danger, info）
- 显示图标、标签、数值
- 支持趋势指示（上升/下降）
- 可自定义底部内容

**使用示例**：

```vue
<DashboardCard
  type="primary"
  icon="ri:user-line"
  label="总用户数"
  :value="1234"
  trend="+12.5%"
  trend-type="up"
>
  <template #footer>
    <el-button text type="primary">查看详情</el-button>
  </template>
</DashboardCard>
```

### 2. StatisticCard（统计卡片）

美观的数据统计展示卡片。

**特性**：

- 支持多种主题（primary, success, warning, danger, info, purple, orange）
- 图标+数值+标签组合
- 趋势指示器
- 悬停动画效果

**使用示例**：

```vue
<StatisticCard
  theme="primary"
  icon="ri:eye-line"
  label="页面浏览量"
  :value="45678"
  trend="+15.3%"
  trend-type="up"
  prefix=""
  suffix=""
/>
```

### 3. FeatureCard（功能卡片）

突出展示产品功能特性。

**特性**：

- 大图标展示
- 标题+描述
- 激活状态
- 自定义底部操作

**使用示例**：

```vue
<FeatureCard
  icon="ri:rocket-line"
  icon-color="#6366f1"
  title="快速部署"
  description="一键部署到云端，支持多种部署方式"
  :active="true"
/>
```

### 4. TimelineCard（时间线卡片）

展示事件时间线和进度。

**特性**：

- 垂直时间线布局
- 支持图标、颜色自定义
- 标签支持
- 激活状态指示

**使用示例**：

```vue
<TimelineCard
  :items="[
    {
      title: '项目启动',
      description: '项目正式启动',
      time: '2024-01-01',
      icon: 'ri:rocket-line',
      color: 'var(--el-color-primary)',
      tags: ['里程碑', '重要'],
    },
  ]"
  :active-index="0"
/>
```

### 5. PricingCard（价格卡片）

清晰的产品定价展示。

**特性**：

- 图标+标题+副标题
- 价格展示
- 功能列表（支持包含/不包含标记）
- 热门标签
- 特色高亮

**使用示例**：

```vue
<PricingCard
  icon="ri:vip-crown-line"
  title="专业版"
  subtitle="适合团队使用"
  price="99"
  period="月"
  :popular="true"
  :featured="true"
  :features="[
    '所有基础功能',
    '100GB 存储空间',
    { label: '高级功能', included: false },
  ]"
  action-text="立即购买"
/>
```

### 6. ProfileCard（个人资料卡片）

展示用户个人信息。

**特性**：

- 封面图片
- 头像+在线状态
- 姓名+角色+简介
- 统计数据（关注者/关注中/动态）
- 操作按钮

**使用示例**：

```vue
<ProfileCard
  avatar="https://example.com/avatar.png"
  name="张三"
  role="前端开发工程师"
  bio="热爱编程"
  cover-color="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
  :online="true"
  :followers="1234"
  :following="567"
  :posts="89"
/>
```

### 7. ActionCard（操作卡片）

快速执行操作的卡片。

**特性**：

- 图标+标题+描述
- 悬停动画
- 脉冲效果
- 禁用状态

**使用示例**：

```vue
<ActionCard
  icon="ri:flashlight-line"
  icon-color="#6366f1"
  title="快速操作"
  description="点击执行操作"
  :disabled="false"
/>
```

### 8. InfoCard（信息卡片）

展示提示和通知信息。

**特性**：

- 多种类型（info, success, warning, error）
- 可关闭
- 支持操作按钮
- 自定义内容

**使用示例**：

```vue
<InfoCard
  type="info"
  icon="ri:information-line"
  title="提示信息"
  message="这是一条提示消息"
  :closable="true"
  :show-action="true"
  action-text="了解更多"
/>
```

## 🎨 设计特点

所有模板组件都包含：

- ✨ 现代化的渐变色设计
- 🎯 统一的图标系统（IconifyIconOnline）
- 💫 流畅的动画效果
- 📱 响应式布局
- 🎨 CSS 变量支持主题切换
- 🌓 深色模式兼容

## 📖 查看示例

访问 `/example` 页面，点击 "Template" 组件查看所有模板的完整示例和代码。

## 🔧 自定义

所有组件都支持通过 props 和 slots 进行自定义，可以根据项目需求调整样式和行为。
