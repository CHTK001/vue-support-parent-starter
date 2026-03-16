# NW.js 统一桌面应用方案

## 为什么选择 NW.js

相比 Tauri 和 Electron，NW.js 更适合统一管理多个应用：

| 优势             | 说明                              |
| ---------------- | --------------------------------- |
| ✅ 统一配置      | 所有应用共享一个配置模板          |
| ✅ 无需独立目录  | 不需要每个应用都有 src-tauri 目录 |
| ✅ 纯 JavaScript | 无需学习 Rust，使用熟悉的 Node.js |
| ✅ 体积更小      | 比 Electron 更轻量                |
| ✅ 简单易用      | 配置简单，上手快                  |

## 目录结构

```
vue-support-parent-starter/
├── nw-shared/              # NW.js 共享配置
│   ├── package.base.json  # 基础配置模板
│   └── README.md          # 本文档
├── scripts/
│   ├── nw-run.mjs         # NW.js 启动脚本
│   └── cleanup-tauri.mjs  # Tauri 清理脚本
└── apps/
    ├── vue-support-monitor-starter/
    │   └── dist/          # 构建后自动生成 NW.js 配置
    └── vue-support-system-parent/
        └── dist/          # 构建后自动生成 NW.js 配置
```

## 使用方法

### 1. 安装 NW.js

```bash
# 全局安装（推荐）
npm install -g nw

# 或者使用 npx（无需安装）
# 脚本会自动使用 npx
```

### 2. 开发模式运行

```bash
pnpm nw:dev
```

选择要运行的应用，脚本会自动：

1. 构建应用
2. 生成 NW.js 配置
3. 启动桌面应用

### 3. 打包应用

```bash
pnpm nw:build
```

选择要打包的应用，会生成可执行文件到 `apps/[app-name]/nw-build/`

### 4. 清理 Tauri 配置（可选）

如果要完全迁移到 NW.js，可以清理旧的 Tauri 配置：

```bash
pnpm cleanup:tauri
```

⚠️ 警告：此操作会删除所有 `src-tauri` 目录，不可恢复！

## 配置说明

### 基础配置 (package.base.json)

```json
{
  "window": {
    "title": "应用标题",
    "width": 1200,
    "height": 800,
    "min_width": 800,
    "min_height": 600,
    "resizable": true,
    "frame": true,
    "toolbar": false
  }
}
```

### 应用特定配置

每个应用的配置会自动从其 `package.json` 中读取：

- `name` - 应用名称
- `version` - 版本号
- `description` - 应用描述（用作窗口标题）

### 自定义配置

如果需要为特定应用自定义配置，可以在 `nw-run.mjs` 中修改 `generateNWConfig` 函数。

## 工作流程

### 开发流程

```bash
# 1. 开发 Web 应用（正常开发）
pnpm dev

# 2. 测试桌面应用
pnpm nw:dev
```

### 发布流程

```bash
# 1. 构建所有应用
pnpm build

# 2. 打包桌面应用
pnpm nw:build

# 3. 分发可执行文件
# 文件位于: apps/[app-name]/nw-build/
```

## 优势对比

### vs Tauri

| 特性     | Tauri             | NW.js              |
| -------- | ----------------- | ------------------ |
| 配置管理 | 每个应用独立      | ✅ 统一管理        |
| 学习成本 | 需要学习 Rust     | ✅ 只需 JavaScript |
| 构建速度 | 较慢（编译 Rust） | ✅ 快速            |
| 体积     | 最小              | 中等               |

### vs Electron

| 特性     | Electron     | NW.js       |
| -------- | ------------ | ----------- |
| 配置管理 | 需要独立配置 | ✅ 统一管理 |
| 体积     | 较大         | ✅ 更小     |
| 性能     | 好           | ✅ 更好     |
| 社区     | 最大         | 中等        |

## 常见问题

### Q: 如何调试 NW.js 应用？

A: 在开发模式下，按 F12 打开开发者工具。

### Q: 如何修改窗口配置？

A: 编辑 `nw-shared/package.base.json` 中的 `window` 配置。

### Q: 如何添加原生功能？

A: NW.js 可以直接使用 Node.js API，无需额外配置。

### Q: 打包后的文件在哪里？

A: 在 `apps/[app-name]/nw-build/` 目录下。

### Q: 可以同时保留 Tauri 吗？

A: 可以，两者不冲突。但建议选择一个统一使用。

## 迁移步骤

如果要从 Tauri 迁移到 NW.js：

1. ✅ 已创建 NW.js 配置和脚本
2. 测试 NW.js 应用是否正常运行
3. 确认无问题后运行 `pnpm cleanup:tauri`
4. 从 package.json 中移除 Tauri 依赖
5. 运行 `pnpm install` 更新依赖

## 参考资源

- [NW.js 官方文档](https://nwjs.io/)
- [NW.js GitHub](https://github.com/nwjs/nw.js)
- [NW.js 中文文档](https://nwjs.org.cn/)
