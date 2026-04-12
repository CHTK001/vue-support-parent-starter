<template>
  <ScCard class="server-basic-panel" shadow="never">
    <template v-if="host">
      <div class="server-basic-panel__hero">
        <div class="server-basic-panel__identity">
          <div
            class="server-basic-panel__badge"
            :class="`is-${normalizeOs(host.osType) || 'default'}`"
          >
            <IconifyIconOnline :icon="osIcon(host.osType)" />
          </div>
          <div>
            <div class="server-basic-panel__title-row">
              <h2>{{ host.serverName }}</h2>
              <span
                class="server-basic-panel__latency"
                :class="latencyToneClass(snapshot?.latencyMs)"
              >
                {{ formatLatency(snapshot?.latencyMs) }}
              </span>
            </div>
            <div class="server-basic-panel__identity-meta">
              <span class="server-basic-panel__chip">{{
                serverTypeLabel(host.serverType)
              }}</span>
              <span class="server-basic-panel__chip">{{
                hostAddress(host)
              }}</span>
              <span class="server-basic-panel__chip">{{
                host.serverCode || "保存后自动生成编码"
              }}</span>
              <el-tag
                size="small"
                effect="light"
                :type="host.enabled !== false ? 'success' : 'info'"
              >
                {{ host.enabled !== false ? "已启用" : "未启用" }}
              </el-tag>
            </div>
          </div>
        </div>

        <div class="server-basic-panel__actions">
          <el-tooltip content="进程管理" placement="top">
            <el-button circle @click="emit('open-processes')">
              <IconifyIconOnline icon="ri:stack-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="文件管理" placement="top">
            <el-button circle @click="emit('open-files')">
              <IconifyIconOnline icon="ri:folder-5-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="采集任务" placement="top">
            <el-button circle @click="emit('open-metrics-task')">
              <IconifyIconOnline icon="ri:timer-flash-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="预警设置" placement="top">
            <el-button circle @click="emit('open-alert-settings')">
              <IconifyIconOnline icon="ri:alarm-warning-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="远程代理" placement="top">
            <el-button circle @click="emit('open-remote-settings')">
              <IconifyIconOnline icon="ri:route-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="canOpenRemote" content="远程控制" placement="top">
            <el-button circle type="info" plain @click="emit('open-remote')">
              <IconifyIconOnline icon="ri:remote-control-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="服务器大屏" placement="top">
            <el-button circle plain @click="emit('open-dashboard')">
              <IconifyIconOnline icon="ri:dashboard-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="项目管理" placement="top">
            <el-button circle plain @click="emit('open-projects')">
              <IconifyIconOnline icon="ri:folder-chart-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="softEnabled" content="软件视图" placement="top">
            <el-button circle type="primary" plain @click="emit('open-soft')">
              <IconifyIconOnline icon="ri:apps-2-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip v-if="softEnabled" content="安装软件" placement="top">
            <el-button
              circle
              type="success"
              plain
              @click="emit('open-install')"
            >
              <IconifyIconOnline icon="ri:download-cloud-2-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip content="编辑服务器" placement="top">
            <el-button circle @click="emit('edit')">
              <IconifyIconOnline icon="ri:edit-line" />
            </el-button>
          </el-tooltip>
          <el-tooltip
            :content="host.enabled ? '停用服务器' : '启用服务器'"
            placement="top"
          >
            <el-button
              circle
              :type="host.enabled ? 'warning' : 'success'"
              plain
              @click="emit('toggle-enabled')"
            >
              <IconifyIconOnline
                :icon="
                  host.enabled ? 'ri:pause-circle-line' : 'ri:play-circle-line'
                "
              />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <article class="server-basic-panel__realtime">
        <header class="server-basic-panel__realtime-header">
          <div>
            <h3>实时指标</h3>
            <p>
              {{
                snapshot?.detailMessage ||
                (snapshot?.online ? "Socket 实时推送中" : "等待服务器心跳")
              }}
            </p>
          </div>
          <el-radio-group v-model="metricChartMode" size="small">
            <el-radio-button value="split">分图</el-radio-button>
            <el-radio-button value="combined">合图</el-radio-button>
          </el-radio-group>
        </header>

        <div
          v-if="metricChartMode === 'split'"
          class="server-basic-panel__metric-grid"
        >
          <article
            v-for="item in metricCards"
            :key="item.key"
            class="server-basic-panel__metric-card"
            :class="item.toneClass"
            :style="metricProgressStyle(item.progress)"
            @click="emit('open-metric-detail', item.key)"
          >
            <div class="server-basic-panel__metric-top">
              <small>{{ item.label }}</small>
              <span>{{ item.subLabel }}</span>
            </div>
            <div class="server-basic-panel__metric-main">
              <strong>{{ item.value }}</strong>
              <span>{{ item.total }}</span>
            </div>
            <ScEcharts :option="item.option" height="56px" />
          </article>
        </div>
        <div v-else class="server-basic-panel__realtime-combined">
          <div class="server-basic-panel__realtime-summary">
            <button
              v-for="item in metricCards"
              :key="item.key"
              type="button"
              class="server-basic-panel__realtime-mini"
              :class="item.toneClass"
              :style="metricProgressStyle(item.progress)"
              @click="emit('open-metric-detail', item.key)"
            >
              <div class="server-basic-panel__realtime-mini-head">
                <small>{{ item.label }}</small>
                <span>{{ item.subLabel }}</span>
              </div>
              <div class="server-basic-panel__realtime-mini-main">
                <strong>{{ item.value }}</strong>
                <span>{{ item.total }}</span>
              </div>
              <ScEcharts :option="item.option" height="42px" />
            </button>
          </div>
          <div class="server-basic-panel__realtime-chart">
            <div class="server-basic-panel__realtime-chart-head">
              <div>
                <strong>综合趋势</strong>
                <span>CPU / 内存 / 磁盘 / 网络吞吐</span>
              </div>
              <span class="server-basic-panel__chip">
                {{ snapshot?.collectTimestamp ? "实时采样中" : "等待采样" }}
              </span>
            </div>
            <ScEcharts :option="chartOption" height="248px" />
          </div>
        </div>
      </article>

      <div class="server-basic-panel__content">
        <article class="server-basic-panel__card server-basic-panel__card--basic">
          <header class="server-basic-panel__card-header">
            <h3>基础信息</h3>
            <div class="server-basic-panel__tag-group">
              <span class="server-basic-panel__chip">
                {{
                  alertSettingsEnabled === false
                    ? "预警关闭"
                    : snapshot?.online
                      ? "在线"
                      : "离线"
                }}
              </span>
              <el-tooltip content="查看基础信息详情" placement="top">
                <el-button circle plain @click.stop="emit('open-basic-detail')">
                  <IconifyIconOnline icon="ri:information-line" />
                </el-button>
              </el-tooltip>
            </div>
          </header>

          <div class="server-basic-panel__content-scroll">
            <dl class="server-basic-panel__info-grid">
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
                <dd>
                  {{ runtimeDetail?.actualOsName || osLabel(host.osType) }}
                </dd>
              </div>
              <div>
                <dt>系统架构</dt>
                <dd>{{ archLabel(host.architecture) }}</dd>
              </div>
              <div>
                <dt>用户名</dt>
                <dd>{{ host.username || "本机账号" }}</dd>
              </div>
              <div>
                <dt>基础目录</dt>
                <dd>{{ host.baseDirectory || "-" }}</dd>
              </div>
              <div>
                <dt>主机名称</dt>
                <dd>{{ runtimeDetail?.hostName || "-" }}</dd>
              </div>
              <div>
                <dt>全局 AI</dt>
                <dd>
                  <el-tag
                    size="small"
                    effect="light"
                    :type="aiEnabled ? 'success' : 'info'"
                  >
                    {{ aiEnabled ? "已启用" : "未启用" }}
                  </el-tag>
                  <span
                    v-if="
                      aiStatusText ||
                      aiUnavailableReason ||
                      aiProvider ||
                      aiDefaultProvider ||
                      aiProviderCount
                    "
                    class="server-basic-panel__inline-meta"
                  >
                    {{
                      aiEnabled
                        ? [
                            aiProvider || aiDefaultProvider || aiStatusText,
                            aiProviderCount
                              ? `${aiProviderCount} 个 Provider`
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" · ") || "已激活"
                        : aiUnavailableReason ||
                          aiStatusText ||
                          "未检测到全局 AI"
                    }}
                  </span>
                  <div
                    v-if="aiDiagnosticItems.length"
                    class="server-basic-panel__diagnostic-grid"
                  >
                    <span
                      v-for="item in aiDiagnosticItems"
                      :key="item.label"
                      class="server-basic-panel__diagnostic-chip"
                      :class="item.toneClass"
                    >
                      {{ item.label }} · {{ item.value }}
                    </span>
                  </div>
                </dd>
              </div>
              <div>
                <dt>软件能力</dt>
                <dd>
                  <el-tag
                    size="small"
                    effect="light"
                    :type="softEnabled ? 'success' : 'info'"
                  >
                    {{ softEnabled ? "已启用" : "未启用" }}
                  </el-tag>
                </dd>
              </div>
              <div>
                <dt>公网地址</dt>
                <dd>{{ runtimeDetail?.publicIp || "-" }}</dd>
              </div>
              <div>
                <dt>内核 / 版本</dt>
                <dd>{{ runtimeDetail?.actualKernel || "-" }}</dd>
              </div>
              <div
                v-if="!aiEnabled && aiUnavailableReason"
                class="server-basic-panel__info-span-2"
              >
                <dt>AI 诊断</dt>
                <dd>
                  <p class="server-basic-panel__diagnostic-text">
                    {{ aiUnavailableReason }}
                  </p>
                  <div class="server-basic-panel__diagnostic-actions">
                    <el-tooltip content="打开系统设置并配置 AI Provider">
                      <el-button
                        circle
                        size="small"
                        type="primary"
                        plain
                        @click.stop="openAiSettings"
                      >
                        <IconifyIconOnline icon="ri:settings-4-line" />
                      </el-button>
                    </el-tooltip>
                  </div>
                  <div
                    v-if="aiDiagnosticItems.length"
                    class="server-basic-panel__diagnostic-grid"
                  >
                    <span
                      v-for="item in aiDiagnosticItems"
                      :key="`detail-${item.label}`"
                      class="server-basic-panel__diagnostic-chip"
                      :class="item.toneClass"
                    >
                      {{ item.label }} · {{ item.value }}
                    </span>
                  </div>
                </dd>
              </div>
              <div class="server-basic-panel__info-span-2">
                <dt>标签</dt>
                <dd>{{ host.tagsList?.join(" / ") || "-" }}</dd>
              </div>
              <div class="server-basic-panel__info-span-2">
                <dt>描述</dt>
                <dd>{{ host.description || "-" }}</dd>
              </div>
            </dl>

            <section class="server-basic-panel__ops-grid">
              <button
                type="button"
                class="server-basic-panel__ops-card"
                :disabled="!softEnabled"
                @click.stop="emit('open-soft')"
              >
                <small>软件实例</small>
                <strong>{{ softwareSummary.installations }}</strong>
                <span>打开软件驾驶舱查看安装与实例</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                :disabled="!services.length"
                @click.stop="emit('detail-service', services[0])"
              >
                <small>服务主档</small>
                <strong>{{ services.length }}</strong>
                <span>{{
                  services.length ? "查看最近服务详情" : "等待新增或自动检测"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                @click.stop="emit('open-processes')"
              >
                <small>进程管理</small>
                <strong>{{ snapshot?.online ? "在线" : "离线" }}</strong>
                <span>打开任务管理器查看实时进程</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                @click.stop="emit('open-files')"
              >
                <small>文件管理</small>
                <strong>{{ host.baseDirectory || "./" }}</strong>
                <span>打开文件管理器查看树状与文本编辑</span>
              </button>
            </section>
          </div>
        </article>

        <article
          class="server-basic-panel__card server-basic-panel__card--alert"
        >
          <header
            class="server-basic-panel__card-header server-basic-panel__card-header--stack"
          >
            <div>
              <h3>预警中心</h3>
              <p class="server-basic-panel__card-desc">
                CPU、内存、磁盘、网络、延迟命中阈值后会实时推送到这里。
              </p>
            </div>
            <div class="server-basic-panel__tag-group">
              <el-tooltip
                :content="
                  aiEnabled
                    ? 'AI 稳定性分析'
                    : aiUnavailableReason || 'AI 能力未激活'
                "
                placement="top"
              >
                <el-button
                  circle
                  plain
                  :disabled="!aiEnabled"
                  :loading="analyzingStability"
                  @click="emit('analyze-stability')"
                >
                  <IconifyIconOnline icon="ri:ai-generate-2" />
                </el-button>
              </el-tooltip>
              <span
                class="server-basic-panel__lay-tag"
                :class="alertStatusClass"
              >
                {{ alertStatusText }}
              </span>
              <span
                class="server-basic-panel__lay-tag"
                :class="alertMessageEnabled ? 'is-primary' : 'is-muted'"
              >
                {{ alertMessageEnabled ? "已同步消息中心" : "未同步消息中心" }}
              </span>
              <span
                v-if="latestAlertTime"
                class="server-basic-panel__lay-tag is-muted"
              >
                最新 {{ latestAlertTime }}
              </span>
            </div>
          </header>

          <div
            ref="alertScrollRef"
            class="server-basic-panel__content-scroll server-basic-panel__alert-scroll"
          >
            <article
              v-if="latestAlert"
              class="server-basic-panel__alert-hero"
              :class="severityClass(latestAlert.severity)"
              role="button"
              tabindex="0"
              @click="emit('open-alert-detail', latestAlert)"
              @keydown.enter.prevent="emit('open-alert-detail', latestAlert)"
            >
              <div class="server-basic-panel__alert-hero-main">
                <small>最新触发</small>
                <strong>
                  {{ metricLabel(latestAlert.metricType) }} ·
                  {{ severityLabel(latestAlert.severity) }}
                </strong>
                <p>{{ latestAlert.alertMessage || "已触发实时预警" }}</p>
              </div>
              <div class="server-basic-panel__alert-hero-side">
                <span
                  class="server-basic-panel__lay-tag"
                  :class="severityClass(latestAlert.severity)"
                >
                  {{
                    formatAlertMetricValue(latestAlert, latestAlert.metricValue)
                  }}
                </span>
                <small>{{ latestAlert.createTime || "刚刚" }}</small>
              </div>
            </article>
            <article
              v-if="!aiEnabled && aiUnavailableReason"
              class="server-basic-panel__ai-card server-basic-panel__ai-card--inactive"
            >
              <div class="server-basic-panel__ai-card-top">
                <strong>全局 AI 稳定性分析未激活</strong>
                <div class="server-basic-panel__tag-group">
                  <span class="server-basic-panel__lay-tag is-warning">
                    需要先激活 AI
                  </span>
                </div>
              </div>
              <p>{{ aiUnavailableReason }}</p>
              <small>激活后可在这里生成当前时间的稳定性结论和处理建议。</small>
              <div class="server-basic-panel__diagnostic-actions">
                <el-tooltip content="打开系统设置并配置 AI Provider">
                  <el-button
                    circle
                    size="small"
                    type="primary"
                    plain
                    @click.stop="openAiSettings"
                  >
                    <IconifyIconOnline icon="ri:settings-4-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </article>
            <article
              v-if="stabilityAiTask?.aiReason || stabilityAiTask?.aiSolution"
              class="server-basic-panel__ai-card"
            >
              <div class="server-basic-panel__ai-card-top">
                <strong>AI 稳定性结论</strong>
                <div class="server-basic-panel__tag-group">
                  <span class="server-basic-panel__lay-tag is-primary">
                    {{ stabilityAiTask?.aiProvider || "AI" }}
                  </span>
                  <span class="server-basic-panel__lay-tag is-muted">
                    {{ stabilityAiTask?.message || "分析完成" }}
                  </span>
                </div>
              </div>
              <p>{{ stabilityAiTask?.aiReason }}</p>
              <small>{{
                stabilityAiTask?.aiSolution || "暂无进一步建议"
              }}</small>
            </article>
            <div class="server-basic-panel__alert-summary">
              <button
                type="button"
                class="server-basic-panel__summary-card"
                @click="emit('open-alert-settings')"
              >
                <small>当前策略</small>
                <strong>{{
                  alertSettingsEnabled === false ? "关闭" : "启用中"
                }}</strong>
                <span>{{
                  alertMessageEnabled ? "联动站内消息" : "仅站内实时流"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                @click="emit('open-alert-settings')"
              >
                <small>消息中心</small>
                <strong>{{ alertMessageEnabled ? "已联动" : "未联动" }}</strong>
                <span>{{
                  alertMessageEnabled
                    ? "sys_message 实时通知"
                    : "保留页内与 Socket 事件"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                :disabled="!latestAlert"
                @click="latestAlert && emit('open-alert-detail', latestAlert)"
              >
                <small>最新级别</small>
                <strong>{{
                  latestAlert ? severityLabel(latestAlert.severity) : "正常"
                }}</strong>
                <span>{{
                  latestAlert ? metricLabel(latestAlert.metricType) : "等待触发"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                :disabled="!latestAlert"
                @click="latestAlert && emit('open-alert-detail', latestAlert)"
              >
                <small>最近告警</small>
                <strong>{{ orderedAlerts.length }}</strong>
                <span>
                  危险 {{ latestDangerCount }} / 预警 {{ latestWarningCount }}
                  <template v-if="latestAlertTime">
                    · {{ latestAlertTime }}</template
                  >
                </span>
              </button>
            </div>

            <section
              v-if="orderedAlerts.length"
              class="server-basic-panel__alert-list thin-scroller overflow-y-auto"
            >
              <header class="server-basic-panel__alert-list-header">
                <div>
                  <strong>最新预警</strong>
                  <span>按最新触发时间倒序展示</span>
                </div>
                <span class="server-basic-panel__lay-tag is-muted">
                  共 {{ orderedAlerts.length }} 条
                </span>
              </header>
              <article
                v-for="item in orderedAlerts"
                :key="
                  item.serverAlertEventId ||
                  `${item.metricType}-${item.createTime}`
                "
                class="server-basic-panel__alert-item"
                :class="`is-${String(item.severity || '').toLowerCase()}`"
                role="button"
                tabindex="0"
                @click="emit('open-alert-detail', item)"
                @keydown.enter.prevent="emit('open-alert-detail', item)"
              >
                <div class="server-basic-panel__alert-top">
                  <strong>{{ metricLabel(item.metricType) }}</strong>
                  <span
                    class="server-basic-panel__lay-tag"
                    :class="severityClass(item.severity)"
                  >
                    {{ severityLabel(item.severity) }}
                  </span>
                </div>
                <p>{{ item.alertMessage || "已触发实时预警" }}</p>
                <div class="server-basic-panel__alert-metrics">
                  <span
                    class="server-basic-panel__alert-pill"
                    :class="severityClass(item.severity)"
                  >
                    当前 {{ formatAlertMetricValue(item, item.metricValue) }}
                  </span>
                  <span class="server-basic-panel__alert-pill">
                    预警
                    {{ formatAlertMetricValue(item, item.warningThreshold) }}
                  </span>
                  <span class="server-basic-panel__alert-pill">
                    危险
                    {{ formatAlertMetricValue(item, item.dangerThreshold) }}
                  </span>
                </div>
                <small>{{ item.createTime || "刚刚" }}</small>
              </article>
            </section>
            <div v-else class="server-basic-panel__alert-empty">
              <strong>当前没有触发中的预警</strong>
              <span
                >服务器阈值正常时，这里会保持干净；命中阈值后会立即更新。</span
              >
            </div>
          </div>
        </article>

        <article
          class="server-basic-panel__card server-basic-panel__card--service"
        >
          <ServerServicePanel
            :services="services"
            :ai-enabled="aiEnabled"
            :ai-unavailable-reason="aiUnavailableReason"
            :can-auto-detect="canAutoDetectServices"
            :detecting="detectingServices"
            :action-loading-key="serviceActionLoadingKey"
            @create="emit('create-service')"
            @action="emit('service-action', $event[0], $event[1])"
            @ai-fix="emit('service-ai-fix', $event)"
            @logs="emit('view-service-logs', $event)"
            @edit="emit('edit-service', $event)"
            @detail="emit('detail-service', $event)"
            @detect="emit('detect-services')"
          />
        </article>
      </div>
    </template>

    <el-empty v-else description="请选择左侧服务器查看基础信息" />
  </ScCard>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { emitter } from "@repo/core";
import ScCard from "@repo/components/ScCard/index.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import ServerServicePanel from "./ServerServicePanel.vue";
import type {
  ServerAlertEvent,
  ServerAlertSettings,
  ServerAiTaskPayload,
  ServerHost,
  ServerMetricsDetail,
  ServerMetricsSnapshot,
  ServerRemoteConsoleConfig,
  ServerService,
} from "../api";
import type { HostSoftSummary } from "./server-types";
import {
  archLabel,
  buildMetricChartOption,
  buildMetricSparkOption,
  formatByteSize,
  formatLatency,
  formatMetricPercent,
  formatThroughput,
  hostAddress,
  latencyToneClass,
  normalizeOs,
  osIcon,
  osLabel,
  resolveIoTotal,
  serverTypeLabel,
} from "../utils/serverHost";

type ServerServiceAction =
  | "register"
  | "unregister"
  | "start"
  | "stop"
  | "restart"
  | "status";
type MetricChartMode = "split" | "combined";

const props = withDefaults(
  defineProps<{
    host?: ServerHost | null;
    snapshot?: ServerMetricsSnapshot | null;
    history?: ServerMetricsSnapshot[];
    runtimeDetail?: ServerMetricsDetail | null;
    remoteConfig?: ServerRemoteConsoleConfig | null;
    canOpenRemote?: boolean;
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
    alertSettings?: ServerAlertSettings | null;
    alertSettingsEnabled?: boolean;
    alertMessageEnabled?: boolean;
    stabilityAiTask?: ServerAiTaskPayload | null;
    analyzingStability?: boolean;
    latestAlerts?: ServerAlertEvent[];
    canAutoDetectServices?: boolean;
    detectingServices?: boolean;
    softwareSummary?: HostSoftSummary;
    services?: ServerService[];
    serviceActionLoadingKey?: string;
  }>(),
  {
    host: null,
    snapshot: null,
    history: () => [],
    runtimeDetail: null,
    remoteConfig: null,
    canOpenRemote: false,
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
    alertSettings: null,
    alertSettingsEnabled: true,
    alertMessageEnabled: false,
    stabilityAiTask: null,
    analyzingStability: false,
    latestAlerts: () => [],
    canAutoDetectServices: false,
    detectingServices: false,
    softwareSummary: () => ({
      targets: 0,
      installations: 0,
      services: 0,
    }),
    services: () => [],
    serviceActionLoadingKey: "",
  },
);

const emit = defineEmits<{
  edit: [];
  "toggle-enabled": [];
  "open-soft": [];
  "open-install": [];
  "open-dashboard": [];
  "open-projects": [];
  "open-remote": [];
  "open-processes": [];
  "open-files": [];
  "open-metrics-task": [];
  "open-alert-settings": [];
  "open-remote-settings": [];
  "open-basic-detail": [];
  "open-metric-detail": [metric: "cpu" | "memory" | "disk" | "io"];
  "open-alert-detail": [alert: ServerAlertEvent];
  "create-service": [];
  "service-action": [service: ServerService, action: ServerServiceAction];
  "service-ai-fix": [service: ServerService];
  "view-service-logs": [service: ServerService];
  "edit-service": [service: ServerService];
  "detail-service": [service: ServerService];
  "detect-services": [];
  "analyze-stability": [];
}>();

const metricChartMode = ref<MetricChartMode>("split");

const openAiSettings = () => {
  emitter.emit("openPanel");
};
const alertScrollRef = ref<HTMLElement | null>(null);

const severityLabel = (value?: string | null) =>
  value === "DANGER" ? "危险" : value === "WARNING" ? "预警" : value || "告警";

const severityClass = (value?: string | null) =>
  value === "DANGER"
    ? "is-danger"
    : value === "WARNING"
      ? "is-warning"
      : "is-muted";

const alertStatusText = computed(() => {
  if (props.alertSettingsEnabled === false) {
    return "预警已关闭";
  }
  if (props.latestAlerts.length) {
    return "预警触发中";
  }
  return props.snapshot?.online ? "实时监测中" : "等待心跳";
});

const alertStatusClass = computed(() => {
  if (props.alertSettingsEnabled === false) {
    return "is-muted";
  }
  if (props.latestAlerts.some((item) => item.severity === "DANGER")) {
    return "is-danger";
  }
  if (props.latestAlerts.some((item) => item.severity === "WARNING")) {
    return "is-warning";
  }
  return "is-primary";
});

const orderedAlerts = computed(() =>
  [...(props.latestAlerts || [])].sort((left, right) => {
    const timeLeft = new Date(left.createTime || 0).getTime() || 0;
    const timeRight = new Date(right.createTime || 0).getTime() || 0;
    if (timeLeft !== timeRight) {
      return timeRight - timeLeft;
    }
    return (
      Number(right.serverAlertEventId || 0) -
      Number(left.serverAlertEventId || 0)
    );
  }),
);

const latestAlert = computed(() => orderedAlerts.value[0] || null);
const latestAlertTime = computed(() => latestAlert.value?.createTime || "");
const latestDangerCount = computed(
  () => orderedAlerts.value.filter((item) => item.severity === "DANGER").length,
);
const latestWarningCount = computed(
  () =>
    orderedAlerts.value.filter((item) => item.severity === "WARNING").length,
);

const aiDiagnosticItems = computed(() =>
  [
    aiDiagnosticItem(
      "默认 Provider",
      props.aiDefaultProvider || props.aiProvider || "",
      Boolean(props.aiDefaultProvider || props.aiProvider),
    ),
    aiDiagnosticItem(
      "当前 Provider",
      props.aiProvider || props.aiDefaultProvider || "",
      Boolean(props.aiProvider),
    ),
    aiDiagnosticItem(
      "已发现 Provider",
      props.aiProviderNames?.length ? props.aiProviderNames.join(", ") : "",
      Boolean(props.aiProviderNames?.length),
    ),
    aiDiagnosticItem(
      "Provider 数量",
      props.aiProviderCount ? `${props.aiProviderCount}` : "",
      Number(props.aiProviderCount || 0) > 0,
    ),
    aiDiagnosticItem(
      "配置状态",
      props.aiConfigReady ? "已就绪" : "未就绪",
      props.aiConfigReady,
    ),
    aiDiagnosticItem(
      "ChatClient",
      props.aiChatClientReady ? "已装配" : "未装配",
      props.aiChatClientReady,
    ),
    aiDiagnosticItem(
      "原因代码",
      props.aiUnavailableCode || "",
      Boolean(props.aiUnavailableCode),
    ),
    aiDiagnosticItem(
      "Provider 解析",
      props.aiProviderResolvedFrom || "",
      Boolean(props.aiProviderResolvedFrom),
    ),
  ].filter((item) => item.value),
);

watch(
  () => latestAlert.value?.serverAlertEventId,
  async (value, previous) => {
    if (!value || value === previous) {
      return;
    }
    await nextTick();
    alertScrollRef.value?.scrollTo({
      top: 0,
      behavior: previous ? "smooth" : "auto",
    });
  },
);

const metricLabel = (value?: string | null) =>
  value === "CPU"
    ? "CPU"
    : value === "MEMORY"
      ? "内存"
      : value === "DISK"
        ? "磁盘"
        : value === "IO"
          ? "网络"
          : value === "LATENCY"
            ? "延迟"
            : value || "指标";

const formatAlertMetricValue = (
  item?: ServerAlertEvent | null,
  value?: number | null,
) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "--";
  }
  if (item?.metricType === "IO") {
    return formatThroughput(numeric);
  }
  if (item?.metricType === "LATENCY") {
    return formatLatency(numeric);
  }
  return formatMetricPercent(numeric);
};

const chartOption = computed(() => buildMetricChartOption(props.history));

const usageToneClass = (value?: number | null, warning = 75, danger = 90) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "is-idle";
  }
  if (numeric >= danger) {
    return "is-danger";
  }
  if (numeric >= warning) {
    return "is-warning";
  }
  return "is-success";
};

const metricCards = computed(() => {
  const snapshot = props.snapshot;
  const settings = props.alertSettings || {};
  const cpuDanger = Number(settings.cpuDangerPercent || 90);
  const memoryDanger = Number(settings.memoryDangerPercent || 90);
  const diskDanger = Number(settings.diskDangerPercent || 92);
  const ioDanger = Number(settings.ioDangerBytesPerSecond || 120 * 1024 * 1024);
  return [
    {
      key: "cpu",
      label: "CPU",
      subLabel: `${snapshot?.cpuCores || "--"} 核`,
      value: formatMetricPercent(snapshot?.cpuUsage),
      total: snapshot?.cpuCores ? `逻辑核心 ${snapshot.cpuCores}` : "总量未知",
      progress: clampProgress(snapshot?.cpuUsage),
      toneClass: usageToneClass(
        snapshot?.cpuUsage,
        Number(settings.cpuWarningPercent || 75),
        cpuDanger,
      ),
      option: buildMetricSparkOption(props.history, "cpu", {
        warning: Number(settings.cpuWarningPercent || 75),
        danger: cpuDanger,
      }),
    },
    {
      key: "memory",
      label: "内存",
      subLabel: formatByteSize(snapshot?.memoryUsedBytes),
      value: formatMetricPercent(snapshot?.memoryUsage),
      total: `总量 ${formatByteSize(snapshot?.memoryTotalBytes)}`,
      progress: clampProgress(snapshot?.memoryUsage),
      toneClass: usageToneClass(
        snapshot?.memoryUsage,
        Number(settings.memoryWarningPercent || 75),
        memoryDanger,
      ),
      option: buildMetricSparkOption(props.history, "memory", {
        warning: Number(settings.memoryWarningPercent || 75),
        danger: memoryDanger,
      }),
    },
    {
      key: "disk",
      label: "磁盘",
      subLabel: formatByteSize(snapshot?.diskUsedBytes),
      value: formatMetricPercent(snapshot?.diskUsage),
      total: `总量 ${formatByteSize(snapshot?.diskTotalBytes)}`,
      progress: clampProgress(snapshot?.diskUsage),
      toneClass: usageToneClass(
        snapshot?.diskUsage,
        Number(settings.diskWarningPercent || 80),
        diskDanger,
      ),
      option: buildMetricSparkOption(props.history, "disk", {
        warning: Number(settings.diskWarningPercent || 80),
        danger: diskDanger,
      }),
    },
    {
      key: "io",
      label: "网络 IO",
      subLabel: `入 ${formatThroughput(snapshot?.ioReadBytesPerSecond)}`,
      value: formatThroughput(resolveIoTotal(snapshot)),
      total: `出 ${formatThroughput(snapshot?.ioWriteBytesPerSecond)}`,
      progress: clampProgress(resolveIoProgress(resolveIoTotal(snapshot), ioDanger)),
      toneClass: usageToneClass(
        resolveIoTotal(snapshot),
        Number(settings.ioWarningBytesPerSecond || 50 * 1024 * 1024),
        ioDanger,
      ),
      option: buildMetricSparkOption(props.history, "io", {
        warning: Number(settings.ioWarningBytesPerSecond || 50 * 1024 * 1024),
        danger: ioDanger,
      }),
    },
  ];
});

const metricProgressStyle = (progress?: number | null) => ({
  "--metric-progress": `${clampProgress(progress)}%`,
});

function clampProgress(value?: number | null) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, numeric));
}

function resolveIoProgress(value?: number | null, dangerThreshold?: number | null) {
  const numeric = Number(value ?? 0);
  const threshold = Number(dangerThreshold ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0 || !Number.isFinite(threshold) || threshold <= 0) {
    return 0;
  }
  return (numeric / threshold) * 100;
}

function aiDiagnosticItem(label: string, value: string, enabled: boolean) {
  return {
    label,
    value,
    toneClass: enabled ? "is-success" : "is-muted",
  };
}
</script>

<style scoped lang="scss">
.server-basic-panel {
  height: 100%;
  border-radius: 28px;
}

.server-basic-panel :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
}

