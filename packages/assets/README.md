# Assets 目录结构说明

## 📁 目录组织

```
assets/
├── fonts/              # 字体文件
│   ├── iconfont.*     # 图标字体
│   └── font-cloak-*   # 加密字体
├── images/            # 图片资源
│   ├── *.png         # PNG 图片
│   └── *.apng        # 动画 PNG
├── svg/              # SVG 图标
│   ├── status-*.svg  # 状态页图标
│   ├── login-*.svg   # 登录页图标
│   └── *.svg         # 其他图标
├── scss/             # SCSS 样式文件
│   ├── layout-index.scss      # 布局主样式
│   ├── font-encryption.scss   # 字体加密样式
│   └── modern-theme.scss      # 现代主题
├── style/            # 样式系统
│   ├── layout/       # 布局样式
│   ├── colors/       # 颜色系统
│   ├── element-plus/ # Element Plus 覆盖
│   ├── stitch-*.scss # Stitch 设计系统
│   └── *.scss        # 其他样式
├── css/              # CSS 文件
├── gridstack/        # GridStack 样式
└── login/            # 登录页资源

```

## 🔄 迁移说明

### 已移动的文件

1. **iconfont 目录** → `fonts/`
   - `iconfont/iconfont.css` → `fonts/iconfont.css`
   - `iconfont/iconfont.js` → `fonts/iconfont.js`
   - `iconfont/iconfont.json` → `fonts/iconfont.json`

2. **layout 目录** → `scss/`
   - `layout/index.scss` → `scss/layout-index.scss`

3. **根目录文件** → `images/`
   - `user.jpg` → `images/user.jpg`

### 已删除的空目录

- `iconfont/` - 已合并到 fonts
- `layout/` - 已合并到 scss
- `status/` - 空目录
- `table-bar/` - 空目录

## 📝 使用方式

### 在 main.ts 中引入

```typescript
// 字体图标
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/fonts/iconfont.js";

// 样式
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/modern-page.scss";
import "@repo/assets/style/stitch-global.scss";
```

### 在组件中引入 SVG

```vue
<script setup>
import LoginAvatar from "@repo/assets/svg/login-avatar.svg?component";
</script>

<template>
  <LoginAvatar />
</template>
```

### 在样式中引入图片

```scss
.background {
  background-image: url("@repo/assets/images/bg.png");
}
```

## 🎨 设计系统

### Stitch 设计系统文件

- `stitch-global.scss` - 全局样式
- `stitch-tokens.scss` - 设计令牌
- `stitch-layout-tokens.scss` - 布局令牌
- `stitch-utilities.scss` - 工具类
- `stitch-overrides.scss` - 组件覆盖
- `stitch-layout-overrides.scss` - 布局覆盖

### 颜色系统

位于 `style/colors/` 目录，包含完整的颜色令牌定义。

## 🔧 维护指南

### 添加新资源

1. **图片** → 放入 `images/` 目录
2. **SVG 图标** → 放入 `svg/` 目录
3. **字体** → 放入 `fonts/` 目录
4. **样式** → 根据类型放入 `scss/` 或 `style/` 目录

### 命名规范

- 图片：使用小写字母和连字符，如 `login-bg.png`
- SVG：使用小写字母和连字符，如 `status-404.svg`
- 样式：使用小写字母和连字符，如 `modern-theme.scss`

## 📦 构建配置

字体文件会被 Vite 自动处理，无需额外配置。SVG 可以通过 `?component` 后缀作为组件导入。
