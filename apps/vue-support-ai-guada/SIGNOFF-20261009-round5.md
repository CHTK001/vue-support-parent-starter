# AI 控制台（ai-guada）第 5 轮修复记录 — 2026-10-09

> 承接 `SIGNOFF-20261008-round4.md`。本轮处理用户新报的 3 项，另修测试中实证的 2 个同族缺陷：
> ① 酒馆浏览器实测（结合浏览器验证 AI 回复链路）；
> ② 思考等级弹层补齐「模型管理里配置的档位」（不再只有 不思考/默认），入口移到模型按钮旁边；
> ③ 构建/规划运行模式改为模型右侧的彩色徽标，构建/规划颜色区分；
> 附：思考态刷新丢失/误点亮（档位=开关唯一事实源自洽化）；酒馆空回复空气泡（历史过滤 + 零输出占位兜底）。

## 1. 指纹绑定

| 项 | 值 |
| --- | --- |
| 后端 | `192.168.50.198:8787`（本机经 vite 代理 `localhost:15689` 访问） |
| 前端形态 | 本地 `vite dev`（15689）→ 代理 198:8787；`dist` 产物由 `scripts/serve-dist.mjs`（15690）复验 |
| 本轮前端提交 | `28a115479`（三项 + 酒馆过滤）/ `b442baed7`（酒馆零输出兜底） |
| 分支 | 本地提交（含 round4 的 `435a7e67c`/`1f26fbc07`），**未 push**（等用户授权） |

## 2. 本轮修复（用户报障）

| # | 缺陷 | 根因 | 修法 | 证据（见第 4 节） |
| --- | --- | --- | --- | --- |
| 1 | 酒馆需结合浏览器实测 | — | 浏览器端到端：登录 → 测试群 → 发消息 → 收集回复 + 页面/接口错误监听 | 4 角色全部非空回复（`agnes-3.0-flash`/`deepseek-v4.1-flash`/`laguna-s-2.1`），SSE 无错误、页面/接口错误 0 |
| 2 | 思考弹层只有「不思考/默认」，缺模型配置档位；入口离模型按钮远 | `getModelThinkingEfforts` 只读 `model.thinkingEfforts`（camelCase），而聊天页拿到的是 `/api/providers` 裸行——档位挂在 `thinking_efforts`(snake) 与 `capabilities[].thinking_efforts`，永远读不到 → 回退为空 | 三形态兼容收集；弹层按「不思考 / 默认 ｜ 模型档位」加分组分隔线；入口按钮从左侧工具条移到模型按钮右侧 | `agnes-2.0-flash`（4 档）= `[不思考, 默认, 低强度, 中等强度, 高强度, 极致]` + 1 分隔线；`laguna-s-2.1`（未配置）仍 `[不思考, 默认]` + 0 分隔线 |
| 3 | 构建/规划模式改为模型右侧彩色徽标（构建≠规划颜色） | 原为左侧工具条 16px 图标按钮，无文字、无颜色区分 | 右侧新增 `.run-mode-chip`：构建=绿 `#3da35d`、规划=紫 `#7c5cff`（`color-mix` 派生背景，暗色自动适配），图标+短文案「构建/规划」，长文案留在 tooltip；仅管理员可见 | 切换后颜色 `rgb(61,163,93)` / `rgb(124,92,255)`；刷新后徽标保持 |
| 附1 | 思考态刷新丢失：选「高强度」刷新后无回显 → 第二次发送不带思考；选「不思考」刷新后反被点亮 | ①「开启态」依赖 `defaultThink`，但 ChatPanel 配置未透传该值；②ChatPanel 档位缺省 `'default'` 在会话未加载时瞬态点亮，`'none'` 又无对称关闭；③选「不思考」未落库 | 档位=开关唯一事实源：`'none'`=关、其余=开；ChatPanel 缺省 `'default'`→`'none'`；「不思考」同步落库 | 高强度：刷新后回显「agnes-2.0-flash 高强度」+ 弹层当前值 `high`；不思考：刷新后无回显、`thinkActive=false` |
| 附2 | 酒馆历史空气泡（错误时代残留）；provider 偶发零输出现场也留空气泡 | 生成失败/零输出时 AI 行落库为空内容；历史与实时都渲染为空白气泡 | 历史加载过滤空内容 AI 行；流式 `finish` 无错误且无内容时置占位「（模型未返回内容）」 | 历史 9 个 AI 气泡 0 空；直连 SSE 复测：`create→text(收到)→finish` 正常，零输出事件序为 `create→finish`（无 text） |

## 3. 关键实现说明

