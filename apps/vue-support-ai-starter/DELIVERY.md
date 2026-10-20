# ai-guada 交付对照表（commit ↔ 验收 ↔ 未验证项）

> 目的：把「验收结论」钉在 **commit** 上，而不是「当时生产上跑的 jar」。
> 原因：这台 192.168.50.198 由多个会话反复部署，任何「生产在跑什么」的结论
> 活不过几分钟；但「某个 commit 在某个窗口里被验过」是可核对的事实。

---

## 0. 先读这一段：这份报告覆盖什么、不覆盖什么

**被验的是 `684250a3de38`，它对应 `d939651a1`（2026-10-01 10:58）。**
**该基线落后当时 HEAD 24 个提交**，因此这份 111/0：

- **只证明**：`d939651a1` 这个源码版本上，下面列出的 9 套验收全部通过
- **完全不能证明**：那 24 个提交的改动（人脸 / influxdb / eduai / monitor 等）是好的
  —— **它们根本不在被验的二进制里**

具体到一个可核对的例子：`d939651a1` 的 `FaceController` **没有** `@GetMapping("/list")`
（该接口由 `4dbc38dd1` 于 17:26 加入，晚于基线）。所以那个构建上 `/v2/face/list`
必然 **404**，而我的报告不会有任何异常 —— 因为**我没有一套验人脸**。

> 这正是 AGENTS.md §4.6 记录的事故形态：**报告证明的是一个已经不存在的二进制**。
> 我这份报告不存在「人脸被 revert」的问题，但存在**同一类**的错：把
> 「我验的这 9 套全绿」当成「这个构建整体可用」的表述便利。

**纪律（据 §4.6）**：本报告的结论**与 md5 绑定**，换包即失效；
签收前必须重新核对线上 md5，不要凭「应该没被换过」下结论。

---

## 1. 验收基线

| 项 | 值 |
|---|---|
| 验收的构建 | jar md5 **`684250a3de38`** |
| 构建时间 | 2026-10-01 13:25:57 |
| spring 基线 | **`d939651a1`**（10-01 10:58）—— **落后当时 HEAD 24 个提交**（见 §0） |
| vue 基线 | **`4d05b93da4`**（10-01 13:20） |
| 前端形态 | 本机 vite 直接服务工作树（**未打包**），非产物验收 |
| 部署方式 | `deploy.sh`：先停旧进程 → 1b 验 jar 完整性（`OK 条目数=1429`）→ 替换 → 等就绪约 30s |
| 部署复核 | 8787 监听 1 条 / `NRestarts 0→0` / `DEPLOY_OK` 退出码 0 |
| 数据源 | `jdbc:mysql://127.0.0.1:3306/ai_test`（非 h2） |

> 关于基线 commit 的确定性：构建前已于 13:20:50 把全部在途改动 stash，工作树为干净状态，
> 故对应 `d939651a1`。**无法排除**并发会话在那 5 分钟窗口内又改过文件 —— 这是本表
> 唯一一处不能百分百锁死的环节。

---

## 2. 验收结果：9 套 / PASS 111 / FAIL 0

> **范围**：这 9 套全部落在「图像/视频生成 + 认证」这一片。
> 它们**不覆盖**人脸、influxdb、eduai、monitor、collect 等模块 —— 见 §0。

| 套件 | 结果 | 覆盖 |
|---|---|---|
| `prod-accept.mjs` | **31 / 0** | 全量业务：模型清单、单任务限制、图像视图、切视频、失败告知、刷新一致、网格/筛选/排序、删除、设置菜单、控制台 |
| `records-accept.mjs` | **20 / 0** | 记录管理四入口（清理失败 / 批量删除 / 清空全部 / 选择模式） |
| `ops-accept.mjs` | **14 / 0** | 双账号登录、权限边界（ops 在 `@Permission("admin")` 端点被 403）、**真实数据隔离**（ops 建 → admin 不可见，反向亦然） |
| `static-accounts-accept.mjs` | **10 / 0** | 静态账号边界（登录 / 错口令 / 匿名 / 权限） |
| `id-stability-accept.mjs` | **9 / 0** | 返回 id = 行 id、按该 id 轮询可达、按该 id 取消真的取消 |
| `login-accept.mjs` | **8 / 0** | 登录正例 / 错口令拒绝 / 匿名拒绝 / 令牌可用 |
| `touch-target-accept.mjs` | **8 / 0** | 触屏命中区 44px（四向延伸、无相邻热区截胡、桌面版式不受影响） |
| `media-store-accept.mjs` | **6 / 0** | 新行不入库 / 存量仍可读 / 媒体字节可取 |
| `a11y-focus-accept.mjs` | **5 / 0** | 键盘焦点环（测量 computed outline，非肉眼） |

