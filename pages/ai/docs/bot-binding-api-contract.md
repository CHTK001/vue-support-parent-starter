# Bot 绑定 / Bot IM 后端接口契约

> 适用范围：`pages/ai` 的 `renderer/pages/bots/BotManagementPage.tsx` 与 `renderer/pages/bots/BotImPage.tsx`
>
> 后端实现：`spring-support-ai-starter`
> - `com.chua.starter.ai.support.toolmetrics.AiBotBindingController` → 前缀 `/v2/ai/bot-binding`
> - `com.chua.starter.ai.support.controller.settings.AiSkillCatalogController` → 前缀 `/v2/ai/skills`
> - `com.chua.starter.ai.support.service.AiBotBindingService` / `AiBotChatService`
> - WebSocket：`com.chua.starter.ai.support.manage.websocket.SysAiWebSocketHandler`
>
> 前端 adapter：`@/common/adapter/httpBridge` 的 `httpRequest(method, url, body)` / `wsEmitter(topic)`

---

## 1. 通用约定

### 1.1 基址与代理

- 后端端口固定 **8787**（`spring-support-ai-starter/src/main/resources/application.yml`）。
- 前端 dev 端口 **5173**，`vite.config.ts` 在 `webdev` 模式下把 `/v2`、`/api` 反代到 `127.0.0.1:8787`；桌面（Tauri）模式走注入的 `__backendNPort`/`__backendPort` 绝对地址。
- 前端调用一律使用**站内相对路径**（如 `/v2/ai/bot-binding/list`）。

### 1.2 鉴权

| 层级 | 规则 |
| --- | --- |
| OAuth 白名单 | `/v2/ai/bot-binding/**`、`/v2/ai/models/**` 在 `application.yml` 的 `plugin.oauth.whitelist` 内，不走 OAuth 登录态 |
| 管理端接口 | `AiBotBindingController` **未标注** `@Permission`，即不强制 admin；是否管理员由前端调 `/meta` 判定后控制入口显隐 |
| 本地信任 | `LocalTrustAuthFilter` 置位 `nomifun.local.trusted=true` 时（Tauri/本地开发）直接放行 |
| `meta` 解析 | 从 `Authorization: Bearer <token>` 或 `?token=` 取 token，交 `AuthClientExecute.getUserResult(token)` 解析角色 |

### 1.3 响应信封（重要）

绝大多数接口返回 `ReturnResult<T>`：

```json
{ "code": "00000", "msg": "success", "data": <T> }
```

- `code = "00000"`（`ReturnCode.SUCCESS`）表示成功；其他为业务错误，业务错误文案在 **`msg`** 字段（不是 `message`）。
- 前端 `httpBridge` 仅在成功时解包一层 `data`，因此页面里拿到的 `res` 通常**已经是 `data` 内容**。
- 页面代码里同时存在 `Array.isArray(res) ? res : res?.data` 的兜底写法，属于对"是否解包"的防御性兼容，不是契约要求。

**两个例外（没有 `ReturnResult` 外壳）**：

| 接口 | 返回 | 影响 |
| --- | --- | --- |
| `GET /v2/ai/skills/catalog` | **裸 `List<String>`** | 若 httpBridge 无条件取 `body.data`，将得到 `undefined` → 技能下拉恒为空 |
| `GET /v2/global-settings`（非本页） | **裸 `AiGlobalSettingDTO`** | 同上风险，设置页需注意 |

### 1.4 时间字段

后端为 `LocalDateTime`（服务器本地时区，无偏移量）。不同接口序列化格式可能不一致：

- 实体（`SysAiBotBinding` / `SysAiBotMessage`）经 Jackson 序列化 —— 格式取决于全局 `spring.jackson` 配置；
- WS 推送使用 `LocalDateTime.toString()` —— 形如 `2026-09-12T14:33:21.123`（`T` 分隔、无时区）。

