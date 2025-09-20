# Video 项目文档

## 项目概述

Video 项目是一个基于 Vue 3 + TypeScript 的视频管理系统，提供视频搜索、管理、配置等功能。

## 技术栈

- Vue 3
- TypeScript
- Element Plus
- Socket.IO
- Vite

## 项目结构

```
src/
├── api/                 # API 接口定义
├── components/          # 公共组件
├── views/              # 页面组件
│   ├── config/         # 配置管理页面
│   ├── search/         # 搜索页面
│   └── manage/         # 视频管理页面
├── router/             # 路由配置
└── types/              # 类型定义
```

## Socket 连接使用规范

### 使用封装的 Socket 服务

项目使用统一封装的 Socket 服务，位于 `@repo/core/config/socket`。请使用封装的服务而不是直接使用 `socket.io-client`。

#### 正确使用方式：

```typescript
import { socket } from '@repo/core/config/socket';

// 初始化连接
const socketInstance = socket({
  url: 'ws://localhost:3000',
  options: {
    transports: ['websocket']
  }
});

// 连接
socketInstance.connect();

// 监听事件
socketInstance.on('message', (data) => {
  console.log('收到消息:', data);
});

// 发送消息
socketInstance.emit('sendMessage', { content: 'Hello' });

// 断开连接
socketInstance.disconnect();
```

#### 错误使用方式（已废弃）：

```typescript
// ❌ 不要直接使用 socket.io-client
import { io } from 'socket.io-client';
const socket = io('ws://localhost:3000');
```

## API 调用规范

### 使用异步回调方式

项目中所有 API 接口调用都应使用异步回调（`.then/.catch`）方式，而不是 `async/await`。

#### 正确使用方式：

```typescript
// ✅ 使用 .then/.catch
const loadData = () => {
  loading.value = true;
  
  searchVideos(request)
    .then((response) => {
      if (response.code === 1000) {
        videoList.value = response.data.records;
        totalCount.value = response.data.total;
      }
    })
    .catch((error) => {
      console.error('加载失败:', error);
      ElMessage.error('加载失败');
    })
    .finally(() => {
      loading.value = false;
    });
};
```

#### 错误使用方式（已废弃）：

```typescript
// ❌ 不要使用 async/await
const loadData = async () => {
  try {
    loading.value = true;
    const response = await searchVideos(request);
    if (response.code === 1000) {
      videoList.value = response.data.records;
    }
  } catch (error) {
    console.error('加载失败:', error);
  } finally {
    loading.value = false;
  }
};
```

### API 响应处理

- 成功响应：`.then()` 回调中默认为成功状态，可直接处理数据
- 失败响应：`.catch()` 回调中处理错误情况
- 无需额外的 `code` 判断，回调本身已区分成功/失败

## API 接口说明

### 视频搜索接口

#### 请求接口
- **接口名称**: `findOnlineResources`
- **请求方式**: GET/POST
- **接口描述**: 根据关键词搜索在线视频资源

#### 请求参数
```typescript
interface SearchParams {
  keyword: string;      // 搜索关键词（必填）
  page: number;         // 页码，从1开始（可选，默认1）
  pageSize: number;     // 每页数量（可选，默认20）
  sortBy: string;       // 排序方式（可选，默认"popularity_desc"）
}
```

#### 响应数据结构
```typescript
interface ApiResponse<T> {
  code: number;         // 响应状态码，1000表示成功
  message: string;      // 响应消息
  data: T;             // 响应数据
}

interface VideoSearchResponse {
  data: VideoItem[];    // 视频列表
  total?: number;       // 总数（可选）
}
```

#### 视频数据结构
```typescript
interface VideoItem {
  id?: string;                    // 视频ID（可选，前端会自动生成）
  videoTitle: string;             // 视频标题（必填）
  videoPopularity: number;        // 视频热度（必填）
  videoSize: string;              // 视频大小（必填）
  donwloadUrls: string;           // 下载地址（必填，单个URL）
  poster?: string;                // 海报图片URL（可选）
  duration?: string;              // 视频时长（可选，格式："HH:MM:SS"）
  description?: string;           // 视频描述（可选）
  videoType?: string;             // 视频类型/分类（可选）
  views?: number;                 // 观看次数（可选）
  rating?: number;                // 评分（可选，0-10）
  year?: number;                  // 年份（可选）
}
```

#### 重要字段说明

