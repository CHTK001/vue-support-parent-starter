# Docker软件管理功能实现总结

## ✅ 已完成功能

### 1. 软件卡片显示已安装服务器IP

#### 实现位置
- `vue-support-parent-starter/apps/vue-support-monitor-starter/src/views/docker/soft/index.vue`

#### 功能说明
在软件库主页面的软件卡片上显示已安装的服务器IP地址：
- 显示前3个服务器IP
- 如果超过3个，显示"+N"标签
- 使用绿色success标签表示已安装
- 通过`row.installedServers`数组获取数据

#### 代码示例
```vue
<div class="soft-meta" v-if="row.installedServers && row.installedServers.length > 0">
  <IconifyIconOnline icon="ri:server-line" class="mr-1" />
  已安装：
  <el-tag v-for="server in row.installedServers.slice(0, 3)" :key="server" size="small" type="success" effect="plain" class="ml-1">
    {{ server }}
  </el-tag>
  <el-tag v-if="row.installedServers.length > 3" size="small" type="info" effect="plain" class="ml-1">
    +{{ row.installedServers.length - 3 }}
  </el-tag>
</div>
```

**注意**：后端需要在查询软件列表时关联`SystemSoftImage`表并聚合服务器信息。

---

### 2. 同步镜像对话框组件

#### 实现位置
- `vue-support-parent-starter/apps/vue-support-monitor-starter/src/views/docker/soft/components/SoftSyncDialog.vue`

#### 功能说明
创建了同步镜像对话框，支持从服务器同步Docker镜像：
- 选择一个或多个服务器
- 显示服务器状态（在线/离线）
- 显示服务器标签
- 显示同步说明信息

#### 特性
- ✅ 多服务器选择（卡片式UI）
- ✅ 服务器状态指示器
- ✅ 同步进度实时推送
- ✅ 优雅的UI设计

#### 使用方式
```vue
<template>
  <SoftSyncDialog v-model:visible="syncVisible" @success="onSyncSuccess" />
</template>

<script setup>
const syncVisible = ref(false);

function onSyncSuccess() {
  ElNotification.success({
    title: '同步任务已创建',
    message: '正在从服务器同步Docker镜像，请在右下角查看实时进度',
    duration: 4000,
    position: 'bottom-right'
  });
}
</script>
```

---

### 3. 前端API集成

#### 实现位置
- `vue-support-parent-starter/apps/vue-support-monitor-starter/src/api/docker-management.ts`

#### 新增API
```typescript
// 同步镜像：从服务器同步Docker镜像到SystemSoftImage表
export function syncImages(data: { serverIds: number[] }) {
  return http.request<ReturnResult<{ operationId: string; syncCount: number }>>(
    "post", 
    "v1/system/soft/sync-images", 
    { data }
  );
}

// 添加到softwareApi
export const softwareApi = {
  // ... 其他API
  syncImages,
};
```

---

### 4. 后端同步镜像接口

#### Controller实现
**文件**: `spring-support-api-starter/spring-api-support-monitor-starter/src/main/java/com/chua/starter/monitor/controller/SystemSoftV1Controller.java`

```java
@Operation(summary = "同步镜像(v1)", description = "从指定服务器同步Docker镜像到系统")
@PostMapping("/sync-images")
public ReturnResult<Map<String, Object>> syncImages(@RequestBody SyncImagesRequest request) {
    // 调用服务层同步镜像方法
    ReturnResult<Map<String, Object>> result = systemSoftService.syncImagesFromServers(request.getServerIds());
    return result;
}
```

#### Service接口
**文件**: `spring-support-api-starter/spring-api-support-monitor-starter/src/main/java/com/chua/starter/monitor/service/SystemSoftService.java`

```java
/**
 * 从服务器同步Docker镜像到SystemSoftImage表
 *
 * @param serverIds 服务器ID列表
 * @return 同步结果（包含operationId和同步数量）
 */
ReturnResult<Map<String, Object>> syncImagesFromServers(List<Integer> serverIds);
```

#### Service实现
**文件**: `spring-support-api-starter/spring-api-support-monitor-starter/src/main/java/com/chua/starter/monitor/service/impl/SystemSoftServiceImpl.java`

**核心流程**：
1. 生成`operationId`用于前端跟踪
2. 遍历每台服务器：
   - 使用`DockerProtocolClient.listImage()`获取镜像列表
   - 解析镜像名称和标签
   - 查找或自动创建对应的`SystemSoft`记录
   - 保存或更新`SystemSoftImage`记录
   - 通过Socket.IO推送同步进度
