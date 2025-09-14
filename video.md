# Spring API Support Common Video Starter

## 项目简介

Spring API Support Common Video Starter 是一个基于Spring Boot的视频资源管理和搜索系统，提供视频信息管理、智能搜索、下载管理、数据同步、网盘搜索集成等功能。系统采用模块化设计，支持多种视频源和资源提供者，可以轻松集成到现有的Spring Boot项目中。

## 🚀 快速开始

### 依赖引入

在你的 Spring Boot 项目中添加以下依赖：

```xml
<dependency>
    <groupId>com.chua.starter</groupId>
    <artifactId>spring-api-support-common-video-starter</artifactId>
    <version>1.1.0</version>
</dependency>
```

### 基础配置

在 `application.yml` 中添加基础配置：

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/video_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:123456}
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    database: ${REDIS_DATABASE:0}
```

## 功能特性

### 🎬 视频资源管理
- **多源视频搜索**: 支持多个视频源的统一搜索接口
- **视频信息管理**: 完整的视频元数据管理（标题、描述、评分、演员等）
- **分类标签系统**: 支持多维度的视频分类和标签管理
- **评分系统**: 集成多平台评分数据（豆瓣、IMDb等）

### 🔍 智能搜索功能
- **关键词搜索**: 支持视频标题、演员、导演等多字段搜索
- **高级筛选**: 按年份、地区、语言、类型等条件筛选
- **热门推荐**: 基于搜索热度的关键词推荐
- **搜索历史**: 用户搜索行为记录和分析

### 📥 下载管理
- **多平台支持**: 支持多种下载平台和方式
- **链接管理**: 下载链接的有效性检测和更新
- **质量选择**: 支持不同清晰度的视频下载
- **统计分析**: 下载次数和热度统计

### 🔄 数据同步
- **多源同步**: 支持从多个数据源同步视频信息
- **增量更新**: 智能的增量数据同步机制
- **配置管理**: 灵活的同步配置和调度
- **错误处理**: 完善的同步错误处理和重试机制

### 🌐 网盘搜索集成 (PanSou)
- **多网盘支持**: 集成12种主流网盘平台
  - 百度网盘、阿里云盘、夸克网盘、天翼云盘
  - UC网盘、移动云盘、115网盘、PikPak
  - 迅雷网盘、123网盘、磁力链接、电驴链接
- **智能搜索**: 并发执行多个TG频道及异步插件搜索
- **异步处理**: 支持异步搜索模式，快速响应用户请求
- **智能排序**: 基于插件等级、时间新鲜度和关键词的多维度排序
- **文件过滤**: 视频文件类型智能识别和过滤
- **超时控制**: 智能超时控制和重试机制

### 资源提供者（ResourceProvider）
- **B站资源提供者**：支持从B站搜索视频资源
- **豆瓣资源提供者**：支持从豆瓣搜索电影资源
- **优酷资源提供者**：支持从优酷搜索视频资源
- **PanSou网盘搜索**：🆕 支持多种网盘资源搜索

### 视频源提供者（VideoSourceProvider）
- **观影AC源提供者**：支持从观影AC获取视频源
- **观影MV源提供者**：支持从观影MV获取视频源
- **观影TV源提供者**：支持从观影TV获取视频源
- **PanSou网盘视频源**：🆕 支持从网盘获取视频资源

## 🆕 PanSou 网盘搜索功能

基于 [PanSou 项目](https://github.com/fish2018/pansou) <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference> 实现的高性能网盘资源搜索功能。

### 支持的网盘类型
- 百度网盘 (baidu)
- 阿里云盘 (aliyun)
- 夸克网盘 (quark)
- 天翼云盘 (tianyi)
- UC网盘 (uc)
- 移动云盘 (mobile)
- 115网盘 (115)
- PikPak (pikpak)
- 迅雷网盘 (xunlei)
- 123网盘 (123)
- 磁力链接 (magnet)
- 电驴链接 (ed2k)
- 其他 (others)

### 核心特性
- **高性能搜索**：并发执行多个TG频道及异步插件搜索 <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference>
- **网盘类型分类**：自动识别多种网盘链接，按类型归类展示 <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference>
- **智能排序**：基于插件等级、时间新鲜度和优先关键词的多维度综合排序算法 <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference>
- **异步插件系统**：支持通过插件扩展搜索来源 <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference>
- **二级缓存**：分片内存+分片磁盘缓存机制，大幅提升重复查询速度和并发性能 <mcreference link="https://github.com/fish2018/pansou" index="0">0</mcreference>

## 配置说明

### PanSou 配置

在 `application.yml` 中添加以下配置：

```yaml
plugin:
  pansou:
    # PanSou API 基础URL
    base-url: https://so.252035.xyz
    # API 搜索端点
    search-endpoint: /api/search
    # 连接超时时间（毫秒）
    connect-timeout: 10000
    # 读取超时时间（毫秒）
    read-timeout: 30000
    # 最大重试次数
    max-retries: 3
    # 每页返回结果数量
    page-size: 20
    # 最大搜索结果数量
    max-results: 100
    # 启用的插件列表
    enabled-plugins:
      - labi
      - zhizhen
      - shandian
      - duoduo
      - muou
      - wanou
      - hunhepan
      - jikepan
      - panwiki
      - pansearch
      - panta
      - qupansou
    # 搜索的TG频道列表
    channels:
      - tgsearchers3
      - Aliyun_4K_Movies
      - bdbdndn11
      - yunpanx
    # 是否启用异步搜索
    async-enabled: true
    # 异步响应超时时间（秒）
    async-response-timeout: 4
    # 是否启用缓存
    cache-enabled: true
    # 缓存有效期（分钟）
    cache-ttl: 60
    # 用户代理字符串
    user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
    # 是否启用调试日志
    debug-enabled: false
    # 代理配置（可选）
    proxy: 
    # API密钥（如果需要）
    api-key: 
