# 软件管理模块 API 文档

## 概述

软件管理模块提供了完整的软件生命周期管理功能，包括软件信息管理、版本管理、安装/卸载、容器管理以及实时监控等功能。

## 基础信息

- **模块名称**: 软件管理 (Soft Management)
- **API 前缀**: `/v1/soft/`, `/v1/system/soft/`
- **认证方式**: Bearer Token
- **数据格式**: JSON

## 数据模型

### SystemSoft (软件信息)

```typescript
interface SystemSoft {
  systemSoftId?: number;           // 软件ID
  systemSoftName?: string;         // 软件名称
  systemSoftCode?: string;         // 软件代码
  systemSoftCategory?: string;     // 软件分类
  systemSoftIcon?: string;         // 软件图标
  systemSoftTags?: string;         // 软件标签
  systemSoftDesc?: string;         // 软件描述
  systemSoftImage?: string;        // 软件镜像
  systemSoftStatus?: string;       // 软件状态
  systemSoftCreateTime?: string;   // 创建时间
  systemSoftUpdateTime?: string;   // 更新时间
}
```

### SystemSoftVersion (软件版本)

```typescript
interface SystemSoftVersion {
  systemSoftVersionId?: number;           // 版本ID
  systemSoftId?: number;                  // 软件ID
  version?: string;                       // 版本号
  downloadUrl?: string;                   // 下载地址
  imageTag?: string;                      // 镜像标签
  installTemplate?: string;               // 安装模板
  systemSoftVersionCreateTime?: string;   // 创建时间
  systemSoftVersionUpdateTime?: string;   // 更新时间
}
```

### SystemSoftContainer (容器信息)

```typescript
interface SystemSoftContainer {
  systemSoftContainerId?: number;         // 容器ID
  systemSoftId?: number;                  // 软件ID
  systemSoftVersionId?: number;           // 版本ID
  systemServerId?: number;                // 服务器ID
  systemSoftContainerName?: string;       // 容器名称
  systemSoftContainerDockerId?: string;   // Docker容器ID
  systemSoftContainerStatus?: string;     // 容器状态
  systemSoftContainerHealthStatus?: string; // 健康状态
  systemSoftContainerImageName?: string;  // 镜像名称
  systemSoftContainerImageTag?: string;   // 镜像标签
  systemSoftContainerPorts?: string;      // 端口映射
  systemSoftContainerVolumes?: string;    // 卷挂载
  systemSoftContainerEnvironment?: string; // 环境变量
  systemSoftContainerNetworks?: string;   // 网络配置
  systemSoftContainerLabels?: string;     // 标签
  systemSoftContainerCommand?: string;    // 启动命令
  systemSoftContainerArgs?: string;       // 命令参数
  systemSoftContainerWorkingDir?: string; // 工作目录
  systemSoftContainerUser?: string;       // 运行用户
  systemSoftContainerRestartPolicy?: string; // 重启策略
  systemSoftContainerCpuLimit?: string;   // CPU限制
  systemSoftContainerMemoryLimit?: string; // 内存限制
  systemSoftContainerCreatedTime?: string; // 创建时间
  systemSoftContainerStartedTime?: string; // 启动时间
  systemSoftContainerFinishedTime?: string; // 结束时间
  systemSoftContainerExitCode?: number;   // 退出代码
  systemSoftContainerError?: string;      // 错误信息
  systemSoftContainerLogPath?: string;    // 日志路径
  systemSoftContainerConfigHash?: string; // 配置哈希
  systemSoftContainerRemark?: string;     // 备注
}
```

### SystemSoftRecord (安装记录)

```typescript
interface SystemSoftRecord {
  systemSoftRecordId?: number;        // 记录ID
  systemSoftRecordSoftId?: number;    // 软件ID
  systemSoftRecordServerId?: number;  // 服务器ID
  systemSoftRecordStatus?: string;    // 记录状态
  systemSoftRecordStartTime?: string; // 开始时间
  systemSoftRecordEndTime?: string;   // 结束时间
  systemSoftRecordRemark?: string;    // 备注
}
```

### ContainerStats (容器统计)

