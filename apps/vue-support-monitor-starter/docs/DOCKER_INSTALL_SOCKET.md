# Docker软件安装Socket.IO实时进度

## 📋 架构说明

### 设计原则
- **全局监听** - 在`soft/index.vue`主页面统一管理Socket事件监听
- **组件分离** - `SoftInstallDialog.vue`只负责UI交互，不处理Socket
- **持久连接** - 监听器在页面整个生命周期保持活跃
- **即使关闭对话框** - 也能继续接收安装进度通知

## 🎯 实现位置

### 1. soft/index.vue（主页面）
**职责：全局Socket事件监听和通知展示**

```typescript
// 在页面加载时设置Socket监听
onMounted(() => { 
  enableAutoConnect(); 
  connectSocket().catch(() => { });
  setupSocketListeners();  // ⭐ 核心：设置全局监听
});

// 监听的事件
function setupSocketListeners() {
  // 📦 Docker镜像拉取进度
  addEventListener('docker_image_pull_progress', (data) => { ... });
  
  // ⚙️ 操作进度更新
  addEventListener('progress_update', (operation) => { ... });
  
  // ✅ 操作完成
  addEventListener('operation_complete', (operation) => {
    ElNotification.success({ ... });
  });
  
  // ❌ 操作错误
  addEventListener('operation_error', (operation) => {
    ElNotification.error({ ... });
  });
  
  // 🐳 容器状态变化
  addEventListener('docker_container_status', (data) => { ... });
  
  // 🔄 软件同步进度
  addEventListener('software_sync_progress', (data) => { ... });
}
```

### 2. SoftInstallDialog.vue（安装对话框）
**职责：收集用户输入，调用安装接口**

```typescript
async function submit() {
  const payload = {
    softId: props.soft?.systemSoftId,
    serverIds: selectedServerIds.value,
    imageTag: 'latest'
  };
  
  const result = await softwareApi.installSoftware(payload);
  
  if (result.code === '00000') {
    emit('success');  // ⭐ 通知父组件
    visibleProxy.value = false;
  }
}
```

## 🔄 数据流

```
用户操作
  │
  ├─► SoftInstallDialog.vue
  │     └─► softwareApi.installSoftware()
  │           └─► 后端创建安装任务
  │                 │
  │                 ├─► 返回 operationId
  │                 │
  │                 └─► 异步拉取Docker镜像
  │                       │
  │                       └─► WebSocket推送进度
  │
  └─► soft/index.vue（监听Socket事件）
        ├─► docker_image_pull_progress → 控制台日志
        ├─► progress_update → 控制台日志
        ├─► operation_complete → ✅ 成功通知
        └─► operation_error → ❌ 失败通知
```

## 📡 Socket事件类型

| 事件名称 | 触发时机 | 处理方式 |
|---------|---------|---------|
| `docker_image_pull_progress` | Docker镜像拉取进度更新 | 控制台日志 + ProgressMonitor显示 |
| `progress_update` | 操作进度更新 | 控制台日志 + ProgressMonitor更新 |
| `operation_complete` | 操作成功完成 | ElNotification成功通知 |
| `operation_error` | 操作失败 | ElNotification错误通知 |
| `docker_container_status` | 容器状态变化 | 控制台日志 |
| `software_sync_progress` | 软件同步进度 | 控制台日志 |

## 🎨 用户体验

### 操作流程
1. 用户点击"安装"按钮 → 打开`SoftInstallDialog`
2. 选择目标服务器 → 点击"开始安装"
3. 对话框关闭 → 显示"安装任务已创建"通知
4. 右下角悬浮球显示进度 → 点击查看详情
5. 安装完成 → 弹出成功/失败通知

### 进度展示
- **悬浮球（ProgressMonitor）**：右下角绿色旋转图标 + 数量徽章
- **迷你进度条**：页面顶部显示最多3个活跃任务
- **进度抽屉**：点击悬浮球展开详细进度列表
- **通知**：安装成功/失败时弹出右下角通知

## ✅ 核心优势

1. **全局统一管理** - 所有Socket事件在主页面统一处理
2. **不受对话框影响** - 关闭对话框后仍能接收进度通知
3. **资源自动管理** - 页面卸载时自动清理监听器
4. **多任务并行** - 支持同时安装到多台服务器
5. **实时反馈** - 通过ProgressMonitor实时展示进度

## 🛠️ 技术要点

### 监听器清理
```typescript
// 组件卸载时必须清理，防止内存泄漏
onUnmounted(() => {
  cleanupSocketListeners();
});
```

### 事件过滤
```typescript
// 只处理特定类型的操作
if (operation.type === 'pull_image' || operation.type === 'install_software') {
  // 处理安装相关事件
}
```

### 通知位置
```typescript
// 统一使用右下角通知
ElNotification.success({
  title: '安装成功',
  message: '...',
  position: 'bottom-right'  // ⭐ 固定位置
});
```

## 📝 注意事项

1. **Socket连接状态** - 确保页面加载时Socket成功连接
2. **事件类型匹配** - 前端事件名称需与后端推送的事件名称一致
3. **operationId追踪** - 后端返回的operationId用于关联进度事件
4. **多服务器安装** - 每台服务器创建独立的operationId
5. **控制台日志** - 使用emoji标识不同类型的事件（📦 ⚙️ ✅ ❌ 🐳 🔄）

## 🔍 调试方法

### 检查Socket连接
```javascript
// 浏览器控制台
import { socketState } from '@/utils/socket';
console.log('Socket状态:', socketState.connected);
```

### 查看活跃操作
```javascript
import { progressState } from '@/utils/socket';
console.log('活跃操作:', progressState.activeOperations);
```

### 控制台日志
安装过程中会输出：
- `📦 镜像拉取进度:` - 拉取进度数据
- `⚙️ 安装进度更新:` - 操作进度更新
- `✅ 操作完成:` - 成功完成信息
- `❌ 操作失败:` - 失败错误信息

## 🚀 后续扩展

如需在其他页面监听Docker事件，参考以下模式：

```typescript
// 在任何组件中监听
import { addEventListener } from '@/utils/socket';

const unsubscribe = addEventListener('docker_image_pull_progress', (data) => {
  // 处理事件
});

// 组件卸载时清理
onUnmounted(() => {
  unsubscribe();
});
```