```

## API 接口

## 实体类说明

### PanResource
网盘资源实体类，用于封装网盘搜索结果。

**主要字段：**
- `title`：资源标题
- `url`：资源链接
- `panType`：网盘类型（枚举）
- `size`：资源大小
- `description`：资源描述
- `publishTime`：发布时间
- `source`：来源插件
- `score`：资源评分
- `extractCode`：提取码
- `valid`：是否有效

### PanType
网盘类型枚举，定义支持的网盘类型。

**支持的类型：**
- `BAIDU`：百度网盘
- `ALIYUN`：阿里云盘
- `QUARK`：夸克网盘
- `TIANYI`：天翼云盘
- `UC`：UC网盘
- `MOBILE`：移动云盘
- `PAN_115`：115网盘
- `PIKPAK`：PikPak
- `XUNLEI`：迅雷网盘
- `PAN_123`：123网盘
- `MAGNET`：磁力链接
- `ED2K`：电驴链接
- `OTHERS`：其他

## 数据库配置

### 应用基础配置

```yaml
server:
  port: ${SERVER_PORT:8080}
  servlet:
    context-path: /api

spring:
  application:
    name: video-api-service
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}
```

### 数据库配置

```yaml
spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://${DB_HOST:localhost}:${DB_PORT:3306}/${DB_NAME:video_db}?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:123456}
    hikari:
      minimum-idle: 5
      maximum-pool-size: 20
      idle-timeout: 300000
      connection-timeout: 20000
      max-lifetime: 1200000

# MyBatis-Plus配置
mybatis-plus:
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: auto
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
  mapper-locations: classpath*:mapper/**/*.xml
```

### Redis缓存配置

```yaml
spring:
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    database: ${REDIS_DATABASE:0}
    timeout: 10000ms
    lettuce:
      pool:
        max-active: 8
        max-wait: -1ms
        max-idle: 8
        min-idle: 0

# 缓存配置
spring:
  cache:
    type: redis
    redis:
      time-to-live: 600000
      cache-null-values: false
```

### 日志配置

```yaml
logging:
  level:
    com.chua: debug
    org.springframework: info
    org.mybatis: debug
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{50} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{50} - %msg%n"
  file:
    name: logs/video-api.log
    max-size: 100MB
    max-history: 30
```

### 安全配置

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 100MB
      max-request-size: 100MB
      enabled: true

# CORS跨域配置
cors:
  allowed-origins: "*"
  allowed-methods: "GET,POST,PUT,DELETE,OPTIONS"
  allowed-headers: "*"
  allow-credentials: true
  max-age: 3600
```

### 监控配置

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always
  info:
    env:
      enabled: true