.server-basic-panel__hero,
.server-basic-panel__identity,
.server-basic-panel__actions,
.server-basic-panel__title-row,
.server-basic-panel__card-header,
.server-basic-panel__identity-meta,
.server-basic-panel__realtime-header {
  display: flex;
  align-items: center;
}

.server-basic-panel__hero,
.server-basic-panel__realtime-header,
.server-basic-panel__card-header {
  justify-content: space-between;
}

.server-basic-panel__hero {
  gap: 14px;
  padding: 16px 18px;
  border-radius: 26px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--el-color-primary) 12%, transparent), transparent 44%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.05);
}

.server-basic-panel__identity {
  gap: 14px;
  min-width: 0;
}

.server-basic-panel__badge {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  background: linear-gradient(145deg, #64748b, #1e293b);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    0 16px 26px rgba(15, 23, 42, 0.14);
}

.server-basic-panel__badge.is-windows {
  background: linear-gradient(145deg, #60a5fa, #2563eb);
}

.server-basic-panel__badge.is-linux {
  background: linear-gradient(145deg, #f59e0b, #d97706);
}

.server-basic-panel__badge.is-macos {
  background: linear-gradient(145deg, #94a3b8, #334155);
}

.server-basic-panel__title-row {
  gap: 12px;
}

.server-basic-panel__title-row h2 {
  margin: 0;
  font-size: 23px;
  line-height: 1.1;
}

.server-basic-panel__latency {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
}

.server-basic-panel__latency.is-success {
  color: var(--el-color-success);
}

.server-basic-panel__latency.is-warning {
  color: var(--el-color-warning);
}

.server-basic-panel__latency.is-danger {
  color: var(--el-color-danger);
}

.server-basic-panel__identity-meta {
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.server-basic-panel__chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 90%, white);
  font-size: 12px;
}

.server-basic-panel__actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-basic-panel__actions :deep(.el-button) {
  width: 34px;
  height: 34px;
  border-color: color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.06);
}

.server-basic-panel__realtime,
.server-basic-panel__card {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 8%, transparent),
      transparent 52%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-fill-color-light) 48%, white),
      white
    );
}

