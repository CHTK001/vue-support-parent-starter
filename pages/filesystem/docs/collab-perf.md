# 协同管理打开慢 / 编辑卡顿：定位与修复

> 症状：进入「协同管理」页面要等很久；打开某个协同文档编辑时，打字一顿一顿的。
> 结论：**主因不是本地渲染，而是每次交互都在传整份文档内容** —— 列表接口把库里
> 所有协同文档的快照一起下发，轮询每 5~15s 又把当前文档全文拉回来一次。
> 已按「摘要 + 按需取全文 + 定时异步保存」改掉。

## 根因（按影响排序）

| # | 现象 | 根因 | 证据 |
| --- | --- | --- | --- |
| 1 | **打开协同管理页慢** | `GET /v2/file/collab/list` 的响应里带 `snapshot`：`toMap()` 无条件塞了整份快照。一个 Univer 工作簿快照几百 KB，十几个文档就是几 MB 的 JSON —— 下载 + 解析 + 存进 Vue 响应式数组 | 后端 `FileCollabController#list` → `toMap()`（含 `m.put("snapshot", ...)`） |
| 2 | **编辑卡顿（Word 最明显）** | `WordCollabEditor` 每 **5s** 轮询一次 `GET /{id}`，而详情接口每次都回整份快照；而且它**不跳过「本地有未保存改动」**的情形 —— 一边打字一边每 5s 下载解析全文 | 改前：`setInterval(..., 5000)` + `refreshSnapshot()` 直接调详情 |
| 3 | 编辑卡顿（次要） | 保存时 `JSON.stringify(wb.save())` 是主线程 CPU，紧跟最后一下输入执行，表现为「停手瞬间卡一下」；保存响应还把刚存上去的快照**原样回传**，等于保存流量翻倍 | `FileCollabEditor#saveNow` / `saveSnapshot` 返回 `toMap()` |
| 4 | 数据风险（顺带修掉） | 自动保存是「空闲 2.5s」纯防抖：**连续打字期间永远不会保存**；定时器到期时若正好有保存在飞，这次改动会被直接丢弃 | `markDirty()` 每次重置计时；`saveNow` 在 `saving` 时 `return` |

## 改法

### 后端（`FileCollabController`）

- 新增 `toSummaryMap()`：元信息 + `size` + `canWrite/isOwner`，**不含 snapshot**。
  `/list`、`/create`、`/{id}/snapshot`（保存）、`/{id}/access`、`/{id}/rename`、`/{id}/copy`
  全部改回摘要；只有 `GET /{id}`（详情）与 `GET /{id}/history/{version}` 还带内容。
- 新增 `GET /v2/file/collab/{id}/version` → `{id, version, updatedAt}`，几十字节，
  专供编辑器轮询「别人动过没有」。

### 前端

- `filestorageApi.ts`：`FileCollabInfo.snapshot` 改为**可选**（列表/保存响应没有它）；
  新增 `getFileCollabVersion()`。
- 三个编辑器（`FileCollabEditor` / `TextCollabEditor` / `WordCollabEditor`）统一：
  - 轮询改成「先问版本号，变了才拉全文」；
  - 轮询门禁 `shouldPollCollab(可见, 保存中, 有改动)`：**后台标签页不轮询**；
  - Word 的 5s 轮询降到 15s（与另两个一致）；
  - 自动保存改成 **空闲延迟 3s + 最长等待 15s**：连续打字期间不发请求，但最多 15s
    一定强制写一次；定时器撞上「保存在飞」时改成**补一次重试**，不再丢改动；
  - Excel 的快照序列化挪到 `requestIdleCallback`（最长等 1.2s），避开用户刚停手的时刻。
- `FileCollabManage.vue`：下载/导出必须先按 id 取详情（旧判断 `!snapshot && version === 0`
  在列表不再带快照后会把「已保存过的文档」导成空文件）。

调度逻辑抽到 `src/utils/collabAutosave.ts` 并配单测（`collabAutosave.test.ts`，6 个用例）：
空闲延迟、最长等待到点强制写、超时不出现 0/负延迟、轮询门禁。

## 协同文档的持久化（定时整库落盘）

内存态读写保持不变（编辑零阻塞），另加一个时间轮任务定期把**有改动**的整库刷到磁盘：
`FileCollabPersistence`（`spring-support-filesystem-starter` 的 `collab` 包）。