```typescript
interface ContainerStats {
  cpuUsage?: number;      // CPU使用率
  memoryUsage?: number;   // 内存使用量
  memoryLimit?: number;   // 内存限制
  networkRx?: number;     // 网络接收
  networkTx?: number;     // 网络发送
  diskRead?: number;      // 磁盘读取
  diskWrite?: number;     // 磁盘写入
  timestamp?: string;     // 时间戳
}
```

### ContainerStatusStats (容器状态统计)

```typescript
interface ContainerStatusStats {
  total?: number;     // 总数
  running?: number;   // 运行中
  stopped?: number;   // 已停止
  paused?: number;    // 已暂停
  exited?: number;    // 已退出
  dead?: number;      // 已死亡
}
```

### BatchOperationResult (批量操作结果)

```typescript
interface BatchOperationResult {
  total?: number;     // 总数
  success?: number;   // 成功数
  failed?: number;    // 失败数
  results?: Array<{   // 详细结果
    containerId?: number;
    success?: boolean;
    message?: string;
  }>;
}
```

## API 接口

### 软件管理

#### 1. 获取软件分页列表

**接口地址**: `GET /v1/soft/page`

**请求参数**:
```typescript
interface PageParams {
  page?: number;        // 页码，默认1
  pageSize?: number;    // 每页大小，默认10
  current?: number;     // 当前页（别名）
  size?: number;        // 页面大小（别名）
  [k: string]: any;     // 其他查询条件
}
```

**响应数据**:
```typescript
interface Response {
  code: number;
  message: string;
  data: {
    records: SystemSoft[];  // 软件列表
    total: number;          // 总数
  };
}
```

#### 2. 保存软件信息

**接口地址**: `POST /v1/soft/save`

**请求参数**: `SystemSoft`

**响应数据**: `ReturnResult<SystemSoft>`

#### 3. 更新软件信息

**接口地址**: `PUT /v1/soft/update`

**请求参数**: `SystemSoft`

**响应数据**: `ReturnResult<boolean>`

#### 4. 同步软件信息

**接口地址**: `POST /v1/soft/sync`

**请求参数**: 无

**响应数据**: `ReturnResult<boolean>`

### 版本管理

#### 1. 获取版本分页列表

**接口地址**: `GET /v1/soft/version/page`

**请求参数**: `PageParams<SystemSoftVersion>`

**响应数据**:
```typescript
interface Response {
  code: number;
  message: string;
  data: {
    records: SystemSoftVersion[];  // 版本列表
    total: number;                 // 总数
  };
}
```

#### 2. 保存版本信息

**接口地址**: `POST /v1/soft/version/save`

**请求参数**: `SystemSoftVersion`

**响应数据**: `ReturnResult<SystemSoftVersion>`

#### 3. 更新版本信息

**接口地址**: `PUT /v1/soft/version/update`

**请求参数**: `SystemSoftVersion`

**响应数据**: `ReturnResult<boolean>`

### 安装/卸载

#### 1. 安装软件

**接口地址**: `POST /v1/soft/record/install`

**请求参数**:
```typescript
interface InstallParams {
  systemSoftId: number;        // 软件ID
  systemSoftVersionId: number; // 版本ID
  serverIds: number[];         // 服务器ID列表
  method?: string;             // 安装方式
  params?: string;             // 安装参数
}
```

**响应数据**: `ReturnResult<boolean>`

#### 2. 卸载软件

**接口地址**: `POST /v1/soft/record/uninstall`

**请求参数**:
```typescript
interface UninstallParams {
  systemSoftId: number;        // 软件ID
  systemSoftVersionId: number; // 版本ID
  serverIds: number[];         // 服务器ID列表
}
```

**响应数据**: `ReturnResult<boolean>`

### 安装记录

#### 1. 获取安装记录分页列表

**接口地址**: `GET /v1/soft/record/page`

**请求参数**: `PageParams<SystemSoftRecord>`

**响应数据**:
```typescript
interface Response {
  code: number;
  message: string;
  data: {
    records: SystemSoftRecord[];  // 记录列表
    total: number;                // 总数
  };
}
```

### 容器管理

#### 1. 获取容器分页列表

**接口地址**: `GET /v1/system/soft/container/page`

**请求参数**: `PageParams<SystemSoftContainer>`

