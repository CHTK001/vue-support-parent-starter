# NW.js 快速开始指南

## 🎯 一分钟上手

### 1. 开发模式运行

```bash
pnpm nw:dev
```

会提示你选择要运行的应用：

```
? 选择要运行的应用:
  ❯ vue-support-monitor-starter
    vue-support-system-parent
    vue-support-hotspot-starter
    ...
```

选择后会自动：

1. 构建应用
2. 生成 NW.js 配置
3. 启动桌面应用

### 2. 打包应用

```bash
pnpm nw:build
```

同样选择应用，会生成可执行文件到：

```
apps/[app-name]/nw-build/
```

## 📝 配置说明

### 统一配置文件

所有应用共享 `nw-shared/package.base.json`：

```json
{
  "window": {
    "title": "应用标题",
    "width": 1200,
    "height": 800,
    "min_width": 800,
    "min_height": 600
  }
}
```

### 应用特定配置

每个应用的 `package.json` 中的信息会自动使用：

- `name` → 应用名称
- `version` → 版本号
- `description` → 窗口标题

## 🔧 自定义配置

如需修改窗口配置，编辑 `nw-shared/package.base.json`：

```json
{
  "window": {
    "width": 1600, // 修改宽度
    "height": 900, // 修改高度
    "fullscreen": true // 全屏启动
  }
}
```

## 🐛 调试

开发模式下按 `F12` 打开开发者工具。

## 📦 打包选项

默认打包为 Windows x64 可执行文件。

如需其他平台，修改 `scripts/nw-run.mjs` 中的打包命令：

```javascript
// 当前: --platform=win --arch=x64
// macOS: --platform=osx --arch=x64
// Linux: --platform=linux --arch=x64
// 全平台: --platform=win,osx,linux
```

## 🎨 图标

将应用图标放在 `apps/[app-name]/public/logo.png`

## 📚 更多文档

- 完整文档: `nw-shared/README.md`
- 迁移报告: `MIGRATION_TO_NWJS.md`
- NW.js 官方: https://nwjs.io/

## ❓ 常见问题

### Q: 如何修改窗口大小？

A: 编辑 `nw-shared/package.base.json` 中的 `window.width` 和 `window.height`

### Q: 如何添加原生功能？

A: NW.js 可以直接使用 Node.js API，无需额外配置

### Q: 打包后文件在哪？

A: `apps/[app-name]/nw-build/`

### Q: 如何调试？

A: 开发模式下按 F12

## 🚀 开始使用

```bash
# 1. 运行开发模式
pnpm nw:dev

# 2. 选择应用
# 3. 等待构建和启动
# 4. 开始开发！
```

就这么简单！🎉
