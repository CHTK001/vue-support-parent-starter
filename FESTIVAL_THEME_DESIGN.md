# 节日皮肤主题设计方案 - 沉浸式风格

## 🎨 设计理念

选择任意节日主题后，**整个应用界面完全转变为节日风格**，包括：
- 颜色主题切换
- 组件样式改变
- 节日装饰元素（灯笼、烟花、雪花等）
- 动画和交互效果

---

## 🎆 春节主题示例

### 现状（默认风格）
```
┌─────────────────────────────────────────────┐
│  [Logo]  导航菜单1  导航菜单2  设置          │ ← 黑色/灰色导航栏
├────────────────────┬────────────────────────┤
│                    │                        │
│   侧边栏           │   标签页区域           │
│  ☐ 菜单1           │ [Tab1] [Tab2]          │
│  ☐ 菜单2           │                        │
│  ☐ 菜单3           │  内容区域              │
│                    │                        │
└────────────────────┴────────────────────────┘
```

### 选择春节主题后（沉浸式风格）
```
🏮─────────────────────────────────────────🏮
│ [Logo]  🎆导航菜单1🎆  导航菜单2  设置  🎊 │ ← 红色导航栏 + 灯笼装饰
├────────────────────┬────────────────────────┤
│                    │                        │
│  🏮侧边栏🏮        │  ✨标签页区域✨        │
│  ☑ 菜单1 (红背)    │ 🎆[Tab1]🎆 [Tab2]    │
│  ☑ 菜单2 (红背)    │ (金色边框)             │
│  ☑ 菜单3 (红背)    │                        │
│                    │  内容区域              │
│  (红色渐变BG)     │ (淡红色BG + 暗纹)     │
│                    │                        │
└────────────────────┴────────────────────────┘
                ✨ 动画烟花 ✨
```

---

## 🎨 具体组件变化示例

### 1. lay-tag（标签组件）

#### 默认风格
```html
<div class="lay-tag">
  <!-- 纯色背景，圆角 -->
  <span class="tag-label">tag-name</span>
</div>
```

#### 春节主题
```html
<div class="lay-tag theme-spring-festival">
  <!-- 在标签左右两侧添加灯笼装饰 -->
  <span class="tag-lantern left">🏮</span>
  <span class="tag-label" style="background: linear-gradient(135deg, #ff6b6b, #ff8787)">
    tag-name
  </span>
  <span class="tag-lantern right">🏮</span>
</div>
```

**CSS变化**：
```css
.theme-spring-festival .lay-tag {
  background: linear-gradient(135deg, #fef5f5 0%, #fff5f5 100%);
  border: 2px solid #f5222d;
  border-radius: 15px;
  padding: 8px 16px;
  position: relative;
}

.theme-spring-festival .tag-label {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  color: white;
  border-radius: 8px;
  padding: 4px 12px;
  font-weight: bold;
}

.theme-spring-festival .tag-lantern {
  position: absolute;
  font-size: 18px;
  animation: swing 2s ease-in-out infinite;
  top: -12px;
}

.theme-spring-festival .tag-lantern.left {
  left: -15px;
  animation-delay: 0s;
}

.theme-spring-festival .tag-lantern.right {
  right: -15px;
  animation-delay: 0.5s;
}

@keyframes swing {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}
```

---

### 2. lay-sidebar（侧边栏）

#### 默认风格
```
侧边栏（灰白色）
├─ 菜单1
├─ 菜单2
├─ 菜单3
└─ 菜单4
```

#### 春节主题
```
🏮┏━━━━━━━━━━━┓🏮
  ┃ 侧边栏   ┃    (红色渐变背景 + 暗纹理)
  ┣ 🧨菜单1  ┫    (红色高亮 + 金色文字)
  ┃ 🧨菜单2  ┃    (悬停时闪烁)
  ┃ 🧨菜单3  ┃
  ┃ 🧨菜单4  ┃
  ┗━━━━━━━━━━━┛
   ✨ 烟花动画 ✨
```

**CSS变化**：
```css
.theme-spring-festival .lay-sidebar {
  background: linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%);
  background-image: 
    url('data:image/svg+xml;...'), /* 暗纹理图案 */
    linear-gradient(135deg, #8b0000 0%, #ff6b6b 100%);
  border-right: 3px solid #ffd700;
  color: #ffd700;
}

.theme-spring-festival .sidebar-item {
  color: #ffd700;
  border-left: 3px solid transparent;
  transition: all 0.3s ease;
}

.theme-spring-festival .sidebar-item:hover {
  background-color: rgba(255, 215, 0, 0.2);
  border-left-color: #ffd700;
  animation: blink 0.5s infinite;
}

.theme-spring-festival .sidebar-item.active {
  background-color: rgba(255, 215, 0, 0.3);
  border-left-color: #ffd700;
  font-weight: bold;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

---

### 3. lay-header（导航栏）

#### 默认风格
```
┌───────────────────────────────┐
│ Logo  菜单1  菜单2  菜单3  设置 │
└───────────────────────────────┘
```

#### 春节主题
```
🏮┌──────────────────────────────┐🏮
  │ Logo  🎆菜单1🎆  菜单2  菜单3  设置 │
  │       (红色背景 + 灯笼)              │
  └──────────────────────────────┘
  ✨ 烟花粒子效果 ✨