前端 `new Date(v)` 对 `T` 分隔格式按本地时区解析可用；对空格分隔格式在部分浏览器（Safari/严格解析）会返回 `Invalid Date`。页面已有兜底（非法值原样展示）。

---

## 2. `BotManagementPage` 接口清单

### 2.1 创建绑定

`POST /v2/ai/bot-binding/create`

**请求体**（`BotBindingCreateRequest`）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `botId` | string | 是 | Bot 唯一标识（iLink 分配 / 手动填写） |
| `botToken` | string | 否 | 登录凭证；留空视为无凭证 |
| `platform` | string | 是 | `wechat` / `wecom` / `feishu` |
| `nickname` | string | 是 | Bot 昵称 |
| `gatewayPort` | number \| null | 否 | 独立网关端口 |
| `status` | string | 是 | `online` / `offline` / `expired` |
| `bindSource` | string | 否 | `qrcode_scan` / `manual_import` |
| `model` | string | 否 | AI 回复使用的模型名 |
| `thinking` | boolean | 否 | 是否启用深度思考（默认 `false`） |
| `thinkingEffort` | string | 否 | 思考强度 `low` / `medium` / `high` |
| `systemPrompt` | string | 否 | AI 回复 system prompt |
| `recordUsage` | boolean | 否 | 是否记录用量（默认 `true`） |

```json
{
  "botId": "wx_bot_123",
  "botToken": "token-abc",
  "platform": "wechat",
  "nickname": "客服小助手",
  "gatewayPort": 8899,
  "status": "online",
  "bindSource": "manual_import",
  "model": "gpt-4o-mini",
  "thinking": false,
  "thinkingEffort": "",
  "systemPrompt": "你是热情友好的客服助手。",
  "recordUsage": true
}
```

**响应**：`ReturnResult<Long>` —— `data` 为数据库主键 ID。

```json
{ "code": "00000", "msg": "success", "data": 12 }
```

**后端行为**：`AiBotBindingService.saveOrUpdate` 按 **`botId` 去重**；若该 `botId` 已存在则更新，否则插入。当 `platform=wechat && status=online && botToken` 非空时，自动启动该 Bot 的消息轮询（`AiBotChatService.startBot`）。

> ⚠️ 接口**没有** `skills`、`contextThinking` 字段（见 §4）。

### 2.2 更新绑定

`PUT /v2/ai/bot-binding/update`

**请求体**：同上 `BotBindingCreateRequest`。

> ⚠️ **`BotBindingCreateRequest` 不含 `id` 字段**。后端 `update` 实现是 `BeanUtils.copyProperties(request, entity)` 后调 `saveOrUpdate`，**以 `botId` 定位既有记录**，而不是用 `id`。
> 前端发送的 `payload.id` 会被丢弃。因此**`botId` 是更新的实际主键**；前端已把 `botId` 在编辑态置为只读，契约依赖这一点。若允许修改 `botId`，会退化为"插入一条新记录"。

**响应**：`ReturnResult<Long>`。

### 2.3 删除绑定

`DELETE /v2/ai/bot-binding/{id}`

**响应**：`ReturnResult<Void>` —— `data` 为 `null`。后端同时调用 `AiBotChatService.stopBot(botId)` 停止轮询。

### 2.4 绑定列表

`GET /v2/ai/bot-binding/list?userId={userId}`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `userId` | 否 | 传入则只返回该用户的绑定；**不传则返回全部** |

**响应**：`ReturnResult<List<BotBindingListResponse>>`

`BotBindingListResponse` 字段：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | number | 主键 |
| `userId` | number \| null | 归属用户 ID |
| `userName` | string | 归属用户昵称（取自 `nickname`） |
| `botId` | string | Bot 唯一标识 |
| `platform` | string | `wechat` / `wecom` / `feishu` |
| `nickname` | string | Bot 昵称 |
| `avatarUrl` | string | 头像地址 |
| `gatewayPort` | number \| null | 网关端口 |
| `status` | string | `online` / `offline` / `expired` |
| `bindSource` | string | 绑定来源 |
| `model` | string | AI 模型 |
| `thinking` | boolean | 深度思考 |
| `thinkingEffort` | string | 思考强度 |
| `systemPrompt` | string | 系统提示词 |
| `recordUsage` | boolean | 记录用量 |
| `createTime` | string | 创建时间 |
| `lastActiveTime` | string | 最后活跃时间 |

