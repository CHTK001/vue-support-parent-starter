# Docker管理API接口文档 - 前端对接指南

## 📋 文档说明

本文档为vue-support-monitor-starter前端项目提供完整的Docker管理API接口文档，包括请求参数、响应格式、错误处理和使用示例。

## 🔗 基础配置

### API基础路径
```
开发环境: http://localhost:8080/api/monitor
生产环境: https://your-domain.com/api/monitor
```

### 统一响应格式
```typescript
interface ApiResponse<T> {
  code: number        // 响应代码，200为成功
  data: T            // 响应数据
  msg: string        // 响应消息
  ok: boolean        // 是否成功
}
```

### 错误处理规范
根据项目规范，前端API调用采用异步回调方式：
```javascript
// ✅ 正确的调用方式
api.dockerRegistry.getList(params)
  .then(response => {
    // then中的数据默认是成功的，无需判断code
    console.log('获取成功:', response.data)
  })
  .catch(error => {
    // error中默认是失败的，直接处理错误
    console.error('获取失败:', error.message)
  })
```

## 🏭 1. 软件仓库管理API

### 数据模型
```typescript
interface SystemSoftRegistry {
  systemSoftRegistryId?: number           // 仓库ID
  systemSoftRegistryName: string          // 仓库名称
  systemSoftRegistryType: string          // 仓库类型：docker_hub, harbor, nexus
  systemSoftRegistryUrl: string           // 仓库地址
  systemSoftRegistryUsername?: string     // 用户名
  systemSoftRegistryPassword?: string     // 密码
  systemSoftRegistryStatus: number        // 状态：0-禁用, 1-启用
  systemSoftRegistryIsDefault: number     // 是否默认：0-否, 1-是
  systemSoftRegistryDescription?: string  // 描述
  createTime?: string                     // 创建时间
  updateTime?: string                     // 更新时间
}
```

### 1.1 查询仓库列表
```http
GET /api/monitor/system-soft-registry/list
```

**请求参数：**
```typescript
interface RegistryQueryParams {
  registryName?: string    // 仓库名称（模糊查询）
  registryType?: string    // 仓库类型
  status?: number         // 状态
}
```

**响应示例：**
```json
{
  "code": 200,
  "data": [
    {
      "systemSoftRegistryId": 1,
      "systemSoftRegistryName": "Docker Hub",
      "systemSoftRegistryType": "docker_hub",
      "systemSoftRegistryUrl": "https://registry-1.docker.io",
      "systemSoftRegistryStatus": 1,
      "systemSoftRegistryIsDefault": 1,
      "createTime": "2025-01-15 10:00:00"
    }
  ],
  "msg": "查询成功",
  "ok": true
}
```

**前端使用示例：**
```javascript
// 获取仓库列表
dockerRegistryApi.getList({ registryName: 'docker' })
  .then(response => {
    this.registryList = response.data
  })
  .catch(error => {
    ElMessage.error('获取仓库列表失败')
  })
```

### 1.2 新增仓库
```http
POST /api/monitor/system-soft-registry
```

**请求体：**
```json
{
  "systemSoftRegistryName": "私有仓库",
  "systemSoftRegistryType": "harbor",
  "systemSoftRegistryUrl": "https://harbor.example.com",
  "systemSoftRegistryUsername": "admin",
  "systemSoftRegistryPassword": "password",
  "systemSoftRegistryDescription": "公司私有镜像仓库"
}
```

### 1.3 测试仓库连接
```http
POST /api/monitor/system-soft-registry/{id}/test-connection
```

**响应示例：**
```json
{
  "code": 200,
  "data": true,
  "msg": "连接测试成功",
  "ok": true
}
```

### 1.4 设置默认仓库
```http
POST /api/monitor/system-soft-registry/{id}/set-default
```

### 1.5 批量更新状态
```http
PUT /api/monitor/system-soft-registry/batch-status?registryIds=1,2,3&status=1
```

## 💻 2. 软件管理API

