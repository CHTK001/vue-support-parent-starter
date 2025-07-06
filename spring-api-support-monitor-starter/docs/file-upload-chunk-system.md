# 服务器文件分片上传系统

## 概述

本系统实现了完整的分片上传功能，支持大文件上传、断点续传、文件秒传等特性。

## 核心功能

### 1. 文件预处理 (`/api/monitor/server/file-upload/prepare`)

**功能**: 检查文件是否已存在，计算分片信息，返回上传会话ID

**请求参数**:
```json
{
    "fileName": "example.zip",
    "fileSize": 104857600,
    "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
    "chunkSize": 1048576,
    "serverId": 1,
    "targetPath": "/uploads",
    "overwrite": false,
    "backup": true
}
```

**响应结果**:
- 文件已存在（秒传）:
```json
{
    "code": 200,
    "data": {
        "needUpload": false,
        "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
        "filePath": "/data/files/d41d8cd98f00b204e9800998ecf8427e_example.zip"
    }
}
```

- 需要上传:
```json
{
    "code": 200,
    "data": {
        "needUpload": true,
        "uploadSessionId": "abc123def456",
        "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
        "totalChunks": 100,
        "chunkSize": 1048576,
        "uploadedChunks": [0, 1, 5, 10]
    }
}
```

### 2. 分片上传 (`/api/monitor/server/file-upload/chunk`)

**功能**: 上传单个文件分片

**请求参数**:
- `file`: MultipartFile - 分片文件
- 表单参数:
```
fileMd5: d41d8cd98f00b204e9800998ecf8427e
chunkId: abc123def456
chunkIndex: 0
totalChunks: 100
chunkSize: 1048576
chunkMd5: e3b0c44298fc1c149afbf4c8996fb924
fileName: example.zip
fileSize: 104857600
serverId: 1
targetPath: /uploads
```

**响应结果**:
```json
{
    "code": 200,
    "data": {
        "success": true,
        "chunkIndex": 0,
        "chunkMd5": "e3b0c44298fc1c149afbf4c8996fb924",
        "chunkPath": "/data/chunks/d41d8cd98f00b204e9800998ecf8427e/chunk_0_e3b0c44298fc1c149afbf4c8996fb924"
    }
}
```

### 3. 文件合并 (`/api/monitor/server/file-upload/merge`)

**功能**: 将所有分片合并为完整文件

**请求参数**:
```json
{
    "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
    "fileName": "example.zip",
    "fileSize": 104857600,
    "totalChunks": 100,
    "serverId": 1,
    "targetPath": "/uploads",
    "overwrite": false,
    "backup": true
}
```

**响应结果**:
```json
{
    "code": 200,
    "data": {
        "success": true,
        "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
        "filePath": "/data/files/d41d8cd98f00b204e9800998ecf8427e_example.zip",
        "fileSize": 104857600,
        "message": "文件合并成功"
    }
}
```

### 4. 重复文件检查 (`/api/monitor/server/file-upload/check-duplicate`)

**功能**: 基于MD5检查文件是否已存在

**请求参数**:
```json
{
    "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
    "fileName": "example.zip",
    "fileSize": 104857600,
    "serverId": 1,
    "targetPath": "/uploads"
}
```

**响应结果**:
```json
{
    "code": 200,
    "data": {
        "exists": true,
        "fileMd5": "d41d8cd98f00b204e9800998ecf8427e",
        "filePath": "/data/files/d41d8cd98f00b204e9800998ecf8427e_example.zip",
        "fileSize": 104857600,
        "message": "文件已存在"
    }
}
```

## 前端集成

### 使用现有的 upload-pieces.ts 工具

```typescript
import { uploadPieces } from '@/utils/upload-pieces'

// 分片上传配置
const uploadConfig = {
  file: selectedFile,
  uploadCallback: async (formData, nowSlice, totalSlice, sliceId, fileSumMd5) => {
    // 调用分片上传API
    const response = await fetch('/api/monitor/server/file-upload/chunk', {
      method: 'POST',
      body: formData
    })
    return response.json()
  },
  success: (result) => {
    console.log('上传成功:', result)
  },
  error: (error) => {
    console.error('上传失败:', error)
  },
  process: (progress) => {
    console.log('上传进度:', progress)
  }
}

// 开始上传
uploadPieces(uploadConfig)
```

## 配置说明

### application.yml 配置

```yaml
app:
  file:
    upload:
      chunk-storage-path: ./data/chunks      # 分片存储路径
      file-storage-path: ./data/files        # 文件存储路径
      default-chunk-size: 1048576            # 默认分片大小（1MB）
      max-file-size: 1073741824              # 最大文件大小（1GB）
      max-concurrent-uploads: 10              # 最大并发上传数
      chunk-expire-hours: 24                  # 分片过期时间（小时）
      enable-md5-check: true                  # 启用MD5校验
      enable-chunk-md5-check: true            # 启用分片MD5校验
      auto-clean-expired-chunks: true         # 自动清理过期分片
      auto-clean-interval: 6                  # 自动清理间隔（小时）
```

## 数据库表结构

### monitor_sys_gen_server_file_upload_chunks

分片上传记录表，存储每个分片的上传状态和路径信息。

```sql
CREATE TABLE `monitor_sys_gen_server_file_upload_chunks` (
    `monitor_sys_gen_server_file_upload_chunk_id` BIGINT NOT NULL AUTO_INCREMENT,
    `upload_session_id` VARCHAR(64) NOT NULL,
    `file_md5` VARCHAR(32) NOT NULL,
    `chunk_index` INT NOT NULL,
    `chunk_md5` VARCHAR(32) NOT NULL,
    `chunk_size` BIGINT NOT NULL,
    `chunk_path` VARCHAR(512) NOT NULL,
    `upload_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    `error_message` TEXT,
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`monitor_sys_gen_server_file_upload_chunk_id`),
    UNIQUE KEY `uk_file_chunk` (`file_md5`, `chunk_index`)
);
```

## 特性说明

### 1. 文件秒传
- 基于MD5值检查文件是否已存在
- 如果文件已存在且完整，直接返回文件路径，无需重新上传

### 2. 断点续传
- 支持查询已上传的分片列表
- 客户端可以跳过已上传的分片，只上传缺失的分片

### 3. 完整性校验
- 文件级MD5校验：确保合并后的文件与原文件一致
- 分片级MD5校验：确保每个分片传输正确

### 4. 自动清理
- 定时清理过期的分片文件
- 避免磁盘空间浪费

### 5. 并发控制
- 支持多个文件同时上传
- 可配置最大并发上传数

## 错误处理

### 常见错误码

- `400`: 请求参数错误
- `500`: 服务器内部错误
- 自定义错误信息会在响应的 `msg` 字段中返回

### 重试机制

建议在客户端实现重试机制：
- 分片上传失败时重试该分片
- 网络异常时重试整个上传流程
- 设置合理的重试次数和间隔

## 性能优化

### 1. 分片大小选择
- 默认1MB，可根据网络环境调整
- 网络较差时可减小分片大小
- 网络较好时可增大分片大小

### 2. 并发上传
- 可同时上传多个分片
- 建议并发数不超过10个

### 3. 缓存策略
- 服务端缓存文件MD5查询结果
- 客户端缓存上传进度信息
