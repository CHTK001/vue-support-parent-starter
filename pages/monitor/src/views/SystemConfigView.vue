<script setup lang="ts">
/**
 * 系统配置 —— 系统级（Guacd 远控网关 + SSH 通道 + SIP 内网穿透）配置
 */
import { onMounted, ref } from "vue";

import {http, message} from "@repo/core";
import { unwrapResult } from "@repo/utils";

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "number";
  placeholder: string;
  hint?: string;
}

interface ConfigCard {
  key: string;
  title: string;
  desc: string;
  icon: string;
  consumer: string;
  items: ConfigField[];
}

const CARDS: ConfigCard[] = [
  {
    key: "guacd",
    title: "guacd",
    desc: "远控隧道守护进程 · 服务端连接",
    icon: "Connection",
    consumer: "GuacdConnectionFactory 动态读取 · 远控隧道建立时生效",
    items: [
      { key: "guacd.host", label: "地址", type: "text", placeholder: "124.221.230.112" },
      { key: "guacd.port", label: "端口", type: "number", placeholder: "4822" },
      { key: "guacd.rdp.security", label: "RDP 安全层", type: "text", placeholder: "nla", hint: "any / rdp / tls / nla / nla-ext / vmconnect；Windows 默认要 NLA，老系统或网关可能要 any" },
    ],
  },
  {
    key: "guacd-client",
    title: "guacd-client",
    desc: "浏览器侧 WS 隧道网关",
    icon: "Link",
    consumer: "RemoteControlPageController 动态读取 · 生成远控页面时生效",
    items: [
      { key: "guacd.client.host", label: "网关地址（host:port）", type: "text", placeholder: "127.0.0.1:8848", hint: "留空 = 同域 location.host" },
    ],
  },
  {
    key: "ssh",
    title: "SSH 与连接超时",
    desc: "连接 / 认证 / 读取超时，以及连接池的空闲回收",
    icon: "Timer",
    consumer: "SshTimeouts 与 ConnectionManager 动态读取 · 保存后热生效，无需重启平台",
    items: [
      { key: "ssh.connect.timeout", label: "连接超时（秒）", type: "number", placeholder: "15", hint: "TCP 连接 + SSH 握手上限；高 RTT / 慢链路可调大" },
      { key: "ssh.session.timeout", label: "会话超时（秒）", type: "number", placeholder: "30", hint: "认证与会话建立上限；高负载主机认证慢时调大" },
      { key: "ssh.read.timeout", label: "读取超时（秒）", type: "number", placeholder: "60", hint: "命令执行与输出读取上限；长命令 / 大输出需要更大" },
      { key: "connection.idle.timeout", label: "空闲回收（秒）", type: "number", placeholder: "300", hint: "连接池里超过这么久没人用的 SSH 连接会被关闭；调大 = 复用更久、调小 = 更省目标机资源" },
      { key: "connection.sweep.interval", label: "健康检查间隔（秒）", type: "number", placeholder: "60", hint: "多久扫一次连接池（探测失活 + 按空闲回收）；改完下次扫描生效" },
    ],
  },
  {
    key: "rdp",
    title: "RDP 显示",
    desc: "远控桌面的分辨率 / 色深 / 画质 / DPI",
    icon: "Monitor",
    consumer: "GuacdConnectionFactory 与直连 RDP 读同一套值 · 越界或非法回落默认",
    items: [
      { key: "rdp.width", label: "分辨率宽", type: "number", placeholder: "1280", hint: "640-3840，越界回落 1280" },
      { key: "rdp.height", label: "分辨率高", type: "number", placeholder: "768", hint: "480-2160，越界回落 768" },
      { key: "rdp.color-depth", label: "色深", type: "number", placeholder: "24", hint: "只支持 8 / 16 / 24 / 32，其它回落 24" },
      { key: "rdp.dpi", label: "DPI", type: "number", placeholder: "96", hint: "60-480，越界回落 96；影响 Windows 界面缩放" },
      { key: "rdp.force-lossless", label: "画质优先", type: "text", placeholder: "false", hint: "true = 关闭有损压缩，更清晰但更占带宽" },
    ],
  },
  {
    key: "rdp-experience",
    title: "RDP 体验",
    desc: "壁纸 / 主题 / 字体平滑 / 动画等画面开销",
    icon: "Picture",
    consumer: "GuacdTunables 读取 · 建立连接时生效（改完下次连接）",
    items: [
      { key: "rdp.wallpaper", label: "显示壁纸", type: "text", placeholder: "false", hint: "关掉更省带宽（默认关）" },
      { key: "rdp.theming", label: "显示主题", type: "text", placeholder: "false", hint: "关掉更省带宽（默认关）" },
      { key: "rdp.font-smoothing", label: "字体平滑", type: "text", placeholder: "true", hint: "开更清晰，略占带宽" },
      { key: "rdp.full-window-drag", label: "整窗拖拽", type: "text", placeholder: "true", hint: "关掉只显示窗口轮廓，弱网更流畅" },
      { key: "rdp.desktop-composition", label: "桌面合成", type: "text", placeholder: "true", hint: "Aero 效果；老机器可关" },
      { key: "rdp.menu-animations", label: "菜单动画", type: "text", placeholder: "false", hint: "关掉略省带宽" },
    ],
  },
  {
    key: "rdp-device",
    title: "RDP 设备",
    desc: "音频 / 驱动器映射 / 控制台 / 证书 / 区域",
    icon: "Headset",
    consumer: "GuacdTunables 读取 · 建立连接时生效",
    items: [
      { key: "rdp.audio-output", label: "音频输出", type: "text", placeholder: "true", hint: "false = 不把远端声音传回浏览器" },
      { key: "rdp.audio-input", label: "音频输入（麦克风）", type: "text", placeholder: "false", hint: "默认关；开会话才需要" },
      { key: "rdp.drive", label: "驱动器映射", type: "text", placeholder: "false", hint: "远程桌面里的文件传输通道，默认关" },
      { key: "rdp.console", label: "控制台会话", type: "text", placeholder: "false", hint: "true = 接管控制台，不踢掉已登录用户" },
      { key: "rdp.ignore-cert", label: "忽略证书错误", type: "text", placeholder: "true", hint: "自签证书的 Windows 需要开" },
      { key: "rdp.timezone", label: "时区", type: "text", placeholder: "Asia/Shanghai", hint: "字母数字与 ._:- 组成，2-40 字符" },
      { key: "rdp.keyboard-layout", label: "键盘布局", type: "text", placeholder: "en-us-qwerty", hint: "如 en-us-qwerty / zh-cn-qwerty" },
    ],
  },
  {
    key: "vnc",
    title: "VNC 画面",
    desc: "色深 / 压缩 / 画质 / 编码 / 光标",
    icon: "View",
    consumer: "GuacdTunables 读取 · 建立连接时生效（编码写错整份回落默认）",
    items: [
      { key: "vnc.color-depth", label: "色深", type: "number", placeholder: "24", hint: "8 / 16 / 24 / 32" },
      { key: "vnc.compress-level", label: "压缩级别", type: "number", placeholder: "7", hint: "0-9，越大越省带宽越耗 CPU" },
      { key: "vnc.quality-level", label: "画质级别", type: "number", placeholder: "6", hint: "0-9，越大越清晰越占带宽" },
      { key: "vnc.cursor", label: "光标渲染", type: "text", placeholder: "local", hint: "local 本地跟手 / remote 远端形状准确" },
      { key: "vnc.encodings", label: "编码优先级", type: "text", placeholder: "ZRLE,Hextile,Tight", hint: "逗号分隔；有一个不认识就整份回落默认" },
      { key: "vnc.swap-red-blue", label: "交换红蓝", type: "text", placeholder: "false", hint: "颜色反转时开" },
      { key: "vnc.auto-retry", label: "自动重连次数", type: "number", placeholder: "0", hint: "0-10" },
    ],
  },
  {
    key: "ssh-display",
    title: "SSH 终端外观",
    desc: "TERM 类型 / 字体 / 字号 / 退格",
    icon: "Document",
    consumer: "TERM 对直连与 guacd 都生效；字体/字号/退格只作用于 guacd 链路（直连用 xterm 侧设置）",
    items: [
      { key: "ssh.terminal-type", label: "终端类型 TERM", type: "text", placeholder: "xterm-256color", hint: "xterm-256color / xterm / screen-256color / vt100；直连 PTY 也用它" },
      { key: "ssh.font-name", label: "字体名", type: "text", placeholder: "monospace", hint: "仅 guacd 链路；直连终端的字体在页面里固定" },
      { key: "ssh.font-size", label: "字号", type: "number", placeholder: "12", hint: "仅 guacd 链路；8-40，越界回落 12" },
      { key: "ssh.backspace", label: "退格键", type: "number", placeholder: "127", hint: "仅 guacd 链路；127(DEL) 或 8(BS)，其它回落 127" },
    ],
  },
  {
    key: "agent",
    title: "Agent 包",
    desc: "监控 Agent 部署包路径与下载",
    icon: "Download",
    consumer: "Agent 部署时从平台下载 · 打包后自动更新",
    items: [
      { key: "agent.package.path", label: "Agent 包路径", type: "text", placeholder: "agent-package/monitor-agent.tar.gz", hint: "相对于平台工作目录的 tar.gz 包路径" },
      { key: "prometheus.package.path", label: "Prometheus 包路径", type: "text", placeholder: "prometheus/prometheus.tar.gz", hint: "Prometheus 二进制部署包路径" },
    ],
  },
];