### 数据模型
```typescript
interface SystemSoft {
  systemSoftId?: number                   // 软件ID
  systemSoftName: string                  // 软件名称
  systemSoftCode: string                  // 软件代码
  systemSoftCategory?: string             // 软件分类
  systemSoftIcon?: string                 // 软件图标
  systemSoftTags?: string                 // 软件标签
  systemSoftDesc?: string                 // 软件描述
  systemSoftRegistryId?: number           // 仓库ID
  systemSoftDockerImage?: string          // Docker镜像名称
  systemSoftDefaultInstallMethod?: string // 默认安装方式
  systemSoftDefaultInstallParams?: string // 默认安装参数
  systemSoftStatus: number                // 软件状态
  systemSoftIsOfficial: number            // 是否官方软件
  createTime?: string                     // 创建时间
  updateTime?: string                     // 更新时间
}
```

### 2.1 查询软件列表
```http
GET /api/monitor/system-soft/list
```

**请求参数：**
```typescript
interface SoftwareQueryParams {
  softCode?: string      // 软件代码
  softName?: string      // 软件名称
  category?: string      // 软件分类
  status?: number        // 软件状态
}
```

### 2.2 同步软件信息
```http
POST /api/monitor/system-soft/sync
```

**请求参数：**
```typescript
interface SyncSoftwareRequest {
  registryId?: number    // 仓库ID，不传则使用默认仓库
}
```

**响应示例：**
```json
{
  "code": 200,
  "data": 15,
  "msg": "同步成功，共同步15个软件",
  "ok": true
}
```

**前端使用示例（带进度监控）：**
```javascript
// 软件同步（带实时进度）
async syncSoftware(registryId) {
  this.syncing = true
  this.syncProgress = 0
  
  // 监听同步进度
  socketService.on('sync-progress', (data) => {
    this.syncProgress = data.progress
    this.syncLogs.push(data.message)
  })
  
  try {
    const response = await dockerSoftwareApi.sync(registryId)
    ElMessage.success(`同步完成，共同步${response.data}个软件`)
  } catch (error) {
    ElMessage.error('同步失败')
  } finally {
    this.syncing = false
    socketService.off('sync-progress')
  }
}
```

### 2.3 安装软件
```http
POST /api/monitor/system-soft/install
```

**请求体：**
```json
{
  "softId": 1,
  "serverIds": [1, 2, 3],
  "imageTag": "latest"
}
```

### 2.4 获取软件可用标签
```http
GET /api/monitor/system-soft/{id}/tags
```

**响应示例：**
```json
{
  "code": 200,
  "data": ["latest", "v1.0.0", "v1.1.0", "stable"],
  "msg": "获取成功",
  "ok": true
}
```

### 2.5 搜索软件
```http
GET /api/monitor/system-soft/search?keyword=nginx
```

### 2.6 获取热门软件
```http
GET /api/monitor/system-soft/popular?limit=10
```

## 🖼️ 3. 镜像管理API

### 数据模型
```typescript
interface SystemSoftImage {
  systemSoftImageId?: number              // 镜像ID
  systemSoftId: number                    // 关联软件ID
  systemSoftImageServerId: number         // 关联服务器ID
  systemSoftImageServerName?: string      // 服务器名称
  systemSoftImageImageId?: string         // Docker镜像ID
  systemSoftImageName: string             // 镜像名称
  systemSoftImageTag?: string             // 镜像标签
  systemSoftImageFullName?: string        // 镜像完整名称
  systemSoftImageRepository?: string      // 镜像仓库地址
  systemSoftImageSize?: number            // 镜像大小
  systemSoftImageCreated?: string         // 镜像创建时间
  systemSoftImageArchitecture?: string    // 镜像架构
  systemSoftImageOsType?: string          // 操作系统类型
  systemSoftImageStatus?: string          // 镜像状态
  systemSoftImageDescription?: string     // 镜像描述
  createTime?: string                     // 记录创建时间
  updateTime?: string                     // 记录更新时间
}
```

