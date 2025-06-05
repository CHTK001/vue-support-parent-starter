# Nacos管理页面

## 功能介绍

Nacos管理页面是一个用于管理Nacos配置中心和服务发现的工具界面，基于官方Nacos JavaScript SDK实现。主要功能包括：

### 配置管理

- 查看配置列表
- 搜索、筛选配置
- 新增/编辑/克隆配置
- 查看配置详情
- 删除配置
- 管理命名空间（新增/删除）

### 服务发现

- 查看服务列表
- 搜索、筛选服务
- 查看服务详情
- 查看服务实例列表
- 查看实例元数据

## 技术实现

- 使用官方Nacos JavaScript SDK（nacos v2.6.0）进行API调用
- 采用Monaco Editor实现配置内容编辑器
- 使用Element Plus组件库构建用户界面
- 基于Vue 3 Composition API开发

## 组件结构

```
nacos/
├── components/         # 组件目录
│   ├── Config.vue      # 配置管理组件
│   ├── Service.vue     # 服务发现组件
│   └── index.js        # 组件导出
├── index.vue           # 主页面
└── README.md           # 说明文档
```

## 服务层

```
services/
└── nacosService.js     # Nacos服务接口

utils/
└── nacosClient.js      # Nacos客户端管理器
```

## 使用方法

1. 在数据源管理中添加Nacos数据源
2. 在Nacos管理页面选择数据源
3. 使用配置管理或服务发现功能

## 配置格式支持

- Properties
- JSON
- XML
- YAML
- TEXT
- HTML

## 注意事项

- 请确保Nacos服务器版本与SDK兼容
- 默认使用的是Nacos Open API进行通信
- 大型配置文件可能需要较长加载时间
- 对于复杂服务发现场景，建议使用Nacos控制台
