# Vue Support Parent Starter

一个基于 Vue 3 + Element Plus 的 AI 功能集成平台，提供多种人工智能服务的前端界面。

## 功能特性

### 🎯 核心功能
- **AI人脸检测模块**: 智能人脸检测与标注
  - **功能**: 检测图片中的人脸位置和关键点
  - **接口**:
    - `POST /api/ai/face/detection` - 人脸检测（同步）
    - `POST /api/ai/face/feature` - 人脸特征提取
    - `POST /api/ai/face/recognizer` - 人脸识别
    - `POST /api/ai/face/compare` - 人脸对比
  - **特性**:
    - 全屏图片上传区域
    - 实时人脸检测与标注
    - 原图与检测结果对比显示
    - 支持多种检测模型选择

- **配置组管理模块**: 系统配置分组管理
  - **功能**: 管理和组织系统各种配置项
  - **接口**:
    - `GET /v2/setting/group/list` - 获取配置组列表
    - `POST /v2/setting/group/saveOrUpdate` - 新增/更新配置组
    - `POST /v2/setting/group/delete` - 删除配置组
  - **特性**:
    - 动态配置组管理
    - 图标和状态管理
    - 实时配置更新
    - 配置组启用/禁用控制
    - **系统固定配置**: 作为核心功能始终显示，不受远程配置影响

### AI 功能模块

#### 1. 图像上色 (Image Colorization)
- **路径**: `/ai/colorization`
- **功能**: 将黑白图片转换为彩色图片
- **接口**: 
  - `POST /api/ai/colorization/save` - 提交上色任务
  - `GET /api/ai/colorization/get` - 查询任务状态
- **特性**:
  - 支持多种上色模型选择
  - 实时任务进度显示
  - 左右对比展示效果
  - 支持结果图片下载

#### 2. 人脸检测 (Face Detection) 🆕
- **路径**: `/ai/face/detect`
- **功能**: 检测图片中的人脸位置和关键点
- **接口**:
  - `POST /api/ai/face/detection` - 人脸检测（同步）
  - `POST /api/ai/face/feature` - 人脸特征提取
  - `POST /api/ai/face/recognizer` - 人脸识别
  - `POST /api/ai/face/compare` - 人脸对比
- **特性**:
  - 全屏图片上传区域
  - 自动人脸边界框绘制
  - 关键点标注显示
  - 检测结果统计信息
  - 原图与检测结果对比展示
  - 支持检测结果图片下载
- **检测结果格式**:
  ```json
  {
    "faces": [
      {
        "bbox": {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 250
        },
        "landmarks": [
          {"x": 120, "y": 180},
          {"x": 180, "y": 180}
        ]
      }
    ]
  }
  ```

### WebRTC 实时通信模块

#### 1. 房间管理
- **路径**: `/webrtc/room`
- **功能**: WebRTC 房间的创建、管理和监控
- **特性**:
  - 房间列表展示
  - 创建/加入房间
  - 房间状态监控
  - 用户管理

#### 2. 视频通话
- **路径**: `/webrtc/video-call`
- **功能**: 一对一视频通话
- **特性**:
  - 实时音视频通话
  - 摄像头/麦克风控制
  - 通话质量监控

#### 3. 视频会议
- **路径**: `/webrtc/video-conference`
- **功能**: 多人视频会议
- **特性**:
  - 多人同时通话
  - 屏幕共享
  - 会议控制面板

#### 4. 房间统计
- **路径**: `/webrtc/statistics`
- **功能**: 房间使用情况统计
- **特性**:
  - 实时数据监控
  - 历史数据分析
  - 性能指标展示

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Element Plus
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **实时通信**: Socket.IO Client
- **WebRTC**: 原生 WebRTC API
- **样式**: SCSS

## 项目结构

