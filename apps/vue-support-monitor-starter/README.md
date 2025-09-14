# Vue Support Monitor Starter

## 项目概述

Vue Support Monitor Starter 是一个基于 Vue 3 + TypeScript + Element Plus 的监控管理系统前端应用。

### 数据管理控制台更新（2025-08-18）

- Redis 控制台对齐 JDBC 控制台：
  - 左侧统一为树结构，复用 /root、/children、/node 接口
  - 右侧按 Key 类型自动渲染不同视图（string/hash/list/set/zset）
  - 支持分栏拖拽与刷新当前值
- 修改文件：src/views/data-management/console/RedisConsole.vue

- 数据管理设置编辑页：
  - 控制台类型改为“启用控制台”开关（关闭时提交空 consoleType）
  - 远程模式（REMOTE）下增加必填校验：Server 或 Host+Port 二选一
  - 后端新增接口：POST /system/data/setting/save

## 最新更新

### 软件管理模块组件化重构（2025-01-10）

对软件管理模块进行了全面的组件化重构，提升了代码的可维护性和复用性：

#### 主要改进

1. **组件化架构**
   - 将原有的单文件组件拆分为多个独立的功能组件
   - 提高了代码的可维护性和复用性
   - 便于团队协作开发

2. **新增组件**
   - `ContainerCard`: 容器信息卡片组件
   - `ContainerActions`: 容器操作按钮组件
   - `LogViewer`: 日志查看器组件
   - `SoftVersionManager`: 软件版本管理组件
   - `StatsCard`: 统计信息卡片组件
   - `InstallProgress`: 安装进度组件

3. **WebSocket集成**
   - 集成实时通信功能
   - 支持容器状态实时更新
   - 支持日志实时推送
   - 支持统计信息实时刷新

4. **完善的API文档**
   - 详细的接口说明文档
   - 完整的数据模型定义
   - 使用示例和错误处理

#### 技术特性

- **模块化设计**: 功能组件独立，便于维护和扩展
- **TypeScript**: 完整的类型定义，提供更好的开发体验
- **响应式设计**: 适配桌面和移动设备
- **实时通信**: 基于WebSocket的实时数据更新
- **统一样式**: 遵循Element Plus设计规范

#### 文件结构

```
src/views/soft/
├── index.vue                    # 软件管理主页面
├── detail.vue                   # 软件详情页面
├── containers.vue               # 容器管理页面
├── records.vue                  # 安装记录页面
└── components/                  # 软件管理组件
    ├── index.ts                 # 组件统一导出
    ├── ContainerCard.vue        # 容器信息卡片
    ├── ContainerActions.vue     # 容器操作按钮
    ├── LogViewer.vue           # 日志查看器
    ├── SoftVersionManager.vue   # 版本管理
    ├── StatsCard.vue           # 统计信息卡片
    └── InstallProgress.vue      # 安装进度
```

#### API文档

详细的API接口文档请参考：[软件管理模块API文档](./docs/API_SOFT_MANAGEMENT.md)

### WebRTC实时通信模块（2025-01-10）

新增完整的WebRTC实时通信功能模块，支持视频通话、视频会议、屏幕共享等功能：

#### 主要功能

1. **房间管理**
   - 房间列表查看和搜索
   - 创建和加入房间
   - 房间状态实时监控
   - 房间成员管理

2. **视频通话**
   - 一对一视频通话
   - 音频/视频控制
   - 通话质量监控
   - 通话记录管理

3. **视频会议**
   - 多人视频会议
   - 会议室管理
   - 参会者权限控制
   - 会议录制功能

4. **屏幕共享**
   - 桌面屏幕共享
   - 应用窗口共享
   - 共享权限控制
   - 实时标注功能

5. **统计监控**
   - 房间使用统计
   - 通话质量分析
   - 用户活跃度统计
   - 系统性能监控

#### 技术特性

- **WebRTC技术**: 基于现代WebRTC标准，支持P2P直连
- **Socket.IO**: 实时信令交换和状态同步
- **响应式设计**: 适配桌面和移动设备
- **模块化架构**: 功能模块独立，便于维护和扩展
- **TypeScript**: 完整的类型定义，提供更好的开发体验

#### 文件结构

