# Nacos 客户端工具

## 简介

本模块提供了基于 Nacos 官方 SDK 的客户端工具，用于在 Vue 应用中与 Nacos 服务进行交互。主要功能包括：

- 配置中心操作：获取、发布、删除配置
- 服务发现：服务注册、发现、实例管理
- 命名空间管理：创建、删除、查询命名空间

## 目录结构

```
nacos/
├── index.ts           # 导出模块的入口文件
├── nacosClient.ts     # Nacos 客户端管理器实现
├── CHANGELOG.md       # 更新日志
└── README.md          # 本文档
```

## 主要组件

### NacosClientManager

Nacos 客户端管理器，负责创建和管理 Nacos 客户端实例。主要方法：

- `getClient(dataSource)`: 获取指定数据源的 Nacos 客户端实例
- `removeClient(genId)`: 移除指定的客户端实例
- `clear()`: 清除所有客户端实例

### NacosService

Nacos 服务类，提供高级 API，封装了与 Nacos 的交互操作。主要方法：

#### 配置中心

- `getConfigList(dataSource, params)`: 获取配置列表
- `getConfigDetail(dataSource, params)`: 获取配置详情
- `saveConfig(dataSource, params)`: 保存配置
- `deleteConfig(dataSource, params)`: 删除配置

#### 命名空间管理

- `getNamespaces(dataSource)`: 获取命名空间列表
- `createNamespace(dataSource, params)`: 创建命名空间
- `deleteNamespace(dataSource, namespaceId)`: 删除命名空间

#### 服务发现

- `getServiceList(dataSource, params)`: 获取服务列表
- `getInstanceList(dataSource, params)`: 获取服务实例列表

## 使用示例

```typescript
// 导入需要的组件
import { NacosClientManager, NacosService } from "@/utils/nacos";

// 配置管理示例
const getConfigs = async (dataSource) => {
  const configList = await NacosService.getConfigList(dataSource, {
    dataId: "myapp",
    group: "DEFAULT_GROUP",
    pageNum: 1,
    pageSize: 10,
  });
  return configList;
};

// 服务发现示例
const getServices = async (dataSource) => {
  const serviceList = await NacosService.getServiceList(dataSource, {
    serviceName: "user-service",
    groupName: "DEFAULT_GROUP",
    pageNum: 1,
    pageSize: 20,
  });
  return serviceList;
};
```

## 注意事项

- 该工具需要配合 Nacos 服务端使用，确保你的 Nacos 服务可用
- 配置正确的数据源信息，包括服务器地址、端口、认证信息等
- 如果遇到 API 调用问题，可能是由于 Nacos SDK 版本差异，请查阅官方文档
