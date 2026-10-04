# eduai 前端交付物（打包 / 部署 / 自证）

对标后端 `spring-support-eduai-starter/deploy/` 的同一形态。**前端交付必须可复现**：
不能靠会话里的临时命令，换台机器就复现不了。

```
deploy/
  package.sh     开发机：构建（vue-tsc + vite build）→ 打 dist 成 eduai-web.tar.gz，打印 sha256 / index.html md5
  package.ps1    同上，Windows 开发机版（ASCII-only，仓库规约）
  deploy.sh      目标机：备份 → 解包到 staging → **原子 rename** 换目录 → 重载 nginx → 自检
  verify.sh      目标机：来源自证（线上站点 == 本地构建的 dist）
```

## 目标机上的落位

```
systemd 单元   eduai-web.service       （专用 nginx，forking，PIDFile=/run/eduai-web.pid）
nginx 配置     /etc/nginx/eduai-web.conf
监听           0.0.0.0:19093
web root       /var/www/eduai           ← 本目录的产物解到这里
反代           /v2/  -> http://127.0.0.1:19095   （eduai 后端）
SPA 兜底       try_files $uri $uri/ /index.html
健康           /healthz
```

## 一次完整交付

```bash
# 1) 开发机：构建 + 打包（会先跑 vue-tsc 类型门禁）
bash apps/vue-support-eduai-starter/deploy/package.sh
#   记下打印的 sha256 与 index.html md5

# 2) 上传（必须校验：传输失败通常只写 stderr，不校验就会装成远端残留的旧文件）
pscp -batch -pw <pass> apps/vue-support-eduai-starter/dist/eduai-web.tar.gz <user>@<host>:/home/<user>/eduai/eduai-web.tar.gz
pscp -batch -pw <pass> apps/vue-support-eduai-starter/deploy/*.sh        <user>@<host>:/home/<user>/eduai/web-deploy/
ssh <host> 'sha256sum /home/<user>/eduai/eduai-web.tar.gz'      # 与第 1 步比对

#    注意：deploy/*.sh **单独传**，不要打进 web bundle —— web root 是公开目录，
#    把部署脚本放进去会被 HTTP 直接下载。

# 3) 目标机：部署（需要 root）
sudo BUNDLE=/home/<user>/eduai/eduai-web.tar.gz bash /home/<user>/eduai/web-deploy/deploy.sh

# 4) 目标机：来源自证（把第 1 步的 index.html md5 传进去）
bash /home/<user>/eduai/web-deploy/verify.sh <index.html-md5>   # 期望输出 WEB_PROVENANCE_OK

# 5) 开发机：浏览器业务验收（需要浏览器，只能在开发机跑）
pwsh -File spring-support-eduai-starter/src/acceptance/ui-paper-assign-acceptance.ps1 -Base http://<host>:19093
```

## 已知边界

1. **运行时读的是 `apps/<appName>/app.yaml`**（见 `packages/config/src/loader.ts`），
   不是根级 `app.yaml`。`verify.sh` 会检查这条路径真的返回 yaml 内容
   （若被 SPA 兜底成 index.html，即使 HTTP 200 也算失败）。
   根级 `/app.yaml` 会被 SPA 兜底成 index.html（200 但内容是 HTML）—— 已记录在案。
2. **前端部署没有接入自动门禁**：`ui-paper-assign-acceptance.ps1` 需要真实浏览器，
   只在开发机跑。目标机上能自动跑的是 `verify.sh`（自证）与 HTTP 检查。
3. 共享主机上 `/var/www/eduai` 也会被并发会话重新部署：
   `verify.sh` 加上期望 md5 就能立刻判断「线上还是不是我这份构建」。