### 3.1 查询镜像列表
```http
GET /api/monitor/system-soft-image/list
```

**请求参数：**
```typescript
interface ImageQueryParams {
  serverId?: number      // 服务器ID
  softId?: number        // 软件ID
  status?: string        // 镜像状态
  imageName?: string     // 镜像名称
}
```

### 3.2 拉取镜像
```http
POST /api/monitor/system-soft-image/pull
```

**请求体：**
```json
{
  "softId": 1,
  "serverId": 1,
  "imageTag": "latest",
  "params": {
    "forceUpdate": false,
    "pullTimeout": 300
  }
}
```

**前端使用示例（带实时日志）：**
```javascript
// 拉取镜像（带实时日志）
async pullImage(pullRequest) {
  this.pulling = true
  this.pullLogs = []
  
  // 监听拉取进度
  socketService.on('image-pull-progress', (data) => {
    this.pullLogs.push(`${data.timestamp}: ${data.message}`)
    this.$nextTick(() => {
      this.scrollToBottom() // 滚动到日志底部
    })
  })
  
  try {
    const response = await dockerImageApi.pull(pullRequest)
    ElMessage.success('镜像拉取成功')
    this.refreshImageList()
  } catch (error) {
    ElMessage.error('镜像拉取失败')
  } finally {
    this.pulling = false
    socketService.off('image-pull-progress')
  }
}
```

### 3.3 启动镜像（创建容器）
```http
POST /api/monitor/system-soft-image/{id}/start
```

**请求体：**
```json
{
  "containerName": "my-nginx",
  "ports": {
    "80": "8080",
    "443": "8443"
  },
  "environment": {
    "ENV": "production",
    "DEBUG": "false"
  },
  "volumes": {
    "/data": "/var/www/html",
    "/logs": "/var/log/nginx"
  },
  "command": "nginx -g 'daemon off;'",
  "restartPolicy": "always"
}
```

### 3.4 获取镜像日志
```http
GET /api/monitor/system-soft-image/{id}/logs
```

### 3.5 同步镜像状态
```http
POST /api/monitor/system-soft-image/sync?serverId=1
```

## 📦 4. 容器管理API

### 数据模型
```typescript
interface SystemSoftContainer {
  systemSoftContainerId?: number          // 容器ID
  systemSoftId: number                    // 关联软件ID
  systemServerId: number                  // 关联服务器ID
  systemSoftContainerDockerId?: string    // Docker容器ID
  systemSoftContainerName: string         // 容器名称
  systemSoftContainerImage?: string       // 容器镜像
  systemSoftContainerImageTag?: string    // 容器镜像标签
  systemSoftContainerStatus?: string      // 容器状态
  systemSoftContainerPorts?: string       // 容器端口映射
  systemSoftContainerEnv?: string         // 容器环境变量
  systemSoftContainerVolumes?: string     // 容器数据卷
  systemSoftContainerNetworks?: string    // 容器网络
  systemSoftContainerCommand?: string     // 容器启动命令
  systemSoftContainerCreatedTime?: string // 容器创建时间
  systemSoftContainerStartedTime?: string // 容器启动时间
  systemSoftContainerRestartCount?: number // 容器重启次数
  systemSoftContainerHealthStatus?: string // 容器健康状态
  systemSoftContainerAutoRestart?: number  // 是否自动重启
  systemSoftContainerCpuLimit?: number     // CPU使用限制
  systemSoftContainerMemoryLimit?: number  // 内存使用限制
  createTime?: string                      // 记录创建时间
  updateTime?: string                      // 记录更新时间
}
```

### 4.1 查询容器列表
```http
GET /api/monitor/system-soft-container/list
```

**请求参数：**
```typescript
interface ContainerQueryParams {
  serverId?: number        // 服务器ID
  softId?: number          // 软件ID
  status?: string          // 容器状态
  containerName?: string   // 容器名称
}
```

### 4.2 创建容器
```http
POST /api/monitor/system-soft-container/create
```

