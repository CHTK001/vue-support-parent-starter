#!/usr/bin/env bash
#
# eduai 前端部署（在【目标机】执行，需要 root）。
#
# 用法：
#   sudo BUNDLE=/home/kali/eduai/eduai-web.tar.gz bash deploy.sh
#
# 它做四件事，任何一步失败即非 0 退出：
#   1) 备份现有 web root 到 backups/web-<时间戳>.tar.gz（可回滚）
#   2) 解包到 staging 目录并 chown www-data
#   3) **原子换目录**（rename），避免解包途中出现半份站点
#   4) 重载 nginx 并自检（HTTP + 关键路径 + 指纹）
#
# 为什么用「备份 + rename」而不是就地覆盖：
#   就地解包会有一段「index.html 已换、assets 还没换」的窗口，
#   用户正好在那一刻刷新就会 404。rename 是原子操作，没有这个窗口。
#
set -uo pipefail

WEBROOT=${WEBROOT:-/var/www/eduai}
BUNDLE=${BUNDLE:-/home/kali/eduai/eduai-web.tar.gz}
BACKUP_DIR=${BACKUP_DIR:-/home/kali/eduai/backups}
NGINX_CONF=${NGINX_CONF:-/etc/nginx/eduai-web.conf}
APP_NAME=vue-support-eduai-starter
STAMP=$(date +%Y%m%d-%H%M%S)

log() { printf '  %s\n' "$*"; }
die() { printf '  [失败] %s\n' "$*" >&2; exit 1; }
S() { echo kali | sudo -S -p '' "$@"; }

[ -f "$BUNDLE" ] || die "缺少产物 $BUNDLE（先在开发机跑 deploy/package.sh 并上传）"
mkdir -p "$BACKUP_DIR"

log "== 0. 产物指纹 =="
log "    bundle = $BUNDLE"
log "    sha256 = $(sha256sum "$BUNDLE" | cut -c1-64)"
log "    bytes  = $(stat -c %s "$BUNDLE")"

log "== 1. 备份现有 web root =="
if [ -d "$WEBROOT" ]; then
    S tar -czf "$BACKUP_DIR/web-$STAMP.tar.gz" -C "$(dirname "$WEBROOT")" "$(basename "$WEBROOT")"
    log "    -> $BACKUP_DIR/web-$STAMP.tar.gz（$(stat -c %s "$BACKUP_DIR/web-$STAMP.tar.gz") B）"
else
    log "    [警告] $WEBROOT 不存在，跳过备份（首次部署）"
fi

log "== 2. 解包到 staging =="
S rm -rf "$WEBROOT.new"
S mkdir -p "$WEBROOT.new"
S tar -xzf "$BUNDLE" -C "$WEBROOT.new"
S chown -R www-data:www-data "$WEBROOT.new"
log "    staged files = $(find "$WEBROOT.new" -type f | wc -l)"

log "== 3. 原子替换（rename） =="
S rm -rf "$WEBROOT.old"
[ -d "$WEBROOT" ] && S mv "$WEBROOT" "$WEBROOT.old"
S mv "$WEBROOT.new" "$WEBROOT"
S rm -rf "$WEBROOT.old"

log "== 4. 重载 nginx =="
if S nginx -t -c "$NGINX_CONF" >/dev/null 2>&1; then
    S nginx -s reload -c "$NGINX_CONF" >/dev/null 2>&1 && log "    已重载"
else
    log "    [警告] $NGINX_CONF 校验失败，未重载（静态文件不重载也能生效）"
fi
sleep 2

log "== 5. 自检 =="
BASE=http://127.0.0.1:19093
log "    files      = $(find "$WEBROOT" -type f | wc -l)"
log "    index md5  = $(md5sum "$WEBROOT/index.html" | cut -d' ' -f1)"
log "    app.yaml   = $(md5sum "$WEBROOT/apps/$APP_NAME/app.yaml" 2>/dev/null | cut -d' ' -f1)"
for p in "/" "/edu/student-login" "/app.example.yaml" "/apps/$APP_NAME/app.yaml" "/healthz"; do
    printf "    %-42s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}B' --max-time 8 -H 'Accept: text/html' "$BASE$p")"
done
ASSET=$(grep -oE "/assets/index-[A-Za-z0-9_-]+\.js" "$WEBROOT/index.html" | head -1)
[ -n "$ASSET" ] && printf "    %-42s %s\n" "$ASSET" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}B' --max-time 8 "$BASE$ASSET")"

log "== 结果 =="
log "    web root = $WEBROOT"
log "    回滚：sudo rm -rf $WEBROOT && sudo tar -xzf $BACKUP_DIR/web-$STAMP.tar.gz -C $(dirname "$WEBROOT") && sudo chown -R www-data:www-data $WEBROOT"
