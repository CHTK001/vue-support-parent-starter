# 悬停导航模式 (Hover Navigation)

## 功能概述

悬停导航模式是一种新的导航布局方式，只显示一级菜单项，当鼠标悬停在菜单上时，会以弹出层的形式显示二级和三级菜单，提供更简洁的界面和更高效的导航体验。

## 🎯 设计理念

### 核心特性
- **简洁界面**: 只显示一级菜单，最大化内容区域
- **悬停交互**: 鼠标悬停即可查看子菜单，无需点击
- **层次清晰**: 二级三级菜单分组显示，结构清晰
- **快速导航**: 减少点击次数，提升操作效率

### 适用场景
- 菜单层级较深的管理系统
- 需要最大化内容显示区域的应用
- 追求现代化交互体验的项目
- 桌面端为主的应用场景

## 🔧 技术实现

### 组件结构

```
NavHover.vue
├── 一级菜单容器
│   ├── 菜单项渲染
│   ├── 悬停事件监听
│   └── 激活状态判断
├── 子菜单弹出层 (Teleport)
│   ├── 位置计算
│   ├── 动态内容渲染
│   └── 二级三级菜单展示
└── 事件处理逻辑
    ├── handleMenuHover
    ├── hideSubMenu
    └── 位置计算
```

### 核心功能

#### 1. 菜单悬停处理
```typescript
function handleMenuHover(menu: any, event: MouseEvent) {
  if (!menu.children || menu.children.length === 0) {
    hideSubMenu();
    return;
  }
  
  hoveredMenu.value = menu;
  
  // 计算子菜单位置
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  
  subMenuPosition.value = {
    top: rect.top,
    left: rect.right
  };
  
  subMenuVisible.value = true;
}
```

#### 2. 智能位置计算
- 根据鼠标悬停的菜单项位置计算弹出层位置
- 自动处理边界情况，防止弹出层超出屏幕
- 支持动态调整弹出方向

#### 3. 菜单状态管理
```typescript
// 检查菜单是否激活
function isMenuActive(menu: any): boolean {
  if (!menu.children || menu.children.length === 0) {
    return defaultActive.value === menu.path;
  }
  
  // 检查子菜单是否有激活项
  return menu.children.some((child: any) => {
    if (child.children && child.children.length > 0) {
      return child.children.some((grandChild: any) => 
        defaultActive.value.startsWith(grandChild.path)
      );
    }
    return defaultActive.value.startsWith(child.path);
  });
}
```

## 🎨 样式设计

### 主要样式特性

#### 1. 侧边栏样式
```scss
.sidebar-hover-container {
  position: relative;
  height: 100%;
  width: 200px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98));
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}
```

#### 2. 弹出层样式
```scss
.sub-menu-container {
  min-width: 280px;
  max-width: 400px;
  max-height: 80vh;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  backdrop-filter: blur(20px);
}
```

#### 3. 交互动画
- 菜单项悬停时的平移效果
- 弹出层的淡入淡出动画
- 箭头图标的动态变化
- 激活状态的高亮效果

### 全局样式支持

在 `sidebar.scss` 中添加了 `body[layout="hover"]` 样式规则：

```scss
body[layout="hover"] {
  $sideBarWidth: 200px;

  @include merge-style($sideBarWidth);

  .sidebar-hover-container {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1001;
    width: $sideBarWidth;
    height: 100vh;
    transition: all var(--pure-transition-duration) ease;
  }

  .fixed-header {
    width: calc(100% - #{$sideBarWidth});
    margin-left: $sideBarWidth;
    transition: all var(--pure-transition-duration);
  }

  .main-container {
    margin-left: $sideBarWidth;
    transition: margin-left var(--pure-transition-duration);
  }
}
```

## 📱 响应式设计

### 桌面端 (>990px)
- 固定侧边栏显示一级菜单
- 悬停显示子菜单弹出层
- 完整的交互体验