**请求体：**
```json
{
  "softId": 1,
  "serverId": 1,
  "containerName": "my-app-container",
  "imageTag": "latest",
  "params": {
    "ports": {
      "80": "8080"
    },
    "environment": {
      "NODE_ENV": "production"
    },
    "volumes": {
      "/app/data": "/data"
    },
    "restartPolicy": "unless-stopped",
    "cpuLimit": 2.0,
    "memoryLimit": 1024
  }
}
```

### 4.3 容器生命周期操作

#### 启动容器
```http
POST /api/monitor/system-soft-container/{id}/start
```

#### 停止容器
```http
POST /api/monitor/system-soft-container/{id}/stop
```

#### 重启容器
```http
POST /api/monitor/system-soft-container/{id}/restart
```

#### 删除容器
```http
DELETE /api/monitor/system-soft-container/{id}/container?force=false
```

### 4.4 获取容器日志
```http
GET /api/monitor/system-soft-container/{id}/logs?lines=100
```

**前端使用示例（实时日志流）：**
```javascript
// 获取容器实时日志
watchContainerLogs(containerId) {
  // WebSocket连接实时日志
  socketService.on(`container-logs-${containerId}`, (data) => {
    this.containerLogs.push({
      timestamp: data.timestamp,
      message: data.message,
      level: data.level
    })
    
    // 自动滚动到底部
    this.$nextTick(() => {
      const logContainer = this.$refs.logContainer
      logContainer.scrollTop = logContainer.scrollHeight
    })
  })
}
```

### 4.5 获取容器统计信息
```http
GET /api/monitor/system-soft-container/{id}/stats
```

**响应示例：**
```json
{
  "code": 200,
  "data": {
    "cpuUsage": {
      "percentage": 15.5,
      "totalUsage": 1550000000,
      "systemUsage": 10000000000
    },
    "memoryUsage": {
      "usage": 134217728,
      "limit": 1073741824,
      "percentage": 12.5
    },
    "networkIO": {
      "rxBytes": 1024000,
      "txBytes": 512000
    },
    "diskIO": {
      "readBytes": 2048000,
      "writeBytes": 1024000
    }
  },
  "msg": "获取成功",
  "ok": true
}
```

**前端使用示例（实时监控图表）：**
```javascript
// 容器实时监控
startContainerMonitor(containerId) {
  // 定时获取统计信息
  this.monitorInterval = setInterval(async () => {
    try {
      const response = await dockerContainerApi.getStats(containerId)
      const stats = response.data
      
      // 更新CPU使用率图表
      this.cpuChartData.push({
        time: new Date().toLocaleTimeString(),
        value: stats.cpuUsage.percentage
      })
      
      // 更新内存使用图表
      this.memoryChartData.push({
        time: new Date().toLocaleTimeString(),
        value: stats.memoryUsage.percentage
      })
      
      // 保持图表数据点数量
      if (this.cpuChartData.length > 20) {
        this.cpuChartData.shift()
        this.memoryChartData.shift()
      }
      
    } catch (error) {
      console.error('获取容器统计信息失败:', error)
    }
  }, 2000) // 每2秒更新一次
}
```

### 4.6 批量操作容器
```http
POST /api/monitor/system-soft-container/batch-operation
```

**请求体：**
```json
{
  "containerIds": [1, 2, 3],
  "operation": "start",
  "params": {
    "timeout": 30
  }
}
```

### 4.7 容器验证接口

#### 检查容器名称
```http
GET /api/monitor/system-soft-container/check-name?containerName=my-app&serverId=1&excludeId=2
```

#### 检查端口占用
```http
GET /api/monitor/system-soft-container/check-port?hostPort=8080&serverId=1&excludeId=2
```

## 🌐 5. WebSocket实时功能

### 连接配置
```javascript
// socket-config.js
const socketConfig = {
  url: process.env.VUE_APP_SOCKET_URL || 'ws://localhost:8080',
  options: {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  }
}
```