**`donwloadUrls` 字段**（⚠️ 重要变更）:
- **类型**: `string`
- **格式**: 单个可直接下载的URL地址
- **示例**: `"https://example.com/video.mp4"`
- **要求**: 
  - 必须是完整的、可直接访问的下载链接
  - 建议包含适当的文件扩展名（.mp4, .avi, .mkv等）
  - 链接应该支持浏览器直接下载
  - **注意**: 此字段在v1.4.0中简化为单个地址，不再支持多地址格式

**`poster` 字段**:
- **类型**: `string`（可选）
- **格式**: 图片URL地址
- **默认值**: 如果为空，前端会使用 `'/placeholder-video.jpg'` 作为占位图
- **建议尺寸**: 16:9比例，最小320x180px

**`duration` 字段**:
- **类型**: `string`（可选）
- **格式**: "HH:MM:SS" 或 "MM:SS"
- **示例**: `"01:30:45"` 或 `"05:30"`

#### 响应示例
```json
{
  "code": 1000,
  "message": "success",
  "data": [
    {
      "id": "video_001",
      "videoTitle": "精彩电影片段",
      "videoPopularity": 85,
      "videoSize": "1.2GB",
      "donwloadUrls": "https://cdn.example.com/movies/video_001.mp4",
      "poster": "https://cdn.example.com/posters/video_001.jpg",
      "duration": "02:15:30",
      "description": "这是一部精彩的电影片段...",
      "videoType": "动作片",
      "views": 12500,
      "rating": 8.5,
      "year": 2024
    }
  ]
}
```

#### 错误处理
```typescript
// API调用示例
findOnlineResources(params)
  .then((response) => {
    // 成功处理
    if (response.code === 1000) {
      videoList.value = response.data || [];
      totalCount.value = response.data?.length || 0;
    }
  })
  .catch((error) => {
    // 错误处理
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败，请稍后重试');
  });
```

### 下载功能接口说明

#### 前端下载实现
前端使用HTML5的`<a>`标签实现文件下载，无需后端下载接口：

```typescript
// 下载函数实现
const downloadFile = async (item: VideoItem) => {
  const link = document.createElement("a");
  link.href = item.donwloadUrls;  // 直接使用下载URL
  link.download = `${item.videoTitle}.${getFileExtension(item.donwloadUrls) || 'mp4'}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