```
src/
├── views/webrtc/                          # WebRTC页面组件
│   ├── index.vue                          # WebRTC主页面
│   ├── rooms/
│   │   └── index.vue                      # 房间管理页面
│   ├── video-call/
│   │   └── index.vue                      # 视频通话页面
│   ├── video-conference/
│   │   └── index.vue                      # 视频会议页面
│   ├── screen-share/
│   │   └── index.vue                      # 屏幕共享页面
│   └── statistics/
│       └── index.vue                      # 统计监控页面
├── api/webrtc/                            # WebRTC API接口
│   ├── index.ts                           # 统一导出
│   ├── rooms.ts                           # 房间管理接口
│   ├── users.ts                           # 用户管理接口
│   ├── statistics.ts                      # 统计接口
│   └── config.ts                          # 配置接口
├── composables/webrtc/                    # WebRTC组合式函数
│   ├── index.ts                           # 统一导出
│   ├── useWebRTCCall.ts                   # 视频通话逻辑
│   ├── useWebRTCConference.ts             # 视频会议逻辑
│   └── useWebRTCScreenShare.ts            # 屏幕共享逻辑
└── services/webrtc/                       # WebRTC服务
    ├── index.ts                           # 统一导出
    └── socket.ts                          # Socket.IO客户端
```

#### 使用说明

1. **访问WebRTC模块**: 在主菜单中选择"实时通信" -> "WebRTC管理"
2. **创建房间**: 在房间管理页面点击"创建房间"按钮
3. **发起通话**: 选择在线用户，点击"发起通话"按钮
4. **加入会议**: 输入会议室ID或从列表中选择会议室
5. **屏幕共享**: 在通话或会议中点击"共享屏幕"按钮

### 文件存储配置模块优化

参考 `PreviewFull.vue` 的设计理念，对文件存储配置模块进行了全面优化：

#### 主要改进

1. **界面设计统一化**

   - 采用与 PreviewFull.vue 一致的三行布局设计
   - 统一的图标系统和视觉风格
   - 改进的选中状态和悬停效果

2. **智能配置表单**

   - 根据存储类型动态显示相关配置项
   - 为不同存储类型提供专门的配置说明
   - 优化的表单验证规则

3. **功能增强**
   - 新增连接测试功能
   - 支持基础路径配置
   - 启用/禁用状态快速切换

#### 支持的存储类型

- **FILESYSTEM**: 本地文件系统存储
- **S3**: Amazon S3 对象存储
- **MinIO**: MinIO 对象存储
- **阿里云 OSS**: 阿里云对象存储服务
- **FTP/SFTP**: FTP 文件传输协议

#### 配置说明

每种存储类型都有对应的配置要求：

**FILESYSTEM (文件系统)**

- 根路径：服务器本地文件系统路径
- 基础路径：相对于根路径的子目录

**对象存储 (S3/MinIO/OSS)**

- 端点：对象存储服务的访问端点
- 存储桶：用于组织文件的容器
- 访问密钥：用于身份验证的密钥对
- 区域：服务所在的地理区域（部分类型需要）
- 基础路径：存储桶内的路径前缀

## 技术栈

- **前端框架**: Vue 3 + Composition API
- **UI 组件库**: Element Plus
- **开发语言**: TypeScript
- **构建工具**: Vite
- **图标库**: Iconify

## 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 Vue 3 Composition API 最佳实践
- 使用 Element Plus 组件库保持界面一致性
- 采用响应式设计支持多种屏幕尺寸

## 项目结构

```
src/
├── views/
│   ├── webrtc/                              # WebRTC实时通信模块
│   │   ├── index.vue                        # WebRTC主页面
│   │   ├── rooms/                           # 房间管理
│   │   ├── video-call/                      # 视频通话
│   │   ├── video-conference/                # 视频会议
│   │   ├── screen-share/                    # 屏幕共享
│   │   └── statistics/                      # 统计监控
│   ├── service-management/
│   │   ├── components/
│   │   │   └── FilterConfigFileStorage.vue  # 文件存储配置组件
│   │   └── file-storage/
│   │       └── PreviewFull.vue              # 文件预览组件
│   └── ...
├── api/
│   ├── webrtc/                              # WebRTC API接口
│   │   ├── rooms.ts                         # 房间管理接口
│   │   ├── users.ts                         # 用户管理接口
│   │   ├── statistics.ts                    # 统计接口
│   │   └── config.ts                        # 配置接口
│   └── ...                                  # 其他API接口定义
├── composables/
│   ├── webrtc/                              # WebRTC组合式函数
│   │   ├── useWebRTCCall.ts                 # 视频通话逻辑
│   │   ├── useWebRTCConference.ts           # 视频会议逻辑
│   │   └── useWebRTCScreenShare.ts          # 屏幕共享逻辑
│   └── ...                                  # 其他组合式函数
├── services/
│   ├── webrtc/                              # WebRTC服务
│   │   └── socket.ts                        # Socket.IO客户端
│   └── ...                                  # 其他服务
├── components/                              # 公共组件
└── assets/                                  # 静态资源
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。
