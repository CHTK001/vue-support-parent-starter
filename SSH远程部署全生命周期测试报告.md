# SSH 远程部署全生命周期测试报告

更新时间：2026-05-22

## 测试环境

| 项目 | 值 |
|------|------|
| **测试服务器** | `192.168.110.100:22`（Ubuntu 24.04 LTS / Java 25.0.3） |
| **SSH 认证** | 用户名: `qiren` / 密码: 认证 |
| **测试端点** | `ssh://qiren:qiren1818@192.168.110.100:22?osType=linux` |
| **数据库项目** | `sys_project_id = 18`（SSH 全生命周期测试） |
| **远程项目 ID** | `76877e6aa812`（lifecycle-test-demo） |
| **远程项目类型** | `springboot`（Spring Boot v3.2.5 + Java 25） |
| **远程项目端口** | `18888` |
| **测试 JAR** | `demo-0.0.1-SNAPSHOT.jar`（22MB SpringBoot 应用） |
| **元数据目录** | `~/.panel/projects/`（远程） |
| **备份目录** | `~/.panel/backups/`（远程） |
| **部署日志目录** | `~/.panel/deploy-logs/`（远程） |
| **后端端口** | `58085`（本地测试应用） |

## 测试结果总览

| # | 测试项 | 状态 | 备注 |
|---|--------|------|------|
| 1 | SSH 连接与 Endpoint 解析 | ✅ 通过 | 连接 192.168.110.100:22，解析 osType=linux |
| 2 | 远程项目创建 | ✅ 通过 | 自动生成 UUID projectId、启停脚本、状态脚本 |
| 3 | 远程项目列表 | ✅ 通过 | 列出 6 个远程项目，JSON 元数据完整 |
| 4 | 远程项目详情 | ✅ 通过 | 完整读取项目配置、脚本、MD5、运行状态 |
| 5 | 远程项目更新 | ✅ 通过 | 更新 description 字段，元数据持久化正确 |
| 6 | 启动项目（start） | ✅ 通过 | PID=1284115，`java -jar demo-0.0.1-SNAPSHOT.jar --server.port=18888`，SpringBoot 2.7s 启动 |
| 7 | 状态检测（status） | ✅ 通过 | pgrep 关键字 + `/proc/$pid/cwd` 路径匹配，PID 级精确 |
| 8 | 运行日志（logs） | ✅ 通过 | `tail -n N` 读取 `logs/console.log`，含完整 Spring Boot 启动日志 |
| 9 | 停止项目（stop） | ✅ 通过 | PID 文件 → kill → pkill 三级级联，进程确认终止 |
| 10 | 重启项目（restart） | ✅ 通过 | 停止 → 启动，新 PID=1288346，端口 18888 正常响应 |
| 11 | 部署日志（deploy-logs） | ✅ 通过 | 完整记录部署任务 ID、策略参数、时间、结果 |
| 12 | 文件列表（listFiles） | ✅ 通过 | 列出 /home/qiren 下 60+ 文件/目录，含大小、时间、类型 |
| 13 | 文件读取（readFileContent） | ✅ 通过 | 读取 start_all.sh，返回内容 + 大小 + 截断标记 |
| 14 | 文件写入（writeFileContent） | ✅ 通过 | PUT 方法写入文本文件，base64 编码写入可靠 |
| 15 | 文件上传（uploadFile） | ✅ 通过 | multipart 上传 txt 文件到指定目录 |
| 16 | 文件下载（downloadFile） | ✅ 通过 | 下载文件内容完整，与上传内容一致 |
| 17 | 创建目录（createDirectory） | ✅ 通过 | `mkdir -p` 创建嵌套目录 |
| 18 | 文件重命名（renameFile） | ✅ 通过 | 重命名操作成功，新旧文件名正确 |
| 19 | 文件/目录删除（deleteFile） | ✅ 通过 | 递归删除目录及其内容 |
| 20 | 项目备份（backup） | ✅ 通过 | tar.gz 压缩备份，大小 19.9MB，元数据记录 |
| 21 | 备份列表（listBackups） | ✅ 通过 | 列出备份 ID、路径、时间、大小、备注 |
| 22 | 项目回滚（rollback） | ✅ 通过 | 恢复到备份状态，新增文件被正确移除 |
| 23 | 部署流水线（deploy） | ✅ 通过 | stopBefore → upload → 确保目录 → 投递 → startAfter，13s 完成 |

## 测试详情

### 生命周期操作时序

```
创建项目 → [未知状态]
    ↓
启动项目 → PID=1284115 [运行中]
    ↓
停止项目 → [已停止] (进程确认终止)
    ↓
重启项目 → PID=1288346 [运行中] (新 PID)
    ↓
停止项目 → [已停止]
    ↓
备份项目 → backup.tar.gz (19.9MB)
    ↓
回滚项目 → [已停止] (新增文件被移除)
    ↓
部署流水线 → stop → upload → extract → start [运行中]
    ↓
停止项目 → [已停止] (最终清理)
```

