# vue-support-parent-starter 测试文档

> **项目**：vue-support-parent-starter（Vue 3 + Element Plus + Vite 8 monorepo）
> **测试日期**：2026-08-10
> **测试环境**：前端 dev server（`localhost:5173`）+ 后端 `localhost:18170`
> **测试工具**：Playwright + Chromium headless + 自定义 E2E 脚本

---

## 1 项目结构概览

### 1.1 应用层（apps/）

| 应用 | 说明 | 端口 | 核心依赖 |
|---|---|---|---|
| `vue-support-system-starter` | 系统管理后台（主应用） | 5173 | `@repo/system` / `@repo/message` |
| `vue-support-gateway-starter` | 网关管理（SSH/桌面/会议/远程控制） | 8091 | `@repo/gateway` / xterm / Guacamole |
| `vue-support-ai-starter` | AI 平台（对话/文生图/文生视频） | 8088 | `@pages/ai` |
| `vue-support-device-starter` | 设备管理（流媒体播放） | — | `@repo/device` / hls.js / flv.js |
| `vue-support-eduai-starter` | 教育 AI 系统 | — | `@repo/eduai` |
| `vue-support-spider-starter` | 爬虫编排调度 | — | 独立极简（无 theme/pinia 依赖） |
| `vue-support-template-starter` | 模板脚手架 | — | 最小依赖（用于参考复制） |

### 1.2 包层（packages/）

| 包 | 说明 | 核心功能 |
|---|---|---|
| `@repo/core` | 核心逻辑 | `createApp` 装配、`loadDefaultSetting`、HTTP 加密/签名、crypto wasm、socket、monitor |
| `@repo/config` | 配置管理 | `getConfig` / `setConfig` / `loadConfig` / YAML 解析 / 版本热重载 |
| `@repo/utils` | 通用工具 | `Http` 链式请求、`StorageWrapper`（AES 加密）、日志、触发器 |
| `@repo/pinia` | 状态管理 | user/auth/global/tabs/keepAlive/message 6 个 store |
| `@repo/theme` | 主题引擎 | koi（8 种布局 + 8 种登录样式）、pureadmin |
| `@repo/ui` | UI 组件库 | 74 个 Re- 组件（ReTable/ReForm/ReChat/ReGraph3D/ReAvatarCrop 等） |
| `@repo/languages` | 国际化 | zh.ts / en.ts，`translateConfigText` |
| `@repo/assets` | 静态资源 | SVG sprite、logo、图片、字体 |
| `@repo/work` | 后台 Worker | 多时区定时器（Web Worker，每秒推送） |
| `@repo/env` | 环境变量 | `getEnv` / `isDev` / `getUrlWithParams` |
| `@repo/images` | 图片库 | 品牌/图标/插画/产品图 |
| `@repo/pages` | 通用页面 | 403/404/500 错误页 |

### 1.3 页面层（pages/）

| 模块 | 页面 | 说明 |
|---|---|---|
| `system` | UserManage / RoleManage / MenuManage / DeptManage / DictManage / SettingManage / FeedbackManage / SysLogManage / OnlineUser / TenantManage | 系统管理 10 页 |
| `gateway` | GatewayManage / RemoteControl / Config / Monitor / Conference-Join | 网关 5 页 |
| `ai` | Chat / ImageGen / VideoGen | AI 3 页 |
| `eduai` | 教育 AI 页面 | 独立路由 |
| `device` | DeviceView | 设备 1 页 |
| `message` | 站内消息 | 组件级集成 |
| `signin` | SSO 登录 | 单点登录 |
| `monitor` | 监控面板 | 全局异常上报 |
| `achievement` | 成就 | 成就展示 |

---

## 2 测试工具

### 2.1 E2E 脚本