const KEYS = CARDS.flatMap(c => c.items.map(i => i.key));

const FALLBACK: Record<string, string> = {
  "guacd.host": "124.221.230.112",
  "guacd.port": "4822",
  "guacd.rdp.security": "nla",
  "connection.idle.timeout": "300",
  "connection.sweep.interval": "60",
  "guacd.client.host": "127.0.0.1:8848",
  "ssh.connect.timeout": "15",
  "ssh.session.timeout": "30",
  "ssh.read.timeout": "60",
  "rdp.width": "1280",
  "rdp.height": "768",
  "rdp.color-depth": "24",
  "rdp.force-lossless": "false",
  "rdp.dpi": "96",
  "rdp.wallpaper": "false",
  "rdp.theming": "false",
  "rdp.font-smoothing": "true",
  "rdp.full-window-drag": "true",
  "rdp.desktop-composition": "true",
  "rdp.menu-animations": "false",
  "rdp.audio-output": "true",
  "rdp.audio-input": "false",
  "rdp.drive": "false",
  "rdp.console": "false",
  "rdp.ignore-cert": "true",
  "rdp.timezone": "Asia/Shanghai",
  "rdp.keyboard-layout": "en-us-qwerty",
  "vnc.color-depth": "24",
  "vnc.compress-level": "7",
  "vnc.quality-level": "6",
  "vnc.cursor": "local",
  "vnc.encodings": "ZRLE,Hextile,Tight",
  "vnc.swap-red-blue": "false",
  "vnc.auto-retry": "0",
  "ssh.terminal-type": "xterm-256color",
  "ssh.font-name": "monospace",
  "ssh.font-size": "12",
  "ssh.backspace": "127",
  "agent.package.path": "monitor-agent/monitor-agent.tar.gz",
  "prometheus.package.path": "prometheus/prometheus.tar.gz",
};