另有一次**配置生效的端到端硬证据**（同一构建）：

```
提交 → PENDING p=44 → SUCCESS 耗时 19604ms → 取字节 HTTP 200 2,072,373 bytes
```

---

## 3. commit ↔ 验收 对照

### spring-support-parent-starter

| commit | 内容 | 在哪套验到 |
|---|---|---|
| `43f4c4cc5` | 僵死任务收敛为失败（避免单任务名额被永久占用） | 更早轮次专项验过（重启前 1 条未完成 → 重启后 0 条）；本轮 `prod-accept` 单任务限制、`records-accept` 间接覆盖 |
| `032a73214` | 列表只回元数据 + 媒体字节流按 taskId 单独取 | `media-store-accept`、`prod-accept` |
| `09b2039dd` | 上游任务号不再占用主键（修「卡片永远 0%」与「取消失效」） | `id-stability-accept` 9/0 |
| `f801cf83b` | 生成媒体落盘，库里只留句柄 | `media-store-accept` 6/0 |
| `0a747553a` | 「清理失败」口径一致 + 补三个记录管理入口 | `records-accept` 20/0 |
| `820225994` | 进度估算 SPI 接入心跳 + 生成文件目录可配 | `prod-accept`（进度序列）、`media-store-accept` |
| `93397f4ed` | 设置定义走启动期预热缓存 | `prod-accept`（设置页渲染） |
| `cc04eccec` | 句柄自带写入时的基路径（修「改目录配置孤立已写记录」） | 专项：改基路径前后旧记录均 200（修复前 404） |
| `e17ded2d5` | 登录响应不再写死 `roles=ADMIN`，改用真实角色 | `ops-accept` 14/0、`static-accounts-accept` 10/0 |

### utils-support-parent-starter

| commit | 内容 | 在哪套验到 |
|---|---|---|
| `87845aea4` | 进度估算 SPI 接口 + 目录分层 | `prod-accept` 进度序列 |
| `5991ebb9b` | 进度估算补四个实现（步长 / 设定时长 / 首末档 / 不确定卡 99） | `prod-accept`：`16→33→45→55→100` 平滑推进（10 档，非 2 档） |

### vue-support-parent-starter

| commit | 内容 | 在哪套验到 |
|---|---|---|
| `4f871e59f` | 刷新后重轮询 + 单任务前端限制 + 404 停止轮询 + 失败浮层 | `prod-accept` |
| `291a5c2f1` | 无产物卡片改占位图 | 更早轮次验过（该轮结果未逐条留档，此处不引用计数） |
| `ec0b48870` | 结果图按 id 取字节流 | 更早轮次验过（同上） |
| `8835bd83d` | 生产验收三处取样方式修正 | 验收脚本自身质量 |
| `7c8145046` | id 稳定性验收 | `id-stability-accept` 9/0 |
| `121672063` | 媒体落盘验收 | `media-store-accept` 6/0 |
| `13cfac4fb` | 存量媒体回填验收 | 更早轮次验过（同上） |
| `39b34c10e` | 记录管理三入口 + 生成中已用时 | `records-accept` 20/0 |
| `474be4379` | 工具权限总闸验收 | 更早轮次验过（同上） |
| `22e75a8ea` | 登录验收（按业务码判成败，非 HTTP 状态码） | `login-accept` 8/0 |
| `17fb64752` | 生成页交互控件补键盘焦点环 | `a11y-focus-accept` 5/0 |
| `2678ee54f` | 触屏命中区补到 44px | `touch-target-accept` 8/0 |
| `d508792de` | 静态双账号验收 | `static-accounts-accept` 10/0 |
| `336e97e31` | 已用时时钟偏移按本任务算 | `records-accept` |
| `e2203830d` | ops 验收加深版 | `ops-accept` 14/0 |
| `a2b20b189` | **前端代理默认指向远端后端**（修「本机 pnpm dev 必登录 500」） | ⚠️ **不在验构建内**（10-01 18:04，晚于验收）。单独验过：不带环境变量 `/v2/user/login` 200、`login-accept` 8/0 |
| — | **基线之后新增的 24 个提交**（`4dbc38dd1` 人脸 list/delete、`aa1076bf1` influxdb、`9c3241cd9`/`2227b1b6c`/`c72ec2731` eduai、`6c2e676e7`/`aad6eb09b`/`acbd6c98e`/`8982985f2`/`f8d956e60` monitor、`c21e0d9e4` 快照 …） | ❌ **不在被验的二进制里，本报告对其无任何结论**。它们由各自作者与 CI 负责，我不代验 |