- **档位三形态兼容（`modelUtils.ts`）**：`thinkingEfforts`(映射对象) → `thinking_efforts`(裸行) → `capabilities[].thinking_efforts`(能力节点) 依次收集去重；模型未配置时保持既有回退（reasoning 特征 → 默认四档，否则空）。
- **思考态单一事实源（`ChatInput.vue`/`ChatPanel.vue`）**：会话设置里的 `thinkingEffort` 同时表达「开关+档位」——`'none'` 关闭，`'default'/'low'/...` 开启。刷新/切会话时按此回显，杜绝「档位存着、开关却是关」的割裂态。选「不思考」会把 `'none'` 落库，避免上次档位残留导致刷新后被误判为开启。
- **徽标配色**：`--run-mode-color` 变量 + `.is-build`/`.is-plan` 两类挂色，背景用 `color-mix(in srgb, … 10%, transparent)`，hover 18%、focus 环 22%，暗色模式无需单独维护。
- **酒馆双层兜底**：历史侧过滤空 AI 行（`loadMessages`），流式侧零输出占位（`finish` 无 `error` 且内容为空）。两者互补：实时有反馈，历史不留噪声。

## 4. 实测证据

### 4.1 dev（15689）

- **条目 1（酒馆浏览器 e2e）**：测试群 4 角色（通用助手/算法工程师/系统架构师/文档总结助手）全部裸模型名；发「你好，请自我介绍…」→ 非空回复（754/56/47 字符）；页面报错 0、接口 5xx 0；另直连 SSE 单角色复测：`create→text("收到")→finish` 干净收尾。
- **条目 2（思考弹层）**：右侧动作区 DOM 顺序 = `model-selector-btn → 思考按钮 → run-mode-chip → send-btn`；档位列表与分隔线如第 2 节；无档位模型仅两项。
- **条目 3（运行模式）**：构建 `rgb(61,163,93)` / 规划 `rgb(124,92,255)`；点击切换、刷新保持。
- **附 1（持久化）**：高强度刷新回显 + 弹层当前值 `high`；不思考刷新保持关闭。
- **附 2（空气泡）**：历史 9 个 AI 气泡 0 空。
- **回归**：`tool-row-probe.cjs` **24/24 PASS**（0 FAIL，无页面报错）。

### 4.2 dist 产物（15690）

- **生产构建**：`vite build`（`NODE_OPTIONS=--max-old-space-size=8192`）→ exit 0，**built in 6m38s**（含 `b442baed7` 零输出兜底）。
- **产物服务**：`node scripts/serve-dist.mjs`（15690，反代 198:8787）：`/` 200，登录 200。
- **条目 2（dist）**：思考弹层 `[不思考, 默认, 低强度, 中等强度, 高强度, 极致]` + 1 分隔线；模型切到 `laguna-s-2.1` → `[不思考, 默认]` + 0 分隔线；切回 `agnes-2.0-flash` → 6 项 + 1 分隔线。
- **条目 3（dist）**：构建 `rgb(61,163,93)` / 规划 `rgb(124,92,255)`，切换即变，刷新保持（`run-mode-chip is-build/is-plan` 持久）。
- **附 1（dist）**：高强度刷新回显（含弹层当前值 `high`）；不思考刷新保持关闭；恢复「默认」回显正常。
- **附 2（dist）**：酒馆 AI 气泡 13 个 / 空 0；页面报错 0。
- **`tool-row-probe`**：dev 专用夹具（`/src/acceptance/*.html` 产物不含，dist 下不适用——脚本头注释即写明「最终 dist 另跑全套件回归」），dev 侧 24/24 PASS。
- **`run-all-against-dist.mjs` 全量产物套件**：**123 / 124 PASSED**（round4 基线 120/124，两处 429 限流失败本次消失）：
  - 唯一失败 `acc-image-lib-foot 0/1`：夹具脚本自身异常（`locator.fill: value: expected string, got undefined`，round4 同款，非产品缺陷）；
  - `acc-image-lib-ui` / `acc-image-library-tab` / `acc-salted-login` 未产生 RESULT（与 round4 相同，与本轮改动无关）；
  - 与本轮改动直接相关的 `acc-prodgrade-frontend` **16/16 全过**（聊天/工具条/弹层无回归）。

## 5. 待办

| 项 | 状态 | 说明 |
| --- | --- | --- |
| 后端 jar 重部署 | 待用户执行 | round4 的 `bb1c3bf22`（酒馆模型归一化）需重打 jar 部署到 198 才生效；当前靠前端迁移已可恢复 |
| 25 路由 `ui-click-sweep` | 待低峰补跑 | 高频点击触发后端 429，限流下结果不可信 |
| push | 待授权 | 本地提交未推送 |

## 6. 变更文件

**前端（vue-support-parent-starter）**
- `apps/vue-support-ai-guada/src/utils/modelUtils.ts`（条目 2 — 档位三形态收集）
- `apps/vue-support-ai-guada/src/components/chat/chat-input/ThinkingEffortPopover.vue`（条目 2 — 分组分隔线）
- `apps/vue-support-ai-guada/src/components/chat/ChatInput.vue`（条目 2/3 — 入口移位、双色徽标、思考态回显）
- `apps/vue-support-ai-guada/src/components/chat/ChatPanel.vue`（附 1 — 档位缺省 `'none'`）
- `apps/vue-support-ai-guada/src/locales/zh-CN/chat.ts`、`src/locales/en-US/chat.ts`（条目 3 — 徽标短文案）
- `apps/vue-support-ai-guada/src/components/tavern/TavernPage.vue`（附 2 — 历史过滤 + 零输出占位）
