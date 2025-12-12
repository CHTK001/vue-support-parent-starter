# 登录页面主题系统使用指南

## 快速开始

### 1. 配置主题

在 `apps/vue-support-system-parent/src/application.yml` 中配置：

```yaml
# 登录页面主题配置
LoginTheme: modern  # 可选: modern, tech, business, random

# 是否启用节日主题自动检测
EnableFestivalTheme: true
```

### 2. 主题选项

#### 常规主题

| 主题名称 | 配置值 | 风格描述 | 适用场景 |
|---------|--------|---------|---------|
| 现代简约 | `modern` | 简洁大方，渐变背景 | 通用场景（默认） |
| 科技未来 | `tech` | 粒子动画，科技感强 | 科技、AI类应用 |
| 商务专业 | `business` | 稳重专业，企业风格 | 企业管理系统 |
| 随机主题 | `random` | 每次随机选择 | 增加趣味性 |

#### 节日主题（自动检测）

| 节日 | 检测时间 | 特色元素 |
|-----|---------|---------|
| 春节 | 1月20日-2月20日 | 灯笼、烟花、雪花、福字 |
| 中秋 | 9月10日-9月25日 | 月亮、星空、云朵 |
| 圣诞 | 12月15日-12月31日 | 圣诞树、雪花、彩灯 |

## 主题预览

### 现代简约主题 (modern)
- ✨ 渐变背景
- 🎨 左右分栏布局
- 🖼️ 插图装饰
- 📱 响应式设计

### 科技未来主题 (tech)
- 🌌 粒子连线动画
- 🔵 科技蓝色调
- ⚡ 扫描线效果
- 🎯 旋转圆环装饰

### 商务专业主题 (business)
- 🏢 深色商务风格
- 📊 数据统计展示
- 🛡️ 安全可靠标识
- 💼 专业品牌区域

### 春节主题 (spring-festival)
- 🏮 红灯笼动画
- 🎆 烟花效果
- ❄️ 飘雪动画
- 🧧 喜庆红色调

### 中秋主题 (mid-autumn)
- 🌕 月亮浮动效果
- ⭐ 星空闪烁
- ☁️ 云朵飘动
- 🌙 深蓝夜空背景

### 圣诞主题 (christmas)
- 🎄 圣诞树装饰
- ❄️ 雪花飘落
- 💡 彩灯闪烁
- 🎅 节日元素

## 配置示例

### 示例 1：使用现代简约主题

```yaml
LoginTheme: modern
EnableFestivalTheme: false
```

### 示例 2：使用科技主题

```yaml
LoginTheme: tech
EnableFestivalTheme: false
```

### 示例 3：启用节日主题自动切换

```yaml
LoginTheme: modern  # 非节日期间使用
EnableFestivalTheme: true  # 节日期间自动切换
```

### 示例 4：随机主题

```yaml
LoginTheme: random
EnableFestivalTheme: false
```

## 自定义主题开发

### 1. 创建主题文件

在 `packages/pages/login/themes/` 下创建新主题文件夹：

```
themes/
├── your-theme/
│   └── index.vue
```

### 2. 实现主题组件

```vue
<template>
  <div class="your-theme-login-page">
    <!-- 背景装饰 -->
    <div class="background">
      <!-- 自定义背景 -->
    </div>

    <!-- 顶部工具栏插槽 -->
    <slot name="toolbar"></slot>

    <!-- 主要内容区 -->
    <div class="login-container">
      <div class="content-box">
        <!-- 左侧装饰 -->
        <div class="decoration-section">
          <!-- 自定义装饰 -->
        </div>

        <!-- 右侧表单 -->
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
  name: "YourThemeLoginTheme",
});
</script>

<style lang="scss" scoped>
/* 自定义样式 */
</style>
```

### 3. 注册主题

在 `themes/index.ts` 中添加：

```typescript
export const loginThemes: LoginTheme[] = [
  // ... 现有主题
  {
    name: "你的主题",
    key: "your-theme",
    description: "主题描述",
    // @ts-ignore
    component: () => import("./your-theme/index.vue"),
  },
];
```

### 4. 使用新主题

```yaml
LoginTheme: your-theme
```

## 技术细节

### 主题切换原理

1. 从 `application.yml` 读取配置
2. 调用 `getLoginTheme()` 获取主题配置
3. 使用 `defineAsyncComponent` 动态加载主题组件
4. 通过插槽传递工具栏和表单内容

### 节日检测逻辑

```typescript
// 简化的日期检测
const now = new Date();
const month = now.getMonth() + 1;
const day = now.getDate();

// 春节：1月20日-2月20日
if ((month === 1 && day >= 20) || (month === 2 && day <= 20)) {
  return festivalThemes[0];
}
```

### 响应式设计

所有主题都支持响应式布局：
- 桌面端：左右分栏
- 移动端：上下堆叠

```scss
@media (max-width: 768px) {
  .content-box {
    flex-direction: column;
  }
}
```

## 最佳实践

### 1. 主题选择建议

- **企业内部系统**：使用 `business` 主题
- **科技创新产品**：使用 `tech` 主题
- **通用场景**：使用 `modern` 主题（默认）
- **增加趣味性**：使用 `random` 主题

### 2. 节日主题建议

- 建议启用节日主题自动检测（`EnableFestivalTheme: true`）
- 节日主题会自动覆盖常规主题配置
- 如果不希望显示节日主题，设置为 `false`

### 3. 性能优化

- 主题组件使用懒加载（defineAsyncComponent）
- 动画使用 CSS 而非 JavaScript
- 图片资源使用 WebP 格式

### 4. 兼容性

- 支持 Vue 3.x
- 支持 Element Plus
- 支持现代浏览器（Chrome, Firefox, Safari, Edge）
- 移动端完全适配

## 常见问题

### Q: 如何禁用节日主题？
A: 在 `application.yml` 中设置 `EnableFestivalTheme: false`

### Q: 主题切换后不生效？
A: 需要刷新页面，主题配置在页面加载时读取

### Q: 如何添加新的节日主题？
A: 在 `themes/festival/` 下创建新主题，并在 `themes/index.ts` 的 `festivalThemes` 数组中注册

### Q: 随机主题每次都一样？
A: 随机主题在每次页面加载时随机选择，刷新页面会重新随机

### Q: 主题样式如何适配暗色模式？
A: 所有主题使用 Element Plus CSS 变量，自动适配暗色模式

## 更新日志

### v1.0.0 (2025-12-12)
- ✨ 初始版本发布
- 🎨 3套常规主题（现代、科技、商务）
- 🎉 3套节日主题（春节、中秋、圣诞）
- 🔀 支持随机主题
- 📱 完整响应式支持
- 🌓 暗色模式适配

## 作者

- **CH**
- 创建时间：2025-12-12
- 版本：1.0.0

## 许可证

MIT License
