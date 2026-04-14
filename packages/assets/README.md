# Assets 目录结构说明

`packages/assets` 目前以 `styles/` 作为唯一真实样式源码目录，`style/` 仅保留兼容转发入口（deprecated）。

## 主目录

```text
assets/
├── fonts/               # 字体与图标字体
├── images/              # 位图资源
├── style/               # 兼容层（仅转发，不放真实实现）
├── styles/              # 唯一真实样式目录
│   ├── base/            # reset / tailwind 等基础层
│   ├── theme/           # 公共主题入口
│   ├── colors/          # 颜色令牌
│   ├── element-plus/    # Element Plus 覆盖
│   ├── layout/          # 布局样式
│   ├── mixins/          # 通用 mixin
│   ├── tokens/          # 通用变量 token
│   ├── legacy/          # 历史兼容样式实现
│   └── *.scss           # 聚合入口或兼容入口
└── svg/                 # SVG 图标
```

## 使用规则

- 新样式统一放到 `styles/`。
- 旧代码允许继续从 `style/` 引入，但不再新增真实实现。
- 迁移老文件时，优先落到 `styles/legacy/`，并在 `style/legacy/` 保留转发壳。

## 推荐引入方式

```ts
import "@repo/assets/fonts/iconfont.css";
import "@repo/assets/styles/base/index.scss";
import "@repo/assets/styles/theme/index.scss";
```

## Legacy 兼容说明

- `style/` 目录仅做兼容过渡，后续会逐步移除。
- 兼容入口仅用于防止存量代码断链，不作为新功能开发入口。

## 资源放置规范

- 图片放 `images/`
- SVG 放 `svg/`
- 字体放 `fonts/`
- 样式放 `styles/`
