# @repo/images

业务图片资源包。**只打包被实际 `import` 的图片,未引用的一律不会进入产物。**

## 与 `@repo/assets` 的区别

| 项 | `@repo/assets` | `@repo/images` |
|---|---|---|
| 用途 | 全局通用资源(登录页背景、错误页、logo、字体、SVG sprite) | 业务图片(产品宣传、插画、品牌位图、业务图标位图) |
| 加载策略 | `import.meta.glob(..., { eager: true })` 一次性把目录同步打包 | 具名 `import`,Vite/Rollup 按需打包 |
| 适用规模 | 小、资源稳定 | 大、迭代快、不希望污染全站产物 |
| 推荐格式 | png/svg/webp | webp/avif 优先 |

## 使用

```ts
// 在任意业务组件 / 页面中
import productHero from "@repo/images/product/hero.webp";
import emptyIllustration from "@repo/images/illustration/empty.svg";
import brandLogo from "@repo/images/brand/logo.webp";

export default defineComponent({
  setup() {
    return { productHero, emptyIllustration, brandLogo };
  },
});
```

```vue
<template>
  <img :src="productHero" alt="产品主图" />
  <img :src="emptyIllustration" alt="空状态" />
</template>
```

构建后 `dist/assets/` 中只会出现**真正被引用的图片** + 各自的 contenthash,未引用的图片不会被打包。

## 目录约定

```
packages/images/src/
├── product/        产品宣传图、banner、占位
├── illustration/   通用插画、空状态、引导图
├── brand/          品牌资产(位图)
└── icon/           业务图标(位图)
```

按业务域自由新增子目录,如 `product/banner/`、`illustration/empty-state/`。

## 关键约束

- **不要** 在本包内使用 `import.meta.glob(..., { eager: true })` —— 这会把整个目录打进产物。
- **不要** 通过 `new URL('./xxx.png', import.meta.url)` 引用本包图片,跨包时无法解析。
- 大图(>1MB)请放到 CDN 而不是仓库,本包适合 ≤200KB 的中等体量图片。
- SVG sprite 化的高频图标请放 `@repo/assets/icons/`,不要放这里。