const values = ref<Record<string, string>>({});
const loading = ref(false);
const saving = ref(false);

// SIP 状态
const sipRunning = ref(false);
const sipStarting = ref(false);
const sipForm = ref({
  enabled: false,
  serverHost: "124.221.230.112",
  controlPort: 7822,
  secret: "lvzhou2011",
});
const sipCmds = ref<Record<string, string>>({});

async function load(): Promise<void> {
  loading.value = true;
  try {
    const map = await http().get("/ms/server/config/map").then(r => unwrapResult<Record<string, unknown>>(r));
    const merged: Record<string, string> = {};
    for (const k of KEYS) {
      const v = map?.[k];
      merged[k] = v == null ? FALLBACK[k] : String(v);
    }
    values.value = merged;

    // 加载 SIP 状态
    const sipCfg = await http().get("/ms/server/sip/config").then(r => unwrapResult<Record<string, any>>(r));
    sipForm.value.enabled = sipCfg?.["sip.enabled"] === "true";
    sipForm.value.serverHost = sipCfg?.["sip.server.host"] ?? "124.221.230.112";
    sipForm.value.controlPort = sipCfg?.["sip.control.port"] ?? 7822;
    sipForm.value.secret = sipCfg?.["sip.secret"] ?? "lvzhou2011";
    sipRunning.value = sipCfg?.running === true;

    // 加载部署命令
    sipCmds.value = await http().get("/ms/server/sip/deploy-cmds").then(r => unwrapResult<Record<string, string>>(r));
  } catch (e) {
    values.value = { ...FALLBACK };
    message.error(`加载失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

async function save(): Promise<void> {
  saving.value = true;
  try {
    const payload: Record<string, string> = {};
    for (const k of KEYS) {
      const v = values.value[k];
      if (v != null && v !== "") payload[k] = String(v);
    }
    await http().post("/ms/server/config").data(payload);
    message.success("系统配置已保存");
  } catch (e) {
    message.error(`保存失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
}

async function toggleSip(): Promise<void> {
  sipStarting.value = true;
  try {
    if (sipRunning.value) {
      await http().post("/ms/server/sip/stop");
      sipRunning.value = false;
      sipForm.value.enabled = false;
      message.success("SIP 服务已停止");
    } else {
      // 先保存配置
      await http().post("/ms/server/config").data({
        "sip.enabled": "true",
        "sip.server.host": sipForm.value.serverHost,
        "sip.control.port": String(sipForm.value.controlPort),
        "sip.secret": sipForm.value.secret,
      });
      await http().post("/ms/server/sip/start");
      sipRunning.value = true;
      sipForm.value.enabled = true;
      message.success("SIP 服务已启动");
    }
  } catch (e) {
    message.error(`操作失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    sipStarting.value = false;
  }
}

const clientMode = (c: ConfigCard): string => {
  const v = c.items.find(i => i.key === "guacd.client.host");
  if (!v) return "";
  return values.value[v.key]?.trim() ? "自定义网关" : "同域直连";
};

onMounted(load);
</script>

<template>
  <div class="sc tel-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统配置</h1>
        <p class="page-desc">远控网关、SSH 通道与内网穿透配置 · 保存后即时生效</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="load">刷新</ReButton>
        <ReButton icon="Check" :show-text="true" type="primary" :loading="saving" @click="save">保存</ReButton>
      </div>
    </div>

    <ReSkeleton :loading="loading" :rows="3" animated>
      <!-- guacd + guacd-client 两列 -->
      <div class="sc-grid-2">
        <ReCard v-for="c in CARDS" :key="c.key" :radius="12" shadow="never" class="sc-card">
          <template #header>
            <div class="sc-card-head">
              <div class="sc-tile"><ReIcon :name="c.icon" :size="15" /></div>
              <div class="sc-tt">
                <b class="sc-tt-name">{{ c.title }}</b>
                <span class="sc-tt-desc">{{ c.desc }}</span>
              </div>
            </div>
          </template>
          <div class="sc-fields">
            <label v-for="it in c.items" :key="it.key" class="sc-field">
              <span class="sc-label">
                {{ it.label }}
                <ReTag
                  v-if="it.key === 'guacd.client.host'"
                  :type="values[it.key]?.trim() ? 'primary' : 'info'"
 effect="light"
                >{{ clientMode(c) }}</ReTag>
              </span>
              <ReInput v-if="it.type === 'text'" v-model="values[it.key]" :placeholder="it.placeholder" class="sc-mono" style="width:100%" />
              <ReInputNumber v-else :model-value="values[it.key] === '' || values[it.key] == null ? null : Number(values[it.key])" :min="0" :max="65535" controls-position="right" class="sc-mono" style="width:100%" @update:model-value="values[it.key] = $event == null ? '' : String($event)" />
              <div v-if="it.hint" class="sc-hint">{{ it.hint }}</div>
            </label>
          </div>
          <div class="sc-foot">
            <span class="sc-consumer">{{ c.consumer }}</span>
          </div>
        </ReCard>
      </div>

      <!-- SIP 内网穿透 - 通栏大卡片 -->
      <ReCard :radius="12" shadow="never" class="sip-card">
        <template #header>
          <div class="sip-head">
            <div class="sc-tile sip-tile"><ReIcon name="Connection" :size="16" /></div>
            <div class="sc-tt">
              <b class="sc-tt-name">SIP 内网穿透</b>
              <span class="sc-tt-desc">Secure Infrastructure Proxy · 打通 guacd 到内网机器（RDP/SSH/VNC）</span>
            </div>
            <div class="sip-status">
              <span class="sip-dot" :class="sipRunning ? 'on' : 'off'"></span>
              <span class="sip-status-text">{{ sipRunning ? '运行中' : '已停止' }}</span>
              <ReButton
                :type="sipRunning ? 'danger' : 'success'"

                :loading="sipStarting"
                @click="toggleSip"
              >{{ sipRunning ? '停止' : '启动服务' }}</ReButton>
            </div>
          </div>
        </template>

        <div class="sip-body">
          <!-- 配置区 -->
          <div class="sip-config">
            <label class="sc-field">
              <span class="sc-label">SIP 服务器地址</span>
              <ReInput v-model="sipForm.serverHost" placeholder="124.221.230.112" class="sc-mono" />
            </label>
            <label class="sc-field">
              <span class="sc-label">控制端口</span>
              <ReInputNumber v-model="sipForm.controlPort" :min="1024" :max="65535" controls-position="right" class="sc-mono" />
            </label>
            <label class="sc-field">
              <span class="sc-label">认证密钥</span>
              <ReInput v-model="sipForm.secret" placeholder="lvzhou2011" class="sc-mono" />
            </label>
          </div>

          <!-- 部署架构图 -->
          <div class="sip-deploy">
            <div class="deploy-title">部署架构</div>
            <div class="deploy-flow">
              <div class="deploy-node">
                <div class="deploy-node-title">sip + visit</div>
                <div class="deploy-node-desc">部署到 guacd 服务器<br/>124.221.230.112</div>
              </div>
              <div class="deploy-arrow">⟷</div>
              <div class="deploy-node">
                <div class="deploy-node-title">provider</div>
                <div class="deploy-node-desc">部署到目标内网<br/>192.168.200.18</div>
              </div>
            </div>
          </div>

          <!-- 启动命令 -->
          <div class="sip-cmds">
            <div class="deploy-title">启动命令</div>
            <div class="cmd-block">
              <div class="cmd-label">server（guacd 服务器）</div>
              <code class="cmd-text">{{ sipCmds.server }}</code>
            </div>
            <div class="cmd-block">
              <div class="cmd-label">visit（guacd 服务器）</div>
              <code class="cmd-text">{{ sipCmds.visit }}</code>
            </div>
            <div class="cmd-block">
              <div class="cmd-label">provider（目标内网机器）</div>
              <code class="cmd-text">{{ sipCmds.provider }}</code>
            </div>
          </div>
        </div>
      </ReCard>
    </ReSkeleton>
  </div>
</template>

<style scoped lang="scss">
/*
 * 页面根容器：本页是**卡片**（`tel-page` 自带白底 + 1px 边框 + 12px 圆角 + 投影），
 * 所以必须有内边距 —— 否则标题与卡片内容会直接贴着边框，看上去像被裁掉了。
 *
 * 全局 `.tel-page` 把 padding 归零，是为了那些**透明**的页面容器（如代理管理页
 * 去掉误加的 `px` 工具类后就是纯透明根）：那些页面的留白由外层 `.main-content`
 * 提供，再叠一层就是重复。但卡片型页面没有这层「外层留白」可依赖 ——
 * 容器自己画了边框，内容离边框多远只能由自己决定。
 *
 * 16px 与页内节奏对齐（`.sc-card` 的 body padding 16px、`.sc-grid-2` 的 gap 16px）。
 */
.sc {
  padding: 16px;
}

.sc-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
@media (max-width: 900px) {
  .sc-grid-2 { grid-template-columns: 1fr; }
}

.sc-card {
  transition: box-shadow 0.2s ease, border-color 0.15s ease;
  &:hover { box-shadow: var(--shadow-2); border-color: var(--border-default); }
  :deep(.el-card__header) { padding: 14px 16px; }
  :deep(.el-card__body) { padding: 16px; }
}

.sc-card-head { display: flex; align-items: center; gap: 10px; }
.sc-tile {
  display: grid; place-items: center;
  width: 30px; height: 30px; flex: none;
  border-radius: 8px;
  background: var(--brand-50); color: var(--brand-600);
  box-shadow: inset 0 0 0 1px var(--brand-100);
}
.sc-tt { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.sc-tt-name { font-size: 14px; font-weight: 600; }
.sc-tt-desc { font-size: 11.5px; color: var(--text-tertiary); }

.sc-fields { display: flex; flex-direction: column; gap: 14px; }
.sc-field { display: block; }
.sc-label {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 6px; font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
}
.sc-mono :deep(.el-input__inner),
.sc-mono :deep(.el-input-number) {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 13px;
}
.sc-hint { margin-top: 6px; font-size: 11.5px; color: var(--text-tertiary); }
.sc-foot {
  margin-top: 16px; padding-top: 12px;
  border-top: 1px dashed var(--border-subtle);
  font-size: 11.5px; color: var(--text-tertiary);
}

/* SIP 卡片 */
.sip-card {
  :deep(.el-card__header) { padding: 16px 20px; }
  :deep(.el-card__body) { padding: 20px; }
}
.sip-head { display: flex; align-items: center; gap: 12px; }
.sip-tile { background: var(--success-light, #e6f7e6); color: var(--status-online); }
.sip-status { display: flex; align-items: center; gap: 8px; flex: none; }
.sip-dot {
  width: 8px; height: 8px; border-radius: 50%;
  &.on { background: var(--status-online); box-shadow: 0 0 6px var(--status-online); }
  &.off { background: var(--text-tertiary); }
}
.sip-status-text { font-size: 12px; font-weight: 500; color: var(--text-secondary); }

.sip-body {
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  gap: 24px;
}
@media (max-width: 1100px) {
  .sip-body { grid-template-columns: 1fr; }
}

.deploy-title {
  font-size: 12px; font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* 部署架构 */
.deploy-flow {
  display: flex; align-items: center; gap: 12px;
  padding: 16px;
  background: var(--fill-light, #f8f9fa);
  border-radius: 8px;
}
.deploy-node {
  flex: 1; text-align: center;
  padding: 12px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}
.deploy-node-title { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.deploy-node-desc { font-size: 11px; color: var(--text-tertiary); line-height: 1.5; }
.deploy-arrow { font-size: 20px; color: var(--text-tertiary); flex: none; }

/* 命令区 */
.sip-cmds { display: flex; flex-direction: column; gap: 10px; }
.cmd-block {
  padding: 10px 12px;
  background: var(--fill-light, #f8f9fa);
  border-radius: 6px;
  border-left: 3px solid var(--brand-500);
}
.cmd-label { font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-bottom: 4px; }
.cmd-text {
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 11.5px;
  color: var(--text-primary);
  word-break: break-all;
  display: block;
  line-height: 1.5;
}

/* 窄屏收紧页边距：16px 在手机上会让可用宽度明显变窄 */
@media (max-width: 720px) {
  .sc { padding: 12px; }
}
</style>