| 脚本 | 说明 | 覆盖范围 |
|---|---|---|
| `e2e-full.js` | 全功能回归（19 张截图） | 登录→首页→系统管理 10 页→个人中心→锁屏→404→登出→重登 |
| `e2e-smoke.js` | 冒烟测试 | 登录页渲染 + 错误登录 toast 校验 |
| `e2e-ai-test.mjs` | AI 系统模拟 | 对话/管理页/截图 |
| `packages/theme/tests/pureadmin.spec.ts` | Playwright 规范 | PureAdmin 主题集成 |

### 2.2 测试运行

```bash
# 冒烟
node e2e-smoke.js

# 全功能回归
node e2e-full.js

# 主题单元测试
pnpm --filter @repo/theme test
```

---

## 3 E2E 测试结果

### 3.1 `e2e-smoke.js`（冒烟）

| 项目 | 结果 | 说明 |
|---|---|---|
| 登录页可访问 | PASS | `localhost:5173/login` 返回 200 |
| 输入框渲染 | PASS | `Input count: 2`（账号 + 密码） |
| 错误登录 toast | PASS | 密码错误返回空 toast（后端未返回错误信息，需后端配合返回 `msg`） |

### 3.2 `e2e-full.js`（全功能）

测试依赖后端 `localhost:18170` 运行。当后端未启动时，`/v2/setting/default` 返回 502，登录流程中断。

#### 正常情况下的完整用例

| # | 测试项 | 预期 | 断言点 |
|---|---|---|---|
| 1 | 登录页渲染 | 页面加载成功 | URL 含 `/login`；表单宽度 > 280px |
| 2 | 登录页 UI | 品牌名/标题/输入框/登录按钮 | `captcha=false` 时隐藏验证码；滑块显示 |
| 3 | 登录流程 | admin/admin123 登录 | 跳转 `/home`；返回 token |
| 4 | 首页渲染 | 主控台 + 欢迎语 | 显示"主控台"；显示用户名 |
| 5 | 侧边栏菜单 | 菜单展开 | 系统管理 → 用户管理/角色管理等子项 |
| 6 | 用户管理 | 搜索/分页/表格/状态开关 | 按"用户名称"搜索 admin 命中 |
| 7 | 角色管理 | 搜索/分页 | 按"角色名称"搜索有效 |
| 8 | 菜单管理 | 树形展示/增删改 | 类型：菜单/iframe/外链/按钮 |
| 9 | 字典管理 | 双 Tab（分类/子项） | Tab 切换；子项关联分类 |
| 10 | 系统设置 | 分组过滤/查询 | 按名称搜索 login |
| 11 | 反馈管理 | 查询/重置/处理 | 按反馈类型过滤 |
| 12 | 登录日志 | 查询/清空 | 按用户名搜索 |
| 13 | 机构管理 | 树形组织/筛选 | 递归搜索 |
| 14 | 在线用户 | 踢出/过滤 | 按账号/IP 过滤 |
| 15 | 个人中心-基本资料 | 编辑保存 | 昵称/手机/邮箱/性别/头像 |
| 16 | 个人中心-修改密码 | 三字段校验 | 旧密码/新密码/确认密码一致性 |
| 17 | 个人中心-锁屏设置 | 设置/重置 | 未设置→设置→立即锁屏→重置 |
| 18 | 锁屏全流程 | 密码验证 | 错误密码提示"密码错误"；正确密码解锁 |
| 19 | 404 页面 | 重定向 | `/404test` → `/404`；显示"返回首页" |
| 20 | 登出 + 重登 | 清除 token/缓存 | 登出→跳转登录页→重新登录成功 |

#### 已知测试限制

- `el-popover` 在 headless 模式下 `trigger=hover` 可能不触发 → 用户菜单/退出登录测试可能跳过
- 后端未启动时所有 API 调用返回 502 → 测试无法执行，建议先启动后端
- 锁屏设置依赖 `window.dispatchEvent(new CustomEvent("lock:screen"))` 模拟

---

## 4 功能模块测试

### 4.1 核心框架（`@repo/core`）

#### 4.1.1 应用启动 `createApp`

