# AI 控制台（ai-guada）第 3 轮修复记录 — 2026-10-08（下午）

> 承接 `SIGNOFF-20261008-round2.md`。本轮处理用户新报的 3 个业务缺陷 + 1 项交互改造，并逐条给出复现级证据。
> 主报告 `SIGNOFF-20261006.md` 仍被并发编辑，故继续单列。

## 1. 指纹绑定

| 项 | 值 |
| --- | --- |
| 后端 jar | `/opt/ai-starter/app.jar` = **`fb113162a6789a7f51a8a35d6b13fbf9`**（611,072,229B） |
| 后端进程 | systemd `ai-starter` **active**，MainPID `2472396`，`-XX:+UseCompactObjectHeaders` ✓，`jdbc:mysql://127.0.0.1:3306/ai_test`（非 H2），实例数 **1**，8787 监听者 = MainPID |
| 前端形态 | 本地 `pnpm dev`（15689）→ 代理 198:8787；**冻结版本 = 前端提交 `2efcda3ad`、后端提交 `7941942ae`** |
| 回滚源 | `/opt/ai-starter/app.jar.rollback-9889420b1e5419e8882661da730bf438`（换包前旧包，已按实际 md5 命名） |

## 2. 本轮修复（用户报障）

| # | 缺陷 | 根因 | 修法 | 复现级证据 |
| --- | --- | --- | --- | --- |
| 1 | 点 AI 建议应**销毁整块组件**，而不是只删那条建议 | 原实现只 `splice` 被点的那条 | `AiNextTaskPanel.onPick()` 清空本地列表 → `visible=false` → `v-if` 卸载整块（等同点 X）；后端仍是权威，下次 load/重新联想照常出现 | 探针：`suggestion.componentDestroyedAfterPick :: panelStillVisible=false`（点前 3 条建议） |
| 2 | 点「重新生成」后切回第一个会话**变成两行记录** | `multi_version` 时后端先回放既有用户消息，**回放副本 id 与真实用户轮次不同** → 按 id 去重判不掉 | `useStreamResponse` 在 `multi_version` 下**忽略回放帧**；并对「与最后一条用户消息同文」做内容兜底去重 | 探针：`regenerate.clicked=true`，切走再切回后 `beforeUsers=3 / afterUsers=3 / dup=0`（接口为准） |
| 3 | **AI 无法写入工作间** | 管理员在「未启用任何 MCP/本地工具/子代理/Plan」时**早退返回普通客户端** → 没有 HarnessAgent → 没有文件工具（`AgentScopeAgent.prepareRun` 报"未配置主 ChatClient"是另一支；本支是压根不建 Agent） | `AiChatFacadeServiceImpl`：早退判据纳入 `hasWorkspace`（**有工作间就必须建 Agent**），并复用同一 `agentWorkspace` 值设置 `agent.workspace(...)` | 实测：修复前三个模型（laguna/agnes-2.5-pro/agnes-2.0-flash）一致回"**我当前没有可用的文件工具**"且零落盘；修复后 `/opt/ai-starter/workspace/admin/agent/74/e2e-write-test.txt` **真实落盘**（并伴随 agent 记忆文件 `74/memory/2026-10-07.md`） |
| 4 | 「执行日志」整块文本不合意：每个工具调用（`agent_send`/`list_files`/`agent_spawn`…）要**单独一行、可展开、默认折叠** | `TurnItem` 有 agentscope 全量 trace 控制台整块倾倒 | 下线该控制台；工具活动全部走 `ProcessTimeline → MessageToolCalls` 逐行（默认折叠、点击展开）；`toolDisplay` 新增内置工具兜底映射（agent_*/list_files/read_file/write_file/search_files/bash 等），后端 `tool-displays` 为空桩时不再退化成通用文案 | 编译校验通过（TurnItem 已无 `trace-console__body`、toolDisplay 含 `BUILTIN_TOOL_ICONS`）；工具行交互由 `tool-row-probe` 24/24 保障 |

## 3. 本轮其它已证结论

- **流式缺陷（`All N client(s) stream failed`）**：根因 = `utils-support-deeplearning-agentscope-starter` **陈旧内嵌依赖**（未先 install 就重打）。安装该模块后重打 → API 直测 `All 1 client(s)` **增量 0**，流式 `create→text→finish(stop)` 完整；`chat-stream-accept` **14/14 PASS**。
- **effectLevel 运行链路**：`thinkingEffort=high` → 后端日志「应用思考强度档位」**+1**；`default` → **+0**（不传）。模型管理侧写/读尚未以真实数据走通（当前无模型配置档位，前端默认集合兜底）。
- 其它套件（新后端）：`warn-triage` 全 PASS；`import-all` 29/29；`hover-popover` 23/23。
- 198 磁盘 P1 已清：`/` 可用 21G→**29G**，`/tmp` tmpfs 0→1.3G；部署脚本"误杀同项目实例"的判据已修（`sudo ss` 取端口持有者）并重传远端。

## 4. 提交（本地，未 push）

| 仓库 | 提交 | 内容 |
| --- | --- | --- |
| vue-support-parent-starter | `2efcda3ad` | 工具调用逐行可展开 + 下线执行日志 + 内置工具映射 + #1/#2 修复 + 两个验收脚本 |
| spring-support-parent-starter | `7941942ae` | #3 修复：有工作间即建 Agent（AI 才能写工作间） |

> 同仓另有其它会话的提交（如 `3fc862041` eduai、`4002ec30f` 他们的 ai-guada 验收报告），与本轮无关；**他们的 25/25 FAIL=0 报告是改动前指纹，不作为本轮证据**。

## 5. 未完成

1. **25 路由 dev 分块 sweep（本轮冻结版本）**：运行中（`sweep-dev-chunks.ps1`，每块 5 条、被杀自动补跑）；完成后给出逐路由 PASS/FAIL/WARN + 4xx/5xx 台账，FAIL/WARN 逐条修或定性。
2. effectLevel 模型管理侧写/读的真实数据取证。
3. push：以上提交均在本地，等用户批准。

## 6. 追加（同日晚，用户新报 + effectLevel 取证）

| 项 | 结论 | 证据 |
| --- | --- | --- |
| **#5 生成中刷新丢回复** | 已修并验收 | 根因实验：生成 3 秒掐断客户端 → `isRunning=true`、40 秒后助手消息 **+1 落库**（后端不依赖客户端）；丢点在刷新后前端 subscribe 模式两处 `skipping`（本地 store 空 + 消息未落库 → 目标不存在即整条跳过）。修法：`handleUpdateMessage` **建占位接住增量**。验收 `refresh-stream-probe` **5/5 PASS**（刷新后可见 576 字、落库 546 字） |
| **effectLevel 模型侧写/读** | 已验证 | `PUT /api/provider-models{provider_id:agnes, model:{model:agnes-2.0-flash, thinking_efforts:[low,medium,high,max]}}` → 读回 `['low','medium','high','max']`；DB `capabilities[].thinking_efforts` 同上；`alias` 等字段未被破坏 |
| **effectLevel 运行链路** | 已验证 | `thinkingEffort=high` → 日志「应用思考强度档位」+1；`default` → +0 |
| 分块 runner 严校验 | 已加强 | 报告合格判据由"字节数"改为**核对报告内路由条数**（防半截报告） |
| 本次新增提交 | 本地 | `c1293d50a`（刷新丢回复修复 + 探针 + runner 严校验） |
