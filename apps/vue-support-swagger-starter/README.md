# Vue Swagger Starter 部署指南

## 概述

这是一个基于 Vue 3 + Vite 的 Swagger API 文档前端项目，可以自动部署到 Spring Boot 的 `spring-support-swagger-starter` 模块。

## 功能特性

- 🎨 现代化的 UI 设计
- 🌓 支持深色/浅色主题切换
- 📱 响应式布局，支持移动端
- 🚀 基于 Vite 的快速构建
- 🔄 自动部署到 Spring Boot 静态资源目录

## 开发

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
pnpm build
```

构建产物将输出到 `dist` 目录。

## 部署到 Spring

### 一键部署

```bash
pnpm deploy
```

这个命令会：
1. 清空 Spring 静态资源目录
2. 构建 Vue 项目
3. 复制构建产物到 Spring 静态资源目录
4. 重命名文件为固定名称（避免哈希变化）

### 部署流程说明

部署脚本 `deploy-to-spring.js` 会执行以下操作：

1. **清空目标目录**
   - 清空 `spring-support-swagger-starter/src/main/resources/static/`

2. **处理 HTML 文件**
   - 将 `index.html` 重命名为 `doc-v2.html`
   - 更新标题为 "API 文档 V2"
   - 修改 JS/CSS 引用路径

3. **重命名资源文件**
   - `index-[hash].js` → `doc-v2.js`
   - `index-[hash].css` → `doc-v2-style.css`

4. **复制其他资源**
   - favicon.ico
   - logo.svg
   - loader.js
   - platform-config.json
   - wasm/ 目录
   - woff2/ 字体目录

### 访问地址

部署完成后，在 Spring Boot 应用中可以通过以下地址访问：

- http://localhost:19180/doc-v2
- http://localhost:19180/doc-v2.html

> 注意：需要先启动包含 `spring-support-swagger-starter` 依赖的 Spring Boot 应用。

## Spring Boot 配置

### 添加依赖

在 Spring Boot 项目的 `pom.xml` 中添加：

```xml
<dependency>
    <groupId>com.chua</groupId>
    <artifactId>spring-support-swagger-starter</artifactId>
    <version>4.0.0.37</version>
</dependency>
```

### 启用 Swagger

在 `application.yml` 中配置：

```yaml
plugin:
  swagger:
    enable: true
    description: API 文档
    version: 1.0.0
    termsOfService: https://example.com/terms
```

### 访问路径

Spring Boot 应用启动后，可以访问：

- 旧版文档：http://localhost:19180/doc.html
- 新版文档：http://localhost:19180/doc-v2.html

## 项目结构

```
vue-support-swagger-starter/
├── src/                    # 源代码
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   ├── router/            # 路由配置
│   └── assets/            # 静态资源
├── dist/                   # 构建输出（自动生成）
├── deploy-to-spring.js    # 部署脚本
├── package.json           # 项目配置
├── vite.config.ts         # Vite 配置
└── README.md              # 本文档
```

## 技术栈

- Vue 3
- Vite
- TypeScript
- Element Plus
- Tailwind CSS
- Vue Router
- Pinia

## 注意事项

1. **文件名哈希问题**：Vite 构建时会为文件添加哈希值，部署脚本会自动处理这个问题，将文件重命名为固定名称。

2. **路径问题**：部署脚本会自动修正 HTML 中的资源引用路径，确保在 Spring Boot 中能正确加载。

3. **清空目录**：每次部署都会清空目标目录，确保没有旧文件残留。

4. **Spring Boot 重启**：部署完成后，如果 Spring Boot 应用正在运行，可能需要重启才能看到更新。

## 开发建议

1. 开发时使用 `pnpm dev` 启动开发服务器
2. 修改完成后使用 `pnpm deploy` 一键部署
3. 测试时启动 Spring Boot 应用访问 `/doc-v2.html`

## 故障排查

### 问题：访问 /doc-v2.html 返回 404

**解决方案**：
1. 检查 Spring Boot 应用是否包含 `spring-support-swagger-starter` 依赖
2. 检查 `plugin.swagger.enable` 配置是否为 `true`
3. 检查静态资源目录是否有 `doc-v2.html` 文件

### 问题：页面加载但样式错乱

**解决方案**：
1. 检查浏览器控制台是否有 JS/CSS 加载失败
2. 确认 `doc-v2.js` 和 `doc-v2-style.css` 文件存在
3. 清除浏览器缓存后重试

### 问题：部署后 Spring Boot 没有更新

**解决方案**：
1. 重启 Spring Boot 应用
2. 如果使用 Maven，执行 `mvn clean install` 重新打包
3. 检查 Spring Boot 的静态资源配置

## 许可证

Apache License 2.0