| 阶段 | 说明 | 验证方式 |
|---|---|---|
| ① loadCrypto | 加载 `crypto-wasm.js`（Wasm AES） | `loadCrypto` 成功返回 `CryptoModule` |
| ② loadConfig | 加载 `app.yaml` + 远程配置 | YAML 解析、键归一化（`loginConfig`→`login`）、默认值合并 |
| ③ buildStorage | AES 加密 storage | `storage.set/get` 加解密对称 |
| ④ createTokenManager | 令牌管理 + 定时刷新 | `token.start()` 启动定时刷新 |
| ⑤ buildHttp | HTTP 加密/签名拦截器 | 请求加密、响应解密、401 自动刷新 |
| ⑥ createAppRouter | 路由 + 权限守卫 | `/login` 白名单、登录态鉴权 |
| ⑦ syncUserPerm | 同步角色/权限 | `getUserInfo` 解析 |
| ⑧ installAntiDebug | 反调试（百度 JS / 字体加密 / OCR） | 配置控制开关 |
| ⑨ bindConfigHotReload | 版本变更监听 | 响应头 `x-response-version` → 热重载 |
| ⑩ loadDefaultSetting | 登录页默认配置拉取 | `/v2/setting/default` → 合并 `login` 子配置 |

**修复项**（`ded7607`）：`loadDefaultSetting()` 首次请求触发热重载导致重复请求 → 引入 `bootstrapping` 守护标记，首次请求期间忽略版本变更事件。

#### 4.1.2 HTTP 错误拦截器

| 状态码 | 提示文案 | 是否重试 |
|---|---|---|
| 502 | 服务器繁忙，请稍后重试 | 幂等方法重试 3 次 |
| 503 | 服务暂时不可用，请稍后重试 | 幂等方法重试 3 次 |
| 504 | 服务器响应超时，请稍后重试 | 幂等方法重试 3 次 |
| 其他 5xx | 服务器内部错误，请稍后重试 | 幂等方法重试 3 次 |
| 网络异常 | 网络连接异常，请检查网络 | 不可重试直接弹 |

**规则**：
- 重试期间不弹 toast（避免重复打扰），重试耗尽后弹一次
- 受 `hc.noToast` 单请求静默 和 `http.toast.enable` 全局开关控制
- 401 由 `checkApiResponse` 自动处理（弹提示 + reject）
- 非幂等方法（POST/PATCH）不自动重试，直接弹 toast

#### 4.1.3 配置热重载

```
后端配置变更 → x-response-version 响应头
  → upgrade(version) 写入 localStorage
  → 派发 CONFIG_VERSION_CHANGE_EVENT
  → bindConfigHotReload 监听
  → 500ms 延迟 → 清空 Promise 缓存 → 重新拉取 /v2/setting/default
  → 执行 onConfigHotReload 回调（刷新水印/防护/Socket）
```

**启动保护**：`bootstrapping=true` 期间忽略事件，防止首次请求触发热重载循环。

#### 4.1.4 加密安全

| 功能 | 实现 |
|---|---|
| AES 加解密 | Wasm 模块 `crypto-wasm.js`（`encryptBody`/`decodeBody`） |
| SM2/SM3/SM4 | Wasm 多算法支持（`algorithm` 配置切换） |
| x-sign 签名 | `generateNonce()` + 参数排序 + `signRequest()`，防重放 |
| 请求体加密 | AES key 随机生成 + base64 编码，`x-ck` 头传递 |
| 响应体解密 | `x-ec` 头标记 + `x-ot` 噪声等级 + `decodeBody` 剔除噪声 |

#### 4.1.5 Socket 连接

| 协议 | 支持 |
|---|---|
| Socket.IO | 自动重连、心跳、房间订阅 |
| WebSocket | `ws://`/`wss://` |
| SSE | 事件流 |

配置热重载联动：`SystemTopics.CONFIG.UPDATE` / `CONFIG.VERSION` → `upgrade()` → 版本变化后重新拉取配置。

#### 4.1.6 全局异常监控