```
          style={{ objectFit: 'cover' }}
        />
      )
    },
    {
      title: '标题',
      dataIndex: 'videoTitle',
      ellipsis: true
    },
    {
      title: '年份',
      dataIndex: 'videoYear',
      width: 80
    },
## 完整API接口文档

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "code": "00000",

  "data": {},
  "timestamp": "2024-12-19T10:00:00"
}
```

#### 分页响应
```json
{
  "success": true,
  "code": "00000",

  "data": {
    "records": [],
    "total": 100,
    "size": 10,
    "current": 1,
    "pages": 10
  },
  "timestamp": "2024-12-19T10:00:00"
}
```

#### 错误响应
```json
{
  "success": false,
  "code": 400,

  "data": null,
  "timestamp": "2024-12-19T10:00:00"
}
```

### 视频信息接口

#### 1. 视频搜索与分页查询

**接口地址：** `POST /v1/video/page`

**接口描述：** 根据条件搜索视频信息，支持分页

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| keyword | String | 否 | 搜索关键词 |
| selectedType | String | 否 | 选中的视频类型ID |
| platformId | String | 否 | 平台ID |
| districts | String | 否 | 地区列表，多个用逗号分隔 |
| languages | String | 否 | 语言列表，多个用逗号分隔 |
| videoTypes | String | 否 | 视频类型列表，多个用逗号分隔 |
| category | String | 否 | 视频分类 |
| years | String | 否 | 年份，多个用逗号分隔 |
| current | Integer | 否 | 当前页码，默认1 |
| size | Integer | 否 | 每页数量，默认10 |

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": {
    "records": [
      {
        "videoId": 1,
        "videoName": "复仇者联盟",
        "videoTitle": "复仇者联盟：终局之战",
        "videoScore": 8.5,
        "videoYear": 2019,
        "videoPlatform": "Marvel",
        "videoLanguage": "英语",
        "videoCategory": "电影",
        "videoType": "动作",
        "videoDistrict": "美国",
        "videoDirector": "安东尼·罗素",
        "videoActor": "小罗伯特·唐尼,克里斯·埃文斯",
        "videoDescription": "漫威超级英雄电影",
        "createTime": "2024-12-19T10:00:00"
      }
    ],
    "total": 1,
    "size": 10,
    "current": 1,
    "pages": 1
  }
}
```

#### 2. 获取视频详情

**接口地址：** `GET /v1/video/{id}`

**接口描述：** 根据视频ID获取详细信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 视频ID |

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": {
    "videoId": 1,
    "videoName": "复仇者联盟",
    "videoTitle": "复仇者联盟：终局之战",
    "videoAliasName": "Avengers: Endgame",
    "videoScore": 8.5,
    "videoYear": 2019,
    "videoPlatform": "Marvel",
    "videoLanguage": "英语",
    "videoQuality": "4K",
    "videoCover": "https://example.com/cover.jpg",
    "videoUrl": "https://example.com/video.mp4",
    "videoViews": 1000000,
    "videoCategory": "电影",
    "videoType": "动作",
    "videoRelease": "2019-04-26",
    "videoDistrict": "美国",
    "videoSize": "2.5GB",
    "videoDirector": "安东尼·罗素,乔·罗素",
    "videoWriter": "克里斯托弗·马库斯,斯蒂芬·麦克菲利",
    "videoActor": "小罗伯特·唐尼,克里斯·埃文斯,马克·鲁弗洛",
    "videoDescription": "漫威电影宇宙第四阶段的史诗级终章",
    "downloadList": [
      {
        "videoDownloadId": 1,
        "videoDownloadUrl": "https://pan.baidu.com/s/xxxxx",
        "videoDownloadPlatform": "百度网盘",
        "videoDownloadQuality": "4K",
        "videoDownloadSize": "2.5GB",
        "videoDownloadPassword": "1234"
      }
    ],
    "videoMarkList": [
      {
        "videoMarkId": 1,
        "videoMarkPlatform": "豆瓣",
        "videoMarkScore": 8.5,
        "videoMarkCount": 500000
      }
    ]
  }
}
```

#### 3. 添加视频

**接口地址：** `POST /v1/video/save`

**接口描述：** 添加新的视频信息

