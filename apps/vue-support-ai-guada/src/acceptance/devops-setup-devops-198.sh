#!/bin/bash
# 1) 只停「同 jar 重复且不持有任何端口」的实例；2) 安装 cloudflared（免费开源 quick tunnel 用）
S() { echo kali | sudo -S "$@" 2>/dev/null; }
echo "=== 检查前内存 ==="
free -m | awk 'NR==2{print "  used="$3"MB avail="$7"MB"}'

echo "=== 同 jar 实例统计（>1 即重复） ==="
ps -eo args | grep -a '[j]ar ' | sed 's/.*-jar //; s/ .*//' | sort | uniq -c | sort -rn | head -8

echo "=== 端口持有者（sudo 才看得到 pid） ==="
HOLDERS=$(S ss -lntpH | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u | tr '\n' ' ')
echo "  holders=[$HOLDERS]"

echo "=== 处理：同 jar 的多实例中，不持有端口者判为重复 ==="
for jar in $(ps -eo args | grep -a '[j]ar ' | sed 's/.*-jar //; s/ .*//' | sort | uniq -c | awk '$1>1{print $2}' | sort -u); do
  echo "  jar=$jar"
  for pid in $(ps -eo pid,args | grep -a "[-]jar $jar" | awk '{print $1}'); do
    if echo " $HOLDERS " | grep -q " $pid "; then
      echo "    pid=$pid 持端口 -> 保留"
    else
      # 双保险：进程是否监听（用 /proc 反查）
      if S ss -lntpH | grep -q "pid=$pid,"; then echo "    pid=$pid 持端口(反查) -> 保留"; else
        echo "    pid=$pid 无端口 -> 判重复，停止"
        S kill -9 "$pid"
      fi
    fi
  done
done
sleep 2
echo "=== 处理后内存 ==="
free -m | awk 'NR==2{print "  used="$3"MB avail="$7"MB"}'

echo "=== 安装 cloudflared ==="
if command -v cloudflared >/dev/null 2>&1; then
  echo "  已安装: $(cloudflared --version 2>/dev/null | head -1)"
else
  curl -sL -m 120 -o /tmp/cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    && S install -m 0755 /tmp/cloudflared /usr/local/bin/cloudflared \
    && rm -f /tmp/cloudflared \
    && echo "  安装完成: $(cloudflared --version 2>/dev/null | head -1)" \
    || echo "  !! 安装失败"
fi
echo SETUP_DONE
