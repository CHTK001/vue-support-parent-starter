# Vue Support Email Starter

基于 Vue 3 + Element Plus 的邮箱收发管理系统前端应用。

## 功能特性

- 📧 邮件收发管理
- 📥 收件箱查看
- ✉️ 写邮件/发送邮件
- 📤 已发送邮件查看
- 👤 多账户管理
- 🔍 邮件搜索
- 🔄 实时刷新

## 技术栈

- Vue 3 + TypeScript
- Element Plus UI 组件库
- Pinia 状态管理
- Vue Router 路由管理
- Axios HTTP 客户端
- Vite 构建工具

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
src/
├── api/              # API 接口定义
│   └── email.ts      # 邮件相关 API
├── stores/           # Pinia 状态管理
│   └── email.ts      # 邮件状态
├── views/            # 页面组件
│   ├── inbox/        # 收件箱
│   ├── compose/      # 写邮件
│   ├── sent/         # 已发送
│   └── accounts/     # 账户管理
├── router/           # 路由配置
│   └── index.ts
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 环境变量

创建 `.env.local` 文件配置后端 API 地址：

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 使用说明

1. 首先在"账户管理"页面添加邮箱账户
2. 配置 SMTP 和 IMAP 服务器信息
3. 测试连接确保配置正确
4. 在"收件箱"查看邮件
5. 点击"写邮件"发送新邮件

## 后端接口

需要配合 `spring-support-email-starter` 后端模块使用。

### API 端点

- `POST /api/email/send` - 发送邮件
- `GET /api/email/list` - 获取邮件列表
- `GET /api/email/{id}` - 获取邮件详情
- `DELETE /api/email/{id}` - 删除邮件
- `GET /api/email/search` - 搜索邮件
- `GET /api/account/list` - 获取账户列表
- `POST /api/account/add` - 添加账户
- `PUT /api/account/{id}` - 更新账户
- `DELETE /api/account/{id}` - 删除账户
- `POST /api/account/test` - 测试连接

## 常见邮箱配置

### Gmail

- SMTP: smtp.gmail.com:465 (SSL)
- IMAP: imap.gmail.com:993 (SSL)

### Outlook

- SMTP: smtp-mail.outlook.com:587 (TLS)
- IMAP: outlook.office365.com:993 (SSL)

### QQ邮箱

- SMTP: smtp.qq.com:465 (SSL)
- IMAP: imap.qq.com:993 (SSL)

### 163邮箱

- SMTP: smtp.163.com:465 (SSL)
- IMAP: imap.163.com:993 (SSL)

## 注意事项

- 使用第三方邮箱需要开启 SMTP/IMAP 服务
- 部分邮箱需要使用授权码而非登录密码
- 建议启用 SSL/TLS 加密连接