```
vue-support-parent-starter/
├── pages/project/src/
│   ├── views/ai/                    # AI 功能页面
│   │   ├── colorization/           # 图像上色
│   │   │   └── index.vue
│   │   ├── face/                   # 人脸相关功能
│   │   │   └── detect/             # 人脸检测
│   │   │       └── index.vue
│   │   └── generation/             # 图像生成
│   ├── views/webrtc/               # WebRTC 功能页面
│   │   ├── room/                   # 房间管理
│   │   ├── video-call/             # 视频通话
│   │   ├── video-conference/       # 视频会议
│   │   └── statistics/             # 统计页面
│   ├── api/ai/                     # AI 相关接口
│   │   ├── face.ts                 # 人脸检测接口
│   │   └── image-colorization.ts   # 图像上色接口
│   ├── api/webrtc/                 # WebRTC 相关接口
│   └── components/                 # 公共组件
│       ├── ScCompare/              # 图片对比组件
│       └── ScLoading/              # 加载组件
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## API 接口说明

### 人脸检测接口

#### 人脸检测 API

```typescript
// 人脸检测（同步接口）
fetchFaceDetection(params: FaceRequest, file: File)

// 人脸特征提取
fetchFaceFeature(params: FaceRequest, file: File)

// 人脸识别
fetchFaceRecognizer(params: FaceRequest, file: File)

// 人脸对比
fetchFaceCompare(params: FaceRequest, file: File, file2: File)

// 请求参数接口
interface FaceRequest {
  requestId: string;  // 请求ID
  model: string;      // 模型名称
  provider: string;   // 服务提供商
}

// 检测结果接口
interface FaceDetectionResult {
  faces: Array<{
    bbox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks?: Array<{
      x: number;
      y: number;
    }>;
    confidence?: number;
  }>;
}
```

## 组件使用说明

### ScCompare 图片对比组件

用于展示原图与处理结果的对比效果。

```vue
<ScCompare 
  left-image-label="原图" 
  :left-image="originalImage" 
  :right-image="processedImage" 
  right-image-label="处理结果" 
  transition="fade"
/>
```

**Props:**
- `left-image`: 左侧图片 URL
- `right-image`: 右侧图片 URL  
- `left-image-label`: 左侧图片标签
- `right-image-label`: 右侧图片标签
- `transition`: 过渡动画效果

### ScLoading 加载组件

用于显示任务处理进度。

```vue
<ScLoading 
  ref="scLoadingRef" 
  v-model="loadingConfig.export" 
  transition="fade"
/>
```

## 开发规范

### 代码规范

1. **Java 代码**:
   - 遵循阿里巴巴 Java 开发手册
   - 使用 Lombok 简化代码
   - 添加完整的方法注释
   - 重要代码添加日志记录

2. **前端代码**:
   - 使用 Vue 3 Composition API
   - 组件命名采用 PascalCase
   - 方法命名采用 camelCase
   - 添加 TypeScript 类型定义

### 提交规范

- feat: 新功能
- fix: 修复问题
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具的变动

## 更新日志

### v1.1.0 (2024-01-15)

#### 新增功能
- ✨ 新增人脸检测功能模块
- ✨ 实现全屏图片上传界面
- ✨ 支持人脸边界框和关键点绘制
- ✨ 添加检测结果统计信息显示
- ✨ 集成 ScCompare 组件进行结果对比
- ✨ 支持检测结果图片下载

#### 接口更新
- 🔧 新增 `/api/ai/face/detection` 人脸检测同步接口
- 🔧 新增 `/api/ai/face/feature` 人脸特征提取接口
- 🔧 新增 `/api/ai/face/recognizer` 人脸识别接口
- 🔧 新增 `/api/ai/face/compare` 人脸对比接口

#### 技术改进
- 🎨 优化图片上传和处理流程
- 🎨 改进接口为同步调用，提升用户体验
- 🎨 增强错误处理和用户提示
- 🎨 新增多种人脸相关功能支持

### v1.0.0 (2024-01-01)

#### 基础功能
- ✨ 实现图像上色功能
- ✨ 集成 WebRTC 实时通信模块
- ✨ 建立基础项目架构

## 许可证

MIT License

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 联系方式

- 作者: [CH]
- 邮箱: [your-email@example.com]
- 项目地址: [https://github.com/your-username/vue-support-parent-starter]