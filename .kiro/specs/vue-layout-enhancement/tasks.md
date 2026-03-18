# 任务文档：vue-layout-enhancement

## 第一组：项目结构熟悉 + 架构梳理

- [x] T01 读取并分析 lay-header/index.vue，记录 props/slots/逻辑到记忆系统
- [x] T02 读取并分析 lay-footer/index.vue，记录 props/slots/逻辑到记忆系统
- [x] T03 读取并分析 lay-navbar/index.vue + themes/Default.vue，记录结构
- [x] T04 读取并分析 lay-tag/index.vue + components/，记录结构
- [x] T05 读取并分析 lay-tool/index.vue + dropdowns/，记录结构
- [x] T06 读取并分析 lay-sidebar 所有 Nav*.vue，记录各导航模式差异
- [x] T07 读取并分析 lay-panel/index.vue + themes/，记录结构
- [x] T08 读取并分析 lay-content/index.vue，记录结构
- [x] T09 读取并分析 lay-search/index.vue，记录结构
- [x] T10 读取并分析 lay-message、lay-message-toast、lay-avatar、lay-account、lay-logout，记录结构
- [x] T11 读取并分析 lay-ai、lay-ai-chat 完整结构，记录服务层架构
- [x] T12 读取并分析 lay-dev-tools、lay-performance、lay-theme-switcher，记录结构
- [x] T13 读取 themes/index.ts + ThemeSkinProvider.vue，梳理主题注册机制
- [x] T14 读取 stores/themeStore.ts + appStore + settingStore，梳理数据流
- [x] T15 将项目架构知识写入记忆系统（lay-xxx 组件地图 + 主题系统 + store 数据流）

## 第二组：设计 Token + 全局样式基础

- [x] T16 创建 `layout/default/src/styles/design-tokens.scss`，定义间距/圆角/阴影/毛玻璃/动效变量
- [x] T17 在 `layout/default/src/styles/layout.scss` 中引入 design-tokens，确保全局可用
- [x] T18 在 `base-override.scss` 中统一覆盖 Element Plus 圆角/间距为新 token 值

## 第三组：lay-navbar 组件化 + 美化

- [x] T19 创建 `lay-navbar/components/NavbarBrand.vue`（logo + 标题区域）
- [x] T20 创建 `lay-navbar/components/NavbarActions.vue`（右侧工具栏区域）
- [x] T21 重构 `lay-navbar/themes/Default.vue`，使用 NavbarBrand + NavbarActions 子组件
- [x] T22 美化 lay-navbar：毛玻璃背景、56px 高度、深色模式适配

## 第四组：lay-header 组件化

- [x] T23 创建 `lay-header/components/HeaderWrapper.vue`（fixed/scroll 两种模式封装）
- [x] T24 重构 `lay-header/index.vue`，使用 HeaderWrapper 子组件

## 第五组：lay-footer 组件化 + 美化

- [x] T25 创建 `lay-footer/components/FooterContent.vue`（版权 + 链接区域）
- [x] T26 重构 `lay-footer/index.vue`，使用 FooterContent 子组件
- [x] T27 美化 lay-footer：毛玻璃背景、48px 高度、居中布局

## 第六组：lay-tag 标签栏美化

- [x] T28 检查 `lay-tag/components/` 现有子组件，补全 TagItem.vue（如缺失）
- [x] T29 检查并补全 TagContextMenu.vue（右键菜单）
- [x] T30 美化 lay-tag：激活态 primary 色底、非激活态透明、关闭按钮 hover 显示

## 第七组：lay-tool 工具栏组件化 + 美化

- [x] T31 创建 `lay-tool/components/ToolItem.vue`（统一 tooltip + icon 结构）
- [x] T32 重构 `lay-tool/index.vue`，使用 ToolItem 子组件
- [x] T33 美化 lay-tool：图标 hover 圆形背景、间距 8px

## 第八组：lay-sidebar 组件化 + 美化

- [x] T34 创建 `lay-sidebar/components/SidebarMenuItem.vue`（单个菜单项）
- [x] T35 创建 `lay-sidebar/components/SidebarSubMenu.vue`（子菜单）
- [x] T36 重构 NavVertical.vue，使用 SidebarMenuItem + SidebarSubMenu
- [x] T37 重构 NavHover.vue，复用 SidebarMenuItem
- [x] T38 美化 lay-sidebar：220px 宽度、40px 菜单项、激活态左侧 3px 色条

## 第九组：lay-setting 设置面板美化

- [x] T39 美化 lay-setting 面板整体布局：360px 宽、分组标题样式、选项行高度
- [x] T40 美化 SettingTheme.vue：主题卡片网格布局，节日主题分组展示
- [x] T41 美化 SettingLayout.vue：布局选项图标更大更清晰
- [x] T42 美化 SettingDisplay.vue：开关/滑块对齐统一
- [x] T43 美化 SettingAiChat.vue：AI 设置分区更清晰

## 第十组：lay-search 组件化 + 美化

- [x] T44 检查 `lay-search/` 现有结构
- [x] T45 创建 `lay-search/components/SearchInput.vue`（全屏遮罩 + 居中搜索框）
- [x] T46 创建 `lay-search/components/SearchResult.vue`（搜索结果列表）
- [x] T47 美化 lay-search：毛玻璃遮罩、圆角搜索框、结果卡片

## 第十一组：lay-message / lay-avatar / lay-account 组件化