```json
{
  "code": "00000",
  "msg": "success",
  "data": [
    {
      "id": 12, "userId": null, "userName": "客服小助手",
      "botId": "wx_bot_123", "platform": "wechat", "nickname": "客服小助手",
      "avatarUrl": "https://.../a.png", "gatewayPort": 8899, "status": "online",
      "bindSource": "qrcode_scan", "model": "gpt-4o-mini",
      "thinking": false, "thinkingEffort": "", "systemPrompt": "",
      "recordUsage": true, "createTime": "2026-09-12 10:00:00",
      "lastActiveTime": "2026-09-12 10:05:00"
    }
  ]
}
```

> ⚠️ **越权风险**：`list()` 在不传 `userId` 时返回**全量**绑定，与控制器 Javadoc 声称的"普通用户仅返回本人绑定"不符。前端 `load()` 调用时不传 `userId`，因此任何能访问该接口的用户都能看到所有 Bot。

### 2.5 可选模型列表

`GET /v2/ai/bot-binding/models`

**响应**：`ReturnResult<List<String>>` —— 数据源为模型管理（`provider_model`）中 `capabilities` 含 `chat` 的启用模型名。

```json
{ "code": "00000", "msg": "success", "data": ["gpt-4o-mini", "deepseek-chat"] }
```

### 2.6 可用 Skill 目录

`GET /v2/ai/skills/catalog`

**响应**：**裸 `List<String>`**（无 `ReturnResult` 外壳）—— 本地已安装技能（user + builtin）去重后的名称。

```json
["web-search", "code-review"]
```

> ⚠️ 信封不一致，见 §1.3。

### 2.7 当前用户元信息

`GET /v2/ai/bot-binding/meta`

**响应**：`ReturnResult<Map>`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `hasAdmin` | boolean | 角色含 `admin` / `superadmin` |
| `roles` | string[] | 当前用户角色列表 |
| `userId` | string \| null | 当前用户 ID |

```json
{ "code": "00000", "msg": "success", "data": { "hasAdmin": true, "roles": ["admin"], "userId": "1" } }
```

前端在 `import.meta.env.DEV` 下直接置 `isManager=true`，不请求该接口。

### 2.8 Bot 全局配置

`GET /v2/ai/bot-binding/global-config`

**响应**：`ReturnResult<Map>`：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `contextThinking` | boolean | `false` | 深度思考全局开关（控制前端是否展示 per-bot 开关） |
| `contextSize` | number | `10` | 上下文携带轮数 |
| `historySize` | number | `50` | 历史消息加载条数 |
| `commandEnabled` | boolean | `false` | 指令功能开关 |
| `compressionThreshold` | number | `0` | 上下文压缩阈值（0=关闭） |

`PUT /v2/ai/bot-binding/global-config` —— 部分更新，仅写入请求体中出现的字段，返回更新后的完整配置。

> 存储位置：全局设置表 `bot` 分组（`context_thinking` / `context_size` / `history_size` / `command_enabled` / `compression_threshold`）。

### 2.9 扫码绑定（微信）

**生成二维码**：`POST /v2/ai/bot-binding/qrcode?platform={platform}&botId={oldBotId}`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `platform` | 否 | 默认 `wechat`；仅支持 `wechat` / `wecom` |
| `botId` | 否 | 重新扫码场景：需合并的旧 Bot ID（`BotImPage` 使用） |

**响应**：`ReturnResult<QrResult>`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | string | 会话 key，供状态轮询 |
| `qrcodeUrl` | string | 二维码内容 URL；同步等待最长 8s，未就绪时为空串，需从状态轮询取 |

