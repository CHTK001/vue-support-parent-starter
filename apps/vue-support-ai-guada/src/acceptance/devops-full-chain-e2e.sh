#!/bin/bash
# 端到端完整链路（修正版）：克隆进**会话工作区**（AI 沙箱内）→ AI 改文件 → commit
B=http://127.0.0.1:8787
SID=74
T=$(curl -s -m 10 -X POST $B/v2/user/login -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}' | grep -o '"accessToken"[^,]*' | head -1 | sed 's/.*: *"//;s/"//')
H1="Authorization: Bearer $T"; H2="Content-Type: application/json"
TS=$(date +%s)
DIR="$SID/hw-$TS"          # ← 落在会话沙箱内，AI 才够得着
echo "clone_dir=$DIR"

echo "=== 1) clone 到会话工作区内 ==="
curl -s -m 200 -X POST "$B/v2/devops/git/clone" -H "$H1" -H "$H2" \
  -d "{\"url\":\"https://github.com/octocat/Hello-World.git\",\"dir\":\"$DIR\"}" | head -c 500; echo

echo "=== 2) 让 AI 在该目录创建 AI-CHANGE.md ==="
curl -s -N -m 180 -X POST "$B/v2/chat/stream" -H "$H1" -H "$H2" \
  -d "{\"sessionId\":\"$SID\",\"stream\":true,\"model\":\"1791352877398:laguna-s-2.1\",\"userMessage\":{\"content\":\"请用文件工具在相对路径 hw-$TS 目录里创建文件 AI-CHANGE.md，内容写 hello-from-ai，然后只回一句完成。\"},\"think\":false}" \
  | tr '\n' '|' | grep -o '"content":"[^"]*"' | head -8 | tr '\n' ' '
echo
sleep 5

echo "=== 3) git status（期望看到 AI-CHANGE.md 未跟踪） ==="
curl -s -m 60 -X POST "$B/v2/devops/git/status" -H "$H1" -H "$H2" -d "{\"dir\":\"$DIR\"}" | head -c 500; echo

echo "=== 4) 磁盘核对 ==="
ls -l "/opt/ai-starter/workspace/admin/agent/$DIR/AI-CHANGE.md" 2>/dev/null && head -1 "/opt/ai-starter/workspace/admin/agent/$DIR/AI-CHANGE.md"

echo "=== 5) commit（期望真实提交） ==="
curl -s -m 60 -X POST "$B/v2/devops/git/commit" -H "$H1" -H "$H2" \
  -d "{\"dir\":\"$DIR\",\"message\":\"feat: AI 修改（端到端验收）\"}" | head -c 600; echo

echo "=== 6) 事后 status ==="
curl -s -m 60 -X POST "$B/v2/devops/git/status" -H "$H1" -H "$H2" -d "{\"dir\":\"$DIR\"}" | head -c 300; echo
echo FULL_CHAIN_DONE
