# AI 控制台（ai-guada）第 6 轮修复记录 — 2026-10-09

> 承接 `SIGNOFF-20261009-round5.md`。本轮处理用户新报的 5 项（两批消息）：
> ① 「执行过程」折叠摘要条不要了，里面的过程行直接放出来；
> ② 回合执行期间中间要有自动计算、实时更新的耗时（用户示例 `17s` 徽标），用于判断整个命令还在执行；
> ③ 「加载工具详情失败」修复——展开已调用工具必弹；
> ④ 模型选择去除上下文大小过滤；
> ⑤ 模型选择添加检索框搜索模型。

## 1. 指纹绑定

| 项 | 值 |
| --- | --- |
| 后端 | `192.168.50.198:8787`（本机经 vite 代理 `localhost:15689` 访问） |
| 前端形态 | 本地 `vite dev`（15689）→ 代理 198:8787；`dist` 产物由 `scripts/serve-dist.mjs`（15690）复验 |
| 本轮前端提交 | `49de89d90`（五项 + 探针同步） |
| 分支 | 本地提交（含 round4/round5 的 `435a7e67c` `1f26fbc07` `28a115479` `b442baed7` `59c18f41e`），**未 push**（等用户授权） |

## 2. 本轮修复（用户报障）

| # | 缺陷 | 根因 | 修法 | 证据（见第 4 节） |
| --- | --- | --- | --- | --- |
| 1 | 「执行过程」折叠条多此一举，过程要点开才见 | `TurnItem` 用 `TurnProcessSummary` 摘要条 + `processExpanded=false` 门控 `ProcessTimeline` 的 search/think/tool 行 | 摘要条组件与门控整体下线：删 `TurnProcessSummary.vue`、`turnPhases.ts`、`processExpanded`/`turnPhases` 代码与 locale 文案；`ProcessTimeline` 走 `showProcess` 默认 `true`，过程行进回合即见 | 流中 `.turn-summary`/`.ts-head` 计数 0；思考行（此前被门控）流中 **1s 内直接可见**并留存，内容行流中/流后可见 |
| 2 | 执行期间无法判断整个命令还在跑 | 只有左下角小字「工作中」，无居中实时耗时 | 新增居中 `.exec-timer__pill` 徽标：数据源 `useStreamResponse` 的 100ms 计时器（`message.totalDurationMs`），整秒自增（`17s`/`2m 5s`），随流式起落，流结束即隐；底部状态行去重时长只留「工作中」 | 连续两次读数 `"0s" → "2s"` 自增；流后徽标计数 0；截图中居中 `3s` 徽标 + 底部「工作中」 |
| 3 | 展开已调用工具必弹「加载工具详情失败」 | `MessageToolCalls` 懒加载打到 `/message-content/{id}/tool-details`——**后端从未实现该端点**（spring 仓 grep 无 `message-content`/`tool-details`，实测 `GET /v2/message-content/123/tool-details` → **404 S0503C0000 资源不存在**），每次展开/开弹窗必 404 → toast | 删除整条懒加载（`loadToolDetails`/`needsLazyLoad`/`watch(showDialog)`/loading 态/toast/`contentId` prop），详情直读消息自带的 `toolCalls`/`toolCallsResponse` 轨迹（`AiSessionController` 历史接口本就随消息返回 toolTrace）；行体展开与「查看详情」弹窗双路径零网络请求 | 夹具带 `contentId` 复现报障场景：展开后**零** `/message-content/` 请求、**零**错误 toast；弹窗路径同 |
| 4 | 模型选择的上下文大小过滤要去掉 | 用户需求 | 选择卡片移除 `.ctx-filter` 标签行与 `ctxFilter`/`matchesContextTags` 消费；**模型管理页档位过滤保留**（`ModelsProviderDetail` 独立实现不受影响）；行尾上下文徽标（128K/1M）仅展示不过滤 | 真实应用 `.model-panel .ctx-tag` = 0（37 模型）；管理页 `.d-section-head .ctx-tag` 仍 6 档且过滤自洽 |
| 5 | 模型选择要加检索框 | 用户需求（37 个模型肉眼翻太慢） | 面板顶部新增 `.model-search`：按「显示名/裸模型名/供应商名」不区分大小写即时过滤；打开自动聚焦（弹层晚挂载短重试兜底）；关闭重置关键词；输入即收起悬停信息卡（行被整体替换防挂空行）；单模型变体不渲染；空态复用「没有符合筛选条件的模型」；i18n `chat.input.modelSearchPlaceholder`（搜索模型 / Search models） | 真实应用：检索框渲染且**自动聚焦**，`agnes-2.` → 5/37 行，无匹配提示、清空恢复 37；夹具语义 37/37（子串/大小写/供应商/裸名片段/清空/无匹配） |

