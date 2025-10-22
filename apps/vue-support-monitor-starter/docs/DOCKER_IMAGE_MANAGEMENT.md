# Docker镜像管理功能文档

## 概述

本文档说明了Docker镜像管理的完整实现，包括镜像的查看、分组显示、拉取、安装容器、导出、导入和同步等功能。

## 功能特性

### 1. 镜像分组显示

镜像管理页面支持三种视图模式：

- **按服务器分组**：将镜像按所属服务器分组显示，每个服务器一个卡片，显示该服务器上的所有镜像
- **按镜像分组**：将镜像按名称和标签分组显示，每个镜像一个卡片，显示该镜像在各服务器上的分布
- **列表视图**：传统的表格形式，支持分页

### 2. 镜像操作

#### 2.1 拉取镜像
- 从Docker Hub或私有仓库拉取镜像
- 支持指定镜像名称和标签
- 实时显示拉取进度

#### 2.2 安装容器
- 基于镜像创建并启动容器
- 配置选项包括：
  - 容器名称和主机名
  - 端口映射（支持TCP/UDP）
  - 环境变量
  - 数据卷挂载（支持只读模式）
  - 重启策略（no, always, on-failure, unless-stopped）
  - 网络模式（bridge, host, none）
  - 启动命令和工作目录
  - 创建后自动启动选项
- 针对常见镜像（MySQL、Nginx、Redis）提供默认配置

#### 2.3 导出镜像
- 将Docker镜像导出为tar文件
- 支持单个镜像导出
- 支持批量导出（按服务器）
- 实时显示导出进度

#### 2.4 导入镜像
- 从tar文件导入Docker镜像
- 支持拖拽上传或点击选择
- 三步向导流程：
  1. 选择目标服务器
  2. 选择镜像文件（.tar, .tar.gz, .tgz）
  3. 配置导入选项（镜像名称、标签、强制导入）
- 实时显示导入进度

#### 2.5 同步镜像
- 从服务器同步现有的Docker镜像到系统数据库
- 支持多服务器批量同步
- 自动识别镜像名称和标签
- 实时显示同步进度

#### 2.6 删除镜像
- 从服务器删除Docker镜像
- 支持强制删除选项
- 同时删除数据库记录

### 3. 搜索和过滤

- 按镜像名称或标签搜索
- 按服务器筛选
- 按状态筛选（可用、拉取中、错误）

### 4. 实时进度监控

所有长时间运行的操作都通过Socket.IO实时推送进度：

- 镜像拉取进度：`docker_image_pull_progress`
- 镜像导出进度：`docker_image_export_progress`
- 镜像导入进度：`docker_image_import_progress`
- 镜像同步进度：`software_sync_progress`
- 操作完成通知：`operation_complete`
- 操作错误通知：`operation_error`

## 技术架构

### 前端

#### 页面结构

```
views/docker/images/
├── index.vue                      # 主页面
└── components/
    ├── PullImageDialog.vue        # 拉取镜像对话框
    ├── InstallContainerDialog.vue # 安装容器对话框
    ├── ImageSyncDialog.vue        # 同步镜像对话框
    └── ImageImportDialog.vue      # 导入镜像对话框
```

#### API接口

```typescript
// docker-management.ts
export const imageApi = {
  getImagePageList,      // 分页查询镜像
  getImagesByServerId,   // 按服务器查询
  getImagesBySoftId,     // 按软件查询
  getImageById,          // 获取详情
  pullImage,             // 拉取镜像
  deleteImage,           // 删除镜像
  startImageAsContainer, // 创建容器
  exportImage,           // 导出镜像
  importImage,           // 导入镜像
  syncImages,            // 同步镜像
}
```

#### Socket.IO事件监听

```typescript
// 在 index.vue 的 onMounted 中设置
const globalSocket = useGlobalSocket();

globalSocket.on('docker_image_pull_progress', (data) => {
  // 处理拉取进度
});

globalSocket.on('docker_image_export_progress', (data) => {
  // 处理导出进度
});

globalSocket.on('docker_image_import_progress', (data) => {
  // 处理导入进度
});

globalSocket.on('operation_complete', (operation) => {
  // 处理操作完成，刷新列表
  if (['pull_image', 'export_image', 'import_image', 'sync_images'].includes(operation.type)) {
    loadImages();
  }
});
```

### 后端

#### 控制器层

**SystemSoftImageController.java**

```java
@RestController
@RequestMapping("/api/monitor/system-soft-image")
public class SystemSoftImageController {
    
    @GetMapping("/page")          // 分页查询
    @GetMapping("/list")          // 条件查询
    @GetMapping("/{id}")          // 获取详情
    @PostMapping("/pull")         // 拉取镜像
    @PostMapping("/{id}/start")   // 创建容器
    @DeleteMapping("/{id}/image") // 删除镜像
    @PostMapping("/export")       // 导出镜像
    @PostMapping("/import")       // 导入镜像
    @PostMapping("/sync")         // 同步镜像
}
```

#### 服务层

**SystemSoftImageService.java / SystemSoftImageServiceImpl.java**

主要方法：

- `pullImage()` - 拉取镜像到服务器
- `createContainer()` - 基于镜像创建容器
- `removeImage()` - 删除镜像
- `exportImage()` - 导出镜像到文件
- `importImage()` - 从文件导入镜像
- `syncImagesFromServers()` - 从服务器同步镜像

#### WebSocket推送

