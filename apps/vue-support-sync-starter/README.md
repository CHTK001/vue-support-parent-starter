# Vue Support Sync App

这是一个集成到 Spring Boot 后台项目的 Vue 前端应用，用于数据同步功能。

## 项目结构

```
vue-support-sync-starter/
├── src/
│   ├── views/          # 页面组件
│   ├── router/         # 路由配置
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── build-copy.js       # 构建后复制脚本
├── package.json        # 项目配置
└── vite.config.ts      # Vite 配置
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

## 构建

```bash
# 构建并复制到后台项目
pnpm build
```

构建完成后，构建产物会自动复制到 `spring-sync-app/src/main/resources/static` 目录。

## 集成说明

1. **前端构建**：运行 `pnpm build` 会自动构建并复制到后台项目
2. **后台构建**：在 `spring-sync-app` 目录运行 `mvn package` 会自动先构建前端项目
3. **访问**：启动后台项目后，访问 `http://localhost:8080` 即可看到前端页面

## 配置说明

- **静态资源路径**：`/static/`
- **API 代理**：开发环境下 `/api` 请求会代理到 `http://127.0.0.1:8080`
- **路由模式**：使用 `createWebHistory`，支持浏览器历史记录

