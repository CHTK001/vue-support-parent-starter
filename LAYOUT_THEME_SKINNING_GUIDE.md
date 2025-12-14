# Layout/Default 主题皮肤功能完整指南

## 一、功能概述

系统提供了完整的主题皮肤切换功能，用户可以在设置面板中选择不同的主题皮肤，系统会自动加载相应的CSS样式表，改变整个应用的视觉风格。

主题皮肤与主题色不同：
- **主题色** (`EpThemeColor`): Element Plus 的主要品牌色（如蓝色、绿色等）
- **主题皮肤** (`systemTheme`): 节日或季节性的完整样式包（如春节红色、圣诞绿色等）

## 二、可用主题皮肤

| 主题名 | Key | 描述 | 自动检测日期 |
|-------|-----|------|-----------|
| 默认 | default | 默认主题皮肤 | - |
| 元旦 | new-year | 新年新气象，蓝紫渐变 | 1月1-3日 |
| 春节 | spring-festival | 喜庆祥和的红色主题 | 1月20-2月20日 |
| 情人节 | valentines-day | 浪漫甜蜜的粉色主题 | 2月12-16日 |
| 中秋 | mid-autumn | 月圆人团圆，月亮主题 | 9月10-25日 |
| 国庆 | national-day | 祝福祖国，红金配色 | 10月1-7日 |
| 圣诞 | christmas | 温馨浪漫的绿色主题 | 12月15-31日 |

## 三、核心实现

### 3.1 文件结构

```
layout/default/src/
├── themes/
│   ├── index.ts                 # 主题配置和管理
│   ├── THEME_GUIDE.md          # 主题开发指南
│   ├── spring-festival.css    # 春节主题样式
│   ├── new-year.css           # 元旦主题样式
│   ├── valentines-day.css     # 情人节主题样式
│   ├── mid-autumn.css         # 中秋主题样式
│   ├── national-day.css       # 国庆主题样式
│   └── christmas.css          # 圣诞主题样式
├── components/
│   └── lay-setting/
│       └── index.vue          # 设置面板（包含主题切换UI）
└── hooks/
    └── useDataThemeChange.ts  # 主题切换Hook
```

### 3.2 主题配置 (`themes/index.ts`)

```typescript
export interface LayoutTheme {
  name: string;           // 主题显示名称
  key: string;            // 主题唯一标识
  description: string;    // 主题描述
  stylesheet?: string;    // 样式表文件名
}

// 主题列表定义
export const layoutThemes: LayoutTheme[] = [...]

// 获取主题信息
export const getLayoutTheme = (themeKey: string): LayoutTheme => {}

// 动态加载主题样式表
export const loadThemeStylesheet = (themeKey: string): void => {}

// 检测当前是否为节日期间
export const detectFestivalTheme = (): LayoutTheme | null => {}
```

### 3.3 主题切换实现 (`lay-setting/index.vue`)

```typescript
/**
 * 切换系统主题皮肤
 * @param themeKey 主题键值（如 "spring-festival"）
 */
const switchSystemTheme = (themeKey: string): void => {
  // 1. 移除旧主题类名
  const themeClasses = [
    "theme-christmas",
    "theme-spring-festival",
    // ... 其他主题
  ];
  themeClasses.forEach((cls) => {
    document.documentElement.classList.remove(cls);
  });
  
  // 2. 添加新主题类名
  if (themeKey !== "default") {
    document.documentElement.classList.add(`theme-${themeKey}`);
    // 3. 加载对应的样式表
    loadThemeStylesheet(themeKey);
  }
  
  // 4. 保存到本地存储
  storageConfigureChange("systemTheme", themeKey);
  
  // 5. 发送事件通知其他组件
  emitter.emit("systemThemeChange", themeKey);
};
```

## 四、使用方式

### 4.1 用户在设置面板中切换

1. 打开系统右上角的**设置按钮**（齿轮图标）
2. 在设置面板左侧找到**主题皮肤**模块
3. 点击对应的主题卡片进行切换
4. 主题会立即应用，同时保存到本地存储

### 4.2 节日自动切换

系统支持节日期间自动切换主题：

- 如果启用了"节日主题自动切换"选项
- 系统会根据当前日期自动检测是否在节日期间
- 若是，自动应用对应的节日主题
- 用户手动选择的主题会覆盖自动检测

### 4.3 编程方式切换

如果需要在代码中切换主题：

