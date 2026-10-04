#!/usr/bin/env bash
#
# eduai 前端部署产物打包（在【开发机】执行）。
#
# 产出 dist/eduai-web.tar.gz，内含构建好的静态站点（dist/ 内容）：
#   index.html / assets/ / apps/<appName>/app.yaml / app.example.yaml / loader*.js / os/ / wasm/
#
# 为什么必须有这个脚本（而不是每次都手打包）：
#   后端早有 deploy/ 交付物，前端一直靠临时命令打包部署 —— 换台机器就复现不了，
#   等于「前端交付不可复现」。这里把它补成与后端同一形态。
#
# 上传并部署（示例）：
#   pscp -batch -pw <pass> dist/eduai-web.tar.gz <user>@<host>:/home/<user>/eduai/eduai-web.tar.gz
#   ssh <host> "sudo BUNDLE=/home/<user>/eduai/eduai-web.tar.gz bash <webroot>/../eduai-web-deploy.sh"
#
# 注意：本包只有约 14MB，可放 /tmp；但目标机的 web root 归 www-data，
# 部署脚本需要 root 权限（见 deploy.sh）。
#
set -euo pipefail

APP_DIR=$(cd "$(dirname "$0")/.." && pwd)
DIST="$APP_DIR/dist"
OUT="$APP_DIR/dist/eduai-web.tar.gz"

echo "==> 构建前端（vue-tsc --noEmit && vite build）"
# 用 pnpm 直接跑 app 的 build 脚本：它先做类型门禁，再打包。
# 不能只跑 vite build —— 那会跳过 vue-tsc，把类型错误带进产物。
( cd "$APP_DIR" && pnpm build )

[ -f "$DIST/index.html" ] || { echo "[错误] 构建产物缺少 index.html" >&2; exit 1; }
[ -f "$DIST/apps/vue-support-eduai-starter/app.yaml" ] || {
    echo "[错误] 构建产物缺少 apps/vue-support-eduai-starter/app.yaml" >&2
    echo "       运行时按 apps/{appName}/app.yaml 取配置，缺了会回落默认值（品牌名等会不对）" >&2
    exit 1
}

echo "==> 打包（只打 dist 内容，不打 dist 目录本身）"
rm -f "$OUT"
tar -czf "$OUT" -C "$DIST" .

echo "==> 完成：$OUT"
echo "    文件数=$(find "$DIST" -type f | wc -l)"
if command -v sha256sum >/dev/null; then
  echo "    sha256=$(sha256sum "$OUT" | cut -c1-64)"
fi
echo "    index.html md5=$(md5sum "$DIST/index.html" | cut -d' ' -f1)"
echo "    大小=$(du -h "$OUT" | cut -f1)"