**响应数据**:
```typescript
interface Response {
  code: number;
  message: string;
  data: {
    records: SystemSoftContainer[];  // 容器列表
    total: number;                   // 总数
  };
}
```

#### 2. 根据软件ID查询容器列表

**接口地址**: `GET /v1/system/soft/container/soft/{softId}`

**路径参数**:
- `softId`: 软件ID

**响应数据**: `ReturnResult<SystemSoftContainer[]>`

#### 3. 根据服务器ID查询容器列表

**接口地址**: `GET /v1/system/soft/container/server/{serverId}`

**路径参数**:
- `serverId`: 服务器ID

**响应数据**: `ReturnResult<SystemSoftContainer[]>`

#### 4. 根据ID查询容器详情

**接口地址**: `GET /v1/system/soft/container/{id}`

**路径参数**:
- `id`: 容器ID

**响应数据**: `ReturnResult<SystemSoftContainer>`

#### 5. 获取容器日志

**接口地址**: `GET /v1/system/soft/container/{id}/logs`

**路径参数**:
- `id`: 容器ID

**查询参数**:
- `lines`: 日志行数（可选）

**响应数据**: `ReturnResult<string>`

#### 6. 获取容器统计信息

**接口地址**: `GET /v1/system/soft/container/{id}/stats`

**路径参数**:
- `id`: 容器ID

**响应数据**: `ReturnResult<ContainerStats>`

#### 7. 获取容器状态统计

**接口地址**: `GET /v1/system/soft/container/stats`

**查询参数**:
- `serverId`: 服务器ID（可选）

**响应数据**: `ReturnResult<ContainerStatusStats>`

#### 8. 获取运行中的容器列表

**接口地址**: `GET /v1/system/soft/container/running`

**响应数据**: `ReturnResult<SystemSoftContainer[]>`

#### 9. 获取异常容器列表

**接口地址**: `GET /v1/system/soft/container/abnormal`

**响应数据**: `ReturnResult<SystemSoftContainer[]>`

### 容器操作

#### 1. 创建容器

**接口地址**: `POST /v1/system/soft/container/create`

**请求参数**:
```typescript
interface CreateContainerParams {
  softId: number;         // 软件ID
  serverId: number;       // 服务器ID
  containerName: string;  // 容器名称
  imageTag: string;       // 镜像标签
  ports?: string;         // 端口映射
  envVars?: string;       // 环境变量
  volumes?: string;       // 卷挂载
  command?: string;       // 启动命令
  args?: string;          // 命令参数
}
```

**响应数据**: `ReturnResult<boolean>`

#### 2. 启动容器

**接口地址**: `POST /v1/system/soft/container/{id}/start`

**路径参数**:
- `id`: 容器ID

**响应数据**: `ReturnResult<boolean>`

#### 3. 停止容器

**接口地址**: `POST /v1/system/soft/container/{id}/stop`

**路径参数**:
- `id`: 容器ID

**响应数据**: `ReturnResult<boolean>`

#### 4. 重启容器

**接口地址**: `POST /v1/system/soft/container/{id}/restart`

**路径参数**:
- `id`: 容器ID

**响应数据**: `ReturnResult<boolean>`

#### 5. 删除容器

**接口地址**: `DELETE /v1/system/soft/container/{id}`

**路径参数**:
- `id`: 容器ID

**查询参数**:
- `force`: 是否强制删除（可选）

**响应数据**: `ReturnResult<boolean>`

#### 6. 更新容器配置

**接口地址**: `PUT /v1/system/soft/container/{id}`

**路径参数**:
- `id`: 容器ID

**请求参数**:
```typescript
interface UpdateContainerParams {
  containerName?: string;  // 容器名称
  imageTag?: string;       // 镜像标签
  ports?: string;          // 端口映射
  envVars?: string;        // 环境变量
  volumes?: string;        // 卷挂载
  command?: string;        // 启动命令
  args?: string;           // 命令参数
  autoRestart?: number;    // 自动重启
}
```

**响应数据**: `ReturnResult<boolean>`

#### 7. 同步容器状态

**接口地址**: `POST /v1/system/soft/container/sync`

**请求参数**:
```typescript
interface SyncParams {
  serverId?: number;  // 服务器ID（可选）
}
```