| 功能 | 实现 |
|---|---|
| JS 运行时异常 | `window.error` 监听 |
| Promise 拒绝 | `unhandledrejection` 监听 |
| 资源加载失败 | `script/img/link` 的 `onerror` |
| Worker 去重 | 时间窗口 + 批次缓冲 |
| 上报 | `POST /v2/log/report`（`reportUrl` 控制） |

### 4.2 配置管理（`@repo/config`）

| 功能 | 说明 |
|---|---|
| YAML 解析 | `js-yaml` 解析 `app.yaml`，顶层键 `Config` 后缀归一化 |
| 默认配置 | `defaultAppConfig` 全字段默认值（`config/app/http/login/...`） |
| 远程配置 | `loadRemoteConfig()` 支持 JSON/YAML，`flattenSettingToConfig` 点号层级展开 |
| 响应式 | `reactive` 包装 `currentConfig`，`setConfig` 逐 key 赋值保持响应式 |
| 热重载 | `upgrade(version)` 幂等（版本相同不重复派发） |
| 用户配置 | `restoreUserConfig()` 从 localStorage 恢复用户偏好 |

**远程配置流程**（`loadConfig` 内部）：
1. 本地 `app.yaml`（含 `app.{env}.yaml` 优先）
2. 远程配置 `http.baseUrl + url.setting`（`config.enable` 控制）
3. 环境变量 `VITE_*` 覆盖
4. 用户配置 `restoreUserConfig()`

### 4.3 HTTP 客户端（`@repo/utils`）

| 特性 | 说明 |
|---|---|
| 链式 API | `http().get(url).query(params).data(body).timeout(ms).encrypt(true).retry(true).noToast(true)` |
| URL 拼接 | `normalizeUrl(baseUrl, url)`：绝对 URL 原样、相对 URL 自动拼接 |
| 版本 query | `apiVersion` 自动拼 `?version=v1` |
| Token 注入 | 默认 `Authorization: Bearer ${token}` |
| API 成功判断 | `Http.isSuccessful`：`success=true` / `code="00000"` |
| 模块独立 http | `createModuleHttp(moduleName)`：复用实例，仅替换 baseUrl |

### 4.4 存储（`@repo/utils/storage`）

| 特性 | 说明 |
|---|---|
| JSON 序列化 | 自动 stringify / parse |
| 命名空间前缀 | `storage.prefix` 或 `app.systemCode` 或 `"system"` |
| 跨应用共享 | `noPrefixKeys`（如 `sys-fingerprint`） |
| 用户隔离 | `userScopeKeys`（`tabs` / `layout` / `user-config` 等） |
| 加解密 | 实时读 `config.storage.encode`，AES 对称加解密 |
| 降级策略 | 加密失败明文写入，不阻塞存储 |
| TTL | 可选过期时间（毫秒），0 或省略不过期 |

### 4.5 状态管理（`@repo/pinia`）

| Store | 说明 | 持久化 |
|---|---|---|
| `user` | 用户令牌 + 登录信息 + 登录登出 | ✅ 持久化 |
| `auth` | 权限 + 菜单 + 用户信息 | ✅ 持久化 |
| `global` | 布局/主题/交互状态（暗黑/语言/主题色） | ✅ 持久化 |
| `tabs` | 标签页（增删改/关闭策略） | ✅ 持久化 |
| `keepAlive` | 页面缓存管理 | ✅ 持久化 |
| `message` | 站内消息（列表/未读/已读游标） | ✅ 持久化 |

**菜单加载**：
```
authStore.listRouters()
  → 静态菜单 getStaticMenu()
  → 远程菜单 getMenu()（cache-aside：先读 storage，无则请求并写回）
  → generateRoutes() + generateFlattenRoutes()
  → 填充 recursiveMenuList / menuList / breadcrumbList
```

### 4.6 主题与布局（`@repo/theme`）

#### 4.6.1 koi 主题

