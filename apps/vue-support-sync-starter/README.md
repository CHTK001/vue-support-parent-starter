# 数据同步系统 - 前端项目

## 项目简介

基于Vue 3 + TypeScript + Element Plus的数据同步系统前端界面,提供任务管理、可视化设计、监控仪表板和日志查看等功能。

## 技术栈

- **框架**: Vue 3 + TypeScript
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios
- **图表库**: ECharts
- **构建工具**: Vite

## 功能特性

### 1. 认证功能
- 支持两种认证模式:
  - `embedded`: 嵌入式账号密码认证(默认)
  - `none`: 无认证模式,由业务方自行集成

### 2. 任务管理
- 任务列表展示(表格视图/卡片视图)
- 任务搜索和筛选
- 任务启动/停止/删除操作
- 任务创建和编辑

### 3. 可视化设计器
- 拖拽式任务设计
- 数据源配置
- 数据转换配置
- 流程图可视化

### 4. 监控仪表板
- 实时监控数据
- 同步趋势图表
- 任务状态分布
- 告警时间线
- WebSocket实时更新

### 5. 日志查看
- 实时日志展示
- 日志搜索和过滤
- 日志分级显示
- 日志导出功能

## 环境配置

在`.env`文件中配置:

```env
# 认证模式: embedded(嵌入式认证) 或 none(无认证)
VITE_AUTH_MODE=embedded

# API基础路径
VITE_API_BASE_URL=/api/v1/sync

# WebSocket地址
VITE_WS_URL=ws://localhost:8080/ws/sync/progress
```

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

构建后的文件会自动复制到后端项目的`static`目录,实现嵌入式部署。

### 显式打包到后端项目

```bash
pnpm build:backend
```

测试环境构建并复制:

```bash
pnpm build:backend:staging
```

如需自定义后端静态目录:

```bash
SYNC_STATIC_TARGET_DIR=/your/backend/static pnpm build:backend
```

### 代码检查

```bash
pnpm lint
```

## 项目结构

```
src/
├── api/              # API接口
│   ├── sync.ts       # Axios实例配置
│   ├── auth.ts       # 认证API
│   ├── task.ts       # 任务API
│   └── monitor.ts    # 监控API
├── components/       # 公共组件
│   ├── TaskCard.vue  # 任务卡片
│   └── TaskForm.vue  # 任务表单
├── pages/            # 页面组件
│   └── sync/
│       ├── Login.vue       # 登录页
│       ├── TaskList.vue    # 任务列表
│       ├── TaskDesign.vue  # 任务设计器
│       ├── TaskMonitor.vue # 监控仪表板
│       └── TaskLog.vue     # 日志查看
├── router/           # 路由配置
├── stores/           # Pinia状态管理
│   ├── auth.ts       # 认证状态
│   ├── task.ts       # 任务状态
│   └── monitor.ts    # 监控状态
└── styles/           # 样式文件
    └── responsive.scss # 响应式样式
```

## 响应式设计

项目支持多种设备:
- 移动端 (< 768px)
- 平板 (768px - 1024px)
- 桌面端 (> 1024px)

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## 注意事项

1. 认证模式配置需要与后端保持一致
2. WebSocket连接需要确保后端服务已启动
3. 生产环境部署时需要配置正确的API地址
4. 图表库需要在组件挂载后初始化

## 后续优化

- [ ] 集成LogicFlow或X6流程图库
- [ ] 完善单元测试
- [ ] 优化移动端体验
- [ ] 添加国际化支持
- [ ] 性能优化和懒加载
