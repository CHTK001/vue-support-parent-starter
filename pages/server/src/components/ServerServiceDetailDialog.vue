<template>
  <el-dialog
    v-model="dialogVisible"
    destroy-on-close
    width="980px"
    class="server-service-detail-dialog"
    :title="service ? `${service.serviceName} · 服务详情` : '服务详情'"
  >
    <template v-if="service">
      <section class="server-service-detail-dialog__hero">
        <div>
          <h3>{{ service.serviceName }}</h3>
          <p>
            {{ service.serviceType || "SERVER_SERVICE" }} ·
            {{ service.installPath || "未配置安装目录" }}
          </p>
        </div>
        <div class="server-service-detail-dialog__chips">
          <span class="server-service-detail-dialog__chip">
            {{ detectedLabel }}
          </span>
          <span class="server-service-detail-dialog__chip">
            {{ service.runtimeStatus || "UNKNOWN" }}
          </span>
          <span class="server-service-detail-dialog__chip">
            {{ service.enabled !== false ? "已启用" : "未启用" }}
          </span>
          <span
            v-if="service.softInstallationId"
            class="server-service-detail-dialog__chip"
          >
            安装实例 #{{ service.softInstallationId }}
          </span>
        </div>
      </section>

      <section class="server-service-detail-dialog__grid">
        <article class="server-service-detail-dialog__card">
          <header>
            <strong>运行摘要</strong>
          </header>
          <div class="server-service-detail-dialog__summary">
            <div class="server-service-detail-dialog__summary-card">
              <small>状态</small>
              <strong>{{ service.runtimeStatus || "UNKNOWN" }}</strong>
              <span>{{ service.enabled !== false ? "已启用" : "未启用" }}</span>
            </div>
            <div class="server-service-detail-dialog__summary-card">
              <small>脚本数</small>
              <strong>{{ enabledScriptCount }}</strong>
              <span>{{ scriptCapabilities.length }} 种能力</span>
            </div>
            <div class="server-service-detail-dialog__summary-card">
              <small>配置数</small>
              <strong>{{ configPaths.length }}</strong>
              <span>日志 {{ logPaths.length }} 条</span>
            </div>
          </div>
        </article>

        <article class="server-service-detail-dialog__card">
          <header>
            <strong>检测与执行</strong>
          </header>
          <dl class="server-service-detail-dialog__facts">
            <div>
              <dt>维护方式</dt>
              <dd>{{ detectedLabel }}</dd>
            </div>
            <div>
              <dt>执行通道</dt>
              <dd>{{ executionProviderText }}</dd>
            </div>
            <div>
              <dt>检测来源</dt>
              <dd>{{ detectedSourceText }}</dd>
            </div>
            <div>
              <dt>检测时间</dt>
              <dd>{{ detectedAtText }}</dd>
            </div>
          </dl>
        </article>

        <article class="server-service-detail-dialog__card">
          <header>
            <strong>基础信息</strong>
          </header>
          <dl class="server-service-detail-dialog__facts">
            <div>
              <dt>服务名称</dt>
              <dd>{{ service.serviceName || "-" }}</dd>
            </div>
            <div>
              <dt>服务类型</dt>
              <dd>{{ service.serviceType || "-" }}</dd>
            </div>
            <div>
              <dt>安装目录</dt>
              <dd>{{ service.installPath || "-" }}</dd>
            </div>
            <div>
              <dt>运行状态</dt>
              <dd>{{ service.runtimeStatus || "-" }}</dd>
            </div>
            <div>
              <dt>最近操作</dt>
              <dd>{{ service.lastOperationTime || "-" }}</dd>
            </div>
            <div>
              <dt>最近结果</dt>
              <dd>{{ service.lastOperationMessage || "-" }}</dd>
            </div>
          </dl>
        </article>

        <article class="server-service-detail-dialog__card">
          <header>
            <strong>脚本能力</strong>
          </header>
          <div class="server-service-detail-dialog__script-list">
            <div
              v-for="item in scriptCapabilities"
              :key="item.label"
              class="server-service-detail-dialog__script-item"
              :class="{ 'is-enabled': item.enabled }"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.enabled ? "已配置" : "未配置" }}</span>
            </div>
          </div>
        </article>

        <article class="server-service-detail-dialog__card">
          <header>
            <strong>配置与日志</strong>
          </header>
          <div class="server-service-detail-dialog__chips">
            <span
              v-for="item in configPaths"
              :key="`config-${item}`"
              class="server-service-detail-dialog__chip"
            >
              配置 {{ item }}
            </span>
            <span
              v-for="item in logPaths"
              :key="`log-${item}`"
              class="server-service-detail-dialog__chip"
            >
              日志 {{ item }}
            </span>
          </div>
          <div class="server-service-detail-dialog__path-block">
            <small>配置路径</small>
            <p>{{ configPathsText }}</p>
          </div>
          <div class="server-service-detail-dialog__path-block">
            <small>日志路径</small>
            <p>{{ logPathsText }}</p>
          </div>
        </article>

        <article class="server-service-detail-dialog__card">
          <header>
            <strong>AI 诊断</strong>
          </header>
          <div v-if="service.latestAiReason || service.latestAiSolution">
            <div class="server-service-detail-dialog__path-block">
              <small>失败原因</small>
              <p>{{ service.latestAiReason || "-" }}</p>
            </div>
            <div class="server-service-detail-dialog__path-block">
              <small>处理方案</small>
              <p>{{ service.latestAiSolution || "-" }}</p>
            </div>
            <div class="server-service-detail-dialog__chips">
              <span class="server-service-detail-dialog__chip">
                {{ service.latestAiProvider || "AI" }}
              </span>
              <span class="server-service-detail-dialog__chip">
                {{ service.latestAiModel || "默认模型" }}
              </span>
            </div>
            <div
              v-if="service.latestAiFixScript?.trim()"
              class="server-service-detail-dialog__path-block"
            >
              <small>AI 修复脚本</small>
              <p>{{ service.latestAiFixScript }}</p>
            </div>
          </div>
          <el-empty v-else description="暂无 AI 诊断记录" />
        </article>

        <article
          class="server-service-detail-dialog__card server-service-detail-dialog__card--wide"
        >
          <header>
            <strong>脚本预览</strong>
          </header>
          <div
            v-if="scriptPreviews.length"
            class="server-service-detail-dialog__preview-list"
          >
            <div
              v-for="item in scriptPreviews"
              :key="item.label"
              class="server-service-detail-dialog__preview-item"
            >
              <div class="server-service-detail-dialog__preview-head">
                <strong>{{ item.label }}</strong>
                <span>{{ item.lines }} 行</span>
              </div>
              <p>{{ item.preview }}</p>
            </div>
          </div>
          <el-empty v-else description="当前没有可预览的脚本内容" />
        </article>
      </section>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ServerService } from "../api";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    service?: ServerService | null;
  }>(),
  {
    service: null,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const metadata = computed<Record<string, unknown>>(() => {
  try {
    const parsed = props.service?.metadataJson
      ? JSON.parse(props.service.metadataJson)
      : {};
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
});

const providerLabel = (value?: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (normalized === "LOCAL") {
    return "本机";
  }
  if (normalized === "SSH") {
    return "SSH";
  }
  if (normalized === "WINRM") {
    return "WinRM";
  }
  return normalized || "未记录";
};

const sourceLabel = (value?: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "systemd") {
    return "systemd";
  }
  if (normalized === "windows-service") {
    return "Windows 服务";
  }
  return normalized || "手工维护";
};

const detectedLabel = computed(() =>
  metadata.value.detected ? "自动检测" : "手工维护",
);

const executionProviderText = computed(() =>
  providerLabel(metadata.value.executionProvider || metadata.value.spiChannel),
);

const detectedSourceText = computed(() =>
  sourceLabel(metadata.value.detectedSource || metadata.value.systemCapability),
);

const detectedAtText = computed(() => {
  const numeric = Number(metadata.value.detectedAt || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "未记录";
  }
  return new Date(numeric).toLocaleString("zh-CN", { hour12: false });
});

const parseArray = (value?: string | null) => {
  if (!value) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
  } catch {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const configPathsText = computed(() => {
  const items = parseArray(props.service?.configPathsJson);
  return items.length ? items.join("\n") : "未配置";
});

const configPaths = computed(() => parseArray(props.service?.configPathsJson));

const logPathsText = computed(() => {
  const items = parseArray(props.service?.logPathsJson);
  return items.length ? items.join("\n") : "未配置";
});

const logPaths = computed(() => parseArray(props.service?.logPathsJson));

const scriptCapabilities = computed(() => [
  { label: "启动脚本", enabled: Boolean(props.service?.startScript?.trim()) },
  { label: "停止脚本", enabled: Boolean(props.service?.stopScript?.trim()) },
  { label: "重启脚本", enabled: Boolean(props.service?.restartScript?.trim()) },
  { label: "状态脚本", enabled: Boolean(props.service?.statusScript?.trim()) },
  {
    label: "注册脚本",
    enabled: Boolean(props.service?.registerScript?.trim()),
  },
  {
    label: "取消注册脚本",
    enabled: Boolean(props.service?.unregisterScript?.trim()),
  },
]);

const enabledScriptCount = computed(
  () => scriptCapabilities.value.filter((item) => item.enabled).length,
);

const previewScript = (value?: string | null) => {
  const text = String(value || "").trim();
  if (!text) {
    return "";
  }
  return text.split(/\r?\n/).slice(0, 3).join("\n");
};

const scriptPreviews = computed(() =>
  [
    { label: "启动脚本", value: props.service?.startScript },
    { label: "停止脚本", value: props.service?.stopScript },
    { label: "重启脚本", value: props.service?.restartScript },
    { label: "状态脚本", value: props.service?.statusScript },
    { label: "注册脚本", value: props.service?.registerScript },
    { label: "取消注册脚本", value: props.service?.unregisterScript },
  ]
    .map((item) => {
      const preview = previewScript(item.value);
      return {
        label: item.label,
        preview,
        lines: preview
          ? String(item.value || "")
              .trim()
              .split(/\r?\n/).length
          : 0,
      };
    })
    .filter((item) => item.preview),
);
</script>

<style scoped lang="scss">
.server-service-detail-dialog__hero,
.server-service-detail-dialog__chips,
.server-service-detail-dialog__script-item,
.server-service-detail-dialog__preview-head {
  display: flex;
  align-items: center;
}

.server-service-detail-dialog__hero {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.server-service-detail-dialog__hero h3 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.server-service-detail-dialog__hero p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.server-service-detail-dialog__chips {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-service-detail-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  color: #334155;
  background: rgba(15, 23, 42, 0.06);
  font-size: 12px;
}

.server-service-detail-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.server-service-detail-dialog__card--wide {
  grid-column: span 2;
}

.server-service-detail-dialog__card {
  padding: 18px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: linear-gradient(180deg, #fff, #f8fafc);
}

.server-service-detail-dialog__card header {
  margin-bottom: 14px;
}

.server-service-detail-dialog__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.server-service-detail-dialog__facts div,
.server-service-detail-dialog__path-block {
  display: grid;
  gap: 6px;
}

.server-service-detail-dialog__summary {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.server-service-detail-dialog__summary-card,
.server-service-detail-dialog__preview-item {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(148, 163, 184, 0.08);
}

.server-service-detail-dialog__summary-card strong {
  font-size: 18px;
  line-height: 1.1;
}

.server-service-detail-dialog__facts dt,
.server-service-detail-dialog__path-block small {
  color: #64748b;
  font-size: 12px;
}

.server-service-detail-dialog__facts dd,
.server-service-detail-dialog__path-block p {
  margin: 0;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

.server-service-detail-dialog__script-list {
  display: grid;
  gap: 10px;
}

.server-service-detail-dialog__preview-list {
  display: grid;
  gap: 10px;
}

.server-service-detail-dialog__script-item {
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 0 14px;
  border-radius: 16px;
  background: rgba(148, 163, 184, 0.08);
  color: #64748b;
}

.server-service-detail-dialog__script-item.is-enabled {
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
}

.server-service-detail-dialog__preview-head {
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 900px) {
  .server-service-detail-dialog__grid,
  .server-service-detail-dialog__facts,
  .server-service-detail-dialog__summary {
    grid-template-columns: 1fr;
  }

  .server-service-detail-dialog__hero {
    display: grid;
  }

  .server-service-detail-dialog__card--wide {
    grid-column: auto;
  }
}
</style>