```

#### 下载链接要求
- **直接可访问**: URL必须可以直接通过浏览器访问和下载
- **跨域支持**: 确保下载链接支持跨域访问（如果需要）
- **文件名**: 建议URL包含有意义的文件扩展名
- **安全性**: 使用HTTPS协议确保下载安全

## 开发指南

### 启动项目

```bash
npm install
npm run dev
```

### 构建项目

```bash
npm run build
```

### 代码规范

1. 使用 TypeScript 进行类型检查
2. 遵循 Vue 3 Composition API 规范
3. 使用 Element Plus 组件库
4. API 调用统一使用异步回调方式
5. Socket 连接使用封装的服务

## 功能特性

### 配置管理

- ✨ 视频同步配置的增删改查
- ✨ 配置状态管理（启用/禁用）
- ✨ 同步任务执行和监控
- ✨ **手动停止同步功能**：支持在同步过程中手动停止正在执行的同步任务
- ✨ 连接测试功能
- ✨ 实时状态更新（通过 Socket 连接）

#### 停止同步功能

当配置处于同步中状态时，会显示红色的"停止"按钮，点击后可以手动停止正在执行的同步任务：

- **触发条件**：配置状态为同步中（`videoSyncConfigStatus === 2`）
- **操作方式**：点击配置卡片上的红色"停止"按钮
- **确认机制**：弹出确认对话框，防止误操作
- **API 接口**：`stopSyncTask(configId)` - 停止指定配置的同步任务
- **状态更新**：停止成功后，配置状态自动恢复为启用状态

```typescript
// 停止同步示例
const handleStop = (config: VideoSyncConfig) => {
  ElMessageBox.confirm(`确定要停止配置 "${config.videoSyncConfigName}" 的同步任务吗？`, "确认停止", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      stopSyncTask(config.videoSyncConfigId!)
        .then(() => {
          ElMessage.success("同步任务已停止");
          config.videoSyncConfigStatus = 1; // 恢复为启用状态
        })
        .catch((error) => {
          ElMessage.error("停止同步任务失败");
        });
    });
};
```

## 更新日志

### v1.4.0 (2025-01-20)

- ✨ **下载功能优化**
  - 🔄 简化下载逻辑，使用浏览器原生下载功能
  - 🔗 采用 HTML5 `<a>` 标签的 download 属性实现文件下载
  - 📋 调整数据结构：`donwloadUrls` 现在只包含单个下载地址
  - ⚡ 移除复杂的下载进度模拟，提升下载响应速度
  - 🛠️ 重构 `downloadFile` 函数，删除多地址下载支持
  - 🎯 优化用户体验，下载操作更加直观和可靠

#### 下载功能技术说明

**新的下载实现方式：**

```typescript
// 简化的下载函数
const downloadFile = async (item: VideoItem) => {
  const taskId = `${item.id}_0`;
  
  try {
    downloadingItems.value.push(taskId);
    
    // 使用 a 标签调用浏览器下载功能
    const link = document.createElement("a");
    link.href = item.donwloadUrls;
    link.download = `${item.videoTitle}.${getFileExtension(item.donwloadUrls) || 'mp4'}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    
    // 添加到 DOM 并触发点击
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElNotification({
      title: "开始下载",
      message: `${item.videoTitle} 开始下载`,
      type: "success",
    });
  } catch (error) {
    ElMessage.error("下载失败: " + error);
  } finally {
    // 延迟移除下载状态
    setTimeout(() => {
      const index = downloadingItems.value.indexOf(taskId);
      if (index > -1) {
        downloadingItems.value.splice(index, 1);
      }
    }, 1000);
  }
};
```

**数据结构变更：**

```typescript
// 之前：支持多个下载地址
interface VideoItem {
  donwloadUrls: string; // 多个URL，需要解析
}

// 现在：单个下载地址
interface VideoItem {
  donwloadUrls: string; // 单个URL，直接使用
}
```

**模板调用简化：**

```vue
<!-- 之前：复杂的多地址下载 -->
<el-button 
  v-for="(url, urlIndex) in parseDownloadUrls(row.donwloadUrls)" 
  @click="downloadFile(row, url, urlIndex)"
>
  {{ url.quality || `链接${urlIndex + 1}` }}
</el-button>

<!-- 现在：简单的单地址下载 -->
<el-button 
  v-if="row.donwloadUrls"
  @click="downloadFile(row)"
>
  <IconifyIconOnline icon="ep:download" />
  下载
</el-button>
```

**优势：**
- 🚀 **性能提升**：移除了复杂的URL解析和进度模拟逻辑
- 🎯 **用户体验**：直接调用浏览器下载，更加可靠
- 🔧 **维护性**：代码结构更简单，易于维护
- 🛡️ **兼容性**：支持所有现代浏览器的原生下载功能
- 📱 **跨平台**：在桌面和移动设备上都有良好表现

### v1.3.0 (2025-01-14)

- ✨ **视频搜索结果页面全面美化升级**
  - 🎨 采用现代化玻璃拟态设计，增加背景模糊和渐变色效果
  - 🔄 使用 ScTable 组件统一渲染，支持表格、列表、网格三种视图模式
  - 🖼️ 优化视频海报展示，添加悬浮播放按钮和持续时间显示
  - 🏷️ 美化标签样式，使用 IconifyIconOnline 图标增强视觉效果
  - 📱 改进响应式设计，更好适配移动设备
  - ⚡ 优化动画效果，添加渐入动画和悬浮变换
  - 🎯 统一操作按钮设计，提升用户交互体验

#### 视图模式说明

1. **表格视图（table）**：传统表格布局，适合详细信息展示
2. **列表视图（list）**：卡片式列表，信息展示完整
3. **网格视图（grid）**：网格卡片布局，适合浏览大量内容

#### 技术改进

- 🔧 全面使用 IconifyIconOnline 替代 Element Plus 图标
- 📊 集成 ScTable 组件，提升表格性能和功能
- 🎨 添加玻璃拟态样式和现代化渐变色背景
- ⚡ 优化 CSS 动画和过渡效果
- 📱 完善响应式断点设计

### v1.2.0 (2024-12-19)

- ✨ 新增手动停止同步功能
- ✨ 在配置卡片中添加停止按钮（仅在同步中状态显示）
- 🔧 完善 API 接口，新增 `stopSyncTask` 方法
- 📝 更新文档，添加停止功能使用说明

### v1.1.0 (2024-12-19)

- 🔧 重构 Socket 连接，使用统一封装的服务
- 🔧 重构 API 调用方式，统一使用异步回调
- 📝 完善项目文档和使用规范
- ✨ 优化错误处理和用户体验

### v1.0.0

- 🎉 初始版本发布
- ✨ 实现视频搜索功能
- ✨ 实现视频管理功能
- ✨ 实现配置管理功能