## 3. 关键实现说明

- **计时徽标数据源**：`useStreamResponse` 的 `startDurationTimer` 在流开始时挂 100ms 定时器累加 `message.totalDurationMs`（消息级，含续跑基线），`TurnItem` 的 `durationText`/`elapsedPillText` 消费同一值——徽标天然与「整回合」对齐，`<60s` 显示 `17s`，`≥60s` 显示 `2m 5s`，`prefers-reduced-motion` 下停掉呼吸动画。
- **A3 根因链**：端点不存在（404 实测）→ 修复不是「把错误吞掉」，而是**删除无意义的网络往返**——工具轨迹历史接口已随消息返回（`AiSessionController` 把 `toolTrace` 写进 `contentMetadata.toolCalls/toolCallsResponse`），实时轨迹在消息本体里，展开即渲染。同时移除 locale 的 `loadingDetails`/`loadDetailsFailed` 等死文案。
- **检索与悬停卡的交互**：检索词变化会整体替换列表 DOM，旧悬停目标失联会让信息卡挂在空节点上——`watch(searchKw)` 先 `closeHoverCard()` 再渲染，保证卡片只挂在存活行。
- **面板关闭三清**：`visible=false` 时收起信息卡 + 清空检索词，保证下次打开是完整列表（探针 `searchCleared` 断言即此语义）。
- **探针同步（防误导）**：`model-ctx-filter-probe`（夹具）与 `model-ctx-filter-app-check`（真实应用）原断言面板 ctx 标签，按新行为改写为「标签移除 + 检索语义」；管理页侧断言原样保留。`tool-row-check.html` 夹具补 `contentId`（模拟历史消息报障现场），`tool-row-probe` 新增 4 项零请求/零 toast 断言。

## 4. 实测证据

### 4.1 dev（15689）

- **条目 1+2（`r6-verify.cjs`，真实流）**：**16/16 PASS** —— 思考等级开到「高强度」发推导题：徽标 `"0s"→"2s"` 自增、流中 `.turn-summary`/`.ts-head`=0、**思考行流中 1s 内直接可见**（此前被门控）、内容行流中/流后可见、思考行流后留存、流后徽标=0；收尾把思考档位弹层往返恢复到探针前值（`none→none`）、mock 键清理、页面报错 0。截图 `r6-a2-stream.png`：居中 `3s` 徽标 + 思考/内容行直出 + 底部仅「工作中」。
- **条目 3（`tool-row-probe.cjs`，夹具带 contentId 复现现场）**：**28/28 PASS**（原 24 + 新 4）—— 展开行体：`expand.noLazyFetch=[]`（零 `/message-content/` 请求）、`expand.noLoadFailedToast`（零错误 toast）；「查看详情」弹窗：`dialog.noLazyFetch=[]`、`dialog.noLoadFailedToast`；夹具自身无页面报错。
- **条目 3（根因实证）**：`GET /v2/message-content/123/tool-details` → **404**（`S0503C0000 资源不存在`）；spring 仓 grep `tool-details|toolDetails|message-content` 无任何端点定义。
- **条目 4+5（`model-ctx-filter-probe.cjs`，夹具）**：**37/37 PASS** —— 面板标签 0、检索框渲染、`huge/HUGE/fixture(供应商)/128k` 命中语义、清空按钮恢复 6 行、无匹配提示；管理页 6 档过滤矩阵原样通过；单模型变体不渲染检索框；页面报错 0。
- **条目 4+5（`model-ctx-filter-app-check.cjs`，真实应用）**：**21/21 PASS** —— `.model-panel .ctx-tag`=0、检索框渲染且**自动聚焦**（`activeElement.className=model-search__input`）、`agnes-2.` → 5/37 行、无匹配提示、清空恢复 37/37；管理页 25 卡 + 6 档过滤自洽（`128K-256K`→6/25、计数徽标、恢复 25）；页面/接口错误 0。
- **面板与流式回归**：`hover-popover-check.cjs` **23/23 PASS**；`chat-stream-accept.cjs` **14/14 PASS**（含完整流式、7.7s 收尾、接口无失败）。

