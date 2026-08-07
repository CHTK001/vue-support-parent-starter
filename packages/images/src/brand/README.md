# 品牌资产

放 logo、品牌色块、合规标识、版权图等全局统一资源。

## 使用

```ts
import brandLogo from "@repo/images/brand/logo.svg";
```

注意：频繁出现的 logo 建议同时放进 `@repo/assets` 的 SVG sprite（`icons/`）以获得最佳性能，
本目录用于 sprite 不便承载的位图资源（如多尺寸 PNG/WebP）。