```

**CSS变化**：
```css
.theme-spring-festival .lay-header {
  background: linear-gradient(90deg, #8b0000 0%, #ff4444 50%, #8b0000 100%);
  border-bottom: 3px solid #ffd700;
  box-shadow: 0 4px 20px rgba(245, 34, 45, 0.3);
}

.theme-spring-festival .header-menu {
  color: #ffd700;
  position: relative;
}

.theme-spring-festival .header-menu::before,
.theme-spring-festival .header-menu::after {
  content: '🏮';
  margin: 0 8px;
  animation: swing 2s ease-in-out infinite;
}

/* 烟花粒子效果 */
.theme-spring-festival .lay-header::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle 2px at 20% 50%, #ffd700, rgba(255,215,0,0));
  background-size: 200% 200%;
  animation: fireworks 1s ease-out infinite;
}

@keyframes fireworks {
  0% {
    background-position: 0% 0%;
    opacity: 1;
  }
  100% {
    background-position: 100% 100%;
    opacity: 0;
  }
}
```

---

### 4. lay-tabs（标签页）

#### 默认风格
```
[Tab1] [Tab2] [Tab3]
```

#### 春节主题
```
🎆[Tab1]🎆  [Tab2]  [Tab3]
│金色边框，红色背景，闪烁动画│
```

**CSS变化**：
```css
.theme-spring-festival .lay-tabs {
  border-bottom: 2px solid #ffd700;
  background: linear-gradient(90deg, transparent, rgba(255,107,107,0.1));
}

.theme-spring-festival .tab-item {
  color: #333;
  border: none;
  position: relative;
}

.theme-spring-festival .tab-item::before,
.theme-spring-festival .tab-item::after {
  content: '✨';
  font-size: 12px;
  position: absolute;
  top: -6px;
  opacity: 0;
}

.theme-spring-festival .tab-item::before {
  left: -8px;
}

.theme-spring-festival .tab-item::after {
  right: -8px;
}

.theme-spring-festival .tab-item.active {
  background: linear-gradient(135deg, #ff6b6b, #ff8787);
  color: white;
  border: 2px solid #ffd700;
  border-radius: 8px 8px 0 0;
  font-weight: bold;
  box-shadow: 0 -2px 10px rgba(245, 34, 45, 0.3);
  animation: pulse 1.5s ease-in-out infinite;
}

.theme-spring-festival .tab-item.active::before,
.theme-spring-festival .tab-item.active::after {
  opacity: 1;
  animation: twinkle 0.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 -2px 10px rgba(245, 34, 45, 0.3); }
  50% { box-shadow: 0 -2px 20px rgba(245, 34, 45, 0.6); }
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
```

---

## 🎄 圣诞主题示例

### 圣诞侧边栏
```
🎄┏━━━━━━━━━━━┓🎄
  ┃ 侧边栏   ┃     (深绿色 + 金色)
  ┣ 🔴菜单1  ┫     (红绿相间)
  ┃ 🔴菜单2  ┃     (闪烁彩灯)
  ┃ 🔴菜单3  ┃
  ┃ 🔴菜单4  ┃
  ┗━━━━━━━━━━━┛
   ⛄ 飘雪动画 ⛄
```

**CSS变化**：
```css
.theme-christmas .lay-sidebar {
  background: linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%);
  border-right: 3px solid #ffd700;
  color: #fff;
}

.theme-christmas .sidebar-item {
  color: #fff;
  border-left: 3px solid transparent;
}

.theme-christmas .sidebar-item::before {
  content: '🔴';
  margin-right: 8px;
  animation: colorChange 1s ease-in-out infinite;
}

.theme-christmas .sidebar-item:hover::before {
  animation: spin 0.6s ease-in-out;
}

/* 飘雪效果 */
.theme-christmas .lay-sidebar::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image: url('data:image/svg+xml;...');
  animation: snowfall 10s linear infinite;
}