```json
{ "code": "00000", "msg": "success", "data": { "key": "uuid", "qrcodeUrl": "" } }
```

**行为说明**：
- `platform=wecom` **不支持扫码**，直接返回随机 key + 空 `qrcodeUrl`（`status` 会被轮询为 `expired`）。
- 扫码会话保存在内存 `ConcurrentHashMap`（注释标注生产环境应换 Redis）。
- 会话超时 **180s**（`expireAt = now + 180_000`）。

**轮询状态**：`GET /v2/ai/bot-binding/qrcode/status?key={key}`

**响应**：`ReturnResult<QrStatus>`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `status` | string | `pending` / `ready` / `scanned` / `confirmed` / `expired` / `error` |
| `qrcodeUrl` | string \| null | `ready` 时返回二维码 URL |
| `botId` | string \| null | `confirmed` 时回填 |
| `botToken` | string \| null | `confirmed` 时回填 |
| `expireAt` | number \| null | 过期时间戳（毫秒），前端用于倒计时 |

```json
{ "code": "00000", "msg": "success", "data": { "status": "ready", "qrcodeUrl": "https://...", "botId": null, "botToken": null, "expireAt": 1789173000000 } }
```

**状态流转**：`pending → ready → scanned → confirmed / expired / error`。

- key 不存在（已确认移除 / 已过期 / 非法）时返回 `{"status":"expired", ...}`，不报错。
- `confirmed` 时后端已**自动完成绑定写入**：将 `botId`/`botToken` 落库（`bindSource=qrcode_scan`、`status=online`），并把同微信用户（`nickname=userId`）或显式 `oldBotId` 的旧绑定合并、历史消息迁移到新 `botId`，其余重复绑定删除。
- 因此扫码成功后前端**无需再调 `create`**，直接刷新列表即可。

### 2.10 飞书绑定

`POST /v2/ai/bot-binding/feishu?appId={appId}&appSecret={appSecret}`

**响应**：`ReturnResult<Long>` —— 数据库 ID。

**失败语义**：`appId`/`appSecret` 为空或飞书客户端初始化失败时后端 `throw IllegalArgumentException`，**不是** `ReturnResult.error`，因此前端大概率收到 HTTP 5xx（而非业务错误信封），具体错误文案能否透出取决于全局异常处理器。前端当前仅在 `catch` 中提示通用失败。

### 2.11 后端存在但这两个页面未调用

| 接口 | 返回 | 说明 |
| --- | --- | --- |
| `GET /v2/ai/bot-binding/users` | `ReturnResult<List<BotUserSummary>>` | 管理员视角用户聚合；由未提交的 `/bots/users` 页面消费 |
| `GET /v2/ai/bot-binding/{id}` | `ReturnResult<BotBindingListResponse>` | 单条详情，页面未使用（编辑直接用列表行数据） |
| `PUT /v2/ai/bot-binding/global-config` | `ReturnResult<Map>` | 页面只读未写（写入入口在设置页） |

`BotUserSummary`：`owner`（用户 ID 或 `unassigned`）、`nickname`、`botCount`、`onlineCount`、`offlineCount`、`lastActiveTime`（毫秒时间戳）。

---

## 3. `BotImPage` 接口清单

### 3.1 会话列表

`GET /v2/ai/bot-binding/conversations`

**响应**：`ReturnResult<List<BotConversation>>`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `botId` | string | Bot 唯一标识 |
| `fromUser` | string | 微信用户 ID（**见下方警告**） |
| `nickname` | string | 展示名（取自绑定记录，缺失时回退 `fromUser`） |
| `platform` | string | `wechat` / `feishu` |
| `lastContent` | string | 最后一条消息内容 |
| `lastTime` | string | 最后一条消息时间 |
| `unread` | number | 未读数（当前后端未填充） |
| `status` | string | 绑定状态 `online` / `offline` / `expired` |

