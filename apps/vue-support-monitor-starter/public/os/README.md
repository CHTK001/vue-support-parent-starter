# OS 平台图标（图片版）

主机资产列表的名称列会优先显示这里的平台 logo 图片，图片缺失时自动回退为内置 SVG（不影响构建与运行）。

## 约定文件名（放到本 `public/os/` 目录）

| 文件名 | 平台 |
|---|---|
| `os-linux.png` | Linux |
| `os-windows.png` | Windows |
| `os-macos.png` | macOS |

- 建议 32×32 透明底 PNG（webp/jpg 亦可，但三个文件需同名 `.png` 后缀一致）
- 从各平台官方 logo 素材导出，辨识度最高

## 渲染逻辑

`AssetsView.vue` 中 `osImgSrc()` 返回 `/os/os-<平台>.png`（基于 `import.meta.env.BASE_URL`）；
`<img>` 加载失败（404）时通过 `@error` 隐藏图片、显示内置 SVG 兜底，因此不放置图片也能正常构建运行。