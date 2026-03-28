# vue-support-parent-starter 单元测试与回归验证说明

## 目标

覆盖本轮重点链路，保证前端可编译、WASM 加解密可用、sign 开关正确、水印正常、关键业务页可加载。

## 构建验证

在项目根目录执行：

```bash
pnpm build
```

通过标准：

- 所有 workspace 包完成构建
- `apps/vue-support-spring-pages-starter` 不再因 `NODE_OPTIONS` 被子脚本覆盖而 OOM

## WASM 加解密验证

验证点：

- `wasmEnable: true` 时请求链路必须成功初始化 WASM
- 前端开启请求加密后，请求可正常发送，页面不出现系统异常
- 前端加解密走 WASM，不回退到普通 JS 实现

建议检查：

- 登录后打开系统管理相关页面，触发真实接口请求
- 浏览器 `console` 无 WASM 初始化失败、解密失败、系统异常类报错
- 浏览器 `errors` 为空

## 请求加密与响应加密验证

验证点：

- 前端请求加密开关打开时，请求仍可成功
- 后端可根据配置决定返回加密或不加密数据
- 前端根据响应头判断是否为加密数据，并完成正确解密
- 响应加密开关实时切换后，请求结果与页面展示保持正常

建议检查：

- 打开加密开关后访问登录、模块管理、租户管理页面
- 关闭加密开关后再次访问相同页面
- 页面数据可正常展示，无解密异常、无白屏、无系统异常提示

## sign 验证

验证点：

- 前端存在 sign 计算开关
- 开关打开时，前端计算 sign 并随请求发送
- 开关关闭时，不再发送 sign
- 后端根据请求是否携带 sign 做合法性校验

建议检查：

- 分别在 sign 开启和关闭场景访问真实接口
- 请求均返回符合预期结果
- 非法 sign 请求会被后端拒绝

## 水印验证

验证点：

- 前后端水印功能启用时页面出现水印
- 关闭后水印消失
- 水印切换不影响页面主功能和接口请求

建议检查：

- 登录后检查主体框架与业务页
- 切换配置后刷新页面，确认水印展示状态正确

## 页面回归

建议优先使用 `agent-browser` 做浏览器回归。

必测页面：

- `/#/login`
- `/#/service/module`
- `/#/service/service`
- `/#/service/tenant`

通过标准：

- 页面主体结构可见
- 表单、筛选区、表格或卡片区域加载正常
- `console` 无新的 `warning`
- `errors` 为空

## 已修复的典型问题

- `ScHeader` 包入口错误，导致全局注册失效
- `ScHeader` 默认分支错误递归渲染自身，应使用 `ElHeader`
- 服务管理筛选项使用 `null` 作为 `ElOption` 的 `value`，触发 prop 类型告警
- 错误页 `style` prop 命名冲突
- `ScPagination` 包装组件递归渲染自身
- i18n 缺失 `message.confimDelete`
- 路由缺页与 `/home`、`/` no-match 警告已做运行时降噪

## 回归命令建议

```bash
pnpm build
agent-browser --session qa-check open http://127.0.0.1:8848/#/login
```

浏览器验证时建议补充：

- `agent-browser --session qa-check console --json`
- `agent-browser --session qa-check errors --json`

## 结论标准

只有同时满足以下条件才算通过：

- 前端构建成功
- 登录成功
- 主体框架正常
- 关键业务页正常加载
- WASM 加解密成功
- sign 开关行为正确
- 响应加密正常
- 水印正常
- 浏览器无新增报错与关键告警

## 2026-03-28 monitor 联调补充

环境与入口：

- 测试环境入口为 `http://172.16.0.40/monitor/`
- Nginx 已代理 `/monitor/api/ -> 127.0.0.1:19170`，`/socket.io/ -> 127.0.0.1:29181`
- 浏览器实测登录账号 `sa` 可进入系统

接口与实时能力：

- `GET /monitor/api/v2/user/me` 返回 `00000`
- `GET /monitor/api/v2/user/menu` 返回 `00000`
- `GET /socket.io/?EIO=4&transport=polling` 已完成握手，说明全局 socket 默认链路可用
- 当前设置接口返回 `SocketOpen=true`、`SocketProtocol=socketio`、`SocketPath=/socket.io`
- 前端已支持 `SocketOpen=false` 时完全不创建全局 socket，支持 `SocketStartupConnect=false` 时注入但启动不自动连接

Docker 可视化联调：

- `/#/docker/images`、`/#/docker/containers`、`/#/docker/registry`、`/#/docker/soft` 已能访问
- 本轮修复 `/#/docker/records` 缺路由导致的 `404`
- 本轮补齐 `/docker/monitoring`、`/docker/detail/:id`，并兼容旧 `/soft/*` 地址
- `route-menu.ts` 已从失效的 `/soft/*`、`/docker/list` 映射切换到实际可访问的 docker 页面
- `system-soft-image/page`、`system-soft-container/page`、`system/soft/record/page` 在当前环境返回 `00000`，但数据为空，属于环境数据状态，不是前端链路错误

安全链路检查：

- 前端签名、请求加密、响应解密实现已存在于 `packages/utils/src/http` 与 `packages/utils/src/crypto/codec.ts`
- 后端对应签名校验、请求解密、响应加密能力已存在于 `spring-support-common-starter`
- 前端防调试逻辑已存在于 `packages/utils/src/debug/index.ts`
- 水印逻辑已存在于 `packages/core/src/store/modules/ConfigStore.ts` 与 `layout/default/src/hooks/useWatermarkSetup.ts`
- 当前测试环境设置接口未返回 `WatermarkOpen`、`LoopDebuggerOpen`、`CrashPageOpen` 等开关项，因此本轮主要确认代码链路存在，是否启用取决于运行时配置
- monitor 全局 socket 已改为接口配置优先：
  - `OpenSetting=true` 时优先等待 `/v2/setting/list?sysSettingGroup=config`
  - `OpenSetting=false` 或配置拉取失败时才回退本地 `app.yaml`

已发现并修复/定位的问题：

- 前端 `docker/records` 页面存在未定义 `loadRecords` 的脚本缺口，本轮已补上
- 后端 `spring-support-oauth-client-starter` 登录失败场景会因空 token 触发 `LoginResult.setToken` 非空异常，本轮已修复为按真实认证结果返回错误信息，不再错误抛 NPE
- `GET /monitor/api/v1/system/soft/websocket/topics` 与 `GET /monitor/api/api/monitor/system-soft-websocket/topics` 当前仍返回 `S9999C0000`，前端已有 fallback 兜底默认 topic，但后端接口本身仍需继续排查

最新本地回归结果：

- `vitest`：7 个文件、23 个测试通过
- 新增覆盖：
  - `monitor-global-socket-bridge.test.ts` 验证远程配置优先
  - `monitor-global-socket-bridge.test.ts` 验证 `OpenSetting=false` 本地 socket 兜底
- `apps/vue-support-monitor-starter` 执行 `pnpm build` 通过