**请求体示例：**
```json
{
  "videoName": "新电影",
  "videoTitle": "新电影标题",
  "videoScore": 8.0,
  "videoYear": 2024,
  "videoPlatform": "Netflix",
  "videoLanguage": "中文",
  "videoCategory": "电影",
  "videoType": "剧情",
  "videoDistrict": "中国",
  "videoDirector": "张艺谋",
  "videoActor": "张译,易烊千玺",
  "videoDescription": "一部优秀的国产电影"
}
```

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": true
}
```

#### 4. 修改视频

**接口地址：** `PUT /v1/video/update`

**接口描述：** 修改视频信息

**请求体示例：**
```json
{
  "videoId": 1,
  "videoName": "修改后的电影名",
  "videoTitle": "修改后的电影标题",
  "videoScore": 8.5
}
```

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": true
}
```

#### 5. 删除视频

**接口地址：** `DELETE /v1/video/{videoId}`

**接口描述：** 删除指定的视频信息

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| videoId | String | 是 | 视频ID |

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": true
}
```

#### 6. 获取热门搜索关键词

**接口地址：** `GET /v1/video/hotKeywords`

**接口描述：** 获取热门搜索关键词列表

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": [
    {
      "videoKeywordId": 1,
      "videoKeywordContent": "复仇者联盟",
      "videoKeywordCount": 1000,
      "videoKeywordHot": 95
    }
  ]
}
```

### 视频下载接口

#### 1. 添加视频下载地址

**接口地址：** `POST /v1/video/download/save`

**接口描述：** 为视频添加下载地址

**请求体示例：**
```json
{
  "videoId": 1,
  "videoDownloadUrl": "https://pan.baidu.com/s/xxxxx",
  "videoDownloadPlatform": "百度网盘",
  "videoDownloadQuality": "4K",
  "videoDownloadSize": "2.5GB",
  "videoDownloadPassword": "1234",
  "videoDownloadDescription": "高清版本"
}
```

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": null
}
```

#### 2. 更新视频下载地址

**接口地址：** `PUT /v1/video/download/update`

**接口描述：** 更新视频下载地址信息

**请求体示例：**
```json
{
  "videoDownloadId": 1,
  "videoId": 1,
  "videoDownloadUrl": "https://pan.baidu.com/s/updated",
  "videoDownloadPlatform": "百度网盘",
  "videoDownloadQuality": "4K",
  "videoDownloadSize": "3.0GB"
}
```

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": null
}
```

#### 3. 删除视频下载地址

**接口地址：** `DELETE /v1/video/download/{id}`

**接口描述：** 删除指定的视频下载地址

**路径参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Long | 是 | 下载地址ID |

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": null
}
```

### 视频关键词接口

#### 1. 获取热门搜索关键词

**接口地址：** `GET /v1/video/keyword/hot`

**接口描述：** 获取热门搜索关键词列表

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": [
    {
      "videoKeywordId": 1,
      "videoKeywordContent": "复仇者联盟",
      "videoKeywordCount": 1000,
      "videoKeywordHot": 95
    }
  ]
}
```

#### 2. 关键词分页查询

**接口地址：** `GET /v1/video/keyword/page`

**接口描述：** 分页查询视频关键词

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | Integer | 否 | 页码，默认1 |
| pageSize | Integer | 否 | 每页数量，默认10 |
| keyword | String | 否 | 关键词搜索 |

#### 3. 获取关键词详情

**接口地址：** `GET /v1/video/keyword/{id}`

**接口描述：** 根据ID获取视频关键词详情

#### 4. 添加关键词

**接口地址：** `POST /v1/video/keyword/add`

**接口描述：** 添加新的视频关键词

#### 5. 修改关键词

**接口地址：** `PUT /v1/video/keyword/update`

**接口描述：** 修改视频关键词信息

#### 6. 删除关键词

**接口地址：** `DELETE /v1/video/keyword/{id}`

**接口描述：** 删除指定的视频关键词

#### 7. 批量删除关键词

**接口地址：** `DELETE /v1/video/keyword/batch`

**接口描述：** 批量删除视频关键词



### 在线视频接口

#### 1. 在线搜索视频

**接口地址：** `GET /v1/video/online/find`

**接口描述：** 在线搜索视频资源（网盘搜索）

**请求参数：**

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| videoName | String | 是 | 视频名称 |

**响应示例：**
```json
{
  "success": true,
  "code": "00000",

  "data": [
    {
      "title": "复仇者联盟4：终局之战",
      "url": "https://pan.baidu.com/s/xxxxx",
      "panType": "BAIDU",
      "size": "2.5GB",
      "description": "4K高清版本",
      "publishTime": "2024-12-19T10:00:00",
      "source": "labi",
      "score": 95,
      "extractCode": "1234",
      "valid": true
    }
  ]
}
```

