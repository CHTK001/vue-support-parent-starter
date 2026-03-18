# 需求文档：vue-layout-enhancement

## 背景

`vue-support-parent-starter` 是一个基于 Vue 3 + Element Plus 的企业级前端框架，包含：
- `layout/default/src/components/` 下 23 个 `lay-xxx` 布局组件
- `packages/components/` 下 100+ `Sc-xxx` 业务组件
- 现有主题：default、8bit（beta）、future-tech（beta）

## 需求范围

### 需求 1：熟悉项目结构（探索 + 文档化）
- 梳理所有 lay-xxx 组件的职责、props、slots、事件
- 梳理 packages/components 中 Sc-xxx 组件的导出情况
- 梳理主题系统架构（ThemeSkinProvider、themes/index.ts、scss 变量体系）
- 梳理 stores（themeStore、appStore、settingStore 等）数据流
- 输出项目架构知识到记忆系统

### 需求 2：lay-xxx 全部组件化
将现有 lay-xxx 组件中内联的逻辑、样式、子结构提取为独立的可复用子组件，目标：
- 每个 lay-xxx 组件拆分为 `index.vue` + `themes/` + `components/` 三层结构（已有的保持一致）
- 提取公共 composable（如 useNavbar、useTag、useFooter 等）
- 确保每个组件有明确的 props 定义和 emits 声明
- 组件间通过 provide/inject 或 store 通信，不直接耦合

目标组件（尚未完全组件化的）：
- lay-header（当前只有 index.vue，无 themes/components 分层）
- lay-footer（当前只有 index.vue）
- lay-navbar（有 themes/ 但无 components/）
- lay-tag（有 themes/ 和 components/，需检查完整性）
- lay-tool（有 themes/ 和 dropdowns/，需检查完整性）
- lay-panel（有 themes/，需检查完整性）
- lay-content（需检查）
- lay-frame（需检查）
- lay-search（需检查）
- lay-message（需检查）
- lay-message-toast（需检查）
- lay-avatar（需检查）
- lay-account（需检查）
- lay-logout（需检查）
- lay-ai（需检查）
- lay-ai-chat（需检查完整性）
- lay-dev-tools（需检查）
- lay-performance（需检查）
- lay-theme-switcher（需检查）

### 需求 3：节日主题系统
实现万圣节等有特色的节日主题，包含：

#### 3.1 万圣节主题（halloween）
- SCSS 变量：南瓜橙 + 幽灵紫 + 黑色背景
- 特效：蜘蛛网装饰、南瓜图标、幽灵飘动动画
- 特殊组件：HalloweenSpider（蜘蛛网）、HalloweenGhost（幽灵）、HalloweenPumpkin（南瓜灯）
- 注册到 themes/index.ts 的 festival 类型

#### 3.2 圣诞节主题（christmas）
- SCSS 变量：圣诞红 + 松绿 + 金色
- 特效：雪花飘落动画、圣诞树装饰
- 特殊组件：ChristmasSnow（雪花）、ChristmasTree（圣诞树）
- 注册到 themes/index.ts 的 festival 类型

#### 3.3 春节主题（spring-festival）
- SCSS 变量：中国红 + 金黄 + 喜庆配色
- 特效：烟花动画、灯笼装饰
- 特殊组件：SpringFestivalFirework（烟花）、SpringFestivalLantern（灯笼）
- 注册到 themes/index.ts 的 festival 类型

#### 3.4 主题切换器增强
- lay-theme-switcher 组件支持节日主题分组展示
- 节日主题显示倒计时（距离节日还有 X 天）
- 支持手动强制启用节日主题

### 需求 4：Vue 文件问题修复 + 页面美化
- 扫描所有 .vue 文件的 ESLint/TypeScript 诊断错误
- 修复 unused variable、missing props type、any 类型等警告
- 统一组件 template 缩进和格式
- 美化各页面：
  - lay-setting 设置面板：分组更清晰，间距更合理
  - lay-navbar：深色模式下对比度优化
  - lay-tag 标签栏：激活态样式更明显
  - lay-footer：内容居中，字体大小统一
  - lay-sidebar 各导航模式：hover 态、激活态样式统一

## 验收标准

1. 所有 lay-xxx 组件均有 `components/` 子目录（或明确说明不需要）
2. 万圣节/圣诞/春节三个节日主题可在设置面板切换并生效
3. 节日特殊组件在对应主题激活时自动渲染
4. ESLint 错误数量减少 80% 以上
5. 页面视觉一致性：所有主题下 lay-xxx 组件样式无明显错位或溢出