.server-basic-panel__realtime {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 24px;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.04);
}

.server-basic-panel__realtime-header {
  gap: 12px;
}

.server-basic-panel__realtime-header h3,
.server-basic-panel__card-header h3 {
  margin: 0;
  font-size: 16px;
}

.server-basic-panel__realtime-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-basic-panel__metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.server-basic-panel__metric-card {
  position: relative;
  display: grid;
  gap: 6px;
  min-height: 116px;
  padding: 12px;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  isolation: isolate;
  overflow: hidden;
}

.server-basic-panel__metric-card::before,
.server-basic-panel__realtime-mini::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: clamp(18px, calc(var(--metric-progress, 0%) * 0.62), 78px);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, currentColor 16%, transparent),
    transparent
  );
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
}

.server-basic-panel__metric-card > *,
.server-basic-panel__realtime-mini > * {
  position: relative;
  z-index: 1;
}

.server-basic-panel__metric-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 26%,
    var(--el-border-color)
  );
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.09);
}

.server-basic-panel__metric-card.is-success {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.12);
}

.server-basic-panel__metric-card.is-warning {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}

.server-basic-panel__metric-card.is-danger {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-basic-panel__metric-top,
.server-basic-panel__metric-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.server-basic-panel__metric-top small,
.server-basic-panel__info-grid dt {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__metric-top span,
.server-basic-panel__metric-main span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__metric-main strong {
  font-size: 20px;
  line-height: 1;
}

.server-basic-panel__realtime-chart {
  min-width: 0;
  display: grid;
  gap: 10px;
}

.server-basic-panel__realtime-combined {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 12px;
  min-width: 0;
}

.server-basic-panel__realtime-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.server-basic-panel__realtime-mini {
  position: relative;
  width: 100%;
  display: grid;
  gap: 9px;
  padding: 14px;
  appearance: none;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  isolation: isolate;
  overflow: hidden;
}

.server-basic-panel__realtime-mini:hover {
  transform: translateY(-2px);
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 26%,
    var(--el-border-color)
  );
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}

.server-basic-panel__realtime-mini.is-success {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.12);
}