### 视频同步配置接口

#### 1. 获取同步配置列表

**接口地址：** `GET /v1/video/sync/page`

**接口描述：** 分页获取所有同步配置

#### 2. 获取同步配置详情

**接口地址：** `GET /v1/video/sync/{id}`

**接口描述：** 根据ID获取同步配置详情

#### 3. 添加同步配置

**接口地址：** `POST /v1/video/sync/save`

**接口描述：** 添加新的同步配置

**请求体示例：**
```json
{
  "videoSyncConfigName": "PanSou电影同步",
  "videoSyncConfigSource": "pansou",
  "videoSyncConfigKeyword": "电影",
  "videoSyncConfigCategory": "电影",
  "videoSyncConfigDescription": "从PanSou搜索电影资源",
  "videoSyncConfigStatus": 1,
  "videoSyncConfigCron": "0 0 2 * * ?"
}
```

#### 4. 修改同步配置

**接口地址：** `PUT /v1/video/sync/update`

**接口描述：** 修改同步配置信息

#### 5. 删除同步配置

**接口地址：** `DELETE /v1/video/sync/{id}`

**接口描述：** 删除指定的同步配置

#### 6. 执行同步

**接口地址：** `POST /v1/video/sync/{id}/execute`

**接口描述：** 手动执行指定配置的同步任务

## 实体类说明

### 视频信息实体（VideoInfo）

**表名：** `video_info`
**主键：** `video_id`
**描述：** 存储视频的基本信息

| 字段名 | 数据类型 | 长度 | 必填 | 默认值 | 说明 |
|--------|----------|------|------|--------|------|
| video_id | BIGINT | - | 是 | 自增 | 视频ID，主键 |
| video_name | VARCHAR | 255 | 是 | - | 视频名称 |
| video_title | VARCHAR | 500 | 否 | - | 视频标题 |
| video_alias_name | VARCHAR | 500 | 否 | - | 视频别名 |
| video_score | DECIMAL | 3,1 | 否 | 0.0 | 视频评分 |
| video_year | INT | - | 否 | - | 发布年份 |
| video_platform | VARCHAR | 100 | 否 | - | 视频平台 |
| video_language | VARCHAR | 50 | 否 | - | 视频语言 |
| video_quality | VARCHAR | 20 | 否 | - | 视频质量 |
| video_cover | VARCHAR | 500 | 否 | - | 封面图片URL |
| video_url | VARCHAR | 500 | 否 | - | 视频播放URL |
| video_views | BIGINT | - | 否 | 0 | 播放次数 |
| video_category | VARCHAR | 50 | 否 | - | 视频分类 |
| video_type | VARCHAR | 100 | 否 | - | 视频类型 |
| video_release | DATE | - | 否 | - | 发布日期 |
| video_district | VARCHAR | 100 | 否 | - | 制作地区 |
| video_size | VARCHAR | 50 | 否 | - | 文件大小 |
| video_director | VARCHAR | 500 | 否 | - | 导演 |
| video_writer | VARCHAR | 500 | 否 | - | 编剧 |
| video_actor | TEXT | - | 否 | - | 演员列表 |
| video_description | TEXT | - | 否 | - | 视频描述 |
| create_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 视频下载实体（VideoDownload）

**表名：** `video_download`
**主键：** `video_download_id`
**描述：** 存储视频的下载地址信息

| 字段名 | 数据类型 | 长度 | 必填 | 默认值 | 说明 |
|--------|----------|------|------|--------|------|
| video_download_id | BIGINT | - | 是 | 自增 | 下载ID，主键 |
| video_id | BIGINT | - | 是 | - | 关联视频ID |
| video_download_url | VARCHAR | 1000 | 是 | - | 下载地址 |
| video_download_platform | VARCHAR | 50 | 否 | - | 下载平台 |
| video_download_quality | VARCHAR | 20 | 否 | - | 下载质量 |
| video_download_size | VARCHAR | 50 | 否 | - | 文件大小 |
| video_download_password | VARCHAR | 50 | 否 | - | 提取密码 |
| video_download_description | VARCHAR | 500 | 否 | - | 下载描述 |
| create_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 视频评分实体（VideoMark）

