# 登录主题管理功能使用指南

## 功能概述

系统提供了可视化的主题管理界面，管理员可以在系统配置页面中预览和切换登录页面主题，无需手动编辑配置文件。

## 启用主题管理功能

### 1. 配置开关

在 `application.yml` 中启用主题管理功能：

```yaml
# 是否在系统配置中显示主题管理功能
# 开启后，管理员可以在系统配置页面手动切换登录主题
EnableThemeManagement: true
```

### 2. 访问主题管理

1. 登录系统后台
2. 进入 **系统设置** → **系统配置**
3. 点击 **主题管理** 选项卡

## 功能特性

### 1. 主题预览

- **可视化预览**：每个主题都有独特的预览卡片，展示主题风格
- **主题信息**：显示主题名称和描述
- **当前标识**：当前使用的主题会显示"当前使用"标签

### 2. 主题切换

#### 常规主题

- **现代简约**：默认主题，简洁大方
- **科技未来**：科技感十足，粒子动画效果
- **商务专业**：商务风格，专业稳重
- **随机主题**：每次登录随机选择主题

#### 节日主题

- **春节主题**：红灯笼、烟花、雪花动画
- **中秋主题**：月亮、星空、云朵动画
- **圣诞主题**：圣诞树、彩灯、雪花动画

### 3. 节日主题开关

- **启用节日主题**：开启后，系统会在节日期间自动切换到对应主题
- **禁用节日主题**：关闭后，始终使用选择的常规主题
- **智能切换**：关闭节日主题时，如果当前使用的是节日主题，会自动切换回默认主题

## 使用步骤

### 步骤 1：选择主题

1. 在主题管理页面浏览所有可用主题
2. 点击想要使用的主题卡片
3. 被选中的主题会显示高亮边框

### 步骤 2：配置节日主题

- 如果希望在节日期间自动切换主题，开启"启用节日主题"开关
- 如果不希望自动切换，关闭该开关

### 步骤 3：保存配置

1. 点击页面底部的"保存配置"按钮
2. 系统会保存配置到数据库
3. 提示"保存成功，重新登录后生效"

### 步骤 4：查看效果

1. 退出当前登录
2. 重新访问登录页面
3. 查看新主题效果

## 主题配置说明

### 配置存储

主题配置存储在系统配置表中，配置组为 `theme`：

| 配置项 | 说明 | 可选值 |
|--------|------|--------|
| LoginTheme | 登录主题 | modern, tech, business, random, spring-festival, mid-autumn, christmas |
| EnableFestivalTheme | 启用节日主题 | true, false |

### 配置优先级

1. **节日主题**（如果 EnableFestivalTheme 为 true 且当前在节日期间）
2. **手动选择的主题**（LoginTheme 配置）
3. **默认主题**（modern）

## 界面说明

### 主题卡片

每个主题卡片包含：

- **预览区域**：展示主题的视觉风格和配色
- **主题图标**：代表主题特色的图标
- **主题名称**：主题的中文名称
- **主题描述**：简短的主题介绍
- **状态标签**：当前使用的主题会显示绿色标签

### 交互效果

- **悬停效果**：鼠标悬停时卡片会轻微上浮并显示阴影
- **选中状态**：选中的主题卡片有蓝色边框和浅蓝色背景
- **禁用状态**：节日主题在关闭节日功能时会显示半透明

### 操作按钮

- **保存配置**：保存当前选择的主题配置
- **重置**：恢复到上次保存的配置

## 注意事项

### 1. 生效时机

- 主题配置保存后，需要**重新登录**才能看到效果
- 已登录的用户不会立即看到主题变化

### 2. 节日主题

- 节日主题的日期检测基于公历，可能与实际农历日期有偏差
- 节日主题优先级高于手动选择的主题
- 关闭节日主题后，可以手动选择节日主题使用

### 3. 随机主题

- 选择随机主题后，每次登录都会随机选择一个常规主题
- 随机范围不包括节日主题

### 4. 权限要求

- 只有系统管理员可以访问主题管理功能
- 普通用户无法修改主题配置

## 技术实现

### 前端实现

```vue
<!-- 主题管理组件 -->
<template>
  <div class="theme-management">
    <!-- 主题配置 -->
    <el-form :model="themeConfig">
      <el-form-item label="当前主题">
        <el-select v-model="themeConfig.LoginTheme">
          <!-- 主题选项 -->
        </el-select>
      </el-form-item>
      
      <el-form-item label="启用节日主题">
        <el-switch v-model="themeConfig.EnableFestivalTheme" />
      </el-form-item>
    </el-form>
    
    <!-- 主题预览网格 -->
    <div class="theme-grid">
      <div 
        v-for="theme in themes" 
        :key="theme.key"
        class="theme-card"
        @click="selectTheme(theme.key)"
      >
        <!-- 主题预览内容 -->
      </div>
    </div>
  </div>
</template>
```

### 后端API

```typescript
// 获取主题配置
fetchSetting("theme")

// 保存主题配置
fetchUpdateBatchSetting([
  {
    sysSettingName: "LoginTheme",
    sysSettingValue: "modern",
    sysSettingGroup: "theme"
  },
  {
    sysSettingName: "EnableFestivalTheme",
    sysSettingValue: "true",
    sysSettingGroup: "theme"
  }
])
```

### 配置读取

```typescript
// 登录页面读取配置
const themeConfig = getConfig("LoginTheme") || "modern";
const enableFestival = getConfig("EnableFestivalTheme") !== false;
const currentTheme = getLoginTheme(themeConfig, enableFestival);
```

## 常见问题

### Q: 为什么修改主题后没有立即生效？

A: 主题配置在登录页面加载时读取，需要重新登录才能看到效果。这是为了避免影响已登录用户的使用体验。

### Q: 如何禁用主题管理功能？

A: 在 `application.yml` 中设置 `EnableThemeManagement: false`，主题管理选项卡将不会显示。

### Q: 可以自定义主题吗？

A: 可以。参考 [LOGIN_THEME_GUIDE.md](./LOGIN_THEME_GUIDE.md) 中的"自定义主题开发"章节。

### Q: 节日主题的日期可以自定义吗？

A: 可以。修改 `packages/pages/login/themes/index.ts` 中的 `detectFestivalTheme` 函数。

### Q: 主题配置存储在哪里？

A: 主题配置存储在系统配置表（sys_setting）中，配置组为 `theme`。

## 更新日志

### v1.0.0 (2025-12-12)

- ✨ 初始版本发布
- 🎨 可视化主题管理界面
- 🔄 主题预览和切换功能
- 🎉 节日主题开关控制
- 💾 配置持久化存储

## 作者

- **CH**
- 创建时间：2025-12-12
- 版本：1.0.0
