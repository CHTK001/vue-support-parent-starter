# AI 控制台（ai-guada）第 4 轮修复记录 — 2026-10-08（晚）

> 承接 `SIGNOFF-20261008-round3.md`。本轮处理用户新报的 4 组缺陷（含 2 个子项）：
> ① 模型管理 NewAPI 长文本横向滚动条；③ 酒馆批量配置交互 + 酒馆 AI 全报错；
> ④.1 底部模型按钮宽度；④.2 思考等级与深度思考合并。
> 未完成项见第 4 节。主报告 `SIGNOFF-20261006.md` 仍被并发编辑，故继续单列。

## 1. 指纹绑定

| 项 | 值 |
| --- | --- |
| 后端 | `192.168.50.198:8787`（用户机器；本机经 vite 代理 `localhost:15689` 访问，直连同源 403） |
| 前端形态 | 本地 `vite dev`（15689）→ 代理 198:8787 |
| 本轮前端提交 | `4c60ab6cf`（宽度测量/档位回显修正）/ `2d28c4d25`（模型管理）/ `18f3c0784`（聊天工具条）/ `f7361c0c9`（酒馆） |
| 本轮后端提交 | `bb1c3bf22`（酒馆模型归一化）— 需重打 jar 部署后生效，见第 4 节 |
| 分支 | 本地提交，**未 push**（等用户授权） |

## 2. 本轮修复（用户报障）

| # | 缺陷 | 根因 | 修法 | 复现级证据 |
| --- | --- | --- | --- | --- |
| 1 | 模型管理里 NewAPI 文字太多 → 横向滚动条 | 模板库卡片/网格未收敛最小宽度；供应商详情滚动区允许横向溢出 | `.tc-grid`/`.tc-card` 补 `min-width:0` + 网格 `overflow-x:hidden`；`.tc-desc` 已省略号；`.detail-scroll` 补 `overflow-x:hidden` | Playwright 实测（1440/960/760px）：模型管理页与模板库 `docScrollWidth == docClientWidth`、越界元素 0；NewAPI 卡描述 `scrollWidth 328 > clientWidth 237`（被卡片裁掉，不外溢），卡右缘 715 < 1440 |
| 3 | 酒馆「批量配置」应改成图标放右侧、弹窗一行一个角色 | 原为头部文字按钮 + 「一次全部设成同一个模型」 | 头部改 `Settings20Regular` 图标按钮（与群设置并列）；弹窗改 view 列表，一行一个角色各自选模型，仅提交变化行 | 头部 `button[aria-label="批量配置"]` 在右侧（x=525）；弹窗标题「批量配置角色（4 名）」+ 4 行角色 + 4 个下拉 |
| 3.1 | 酒馆 AI 全报错（`未配置主 ChatClient...`） | 成员模型覆盖值落库为 `providerId:模型名`，后端按裸模型名查 ChatClient 落空 | ①前端存裸模型名并幂等迁移存量；②后端 `resolveModel` 走 `EffectiveChatModelResolver` 归一化并回落默认 | 迁移前 SSE `create(modelName=1791352877398:deepseek-v4.1-flash)` → `finish(error=未配置主 ChatClient...)`；迁移后 members 全裸名 → SSE `text(收到)` → `finish(stop)` |
| 4.1 | 底部模型按钮宽度应自适应并给最小宽度 | 宽度写死为自然宽 ×2（≤400）；且名称 span 为 `flex-1/min-w-0`，直接量会低估 | 取真实自然宽并 clamp 到 `[96, 400]`：克隆节点时把名称 span 还原为内容宽再量；CSS `width:90px` → `min-width:96px`；模型名/档位变化后 `flush:'post'` 重算 | `agnes-2.0-flash` 实测 143px（修复前估算 ×2=111px 且内容被截断）；开启思考后「agnes-2.0-flash 默认」171px；选「不思考」回 143px |
| 4.2 | 「思考等级」与「深度思考」合并 | 深度思考是独立开关，档位在模型面板里另起一节，入口分散 | 工具条上的「思考等级」入口合并两者：`不思考`=关闭，选档位=开启并切档；模型未声明档位时至少给「默认」；删除模型面板的「推理强度」区块 | 点「思考等级」弹标题「思考等级」含「不思考 / 默认」；选「默认」后按钮呈主色激活态且模型按钮回显「agnes-2.0-flash 默认」；选「不思考」恢复 |