- [x] T48 创建 `lay-message/components/MessageItem.vue`
- [x] T49 创建 `lay-avatar/components/AvatarDropdown.vue`
- [x] T50 创建 `lay-account/components/AccountInfo.vue`
- [x] T51 创建 `lay-logout/components/LogoutConfirm.vue`

## 第十二组：lay-ai-chat 组件化检查

- [x] T52 检查 `lay-ai-chat/` 现有 components/ 结构，补全缺失子组件
- [x] T53 美化 AI 聊天面板：消息气泡圆角、用户/AI 区分配色

## 第十三组：lay-theme-switcher 增强

- [x] T54 检查 `lay-theme-switcher/` 现有结构
- [x] T55 重构 lay-theme-switcher：支持节日主题分组展示（regular / beta / festival 三组）
- [x] T56 添加节日主题倒计时显示（距离节日还有 X 天）

## 第十四组：节日主题 SCSS

- [x] T57 创建 `themes/halloween.scss`：南瓜橙 + 幽灵紫 + 深紫黑背景变量
- [x] T58 创建 `themes/christmas.scss`：圣诞红 + 松绿 + 金色变量
- [x] T59 创建 `themes/spring-festival.scss`：中国红 + 金黄变量
- [x] T60 在 `themes/index.ts` 注册三个节日主题（halloween / christmas / spring-festival）
- [x] T61 在 `index.vue` 中引入三个节日主题 scss

## 第十五组：万圣节特效组件

- [x] T62 创建 `lay-festival/halloween/HalloweenSpider.vue`（Canvas 蜘蛛网，四角装饰）
- [x] T63 创建 `lay-festival/halloween/HalloweenGhost.vue`（CSS 动画幽灵飘动）
- [x] T64 创建 `lay-festival/halloween/HalloweenPumpkin.vue`（SVG 南瓜灯装饰）
- [x] T65 创建 `packages/components/ScHalloweenCard/index.vue`（蜘蛛网纹理卡片）
- [x] T66 创建 `packages/components/ScHalloweenButton/index.vue`（南瓜橙渐变按钮）

## 第十六组：圣诞节特效组件

- [x] T67 创建 `lay-festival/christmas/ChristmasSnow.vue`（Canvas 雪花粒子系统）
- [x] T68 创建 `lay-festival/christmas/ChristmasTree.vue`（SVG 圣诞树 + 闪烁灯）
- [x] T69 创建 `packages/components/ScChristmasCard/index.vue`（雪花纹理卡片）
- [x] T70 创建 `packages/components/ScChristmasBadge/index.vue`（圣诞风格徽章）

## 第十七组：春节特效组件

- [x] T71 创建 `lay-festival/spring-festival/SpringFestivalFirework.vue`（Canvas 烟花粒子）
- [x] T72 创建 `lay-festival/spring-festival/SpringFestivalLantern.vue`（SVG 灯笼 + 摆动动画）
- [x] T73 创建 `packages/components/ScSpringFestivalCard/index.vue`（红色渐变卡片）
- [x] T74 创建 `packages/components/ScSpringFestivalTag/index.vue`（红色胶囊标签）

## 第十八组：FestivalLayer 挂载

- [x] T75 创建 `lay-festival/index.vue`（FestivalLayer，根据主题动态渲染节日特效）
- [x] T76 在 `index.vue` 中挂载 `<FestivalLayer :theme="currentSkin" />`
- [x] T77 验证三个节日主题切换时特效组件正确渲染/卸载

## 第十九组：Vue 文件修复 - layout 组件

- [x] T78 扫描 `layout/default/src/components/**/*.vue`，收集所有 ESLint/TS 错误
- [x] T79 修复 lay-navbar 相关 .vue 文件的 TS 错误
- [x] T80 修复 lay-sidebar 相关 .vue 文件的 TS 错误
- [x] T81 修复 lay-setting 相关 .vue 文件的 TS 错误
- [x] T82 修复 lay-tag 相关 .vue 文件的 TS 错误
- [x] T83 修复 lay-tool 相关 .vue 文件的 TS 错误
- [x] T84 修复 lay-ai-chat 相关 .vue 文件的 TS 错误
- [x] T85 修复其余 lay-xxx 组件的 TS/ESLint 错误

## 第二十组：Vue 文件修复 - packages/components

- [x] T86 扫描 `packages/components/Sc*/**/*.vue`，收集高优先级错误
- [x] T87 修复 ScButton、ScCard、ScTable 的 TS 错误
- [x] T88 修复 ScForm、ScFormItem、ScInput 的 TS 错误
- [x] T89 修复 ScDialog、ScDrawer、ScSelect 的 TS 错误
- [x] T90 修复其余 Sc-xxx 组件的高优先级错误

## 第二十一组：全局样式统一 + 收尾

- [x] T91 统一所有 lay-xxx 组件的过渡动效（使用 --transition-fast/base/slow）
- [x] T92 验证 default 主题下所有 lay-xxx 组件样式无错位
- [x] T93 验证 8bit 主题下所有 lay-xxx 组件样式无错位
- [x] T94 验证 future-tech 主题下所有 lay-xxx 组件样式无错位
- [x] T95 验证 halloween 主题下特效组件正常渲染
- [x] T96 验证 christmas 主题下特效组件正常渲染
- [x] T97 验证 spring-festival 主题下特效组件正常渲染
- [x] T98 验证深色模式下所有主题样式正确
- [x] T99 运行 getDiagnostics 确认修复后无新增错误
- [x] T100 将项目架构最终状态写入记忆系统，归档 spec
