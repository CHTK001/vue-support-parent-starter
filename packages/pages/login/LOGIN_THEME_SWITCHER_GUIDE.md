# 登录页面主题切换器使用指南

## 功能概述

登录页面主题切换器允许用户在登录页面直接切换主题，无需登录到系统后台。用户选择的主题会保存在浏览器本地存储中，下次访问时自动应用。

## 启用主题切换器

### 配置方式

在 `application.yml` 中启用主题切换器：

```yaml
# 是否在登录页面显示主题切换器
# 开启后，用户可以在登录页面直接切换主题（使用本地存储）
EnableLoginThemeSwitcher: true
```

## 功能特性

### 1. 位置

主题切换器显示在登录页面顶部工具栏，位于：
- 环境标识（如果有）右侧
- 暗色/亮色模式切换左侧
- 语言切换左侧

### 2. 外观

- **触发器**：显示当前主题图标和名称
- **下拉菜单**：展示所有可用主题
- **主题分组**：常规主题和节日主题分开显示
- **当前标识**：当前使用的主题显示勾选图标

### 3. 主题列表

#### 常规主题
- 🎨 现代简约
- 🚀 科技未来
- 💼 商务专业
- 🎲 随机主题

#### 节日主题
- 🧧 春节（带"节日"标签）
- 🌕 中秋（带"节日"标签）
- 🎄 圣诞（带"节日"标签）

## 使用方式

### 步骤 1：打开主题切换器

1. 访问登录页面
2. 在顶部工具栏找到主题切换器
3. 点击主题切换器触发器

### 步骤 2：选择主题

1. 在下拉菜单中浏览所有主题
2. 点击想要使用的主题
3. 页面会自动刷新并应用新主题

### 步骤 3：主题持久化

- 选择的主题会自动保存到浏览器本地存储
- 下次访问登录页面时自动应用
- 不同浏览器的主题偏好独立保存

## 配置优先级

主题选择的优先级顺序：

1. **用户本地偏好**（通过主题切换器选择）
2. **系统配置**（application.yml 中的 LoginTheme）
3. **节日主题**（如果 EnableFestivalTheme 为 true 且在节日期间）
4. **默认主题**（modern）

### 示例

```yaml
# application.yml
LoginTheme: business
EnableFestivalTheme: true
EnableLoginThemeSwitcher: true
```

**场景 1：用户未选择过主题**
- 非节日期间 → 使用 business 主题
- 春节期间 → 使用春节主题（节日主题优先）

**场景 2：用户选择了 tech 主题**
- 非节日期间 → 使用 tech 主题（用户偏好优先）
- 春节期间 → 使用 tech 主题（用户偏好优先于节日主题）

**场景 3：用户选择了春节主题**
- 任何时候 → 使用春节主题（用户明确选择）

## 技术实现

### 本地存储

```typescript
// 存储键名
const THEME_STORAGE_KEY = "login-theme-preference";

// 保存主题偏好
localStorageProxy().setItem(THEME_STORAGE_KEY, "tech");

// 读取主题偏好
const savedTheme = localStorageProxy().getItem(THEME_STORAGE_KEY);
```

### 主题加载逻辑

```typescript
// 1. 读取本地存储的主题偏好
const savedTheme = localStorageProxy().getItem(THEME_STORAGE_KEY);

// 2. 如果有本地偏好，使用本地偏好；否则使用配置文件
const themeConfig = savedTheme || getConfig("LoginTheme") || "modern";

// 3. 获取主题组件
const currentTheme = getLoginTheme(themeConfig, enableFestival);
```

### 主题切换流程

```typescript
const handleThemeChange = (themeKey: string) => {
  // 1. 更新当前主题
  currentTheme.value = themeKey;
  
  // 2. 保存到本地存储
  localStorageProxy().setItem(THEME_STORAGE_KEY, themeKey);
  
  // 3. 刷新页面应用新主题
  window.location.reload();
};
```

## 界面设计

### 触发器样式

```scss
.switcher-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
}
```

### 下拉菜单样式

- **最小宽度**：280px
- **内边距**：8px
- **主题选项**：图标 + 名称 + 描述 + 勾选图标
- **分隔线**：常规主题和节日主题之间

### 响应式设计

- **桌面端**：完整显示图标、名称和描述
- **移动端**：自动适配，保持可用性

## 与系统配置的关系

### 主题管理功能对比

| 功能 | 登录页主题切换器 | 系统配置主题管理 |
|------|----------------|----------------|
| 访问权限 | 所有用户 | 仅管理员 |
| 生效范围 | 当前浏览器 | 全局（所有用户） |
| 配置存储 | 本地存储 | 数据库 |
| 需要登录 | 否 | 是 |
| 配置开关 | EnableLoginThemeSwitcher | EnableThemeManagement |

### 协同使用

两个功能可以同时启用：

```yaml
EnableThemeManagement: true      # 管理员可以设置默认主题
EnableLoginThemeSwitcher: true   # 用户可以自定义主题
```

**使用场景：**
1. 管理员在系统配置中设置默认主题为 "business"
2. 用户 A 在登录页选择 "tech" 主题（保存到本地）
3. 用户 B 不选择主题，使用默认的 "business" 主题

## 注意事项

### 1. 浏览器兼容性

- 需要浏览器支持 localStorage
- 隐私模式可能限制本地存储功能

### 2. 主题同步

- 不同浏览器的主题偏好不同步
- 清除浏览器数据会重置主题偏好

### 3. 节日主题

- 用户可以手动选择节日主题，不受日期限制
- 用户选择的节日主题优先于自动检测

### 4. 随机主题

- 选择随机主题后，每次刷新页面都会随机
- 如果想固定主题，需要重新选择具体主题

## 常见问题

### Q: 如何禁用主题切换器？

A: 在 `application.yml` 中设置 `EnableLoginThemeSwitcher: false`

### Q: 如何清除用户的主题偏好？

A: 用户可以清除浏览器缓存，或在浏览器控制台执行：
```javascript
localStorage.removeItem('login-theme-preference');
```

### Q: 主题切换器和系统配置的主题管理有什么区别？

A: 
- **主题切换器**：用户个人偏好，保存在浏览器本地
- **主题管理**：系统全局配置，保存在数据库

### Q: 用户选择的主题会覆盖节日主题吗？

A: 是的。用户明确选择的主题优先级最高，包括节日主题。

### Q: 如何强制所有用户使用统一主题？

A: 禁用主题切换器（`EnableLoginThemeSwitcher: false`），并在系统配置中设置默认主题。

## 最佳实践

### 1. 默认配置

```yaml
# 推荐配置
LoginTheme: modern                # 设置合适的默认主题
EnableFestivalTheme: true         # 启用节日氛围
EnableLoginThemeSwitcher: true    # 允许用户自定义
EnableThemeManagement: true       # 允许管理员管理
```

### 2. 企业场景

```yaml
# 企业统一风格
LoginTheme: business
EnableFestivalTheme: false        # 保持专业形象
EnableLoginThemeSwitcher: false   # 统一视觉体验
EnableThemeManagement: true       # 管理员可调整
```

### 3. 个性化场景

```yaml
# 最大化用户自由度
LoginTheme: modern
EnableFestivalTheme: true
EnableLoginThemeSwitcher: true    # 用户完全自定义
EnableThemeManagement: true
```

## 更新日志

### v1.0.0 (2025-12-12)

- ✨ 初始版本发布
- 🎨 可视化主题切换器
- 💾 本地存储主题偏好
- 🔄 即时切换和应用
- 📱 响应式设计

## 作者

- **CH**
- 创建时间：2025-12-12
- 版本：1.0.0
