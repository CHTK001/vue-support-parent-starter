#!/bin/bash
# 下载 cloudflared（断点续传，GitHub 较慢）并安装
S() { echo kali | sudo -S "$@" 2>/dev/null; }
URL=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
TARGET=40129000
for i in 1 2 3 4 5 6 7 8; do
  curl -sSL -C - -m 300 -o /tmp/cf $URL 2>/dev/null
  SZ=$(stat -c%s /tmp/cf 2>/dev/null || echo 0)
  echo "  try$i size=$SZ"
  [ "$SZ" -ge "$TARGET" ] && break
done
SZ=$(stat -c%s /tmp/cf 2>/dev/null || echo 0)
if [ "$SZ" -ge "$TARGET" ]; then
  S install -m 0755 /tmp/cf /usr/local/bin/cloudflared && echo "  installed"
  rm -f /tmp/cf
  cloudflared --version 2>&1 | head -1
else
  echo "  !! 未下载完整（$SZ / $TARGET）"
fi
echo CF_INSTALL_DONE