### 4.2 dist 产物（15690）——隔离构建

- **共享工作树构建被他人未提交改动污染（重要）**：首次按工作树直接 `vite build` 虽成功（5m35s），但产物**白屏**：`ReferenceError: Cannot access '_c' before initialization`（`file-viewer-word` 分块，`@file-viewer/renderer-word` 顶层 `_c.filter(...)` 循环导入 TDZ）。溯源：另一会话正在集成 `@file-viewer`，其**未提交**的 `vite.config.ts`/`package.json`/`pages/filesystem` 改动随构建进入产物；dev 不受影响（模块初始化顺序不同），产物必挂。**与本轮五项无关**（ai-guada 聊天组件零涉及）。
- **隔离方案**：`git worktree add D:\ch\project\dist-verify-r6 49de89d90`（冻结在本轮提交）→ `pnpm install`（1m47s）→ 补 `index.html`（`apps/*/index.html` 为 gitignore 生成物，内容为 9/26 老文件、无他人痕迹）→ 镜像主仓历史遗留的未声明依赖链接（`@repo/*` junction 5 个 + 真实目录 219 个，fresh install 不会重建、主仓构建依赖它们）→ `vite build` **built in 3m24s，零 error**。
- **产物服务**：worktree 内 `node scripts/serve-dist.mjs 15690`（反代 198:8787，`app.yaml` 齐备）：`/` 200、登录 200、**boot sanity 通过**（`.model-selector-btn` 渲染 = 1，即主仓产物白屏处）。
- **`r6-verify.cjs`（dist）**：**16/16 PASS**（与 dev 逐项一致）：徽标 `"0s"→"2s"` 自增、思考行流中 3s 内直接可见、流中/流后 `.turn-summary`=0、流后徽标=0、思考档位往返恢复（`none→none`）、mock 键清理、页面报错 0。
- **`model-ctx-filter-app-check.cjs`（dist）**：**21/21 PASS**（与 dev 逐项一致）：面板 `.ctx-tag`=0（37 模型）、检索框渲染且自动聚焦、`agnes-2.` → 5/37、无匹配提示、清空恢复 37/37；管理页 6 档过滤自洽（25 卡、`128K-256K`→6/25）；页面/接口错误 0。
- **`run-all-against-dist.mjs` 全量产物套件**：**109 / 110 PASSED**（round5 123/124，round4 120/124）：
  - 唯一计分失败仍是 `acc-image-lib-foot 0/1`：夹具脚本自身异常（`locator.fill: value: expected string, got undefined`，round4/5 同款，非产品缺陷）——**根因与修复见 §7.2**；
  - 与 round5 差 14 分 = `acc-face-edit` 本次**未产生计分**：造数 `POST /v2/face/enroll` 后端报 `S0503C0000 人脸登记失败: DJL 图像转换失败: scrfd-face-detector`——**绕开前端直调该接口复现同一错误**，属 198 环境人脸检测服务故障，非前端缺陷（round5 时该接口正常、14 项全过）——**该判断后被复验收口推翻，根因更正见 §7.1（非后端故障）**；
  - 分套件：`prodgrade 16/16`、`search-ux 22/22`、`search-render 12/12`、`rename 14/14`、`video 15/15`、`library-menu 30/30`。
- **`tool-row-probe`/夹具类**：dev 专用（`/src/acceptance/*.html` 产物不含），dist 下不适用，dev 侧已 28/28。

## 5. 待办

