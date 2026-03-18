# 设计文档：vue-layout-enhancement

## 一、架构总览

```
layout/default/src/
├── components/
│   ├── lay-xxx/                  # 每个布局组件
│   │   ├── index.vue             # 入口，只做组合
│   │   ├── components/           # 子组件（提取的内联逻辑）
│   │   └── themes/               # 主题变体（Default.vue / FutureTech.vue 等）
│   └── lay-festival/             # 新增：节日特效组件容器
│       ├── index.vue             # 根据当前主题渲染对应节日特效
│       ├── halloween/            # 万圣节特效组件
│       ├── christmas/            # 圣诞节特效组件
│       └── spring-festival/      # 春节特效组件
├── themes/
│   ├── halloween.scss            # 万圣节主题变量
│   ├── christmas.scss            # 圣诞节主题变量
│   ├── spring-festival.scss      # 春节主题变量
│   └── index.ts                  # 注册新主题
└── packages/components/
    ├── ScHalloween*/             # 万圣节专属 Sc 组件
    ├── ScChristmas*/             # 圣诞节专属 Sc 组件
    └── ScSpringFestival*/        # 春节专属 Sc 组件
```

---

## 二、lay-xxx 组件化设计

### 2.1 统一分层规范

每个 lay-xxx 组件遵循三层结构：

```
lay-xxx/
├── index.vue          # 入口：仅负责主题分发 + 组合子组件
├── components/        # 子组件：提取的内联逻辑块
│   ├── XxxItem.vue
│   └── XxxAction.vue
└── themes/            # 主题变体
    ├── Default.vue    # 默认主题实现
    └── FutureTech.vue # 未来科技主题实现（如有差异）
```

### 2.2 各组件改造方案

#### lay-header
- 当前：单文件 index.vue，内联 fixed-header 逻辑
- 改造：提取 `components/HeaderWrapper.vue`（fixed/scroll 两种模式）
- props：`fixed: boolean`、`shadow: boolean`

#### lay-footer
- 当前：单文件 index.vue
- 改造：提取 `components/FooterContent.vue`
- 设计：毛玻璃背景 + 居中布局 + 版权/链接分区
- props：`copyright: string`、`links: FooterLink[]`

#### lay-navbar
- 当前：index.vue + themes/Default.vue
- 改造：提取 `components/NavbarBrand.vue`（logo+标题）、`components/NavbarActions.vue`（右侧工具栏）
- 深色模式：`html.dark &` 覆盖背景色（已有，保持）

#### lay-tag（标签栏）
- 当前：index.vue + themes/ + components/
- 改造：检查并补全 `components/TagItem.vue`、`components/TagContextMenu.vue`
- 设计：激活态用 primary 色底 + 白字，非激活态半透明

#### lay-tool（顶部工具栏）
- 当前：index.vue + themes/ + dropdowns/
- 改造：提取 `components/ToolItem.vue`（统一 tooltip + icon 结构）
- 设计：图标 hover 态圆形背景，间距 8px

#### lay-sidebar（导航栏）
- 当前：多个 Nav*.vue 文件
- 改造：提取公共 `components/SidebarMenuItem.vue`、`components/SidebarSubMenu.vue`
- 设计：激活态左侧 3px primary 色条 + 背景高亮

#### lay-content
- 改造：提取 `components/ContentWrapper.vue`（padding/overflow 控制）

#### lay-search
- 改造：提取 `components/SearchInput.vue`、`components/SearchResult.vue`
- 设计：全屏遮罩 + 居中搜索框，毛玻璃效果

#### lay-message / lay-message-toast
- 改造：提取 `components/MessageItem.vue`
- 设计：右上角通知，带图标+标题+内容三行布局

#### lay-avatar
- 改造：提取 `components/AvatarDropdown.vue`
- 设计：头像圆形 + hover 阴影，下拉菜单圆角卡片

#### lay-account / lay-logout
- 改造：提取 `components/AccountInfo.vue`、`components/LogoutConfirm.vue`

