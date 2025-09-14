# Docker软件管理流程文档

## 概述

本文档描述了系统中Docker软件管理的完整流程，包括从软件仓库同步、软件安装到容器启动的全过程。

## 业务流程

### 1. 软件仓库同步

用户通过前端软件页面，从软件仓库同步软件信息到本地数据库。

**流程步骤：**
1. 用户在前端选择软件仓库
2. 系统从仓库获取软件列表
3. 将软件信息存储到 `system_soft_image` 表
4. 更新软件状态为可用

### 2. 软件安装部署

用户选择软件并指定目标服务器进行安装。

**流程步骤：**
1. 用户在软件列表中选择要安装的软件
2. 选择目标服务器（支持单个或多个服务器）
3. 系统创建安装记录到 `system_soft_record` 表
4. 系统拉取Docker镜像到指定服务器
5. 实时推送安装进度到前端

### 3. 容器启动管理

基于已安装的镜像启动Docker容器。

**流程步骤：**
1. 用户选择已安装的镜像
2. 配置容器启动参数
3. 启动Docker容器
4. 监控容器运行状态

## 数据库设计

### system_soft_image 表

软件镜像信息表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| system_soft_image_id | BIGINT | 主键ID |
| system_soft_image_name | VARCHAR(255) | 软件名称 |
| system_soft_image_version | VARCHAR(100) | 软件版本 |
| system_soft_image_docker_image | VARCHAR(500) | Docker镜像名称 |
| system_soft_image_description | TEXT | 软件描述 |
| system_soft_image_status | VARCHAR(50) | 软件状态 |
| system_soft_image_create_time | DATETIME | 创建时间 |
| system_soft_image_update_time | DATETIME | 更新时间 |

### system_soft_record 表

软件安装记录表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| system_soft_record_id | BIGINT | 主键ID |
| system_soft_record_soft_id | BIGINT | 软件ID |
| system_soft_record_server_id | BIGINT | 服务器ID |
| system_soft_record_status | VARCHAR(50) | 安装状态 |
| system_soft_record_start_time | DATETIME | 开始时间 |
| system_soft_record_end_time | DATETIME | 结束时间 |
| system_soft_record_remark | TEXT | 备注信息 |

## API接口文档

### 1. 软件管理接口

#### 1.1 获取软件列表

**接口地址：** `GET /api/system/soft/page`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页大小，默认10 |
| name | String | 否 | 软件名称（模糊查询） |
| status | String | 否 | 软件状态 |

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "systemSoftImageId": 1,
        "systemSoftImageName": "nginx",
        "systemSoftImageVersion": "1.21.0",
        "systemSoftImageDockerImage": "nginx:1.21.0",
        "systemSoftImageDescription": "高性能Web服务器",
        "systemSoftImageStatus": "AVAILABLE",
        "systemSoftImageCreateTime": "2024-01-01T10:00:00",
        "systemSoftImageUpdateTime": "2024-01-01T10:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

#### 1.2 同步软件镜像

**接口地址：** `POST /api/system/soft/sync/{softId}`

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| softId | Long | 是 | 软件ID |

**响应示例：**

```json
{
  "code": 200,
  "message": "镜像同步成功",
  "data": true
}
```

#### 1.3 拉取软件镜像

**接口地址：** `POST /api/system/soft/pull/{softId}`

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| softId | Long | 是 | 软件ID |

**响应示例：**

```json
{
  "code": 200,
  "message": "镜像拉取成功",
  "data": true
}
```

### 2. 安装记录接口

#### 2.1 获取安装记录列表

**接口地址：** `GET /api/system/soft/record/page`

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| size | Integer | 否 | 每页大小，默认10 |
| softId | Long | 否 | 软件ID |
| serverId | Long | 否 | 服务器ID |
| status | String | 否 | 安装状态 |