| 项 | 状态 | 说明 |
| --- | --- | --- |
| ~~198 人脸登记接口故障~~ | **已撤回**（根因更正，§7.1） | 实为隔离 worktree 缺 gitignore（`*.jpg`）的 `public/gen-style/photo.jpg` → 套件把 404 页当照片上传 → imdecode 失败被包成同款报错；后端健康（dev 直调 enroll 3/3 成功），补拷 8 个被忽略资产后 `acc-face-edit` 14/14 |
| 他人未提交的 `@file-viewer` 集成挂死**产物**构建 | **本仓已修复**（包上游待办） | `f75df91b5` manualChunks 合并 ofd/word 单块恢复求值顺序；boot pageerror=0 + r6 回归 + 全量 194/194 验证（§7.3）。遗留：合并块约 9MB eager、`@file-viewer` 包上游 ofd/word 源码环——移交对应会话 |
| 三套件依赖 `AI_ACCEPT_PASS` 静默丢覆盖 | 已加固（§7.4） | image-lib-ui/image-library-tab/salted-login 刻意 env-only，round4/5/6 每轮静默丢 67 项；runner 现启动预警 + 「无 RESULT/有失败」非零退出（`b710a35b2`），操作侧设 env 后 194/194 |
| mock 工具场景陈旧 | 已知非产品问题 | `VITE_ENABLE_MOCK` 的 `WITH_TOOL_CALLS` 场景流事件能跑完但 UI 不落消息（`createMessage` 拦截日志缺失、消息区空白）——dev 演示夹具与现行发送链路脱节，未属本轮范围；A3 验收改用带 `contentId` 的组件夹具复现 |
| 后端 jar 重部署 | 待用户执行 | round4 的 `bb1c3bf22`（酒馆模型归一化）需重打 jar 部署到 198 才生效；当前靠前端迁移已可恢复 |
| 25 路由 `ui-click-sweep` | 待低峰补跑 | 高频点击触发后端 429，限流下结果不可信 |
| push | 待授权 | 本地提交未推送（round4/5/6 累计 7 个 + 本轮 fixup 3 个 = **10 个**） |

## 6. 变更文件

**前端（vue-support-parent-starter，提交 `49de89d90`）**
- `apps/vue-support-ai-guada/src/components/chat/TurnItem.vue`（条目 1/2 — 摘要条下线、计时徽标、状态行去重、死代码清理）
- `apps/vue-support-ai-guada/src/components/chat/message-item/TurnProcessSummary.vue`（条目 1 — **删除**）
- `apps/vue-support-ai-guada/src/utils/turnPhases.ts`（条目 1 — **删除**，仅摘要条消费）
- `apps/vue-support-ai-guada/src/components/chat/message-item/MessageToolCalls.vue`（条目 3 — 幽灵端点懒加载整链删除）
- `apps/vue-support-ai-guada/src/components/chat/message-item/ProcessTimeline.vue`（条目 1/3 — 去 `show-process` 门控传参、去 `content-id` 传参）
- `apps/vue-support-ai-guada/src/components/chat/chat-input/ModelSelectorPanel.vue`（条目 4/5 — 过滤行移除、检索框 + 聚焦/重置/悬停联动）
- `apps/vue-support-ai-guada/src/locales/zh-CN/chat.ts`、`src/locales/en-US/chat.ts`（条目 5 检索占位文案；条目 1/3 死文案清理）
- `apps/vue-support-ai-guada/src/types/components.d.ts`（`TurnProcessSummary` 过期条目移除；顺带带上已提交组件 `FaceLandmarkDialog` 的自动生成条目）
- `apps/vue-support-ai-guada/src/acceptance/model-ctx-filter-probe.cjs`、`model-ctx-filter-app-check.cjs`（条目 4/5 探针改写）
- `apps/vue-support-ai-guada/src/acceptance/tool-row-check.html`、`tool-row-probe.cjs`（条目 3 — 夹具带 contentId + 4 项零请求/零 toast 断言）

## 7. 二次修复与收口（2026-10-09 round6-fixup）

> 交付后用户指示「修复」，选定三项：①产物白屏 ②`acc-image-lib-foot` 夹具 ③人脸登记复验收口。
> 复验环境：主共享工作树重建（含他人 `@file-viewer` 未提交集成 + 本轮配置修复）→ dist 服务 15691；冻结 worktree（15690，`49de89d90`）用于 foot/face 单项复验。

### 7.1 人脸登记复验收口 —— 结论反转：非后端故障