### 平板端 (760px-990px)
- 保持悬停导航模式
- 调整弹出层大小和位置
- 优化触摸交互

### 移动端 (<760px)
- 自动切换为垂直布局模式
- 侧边栏变为滑动抽屉
- 子菜单采用展开/收起方式

## 🔄 集成步骤

### 1. 添加组件引用
```typescript
// layout/default/src/index.vue
import NavHoverLayout from "./components/lay-sidebar/NavHover.vue";
const NavHover = markRaw(NavHoverLayout);
```

### 2. 更新模板
```vue
<NavHover v-show="!pureSetting.hiddenSideBar && layout.includes('hover')" />
```

### 3. 添加设置选项
在 `lay-setting/index.vue` 中添加悬停导航选项：

```vue
<li
  ref="hoverRef"
  v-tippy="{
    content: '悬停导航：只显示一级菜单，鼠标悬停显示子菜单',
    zIndex: 41000,
  }"
  :class="layoutTheme.layout === 'hover' ? 'is-select' : ''"
  @click="setLayoutModel('hover')"
>
  <div />
  <div />
  <div />
</li>
```

## 🎯 使用指南

### 基本操作
1. **选择导航模式**: 在设置面板中选择"悬停导航"
2. **浏览菜单**: 鼠标悬停在一级菜单项上查看子菜单
3. **快速导航**: 直接点击子菜单项进行跳转
4. **返回主菜单**: 鼠标移出弹出层自动隐藏

### 高级功能
- **键盘导航**: 支持 Tab 键在菜单间切换
- **搜索功能**: 集成全局搜索，快速定位菜单
- **收藏功能**: 可收藏常用菜单项
- **最近访问**: 显示最近访问的页面

## 🔧 自定义配置

### 弹出层配置
```typescript
// 可在组件中调整的配置项
const config = {
  popupWidth: { min: 280, max: 400 },
  popupMaxHeight: '80vh',
  animationDuration: 300,
  hoverDelay: 100,
  hideDelay: 200
};
```

### 样式自定义
```scss
// 自定义主题色
:root {
  --hover-nav-primary-color: #2468f2;
  --hover-nav-bg-color: rgba(255, 255, 255, 0.95);
  --hover-nav-popup-bg: var(--el-bg-color-overlay);
  --hover-nav-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
}
```

## 🚀 性能优化

### 1. 懒加载
- 弹出层内容按需渲染
- 图标和组件延迟加载
- 路由组件预加载

### 2. 事件优化
- 防抖处理悬停事件
- 事件委托减少监听器
- 及时清理事件监听

### 3. 渲染优化
- 虚拟滚动处理大量菜单
- CSS 动画替代 JS 动画
- 合理使用 v-show 和 v-if

## 🔍 故障排除

### 常见问题

1. **弹出层位置不正确**
   - 检查父容器的定位属性
   - 确认 Teleport 目标元素存在
   - 验证位置计算逻辑

2. **悬停事件不触发**
   - 检查 CSS pointer-events 属性
   - 确认事件监听器正确绑定
   - 验证元素层级关系

3. **样式显示异常**
   - 确认全局样式文件已引入
   - 检查 CSS 变量定义
   - 验证主题切换逻辑

### 调试方法
```javascript
// 开启调试模式
const DEBUG = true;

if (DEBUG) {
  console.log('Menu hover:', menu);
  console.log('Position:', subMenuPosition.value);
  console.log('Visible:', subMenuVisible.value);
}
```

## 📈 未来规划

1. **智能推荐**: 基于使用频率推荐菜单
2. **手势支持**: 支持触摸手势操作
3. **语音导航**: 集成语音识别导航
4. **个性化**: 用户自定义菜单布局
5. **多语言**: 完善国际化支持

悬停导航模式为用户提供了一种全新的导航体验，在保持界面简洁的同时，提供了高效的菜单访问方式。
