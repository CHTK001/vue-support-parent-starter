# 浏览器业务验收（Playwright）

以图搜图与人脸识别的浏览器侧验收，**十一套**。**先起前端 dev server，再跑本目录下的用例。**

## 前置

| 项 | 值 |
|---|---|
| 前端 | `apps/vue-support-ai-guada`，`pnpm dev`（vite，端口 **15689**） |
| 后端 | 默认 `http://192.168.50.198:8787`（由 vite 代理，需与前端同机可访问） |
| Node | 需已 `pnpm install`（用到 playwright） |

## 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `AI_ACCEPT_BASE` | `http://localhost:15689` | 被测前端地址 |
| `AI_ACCEPT_PASS` | `admin123` | **必填**，多数用例要求 |
| `AI_ACCEPT_USER` | `admin` | 登录用户名 |

## 运行

```bash
# 十一套一次跑完（准绳清单在 run-all-against-dist.mjs）
#   工作目录必须是本目录
AI_ACCEPT_BASE=http://localhost:15689 AI_ACCEPT_USER=admin AI_ACCEPT_PASS=admin123 \
  node run-all-against-dist.mjs

# 单套
AI_ACCEPT_PASS=admin123 node acc-image-lib-ui.mjs
```

> ⚠️ `.run/deploy/run-browser-both.ps1` **已断**：它依赖的
> `.run/deploy/run-browser-accept.ps1` 与 `.run/deploy/serve-dist.mjs`
> **均已不存在**（`.run/deploy` 只剩 `vite-guard.log`）。别再用它。
>
> 本目录只覆盖 **dev 形态**。「生产构建产物」形态（`vite build` 的 dist + 静态 shim）
> 目前**没有可用运行器**，未跑即不宣称 —— 需要时先把上面两个脚本补回来。
>
> vite 冷启动现编译几百个模块，首屏可达 30s+；**固定等待会把「编译慢」误判成「功能坏」**，
> 所以所有「等页面就绪」都必须用**有界轮询**，不能用一次性 `sleep`。

## 十一套

| 套件 | 覆盖 |
|---|---|
| `acc-prodgrade-frontend.mjs` | 前端生产级门禁 |
| `acc-search-ux.mjs` | 以图搜图交互 |
| `acc-search-render.mjs` | 检索结果渲染 |
| `acc-image-lib-ui.mjs` | 图片库 UI（viewerjs 预览、批量操作、角标） |
| `acc-image-lib-foot.mjs` | 图片库页脚 |
| `acc-image-library-tab.mjs` | 图片库页签 |
| `acc-image-lib-rename.mjs` | 重命名 |
| `acc-video-duration.mjs` | 视频时长档位 |
| `acc-salted-login.mjs` | 加盐登录 |
| `acc-library-menu.mjs` | 侧边栏菜单 |
| `acc-face-edit.mjs` | 人脸底库「编辑信息」 |

## 共享辅助

| 模块 | 用途 |
|---|---|
| `acc-token.mjs` | 取登录令牌的**唯一正确姿势**，见下面纪律 3 |
| `run-all-against-dist.mjs` | 十一套准绳清单与批量运行器 |

## 写用例的五条纪律（都是踩出来的）

**1. 断言机制，不要断言存量数据。**

底库内容会随部署与清理变化。断言「库里有某类记录」在全新环境上必然假红。
做法：先从后端接口取真实数据，再断言 UI 与它一致。

- `acc-image-lib-ui.mjs` 的角标断言已按此改造
- `prodgrade.sh` 的 `STORE` 也不要写死路径（见后端套件说明）

**2. 不要硬编码后端会变的返回值。**

模型能力、时长档位这类数据由后端声明，前端只负责渲染。
硬编码等于把「数据变了」误报成「UI 坏了」——
`acc-video-duration.mjs` 曾因此假红 2 条，而真正该验的那条一直是通过的。
做法：从后端接口读声明，断言「UI 暴露的值 ⊆ 声明的值」。

**3. ⚠️ 令牌必须取自登录响应，绝不能从 `localStorage` 读。**

框架 storage 是**加密落盘的**。实测（同一台机器同一时刻）：

| 项 | 值 |
|---|---|
| 服务端下发的原始令牌 | **1376** 字符 |
| `localStorage` 的 `ai-guada:accessToken` | **1856** 字符**密文**（+480），不含原始令牌 |
| 带**原始令牌**请求 | **200** |
| 带**密文**请求 | **403 `A0403S0000` 用户信息不存在/请重新登录** |

头名无关（`x-oauth-token` 与 `Authorization: Bearer` 都是 403），补指纹头也无效。

**后果**：十一套里有九套曾把密文当令牌发出去，**26 条 FAIL 全是这个原因** ——
产品是对的，判据坏了。真用户不受影响，因为应用自己走框架 storage API 会解密。
而 403 文案「用户信息不存在 / 请重新登录」极具误导性，看着像产品坏了。

做法：用 `acc-token.mjs` 的 `captureLoginToken(page)`（挂 `response` 监听，
**必须在触发登录之前挂**）或 `apiToken(base, user, pass)`。
这样与存储格式解耦：框架换加密算法或改键名，套件不会跟着失效。

> 只判「有没有」的等待/存在性检查读 `localStorage` 是**对的**，不要一并改掉
> （`acc-image-lib-foot` / `acc-library-menu` / `acc-image-library-tab` /
> `acc-salted-login` 的错误口令用例）。令牌从不发出。

**4. ⚠️ 判据不能要求一个已被定性为漏洞的行为。**

`acc-search-render.mjs` 曾断言图片地址里出现 `?x-oauth-token=<令牌>`，
而 `src/utils/authImage.ts` 与 `imageSearchUrl.ts` 的注释明确写着
那是**已判定为漏洞并修掉的旧实现**（「令牌绝不进 URL…用户点一个外链，
外站就能在自己的日志里看到完整的 accessToken」）。
已改为断言**令牌不出现**在地址里；「图确实来自自家 `/v2` 接口」这一层
改用**真实网络请求**判，不再从 DOM 的 `src` 里猜。

**5. 判据太早 ≠ 功能坏。**

同一批元素，断言 A 用一次性瞬时读、断言 B 用有界轮询，就是两套口径。
`acc-image-lib-ui.mjs` §5 曾因此在**全量跑**时读到 `cell=0`、而**单跑** 38/38 全过。
已统一为有界轮询。**判据保留，只改等待** —— 不许删判据换绿。

## 为什么在本目录而不是仓库根

根 `.gitignore` 有 `/acc-*.mjs`（带前导斜杠，只匹配根目录），放在根目录的用例不入库，
会随 `git clean` 一起消失。本目录不受该规则影响。