## 3. 关键实现说明

- **裸模型名落库**：`TavernPage.vue` 新增 `normalizeModelOverride()`（仅在「前缀是已知供应商」且「冒号后是已知模型」时才剥离，避免误伤 `nvidia/xxx:free` 这类本身带冒号的模型名）与 `displayModel()`（展示兼容历史复合值）。
- **幂等迁移**：`loadMembers()` 后调用 `migrateCompositeModelOverrides()`，把仍是「已知供应商前缀 + 已知模型」的存量覆盖值改写为裸模型名；重复执行无副作用。这一步让**当前后端无需重部署**即可恢复酒馆 AI。
- **后端归一化**：`TavernChatController.resolveModel()` 交给 `EffectiveChatModelResolver.resolve(...)`，命中启用模型用裸名、否则回落 `getDefaultModel()`；与前端迁移双保险。
- **按钮宽度测量（4.1）**：名称 span 平时是 `flex-1 + min-w-0`（flex-basis:0%），对容器固有宽度贡献为 0；若直接量会把宽度算小、截断模型名。改为在克隆节点里临时把该 span 还原为内容宽再量，去掉早先 `×2` 的估算；并在模型名/档位变化后按 `flush:'post'` 重算。实测 `agnes-2.0-flash` = 143px（修复前估算 ×2 → 111px 且实际内容被截断）。
- **档位回显（4.2）**：思考开启即在模型按钮上回显档位（不再受 `showButtons.thinkingButton` 限制）；`defaultThink` 开启但档位仍是「不思考」时补齐为「默认」，避免按钮态与档位自相矛盾。

## 4. 未完成 / 待办

| 项 | 状态 | 说明 |
| --- | --- | --- |
| ④「漏数据」(image-1) | **待用户补图** | 原图在本机不可读，已请用户重新发图，按图定位后修复 |
| 后端 jar 重部署 | 待用户执行 | `bb1c3bf22` 需重打 jar 部署到 198 才生效；当前靠前端迁移已可恢复 |
| item 1 客观测量 | ✅ 完成 | Playwright 1440/960/760px 实测无横向溢出（见第 2 节证据） |
| `tool-row-probe.cjs` 复跑 | ✅ 完成 | 24/24 PASS，含 `a11y.noNestedInteractive=0`、`a11y.detailIsSibling=true` |
| dist 重建 + 全量探针回归 | 进行中 | 生产构建校验中；完成后对 dist 复跑关键探针 |
| push | 待授权 | 本地提交未推送 |

## 5. 变更文件

**前端（vue-support-parent-starter）**
- `apps/vue-support-ai-guada/src/components/models/TemplateCatalogDialog.vue`（item 1）
- `apps/vue-support-ai-guada/src/components/models/ModelsProviderDetail.vue`（item 1）
- `apps/vue-support-ai-guada/src/components/tavern/TavernPage.vue`（item 3 / 3.1）
- `apps/vue-support-ai-guada/src/components/chat/ChatInput.vue`（item 4.1 / 4.2）
- `apps/vue-support-ai-guada/src/components/chat/chat-input/ModelSelectorPanel.vue`（item 4.2）
- `apps/vue-support-ai-guada/src/components/chat/chat-input/ThinkingEffortPopover.vue`（item 4.2）
- `apps/vue-support-ai-guada/src/locales/zh-CN/chat.ts`、`src/locales/en-US/chat.ts`（item 4.2 文案）
- `apps/vue-support-ai-guada/src/acceptance/model-ctx-filter-check.html`（同步移除已删属性）

**后端（spring-support-parent-starter）**
- `spring-support-ai-starter/src/main/java/com/chua/starter/ai/support/controller/TavernChatController.java`（item 3.1）
