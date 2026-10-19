<script setup lang="ts">
/**
 * 系统配置 —— 系统级（Guacd 远控网关 + SIP 内网穿透）配置
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
  {
    key: "ssh",
    title: "SSH 超时",
    desc: "远程执行与主机探测的连接/读取超时",
    icon: "Timer",
    consumer: "WindowsSshShell / ConnectionManager / 主机探测动态读取 · 保存后对新连接立即生效",
    items: [
      { key: "ssh.connect.timeout", label: "连接超时（秒）", type: "number", placeholder: "15", hint: "TCP 连接与握手；跨地域或链路抖动大时可调大" },
      { key: "ssh.session.timeout", label: "会话超时（秒）", type: "number", placeholder: "30", hint: "SSH 认证/会话建立；目标机高负载时 15 秒易误判超时，建议 30 以上" },
      { key: "ssh.read.timeout", label: "读取超时（秒）", type: "number", placeholder: "60", hint: "单条命令执行与输出读取；卸载/升级等长静默脚本需覆盖其静默时长" },
    ],
  },
];

const KEYS = CARDS.flatMap(c => c.items.map(i => i.key));

const FALLBACK: Record<string, string> = {
  "guacd.host": "124.221.230.112",
  "guacd.port": "4822",
  "guacd.client.host": "127.0.0.1:8848",
  "agent.package.path": "monitor-agent/monitor-agent.tar.gz",
  "prometheus.package.path": "prometheus/prometheus.tar.gz",
  "ssh.connect.timeout": "15",
  "ssh.session.timeout": "30",
  "ssh.read.timeout": "60",
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
        <p class="page-desc">远控网关与内网穿透配置 · 保存后即时生效</p>
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
</style>