```typescript
// 从 lay-setting 组件中获取 switchSystemTheme 函数
import { switchSystemTheme } from '@layout/default/components/lay-setting'

// 切换到春节主题
switchSystemTheme('spring-festival')

// 切换回默认主题
switchSystemTheme('default')
```

或者通过事件监听主题变化：

```typescript
import { emitter } from '@repo/core'

// 监听主题切换事件
emitter.on('systemThemeChange', (themeKey: string) => {
  console.log('主题已切换为:', themeKey)
  // 执行相关操作
})
```

## 五、样式表开发

### 5.1 主题样式表结构

每个主题样式表应该定义在 `layout/default/src/themes/` 目录下：

```css
/* spring-festival.css - 春节主题 */

/* 1. 根节点样式变量 */
:root {
  --theme-primary-color: #f5222d;    /* 主题色 */
  --theme-bg-color: #fef5f5;         /* 背景色 */
  --theme-text-color: #333;          /* 文字色 */
  /* ... 其他变量 */
}

/* 2. 特定类名的样式覆盖 */
.theme-spring-festival .sidebar {
  background: linear-gradient(135deg, #f5222d 0%, #ff7a7a 100%);
}

.theme-spring-festival .header {
  background: #fff;
  border-bottom: 2px solid #f5222d;
}

/* 3. 动画和特殊效果 */
.theme-spring-festival .menu-item:hover {
  background-color: rgba(245, 34, 45, 0.1);
}

/* ... 其他样式 */
```

### 5.2 编写新主题的步骤

1. **在 `themes/index.ts` 中添加主题定义**：
```typescript
export const layoutThemes: LayoutTheme[] = [
  // ... 现有主题
  {
    name: "自定义主题",
    key: "custom-theme",
    description: "自定义主题描述",
    stylesheet: "custom-theme.css",
  },
]
```

2. **创建样式表文件**：
创建 `layout/default/src/themes/custom-theme.css`

3. **编写样式**：
```css
:root {
  --custom-color-1: #123456;
  --custom-color-2: #654321;
}

.theme-custom-theme {
  color-scheme: light;
}

.theme-custom-theme .sidebar {
  background: var(--custom-color-1);
}

.theme-custom-theme .header {
  border-bottom: 2px solid var(--custom-color-2);
}
```

4. **更新设置面板**：
在 `lay-setting/index.vue` 中的 `festivalThemesList` 或相应位置添加主题选项

### 5.3 主题样式的作用范围

主题样式通过为 `<html>` 元素添加类名来实现作用：

```html
<!-- 应用春节主题时 -->
<html class="theme-spring-festival">
  <!-- 整个页面都在这个作用域内 -->
</html>
```

样式表使用后代选择器确保只在特定主题下才应用：

```css
/* 只在应用春节主题时才使用这些样式 */
.theme-spring-festival .menu {
  color: #f5222d;
}
```

## 六、数据持久化

主题选择会自动保存到浏览器本地存储：

**存储位置**：`localStorage`  
**键名**：根据应用配置确定，通常与其他UI配置一起保存  
**数据结构**：
```javascript
{
  systemTheme: "spring-festival",  // 选中的主题
  enableFestivalTheme: true,       // 是否启用节日自动切换
  // ... 其他配置
}
```

刷新页面时，系统会自动恢复用户之前选择的主题。

## 七、主题切换流程

```
用户点击主题卡片
        ↓
switchSystemTheme(themeKey)
        ↓
移除HTML旧主题类名
        ↓
添加HTML新主题类名
        ↓
加载新主题CSS文件（如果需要）
        ↓
保存到localStorage
        ↓
发送 systemThemeChange 事件
        ↓
显示成功提示
        ↓
组件监听事件更新视图（可选）
```

## 八、常见问题排查

### Q1: 主题样式不生效

**症状**：切换主题后页面没有变化

**排查步骤**：
1. 检查浏览器控制台是否有错误
2. 查看 Network 标签中 CSS 文件是否正确加载
3. 检查 HTML 元素是否有对应的类名：
   ```javascript
   console.log(document.documentElement.className)
   ```
4. 检查样式表路径是否正确（通常为 `/themes/{themeKey}.css`）

### Q2: 某些组件主题不变

**症状**：部分UI元素（如侧边栏）没有应用主题样式

**排查步骤**：
1. 检查 CSS 选择器是否正确：
   ```css
   /* ✓ 正确 */
   .theme-spring-festival .sidebar { }
   
   /* ✗ 错误 - 没有主题前缀 */
   .sidebar { }
   ```