| 模块 | 说明 |
|---|---|
| 布局（6 种） | `vertical` / `columns` / `double` / `classic` / `horizontal` / `optimum` |
| 移动端 | `LayoutMobile` 独立响应式布局 |
| 锁屏 | `LockScreen`：密码设置/验证/重置 |
| 主题配置 | 颜色/字体/暗黑/布局切换 |
| AI 助手 | `AiCharacter` 悬浮助手 |
| 性能监控 | `PerfMonitor`：FPS/内存/cpu/带宽 |
| 顶部计时器 | Worker 多时区定时器 |
| 全局水印 | `applyGlobalWatermark()` |

#### 4.6.2 登录样式（8 种）

| 样式 | 组件 | 说明 |
|---|---|---|
| default | `styles/default.vue` | 臻享双栏：品牌展示 + 登录表单 |
| bubble | `styles/bubble.vue` | 气泡简约：气泡背景 + 轻量卡片 |
| split | `styles/split.vue` | 分屏沉浸：大屏分栏 |
| voxel | `styles/voxel.vue` | 现代体素：3D 体素塔 + 粒子 + 玻璃面板 |
| glass | `styles/glass.vue` | 动感玻璃 |
| mono | `styles/mono.vue` | 单色 |
| simple | `styles/simple.vue` | 经典点阵 |
| slide | `styles/slide.vue` | 滑动登录 |

**选择器**：右上角 `KoiLoginStylePicker`，选择后持久化到 `globalStore.loginStyle`。

#### 4.6.3 OTP 弹窗

| 功能 | 说明 |
|---|---|
| 组件 | `KoiOtpDialog.vue` + `KoiOtpInput.vue`（6 位数字输入格） |
| 触发 | `loginConfig.otp=true` 时点击登录弹出 |
| 验证 | 6 位填完自动提交；确认按钮长度校验 |
| 取消 | 关闭弹窗回到登录页 |
| 样式 | 全局 `<style>` + `body:has(.voxel-page)` 适配 voxel 暗色主题 |

### 4.7 系统管理（`@repo/system`）

| 页面 | 接口 | 核心功能 |
|---|---|---|
| UserManage | `/v2/user/*` + `/v2/role/list` + `/v2/dept/list` | 分页/搜索/新增/编辑/删除/重置密码/分配角色 |
| RoleManage | `/v2/role/*` + `/v2/menu/tree` | 分页/搜索/新增/编辑/删除/分配菜单 |
| MenuManage | `/v2/menu/tree` + `/v2/menu/*` | 树形/新增/编辑/删除/4 类型 |
| DeptManage | `/v2/dept/*` | 树形/筛选/新增/编辑/删除 |
| DictManage | `/v2/dict/*` + `/v2/dict/item/*` | 双 Tab 分类/子项 |
| SettingManage | `/v2/setting/*` | 分组过滤/批量保存/4 类型（STRING/NUMBER/BOOLEAN/JSON） |
| FeedbackManage | `/v2/feedback/*` | ReTable loader/搜索/处理回复 |
| SysLogManage | `/v2/syslog/*` | ReTable loader/删除 |
| OnlineUser | `/v2/online/list` + `/v2/online/kick` | 列表/踢出/过滤 |
| TenantManage | `/v2/tenant/*` | 新增/编辑/删除/分配服务/重置密码 |

### 4.8 个人中心（`@repo/theme/koi/views/mine`）

| 功能 | 说明 |
|---|---|
| 基本资料 | 昵称/手机/邮箱/性别/地址/生日/头像 |
| 修改密码 | 旧密码/新密码/确认密码，三字段一致性校验 |
| 锁屏设置 | 首次设置 → 已设置（立即锁屏/重置密码） |

### 4.9 网关管理（`@repo/gateway`）

| 页面 | 说明 |
|---|---|
| GatewayManage | 网关连接配置/IP/端口/在线会话 |
| RemoteControl | SSH（xterm）/ 桌面（Guacamole）/ 会议会话管理 |
| Config | 网关设置（SSH 参数/端口） |
| Monitor | 终端监控面板 |
| Conference-Join | 会议加入 |