**表名：** `video_mark`
**主键：** `video_mark_id`
**描述：** 存储视频在各平台的评分信息

| 字段名 | 数据类型 | 长度 | 必填 | 默认值 | 说明 |
|--------|----------|------|------|--------|------|
| video_mark_id | BIGINT | - | 是 | 自增 | 评分ID，主键 |
| video_id | BIGINT | - | 是 | - | 关联视频ID |
| video_mark_platform | VARCHAR | 50 | 是 | - | 评分平台 |
| video_mark_score | DECIMAL | 3,1 | 是 | - | 评分分数 |
| video_mark_count | INT | - | 否 | 0 | 评分人数 |
| create_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 视频关键词实体（VideoKeyword）

**表名：** `video_keyword`
**主键：** `video_keyword_id`
**描述：** 存储视频搜索关键词信息

| 字段名 | 数据类型 | 长度 | 必填 | 默认值 | 说明 |
|--------|----------|------|------|--------|------|
| video_keyword_id | BIGINT | - | 是 | 自增 | 关键词ID，主键 |
| video_keyword_content | VARCHAR | 255 | 是 | - | 关键词内容 |
| video_keyword_count | INT | - | 否 | 0 | 搜索次数 |
| video_keyword_hot | INT | - | 否 | 0 | 热度值 |
| create_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 视频同步配置实体（VideoSyncConfig）

**表名：** `video_sync_config`
**主键：** `video_sync_config_id`
**描述：** 存储视频数据同步配置信息

| 字段名 | 数据类型 | 长度 | 必填 | 默认值 | 说明 |
|--------|----------|------|------|--------|------|
| video_sync_config_id | BIGINT | - | 是 | 自增 | 配置ID，主键 |
| video_sync_config_name | VARCHAR | 255 | 是 | - | 配置名称 |
| video_sync_config_source | VARCHAR | 100 | 是 | - | 数据源 |
| video_sync_config_keyword | VARCHAR | 255 | 否 | - | 同步关键词 |
| video_sync_config_category | VARCHAR | 100 | 否 | - | 同步分类 |
| video_sync_config_description | VARCHAR | 500 | 否 | - | 配置描述 |
| video_sync_config_status | TINYINT | - | 是 | 1 | 状态（0-禁用，1-启用） |
| video_sync_config_cron | VARCHAR | 100 | 否 | - | 定时任务表达式 |
| create_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 创建时间 |
| update_time | DATETIME | - | 是 | CURRENT_TIMESTAMP | 更新时间 |

### 视频搜索请求实体（VideoSearchRequest）

**描述：** 视频搜索请求参数封装

| 字段名 | 数据类型 | 必填 | 说明 |
|--------|----------|------|------|
| keyword | String | 否 | 搜索关键词 |
| selectedType | String | 否 | 选中的视频类型ID |
| platformId | String | 否 | 平台ID |
| districts | String | 否 | 地区列表，多个用逗号分隔 |
| languages | String | 否 | 语言列表，多个用逗号分隔 |
| videoTypes | String | 否 | 视频类型列表，多个用逗号分隔 |
| category | String | 否 | 视频分类 |
| years | String | 否 | 年份，多个用逗号分隔 |
| current | Integer | 否 | 当前页码，默认1 |
| size | Integer | 否 | 每页数量，默认10 |

### 网盘类型枚举（PanType）

**描述：** 支持的网盘类型枚举

| 枚举值 | 说明 |
|--------|------|
| BAIDU | 百度网盘 |
| ALIYUN | 阿里云盘 |
| QUARK | 夸克网盘 |
| LANZOU | 蓝奏云 |
| TIANYI | 天翼云盘 |
| WEIYUN | 微云 |
| ONEDRIVE | OneDrive |
| GOOGLEDRIVE | Google Drive |

## 错误码说明

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 502 | 网关错误 |
| 503 | 服务不可用 |

### 业务错误码

#### 通用错误码（1000-1999）

| 错误码 | 说明 |
|--------|------|
| 1000 | 操作成功 |
| 1001 | 参数错误 |
| 1002 | 数据不存在 |
| 1003 | 数据已存在 |
| 1004 | 操作失败 |
| 1005 | 权限不足 |
| 1006 | 系统繁忙 |
| 1007 | 请求频率过高 |
| 1008 | 数据格式错误 |
| 1009 | 必填参数缺失 |

