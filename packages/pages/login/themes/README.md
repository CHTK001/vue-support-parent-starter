# 登录页面主题系统

## 概述

本系统提供了多套登录页面主题，支持配置切换、随机主题和节日主题自动切换功能。

## 主题列表

### 常规主题

1. **现代简约 (modern)** - 默认主题
   - 现代化设计，简洁大方
   - 适合大多数应用场景

2. **科技未来 (tech)**
   - 科技感十足，动态粒子效果
   - 适合科技类、AI类应用

3. **商务专业 (business)**
   - 商务风格，专业稳重
   - 适合企业管理系统

### 节日主题

1. **春节主题 (spring-festival)**
   - 自动检测：公历1月20日-2月20日
   - 红色喜庆风格，灯笼、烟花、雪花动画

2. **中秋主题 (mid-autumn)**
   - 自动检测：公历9月10日-9月25日
   - 月亮、星空、云朵动画

3. **圣诞主题 (christmas)**
   - 自动检测：公历12月15日-12月31日
   - 圣诞树、雪花、彩灯动画

## 配置方式

### 在 `application.yml` 中配置

```yaml
# 登录页面主题配置
# 主题选项: modern(现代简约), tech(科技未来), business(商务专业), random(随机)
LoginTheme: modern

# 是否启用节日主题（自动检测节日并应用对应主题）
# 节日主题优先级高于 LoginTheme 配置
EnableFestivalTheme: true
```

### 配置说明

- **LoginTheme**: 指定使用的主题
  - `modern`: 现代简约主题（默认）
  - `tech`: 科技未来主题
  - `business`: 商务专业主题
  - `random`: 每次加载随机选择一个主题

- **EnableFestivalTheme**: 是否启用节日主题自动检测
  - `true`: 启用（默认），在节日期间自动切换到对应节日主题
  - `false`: 禁用，始终使用 LoginTheme 配置的主题

## 主题优先级

1. **节日主题**（如果 EnableFestivalTheme 为 true 且当前在节日期间）
2. **LoginTheme 配置的主题**
3. **默认主题**（modern）

## 自定义主题

### 创建新主题

1. 在 `themes/` 目录下创建新的主题文件夹，例如 `custom/`
2. 创建 `index.vue` 文件，实现主题组件
3. 主题组件需要提供两个插槽：
   - `#toolbar`: 顶部工具栏内容
   - `#form`: 登录表单内容

### 主题组件模板

```vue
<template>
  <div class="custom-login-page">
    <!-- 背景装饰 -->
    <div class="background">
      <!-- 自定义背景内容 -->
    </div>

    <!-- 顶部工具栏插槽 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-container">
      <div class="content-box">
        <!-- 左侧装饰区域 -->
        <div class="decoration-section">
          <!-- 自定义装饰内容 -->
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
            <!-- 表单插槽 -->
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "CustomLoginTheme",
});
</script>

<style lang="scss" scoped>
/* 自定义样式 */
</style>
```

### 注册新主题

在 `themes/index.ts` 中添加新主题：

```typescript
export const loginThemes: LoginTheme[] = [
  // ... 现有主题
  {
    name: "自定义主题",
    key: "custom",
    description: "自定义主题描述",
    component: () => import("./custom/index.vue"),
  },
];
```

## 技术实现

- 使用 Vue 3 Composition API
- 动态组件加载（defineAsyncComponent）
- 插槽（Slots）实现内容分发
- CSS 动画和过渡效果
- 响应式设计，支持移动端

## 注意事项

1. 主题切换需要刷新页面才能生效
2. 节日日期检测基于公历，实际农历日期可能有偏差
3. 所有主题都支持暗色/亮色模式切换
4. 主题样式使用 Element Plus CSS 变量，自动适配系统主题

## 作者

- **CH**
- 创建时间：2025-12-12
- 版本：1.0.0
