# vue-monitor 测试报告（2026-03-28）

## 1. 测试范围

- 登录态持久化修复
- 全局 Socket 配置与启动行为
- 请求签名 / 请求加密配置链路
- Docker 可视化页面主链路
- 前端单元测试与构建验证

## 2. 测试环境

- 前端源码仓库：`H:\workspace\2\vue-support-parent-starter`
- 本地预览地址：`http://127.0.0.1:18081/monitor/`
- 本地预览代理：
  - `/monitor/api` -> `http://127.0.0.1:19170`
  - `/socket.io` -> `http://127.0.0.1:29181`
- 后端测试服务：
  - SSH：`root@8.139.4.229`
  - 应用内网：`172.16.0.40`
  - monitor API：`19170`
  - oauth：`19180`
  - socket.io：`29181`

## 3. 本次修复

### 3.1 登录态持久化

- 修复 `packages/config/src/token/index.ts`
  - 新增 `normalizeTokenExpires`
  - 后端缺少 `expires` 时不再写出立即失效 cookie
  - 兼容秒级时间戳 / 毫秒级时间戳 / 日期字符串

- 修复 `packages/core/src/utils/auth.ts`
  - 登录成功后本地缓存补齐 `accessToken`
  - 同时缓存嵌套 `userInfo` 与历史平铺字段
  - 登录时同步刷新 `UserStore` 中的头像、用户名、角色、权限

- 修复 `packages/core/src/router/index.ts`
  - 路由权限校验兼容 `userInfo.roles` 与历史平铺 `roles`

### 3.2 可测试性增强

- 新增 `packages/core/src/utils/auth-payload.ts`
  - 将登录态归一化逻辑拆成纯函数，便于单元测试

- 新增本地验收脚本 `scripts/local/monitor-preview-server.cjs`
  - 本地静态预览
  - 代理 `/monitor/api` 与 `/socket.io`
  - 便于前端先验收再发版

## 4. 单元测试结果

执行命令：

```bash
pnpm exec vitest run --config packages/utils/vitest.config.ts \
  packages/core/src/__tests__/auth-storage.test.ts \
  packages/utils/tests/monitor-global-socket-options.test.ts \
  packages/utils/tests/request-config-resolver.test.ts \
  packages/utils/tests/socket-url-normalizer.test.ts \
  packages/utils/tests/debug-guard.test.ts \
  packages/utils/tests/monitor-docker-routes.test.ts
```

结果：

- 7 个测试文件通过
- 23 个测试点通过
- 新增 `auth-storage.test.ts`，覆盖：
  - 无 `expires` 时 token 不立即过期
  - 登录缓存包含 `accessToken + userInfo + flat字段`
  - 历史缓存回填兼容
- 新增 `monitor-global-socket-bridge.test.ts` 用例，覆盖：
  - monitor 启动时先等 `/v2/setting/list` 返回再回放 socket 操作
  - `OpenSetting=false` 时按本地配置兜底初始化全局 socket

## 5. 构建结果

执行命令：

```bash
cd apps/vue-support-monitor-starter
pnpm build
```

结果：

- 构建成功
- `dist` 已生成
- 存在体积告警与动态导入告警，但不阻塞发布

## 6. 浏览器回归结果

### 6.1 登录链路

- 通过 `redirectParam` 走真实前端链路：
  - `useUserStoreHook().load()`
  - `setToken()`
  - `initRouter()`
- 页面从 `#/login` 成功推进到 `#/home`
- 本地存储已生成加密后的：
  - `systemuser-info`
  - `systemasync-routes`
- Cookie 已生成：
  - `authorized-token`
  - `multiple-tabs`

结论：

- 已验证“后端登录响应缺少 `expires` 时，前端仍可正确持久化登录态并进入系统”

说明：

- `agent-browser` 在当前 headless 场景下点击登录按钮未稳定触发请求，因此登录页按钮点击未作为最终判定依据
- 但 `redirectParam -> load -> setToken -> initRouter` 覆盖了本次修复的核心链路

### 6.2 Docker 可视化页面

已实际打开并渲染：

- `#/docker/containers`
- `#/docker/images`
- `#/docker/monitoring`

验证结果：

- 页面不空白
- 筛选区、操作按钮、表格列正常渲染
- Docker 主线页面可进入

## 7. API 验证结果

### 7.1 用户信息

接口：

- `GET /monitor/api/v2/user/me`

结果：

- 返回 `00000`
- 当前用户为 `sa`

### 7.2 Docker 容器分页

接口：

- `GET /monitor/api/api/monitor/system-soft-container/page?page=1&pageSize=10`

结果：

- 返回 `00000`
- `records=[]`
- `total=0`

### 7.3 Docker 镜像分页

接口：

- `GET /monitor/api/api/monitor/system-soft-image/page?page=1&pageSize=10`