#### lay-ai / lay-ai-chat
- 改造：检查并补全 `components/` 子组件分层

#### lay-dev-tools / lay-performance / lay-theme-switcher
- 改造：各自提取内联逻辑为子组件

---

## 三、节日主题设计

### 3.1 主题变量体系

每个节日主题覆盖以下 CSS 变量：

```scss
// 示例：万圣节
[data-skin="halloween"] {
  --el-color-primary: #ff6b35;        // 南瓜橙
  --el-color-primary-dark-2: #e55a20;
  --layout-bg: #1a0a2e;               // 深紫黑背景
  --layout-sidebar-bg: #12071f;
  --layout-navbar-bg: #1a0a2e;
  --layout-text-primary: #f0e6ff;
  --festival-accent: #9b59b6;         // 幽灵紫
  --festival-glow: 0 0 20px rgba(155, 89, 182, 0.5);
}
```

### 3.2 万圣节主题（halloween）

**配色**：南瓜橙 `#ff6b35` + 幽灵紫 `#9b59b6` + 深紫黑背景 `#1a0a2e`

**特效组件**（常驻，挂载在 `lay-festival/index.vue`）：
- `HalloweenSpider.vue`：Canvas 绘制蜘蛛网，固定在页面四角，透明度 0.15
- `HalloweenGhost.vue`：CSS 动画幽灵飘动，随机位置，pointer-events: none
- `HalloweenPumpkin.vue`：南瓜灯 SVG，固定在 navbar 右侧装饰区

**专属 Sc 组件**：
- `ScHalloweenCard.vue`：带蜘蛛网纹理背景的卡片，边框发光效果
- `ScHalloweenButton.vue`：南瓜橙渐变按钮，hover 时幽灵紫发光

### 3.3 圣诞节主题（christmas）

**配色**：圣诞红 `#c0392b` + 松绿 `#27ae60` + 金色 `#f39c12`

**特效组件**：
- `ChristmasSnow.vue`：Canvas 雪花粒子系统，60fps requestAnimationFrame
- `ChristmasTree.vue`：SVG 圣诞树，固定在页面右下角，带闪烁灯效果

**专属 Sc 组件**：
- `ScChristmasCard.vue`：雪花纹理卡片，圆角 16px，红绿配色
- `ScChristmasBadge.vue`：圣诞风格徽章，带铃铛图标

### 3.4 春节主题（spring-festival）

**配色**：中国红 `#e74c3c` + 金黄 `#f1c40f` + 深红 `#c0392b`

**特效组件**：
- `SpringFestivalFirework.vue`：Canvas 烟花粒子，点击触发 + 自动定时触发
- `SpringFestivalLantern.vue`：SVG 灯笼，顶部左右各一个，摆动动画

**专属 Sc 组件**：
- `ScSpringFestivalCard.vue`：红色渐变卡片，金色边框，祥云纹理
- `ScSpringFestivalTag.vue`：红色标签，金色文字，圆角胶囊形

### 3.5 节日主题注册

在 `themes/index.ts` 中新增：

```ts
{ name: "万圣节", key: "halloween", type: "festival", color: "#ff6b35", icon: "ri:ghost-line", baseStyle: "dark" },
{ name: "圣诞节", key: "christmas", type: "festival", color: "#c0392b", icon: "ri:christmas-line", baseStyle: "light" },
{ name: "春节", key: "spring-festival", type: "festival", color: "#e74c3c", icon: "ri:fire-line", baseStyle: "light" },
```

### 3.6 FestivalLayer 挂载机制

在 `index.vue` 中，`ThemeSkinProvider` 内部新增 `<FestivalLayer />` 组件：

```vue
<FestivalLayer :theme="currentSkin" />
```

`FestivalLayer` 根据 `theme` 动态渲染对应节日特效，非节日主题时渲染空节点。

---

## 四、UI/UX 美化设计规范