2. 检查样式的特异性是否足够高
3. 使用浏览器开发者工具检查元素的实际样式

### Q3: 刷新后主题丢失

**症状**：选择主题后刷新页面，主题重置为默认

**排查步骤**：
1. 检查 `storageConfigureChange` 是否正确保存：
   ```javascript
   console.log(localStorage)
   ```
2. 检查 `lay-setting` 组件的初始化逻辑
3. 确认本地存储未被清理

### Q4: 主题CSS加载失败

**症状**：浏览器控制台出现 404 错误

**排查步骤**：
1. 检查 CSS 文件是否存在于 `/public/themes/` 目录
2. 检查文件名是否与 `themes/index.ts` 中的 `stylesheet` 字段一致
3. 重启开发服务器或清理构建缓存

## 九、集成到其他组件

### 9.1 监听主题变化

在任何组件中监听主题变化事件：

```typescript
import { emitter } from '@repo/core'
import { onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    const handleThemeChange = (themeKey: string) => {
      console.log('主题已切换为:', themeKey)
      // 执行自定义逻辑
    }
    
    onMounted(() => {
      emitter.on('systemThemeChange', handleThemeChange)
    })
    
    onUnmounted(() => {
      emitter.off('systemThemeChange', handleThemeChange)
    })
  }
}
```

### 9.2 从设置中读取当前主题

```typescript
import { useGlobal } from '@pureadmin/utils'

export default {
  setup() {
    const { $storage } = useGlobal()
    
    // 获取当前主题
    const currentTheme = $storage.configure?.systemTheme || 'default'
    
    // 监听变化
    watch(
      () => $storage.configure?.systemTheme,
      (newTheme) => {
        console.log('主题变为:', newTheme)
      }
    )
  }
}
```

## 十、性能优化

### 10.1 CSS加载优化

- **按需加载**：只在切换主题时加载对应的CSS文件
- **移除旧样式**：及时移除上一个主题的样式表，避免样式冲突
- **缓存策略**：浏览器会自动缓存CSS文件，重复加载时直接使用缓存

### 10.2 样式表大小优化

- 将通用样式提取到基础样式表
- 主题样式表只包含主题特定的覆盖规则
- 使用CSS变量减少重复定义

### 10.3 初始化优化

```typescript
// 页面加载时，如果用户有保存的主题，立即应用
onMounted(() => {
  const savedTheme = $storage.configure?.systemTheme
  if (savedTheme && savedTheme !== 'default') {
    // 立即加载样式表，避免闪烁
    loadThemeStylesheet(savedTheme)
    document.documentElement.classList.add(`theme-${savedTheme}`)
  }
})
```

## 十一、扩展和定制

### 11.1 添加主题色变量

在主题CSS中使用CSS变量，方便动态修改：

```css
:root {
  --theme-primary: #f5222d;
  --theme-secondary: #ff7a7a;
  --theme-background: #fef5f5;
}

.theme-spring-festival {
  --ep-color-primary: var(--theme-primary);
  --ep-color-success: var(--theme-secondary);
}
```

### 11.2 与Element Plus主题色整合

```typescript
// 在应用主题皮肤同时也切换Element Plus的主题色
const switchSystemTheme = (themeKey: string) => {
  // 应用主题皮肤
  switchThemeSkin(themeKey)
  
  // 同时切换Element Plus主题色
  const colorMap = {
    'spring-festival': '#f5222d',
    'new-year': '#1890ff',
    'christmas': '#16a34a',
  }
  
  if (colorMap[themeKey]) {
    setLayoutThemeColor(colorMap[themeKey])
  }
}
```

## 十二、文件清单

### 核心文件

| 文件路径 | 功能 |
|---------|------|
| `layout/default/src/themes/index.ts` | 主题定义和管理 |
| `layout/default/src/components/lay-setting/index.vue` | 设置面板和主题切换UI |
| `layout/default/src/hooks/useDataThemeChange.ts` | 主题变化Hook |
| `layout/default/src/themes/*.css` | 主题样式表 |

### 相关文件

| 文件路径 | 功能 |
|---------|------|
| `layout/default/src/themes/THEME_GUIDE.md` | 主题开发指南 |
| `packages/core/src/utils/emitter.ts` | 事件系统 |
| `packages/config/src/setting/index.ts` | 全局配置 |

---

**文档版本**: 1.0.0  
**最后更新**: 2025-12-13  
**维护者**: 开发团队