### 事件监听
```javascript
// 监听容器状态变化
socketService.on('container-status-change', (data) => {
  console.log('容器状态变化:', data)
  // data格式: { containerId, status, timestamp }
})

// 监听镜像拉取进度
socketService.on('image-pull-progress', (data) => {
  console.log('镜像拉取进度:', data)
  // data格式: { imageId, progress, message, timestamp }
})

// 监听软件同步进度
socketService.on('software-sync-progress', (data) => {
  console.log('软件同步进度:', data)
  // data格式: { registryId, progress, currentSoftware, totalSoftware }
})
```

## 🔧 6. 前端工具函数

### API请求封装
```javascript
// utils/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL,
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加认证token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const { data } = response
    if (data.ok) {
      return data
    } else {
      ElMessage.error(data.msg || '操作失败')
      return Promise.reject(new Error(data.msg))
    }
  },
  error => {
    const message = error.response?.data?.msg || error.message || '网络错误'
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default request
```

### 状态格式化工具
```javascript
// utils/status-formatter.js
export const formatContainerStatus = (status) => {
  const statusMap = {
    'running': { text: '运行中', type: 'success', icon: 'play-circle' },
    'stopped': { text: '已停止', type: 'info', icon: 'stop-circle' },
    'restarting': { text: '重启中', type: 'warning', icon: 'refresh' },
    'error': { text: '异常', type: 'danger', icon: 'exclamation-circle' }
  }
  return statusMap[status] || { text: '未知', type: 'info', icon: 'question-circle' }
}

export const formatImageStatus = (status) => {
  const statusMap = {
    'AVAILABLE': { text: '可用', type: 'success' },
    'PULLING': { text: '拉取中', type: 'warning' },
    'ERROR': { text: '错误', type: 'danger' },
    'PENDING': { text: '等待中', type: 'info' }
  }
  return statusMap[status] || { text: '未知', type: 'info' }
}
```

### 时间格式化工具
```javascript
// utils/time-formatter.js
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

export const formatTime = (time) => {
  if (!time) return '-'
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

export const formatRelativeTime = (time) => {
  if (!time) return '-'
  return dayjs(time).fromNow()
}
```

## 📋 7. 错误处理指南

### 常见错误码
```javascript
const errorCodes = {
  400: '请求参数错误',
  401: '未授权访问',
  403: '权限不足',
  404: '资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂不可用'
}
```

### 重试机制
```javascript
// utils/retry.js
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
    }
  }
}

// 使用示例
const result = await retryRequest(
  () => dockerContainerApi.getStats(containerId),
  3,
  1000
)
```

## 🧪 8. 测试用例示例

### API测试
```javascript
// tests/api/docker-registry.test.js
describe('Docker Registry API', () => {
  test('should get registry list', async () => {
    const response = await dockerRegistryApi.getList({})
    expect(response.ok).toBe(true)
    expect(Array.isArray(response.data)).toBe(true)
  })
  
  test('should create registry', async () => {
    const registryData = {
      systemSoftRegistryName: 'Test Registry',
      systemSoftRegistryType: 'docker_hub',
      systemSoftRegistryUrl: 'https://registry.hub.docker.com'
    }
    const response = await dockerRegistryApi.create(registryData)
    expect(response.ok).toBe(true)
    expect(response.data.systemSoftRegistryId).toBeDefined()
  })
})
```

---

## 💡 开发建议

1. **API调用规范**：严格按照项目规范使用async/await + then/catch错误处理
2. **实时功能**：充分利用WebSocket实现真正的实时体验
3. **用户体验**：长时间操作必须有进度指示和取消功能
4. **错误处理**：提供友好的错误提示和重试机制
5. **性能优化**：大列表使用虚拟滚动，频繁操作使用防抖
6. **状态管理**：合理使用Pinia管理全局状态，避免过度设计

这份API文档提供了前端开发所需的全部接口信息和最佳实践，确保前端团队能够高效地对接后端Docker管理API。