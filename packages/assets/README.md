# Assets 目录结构说明

`packages/assets` 保留一个主样式入口 `style/`，并在该目录内继续按职责分层。

## 主目录

```text
assets/
├── fonts/               # 字体与图标字体
├── images/              # 位图资源
├── login/               # 登录页独立素材
├── style/               # 唯一主样式目录
│   ├── colors/          # 颜色令牌
│   ├── element-plus/    # Element Plus 覆盖
│   ├── layout/          # 布局样式
│   ├── mixins/          # 通用 mixin
│   ├── pages/           # 页面级样式入口
│   ├── stitch/          # Stitch 主题/令牌/覆盖
│   ├── legacy/          # 老入口迁移后的兼容文件（含 map-icons / gridstack）
│   ├── font-encryption.scss
│   └── *.scss           # 仅保留兼容转发入口
└── svg/                 # SVG 图标
```

## 使用规则

- 新样式统一放到 `style/`
- 不再维护顶层 `scss/` / `styles/` / `css/` / `gridstack/` 目录
- 需要迁移老文件时，优先放到 `style/legacy/`
- `style/` 顶层文件只保留兼容入口，实际实现优先落到子目录

## 推荐引入方式

```ts
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/style/layout/default/reset.scss";
import "@repo/assets/style/layout/default/tailwind.css";
import "@repo/assets/style/layout/default/index.scss";
import "@repo/assets/style/pages/modern-page.scss";
import "@repo/assets/style/font-encryption.scss";
import "@repo/assets/style/stitch/global.scss";
```

## Legacy 兼容说明

- 旧入口兼容仅保留在 `style/legacy/`
- 历史遗留的 `map-icons.css`、`gridstack/index.scss` 已迁入 `style/legacy/`
- 推荐新代码统一改用 `@repo/assets/style/<子目录>/*`

## 资源放置规范

- 图片放 `images/`
- SVG 放 `svg/`
- 字体放 `fonts/`
- 样式放 `style/`