**响应示例：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "records": [
      {
        "systemSoftRecordId": 1,
        "systemSoftRecordSoftId": 1,
        "systemSoftRecordServerId": 1,
        "systemSoftRecordStatus": "SUCCESS",
        "systemSoftRecordStartTime": "2024-01-01T10:00:00",
        "systemSoftRecordEndTime": "2024-01-01T10:05:00",
        "systemSoftRecordRemark": "安装成功"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

## WebSocket实时通信

### 连接地址

`ws://localhost:8080/socket.io`

### 消息类型

#### 1. Docker操作开始

**消息类型：** `docker_start`

**消息格式：**

```json
{
  "type": "docker_start",
  "operation": "pull",
  "imageName": "nginx:1.21.0",
  "timestamp": "2024-01-01T10:00:00"
}
```

#### 2. Docker操作进度

**消息类型：** `docker_progress`

**消息格式：**

```json
{
  "type": "docker_progress",
  "operation": "pull",
  "imageName": "nginx:1.21.0",
  "status": "Downloading",
  "progress": "[==>                ] 25%",
  "id": "layer_id_123",
  "timestamp": "2024-01-01T10:01:00"
}
```

#### 3. Docker操作完成

**消息类型：** `docker_complete`

**消息格式：**

```json
{
  "type": "docker_complete",
  "operation": "pull",
  "imageName": "nginx:1.21.0",
  "success": true,
  "timestamp": "2024-01-01T10:05:00"
}
```

#### 4. Docker操作错误

**消息类型：** `docker_error`

**消息格式：**

```json
{
  "type": "docker_error",
  "operation": "pull",
  "imageName": "nginx:1.21.0",
  "error": "网络连接超时",
  "timestamp": "2024-01-01T10:03:00"
}
```

## 状态枚举

### SystemSoftRecordStatus

安装记录状态枚举

| 状态值 | 说明 |
|--------|------|
| PENDING | 等待中 |
| RUNNING | 执行中 |
| SUCCESS | 成功 |
| FAILED | 失败 |
| CANCELLED | 已取消 |

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | Docker客户端连接失败 |
| 1002 | 镜像拉取失败 |
| 1003 | 容器启动失败 |

## 使用示例

### 前端JavaScript示例

```javascript
// 连接WebSocket
const socket = io('ws://localhost:8080');

// 监听Docker操作进度
socket.on('docker_progress', (data) => {
  console.log('Docker操作进度:', data);
  // 更新进度条
  updateProgressBar(data.progress);
});

// 监听Docker操作完成
socket.on('docker_complete', (data) => {
  console.log('Docker操作完成:', data);
  if (data.success) {
    showSuccessMessage('操作完成');
  } else {
    showErrorMessage('操作失败');
  }
});

// 拉取镜像
function pullImage(softId) {
  fetch(`/api/system/soft/pull/${softId}`, {
    method: 'POST'
  })
  .then(response => response.json())
  .then(data => {
    if (data.code === 200) {
      console.log('开始拉取镜像');
    }
  });
}
```

## 注意事项

1. **网络连接**：确保服务器能够访问Docker Hub或私有镜像仓库
2. **磁盘空间**：拉取镜像前检查服务器磁盘空间是否充足
3. **权限管理**：确保应用有足够的权限操作Docker
4. **并发控制**：避免同时对同一镜像进行多次操作
5. **错误处理**：合理处理网络超时、镜像不存在等异常情况
6. **日志记录**：详细记录操作日志便于问题排查

## 扩展功能

### 1. 镜像版本管理

- 支持多版本镜像管理
- 版本升级和回滚功能
- 版本比较和差异分析

### 2. 容器编排

- 支持Docker Compose
- 多容器应用部署
- 服务依赖管理

### 3. 监控告警

- 容器运行状态监控
- 资源使用情况监控
- 异常情况自动告警

### 4. 安全管理

- 镜像安全扫描
- 访问权限控制
- 操作审计日志