参考：Linear、Vercel Dashboard、Notion、Raycast 等当代顶级产品设计语言。

### 4.1 设计 Token

```scss
// 间距系统（8px 基准）
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;

// 圆角系统
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;
--radius-full: 9999px;

// 阴影系统
--shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.06);
--shadow-md: 0 4px 6px rgba(0,0,0,.07), 0 2px 4px rgba(0,0,0,.06);
--shadow-lg: 0 10px 15px rgba(0,0,0,.1), 0 4px 6px rgba(0,0,0,.05);

// 毛玻璃
--glass-bg: rgba(255,255,255,.72);
--glass-blur: blur(12px);
--glass-border: 1px solid rgba(255,255,255,.2);
```

### 4.2 lay-navbar 美化

- 高度：56px（当前可能不统一）
- 背景：毛玻璃 `--glass-bg` + `backdrop-filter: blur(12px)`
- 底部边框：`1px solid rgba(0,0,0,.06)`
- 深色模式：`rgba(18,18,18,.8)` + `blur(12px)`
- Logo 区：左侧 20px padding，字体 weight 600

### 4.3 lay-sidebar 美化

- 宽度：220px（展开）/ 64px（收起）
- 背景：纯白（浅色）/ `#111` （深色）
- 菜单项高度：40px，圆角 8px，左右 margin 8px
- 激活态：primary 色背景 10% 透明度 + primary 色文字 + 左侧 3px 实色条
- hover 态：`rgba(0,0,0,.04)` 背景
- 图标：20px，与文字间距 10px

### 4.4 lay-tag 标签栏美化

- 高度：40px
- 标签项：圆角 6px，padding 0 12px，最大宽度 160px 超出省略
- 激活态：primary 色背景，白色文字，无边框
- 非激活态：透明背景，`--el-text-color-regular` 文字，hover 时 `rgba(0,0,0,.04)` 背景
- 关闭按钮：hover 时显示，圆形 16px

### 4.5 lay-setting 设置面板美化

- 宽度：360px，右侧抽屉
- 分组标题：12px 大写字母，`--el-text-color-secondary`，上方 24px 间距
- 选项行：高度 48px，左右 padding 20px
- 分割线：`rgba(0,0,0,.06)`
- 底部操作按钮：固定在底部，毛玻璃背景

### 4.6 lay-footer 美化

- 高度：48px
- 背景：毛玻璃
- 内容：版权居中，两侧可选链接
- 字体：12px，`--el-text-color-secondary`

### 4.7 全局动效规范

```scss
// 统一过渡
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
```

所有 hover/active 状态使用 `transition: var(--transition-fast)`。

---

## 五、Vue 文件修复策略

### 5.1 扫描范围

- `layout/default/src/**/*.vue`
- `packages/components/**/*.vue`（重点 Sc-xxx 组件）

### 5.2 修复优先级

1. **Error 级**：未定义变量、类型错误、缺少必填 props → 必须修复
2. **Warning 级**：unused import、any 类型、缺少 emits 声明 → 尽量修复
3. **Info 级**：格式、注释 → 按需修复

### 5.3 修复规范

- 所有 `defineProps` 使用 TypeScript 泛型语法
- 所有 `defineEmits` 显式声明
- 移除所有 `@ts-ignore`（改为正确类型）
- 统一使用 `<script setup lang="ts">`

---

## 六、文件变更清单（预估）

| 分类 | 新增文件 | 修改文件 |
|------|---------|---------|
| lay-xxx 组件化 | ~40 个子组件 | ~20 个 index.vue |
| 节日主题 scss | 3 个 | themes/index.ts |
| 节日特效组件 | 9 个特效 + 6 个 Sc 组件 | index.vue（挂载 FestivalLayer）|
| UI 美化 | 1 个 design-tokens.scss | ~15 个组件样式 |
| Vue 文件修复 | 0 | ~30 个 .vue 文件 |

**总计：约 60 个新增文件，约 65 个修改文件**