```json
{
  "code": "00000", "msg": "success",
  "data": [{
    "botId": "wx_bot_123", "fromUser": "wxid_abc", "nickname": "张三",
    "platform": "wechat", "lastContent": "在吗？",
    "lastTime": "2026-09-12 10:05:00", "unread": 0, "status": "online"
  }]
}
```

> ⚠️ **`fromUser` 语义不一致**：对"有消息历史"的会话，`fromUser` 是真实微信用户 ID；对"仅有绑定记录、无任何消息"的会话，后端用 `nickname || botId` **伪造** `fromUser`（`AiBotChatService.listConversations`）。
> 前端以 `${botId}|${fromUser}` 作为会话 key，并用它调 `/messages`、`/send`、`/summarize`、匹配 WS `payload.fromUser`。因此对"无历史"会话，选中后发送会指向一个昵称而非真实用户 ID，或与新消息（真实 `fromUser`）分裂成两个会话。

### 3.2 删除会话（单条 / 批量）

`DELETE /v2/ai/bot-binding/conversations?botId={botId}&fromUser={fromUser}`

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| `botId` | 是 | Bot 唯一标识 |
| `fromUser` | 否 | 微信用户 ID；**不传则删除该 Bot 全部会话** |

**响应**：`ReturnResult<Integer>` —— 删除的消息条数。

**副作用**：后端广播 WS 事件 `bot.conversation-deleted`（见 §3.7）。前端批量删除时对每个会话并发调用本接口。

### 3.3 聊天记录（分页）

`GET /v2/ai/bot-binding/messages?botId={botId}&fromUser={fromUser}&page={page}&pageSize={pageSize}`

| 参数 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- |
| `botId` | 是 | — | Bot 唯一标识 |
| `fromUser` | 否 | — | 空则查该 Bot 全部消息 |
| `page` | 否 | `0` | 页码，从 0 开始，**越大越早** |
| `pageSize` | 否 | `50` | 每页条数，前端取自 `/global-config` 的 `historySize` |

**响应**：`ReturnResult<Map>`：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `messages` | `SysAiBotMessage[]` | 升序消息数组（先显示最新，向上滚动加载更早） |
| `hasMore` | boolean | 是否还有更早消息 |
| `page` | number | 规范化后的页码 |
| `pageSize` | number | 规范化后的每页条数 |

`SysAiBotMessage` 字段：`id`、`botId`、`direction`（`IN` / `OUT`）、`fromUser`、`content`、`createTime`。

```json
{
  "code": "00000", "msg": "success",
  "data": {
    "messages": [{ "id": 1, "botId": "wx_bot_123", "direction": "IN", "fromUser": "wxid_abc", "content": "在吗？", "createTime": "2026-09-12 10:05:00" }],
    "hasMore": false, "page": 0, "pageSize": 50
  }
}
```

> 分页实现为"按时间倒序取窗口 → 反转升序"，`hasMore = offset + window.size < total`。

### 3.4 主动发送

`POST /v2/ai/bot-binding/send`

**请求体**：`{ "botId": string, "fromUser": string, "content": string }`（三者均不可为空，否则 `ReturnResult.illegal("botId / fromUser / content 不能为空")`）。

**成功响应**：`ReturnResult<Map{ messageId: string|null, ok: true }>`

```json
{ "code": "00000", "msg": "success", "data": { "messageId": "msg-1", "ok": true } }
```

**失败响应**：`ReturnResult.error(msg)` —— 业务失败走**整体信封**，不是 `{ok:false}`：

```json
{ "code": "<业务错误码>", "msg": "Bot 未在运行，请先在 Bot 管理页启用", "data": null }
```

> ⚠️ 前端 `handleSend` 判断 `res.ok === false || res.success === false` 是**死分支**（后端从不返回这两个字段）；失败只能靠 `catch`（即 httpBridge 对非成功 `code` 抛异常）。且错误文案字段是 `msg`，前端读取 `e.backendMessage`，两者可能不一致。
> ⚠️ 发送成功后仅 `recordMessage(..., "OUT", ...)` 落库；该落库会广播 `bot.message`，因此本端也会收到自己的消息推送。