.server-basic-panel__realtime-mini.is-warning {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}

.server-basic-panel__realtime-mini.is-danger {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-basic-panel__realtime-mini-head,
.server-basic-panel__realtime-mini-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.server-basic-panel__realtime-mini-head small,
.server-basic-panel__realtime-mini-head span,
.server-basic-panel__realtime-mini-main span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__realtime-mini-main strong {
  font-size: 22px;
  line-height: 1;
}

.server-basic-panel__realtime-chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.server-basic-panel__realtime-chart-head strong {
  display: block;
  font-size: 14px;
  line-height: 1.2;
}

.server-basic-panel__realtime-chart-head span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__content {
  display: grid;
  grid-template-columns: minmax(320px, 0.84fr) minmax(0, 1.16fr);
  grid-template-areas:
    "basic alert"
    "basic service";
  gap: 16px;
  align-items: start;
  min-height: fit-content;
  flex: 1 1 auto;
  overflow: visible;
}

.server-basic-panel__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 18px;
  border-radius: 24px;
  overflow: visible;
  align-self: start;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.04);
}

.server-basic-panel__card--basic {
  grid-area: basic;
  overflow: visible;
  align-self: start;
}

.server-basic-panel__card--basic .server-basic-panel__content-scroll {
  flex: 0 0 auto;
  overflow: visible;
  padding-right: 0;
}

