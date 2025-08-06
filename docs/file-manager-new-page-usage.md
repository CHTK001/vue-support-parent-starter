# 文件管理器新页面功能使用说明

## 概述

本功能允许在新页面中打开文件管理器，并通过URL参数传递 `serverId`，实现独立的文件管理界面。

## 路由配置

在 `src/router/modules/remaining.ts` 中已添加以下路由配置：

```typescript
{
  path: "/file-manager/:serverId",
  name: "fileManager",
  component: () =>
    import("@/views/server/modules/file-management/FileManagerRoute.vue"),
  meta: {
    icon: "ri:folder-line",
    title: "文件管理器",
    showLink: false,
  },
}
```

## 组件结构

### 1. FileManagerRoute.vue
- **路径**: `src/views/server/modules/file-management/FileManagerRoute.vue`
- **功能**: 路由包装组件，负责从路由参数获取 `serverId` 并传递给 `FileManagerPage`
- **特性**:
  - 自动从路由参数解析 `serverId`
  - 加载服务器信息
  - 错误处理和用户友好的错误提示

### 2. FileManagerPage.vue
- **路径**: `src/views/server/modules/file-management/FileManagerPage.vue`
- **功能**: 实际的文件管理器界面
- **特性**:
  - 接收 `serverId` 作为 prop
  - 完整的文件管理功能（浏览、上传、下载、编辑等）

## 使用方法

### 1. 在服务器管理页面中使用

在 `src/views/server/modules/server-management/management.vue` 中已添加了 `handleFileManagerNewPage` 函数：

```typescript
/**
 * 在新页面中打开文件管理器
 */
const handleFileManagerNewPage = (server: any) => {
  if (!server?.monitorSysGenServerId) {
    ElMessage.warning("服务器ID无效");
    return;
  }
  
  // 检查文件管理功能是否启用
  const fileManagementMode = server.fileManagementMode || server.monitorSysGenServerFileManagementMode;
  if (!fileManagementMode || fileManagementMode === "NONE") {
    ElMessage.warning("该服务器未启用文件管理功能");
    return;
  }
  
  // 在新页面中打开文件管理器
  const routeData = router.resolve({
    name: "fileManager",
    params: {
      serverId: String(server.monitorSysGenServerId)
    }
  });
  
  window.open(routeData.href, "_blank");
};
```

### 2. 在模板中使用

```vue
<template>
  <el-button 
    @click="handleFileManagerNewPage(server)"
    :disabled="!canOpenFileManager(server)"
    type="primary"
  >
    <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
    文件管理（新页面）
  </el-button>
</template>
```

### 3. 使用工具函数

可以使用 `src/utils/file-manager-navigation.ts` 中的工具函数：

```typescript
import { openFileManagerInNewPage, canOpenFileManager } from "@/utils/file-manager-navigation";

// 在新页面中打开文件管理器
const handleOpenFileManager = (server) => {
  if (canOpenFileManager(server)) {
    openFileManagerInNewPage(server.monitorSysGenServerId);
  } else {
    ElMessage.warning("该服务器未启用文件管理功能");
  }
};
```

## URL 格式

新页面的URL格式为：
```
/file-manager/{serverId}
```

例如：
- `/file-manager/1` - 打开服务器ID为1的文件管理器
- `/file-manager/123` - 打开服务器ID为123的文件管理器

## 功能特性

### 1. 参数验证
- 自动验证 `serverId` 参数的有效性
- 检查服务器是否存在
- 验证文件管理功能是否启用

### 2. 错误处理
- 无效参数时显示友好的错误页面
- 服务器不存在时的错误提示
- 网络错误的处理

### 3. 用户体验
- 全屏文件管理界面
- 独立的浏览器标签页
- 支持浏览器前进/后退按钮

## 注意事项

1. **权限检查**: 确保用户有访问指定服务器文件管理功能的权限
2. **服务器状态**: 建议在打开前检查服务器的在线状态
3. **文件管理模式**: 只有启用了文件管理功能的服务器才能打开文件管理器
4. **浏览器兼容性**: 使用 `window.open()` 打开新页面，需要考虑浏览器的弹窗拦截

## 扩展功能

可以通过URL参数传递更多信息：

```typescript
// 未来可以扩展支持初始路径等参数
const routeData = router.resolve({
  name: "fileManager",
  params: {
    serverId: String(server.monitorSysGenServerId)
  },
  query: {
    initialPath: "/var/log",  // 初始路径
    mode: "readonly"          // 只读模式
  }
});
```

## 相关文件

- `src/router/modules/remaining.ts` - 路由配置
- `src/views/server/modules/file-management/FileManagerRoute.vue` - 路由包装组件
- `src/views/server/modules/file-management/FileManagerPage.vue` - 文件管理器主组件
- `src/utils/file-manager-navigation.ts` - 导航工具函数
- `src/views/server/modules/server-management/management.vue` - 服务器管理页面（使用示例）
