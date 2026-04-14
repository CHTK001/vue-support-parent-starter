<template>
  <el-dialog
    v-model="dialogVisible"
    destroy-on-close
    width="920px"
    class="server-host-overview-dialog"
    :title="host ? `${host.serverName} · 服务器详情` : '服务器详情'"
  >
    <template v-if="host">
      <section class="server-host-overview-dialog__hero">
        <div>
          <h3>{{ host.serverName }}</h3>
          <p>
            {{ serverTypeLabel(host.serverType) }} · {{ hostAddress(host) }} ·
            {{ runtimeDetail?.actualOsName || osLabel(host.osType) }}
          </p>
        </div>
        <div class="server-host-overview-dialog__chips">
          <ScTag size="small" effect="plain" round>
            {{ host.enabled !== false ? "已启用" : "未启用" }}
          </ScTag>
          <ScTag
            size="small"
            effect="plain"
            round
            :type="snapshot?.online ? 'success' : 'info'"
          >
            {{ snapshot?.online ? "在线" : "离线" }}
          </ScTag>
          <ScTag size="small" effect="plain" round>
            {{ snapshot?.latencyMs ? `${snapshot.latencyMs} ms` : "延迟未知" }}
          </ScTag>
        </div>
      </section>

      <section class="server-host-overview-dialog__grid">
        <article class="server-host-overview-dialog__card">
          <header><strong>接入与系统</strong></header>
          <dl class="server-host-overview-dialog__facts">
            <div>
              <dt>接入类型</dt>
              <dd>{{ serverTypeLabel(host.serverType) }}</dd>
            </div>
            <div>
              <dt>主机地址</dt>
              <dd>{{ hostAddress(host) }}</dd>
            </div>
            <div>
              <dt>操作系统</dt>
              <dd>{{ osLabel(host.osType) }}</dd>
            </div>
            <div>
              <dt>实际系统</dt>
              <dd>{{ runtimeDetail?.actualOsName || "-" }}</dd>
            </div>
            <div>
              <dt>系统架构</dt>
              <dd>{{ archLabel(host.architecture) }}</dd>
            </div>
            <div>
              <dt>内核 / 版本</dt>
              <dd>{{ runtimeDetail?.actualKernel || "-" }}</dd>
            </div>
            <div>
              <dt>主机名称</dt>
              <dd>{{ runtimeDetail?.hostName || "-" }}</dd>
            </div>
            <div>
              <dt>公网地址</dt>
              <dd>{{ runtimeDetail?.publicIp || host?.publicIp || "-" }}</dd>
            </div>
          </dl>
        </article>

        <article class="server-host-overview-dialog__card">
          <header><strong>账号与路径</strong></header>
          <dl class="server-host-overview-dialog__facts">
            <div>
              <dt>用户名</dt>
              <dd>{{ host.username || "本机账号" }}</dd>
            </div>
            <div>
              <dt>基础目录</dt>
              <dd>{{ host.baseDirectory || "-" }}</dd>
            </div>
            <div>
              <dt>服务器编码</dt>
              <dd>{{ host.serverCode || "-" }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ host.createTime || "-" }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{{ host.updateTime || "-" }}</dd>
            </div>
            <div>
              <dt>标签</dt>
              <dd>{{ host.tagsList?.join(" / ") || "-" }}</dd>
            </div>
          </dl>
        </article>

        <article class="server-host-overview-dialog__card">
          <header><strong>能力状态</strong></header>
          <div class="server-host-overview-dialog__status-list">
            <div class="server-host-overview-dialog__status-item">
              <strong>AI 能力</strong>
              <span>{{ aiEnabled ? "已启用" : "未启用" }}</span>
              <small>{{
                aiEnabled
                  ? [
                      aiProvider || aiDefaultProvider || aiStatusText,
                      aiProviderCount ? `${aiProviderCount} 个 Provider` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "可直接使用 AI 能力"
                  : [
                      aiUnavailableReason || aiStatusText || "暂无可用 AI 配置",
                      aiDefaultProvider
                        ? `默认 Provider: ${aiDefaultProvider}`
                        : "",
                      aiProviderNames?.length
                        ? `已发现: ${aiProviderNames.join(", ")}`
                        : "",
                      aiProviderCount
                        ? `已配置 ${aiProviderCount} 个 Provider`
                        : "",
                      aiUnavailableCode ? `原因代码: ${aiUnavailableCode}` : "",
                      aiProviderResolvedFrom
                        ? `Provider 解析: ${aiProviderResolvedFrom}`
                        : "",
                      aiConfigReady ? "配置就绪" : "配置未就绪",
                      aiChatClientReady
                        ? "ChatClient 已装配"
                        : "ChatClient 未装配",
                    ]
                      .filter(Boolean)
                      .join(" · ")
              }}</small>
              <div
                v-if="!aiEnabled"
                class="server-host-overview-dialog__status-actions"
              >
                <el-tooltip content="打开系统设置并配置 AI Provider">
                  <el-button
                    circle
                    size="small"
                    type="primary"
                    plain
                    @click="openAiSettings"
                  >
                    <IconifyIconOnline icon="ri:settings-4-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </div>
            <div class="server-host-overview-dialog__status-item">
              <strong>软件能力</strong>
              <span>{{ softEnabled ? "已启用" : "未启用" }}</span>
              <small>软件安装、服务编排与联动控制</small>
            </div>
          </div>
        </article>

        <article class="server-host-overview-dialog__card">
          <header><strong>当前指标</strong></header>
          <dl class="server-host-overview-dialog__facts">
            <div>
              <dt>CPU</dt>
              <dd>{{ snapshot?.cpuUsage ?? 0 }}%</dd>
            </div>
            <div>
              <dt>内存</dt>
              <dd>{{ snapshot?.memoryUsage ?? 0 }}%</dd>
            </div>
            <div>
              <dt>磁盘</dt>
              <dd>{{ snapshot?.diskUsage ?? 0 }}%</dd>
            </div>
            <div>
              <dt>网络 IO</dt>
              <dd>
                入 {{ formatThroughput(snapshot?.ioReadBytesPerSecond) }} / 出
                {{ formatThroughput(snapshot?.ioWriteBytesPerSecond) }}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { emitter } from "@repo/core";
import IconifyIconOnline from "@repo/components/ReIcon/src/iconifyIconOnline";
import ScTag from "@repo/components/ScTag/src/index.vue";
import type {
  ServerHost,
  ServerMetricsDetail,
  ServerMetricsSnapshot,
} from "../api";
import {
  archLabel,
  formatThroughput,
  hostAddress,
  osLabel,
  serverTypeLabel,
} from "../utils/serverHost";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    host?: ServerHost | null;
    snapshot?: ServerMetricsSnapshot | null;
    runtimeDetail?: ServerMetricsDetail | null;
    softEnabled?: boolean;
    aiEnabled?: boolean;
    aiProvider?: string;
    aiDefaultProvider?: string;
    aiProviderCount?: number;
    aiProviderNames?: string[];
    aiConfigReady?: boolean;
    aiChatClientReady?: boolean;
    aiStatusText?: string;
    aiUnavailableReason?: string;
    aiUnavailableCode?: string;
    aiProviderResolvedFrom?: string;
  }>(),
  {
    host: null,
    snapshot: null,
    runtimeDetail: null,
    softEnabled: false,
    aiEnabled: false,
    aiProvider: "",
    aiDefaultProvider: "",
    aiProviderCount: 0,
    aiProviderNames: () => [],
    aiConfigReady: false,
    aiChatClientReady: false,
    aiStatusText: "",
    aiUnavailableReason: "",
    aiUnavailableCode: "",
    aiProviderResolvedFrom: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const openAiSettings = () => {
  emitter.emit("openPanel");
};
</script>

<style scoped lang="scss">
.server-host-overview-dialog__hero,
.server-host-overview-dialog__chips {
  display: flex;
  align-items: center;
}

.server-host-overview-dialog__hero {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 20px 22px;
  min-height: 112px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 34%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  box-shadow:
    0 20px 36px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.server-host-overview-dialog__hero h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
}

.server-host-overview-dialog__hero p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.server-host-overview-dialog__chips {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-self: flex-start;
}

.server-host-overview-dialog__chips :deep(.el-tag) {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
}

.server-host-overview-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.server-host-overview-dialog__card {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #fff, #f8fafc);
}

.server-host-overview-dialog__card header {
  margin-bottom: 12px;
}

.server-host-overview-dialog__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.server-host-overview-dialog__facts div,
.server-host-overview-dialog__status-item {
  display: grid;
  gap: 6px;
}

.server-host-overview-dialog__facts dt,
.server-host-overview-dialog__status-item small {
  color: #64748b;
  font-size: 12px;
}

.server-host-overview-dialog__facts dd,
.server-host-overview-dialog__status-item span,
.server-host-overview-dialog__status-item strong {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-all;
}

.server-host-overview-dialog__status-list {
  display: grid;
  gap: 12px;
}

.server-host-overview-dialog__status-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 900px) {
  .server-host-overview-dialog__grid,
  .server-host-overview-dialog__facts {
    grid-template-columns: 1fr;
  }

  .server-host-overview-dialog__hero {
    display: grid;
  }
}
</style>