.server-basic-panel__card--service {
  grid-area: service;
  min-width: 0;
  min-height: 474px;
}

.server-basic-panel__card--alert,
.server-basic-panel__card--alert-detail {
  grid-area: alert;
  min-width: 0;
  min-height: 474px;
}

.server-basic-panel__content-scroll {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding-right: 4px;
  display: grid;
  gap: 14px;
}

.server-basic-panel__alert-scroll {
  overscroll-behavior: contain;
}

.server-basic-panel__info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
}

.server-basic-panel__info-grid dd {
  margin: 6px 0 0;
  word-break: break-word;
  color: var(--el-text-color-primary);
}

.server-basic-panel__info-span-2 {
  grid-column: span 2;
}

.server-basic-panel__card-header--stack {
  align-items: flex-start;
  gap: 14px;
}

.server-basic-panel__card-desc {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.server-basic-panel__tag-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-basic-panel__lay-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-basic-panel__lay-tag.is-primary {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.server-basic-panel__lay-tag.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(245, 158, 11, 0.26);
}

.server-basic-panel__lay-tag.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(239, 68, 68, 0.24);
}

.server-basic-panel__lay-tag.is-muted {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
}

.server-basic-panel__alert-summary {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 6px;
}

.server-basic-panel__ops-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-basic-panel__ops-card {
  appearance: none;
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.server-basic-panel__ops-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.server-basic-panel__ops-card:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.server-basic-panel__ops-card small,
.server-basic-panel__ops-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__ops-card strong {
  font-size: 18px;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.server-basic-panel__summary-card {
  appearance: none;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color-page) 86%, white);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.server-basic-panel__summary-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.server-basic-panel__summary-card:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.server-basic-panel__summary-card small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__summary-card strong {
  font-size: 18px;
  line-height: 1.1;
}

.server-basic-panel__summary-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-list {
  display: grid;
  gap: 12px;
  max-height: 340px;
  overflow: auto;
  padding-right: 4px;
  padding-top: 4px;
  align-content: start;
}

.server-basic-panel__alert-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-basic-panel__alert-hero:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.06);
}