### 4.10 AI 平台（`@pages/ai`）

| 页面 | 说明 |
|---|---|
| Chat | AI 对话（webllm 本地推理 / 厂商 API 双模式） |
| ImageGen | 文生图 |
| VideoGen | 文生视频 |

### 4.11 国际化（`@repo/languages`）

| 语言 | 包 | 说明 |
|---|---|---|
| 中文 | `zh.ts` | 默认 |
| 英文 | `en.ts` | 全量翻译 |

**新增 i18n key**（本次）：
- `menu.login.otpTitle` / `otpConfirm` / `otpCancel` / `otpTip`
- `menu.login.styleOptions.voxelLabel` / `voxelDesc`

### 4.12 通用组件（`@repo/ui`）

共 **74 个** Re- 组件，覆盖：

| 类别 | 组件 |
|---|---|
| 表单 | `ReForm` / `ReInput` / `ReSelect` / `ReDatePicker` / `ReCron` / `ReTagFilter` |
| 表格 | `ReTable` / `RePagination` / `ReScrollbar` |
| 弹窗 | `ReDialog` / `ReDrawer` |
| 展示 | `ReCard` / `ReStat` / `ReText` / `ReTag` / `ReIcon` / `ReTimeline` / `ReTree` |
| 图表 | `ReEcharts` / `ReGraph`(9 种) / `ReCountup` / `ReTypeIt` |
| 富媒体 | `ReChat` / `ReImageGen` / `ReVideoGen` / `ReRagChat` / `ReCropper` / `ReAvatarCrop` |
| 上传 | `ReUpload` / `ReUploadChunk` / `ReFilePicker` |
| 加载 | `ReLoading` / `ReSkeleton` / `ReEmpty` |
| 其他 | `ReAlbum` / `ReCarousel` / `ReCode` / `ReCron` / `ReCropper` / `ReDatePicker` / `ReDialog` / `ReDrawer` / `ReFilter` / `ReImage` / `ReImageCompare` / `ReImageGroup` / `ReInputNumber` / `ReIp` / `ReLazy` / `RePagination` / `ReProgress` / `ReRemoteSelect` / `ReRibbon` / `ReSearch` / `ReScrollNav` / `ReSeamlessScroll` / `ReSkeleton` / `ReStat` / `ReStationMessage` / `ReStatusIndicator` / `ReSwitch` / `ReTab` / `ReTable` / `ReTag` / `ReTagFilter` / `ReText` / `ReTime` / `ReTimeline` / `ReTree` / `ReTrend` / `ReTypeIt` |

### 4.13 后台 Worker（`@repo/work`）

| 模块 | 说明 |
|---|---|
| TimerWorker | 独立线程每秒推送多时区时间（UTC ±12，最多 3 个） |
| 订阅 | `subscribe(cb)` → 返回取消函数 |
| 降级 | `Worker` 不可用时（SSR）静默返回空 |

### 4.14 通用页面（`@repo/pages`）

| 页面 | 说明 |
|---|---|
| 403 | 无权限访问 |
| 404 | 页面不存在（返回首页/返回上页） |
| 500 | 服务器错误 |

---

## 5 测试问题与修复记录

### 5.1 已完成修复

