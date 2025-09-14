# Docker容器管理功能详细说明

## 概述

本文档详细说明了spring-api-support-monitor-starter模块中的Docker容器管理功能，包括所有接口的入参、出参、使用示例和注意事项。

## 目录

- [实体说明](#实体说明)
- [查询接口](#查询接口)
- [管理接口](#管理接口)
- [WebSocket接口](#websocket接口)
- [使用示例](#使用示例)
- [错误码说明](#错误码说明)
- [最佳实践](#最佳实践)

## 实体说明

### SystemSoftContainer 容器实体

| 字段名 | 类型 | 说明 | 示例值 |
|--------|------|------|--------|
| systemSoftContainerId | Integer | 容器主键ID | 1 |
| systemSoftId | Integer | 关联的软件ID | 10 |
| systemSoftVersionId | Integer | 关联的软件版本ID | 25 |
| systemServerId | Integer | 关联的服务器ID | 5 |
| systemSoftContainerName | String | 容器名称 | "nginx-web-server" |
| systemSoftContainerDockerId | String | Docker容器ID | "a1b2c3d4e5f6" |
| systemSoftContainerStatus | String | 容器状态 | "RUNNING" |
| systemSoftContainerHealthStatus | String | 健康状态 | "HEALTHY" |
| systemSoftContainerImageName | String | 镜像名称 | "nginx" |
| systemSoftContainerImageTag | String | 镜像标签 | "1.21.6" |
| systemSoftContainerPorts | String | 端口映射配置 | "80:8080,443:8443" |
| systemSoftContainerVolumes | String | 卷挂载配置 | "/data:/var/www/html" |
| systemSoftContainerEnvironment | String | 环境变量配置 | "ENV=prod,DEBUG=false" |
| systemSoftContainerNetworks | String | 网络配置 | "bridge" |
| systemSoftContainerLabels | String | 标签配置 | "app=web,version=1.0" |
| systemSoftContainerCommand | String | 启动命令 | "nginx -g 'daemon off;'" |
| systemSoftContainerArgs | String | 启动参数 | "-c /etc/nginx/nginx.conf" |
| systemSoftContainerWorkingDir | String | 工作目录 | "/var/www/html" |
| systemSoftContainerUser | String | 运行用户 | "nginx" |
| systemSoftContainerRestartPolicy | String | 重启策略 | "always" |
| systemSoftContainerCpuLimit | String | CPU限制 | "1.5" |
| systemSoftContainerMemoryLimit | String | 内存限制 | "512m" |
| systemSoftContainerCreatedTime | LocalDateTime | 创建时间 | "2024-01-01T10:00:00" |
| systemSoftContainerStartedTime | LocalDateTime | 启动时间 | "2024-01-01T10:01:00" |
| systemSoftContainerFinishedTime | LocalDateTime | 结束时间 | "2024-01-01T18:00:00" |
| systemSoftContainerExitCode | Integer | 退出码 | 0 |
| systemSoftContainerError | String | 错误信息 | "" |
| systemSoftContainerLogPath | String | 日志路径 | "/var/log/nginx/access.log" |
| systemSoftContainerConfigHash | String | 配置哈希值 | "abc123def456" |
| systemSoftContainerRemark | String | 备注信息 | "Web服务器容器" |

### 容器状态枚举

| 状态值 | 说明 | 描述 |
|--------|------|------|
| CREATED | 已创建 | 容器已创建但未启动 |
| RUNNING | 运行中 | 容器正在运行 |
| PAUSED | 已暂停 | 容器已暂停 |
| RESTARTING | 重启中 | 容器正在重启 |
| REMOVING | 删除中 | 容器正在删除 |
| EXITED | 已退出 | 容器已退出 |
| DEAD | 已死亡 | 容器已死亡 |

### 健康状态枚举

| 状态值 | 说明 | 描述 |
|--------|------|------|
| HEALTHY | 健康 | 容器健康检查通过 |
| UNHEALTHY | 不健康 | 容器健康检查失败 |
| STARTING | 启动中 | 容器健康检查启动中 |
| NONE | 无检查 | 容器未配置健康检查 |

## 查询接口

### 1. 分页查询容器列表

**接口地址：** `GET /v1/system/soft/container/page`

**接口说明：** 根据条件分页查询容器列表

**请求参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| current | Long | 否 | 1 | 当前页 |
| size | Long | 否 | 10 | 每页大小 |
| serverId | Integer | 否 | - | 服务器ID |
| status | String | 否 | - | 容器状态 |
| keyword | String | 否 | - | 关键词（容器名称、镜像名称） |

**响应参数（使用ReturnResult）：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "records": [
      {
        "systemSoftContainerId": 1,
        "systemSoftId": 10,
        "systemServerId": 5,
        "systemSoftContainerName": "nginx-web-server",
        "systemSoftContainerStatus": "RUNNING",
        "systemSoftContainerHealthStatus": "HEALTHY",
        "systemSoftContainerImageName": "nginx",
        "systemSoftContainerImageTag": "1.21.6",
        "systemSoftContainerCreatedTime": "2024-01-01T10:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  },
  "success": true
}
```

### 2. 根据软件ID查询容器列表

**接口地址：** `GET /v1/system/soft/container/soft/{softId}`

**接口说明：** 根据软件ID查询该软件的所有容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| softId | Integer | 是 | 软件ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": [
    {
      "systemSoftContainerId": 1,
      "systemSoftId": 10,
      "systemSoftContainerName": "nginx-web-server",
      "systemSoftContainerStatus": "RUNNING"
    }
  ]
}
```

### 3. 根据服务器ID查询容器列表

**接口地址：** `GET /v1/system/soft/container/server/{serverId}`

**接口说明：** 根据服务器ID查询该服务器的所有容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serverId | Integer | 是 | 服务器ID |

**响应参数：** 同上

### 4. 根据ID查询容器详情

**接口地址：** `GET /v1/system/soft/container/{id}`

**接口说明：** 根据容器ID查询容器详细信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "systemSoftContainerId": 1,
    "systemSoftId": 10,
    "systemSoftVersionId": 25,
    "systemServerId": 5,
    "systemSoftContainerName": "nginx-web-server",
    "systemSoftContainerDockerId": "a1b2c3d4e5f6",
    "systemSoftContainerStatus": "RUNNING",
    "systemSoftContainerHealthStatus": "HEALTHY",
    "systemSoftContainerImageName": "nginx",
    "systemSoftContainerImageTag": "1.21.6",
    "systemSoftContainerPorts": "80:8080,443:8443",
    "systemSoftContainerVolumes": "/data:/var/www/html",
    "systemSoftContainerEnvironment": "ENV=prod,DEBUG=false",
    "systemSoftContainerCreatedTime": "2024-01-01T10:00:00",
    "systemSoftContainerStartedTime": "2024-01-01T10:01:00"
  }
}
```

### 5. 获取容器日志

**接口地址：** `GET /v1/system/soft/container/{id}/logs`

**接口说明：** 获取指定容器的日志

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**请求参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| lines | Integer | 否 | 100 | 日志行数 |

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": "2024-01-01 10:00:00 [INFO] Starting nginx\n2024-01-01 10:00:01 [INFO] nginx started successfully"
}
```

### 6. 获取容器统计信息

**接口地址：** `GET /v1/system/soft/container/{id}/stats`

**接口说明：** 获取指定容器的资源使用统计信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "cpuUsage": 15.5,
    "memoryUsage": 256,
    "memoryLimit": 512,
    "networkRx": 1024,
    "networkTx": 2048,
    "diskRead": 512,
    "diskWrite": 1024,
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### 7. 获取容器状态统计

**接口地址：** `GET /v1/system/soft/container/stats`

**接口说明：** 获取各状态容器的数量统计

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serverId | Integer | 否 | 服务器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "total": 10,
    "running": 8,
    "stopped": 1,
    "paused": 0,
    "exited": 1,
    "dead": 0
  }
}
```

### 8. 获取运行中的容器列表

**接口地址：** `GET /v1/system/soft/container/running`

**接口说明：** 获取所有运行中的容器

**响应参数：** 返回容器列表，格式同查询接口

### 9. 获取异常容器列表

**接口地址：** `GET /v1/system/soft/container/abnormal`

**接口说明：** 获取所有异常状态的容器

**响应参数：** 返回容器列表，格式同查询接口

### 10. 更新容器配置

**接口地址：** `PUT /v1/system/soft/container/{id}`

**接口说明：** 更新指定容器的配置信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**请求参数：**

```json
{
  "containerName": "nginx-web-updated",
  "imageTag": "1.22.0",
  "ports": "80:8080,443:8443",
  "envVars": "ENV=production,DEBUG=false",
  "volumes": "/data:/var/www/html,/logs:/var/log/nginx",
  "command": "nginx -g 'daemon off;'",
  "args": "-c /etc/nginx/nginx.conf",
  "autoRestart": 1
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| containerName | String | 否 | 容器名称 |
| imageTag | String | 否 | 镜像标签 |
| ports | String | 否 | 端口映射配置 |
| envVars | String | 否 | 环境变量配置 |
| volumes | String | 否 | 卷挂载配置 |
| command | String | 否 | 启动命令 |
| args | String | 否 | 启动参数 |
| autoRestart | Integer | 否 | 自动重启设置 |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器配置更新成功",
  "data": true
}
```

## 管理接口

### 1. 创建容器

**接口地址：** `POST /v1/system/soft/container/create`

**接口说明：** 根据软件镜像创建新容器

**请求参数：**

```json
{
  "softId": 10,
  "serverId": 5,
  "containerName": "nginx-web-server",
  "imageTag": "1.21.6",
  "ports": "80:8080,443:8443",
  "envVars": "ENV=prod,DEBUG=false",
  "volumes": "/data:/var/www/html",
  "command": "nginx -g 'daemon off;'",
  "args": "-c /etc/nginx/nginx.conf"
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| softId | Integer | 是 | 软件ID |
| serverId | Integer | 是 | 服务器ID |
| containerName | String | 是 | 容器名称 |
| imageTag | String | 是 | 镜像标签 |
| ports | String | 否 | 端口映射配置 |
| envVars | String | 否 | 环境变量配置 |
| volumes | String | 否 | 卷挂载配置 |
| command | String | 否 | 启动命令 |
| args | String | 否 | 启动参数 |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器创建成功",
  "data": true
}
```

### 2. 启动容器

**接口地址：** `POST /v1/system/soft/container/{id}/start`

**接口说明：** 启动指定的容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器启动成功",
  "data": true
}
```

### 3. 停止容器

**接口地址：** `POST /v1/system/soft/container/{id}/stop`

**接口说明：** 停止指定的容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器停止成功",
  "data": true
}
```

### 4. 重启容器

**接口地址：** `POST /v1/system/soft/container/{id}/restart`

**接口说明：** 重启指定的容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器重启成功",
  "data": true
}
```

### 5. 删除容器

**接口地址：** `DELETE /v1/system/soft/container/{id}`

**接口说明：** 删除指定的容器

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Integer | 是 | 容器ID |

**请求参数：**

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| force | Boolean | 否 | false | 是否强制删除 |

**响应参数：**

```json
{
  "code": "00000",
  "message": "容器删除成功",
  "data": true
}
```

### 6. 同步容器状态

**接口地址：** `POST /v1/system/soft/container/sync`

**接口说明：** 从Docker API同步容器状态到数据库

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serverId | Integer | 否 | 服务器ID（为空时同步所有服务器） |

**响应参数：**

```json
{
  "code": "00000",
  "message": "同步完成",
  "data": 5
}
```

### 7. 批量操作容器

**接口地址：** `POST /v1/system/soft/container/batch`

**接口说明：** 批量启动、停止、重启或删除容器

**请求参数：**

```json
{
  "containerIds": [1, 2, 3],
  "operation": "start"
}
```

**请求参数说明：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| containerIds | List<Integer> | 是 | 容器ID列表 |
| operation | String | 是 | 操作类型（start/stop/restart/remove） |

**响应参数：**

```json
{
  "code": "00000",
  "message": "批量操作完成",
  "data": {
    "total": 3,
    "success": 2,
    "failed": 1,
    "results": [
      {
        "containerId": 1,
        "success": true,
        "message": "操作成功"
      },
      {
        "containerId": 2,
        "success": true,
        "message": "操作成功"
      },
      {
        "containerId": 3,
        "success": false,
        "message": "容器不存在"
      }
    ]
  }
}
```

## WebSocket接口

### 1. 获取WebSocket主题信息

**接口地址：** `GET /v1/system/soft/container/websocket/topics`

**接口说明：** 获取WebSocket推送主题列表

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "containerStatus": "/topic/container/status/{serverId}",
    "containerLogs": "/topic/container/logs/{containerId}",
    "containerStatistics": "/topic/container/statistics/{serverId}",
    "containerEvents": "/topic/container/events/{serverId}"
  }
}
```

### 2. 获取WebSocket连接状态

**接口地址：** `GET /v1/system/soft/container/websocket/status`

**接口说明：** 获取WebSocket连接状态信息

**响应参数：**

```json
{
  "code": "00000",
  "message": "操作成功",
  "data": {
    "enabled": true,
    "activeConnections": 5,
    "totalSessions": 10,
    "uptime": "2024-01-01T10:00:00Z"
  }
}
```

### 3. 手动推送容器统计信息

**接口地址：** `POST /v1/system/soft/container/websocket/push-statistics`

**接口说明：** 手动推送容器统计信息到WebSocket客户端

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serverId | Integer | 是 | 服务器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "推送成功",
  "data": "统计信息已推送到主题: /topic/container/statistics/1"
}
```

### 4. 手动推送批量容器状态

**接口地址：** `POST /v1/system/soft/container/websocket/push-status`

**接口说明：** 手动推送批量容器状态到WebSocket客户端

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| serverId | Integer | 是 | 服务器ID |

**响应参数：**

```json
{
  "code": "00000",
  "message": "推送成功",
  "data": "容器状态已推送到主题: /topic/container/status/1"
}
```

## 使用示例

### 1. 创建并启动容器的完整流程

```bash
# 1. 创建容器
curl -X POST "http://localhost:8080/v1/system/soft/container/create" \
  -H "Content-Type: application/json" \
  -d '{
    "softId": 10,
    "serverId": 5,
    "containerName": "nginx-web-server",
    "imageTag": "1.21.6",
    "ports": "80:8080",
    "envVars": "ENV=prod"
  }'

# 2. 启动容器
curl -X POST "http://localhost:8080/v1/system/soft/container/1/start"

# 3. 查看容器状态
curl -X GET "http://localhost:8080/v1/system/soft/container/1"

# 4. 查看容器日志
curl -X GET "http://localhost:8080/v1/system/soft/container/1/logs?lines=50"
```

### 2. WebSocket客户端订阅示例

```javascript
// 使用STOMP客户端订阅容器状态变化
const stompClient = new StompJs.Client({
  brokerURL: 'ws://localhost:8080/ws',
  onConnect: function (frame) {
    console.log('Connected: ' + frame);
    
    // 订阅容器状态变化
    stompClient.subscribe('/topic/container/status/1', function (message) {
      const statusUpdate = JSON.parse(message.body);
      console.log('容器状态更新:', statusUpdate);
      // 更新UI显示
      updateContainerStatus(statusUpdate);
    });
    
    // 订阅容器日志
    stompClient.subscribe('/topic/container/logs/123', function (message) {
      const logData = JSON.parse(message.body);
      console.log('容器日志:', logData);
      // 追加日志到界面
      appendLog(logData);
    });
    
    // 订阅容器统计信息
    stompClient.subscribe('/topic/container/statistics/1', function (message) {
      const stats = JSON.parse(message.body);
      console.log('容器统计:', stats);
      // 更新统计图表
      updateStatistics(stats);
    });
  }
});

stompClient.activate();
```

### 3. 批量操作示例

```bash
# 批量启动容器
curl -X POST "http://localhost:8080/v1/system/soft/container/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "containerIds": [1, 2, 3],
    "operation": "start"
  }'

# 批量停止容器
curl -X POST "http://localhost:8080/v1/system/soft/container/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "containerIds": [1, 2, 3],
    "operation": "stop"
  }'
```

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必填项 |
| 404 | 容器不存在 | 检查容器ID是否正确 |
| 500 | 服务器内部错误 | 查看服务器日志，检查Docker连接 |
| 1001 | Docker连接失败 | 检查Docker服务是否启动 |
| 1002 | 容器操作失败 | 检查容器状态和Docker权限 |
| 1003 | 镜像不存在 | 检查镜像名称和标签是否正确 |
| 1004 | 端口冲突 | 检查端口映射配置 |
| 1005 | 资源不足 | 检查服务器资源使用情况 |

## 最佳实践

### 1. 容器命名规范

- 使用有意义的名称：`{软件名}-{环境}-{实例号}`
- 示例：`nginx-prod-01`、`mysql-dev-master`

### 2. 端口映射建议

- 避免使用系统保留端口（1-1023）
- 使用统一的端口范围，如：8000-9000
- 格式：`宿主机端口:容器端口`

### 3. 环境变量配置

- 使用键值对格式：`KEY1=value1,KEY2=value2`
- 避免在环境变量中存储敏感信息
- 使用配置文件或密钥管理系统

### 4. 卷挂载建议

- 数据持久化：将重要数据挂载到宿主机
- 配置文件：将配置文件挂载为只读
- 格式：`宿主机路径:容器路径[:权限]`

### 5. 资源限制

- 设置合理的CPU和内存限制
- 避免容器占用过多系统资源
- 根据应用特性调整限制值

### 6. 监控和日志

- 定期检查容器状态
- 配置日志轮转避免磁盘空间不足
- 使用WebSocket实时监控容器状态变化

### 7. 安全建议

- 不要以root用户运行容器
- 定期更新镜像版本
- 限制容器网络访问权限
- 使用安全的镜像仓库

---

**注意事项：**

1. 所有接口都需要适当的权限验证
2. 容器操作可能需要较长时间，建议设置合理的超时时间
3. WebSocket连接需要保持心跳以避免连接断开
4. 批量操作时注意服务器资源使用情况
5. 定期清理不需要的容器和镜像以释放存储空间

**作者：** [CH]  
**创建时间：** 2024-01-01  
**版本：** 1.0.0