所有异步操作都通过 `DockerCallbackService.getSocketSessionTemplate()` 推送实时进度：

```java
private void pushExportProgress(String operationId, Integer imageId, String imageName, int progress, String message) {
    Map<String, Object> data = new HashMap<>();
    data.put("operationId", operationId);
    data.put("imageId", imageId);
    data.put("imageName", imageName);
    data.put("progress", progress);
    data.put("message", message);
    dockerCallbackService.getSocketSessionTemplate()
        .sendToAll("docker_image_export_progress", data);
}
```

## 数据库设计

### SystemSoftImage 表

| 字段 | 类型 | 说明 |
|-----|------|------|
| system_soft_image_id | Integer | 主键ID |
| system_soft_id | Integer | 关联的软件ID |
| system_soft_image_server_id | Integer | 服务器ID |
| system_soft_image_server_name | String | 服务器名称 |
| system_soft_image_image_id | String | Docker镜像ID |
| system_soft_image_name | String | 镜像名称 |
| system_soft_image_tag | String | 镜像标签 |
| system_soft_image_full_name | String | 完整镜像名 |
| system_soft_image_size | Long | 镜像大小 |
| system_soft_image_status | Enum | 镜像状态 |
| create_time | DateTime | 创建时间 |
| update_time | DateTime | 更新时间 |

### SystemSoftImageStatus 枚举

- `AVAILABLE` - 可用
- `PULLING` - 拉取中
- `PULL_FAILED` - 拉取失败
- `DELETING` - 删除中
- `DELETE_FAILED` - 删除失败
- `START_FAILED` - 启动失败

## 使用流程

### 流程1：从仓库拉取镜像

1. 点击"拉取镜像"按钮
2. 选择软件和目标服务器
3. 指定镜像标签（默认latest）
4. 点击"开始拉取"
5. 右下角实时显示拉取进度
6. 拉取完成后刷新镜像列表

### 流程2：从镜像安装容器

1. 在镜像列表找到目标镜像
2. 点击"安装容器"按钮
3. 配置容器参数：
   - 设置容器名称
   - 配置端口映射
   - 设置环境变量
   - 配置数据卷
   - 选择重启策略和网络模式
4. 点击"创建容器"
5. 容器创建成功后可在容器管理中查看

### 流程3：导出镜像

1. 在镜像列表找到目标镜像
2. 点击"导出"按钮
3. 系统自动生成导出文件路径
4. 右下角实时显示导出进度
5. 导出完成后可在服务器上找到tar文件

### 流程4：导入镜像

1. 点击"导入镜像"按钮
2. 步骤1：选择目标服务器
3. 步骤2：上传镜像tar文件
4. 步骤3：配置镜像名称和标签（可选）
5. 点击"开始导入"
6. 右下角实时显示导入进度
7. 导入完成后刷新镜像列表

### 流程5：同步服务器镜像

1. 点击"同步镜像"按钮
2. 选择一个或多个服务器
3. 点击"开始同步"
4. 系统从服务器获取现有镜像列表
5. 自动保存到数据库
6. 右下角实时显示同步进度

## 分组显示说明

### 按服务器分组

```
┌─────────────────────────────────┐
│ 🖥️ 服务器A  (3个镜像)           │
├─────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐     │
│ │nginx │ │mysql │ │redis │     │
│ │latest│ │8.0   │ │7.0   │     │
│ └──────┘ └──────┘ └──────┘     │
└─────────────────────────────────┘
```

### 按镜像分组

```
┌─────────────────────────────────┐
│ 🐳 nginx:latest (2台服务器)      │
├─────────────────────────────────┤
│ ┌────────┐ ┌────────┐           │
│ │服务器A │ │服务器B │           │
│ │可用    │ │可用    │           │
│ └────────┘ └────────┘           │
└─────────────────────────────────┘
```

## 注意事项

1. **权限控制**：镜像管理操作需要相应的权限
2. **存储空间**：导出镜像会占用服务器存储空间，定期清理
3. **网络要求**：拉取镜像需要服务器能访问Docker仓库
4. **资源限制**：大型镜像的导入导出可能耗时较长
5. **并发操作**：避免在同一服务器上同时进行多个镜像操作

## 故障排查

### 问题：镜像拉取失败

- 检查服务器网络连接
- 验证Docker仓库地址是否正确
- 确认镜像名称和标签是否存在
- 查看服务器Docker服务状态

### 问题：容器创建失败

- 检查端口是否已被占用
- 验证挂载路径是否存在
- 确认环境变量格式正确
- 查看镜像是否完整可用

### 问题：同步失败

- 确认服务器Docker服务正常运行
- 检查数据库连接
- 验证服务器ID是否有效
- 查看后台日志获取详细错误信息

## 未来优化

1. **镜像扫描**：集成漏洞扫描工具
2. **镜像优化**：提供镜像瘦身建议
3. **批量操作**：支持批量导出/导入
4. **镜像分析**：显示镜像层级结构
5. **版本管理**：镜像版本对比和回滚
6. **定时任务**：定时同步和清理
7. **存储管理**：显示存储使用情况

## 相关文档

- [Docker容器管理](./DOCKER_CONTAINER_MANAGEMENT.md)
- [软件仓库管理](./SOFTWARE_REGISTRY_MANAGEMENT.md)
- [Socket.IO全局服务迁移](./MIGRATION_TO_GLOBAL_SOCKET.md)