@keyframes colorChange {
  0%, 100% { color: #ff0000; }
  50% { color: #00ff00; }
}

@keyframes snowfall {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}
```

---

## 🌙 中秋主题示例

### 中秋标签页
```
╔════════════════════════╗
║  🌕 Tab1 🌙 [Tab2] 🌟 ║  (星月装饰)
║     (蓝紫色主题)        ║
╚════════════════════════╝
```

**CSS变化**：
```css
.theme-mid-autumn .lay-tabs {
  background: linear-gradient(90deg, #0a1128, #1a2a4a);
  border-bottom: 2px solid #ffe4b3;
}

.theme-mid-autumn .tab-item.active {
  background: linear-gradient(135deg, #0a1128, #1a2a4a);
  color: #ffe4b3;
  border: 2px solid #ffe4b3;
  text-shadow: 0 0 10px rgba(255, 228, 179, 0.5);
  font-weight: bold;
}

.theme-mid-autumn .tab-item.active::before,
.theme-mid-autumn .tab-item.active::after {
  content: '🌙';
  margin: 0 6px;
  font-size: 16px;
}

/* 月光效果 */
.theme-mid-autumn .lay-tabs::after {
  content: '🌕';
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  opacity: 0.8;
  animation: moonGlow 3s ease-in-out infinite;
}

@keyframes moonGlow {
  0%, 100% { opacity: 0.8; text-shadow: 0 0 10px #ffe4b3; }
  50% { opacity: 1; text-shadow: 0 0 20px #ffe4b3; }
}
```

---

## 🏮 元旦主题示例

### 元旦导航栏
```
🎆┌─────────────────────────────┐🎆
  │ 🎉Logo  [菜单] [菜单] 设置   │  (蓝紫渐变)
  │         (烟火闪烁)           │
  └─────────────────────────────┘
    ✨ 冰花边框 ✨
```

**CSS变化**：
```css
.theme-new-year .lay-header {
  background: linear-gradient(90deg, #1890ff, #8c2db8);
  border-bottom: 3px solid #ffd700;
  box-shadow: 0 4px 20px rgba(24, 144, 255, 0.3);
}

.theme-new-year .header-menu::before,
.theme-new-year .header-menu::after {
  content: '🎆';
  animation: firework-burst 0.8s ease-out infinite;
}

@keyframes firework-burst {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1.5) rotate(360deg);
    opacity: 0;
  }
}
```

---

## 📊 主题配置结构

```typescript
interface ThemeSkinConfig {
  key: string;                    // 'spring-festival', 'christmas' 等
  name: string;                   // '春节', '圣诞'
  
  // 颜色配置
  colors: {
    primary: string;              // '#f5222d'
    secondary: string;            // '#ff7a7a'
    accent: string;               // '#ffd700'
    background: string;           // '#fef5f5'
  };
  
  // 装饰元素
  decorations: {
    left: string;                 // '🏮'
    right: string;                // '🏮'
    animation: string;            // 'swing'
  };
  
  // 特殊效果
  effects: {
    particle: string;             // 'fireworks' | 'snowfall'
    animate: boolean;
    particleChar: string;          // '✨' | '⛄'
  };
}
```

---

## 🎭 组件-主题映射表

| 组件 | 默认 | 春节 | 圣诞 | 中秋 | 元旦 |
|------|------|------|------|------|------|
| **lay-sidebar** | 灰色 | 红金 | 绿金 | 蓝月 | 蓝紫 |
| **lay-header** | 白黑 | 红灯 | 绿灯 | 紫月 | 蓝火 |
| **lay-tag** | 纯色 | 灯笼 | 彩灯 | 月亮 | 烟火 |
| **lay-tabs** | 简洁 | 金边 | 金边 | 月边 | 金边 |
| **动画** | 无 | 摇摆/烟花 | 雪花 | 月光 | 烟火 |
| **文字** | 默认 | 金色 | 白色 | 淡黄 | 金色 |

---

## 🔧 实现方式

### 方案 1：CSS变量 + 类名覆盖
```css
/* 基础样式 */
.lay-tag {
  background: var(--tag-bg);
  color: var(--tag-color);
}

/* 春节主题 */
.theme-spring-festival {
  --tag-bg: linear-gradient(135deg, #ff6b6b, #ff8787);
  --tag-color: white;
}

.theme-spring-festival .lay-tag::before {
  content: '🏮';
}

.theme-spring-festival .lay-tag::after {
  content: '🏮';
}
```

### 方案 2：Scoped CSS Files
```
themes/
├── spring-festival.css
├── christmas.css
├── mid-autumn.css
├── national-day.css
├── valentines-day.css
└── new-year.css
```

每个文件包含完整的该主题下所有组件的样式。

---

## ✨ 实现优先级

**Phase 1（核心组件）**：
- [ ] lay-sidebar
- [ ] lay-header
- [ ] lay-tag
- [ ] lay-tabs

**Phase 2（扩展组件）**：
- [ ] lay-menu
- [ ] lay-button
- [ ] lay-dialog
- [ ] lay-search

**Phase 3（装饰效果）**：
- [ ] 粒子动画（烟花、雪花）
- [ ] 背景纹理
- [ ] 特殊渐变

---

## 🎯 预期效果

当用户选择「春节主题」时：
- ✅ 整个应用 = 春节风格
- ✅ 侧边栏变红 + 灯笼动画
- ✅ 标签加灯笼装饰
- ✅ 导航栏烟花效果
- ✅ 所有按钮、输入框等都应用春节配色
- ✅ 页面充满节日气氛

---

**这就是你想要的"沉浸式节日皮肤"效果！** 🎊
