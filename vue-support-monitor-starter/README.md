# Vue Support Monitor Starter

基于 Vue 3 + Element Plus + TypeScript 的服务器监控系统前端项目。

## 🚀 项目特性

- **现代化技术栈**: Vue 3 + TypeScript + Vite
- **UI 组件库**: Element Plus + 自定义主题
- **状态管理**: Pinia
- **路由管理**: Vue Router 4
- **实时通信**: WebSocket 支持
- **图表可视化**: ECharts + Vue-ECharts
- **响应式设计**: 支持桌面端和移动端
- **类型安全**: 完整的 TypeScript 类型定义

## 📦 功能模块

### 🖥️ 服务器管理
- 服务器列表管理
- 服务器信息的增删改查
- 批量操作支持
- 连接测试功能

### 🔗 连接状态监控
- 实时连接状态监控
- 连接历史记录查看
- 响应时间统计
- 连接状态趋势图表

### 📋 日志管理
- 集中化日志查看
- 多级别日志过滤
- 实时日志流
- 日志统计和分析
- 日志配置管理

### 📤 文件上传管理
- 文件上传任务管理
- 实时上传进度监控
- 批量上传支持
- 上传历史和统计

### 📜 脚本管理
- 脚本编辑和管理
- 脚本执行和监控
- 执行历史记录
- 脚本模板库

## 🛠️ 技术栈

- **框架**: Vue 3.4+
- **构建工具**: Vite 5.0+
- **语言**: TypeScript 5.3+
- **UI 库**: Element Plus 2.4+
- **状态管理**: Pinia 2.1+
- **路由**: Vue Router 4.2+
- **图表**: ECharts 5.4+ / Vue-ECharts 6.6+
- **HTTP 客户端**: Axios 1.6+
- **样式**: SCSS
- **工具库**: Day.js, Lodash-ES

## 📁 项目结构

```
vue-support-monitor-starter/
├── public/                 # 静态资源
├── src/
│   ├── api/               # API 接口定义
│   │   ├── server.ts      # 服务器相关 API
│   │   ├── log.ts         # 日志相关 API
│   │   ├── upload.ts      # 文件上传 API
│   │   └── script.ts      # 脚本管理 API
│   ├── components/        # 全局组件
│   ├── layout/           # 布局组件
│   │   └── index.vue     # 主布局
│   ├── router/           # 路由配置
│   │   └── index.ts      # 路由定义
│   ├── stores/           # Pinia 状态管理
│   │   ├── app.ts        # 应用状态
│   │   └── websocket.ts  # WebSocket 状态
│   ├── styles/           # 全局样式
│   │   └── index.scss    # 主样式文件
│   ├── types/            # TypeScript 类型定义
│   │   └── index.ts      # 类型定义
│   ├── utils/            # 工具函数
│   │   ├── index.ts      # 通用工具
│   │   └── request.ts    # HTTP 请求封装
│   ├── views/            # 页面组件
│   │   └── server/       # 服务器管理页面
│   │       ├── components/    # 页面子组件
│   │       ├── ServerList.vue # 服务器列表
│   │       ├── ServerConnectionStatus.vue # 连接状态
│   │       ├── ServerLogManagement.vue    # 日志管理
│   │       ├── ServerFileUpload.vue       # 文件上传
│   │       └── ServerScriptManagement.vue # 脚本管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 应用入口
├── index.html            # HTML 模板
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 配置
└── README.md            # 项目说明
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 9+ 或 yarn 1.22+ 或 pnpm 8+

### 安装依赖

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install

# 使用 pnpm
pnpm install
```

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 或
yarn dev

# 或
pnpm dev
```

访问 http://localhost:3000

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## ⚙️ 配置说明

### 环境变量

创建 `.env.local` 文件配置环境变量：

```bash
# API 基础地址
VITE_APP_BASE_API=http://localhost:8080

# WebSocket 地址
VITE_APP_WS_URL=ws://localhost:8080/ws

# 应用标题
VITE_APP_TITLE=服务器监控系统
```

### 代理配置

开发环境下，Vite 会自动代理 `/api` 请求到后端服务器。

## 🔌 API 对接

项目已完整对接后端 Spring Boot 监控系统的 REST API 接口：

- **服务器管理**: `/v1/server/*`
- **连接状态**: `/v1/server/connection-status/*`
- **日志管理**: `/v1/server/logs/*`, `/v1/server/log-config/*`
- **文件上传**: `/v1/file-upload/tasks/*`, `/v1/file-upload/records/*`
- **脚本管理**: `/v1/server/scripts/*`, `/v1/server/script-executions/*`

## 🌐 WebSocket 支持

项目支持 WebSocket 实时通信，用于：

- 服务器连接状态实时更新
- 日志实时推送
- 文件上传进度实时监控
- 脚本执行状态实时更新

## 📱 响应式设计

- 桌面端：完整功能体验
- 平板端：适配中等屏幕
- 移动端：核心功能优化

## 🎨 主题定制

项目支持明暗主题切换，可通过 CSS 变量进行主题定制。

## 📊 性能优化

- 路由懒加载
- 组件按需加载
- 图片懒加载
- 虚拟滚动（大数据量）
- 请求防抖和节流

## 🔧 开发工具

- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **TypeScript**: 类型检查
- **Vue DevTools**: Vue 调试工具

## 📄 许可证

MIT License

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 项目讨论区

---

**注意**: 本项目需要配合对应的 Spring Boot 后端服务使用。