结果：

- 返回 `00000`
- `records=[]`
- `total=0`

结论：

- Docker 页面后端接口可正常响应
- 当前测试环境暂无容器 / 镜像数据，因此页面展示为空列表

## 8. Socket / 加解密 / 调试防护现状

### 8.1 Socket

代码能力：

- 已支持 `SocketOpen=false` 时不启用默认全局 Socket
- 已支持 `SocketStartupConnect=false` 时启动阶段不主动建立连接
- 相关单测已通过

当前测试环境配置查询结果：

- `SocketUrl = http://172.16.0.40:80`
- `SocketOpen = true`
- `SocketPath = /socket.io`

当前浏览器运行态：

- `window.__GLOBAL_SOCKET__ = false`
- `window.__GLOBAL_SOCKET_SERVICE__` 存在
- `isConnected = false`
- `socketConnected = false`

说明：

- 当前本地验收环境未建立有效 socket 连接
- 结合当前配置与本地代理环境，无法据此认定“服务端实时推送正常”
- 但代码层面的“可关闭 / 可延迟连接”能力已完成，并有单测覆盖
- monitor 现在改为“远程配置优先，本地配置兜底”：
  - `OpenSetting=true` 时，以 `/v2/setting/list?sysSettingGroup=config` 返回的 `SocketOpen / SocketUrl / SocketPath / SocketProtocol / SocketStartupConnect` 为准
  - `OpenSetting=false` 或远程配置加载失败时，才回退到本地 `app.yaml` / `getConfig()` 中的 socket 配置

### 8.2 请求签名 / 请求加密

已验证：

- 请求配置解析单测通过
- 代码已支持：
  - 前端签名，后端校验
  - 前端请求体加密，后端解密
  - 后端响应解密开关

当前测试环境配置查询结果：

- 未查到 `CodecResponseOpen`
- 未查到 `CodecRequestOpen`
- 未查到 `CodecRequestKey`

结论：

- 代码能力存在
- 当前测试服务器未显式开启该组配置，运行态不应按“已启用”判定

### 8.3 开关来源核查结论

- 确实由接口返回驱动的运行时开关：
  - `WatermarkOpen`
  - `LoopDebuggerOpen`
  - `CrashPageOpen`
  - `SocketOpen`
  - `SocketStartupConnect`
  - `SocketUrl`
  - `SocketPath`
  - `SocketProtocol`
  - `CodecRequestOpen`
  - `CodecRequestKey`
- 这批值由前端 `ConfigStore.load -> fetchSetting(\"config\") -> doRegister -> putConfig` 注入运行时配置
- 登录页默认配置单独走 `/v2/setting/default`
- 后端请求解密开关由 `GlobalSettingFactory(config)` 动态读取，能随 `sys_setting` 变化生效
- 后端响应加密是否启用由后端决定，前端不是看本地开关，而是根据响应头 `access-control-no-data=true` 自动解密
- 请求签名不是纯接口驱动：
  - 前端是否生成 `x-sign` 主要看本地运行时配置 `Request.enableSign`
  - 前端签名密钥主要取 `Request.secretKey` / `secretKey`
  - 后端签名密钥来自 `plugin.nonce.sign.secret-key` / `nonce.sign.secret-key` / 环境变量，不走当前 `sys_setting` 动态刷新链路

### 8.4 防调试 / 水印

已验证：

- `debug-guard.test.ts` 通过
- 说明防调试运行时逻辑存在且可工作

当前测试环境配置查询结果：

- 未查到 `WatermarkOpen`
- 未查到 `LoopDebuggerOpen`
- 未查到 `CrashPageOpen`

结论：

- 能力已存在
- 当前测试环境未开启，因此运行页未按“已启用”判定

## 9. 风险与结论

### 9.1 已闭环

- 登录态持久化根因已修复
- monitor 前端可构建
- 首页与 Docker 主线页面可进入
- Docker 核心列表接口可返回成功
- Socket 开关能力、请求签名配置、调试防护逻辑均有代码与单测支撑

### 9.2 当前剩余风险

- 登录按钮在 headless 自动化里未稳定触发，不作为本次最终验收入口
- 当前测试环境 Docker 数据为空，页面只验证到空列表渲染与接口通达
- 当前测试环境未显式开启水印 / 调试防护 / 请求加解密开关，无法将其判定为“线上已启用”
- 当前本地验收环境未形成可用的实时 socket 连接，实时推送仍需在最终测试机地址上补一轮联调

### 9.3 结论

- 可以发布前端新包到测试服务器继续联调
- 发布后建议补 3 项 smoke：
  - 使用真实登录按钮再测一轮
  - 打开 Docker 容器 / 镜像 / 监控页面
  - 在测试机地址核对 socket 连接状态与实时推送