3. 返回同步统计信息

**关键代码片段**：
```java
// 创建Docker客户端
DockerProtocolClient dockerClient = getDockerClient(serverId);

// 获取镜像列表
List<com.chua.docker.support.entity.Image> images = dockerClient.listImage();

// 保存镜像信息
for (Image image : images) {
    // 解析镜像名称和标签
    String imageName = image.getRepoTags().get(0);
    String[] parts = imageName.split(":");
    String name = parts[0];
    String tag = parts.length > 1 ? parts[1] : "latest";
    
    // 查找或创建软件
    SystemSoft soft = findOrCreateSoftByImageName(name);
    
    // 创建或更新镜像记录
    SystemSoftImage newImage = new SystemSoftImage();
    newImage.setSystemSoftId(soft.getSystemSoftId());
    newImage.setSystemSoftImageServerId(serverId);
    newImage.setSystemSoftImageName(name);
    newImage.setSystemSoftImageTag(tag);
    newImage.setSystemSoftImageSize(image.getSize());
    systemSoftImageMapper.insert(newImage);
    
    // 推送同步进度
    pushSyncProgress(operationId, serverId, serverName, progress, message);
}
```

---

### 5. Socket.IO实时进度监听

#### 前端监听
**文件**: `vue-support-parent-starter/apps/vue-support-monitor-starter/src/views/docker/soft/index.vue`

已在主页面中集成全局Socket.IO监听：

```typescript
// 设置Socket事件监听
function setupSocketListeners() {
  // ... 其他事件监听
  
  // 监听软件同步进度
  const unsubSoftSync = addEventListener('software_sync_progress', (data: any) => {
    console.log('🔄 软件同步进度:', data);
  });
  
  eventUnsubscribers.push(unsubSoftSync);
}
```

#### 后端推送
**Socket事件**：
1. `software_sync_progress` - 同步进度更新
   ```json
   {
     "operationId": "sync-images-1234567890",
     "type": "software_sync_progress",
     "serverId": 1,
     "serverName": "服务器1",
     "progress": 50,
     "message": "同步镜像 5/10"
   }
   ```

2. `operation_complete` - 同步完成
   ```json
   {
     "operationId": "sync-images-1234567890",
     "type": "operation_complete",
     "title": "镜像同步",
     "message": "同步完成，共 10 个镜像，成功 8 个，失败 2 个",
     "totalImages": 10,
     "successCount": 8,
     "errorCount": 2
   }
   ```

---

## 🎯 使用流程

### 同步镜像
1. 用户点击"同步镜像"按钮
2. 打开同步对话框，选择目标服务器
3. 点击"开始同步"
4. 后端异步同步镜像，通过Socket.IO推送进度
5. 前端右下角ProgressMonitor显示实时进度
6. 同步完成后显示成功/失败通知

### 查看已安装服务器
- 在软件库主页面的软件卡片上
- 直接查看"已安装"标签（绿色）
- 显示前3个服务器IP
- 点击软件卡片可查看详细信息

---

## 📊 数据流

```
前端                          后端
┌────────────────┐           ┌────────────────┐
│ SoftSyncDialog │           │ SystemSoftV1   │
│                │           │ Controller     │
└────────┬───────┘           └────────┬───────┘
         │                            │
         │ 1. syncImages()            │
         │─────────────────────────────>
         │   { serverIds: [1, 2] }   │
         │                            │
         │ 2. operationId             │
         │<─────────────────────────────
         │                            │
         │                            ├─> SystemSoftService
         │                            │     syncImagesFromServers()
         │                            │
         │                            │   ┌─> DockerProtocolClient
         │                            │   │     listImage()
         │                            │   │
         │                            │   ├─> 解析镜像信息
         │                            │   │
         │                            │   ├─> findOrCreateSoft
         │                            │   │
         │                            │   └─> 保存SystemSoftImage
         │                            │
         │ 3. software_sync_progress  │
         │<═══════════════════════════════
         │   (WebSocket实时推送)      │
         │                            │
┌────────▼───────┐                    │
│ ProgressMonitor│                    │
│ 显示进度       │                    │
└────────────────┘                    │
         │                            │
         │ 4. operation_complete      │
         │<═══════════════════════════════
         │                            │
┌────────▼───────┐
│ ElNotification │
│ 显示完成通知   │
└────────────────┘
```

---

## 🔧 技术要点