#### 视频相关错误码（2000-2999）

| 错误码 | 说明 |
|--------|------|
| 2001 | 视频不存在 |
| 2002 | 视频名称不能为空 |
| 2003 | 视频已存在 |
| 2004 | 视频信息更新失败 |
| 2005 | 视频删除失败 |
| 2006 | 视频搜索失败 |
| 2007 | 视频分类无效 |
| 2008 | 视频年份格式错误 |
| 2009 | 视频评分超出范围 |
| 2010 | 视频封面URL无效 |

#### 关键词相关错误码（3000-3999）

| 错误码 | 说明 |
|--------|------|
| 3001 | 关键词不存在 |
| 3002 | 关键词内容不能为空 |
| 3003 | 关键词已存在 |
| 3004 | 关键词长度超限 |
| 3005 | 关键词包含非法字符 |
| 3006 | 热门关键词获取失败 |

#### 下载相关错误码（4000-4999）

| 错误码 | 说明 |
|--------|------|
| 4001 | 下载地址不存在 |
| 4002 | 下载URL不能为空 |
| 4003 | 下载URL格式错误 |
| 4004 | 下载平台不支持 |
| 4005 | 下载地址已失效 |
| 4006 | 提取密码错误 |

#### 同步配置相关错误码（5000-5999）

| 错误码 | 说明 |
|--------|------|
| 5001 | 同步配置不存在 |
| 5002 | 配置名称不能为空 |
| 5003 | 数据源不支持 |
| 5004 | Cron表达式格式错误 |
| 5005 | 同步任务执行失败 |
| 5006 | 配置状态无效 |

#### 网盘搜索相关错误码（6000-6999）

| 错误码 | 说明 |
|--------|------|
| 6001 | 网盘搜索服务不可用 |
| 6002 | 搜索关键词不能为空 |
| 6003 | 网盘类型不支持 |
| 6004 | 搜索结果为空 |
| 6005 | 搜索请求超时 |
| 6006 | 搜索频率限制 |
| 6007 | API配置错误 |
| 6008 | 网络连接失败 |

## 使用示例

### 后端集成示例

#### 视频搜索
```java
@RestController
@RequestMapping("/api/video")
public class VideoController {
    
    @Autowired
    private VideoService videoService;
    
    @PostMapping("/search")
    public Result<Page<VideoInfo>> searchVideos(@RequestBody VideoSearchRequest request) {
        return Result.success(videoService.searchVideos(request));
    }
}
```

#### 网盘资源搜索
```java
@RestController
@RequestMapping("/api/pansou")
public class PanSouController {
    
    @Autowired
    private PanSouService panSouService;
    
    @GetMapping("/search")
    public Result<List<PanSouResult>> searchResources(
        @RequestParam String keyword,
        @RequestParam(required = false) String panType) {
        return Result.success(panSouService.searchResources(keyword, panType));
    }
}
```

#### 配置视频源同步
```java
@Service
public class VideoSyncService {
    
    @Scheduled(cron = "0 0 2 * * ?")
    public void syncVideoData() {
        // 自动同步视频数据
        List<VideoSyncConfig> configs = videoSyncConfigService.getActiveConfigs();
        for (VideoSyncConfig config : configs) {
            syncVideosByConfig(config);
        }
    }
}
```

### 1. 搜索网盘资源

```java
@Autowired
private PanSouResourceProvider panSouResourceProvider;

public void searchMovies() {
    ReturnResult<List<VideoInfo>> result = panSouResourceProvider.searchResource("复仇者联盟");
    if (result.isSuccess()) {
        List<VideoInfo> videos = result.getData();
        videos.forEach(video -> {
            System.out.println("标题: " + video.getVideoName());
            System.out.println("链接: " + video.getVideoUrl());
            System.out.println("平台: " + video.getVideoPlatform());
        });
    }
}
```

### 2. 配置视频源同步

```java
@Autowired
private PanSouVideoSourceProvider panSouVideoSourceProvider;

public void syncVideos() {
    VideoSyncConfig config = new VideoSyncConfig();
    config.setVideoSyncConfigName("电影同步");
    config.setVideoSyncConfigSource("pansou");
    config.setVideoSyncConfigKeyword("电影");
    config.setVideoSyncConfigCategory("电影");
    
    panSouVideoSourceProvider.fetchVideos(config, videoInfo -> {
        // 处理获取到的视频信息
        System.out.println("获取到视频: " + videoInfo.getVideoName());
    });
}
```

