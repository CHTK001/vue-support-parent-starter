# vue-monitor 安全链路与配置热重载单元测试文档

更新日期：2026-03-28

## 1. 目标

本次文档只覆盖本轮最关键的 3 类问题：

- 三大安全链路前后端是否一致并可正常工作
- 后台下发给前端的配置是否真的支持热重载
- `vue-support-monitor-starter` 当前前端包是否能通过关键单元测试与生产构建

## 2. 测试范围

- 前端签名 -> 后端验签
- 前端请求加密 -> 后端请求解密
- 后端响应加密 -> 前端响应解密
- 配置版本通知 -> 前端配置热重载
- monitor 默认全局 socket 启动配置
- 防调试运行时
- Docker 可视化关键路由
- monitor 前端生产构建

## 3. 测试环境

- 前端仓库：`H:\workspace\2\vue-support-parent-starter`
- 后端仓库：`H:\workspace\2\spring-support-parent-starter`
- 文档对应前端应用：`apps/vue-support-monitor-starter`
- 测试方式：
  - 代码链路分析
  - Vitest 合约测试
  - monitor 前端生产构建

说明：

- 本文结论以“前后端代码契约 + 本地单元测试 + monitor 构建”作为判定依据
- 本文不把“测试环境上某个开关当前是否打开”与“代码链路是否实现”混为一谈

## 4. 三大安全链路结论

### 4.1 前端签名 -> 后端验签

前端实现位置：

- `packages/utils/src/http/sign.ts`
- `packages/utils/src/http/index.ts`

后端实现位置：

- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/utils/NonceUtils.java`
- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/configuration/ApiFilterConfiguration.java`
- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/decode/ApiRequestDecodeBodyAdvice.java`

链路说明：

- 前端请求阶段会补齐 `x-nonce`、`x-timestamp`、`x-req-fingerprint`、`x-sign`
- 前端签名算法为：
  - `sign = MD5(nonce + fingerprint + timestamp + paramsMd5 + secretKey)`
- 后端 `NonceXhrFilter` 与 `ApiRequestDecodeBodyAdvice` 都会复用 `NonceUtils.validateXhrRequest()` 做验签与防重放

已验证内容：

- `request-sign-contract.test.ts` 验证请求参数收集规则与后端 `NonceUtils.collectParams()` 一致
- `request-sign-contract.test.ts` 验证签名公式与后端 `NonceUtils.generateSign()` 一致

结论：

- 该链路代码契约正常
- 该链路的前后端算法已对齐

边界说明：

- 前端是否生成签名，主要受运行时配置 `Request.enableSign` 控制
- 前端签名密钥主要取 `Request.secretKey`，其次兼容顶层 `secretKey`
- 后端签名密钥来自 `plugin.nonce.sign.secret-key` / `nonce.sign.secret-key` / 环境变量
- 后端签名密钥当前不是走 `sys_setting` 动态热更新链路，这一点必须单独说明

### 4.2 前端请求加密 -> 后端请求解密

前端实现位置：

- `packages/utils/src/crypto/codec.ts`
- `packages/utils/src/http/config-resolver.ts`

后端实现位置：

- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/decode/ApiRequestDecodeBodyAdvice.java`
- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/decode/ApiRequestDecodeRegister.java`
- `spring-support-api-parent/spring-api-support-common-service-starter/src/main/java/com/chua/starter/service/impl/SysSettingServiceImpl.java`

链路说明：

- 前端 `uu2()` 在请求发送前判断是否需要加密
- 仅对 JSON 请求体、指定 HTTP 方法、且非 `/v2/setting/*` 接口执行请求体加密
- 加密后请求体会改写为 `{ data: <cipher> }`
- 后端 `ApiRequestDecodeBodyAdvice` 根据 `access-control-origin-key` 头判断是否走请求解密
- 后端 `ApiRequestDecodeRegister` 每次取 `GlobalSettingFactory(config)` 当前值，决定是否开启请求解密以及使用哪个密钥

已验证内容：

- `codec-contract.test.ts` 验证开启请求加密后 JSON 请求体会被加密
- `codec-contract.test.ts` 验证 `/v2/setting/list` 等运行时配置接口不会被错误加密
- `request-config-resolver.test.ts` 验证 `CodecRequestOpen` / `CodecRequestKey` 与 `Request.enableEncrypt` / `Request.codecRequestKey` 的解析兼容逻辑

结论：

- 该链路代码契约正常
- 后端请求解密开关与密钥具备随 `sys_setting(config)` 变化生效的能力

边界说明：

- 已经发出的请求不会被追溯重加密
- 配置变更后，从“下一次请求”开始按新规则生效

### 4.3 后端响应加密 -> 前端响应解密

后端实现位置：

- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/encode/ApiResponseEncodeResponseBodyAdvice.java`
- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/encode/ApiResponseEncodeRegister.java`

前端实现位置：

- `packages/utils/src/crypto/codec.ts`

链路说明：

- 后端开启响应加密后，会把响应改成二进制输出
- 后端同时写入头 `access-control-no-data=true`
- 前端 `uu1()` 不是看本地开关决定要不要解密，而是根据响应头判断
- 只有响应头明确标记加密时，前端才进入统一解密器

已验证内容：

- `codec-contract.test.ts` 验证普通响应不会误入解密器
- `codec-contract.test.ts` 验证带 `access-control-no-data=true` 的响应会交给统一解密器处理

结论：

- 该链路代码契约正常
- 响应是否解密以“后端响应头”为准，不以“前端本地开关”为准

边界说明：

- 前端 `ConfigStore` 虽然保留了 `CodecResponseOpen` 默认配置位，但前端真正是否解密，最终还是由响应头决定

## 5. 配置热重载分析结论

### 5.1 热重载主链路

后端版本通知位置：

- `spring-support-common-starter/src/main/java/com/chua/starter/common/support/api/configuration/ApiFilterConfiguration.java`

前端热重载位置：

- `packages/utils/src/http/index.ts`
- `packages/config/src/config/index.ts`
- `packages/core/src/store/modules/ConfigStore.ts`
- `packages/core/src/store/modules/SettingStore.ts`

热重载执行顺序：

1. 后端每个响应头写入 `x-response-version`
2. 前端 HTTP 响应拦截器读取 `x-response-version`
3. 前端 `upgrade(version)` 更新本地版本号并派发 `repo-config-version-change`
4. `ConfigStore` 监听该事件后执行 `reset() -> load()`
5. `load()` 重新请求 `/v2/setting/list?sysSettingGroup=config`
6. `doRegister()` 把远程配置写入运行时配置，并对已经被后台删除的配置恢复到本地基线值

已验证内容：

- `config-store-hot-reload.test.ts` 验证版本变更事件会触发配置重载
- `config-store-hot-reload.test.ts` 验证后台配置移除后，前端会把旧覆盖值清回初始化基线
- `runtime-config-reactive.test.ts` 验证 `putConfig()` 后，`computed(() => getConfig().Title)` 会随之更新
- `runtime-config-reactive.test.ts` 验证 `RemoteLayout / LocationLayout` 这类运行时布局开关会触发依赖它们的计算属性重新求值
- `BaseTool.spec.ts` 验证 `ShowBarSearch` 与 `PageBehavior.showHeaderClock` 改变后，顶部壳层组件会立即重新渲染
- `ThemeStoreRuntimeConfig.spec.ts` 验证性能监控相关默认值在“无本地覆盖”时会跟随后台运行时配置变化，在“有本地覆盖”时不会被后台值覆盖
- 已额外对 `sidebar/drawer/custom-menu` 整批入口做脚本级 SFC 定向编译检查，确认新补的 `computed` / `emitter` 改法无语法错误

结论：

- `config` 分组的版本通知与重载主链路正常
- 之前“只写 localStorage 不通知 store”的缺口已经补上
- 运行时 `config` 容器已改成响应式对象，依赖 `getConfig()` 的模板表达式和 `computed` 读取现在可以跟随配置更新
- layout 壳层里一批纯后台配置快照已经改成“本地设置覆盖优先，运行时配置响应式兜底”
- `themeStore` 中性能监控默认配置已补上“无本地覆盖时跟随运行时配置”的能力

### 5.2 已确认支持热重载的配置

下面这些配置已经进入 `ConfigStore.doRegister()` 明确处理分支：

| 配置项 | 生效方式 | 结论 |
| --- | --- | --- |
| `LoopDebuggerOpen` | 重载后立即开/关循环防调试 | 正常 |
| `CrashPageOpen` | 重载后立即开/关跳转式防调试 | 正常 |
| `WatermarkOpen` | 重载后立即清除并重新应用水印 | 正常 |
| `WatermarkColor` / `WatermarkAlpha` / `WatermarkRotate` | 依附水印重新应用 | 正常 |
| `SocketOpen` | 重载后立即创建或关闭全局 socket 服务 | 正常 |
| `SocketUrl` / `SocketPath` / `SocketProtocol` | 重载后立即重建默认全局 socket 配置 | 正常 |
| `SocketStartupConnect` | 重载后立即影响是否自动连接 | 正常 |
| `SystemName` | 通过 `SettingStore.setSetting(\"Title\")` 更新 | 部分实时 |
| `BaseUrl` | 更新运行时配置，后续 HTTP/SSE 按新值发送 | 下次请求/重连生效 |
| `ApiAddress` | 更新运行时配置，后续 HTTP/SSE 按新值发送 | 下次请求/重连生效 |
| `CodecRequestOpen` | 请求发起时按最新配置判断是否加密 | 下次请求生效 |
| `CodecRequestKey` | 请求发起时按最新密钥加密 | 下次请求生效 |
| `ShowBarSearch` | layout 顶部工具栏按最新配置重新渲染 | 正常 |
| `PageBehavior.showHeaderClock` | layout 顶部时钟入口按最新配置重新渲染 | 正常 |
| `ShowFpsMonitor` | `themeStore` 在无本地覆盖时按最新配置更新 | 正常 |
| `PerformanceMonitorLayout` | `themeStore` 在无本地覆盖时按最新配置更新 | 正常 |

### 5.3 不是“全量热重载”的部分

以下内容必须明确写清，否则结论会失真：

1. 不是所有后端配置都具备“页面无刷新立即响应式更新”能力。
2. 登录页默认配置走 `/v2/setting/default`，只在登录页挂载时拉一次，不走当前版本事件热重载链路。
3. 请求签名前端开关 `Request.enableSign` 与前端签名密钥 `Request.secretKey` 当前主要还是本地运行时配置路径，不是当前 `sys_setting(config)` 的标准热更新主链路。
4. 已经建立好的 socket、SSE、WebSocket 连接不会因为 `BaseUrl` / `ApiAddress` 改变而自动迁移，通常需要重连。
5. 仍有一部分“初始化后长期持有默认值”的 store / 页面逻辑没有完全纳入当前热重载主链路。

当前仍需额外注意的典型例子：

- `pages/common/login/index.vue`
- `layout/default/src/stores/themeStore.ts`

结论：

- “后台配置前端都能热重载”这个说法不成立
- 更准确的说法是：
  - `config` 分组已经具备版本驱动的重载能力
  - 运行时 `config` 自身已经具备响应式能力，模板直接读和 `computed(() => getConfig()...)` 的场景现在可以跟随变化
  - 但未重连的长连接、未接入当前热更新链路的登录默认配置，以及少量仍依赖初始化默认值的 store 逻辑，仍不会完整无刷新生效
  - 仍有一部分 UI 代码只会在重新渲染或刷新页面后体现变化

## 6. 单元测试命令与结果

执行命令：

```bash
pnpm exec vitest run --config packages/utils/vitest.config.ts \
  packages/config/tests/runtime-config-reactive.test.ts \
  packages/core/src/__tests__/auth-storage.test.ts \
  packages/core/src/__tests__/config-store-hot-reload.test.ts \
  packages/utils/tests/request-config-resolver.test.ts \
  packages/utils/tests/request-sign-contract.test.ts \
  packages/utils/tests/codec-contract.test.ts \
  packages/utils/tests/monitor-global-socket-options.test.ts \
  packages/utils/tests/monitor-global-socket-bridge.test.ts \
  packages/utils/tests/socket-url-normalizer.test.ts \
  packages/utils/tests/debug-guard.test.ts \
  packages/utils/tests/monitor-docker-routes.test.ts \
  packages/utils/tests/clock-worker.test.ts \
  layout/default/src/__tests__/ThemeStoreRuntimeConfig.spec.ts \
  layout/default/src/components/lay-setting/__tests__/index.spec.ts \
  layout/default/src/components/lay-tool/themes/__tests__/BaseTool.spec.ts
```

结果：

- 15 个测试文件通过
- 42 个测试点通过

覆盖点：

- 登录态存储与兼容
- 配置热重载
- 运行时配置响应式更新
- layout 壳层组件热重载
- theme store 默认值热更新
- 共享时钟调度
- 请求配置解析
- 前后端签名契约
- 请求/响应加解密契约
- monitor 默认全局 socket 选项与远程配置桥接
- socket URL 归一化
- 防调试运行时
- Docker 路由

测试中的预期日志：

- `codec-contract.test.ts` 会故意构造“普通响应误进解密器”的场景，控制台会出现一次 fallback 警告，这是测试设计的一部分
- `debug-guard.test.ts` 会故意触发防调试遮罩，也会打印一次提示日志
- `.vue` 组件测试现在已经接入 `@vitejs/plugin-vue` 与工作区别名；`BaseTool.spec.ts` 仍会打印 IndexedDB/Sass 相关环境日志，但不影响断言结果

## 7. monitor 构建结果

执行命令：

```bash
cd apps/vue-support-monitor-starter
pnpm build
```

结果：

- 生产构建通过
- `dist` 成功生成
- 仍存在现有的动态导入提示与大包体积告警，但不阻塞本次结论

## 8. 最终结论

### 8.1 已确认正常

- 前端签名 -> 后端验签链路正常
- 前端请求加密 -> 后端请求解密链路正常
- 后端响应加密 -> 前端响应解密链路正常
- `config` 分组版本通知 -> 前端重载主链路正常
- 运行时 `config` 响应式更新链路正常
- 顶部工具栏搜索入口与顶部时钟入口的组件级热更新已验证
- `themeStore` 性能监控默认值的热更新已验证
- monitor 关键单元测试通过
- monitor 前端生产构建通过

### 8.2 仍需明确的边界

- 请求签名密钥后端侧当前不走 `sys_setting` 热更新
- 登录页 `/v2/setting/default` 不是当前热重载链路的一部分
- `BaseUrl` / `ApiAddress` 之类配置更多是“下次请求或重连生效”
- 代码库中仍有部分页面在脚本里把 `getConfig()` 读成一次性快照，因此不能宣称“所有界面配置都能无刷新响应式热更新”

### 8.3 建议后续补强

- 把仍然直接读取 `getConfig()` 的 UI 入口逐步迁移到 store/computed
- 继续梳理 login 默认配置链路和其它仍依赖初始化默认值的 store 逻辑
- 如果需要让签名密钥也支持后台动态控制，需要补一条后端 `sys_setting -> NonceUtils secretKey` 的正式刷新链路
- 如果需要让登录页默认配置热更新，需要给 `/v2/setting/default` 引入独立版本通知或复用当前版本事件