- **根因**：`.gitignore:117` 全局忽略 `*.jpg`，`public/gen-style/photo.jpg` 从未 checkout 进隔离 worktree；serve-dist 的 `resolveStatic` 无 `public/` 兜底（仅 dist → SHARED → `/wasm` → app.yaml 垫片），套件取到 404 页 HTML 当照片上传 → OpenCV imdecode 失败 → 被 `DjlModelTranslator` 包成 `DJL 图像转换失败: scrfd-face-detector` 返回。此前「绕开前端直调复现」同样经 15690 取图，故复现出同款报错——**并非 198 后端故障**。
- **证据**：dev 代理（15689，主树 public 齐备）直调 `POST /v2/face/enroll` 连试 3 次全部 `00000 操作成功`（222–379ms）；补拷 8 个被 gitignore 的 public 资产（跳过他人 `vendor/`）到 worktree public + dist 后，`acc-face-edit` **14/14 PASSED**（15690）。
- **处置**：§4.2/§5 原「198 人脸登记接口故障、待后端处理」判断**撤回**（20261004 报告的 3 条同款报错属另案历史问题，非本轮范围）。

### 7.2 `acc-image-lib-foot` 夹具修复 —— round4/5/6 三轮 0/1 根因

- **根因**：`const PASS = process.env.AI_ACCEPT_PASS` 无默认值，而所有 runner 只注入 `AI_ACCEPT_BASE` → 登录 `.fill(undefined)` 必抛 `value: expected string, got undefined`；其余 9 个套件均 `|| 'admin123'`，仅此文件漏配。
- **修复/验证**：补默认值（`b710a35b2`）；dist（15690）**4/4**、dev（15689）**4/4**（底栏 `特征模型：cn-clip-rn50-image · 相似度下限 0.76`、占用 `9.5 MB`）。

### 7.3 产物白屏修复 —— `@file-viewer` ofd ⇄ word 跨块循环引用 TDZ

- **根因链**（CDP initiator + 分块边实证）：`file-viewer-ofd` ⇄ `file-viewer-word` **跨块静态互引**（ofd `import{e} from word`；word `import{…, D as _c, …} from ofd`），入口 `index-BittFdeF` 又静态引用两块 → 浏览器按「入口 → word → ofd」求值，word 顶层 `_c.filter(...)` 执行时 ofd 的 `_c` 尚在 TDZ → `ReferenceError: Cannot access '_c' before initialization` boot 即死。全 dist **132 个块**静态引用该共享块 → 任一路由皆崩；dev 逐模块求值顺序不同故仅构建态暴露。
- **修复**：`vite.config.ts` 新增 `build.rollupOptions.output.manualChunks`，`@file-viewer`/`docx-preview` 并入单块（`f75df91b5`，**仅部分暂存本 hunk**——该文件其余未提交改动属集成会话，保留在工作区）。
- **验证**（主树重建 6m32s 零 error → 15691）：boot sanity `bodyLen 0→328`、侧栏/会话列表/编辑器/模型按钮全渲染、**pageerror 0**（修复前同脚本必现 `_c`）；r6 回归 **16/16**、`model-ctx-filter-app-check` **21/21**；全量见 7.4。
- **权衡/移交**：合并块 `file-viewer-*.js` 约 9.0MB（入口静态引用渲染器块所致，该结构源自他人未提交集成）；根治需在 `@file-viewer` 包上游解开 ofd/word 源码环——已列入 §5 待办移交对应会话。

### 7.4 全量产物套件覆盖修正 —— 194/194

- 修复后首轮合计 **127/127**（face 14/14、foot 4/4 已入计），但 `acc-image-lib-ui`/`acc-image-library-tab`/`acc-salted-login` 三套件「无 RESULT」。
- **追查**：三者均**刻意 env-only**（salted-login 注释明言「拒绝把明文口令写进脚本」），runner 透传 env 而操作侧从未设置 → round4/5/6 每轮**静默丢 67 项覆盖**（round5 的 123/124 同样不含它们，历史总分不可比）。
- **补跑**（shell env 注入 `AI_ACCEPT_PASS`，不入库）：image-lib-ui **38/38**、image-library-tab **14/14**、salted-login **15/15** → **全量 194/194 PASSED、runner exit=0**（11 套件全部产出结果）。
- **runner 加固**（`b710a35b2`）：缺 `AI_ACCEPT_PASS` 启动预警点名三套件；「无 RESULT」或任一检查失败 → `exitCode=1`（此前恒 0）。

### 7.5 fixup 变更文件