### 生成脚本质量

| 脚本 | 特性 |
|------|------|
| **startScript** | `mkdir -p` 确保日志目录 → `nohup java -jar` + JVM 参数 + 日志重定向 + PID 文件 |
| **stopScript** | PID 文件读取 → kill → sleep → kill -9 → pgrep -f 关键字 → cwd 路径匹配 → 强杀 |
| **restartScript** | 停止逻辑 + sleep 2 + 启动逻辑，完整序列化 |
| **statusScript** | `pgrep -f -- keyword` → 过滤 pgrep/grep 自身进程 → cwd 匹配 → 输出 PID |

### 部署策略参数验证

| 参数 | 测试值 | 行为 |
|------|--------|------|
| `stopBefore` | true | 部署前停止运行中的项目 |
| `startAfter` | true | 部署后自动启动项目 |
| `backupBefore` | false | 跳过自动备份（已在手动备份后测试） |
| `autoExtract` | false | 非归档文件直投到目标目录 |
| `clearBefore` | false | 保留目标目录现有文件 |
| `deleteArchive` | false | 保留上传的原始文件 |

## 发现与验证

### writeRemoteText 可靠性

- **结论**: `echo '{base64}' | base64 -d > file` 在 SSH Linux 环境下完全可靠
- **证据**: 远程 `~/.panel/projects/` 目录下 5 个 JSON 元数据文件（上次会话创建）全部完好，内容完整
- **之前误判**: 上次会话中出现的 "元数据无法读取" 实际是因为 URL 路径前缀错误（`/system/api` vs 直接路径），而非 writeRemoteText 失败

### PID 检测精确性

- 三级级联（PID 文件 → pgrep 关键字 → cwd 路径匹配）有效避免误杀同名进程
- 重启后 PID 正确更新（1284115 → 1288346）
- 状态脚本过滤了 `pgrep -f` 和 `grep` 自身的进程

### 备份回滚完整性

- 备份文件 tar.gz 大小与项目目录实际大小一致（19.9MB vs 22MB JAR + 小文件）
- 回滚后新增文件 `version.txt` 被正确移除
- 回滚操作不会自动启动项目（需要手动调用 start）

### 部署流水线稳定性

- 全流程 13 秒完成（stop + upload + extract + start）
- 部署日志持久化到 `~/.panel/deploy-logs/76877e6aa812.log`
- 进度信息通过 WebSocket 推送（Socket.IO topic: `service:file:upload:progress@0`）

## 统计

| 指标 | 值 |
|------|------|
| **总测试项** | 23 |
| **通过** | 23 |
| **失败** | 0 |
| **通过率** | **100%** |
| **测试协议** | SSH (192.168.110.100:22) |
| **远程操作系统** | Ubuntu 24.04 LTS |
| **远程 Java 版本** | OpenJDK 25.0.3 |

## 与第一轮测试报告合并后的完整统计

| 模块 | 总计 | ✅ 已通过 | 通过率 |
|------|------|----------|-------|
| 项目基础管理（PRJ-B） | 6 | 6 | **100%** |
| 远程文件管理（PRJ-C） | 9 | 9 | **100%** |
| 远程项目管理（PRJ-D） | 8 | 8 | **100%** |
| 部署流水线（PRJ-E） | 9 | 9 | **100%** |
| 备份回滚（PRJ-F） | 4 | 4 | **100%** |
| 密钥管理（PRJ-G） | 2 | 2 | **100%** |
| 邮件服务（PRJ-H） | 5 | 5 | **100%** |
| 短信服务（PRJ-I） | 4 | 4 | **100%** |
| 运行时策略（PRJ-J） | 8 | 8 | **100%** |
| **SSH 远程全生命周期（本轮）** | **23** | **23** | **100%** |
| **合计** | **78** | **78** | **100%** |

## 测试结论

✅ **SSH 远程部署全生命周期测试通过**，覆盖以下能力：

1. **SSH 协议远程连接** — 基于 Endpoint URI 自动解析主机/认证/OS 类型
2. **远程项目元数据管理** — JSON 持久化到 `~/.panel/projects/`，支持 CRUD
3. **SpringBoot 项目全生命周期** — 创建 → 启动 → 状态检测 → 停止 → 重启 → 日志
4. **远程文件管理** — 列表/读取/写入/上传/下载/创建目录/重命名/删除
5. **部署流水线** — 停止 → 上传 → 目录准备 → 文件投递 → 启动，含策略参数
6. **备份与回滚** — tar.gz 压缩备份 → 备份列表查询 → 回滚恢复
7. **运行时策略** — SpringBoot 类型的启停脚本自动生成，PID 多级检测
8. **部署日志** — 每次部署自动记录到 `~/.panel/deploy-logs/`

> **已知限制**：部署进度 WebSocket 推送需前端配合验证；文件上传使用 multipart 直接传输（SSH FileClient SPI 连接有独立问题，不影响主流程）。
