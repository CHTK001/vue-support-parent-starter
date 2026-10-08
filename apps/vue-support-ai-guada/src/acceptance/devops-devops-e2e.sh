#!/bin/bash
# DevOps 端到端验收：环境自检 → git clone → status → commit → cloudflared 隧道 → 公网访问校验 → 关闭
B=http://127.0.0.1:8787
T=$(curl -s -m 10 -X POST $B/v2/user/login -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}' | grep -o '"accessToken"[^,]*' | head -1 | sed 's/.*: *"//;s/"//')
H1="Authorization: Bearer $T"; H2="Content-Type: application/json"
jpost() { curl -s -m "${2:-120}" -X POST "$B$1" -H "$H1" -H "$H2" -d "${3:-{}}"; }

echo "=== 1) 环境自检 GET /v2/devops/status ==="
curl -s -m 20 "$B/v2/devops/status" -H "$H1" | head -c 500; echo

echo "=== 2) git clone（公开小仓库，AI 修改前先具备仓库） ==="
DIR="hello-world-$(date +%s)"
echo "  target_dir=$DIR"
jpost /v2/devops/git/clone 200 "{\"url\":\"https://github.com/octocat/Hello-World.git\",\"dir\":\"$DIR\"}" | head -c 600; echo

echo "=== 3) git status ==="
jpost /v2/devops/git/status 60 "{\"dir\":\"$DIR\"}" | head -c 400; echo

echo "=== 4) git commit（无改动时应报 nothing to commit，证明 git 真正执行） ==="
jpost /v2/devops/git/commit 60 "{\"dir\":\"$DIR\",\"message\":\"chore: e2e probe\"}" | head -c 500; echo

echo "=== 4.5) 失败路径校验：克隆不存在的仓库必须回 success:false（不得伪装成功） ==="
curl -s -m 150 -X POST "$B/v2/devops/git/clone" -H "$H1" -H "$H2" \
  -d "{\"url\":\"https://github.com/octocat/definitely-not-exist-$(date +%s).git\",\"dir\":\"bad-$RANDOM\"}" | head -c 600; echo

echo "=== 5) 启动 cloudflared Quick Tunnel（暴露 8787） ==="
RESP=$(curl -s -m 90 -X POST "$B/v2/devops/tunnel/start" -H "$H1" -H "$H2" -d '{"port":8787}')
echo "$RESP" | head -c 400; echo
URL=$(echo "$RESP" | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | head -1)
echo "  tunnel_url=$URL"

if [ -n "$URL" ]; then
  echo "=== 6) 公网访问校验（经隧道打后端 /v1/captcha） ==="
  for i in 1 2 3; do
    C=$(curl -s -o /dev/null -m 30 -w '%{http_code}' "$URL/v1/captcha")
    echo "  try$i $URL/v1/captcha -> HTTP=$C"
    [ "$C" = "200" ] && break
    sleep 5
  done
fi

echo "=== 7) 关闭隧道 ==="
jpost /v2/devops/tunnel/stop 30 '{}' | head -c 200; echo
echo DEVOPS_E2E_DONE
