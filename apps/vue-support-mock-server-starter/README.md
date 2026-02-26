# Mock Server

基于 `@scalar/mock-server` 的 Mock API 服务器，自动根据 Swagger/OpenAPI 规范生成 Mock 数据。

## 功能特性

- 🚀 自动根据 OpenAPI/Swagger 规范生成 Mock 数据
- 🔄 支持从 URL 或本地文件加载规范
- 🎯 RESTful API 自动模拟
- 🔧 可配置的端口和规范来源
- ✅ 内置健康检查端点

## 快速开始

### 1. 使用示例规范（默认）

```bash
pnpm --filter=vue-support-mock-server run dev
```

### 2. 从 URL 加载 Swagger/OpenAPI 规范

```bash
SWAGGER_URL=http://example.com/api/swagger.json pnpm --filter=vue-support-mock-server run dev
```

或

```bash
OPENAPI_URL=http://example.com/api/openapi.json pnpm --filter=vue-support-mock-server run dev
```

### 3. 从本地文件加载规范

```bash
SPEC_PATH=./specs/api.json pnpm --filter=vue-support-mock-server run dev
```

### 4. 自定义端口

```bash
PORT=4000 SWAGGER_URL=http://example.com/api/swagger.json pnpm --filter=vue-support-mock-server run dev
```

## API 端点

- `http://localhost:3100/api/*` - Mock API 端点（根据规范自动生成）
- `http://localhost:3100/health` - 健康检查
- `http://localhost:3100/config` - 查看当前配置和规范信息

## 环境变量

| 变量          | 说明             | 示例                              |
| ------------- | ---------------- | --------------------------------- |
| `PORT`        | 服务器端口       | `3100`                            |
| `SWAGGER_URL` | Swagger 规范 URL | `http://example.com/swagger.json` |
| `OPENAPI_URL` | OpenAPI 规范 URL | `http://example.com/openapi.json` |
| `SPEC_PATH`   | 本地规范文件路径 | `./specs/api.json`                |

## 示例

### 使用 Swagger Petstore

```bash
SWAGGER_URL=https://petstore.swagger.io/v2/swagger.json pnpm --filter=vue-support-mock-server run dev
```

### 使用本地规范文件

1. 创建规范文件 `specs/my-api.json`
2. 运行：

```bash
SPEC_PATH=./specs/my-api.json pnpm --filter=vue-support-mock-server run dev
```

## 构建和部署

```bash
# 构建
pnpm --filter=vue-support-mock-server run build

# 运行构建后的版本
pnpm --filter=vue-support-mock-server run preview
```

## 注意事项

- 规范文件必须是有效的 OpenAPI 3.x 或 Swagger 2.0 格式
- Mock 数据会根据规范中的 schema 自动生成
- 支持 JSON 和 YAML 格式的规范文件