**响应数据**: `ReturnResult<number>`

#### 8. 批量操作容器

**接口地址**: `POST /v1/system/soft/container/batch`

**请求参数**:
```typescript
interface BatchOperationParams {
  containerIds: number[];                           // 容器ID列表
  operation: 'start' | 'stop' | 'restart' | 'remove'; // 操作类型
}
```

**响应数据**: `ReturnResult<BatchOperationResult>`

### WebSocket 相关

#### 1. 获取WebSocket主题信息

**接口地址**: `GET /v1/system/soft/container/websocket/topics`

**响应数据**:
```typescript
interface WebSocketTopics {
  containerStatus: string;     // 容器状态主题
  containerLogs: string;       // 容器日志主题
  containerStatistics: string; // 容器统计主题
  containerEvents: string;     // 容器事件主题
}
```

#### 2. 获取WebSocket连接状态

**接口地址**: `GET /v1/system/soft/container/websocket/status`

**响应数据**:
```typescript
interface WebSocketStatus {
  enabled: boolean;           // 是否启用
  activeConnections: number;  // 活跃连接数
  totalSessions: number;      // 总会话数
  uptime: string;            // 运行时间
}
```

#### 3. 手动推送容器统计信息

**接口地址**: `POST /v1/system/soft/container/websocket/push-statistics`

**请求参数**:
```typescript
interface PushParams {
  serverId: number;  // 服务器ID
}
```

**响应数据**: `ReturnResult<string>`

#### 4. 手动推送批量容器状态

**接口地址**: `POST /v1/system/soft/container/websocket/push-status`

**请求参数**:
```typescript
interface PushParams {
  serverId: number;  // 服务器ID
}
```

**响应数据**: `ReturnResult<string>`

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 使用示例

### 获取软件列表

```typescript
import { getSoftPageList } from '@/api/soft';

const loadSoftList = async () => {
  try {
    const response = await getSoftPageList({
      page: 1,
      pageSize: 10,
      systemSoftName: '搜索关键词'
    });
    
    if (response.code === 200) {
      const { records, total } = response.data;
      console.log('软件列表:', records);
      console.log('总数:', total);
    }
  } catch (error) {
    console.error('获取软件列表失败:', error);
  }
};
```

### 安装软件

```typescript
import { installSoft } from '@/api/soft';

const handleInstall = async () => {
  try {
    const response = await installSoft({
      systemSoftId: 1,
      systemSoftVersionId: 1,
      serverIds: [1, 2, 3],
      method: 'docker',
      params: '{}'
    });
    
    if (response.code === 200) {
      console.log('安装成功');
    }
  } catch (error) {
    console.error('安装失败:', error);
  }
};
```

### 容器操作

```typescript
import { startContainer, stopContainer, getContainerLogs } from '@/api/soft';

// 启动容器
const handleStart = async (containerId: number) => {
  try {
    const response = await startContainer(containerId);
    if (response.code === 200) {
      console.log('容器启动成功');
    }
  } catch (error) {
    console.error('容器启动失败:', error);
  }
};

// 获取容器日志
const handleGetLogs = async (containerId: number) => {
  try {
    const response = await getContainerLogs(containerId, 100);
    if (response.code === 200) {
      console.log('容器日志:', response.data);
    }
  } catch (error) {
    console.error('获取日志失败:', error);
  }
};
```

## 注意事项

1. **认证**: 所有接口都需要在请求头中携带有效的 Bearer Token
2. **分页**: 分页参数支持 `page/pageSize` 和 `current/size` 两种格式
3. **时间格式**: 所有时间字段采用 ISO 8601 格式
4. **状态值**: 容器状态包括 `running`、`stopped`、`paused`、`exited`、`dead` 等
5. **WebSocket**: 实时功能需要建立 WebSocket 连接，主题信息通过接口获取
6. **批量操作**: 批量操作会返回详细的成功/失败信息
7. **错误处理**: 建议对所有接口调用进行适当的错误处理

## 更新日志

### v1.0.0 (2025-01-10)
- 初始版本发布
- 完整的软件管理功能
- 容器生命周期管理
- WebSocket 实时通信
- 组件化架构设计