.server-basic-panel__alert-hero.is-warning {
  border-color: color-mix(in srgb, var(--el-color-warning) 32%, transparent);
}

.server-basic-panel__alert-hero.is-danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 32%, transparent);
}

.server-basic-panel__alert-hero-main,
.server-basic-panel__alert-hero-side {
  display: grid;
  gap: 6px;
}

.server-basic-panel__alert-hero-main small,
.server-basic-panel__alert-hero-side small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-hero-main strong {
  font-size: 16px;
  line-height: 1.25;
}

.server-basic-panel__alert-hero-main p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.server-basic-panel__alert-hero-side {
  justify-items: end;
  text-align: right;
}

.server-basic-panel__alert-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 12px;
}

.server-basic-panel__alert-list-header strong {
  display: block;
  line-height: 1.1;
}

.server-basic-panel__alert-list-header span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.server-basic-panel__alert-list header,
.server-basic-panel__alert-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.server-basic-panel__alert-list header {
  margin-top: 2px;
  padding-bottom: 2px;
}

.server-basic-panel__alert-list header span,
.server-basic-panel__alert-item small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-item {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-basic-panel__alert-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.06);
}

.server-basic-panel__alert-item.is-warning {
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}

.server-basic-panel__alert-item.is-danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

.server-basic-panel__alert-item p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.server-basic-panel__alert-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.server-basic-panel__alert-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  font-size: 12px;
  font-weight: 600;
}