- `apps/vue-support-ai-guada/vite.config.ts`（`f75df91b5`，部分暂存 —— 仅 manualChunks hunk）
- `apps/vue-support-ai-guada/src/acceptance/acc-image-lib-foot.mjs`、`run-all-against-dist.mjs`（`b710a35b2`）
- `apps/vue-support-ai-guada/SIGNOFF-20261009-round6.md`（本文件，签核更正 + §7）

## 8. 「agent 没有输出结果、页面不显示」缺陷分析与修复（2026-10-10）

> 现场：用户让 agent 画鹈鹕骑车，页面上看不到任何图；模型正文里还留着一段未执行的
> magick 伪工具调用（用户贴出并标注「没处理」）。

### 8.1 三层根因（全部实证）

1. **模型层（输出没被执行）**：#229 正文里是模型自己吐的**纯文本伪工具调用**
   （`execute<arg_key>cmd</arg_key>...`）——全仓库 grep `arg_key` **零匹配**，
   不存在任何解析器，magick 转换从未真正运行。结构化 toolCalls 里只有 2 次 write_file。
2. **数据层（图其实早已生成）**：#227 的 convert 已成功 —— 服务端
   `/opt/ai-starter/workspace/admin/agent/85/pelican_bike.png` 实存 **31239 字节、PNG 魔数正确**；
   `raw-file` 端点 200 image/png 可取回。另有 3 个 SVG 变体同实存。
   （`/workspace/file` 端点读二进制 500 "Input length = 1" = Java 按 UTF-8 解 PNG，
   但 `raw-file` 裸流端点完好，前端取图应走后者。）
3. **前端层（根本缺口）**：聊天消息渲染链 `MarkdownContent(marked)` 只把路径渲染成
   行内代码/纯文本，**全无「消息内展示工作区图片」的机制** —— 图在服务器上、端点可取，
   页面却无处显示，用户遂判「agent 没输出」。

### 8.2 修复：MessageOutputImages 组件

- 新增 `src/components/chat/message-item/MessageOutputImages.vue`：
  扫描本轮**全部版本**消息 JSON（正文 + toolCalls 参数 + 工具返回）提取图片路径 token
  （png/jpg/gif/webp/svg/bmp/avif），逐 token 生成候选路径
  （绝对原样 / 去头斜杠 / `{sessionId}/` 前缀 / 工作区根），经
  `getWorkspaceRawFileUrl` + `loadAuthenticatedImage`（令牌不进 URL）取回才渲染；
  幻觉路径（404）静默丢弃不显裂图；流式结束给失败 token 一次重试（文件可能后落地）。
- **去重**：`normalizeKey()` 把绝对/相对双写法归一（`/opt/.../85/x.png` 与 `85/x.png`
  同一文件只出一张）；token 封顶 16、展示封顶 12、单 token 候选封顶 3，防请求风暴。
- 挂载：`TurnItem` 新增 `sessionId` prop，`ProcessTimeline` 之后渲染
  `<MessageOutputImages :messages="turn.assistants">`（传整轮全版本——图片是真实产物，
  不随文本版本 4/4 切换丢失）；`ChatPanel` 传 `effectiveSessionId`、
  `BotSessionDialog` 传 `session.id`。点击缩略图开 `el-image-viewer` 大图。

### 8.3 验证（dev 15689 生产级浏览器实测）

- 会话 85 回归：**5 张唯一图**（去重前 7）、naturalWidth 全部 >0（0 裂图）、**pageerror 0**；
  点击开查看器 `el-image-viewer__wrapper` 在 DOM、blob img 正常。
- 端到端：输入框真实发送「戴蓝色头盔的鹈鹕骑车」→ 流结束**新回合产出的 SVG 实时上屏（6 张）**、0 报错。
- 回归面：纯文本会话 94 与 new-session —— `raw-file` 请求数 **0**、图片 **0**、pageerror 0
  （无图片 token 时不产生任何额外请求）。
- 提交归属：组件与三处挂载被并行会话的宽泛提交 `5674f51a4` 扫入 git（内容即最终验证版）。
- 附带确认（非本轮改动）：正文里伪工具调用按原文显示属模型输出如实呈现，
  后端无对应解析器属 agent 工具链问题，已在此记录待后端案处理。
