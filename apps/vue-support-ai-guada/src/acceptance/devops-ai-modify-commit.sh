#!/bin/bash
# 端到端最后一环：AI 修改克隆仓库 → git status 看到改动 → commit 真实落库
B=http://127.0.0.1:8787
SID=74
T=$(curl -s -m 10 -X POST $B/v2/user/login -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}' | grep -o '"accessToken"[^,]*' | head -1 | sed 's/.*: *"//;s/"//')
H1="Authorization: Bearer $T"; H2="Content-Type: application/json"

# 取最近一次成功的克隆目录
DIR=$(ls -1 /opt/ai-starter/workspace/admin/agent 2>/dev/null | grep -E '^hello-world-[0-9]+$' | tail -1)
echo "clone_dir=$DIR"
[ -z "$DIR" ] && { echo "没有克隆目录，先跑 devops-e2e.sh"; exit 1; }

echo "=== 1) 让 AI 在该仓库内创建文件 AI-CHANGE.md ==="
curl -s -N -m 180 -X POST "$B/v2/chat/stream" -H "$H1" -H "$H2" \
  -d "{\"sessionId\":\"$SID\",\"stream\":true,\"model\":\"1791352877398:laguna-s-2.1\",\"userMessage\":{\"content\":\"请用文件工具在工作目录的 $DIR 目录里创建文件 AI-CHANGE.md，内容写 hello-from-ai，然后只回一句完成。\"},\"think\":false}" \
  | tr '\n' '|' | grep -o '"content":"[^"]*"' | head -8 | tr '\n' ' '
echo
sleep 5

echo "=== 2) git status：应看到 AI-CHANGE.md 未跟踪 ==="
curl -s -m 60 -X POST "$B/v2/devops/git/status" -H "$H1" -H "$H2" -d "{\"dir\":\"$DIR\"}" | head -c 500; echo

echo "=== 3) 磁盘核对 ==="
ls -l "/opt/ai-starter/workspace/admin/agent/$DIR/AI-CHANGE.md" 2>/dev/null && cat "/opt/ai-starter/workspace/admin/agent/$DIR/AI-CHANGE.md" 2>/dev/null | head -2

echo "=== 4) commit（应产生真实提交而非 nothing to commit） ==="
curl -s -m 60 -X POST "$B/v2/devops/git/commit" -H "$H1" -H "$H2" \
  -d "{\"dir\":\"$DIR\",\"message\":\"feat: AI 修改（端到端验收）\"}" | head -c 600; echo

echo "=== 5) 事后 status（应显示 working tree clean） ==="
curl -s -m 60 -X POST "$B/v2/devops/git/status" -H "$H1" -H "$H2" -d "{\"dir\":\"$DIR\"}" | head -c 400; echo
echo AI_COMMIT_E2E_DONE