.server-basic-panel__alert-pill.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(245, 158, 11, 0.26);
}

.server-basic-panel__alert-pill.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(239, 68, 68, 0.24);
}

.server-basic-panel__alert-empty {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-basic-panel__alert-empty strong {
  color: var(--el-text-color-primary);
}

.server-basic-panel__inline-meta {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 6px;
}

.server-basic-panel__diagnostic-text {
  margin: 0 0 8px;
  line-height: 1.6;
}

.server-basic-panel__diagnostic-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.server-basic-panel__diagnostic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.server-basic-panel__diagnostic-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-basic-panel__diagnostic-chip.is-success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, white);
  border-color: color-mix(in srgb, var(--el-color-success) 22%, transparent);
}

.server-basic-panel__alert-empty span {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.server-basic-panel__ai-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 10%, white),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white)
  );
}

.server-basic-panel__ai-card--inactive {
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-warning) 10%, white),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white)
  );
}

.server-basic-panel__ai-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.server-basic-panel__ai-card p,
.server-basic-panel__ai-card small {
  margin: 0;
  line-height: 1.65;
}

.server-basic-panel__ai-card small {
  color: var(--el-text-color-secondary);
}

@media (max-width: 1240px) {
  .server-basic-panel__realtime-combined {
    grid-template-columns: 1fr;
  }

  .server-basic-panel__realtime-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-basic-panel__content {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-areas:
      "basic alert"
      "service service";
  }

  .server-basic-panel__card--service {
    grid-column: auto;
  }
}

@media (max-width: 1220px) {
  .server-basic-panel__metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-basic-panel__alert-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .server-basic-panel__hero,
  .server-basic-panel__realtime-header,
  .server-basic-panel__metric-grid,
  .server-basic-panel__content {
    grid-template-columns: 1fr;
    grid-template-areas:
      "basic"
      "alert"
      "service";
  }

  .server-basic-panel__hero,
  .server-basic-panel__realtime-header {
    display: grid;
  }

  .server-basic-panel__metric-grid,
  .server-basic-panel__content {
    display: grid;
  }
}
</style>
