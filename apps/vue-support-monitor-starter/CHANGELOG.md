# 更新日志

## [最新更新] - 2025-01-10

### 🎥 WebRTC实时通信模块

新增完整的WebRTC实时通信功能模块，支持视频通话、视频会议、屏幕共享等功能。

#### ✨ 新增功能

1. **房间管理系统**
   - 房间列表查看和搜索功能
   - 创建和加入房间功能
   - 房间状态实时监控
   - 房间成员管理

2. **视频通话功能**
   - 一对一视频通话
   - 音频/视频控制开关
   - 通话质量实时监控
   - 通话记录管理

3. **视频会议功能**
   - 多人视频会议支持
   - 会议室创建和管理
   - 参会者权限控制
   - 会议录制功能（预留接口）

4. **屏幕共享功能**
   - 桌面屏幕共享
   - 应用窗口共享
   - 共享权限控制
   - 实时标注功能（预留接口）

5. **统计监控功能**
   - 房间使用统计图表
   - 通话质量分析
   - 用户活跃度统计
   - 系统性能监控

#### 🛠 技术实现

- **WebRTC标准**: 基于现代WebRTC API实现P2P音视频通信
- **Socket.IO集成**: 实时信令交换和状态同步
- **Vue 3 Composition API**: 使用组合式函数封装业务逻辑
- **TypeScript支持**: 完整的类型定义和接口规范
- **Element Plus UI**: 统一的界面设计和交互体验

#### 📁 新增文件

**页面组件**
- `src/views/webrtc/index.vue` - WebRTC主页面
- `src/views/webrtc/rooms/index.vue` - 房间管理页面
- `src/views/webrtc/video-call/index.vue` - 视频通话页面
- `src/views/webrtc/video-conference/index.vue` - 视频会议页面
- `src/views/webrtc/screen-share/index.vue` - 屏幕共享页面
- `src/views/webrtc/statistics/index.vue` - 统计监控页面

**API接口**
- `src/api/webrtc/index.ts` - API统一导出
- `src/api/webrtc/rooms.ts` - 房间管理接口
- `src/api/webrtc/users.ts` - 用户管理接口
- `src/api/webrtc/statistics.ts` - 统计数据接口
- `src/api/webrtc/config.ts` - 配置管理接口

**组合式函数**
- `src/composables/webrtc/index.ts` - 组合式函数统一导出
- `src/composables/webrtc/useWebRTCCall.ts` - 视频通话逻辑
- `src/composables/webrtc/useWebRTCConference.ts` - 视频会议逻辑
- `src/composables/webrtc/useWebRTCScreenShare.ts` - 屏幕共享逻辑

**服务层**
- `src/services/webrtc/index.ts` - 服务统一导出
- `src/services/webrtc/socket.ts` - Socket.IO客户端服务

**路由配置**
- `src/router/modules/webrtc.ts` - WebRTC路由模块
- 更新 `src/stores/route-menu.ts` - 添加菜单映射

#### 🎯 使用指南

1. **访问入口**: 主菜单 → 实时通信 → WebRTC管理
2. **房间管理**: 创建房间、查看房间列表、管理房间成员
3. **发起通话**: 选择在线用户，点击发起通话按钮
4. **加入会议**: 输入会议ID或从列表选择会议室
5. **屏幕共享**: 在通话或会议中启用屏幕共享功能

#### 🔧 配置说明

- **开发环境**: WebSocket服务默认连接 `ws://localhost:3000`
- **生产环境**: 自动使用当前域名的WebSocket服务
- **模拟模式**: 开发阶段提供模拟Socket服务，便于前端开发测试

#### 📋 待完善功能

- [ ] 后端Socket.IO服务集成
- [ ] 会议录制功能实现
- [ ] 屏幕共享标注功能
- [ ] 移动端适配优化
- [ ] 国际化支持

---

## [历史更新] - 2025-08-18

### 数据管理控制台 - RedisConsole 重构

- 左侧与 JDBC 控制台保持一致：采用树形结构（数据库/Key），复用统一接口：/root、/children、/node
- 右侧根据 Key 类型展示不同视图：
  - string：多行只读文本
  - hash：键值表格
  - list：序号+值列表
  - set：成员列表
  - zset：成员+分数表格
- 支持左/右分栏拖拽与刷新当前值
- 不改变后端接口，仅前端视图与交互对齐

### 修改的文件

- src/views/data-management/console/RedisConsole.vue

### 数据管理设置编辑页

- 控制台类型改为“启用控制台”开关，关闭时提交空的 consoleType
- 远程模式（REMOTE）下新增必填规则：需填写“地址(连接串)”或“主机+端口”
- 后端新增接口：POST /system/data/setting/save（含校验）

## [最新更新] - 2025-01-18

### 文件存储配置优化

#### 🎨 界面改进

- **存储列表重设计**: 参考 PreviewFull.vue 的设计风格，重新设计了存储配置列表
  - 采用三行布局：类型标签、路径信息、操作按钮
  - 添加存储类型图标显示

### 控制台新增/对齐

- ZooKeeper 控制台：参考 Redis 风格重构，统一左侧树/右侧内容区布局与交互
- InfluxDB 控制台：参考 JDBC 风格新增，支持 Flux 查询执行与结果表格展示；路由：/data/console/influx?id=xxx

  - 优化选中状态的视觉效果
  - 添加悬停效果和过渡动画

#### 🔧 功能增强

- **智能表单验证**: 根据存储类型动态调整验证规则
  - FILESYSTEM 类型：只需要根路径配置
  - 对象存储类型：需要端点、存储桶、访问密钥等完整配置
- **配置提示优化**: 为不同存储类型添加详细的配置说明
  - S3: AWS S3 端点和区域说明
  - MinIO: MinIO 服务端点说明
  - 阿里云 OSS: 阿里云端点和区域说明
- **新增功能**:
  - 连接测试按钮：测试存储配置的连通性
  - 基础路径配置：支持在存储桶内设置基础路径前缀
  - 启用状态开关：可以快速启用/禁用存储配置

#### 🎯 用户体验

- **视觉一致性**: 与 PreviewFull.vue 保持一致的设计语言
- **操作便捷性**:
  - 一键测试连接
  - 直观的启用/禁用状态
  - 清晰的配置分类和说明
- **响应式设计**: 支持不同屏幕尺寸的适配

#### 🛠 技术改进

- **样式优化**:
  - 添加 thin-scrollbar 样式类
  - 统一的表单提示样式
  - 改进的存储项布局样式
- **代码结构**:
  - 新增 getStorageIcon 函数用于图标映射
  - 新增 testConnection 函数用于连接测试
  - 优化表单验证逻辑

### 修改的文件

- `src/views/service-management/components/FilterConfigFileStorage.vue`
  - 重构存储列表显示组件
  - 优化表单配置界面
  - 添加新的样式和功能

### 兼容性

- 保持与现有 API 的完全兼容
- 向后兼容现有的存储配置数据结构
- 支持所有现有的存储类型（FILESYSTEM、S3、MinIO、阿里云 OSS 等）
