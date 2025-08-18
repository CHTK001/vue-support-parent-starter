# Vue Support Monitor Starter

## 项目概述

Vue Support Monitor Starter 是一个基于 Vue 3 + TypeScript + Element Plus 的监控管理系统前端应用。

## 最新更新

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
│   ├── service-management/
│   │   ├── components/
│   │   │   └── FilterConfigFileStorage.vue  # 文件存储配置组件
│   │   └── file-storage/
│   │       └── PreviewFull.vue              # 文件预览组件
│   └── ...
├── api/                                     # API 接口定义
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
