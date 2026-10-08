#!/bin/bash
# 隧道长窗口复核：起隧道后最多轮询 60s，期望公网 /v1/captcha = 200
B=http://127.0.0.1:8787
T=$(curl -s -m 10 -X POST $B/v2/user/login -H 'Content-Type: application/json' \
    -d '{"username":"admin","password":"admin123"}' | grep -o '"accessToken"[^,]*' | head -1 | sed 's/.*: *"//;s/"//')
H1="Authorization: Bearer $T"; H2="Content-Type: application/json"
RESP=$(curl -s -m 90 -X POST "$B/v2/devops/tunnel/start" -H "$H1" -H "$H2" -d '{"port":8787}')
URL=$(echo "$RESP" | grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' | head -1)
echo "tunnel_url=$URL"
OK=0
for i in $(seq 1 12); do
  C=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$URL/v1/captcha")
  echo "  try$i -> HTTP=$C"
  if [ "$C" = "200" ]; then OK=1; break; fi
  sleep 5
done
echo "PUBLIC_OK=$OK"
STOP=$(curl -s -m 30 -X POST "$B/v2/devops/tunnel/stop" -H "$H1" -H "$H2" -d '{}')
echo "stop=$STOP"
echo TUNNEL_LONGWINDOW_DONE