### 3.5 AI 润色

`POST /v2/ai/bot-binding/polish`

请求体：`{ "botId": string, "text": string }`（任一为空 → `ReturnResult.illegal`）。

**响应**：`ReturnResult<Map{ result: string }>`。

> ⚠️ 模型未解析到 / 调用失败时，后端 `polishText` 内部 catch 并返回**空字符串**，外层仍是成功信封。前端只能提示"未返回内容"，无法区分"模型未配置"与"调用失败"。

### 3.6 上下文总结

`POST /v2/ai/bot-binding/summarize`

请求体：`{ "botId": string, "fromUser": string }`（`botId` 为空 → `ReturnResult.illegal`）。

**响应**：`ReturnResult<Map{ summary: string }>`。

> 同上：无消息 / 模型未配置 / 失败都返回空字符串 + 成功信封。最多取最近 200 条消息。

### 3.7 命令 / 联系人 / 运行状态

**命令清单**：`GET /v2/ai/bot-binding/commands` → `ReturnResult<List<Map>>`

| 字段 | 说明 |
| --- | --- |
| `prefix` | `/` / `@` / `#` |
| `name` | 命令名 |
| `description` | 描述 |

内置返回：`/reset`、`/model`、`/help`、`@用户`、`#用户`。

**联系人**：`GET /v2/ai/bot-binding/contacts?botId={botId}` → `ReturnResult<List<String>>`（`fromUser` 去重）。

**运行状态**：`GET /v2/ai/bot-binding/runtime-status?botId={botId}` → `ReturnResult<Map{ status }>`

| `status` | 含义 |
| --- | --- |
| `running` | ILink 轮询存活 |
| `stopped` | 未运行 / 会话超时（需重新扫码） |

### 3.8 WebSocket 实时消息

**连接**：`/ws`，子协议 `chat` 或 `nomi-local-trust`（`SubProtocolCapable` 声明）。

**信封**：服务端所有主动推送统一为 `{ "name": <event>, "data": <payload> }`。

**心跳**：服务端每 **20s** 推送 `{ "name": "ping" }`；前端应回 `{ "name": "pong" }`（服务端忽略，不回也不断连）。

**新消息事件**：`name = "bot.message"`

```json
{
  "name": "bot.message",
  "data": {
    "type": "bot.message",
    "botId": "wx_bot_123",
    "direction": "IN",
    "fromUser": "wxid_abc",
    "content": "在吗？",
    "createTime": "2026-09-12T10:05:00.123"
  }
}
```

前端订阅：`wsEmitter('bot.message').on(payload => ...)`，`payload` 为**解包后的 `data`**。

> ⚠️ 前端对 `content.startsWith('/')` 的消息直接 `return`（注释称"命令不保存数据库"），但后端 `AiBotChatService.handleMessage` 对**所有**入站消息都 `recordMessage(..., "IN", ...)` 落库并广播 → 实时看不到、刷新后又出现。

**会话删除事件**：`name = "bot.conversation-deleted"`

```json
{ "name": "bot.conversation-deleted", "data": { "type": "bot.conversation-deleted", "botId": "wx_bot_123", "fromUser": "wxid_abc" } }
```

> ⚠️ 后端在 `deleteConversation` 时广播，但 `BotImPage` **只订阅了 `bot.message`**，未处理该事件 → 跨端/跨页删除不会刷新会话列表。

---

## 4. 前后端核对：未实现 / 不一致清单

### 4.1 前端传了但后端**不存在**的字段（静默丢弃）