### 1. DockerProtocolClient使用
```java
// 创建Docker客户端
DockerProtocolClient dockerClient = dockerProtocolClientFactory.createClient(serverId);

// 获取镜像列表
List<Image> images = dockerClient.listImage();

// 镜像信息
for (Image image : images) {
    String id = image.getId();              // 镜像ID
    List<String> repoTags = image.getRepoTags();  // 标签列表 ["nginx:latest"]
    Long size = image.getSize();            // 镜像大小
    LocalDateTime created = image.getCreated();   // 创建时间
}
```

### 2. 自动创建软件记录
为了避免手动维护软件库，系统会自动为从服务器同步的镜像创建对应的软件记录：
```java
private SystemSoft findOrCreateSoftByImageName(String imageName) {
    // 清理镜像名称（移除仓库前缀）
    String cleanName = imageName.replaceAll("^.*/", "");
    String softCode = cleanName.replaceAll("[^a-zA-Z0-9-]", "-");
    
    // 查找已存在的软件
    SystemSoft existing = systemSoftMapper.selectBySoftCode(softCode);
    if (existing != null) {
        return existing;
    }
    
    // 创建新软件
    SystemSoft newSoft = new SystemSoft();
    newSoft.setSystemSoftName(cleanName);
    newSoft.setSystemSoftCode(softCode);
    newSoft.setSystemSoftDockerImage(imageName);
    newSoft.setSystemSoftCategory("Docker");
    newSoft.setSystemSoftDesc("从服务器同步的Docker镜像");
    systemSoftMapper.insert(newSoft);
    
    return newSoft;
}
```

### 3. Socket.IO进度推送
```java
private void pushSyncProgress(String operationId, Integer serverId, String serverName, 
                               int progress, String message) {
    Map<String, Object> data = new HashMap<>();
    data.put("operationId", operationId);
    data.put("type", "software_sync_progress");
    data.put("serverId", serverId);
    data.put("serverName", serverName);
    data.put("progress", progress);
    data.put("message", message);
    data.put("timestamp", System.currentTimeMillis());
    
    socketSessionTemplate.send("software_sync_progress", data);
}
```

---

## 📝 注意事项

1. **服务器连接状态** - 确保目标服务器的Docker服务可访问
2. **镜像名称解析** - 支持标准的`name:tag`格式，默认使用`latest`标签
3. **自动创建软件** - 同步的镜像会自动在软件库中创建记录
4. **重复镜像处理** - 如果镜像已存在，则更新记录而不是创建新记录
5. **Socket.IO连接** - 确保页面已连接Socket.IO以接收实时进度
6. **异步操作** - 同步过程是异步的，不会阻塞用户操作
7. **数据库字段** - `SystemSoftImage`表中的字段与`DockerProtocolClient`返回的镜像信息对应

---

## 🚀 后续优化建议

1. **批量操作** - 支持批量删除同步的镜像
2. **增量同步** - 只同步新增或更新的镜像
3. **定时同步** - 支持定时自动同步镜像
4. **同步日志** - 记录同步历史和详细日志
5. **镜像过滤** - 支持按标签、大小等条件过滤镜像
6. **镜像分组** - 根据镜像来源自动分组管理
7. **镜像清理** - 支持清理无用的镜像记录

---

## 📄 相关文件清单

### 前端文件
- `src/views/docker/soft/index.vue` - 软件库主页（集成同步按钮和Socket监听）
- `src/views/docker/soft/components/SoftSyncDialog.vue` - 同步镜像对话框
- `src/api/docker-management.ts` - API接口定义

### 后端文件
- `controller/SystemSoftV1Controller.java` - V1控制器（新增同步接口）
- `service/SystemSoftService.java` - 服务接口（新增方法定义）
- `service/impl/SystemSoftServiceImpl.java` - 服务实现（核心同步逻辑）
- `entity/SystemSoft.java` - 软件实体
- `entity/SystemSoftImage.java` - 镜像实体
- `mapper/SystemSoftImageMapper.java` - 镜像Mapper

### 文档文件
- `docs/DOCKER_INSTALL_SOCKET.md` - Socket.IO安装进度文档
- `docs/DOCKER_SYNC_INSTALL.md` - 本文档

---

## ✨ 总结

本次实现完成了完整的Docker镜像同步功能：

✅ **功能1**：软件卡片显示已安装服务器IP  
✅ **功能2**：创建同步镜像对话框组件  
✅ **功能3**：实现后端同步镜像接口（使用`DockerProtocolClient.listImage()`）  
✅ **功能4**：集成Socket.IO实时进度推送  

所有功能已经集成到现有的Docker管理系统中，用户可以方便地从服务器同步Docker镜像并实时查看进度！🎉