## SocketIO 实时推送功能

本模块集成了 SocketIO 实时消息推送功能，支持视频同步过程中的实时状态推送。

### 推送主题说明

#### 全局推送主题
- `/topic/video-sync/global` - 全局消息推送
- `/topic/video-sync` - 通用视频同步消息

#### 配置级推送主题
- `/topic/video-sync/config/{configId}` - 特定配置的消息推送

#### 用户级推送主题
- `/queue/video-sync` - 用户私有消息队列

### 消息类型

支持以下消息类型：
- `SYNC_START` - 同步开始
- `SYNC_PROGRESS` - 同步进度
- `SYNC_COMPLETE` - 同步完成
- `SYNC_ERROR` - 同步错误
- `VIDEO_PROCESSING` - 视频处理中
- `SYSTEM_NOTIFICATION` - 系统通知

### 使用示例

```java
@Autowired
private VideoSyncMessageService messageService;

// 发送全局消息
messageService.sendGlobalMessage(VideoSyncMessage.builder()
    .type(VideoSyncMessage.MessageType.SYSTEM_NOTIFICATION)
    .message("系统维护通知")
    .timestamp(LocalDateTime.now())
    .build());

// 发送配置级消息
messageService.sendConfigMessage("config123", message);

// 发送用户消息
messageService.sendUserMessage("user123", message);

// 发送同步开始消息
messageService.sendSyncStartMessage("config123", "电影同步任务");

// 发送同步进度消息
messageService.sendSyncProgressMessage("config123", "电影同步任务", 50, 100);
```

### 前端连接示例

```javascript
// 连接 SocketIO 服务器
const socket = io('http://localhost:8080');

// 监听全局消息
socket.on('/topic/video-sync/global', (message) => {
    console.log('收到全局消息:', message);
});

// 监听特定配置消息
socket.on('/topic/video-sync/config/config123', (message) => {
    console.log('收到配置消息:', message);
});

// 监听用户私有消息
socket.on('/queue/video-sync', (message) => {
    console.log('收到用户消息:', message);
});
```

## 注意事项

1. **网络环境**：PanSou 服务可能需要特定的网络环境才能正常访问
2. **API 限制**：请合理使用 API，避免过于频繁的请求
3. **缓存机制**：系统内置缓存机制，重复搜索会优先使用缓存结果
4. **异步处理**：支持异步搜索模式，可以更快获得响应
5. **插件配置**：可以根据需要启用或禁用特定的搜索插件

## 依赖要求

- Spring Boot 2.x+
- MyBatis Plus
- Jackson
- Lombok
- SocketIO Support (com.chua:spring-support-socketio-starter)
- Swagger (可选)

## 更新日志

### v1.1.0 (2024-12-19)
- 🆕 新增 PanSou 网盘搜索功能
- 🆕 新增 PanSouResourceProvider 资源提供者
- 🆕 新增 PanSouVideoSourceProvider 视频源提供者
- 🆕 新增 PanResource 网盘资源实体类
- 🆕 新增 PanType 网盘类型枚举
- 🆕 新增 PanSouConfig 配置类
- 🆕 新增 SocketIO 实时消息推送功能
- 🆕 新增 VideoSyncMessage 消息实体类
- 🆕 新增 VideoSyncMessageService 消息推送服务
- ✨ 支持多种网盘类型的资源搜索
- ✨ 支持异步搜索和缓存机制
- ✨ 支持智能排序和结果过滤
- ✨ 支持视频同步过程的实时消息推送
- ✨ 支持 SocketIO 协议的实时通信

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 相关链接

- [Spring Boot 官方文档](https://spring.io/projects/spring-boot)
- [MyBatis Plus 官方文档](https://baomidou.com/)
- [项目源码](https://github.com/your-repo/spring-api-support-common-video-starter)

## 技术支持

如果您在使用过程中遇到问题，请通过以下方式联系我们：

- 提交 Issue：[GitHub Issues](https://github.com/your-repo/spring-api-support-common-video-starter/issues)
- 邮箱：support@example.com
- QQ群：123456789

## 开发团队

- 作者：CH
- 版本：v1.1.0
- 更新时间：2024-12-19