| 前端字段 | 出现位置 | 后端现状 | 后果 |
| --- | --- | --- | --- |
| `skills` | `BotBinding` 类型、表单多选、create/update payload | `BotBindingCreateRequest`、`BotBindingListResponse`、`SysAiBotBinding` **均无该字段** | "绑定的 Skill"多选**完全无效**：提交被 Jackson 忽略，列表也永远读不到 → 该 UI 是空转 |
| `contextThinking` | `BotBinding` 类型、表单开关、create/update payload | 上述三处**均无该字段** | per-bot 深度思考覆盖**完全无效**：`form.contextThinking` 恒为 `null`，开关恒显示为开；只有 `/global-config.contextThinking`（全局）真正生效 |

> 根因：`BotBindingController.update/create` 用 `BeanUtils.copyProperties(request, entity)`，只有名字匹配的字段会拷贝。

### 4.2 前端未使用但后端已实现

| 接口 | 说明 |
| --- | --- |
| `GET /v2/ai/bot-binding/users` | 管理员用户聚合；预期由 `/bots/users` 页面消费（该页面不在本仓库） |
| `GET /v2/ai/bot-binding/{id}` | 单条详情，未被调用 |
| `PUT /v2/ai/bot-binding/global-config` | 无页面写入入口（设置页未提交） |

### 4.3 语义 / 契约不一致

| # | 位置 | 问题 |
| --- | --- | --- |
| 1 | `GET /list` | 不传 `userId` 返回**全量**绑定，与 Javadoc"普通用户仅返回本人"矛盾 → 越权可见 |
| 2 | `PUT /update` | 前端发 `id`，后端 DTO 无 `id`，实际**按 `botId` 更新**；契约依赖"`botId` 只读"这一前端约定 |
| 3 | `POST /send` | 业务失败返回 `ReturnResult.error(msg)`，前端 `ok===false` / `success===false` 判断为死代码；错误字段名 `msg` vs 前端读 `backendMessage` |
| 4 | `POST /polish`、`/summarize` | 失败也返回成功信封 + 空字符串，前端无法区分失败原因 |
| 5 | `POST /feishu` | 失败抛 `IllegalArgumentException`（5xx）而非业务错误信封，前端只能通用报错 |
| 6 | `GET /conversations` | 无历史会话的 `fromUser` 被伪造成 `nickname \|\| botId`，与 WS / 消息接口的真实 `fromUser` 冲突 |
| 7 | WS `bot.message` | 前端丢弃 `/` 开头消息，后端却落库并广播 → 实时/历史不一致 |
| 8 | WS `bot.conversation-deleted` | 后端广播，前端未订阅 |
| 9 | `GET /v2/ai/skills/catalog` | 裸数组，与其他接口的 `ReturnResult` 信封不一致 |
| 10 | `create`/WS `bot.message` | 时间字段序列化格式可能不同（Jackson vs `LocalDateTime.toString()`） |
| 11 | `thinking` / `thinkingEffort` | 后端支持，但表单**没有对应 UI**（`thinking` 恒 `false`、`thinkingEffort` 恒 `""`） |
| 12 | `GET /conversations` | `BotConversation.unread` 后端未填充，前端"未读数"徽标恒为 0 |

### 4.4 建议的修复优先级

1. **4.1 `skills` / `contextThinking`**：补后端字段（DTO + 实体 + 建表）或移除前端 UI，二选一，避免"看起来能用实则无效"。
2. **4.3 #1 越权**：`/list` 按当前登录用户过滤，或明确标注为管理员接口。
3. **4.3 #3 `/send` 失败**：统一失败语义（要么返回 `{ok:false,msg}`，要么前端只依赖 `code`）。
4. **4.3 #6 / #7**：统一 `fromUser` 语义、统一 `/` 消息的落库与展示策略。
5. **4.3 #8**：`BotImPage` 补订阅 `bot.conversation-deleted`。

---

## 5. 变更记录

| 日期 | 说明 |
| --- | --- |
| 2026-09-12 | 初版：覆盖 `BotManagementPage` / `BotImPage` 全部接口、WS 契约与前后端核对清单 |