---

## 4. 未验证项（不计入 111）

| 项 | 性质 | 证据 |
|---|---|---|
| **人脸 / influxdb / eduai / monitor / collect 等模块** | **不在验收范围** | 基线 `d939651a1` 里就没有后续 24 个提交的改动。例：`FaceController` 在基线**无** `@GetMapping("/list")`（17:26 才加），故该构建 `/v2/face/list` 必 404 —— 而我有意**没有**验人脸，所以报告不会有异常 |
| **视频成功渲染** | 上游依赖 | 提交后上游回 **HTTP 400**；此前长期 503/429。配置与降级链路已验，**成功路径从未跑通** |
| **真实 OAuth 认证** | 部署形态 | 生效档 `plugin.oauth.protocol=static`，按设计**不外呼**。本机有 oauth 服务（19180–19185）但未接上 |
| **图生视频** | 配置缺失 | `plugin.filesystem.storage-server.public-host` 未定，Agnes 取不到参考图 |
| `media-url-accept` 部分断言 | 数据依赖 | 该套**不在本轮 9 套内**。它在更早轮次跑过；当时因页面上没有「成功且带结果图」的记录，多条断言被 `NOTE` 跳过（跳过不等于通过，故不计入）。本轮等价的覆盖由 `media-store-accept` 6/0 提供 |
| `void-tile` / `video` / `media-url` / `media-backfill` / `toolgate` / `model-hover` | 轮次差异 | 这 6 套**不在本轮 9 套内**。它们在更早轮次跑过（结论对应**更早的构建**），本轮未重跑。**除 `media-url-accept` 外，我不在此引用具体计数**——早前轮次的结果未逐条留档，凭记忆写数字正是我一再犯的错 |
| `a2b20b189` | 时序 | 见上表，晚于验收 |

---

## 5. 可复核的落盘位置

| 内容 | 位置 |
|---|---|
| 15 个验收脚本 | `apps/vue-support-ai-guada/*-accept.mjs` |
| 本表 | `apps/vue-support-ai-guada/DELIVERY.md` |
| 部署门禁脚本 | 服务器 `/home/kali/jar-guard.sh` + `/home/kali/deploy.sh`（不在仓库内） |
| 机器重置前的回滚点 | 服务器 `/opt/ai-starter/app.jar.bak-*`（保留最新 1 个） |

---

## 6. 签收纪律（据 AGENTS.md §4.6）

本报告的全部结论**与 md5 `684250a3de38` 绑定**。签收前必须做两件事：

1. **重新核对线上 md5**：
   ```
   md5sum /opt/ai-starter/app.jar | cut -c1-12      # 对不上即为换包，本报告作废，须重跑
   ```
2. 换包后**不要**沿用本报告的结论 —— 报告证明的是那个二进制，不是「这个功能」。

**已知的当前状态（写表时的观测，非承诺）**：线上 jar 为 `f00a8e95e7f2`
（并发会话的构建），**不是** `684250a3de38`。故本表的 111/0 **不对线上当前版本负责**。

---

## 7. 可复核的原始证据

本轮 9 套的原始日志已固化，与上表逐条对应：

```
.tmp/sg/PA.log                          prod-accept            31/0
.tmp/sg/P3-ops-accept.log               ops-accept             14/0
.tmp/sg/P3-records-accept.log           records-accept         20/0
.tmp/sg/P4-static-accounts-accept.log   static-accounts-accept 10/0
.tmp/sg/P3-id-stability-accept.log      id-stability-accept     9/0
.tmp/sg/login-after-fix.log             login-accept            8/0
.tmp/sg/P4-touch-target-accept.log      touch-target-accept     8/0
.tmp/sg/P5-try1.log                     media-store-accept      6/0
.tmp/sg/P4-a11y-focus-accept.log        a11y-focus-accept       5/0
```

> 注意：`.tmp/` **不在版本控制内**，这些日志会随清理消失。
> 要长期留档需另存到仓库或备份目录。