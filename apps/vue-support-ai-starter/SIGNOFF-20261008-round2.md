# AI 控制台（ai-guada）第 2 轮交付记录 — 2026-10-08

> 本轮报告独立成文：主报告 `SIGNOFF-20261006.md` 在收尾期间**被并发编辑**
> （行数/内容在变），为避免互相覆盖，本轮证据单列于此，口径与主报告一致。

## 1. 指纹绑定（跑前/跑后一致）

| 项 | 值 |
| --- | --- |
| 后端 jar | `/opt/ai-starter/app.jar`，md5 **`3d0bc88353a02282bef3774113c229ea`**，611,074,356 B |
| 后端进程 | systemd `ai-starter`，**active**，MainPID `2329405`，实例数 **1**，8787 监听者 = MainPID |
| 启动参数 | `-XX:+UseCompactObjectHeaders` ✓，RSS ≈ 873 MB |
| 数据库 | `jdbc:mysql://127.0.0.1:3306/ai_test`（**非 H2**，cmdline 内 `jdbc:h2` 计数 = 0） |
| 回滚源 | `/opt/ai-starter/app.jar.rollback-c4ba84d5dfa1da97c1c8e303e00a0c0c`（按旧包实际 md5 命名，已复核一致） |
| 前端形态 | 本地 `pnpm dev`（`http://localhost:15689`），vite 代理到 `192.168.50.198:8787`；按用户口径**不打包**，无 dist 指纹 |

后端关键修复（本轮换包的直接原因）：`GET /api/providers` 由 **500（DB 查询错误）→ 200**，
现返回 3 个供应商 / 37 个模型；`/v2/models`、`/v2/sessions`、`/v2/plugins/tool-displays` 均 200。

## 2. 新增功能：按上下文大小过滤（模型选择卡片 + 模型管理）

- **共享层** `src/utils/modelUtils.ts`：`CONTEXT_SIZE_TAGS` 定义常见档位标签
  （`<32K` / `32K-128K` / `128K-256K` / `256K-1M` / `≥1M` / `未知`，区间 `[min, max)`），
  `getModelContextWindow()`（手填 `context_window` 优先，回退 `metrics.context_window_tokens`，
  兼容原始行与 mapModel 映射行）、`formatContextSize()`、`matchesContextTags()`（多选并集）。
- **模型选择卡片** `ModelSelectorPanel.vue`：标签行多选过滤、行尾上下文徽标（4K/32K/128K/256K/1M，
  未知不占位）、筛选无匹配提示；**仅 1 个模型时不渲染标签行**。
- **模型管理** `ModelsProviderDetail.vue`：同套标签 + 计数 `x/总数` + 无匹配提示。
- i18n：`common.contextSize.*`（zh/en）。

## 3. 本轮修复的业务缺陷

| # | 缺陷 | 根因 | 修法 |
| --- | --- | --- | --- |
| 1 | 聊天页模型列表**偶发为空** → 按钮变「+ 添加模型」，点击还被跳去模型管理页 | `ChatInput.loadModels()` 请求失败只 `console.error`，无重试；`openModelPanel()` 把「加载失败」当「确实没模型」硬跳页 | 两处面板 `loadModels` **3 次退避重试** + 重试前清空防重复 + `modelsLoadFailed` 标记；打开面板先自愈重载，**失败留在原页提示**、真空才引导去模型管理 |
| 2 | 工具行 `role="button"` **内嵌**「详情」`<button>`（交互控件嵌套，a11y 缺陷） | 结构问题 | 「详情」按钮移到行体**同级**（`.tool-row-line`），悬停显隐改挂容器 + 相邻兄弟；行的点击/键盘/`aria-expanded`/字形状态机全保留 |
| 3 | 部署脚本**误杀**别的项目进程（上次杀了占 18190/18191 的 collect 实例） | `ss` 无 `sudo` 看不到 `pid=` 段 → 全部判成「无端口残留」 | 改 `sudo ss` 取「端口持有者 pid」逐个比对，持有端口一律保留（collect 已自愈：3 实例、端口恢复） |

同轮一并入库的既有修复：AI 建议发送即消费（`AiNextTaskPanel`）、工具行折叠交互（`MessageToolCalls` + `ToolCallDetail`）、
模型名显示口径不回退复合 id（`ChatInput`/`CharacterFormDialog`）、内置包/虚拟模型开关禁用。

## 4. 新增能力：会话思考强度档位（effectLevel）

- **模型管理可配**：`ModelFormDialog` 新增「思考强度档位」勾选（默认 `low/medium/high/max`），
  落库到 `capabilities[].thinking_efforts`（**复用 JSON 列，不新增数据库字段**）。
- **会话默认** `default` = **不传**（`default`/`none`/空一律不下发），交由各厂商默认。
- **链路**：会话设置 → 请求体 `thinkingEffort` → 后端 `ChatStreamOrchestrator` 读入并写
  `parameters.thinking_effort`（现有 `configureClient` 生效）→ 消息 metadata 回显档位。

## 5. 验收证据（本轮）

| 套件 | 结果 |
| --- | --- |
| 真实组件夹具 `model-ctx-filter-check.html` + `model-ctx-filter-probe.cjs` | **30/30 PASS**（全档位矩阵：徽标/指标表回退 256K/未知/并集/取消/点行选中/管理侧计数） |
| 工具行夹具 `tool-row-check.html` + `tool-row-probe.cjs` | **24/24 PASS**（含新增 `a11y.rowButtonRole` / `a11y.noNestedInteractive=0` / `a11y.detailIsSibling=true`） |
| **真实应用**业务验收 `model-ctx-filter-app-check.cjs`（15689 → 198） | **19/19 PASS EXIT=0**：登录→聊天页模型弹层 6 标签/37 模型、`128K-256K` 过滤 6 行且每行徽标在区间内、再点恢复 37；模型管理 25 卡片、过滤 6/25、计数徽标、恢复 25；`noPageErrors=[]`、`noApiErrors=[]` |

口径说明：`/weather-api/v1/forecast` 的 404 属**共享框架包天气多源回退探测**
（`["/weather-api","https://api.open-meteo.com"]`，本部署无本地代理后回退公网源），
非业务缺陷；探针失败口径已收敛为只看应用后端命名空间 `/api/`、`/v2/`。

## 6. 提交（本地，未 push）

| 仓库 | 提交 | 内容 |
| --- | --- | --- |
| vue-support-parent-starter | `02485f9c8` | 上下文大小过滤（两处）+ 档位标签共享层 + i18n + 3 个验收脚本 |
| vue-support-parent-starter | `baa84cf90` | 思考强度档位链路 + 模型列表加载健壮性（重试/不误跳页） |
| vue-support-parent-starter | `a511f38e2` | 工具行折叠 + a11y 修复 + AI 建议消费 + 模型名口径 + 验收脚本 |
| spring-support-parent-starter | `d7f19ac80` | 后端档位链路（读写 `thinking_efforts` / `thinking_effort` / 消息回显） |

## 7. 未完成 / 待办

1. **全量回归**（`ui-click-sweep` 25 路由、`warn-triage`、`chat-stream`、`import-all`、`hover-popover`）
   在 dev(15689) + 新 jar 上后台跑中，结论待补。
2. **effectLevel 的 API 级验收**（模型配档位 → 落库 → 会话发送 → 消息回显）尚未单独取证。
3. **push**：以上提交均在本地，按约定等用户批准后再推送。
4. 服务器内存仍偏紧（本轮开工可用 575 MB、swap 用满；腾挪后 ~1.8 GB），后端 `Xmx3g` 长跑仍有 OOM 风险。