| 提交 | 问题 | 修复 |
|---|---|---|
| `e4345bc` | `setting.ts` 残留 `SETTING_TO_WATERMARK_MAP`/`SETTING_TO_SOCKET_MAP` 死映射 | 移除，只保留 `SETTING_TO_LOGIN_MAP` |
| `e4345bc` | OTP 弹窗内嵌登录表单（不优雅） | 新建 `KoiOtpDialog.vue`，弹窗化流程 |
| `e4345bc` | pureadmin 主题 `loadDefaultSetting()` 冗余调用 | 移除（`createApp` 已启动期调用） |
| `ded7607` | `loadDefaultSetting()` 首次请求触发热重载导致 `/v2/setting/default` 请求 2 次 | 引入 `bootstrapping` 守护标记，首次请求期间忽略版本事件 |
| `31c4f97` | HTTP 错误拦截器对 502/5xx 静默 reject，无任何提示 | 加入分类 toast（502/503/504/5xx/网络异常），重试期间不弹，耗尽后弹一次 |
| `bc53fab` | `submitLogin` catch 中 `setInterval` 误用（应为 `setTimeout`） | 移除 setInterval（finally 已覆盖 loading 关闭） |
| `bc53fab` | `CreateAppOptions` 缺少 `loadRemoteRoutes` 字段声明 | 补全接口定义 |
| `6f0bf89` | `CreateAppOptions.loadRemoteRoutes` 类型为 `() => Promise<unknown>`，与 `RemoteRoutesLoader` 不匹配 | 使用正确的 `RemoteRoutesLoader` 类型（`(router: Router) => Promise<RouteConfigsTable[] | void>`） |
| `2a2c754` | `ThemeConfig` 中 `headerShown`/`tabsShown` 未在 script 中声明，TS2339 | 新增 `computed` 包装器映射到 `globalStore.isHeaderShown`/`isTabsShown` |
| `2a2c754` | `AiCharacter.vue` 引用 `aiChatSkin` 字段，`AiChatConfig` 未定义 | `AiChatConfig` 新增可选字段 `aiChatSkin?: string` |
| `2a2c754` | `AiCharacter.vue` `lastReply` 可能为 `undefined`，TS2322 | 增加类型断言 `as { role: string; content: string }` |
| `2a2c754` | `re-map/index.vue` `_getIconUrl` 属性在 `L.Icon.Default` 类型中不存在，TS2339 | 使用 `(as any)` 绕过类型检查 |

### 5.2 已知问题（本次未修复）

| 问题 | 位置 | 严重度 |
|---|---|---|
| `AiCharacter.vue` 引用 `@repo/ui/ReAvatar3D` 模块不存在，TS2307 | `AiCharacter.vue:5` | TS 警告 |
| `SettingAiChat.vue` `aiChatModel` 赋值函数参数类型不匹配，TS2322 | `SettingAiChat.vue:139` | TS 警告 |
| `ThemeConfig/index.vue` 字符串索引 `ToolbarConfig` 未显式声明，TS7053 | `ThemeConfig/index.vue:500` | TS 警告 |
| `config/loader.ts` `OtherConfig` 字段可选性不兼容，TS2322 | `loader.ts:314` | TS 警告 |
| 后端 18170 未启动时登录页 body 为空 | E2E 运行 | 需后端配合 |
| `el-popover` hover 触发在 headless 模式下可能失效 | E2E 测试 | 用户菜单测试项可能跳过 |

### 5.3 测试运行前提

- 后端 `localhost:18170` 已启动（提供 `/system/api/v2/*` 接口）
- 前端 dev server 运行中（`localhost:5173`）
- Node.js 18+ / Chromium 浏览器

---

## 6 数据库配置

| 设置项 | 值 | 说明 |
|---|---|---|
| `SlidingBlockOpen` | `true` | 滑块验证默认开启 |
| `CheckCodeOpen` | `false` | 图形验证码默认关闭 |
| `CheckTotpOpen` | `false` | OTP 动态口令（按需开启） |
| `app.yaml` `loginConfig.slider` | `true` | 前端默认 |
| `app.yaml` `loginConfig.captcha` | `false` | 前端默认 |

---

## 7 测试截图目录

`e2e-screenshots-full/`：
```
001_login_initial.png      010_feedback_manage.png
002_login_success.png      011_system_log_manage.png
003_home_page.png          012_system_dept_manage.png
004_sidebar_menu_expanded.png  013_system_online_user.png
005_system_user_manage.png  014_mine_initial.png
006_system_role_manage.png  015_lock_settings_initial.png
007_system_menu_manage.png  016_lock_screen.png
008_system_dict_manage.png  017_lock_wrong.png
009_system_setting_manage.png  018_lock_unlocked.png
```