- 触发：只在 `FileCollabStore` 的写方法标脏（`markDirty()`）后才写；空闲时一个字节都不写。
- 间隔/路径：`plugin.filesystem.collab.persist-seconds`（默认 30）、
  `plugin.filesystem.collab.persist-path`（默认 `data/file-collab/collab-store.json`，相对进程工作目录）。
  开关 `plugin.filesystem.collab.persist-enable`（默认 true）。
- 抗损坏：先写 `.tmp` 再原子替换；解析失败时按空库启动并把坏文件改名 `.corrupt-<ts>` 留档。
- 抗丢失：写失败会**重新标脏**，下一轮重试；Bean 销毁（正常关闭）时补一次落盘。
- 代价：进程被 `kill -9` 时，最近一个落盘间隔（默认 30s）内的改动会丢。

单元测试 `FileCollabPersistenceTest`（6 个用例）：往返一致性（内容/版本/权限/历史）、
空闲不写盘、装载不自标脏、写失败重新标脏、损坏文件留档、关开关不装载。

## 并发：把所有「读-改-写」原子化

协同是多人同时编辑的场景，但存储层原来的三处写法都是「先 get 再 put」：

| 方法 | 竞态后果 |
| --- | --- |
| `saveSnapshot` | 「读 version → 比对 → 写」三步：两个并发保存带同一个 `expectedVersion` 会**双双通过**，两边都收到「保存成功、版本 +1」，其中一份内容被覆盖 —— 乐观锁形同虚设 |
| `rename` | 新对象是拿当时的 `snapshot/version` 拼的：保存与重命名交错时，会把刚存上去的内容**退回上一版** |
| `updateAccess` | 同上（`withAccess` 也带着当时的 snapshot/version） |

改法：三处全部走 `ConcurrentHashMap.compute`（对同一个 id 持锁执行），
版本比对与写入因此原子；`pushHistory` 移进同一把锁内串行执行，历史列表换成
`CopyOnWriteArrayList`，读侧（`history` / `versionAt`）在并发保存时不会读到半个条目。

`FileCollabStoreConcurrencyTest`（4 个用例）钉住这些不变量：

- 16 线程带同一个 `expectedVersion` 并发保存 → **只允许一个成功**、版本只 +1；
- 多线程各自「读最新版本再存」→ 版本号 == 成功次数 + 种子版本，历史条目数对得上
  （说明没有哪次成功保存被静默吞掉，历史也没有乱序）；
- 保存与重命名/改权限交错跑 200 轮 → 版本不回退、快照不被清空、历史条目仍守恒。

## 部署注意（重要）

- 后端改动**必须重新构建并重启**才生效：
  `mvn -pl spring-support-filesystem-starter -am -DskipTests package`（本次已验证
  编译、10 个单测、打包 `spring-support-filesystem-starter-4.0.0.51.jar` 全部通过），随后按既有流程重启服务。
- 有了定时落盘后，重启**不再清空协同文档**：启动时会从 `data/file-collab/collab-store.json` 装载。
  首次升级（还没有落盘文件）之前创建的协同文档仍只存在于旧进程内存里，重启即丢 ——
  要么接受这批内容丢失，要么在旧版本上先手工把要保留的内容导出。
- 落盘文件包含全部协同内容，注意目录权限与备份策略（与 `data/` 下其它数据同级对待）。

## 验证

```bash
# 前端
pnpm -C pages/filesystem test                          # 7 文件 / 51 用例（含 collabAutosave 6 个）
pnpm -C pages/filesystem exec vue-tsc --noEmit         # pages/filesystem 零报错

# 后端（父 pom 默认 skipTests，必须显式打开）
mvn -o -pl spring-support-filesystem-starter -am "-DskipTests=false" \
    "-Dtest=FileCollab*Test" "-Dsurefire.failIfNoSpecifiedTests=false" test
# → FileCollabStoreConcurrencyTest 4 / FileCollabPersistenceTest 6，全绿

mvn -o -pl spring-support-filesystem-starter -am "-DskipTests=false" \
    "-Dsurefire.failIfNoSpecifiedTests=false" test
# → 模块全量 53 个用例全绿（含原有 43 个）
```

> 注意：`-am` 会把上游模块一起纳入，需配 `-Dsurefire.failIfNoSpecifiedTests=false`，
> 否则上游模块会因「找不到匹配测试」而失败。

真实链路（打开耗时、编辑期请求数）需要在后端重建重启后，用浏览器 Network 面板按
下述口径复核：进入协同管理页应只有 1 次 `/list` 且响应**不含 snapshot**；
编辑一个文档时，除保存外每 15s 只有一次 `/version`（几十字节）；
`data/file-collab/collab-store.json` 在编辑后一个落盘周期内被更新。
