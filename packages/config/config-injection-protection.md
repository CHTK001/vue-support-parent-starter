# 统一配置注入保护（config-injection-protection）

> 生效时间：`@repo/config@2.x`。只保护运行时 `setConfig`，防御页面/远程把系统配置（url、http、token、storage …）
> 写到正在运行的应用里。

## 1. 问题

`setConfig(partial)` 淡棕色合并 `currentConfig`（reactive 单例），任何页面、任意代码都能调：

- 页面按用户偏好把 `http.baseUrl` 改成攻击者地址 → 请求外泄 / 劫持；
- 把 `token.storageKey` 改掉 → 令牌读写脱离框架管理；
- 把 `storage.prefix` 改了 → 存量用户数据对不上；
- 远程设置 `/v2/setting/default` 下发 `other.toolbar.*` 没被拦 → 拿了
  `http.baseURL`/`token.*Key`/`crypto.*` 这类键，同一段地址回写。

结果：系统行为在运行时被改写，且法眼不可见（没有日志、没有边界）。

## 2. 保护方案

只读保护只套在 **公开窗口** `setConfig` 上。框架内部真正「在系统初始化阶段落盘」的操作全部走
**授权通道** `applyConfig`（`loadConfig` / `mergeDefaultSetting` / `restoreUserConfig` / `resetConfig` / `applyTitle`），
不执行拦截，所以功能不受影响。

```ts
const writable = pruneDeploySideKeys(partial, "", warned);  // 站在 setConfig 门口
if (warned.length > 0) console.warn(`[config] 拒绝通过 setConfig 修改系统配置...`);
return applyConfig(writable);
```

`pruneDeploySideKeys` 把被拒绝的整棵子树从 patch 里摘出来，不截断同一次写入中合法的用户配置；
所有被拒 keyPath 收集到 `warned`，`setConfig` 统一 `console.warn` 输出，方便排查。

## 3. 禁止键（部署侧键，按前缀匹配整树）

顶层：`config`、`token`、`http`、`storage`、`crypto`、`url`、`route`、`permission`、
`system`、`monitor`、`apm`。
`security` 整树禁止，**仅 `security.baiduJs.*` 放行**（反爬脚本下发 `白名单`，
否则后台配置的安全策略在前端永远不生效）。
`other` 下仅 `other.capabilities`、`other.loaderConfig` 禁止（能力开关和加载动画接管都是
部署侧决策，能被用户切片里的 lo-added 开关玩坏）。

以下这些**不是**禁止键，可写：`other` 其他子键（toolbar(timer/weather/bigscreen/aiChat...)、
theme、home、locale、fallback、other.xxx）、`message`、`menu`（展示项 + collapse）、
`login`、`app`、`defaultConfig`、`i18n`、`other.themeConfigCloseConfirm` 等等。

## 4. 授权调用方（全部走到 applyConfig）

| 调用方 | 位置 | 语义 |
|---|---|---|
| `loadConfig` | `packages/config/src/loader.ts:235` | app.yaml / 远程 / 环境变量合并后的最终配置，只 applyConfig 一次 |
| `mergeDefaultSetting` | `packages/core/src/setting.ts:102` | 远程设置经 safe-path 白名单后写回 |
| `restoreUserConfig` | `packages/config/src/config.ts:641` | 用户可调切片恢复；history 快照里的 `other.loaderConfig` 恢复时丢弃 |
| `resetConfig` | `packages/config/src/config.ts:368` | 重置为默认配置 |
| `applyTitle` | `turbo/app/src/shared.ts:85` | 标题覆盖（`app.title` → `other.title`） |

界外（页面、组件、第三方注入代码）能做只有受保护的 `setConfig`。
`setConfig` 入参如果只传用户切片，行为与改造前完全一致。

## 5. 子系统约定

### 5.1 主题抽屉（`packages/theme/.../ThemeConfig/index.vue`）

用户可调切片（other/message/menu/login）一律走 `setConfig`。
抽屉「导入用户配置」拿到的 JSON 只传这四片，拦截不到时才说明用户文件里带了系统键
（此时 warn 并拒绝，用户配置不丢）。

### 5.2 能力开关

- `isCapabilityEnabled(key)`（`packages/config`）—— 供销侧用，`false` 时入口隐藏。
- `isCapabilityDeployOff(key)`（`packages/config`）—— 仅给设置面板/逻辑做差异 → 部署侧关掉 + 用户开关打开。
- `other.capabilities` 本身不允许任何写回。

### 5.3 加载动画

`resolveLoaderDeployPolicy()` 返回归一化策略，三处（首屏、ReLoader、主题配置预览）只读它，
`other.loaderConfig` 不允许写回；用户自己选的主题不受影响。

## 6. 验证

### 6.1 单元验证

在 `@repo/core` 导出的入口补了 `applyConfig`（`packages/core/src/index.ts:6`），所以 v2
测试文件 (`pages/monitor/src/__tests__/filterDetail.spec.ts` / `pages/server/src/__tests__/filterDetail.spec.ts`)
写 `other.filestorage.bucket` 仍正常通过。
`packages/config` 需 `tsc` 能通过：

```bash
node node_modules/typescript/bin/tsc --noEmit -p packages/config
```

### 6.2 浏览器级验收（Playwright）

见 `test/pw/pw-config-injection-accept.mjs`——在 monitor(8848)/system(8899) dev server 上
覆盖：登录、折叠菜单、设置抽屉、主题抽屉、水印、反调试、能力开关入口显隐、系统键拦截
console.warn。人工核对 `test/.tmp/config-injection-accept.log` 里每条断言输出。

## 7. 开发约定

- 新增 `setConfig` 调用方前，先问自己三件事：这算系统行为权？有 app.yaml 能表达吗？
  远程设置 `/v2/setting/default` 能下发这个键吗？
- 如果是框架授权路径（拉配置、热重载、同步），用 `applyConfig`。
- 如果是页面/用户操作，`setConfig` 会 warn 拒绝——**这不是 bug，这是保护生效**。
  别在日志里把 console.warn 当 bug 修。
