# 浏览器业务验收（Playwright）

以图搜图与人脸识别的浏览器侧验收，九套。**先起前端 dev server，再跑本目录下的用例。**

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
# 单套（工作目录必须是本目录）
AI_ACCEPT_PASS=admin123 node acc-image-lib-ui.mjs

# 九套（用运行器，带前端存活自愈与冷编译预热）
pwsh -File .run/deploy/run-browser-accept.ps1
```

运行器会：每套跑前确认前端存活，不存活就重启；重启后逐个拉取测试真正会访问的模块
直到全部编译成功再开跑 —— vite 冷启动现编译几百个模块，首屏可达 30s+，
固定等待会把「编译慢」误判成「功能坏」。

## 九套

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

## 写用例的两条纪律（都是本轮踩出来的）

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

## 为什么在本目录而不是仓库根

根 `.gitignore` 有 `/acc-*.mjs`（带前导斜杠，只匹配根目录），放在根目录的用例不入库，
会随 `git clean` 一起消失。本目录不受该规则影响。
