<template>
  <section class="server-project-page">
    <header class="hero">
      <div>
        <small>SERVER / PROJECT</small>
        <h1>项目管理工作台</h1>
        <p>
          复用 soft、server-service 和 AI
          能力，统一管理项目运行、日志、回滚与失败分析。
        </p>
      </div>
      <div class="chips">
        <span class="chip">serverId {{ serverId || "-" }}</span>
        <span class="chip">host {{ route.query.serverName || "未指定" }}</span>
        <span class="chip">AI {{ aiText }}</span>
      </div>
    </header>

    <div class="summary">
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('all')"
        @keydown.enter.prevent="focusSummary('all')"
      >
        <small>项目实例</small><strong>{{ totalProjectCount }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('running')"
        @keydown.enter.prevent="focusSummary('running')"
      >
        <small>运行中</small><strong>{{ runningCount }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('issue')"
        @keydown.enter.prevent="focusSummary('issue')"
      >
        <small>异常</small><strong>{{ issueCount }}</strong>
      </article>
      <article
        class="summary-card summary-card--action"
        role="button"
        tabindex="0"
        @click="focusSummary('latest')"
        @keydown.enter.prevent="focusSummary('latest')"
      >
        <small>最近操作</small><strong>{{ latestOpTime || "--" }}</strong>
      </article>
    </div>

    <div class="toolbar">
      <ScInput v-model="keyword" clearable placeholder="搜索项目 / 服务 / 路径">
        <template #prefix><IconifyIconOnline icon="ri:search-line" /></template>
      </ScInput>
      <el-radio-group v-model="filter" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="running">运行中</el-radio-button>
        <el-radio-button value="issue">异常</el-radio-button>
        <el-radio-button value="ai">AI</el-radio-button>
      </el-radio-group>
      <el-button circle :loading="loading" @click="loadPage"
        ><IconifyIconOnline icon="ri:refresh-line"
      /></el-button>
    </div>

    <article
      v-if="aiDiagnosticChips.length"
      class="ai-status"
      :class="{ 'is-inactive': !capabilities?.aiEnabled }"
    >
      <div class="panel-head">
        <div>
          <h3>AI 能力诊断</h3>
          <p>
            {{
              capabilities?.aiEnabled
                ? "项目诊断、脚本生成和失败分析已接入当前 AI Provider。"
                : capabilities?.aiUnavailableReason ||
                  "当前未检测到可用 AI，请先完成 Provider 配置。"
            }}
          </p>
        </div>
        <div class="actions">
          <el-tooltip
            v-if="!capabilities?.aiEnabled"
            content="打开系统设置并配置 AI Provider"
          >
            <el-button circle plain type="primary" @click="openAiSettings">
              <IconifyIconOnline icon="ri:settings-4-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <div class="chips">
        <span
          v-for="item in aiDiagnosticChips"
          :key="item.label"
          class="chip ai-status__chip"
          :class="`ai-status__chip--${item.tone}`"
        >
          {{ item.label }} · {{ item.value }}
        </span>
      </div>
    </article>

    <article class="manual-project-section">
      <div class="panel-head manual-project-section__head">
        <div>
          <h3>手工项目主档</h3>
          <p>
            直接按服务器路径、日志路径和启停脚本维护项目，不再强依赖软件安装实例。
          </p>
        </div>
        <div class="actions">
          <span class="chip">项目主档 {{ manualProjectCards.length }}</span>
          <el-tooltip content="新增项目主档">
            <el-button circle plain type="primary" @click="openCreateProject">
              <IconifyIconOnline icon="ri:add-line" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <ScTable
        v-if="manualProjectCards.length"
        class="manual-project-table"
        :data="manualProjectCards"
        layout="card"
        card-layout="default"
        card-theme="default"
        :search="false"
        :hide-pagination="true"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :col-size="3"
        :page-size="Math.max(manualProjectCards.length, 1)"
        row-key="projectId"
        :row-click="handleManualProjectRowClick"
      >
        <template #default="{ row }">
          <article
            class="project-card-shell"
            :class="row.tone"
            role="button"
            tabindex="0"
            @click="openProjectDetail(row.service)"
            @keydown.enter.prevent="openProjectDetail(row.service)"
          >
            <header class="project-card-shell__head">
              <div class="project-card-shell__title">
                <strong>{{ row.service.serviceName || "未命名项目" }}</strong>
                <p>{{ row.typeLabel }} · {{ row.manageMode }}</p>
              </div>
              <div class="project-card-shell__status">
                <el-tag
                  effect="light"
                  round
                  :type="row.issue ? 'danger' : row.runtimeLabel === '运行中' ? 'success' : 'info'"
                >
                  {{ row.runtimeLabel }}
                </el-tag>
              </div>
            </header>

            <div class="project-card-shell__meta">
              <el-tag effect="plain" round>{{ row.pathLabel }}</el-tag>
              <el-tag effect="plain" round>SPI {{ row.executionProviderLabel }}</el-tag>
              <el-tag effect="plain" round>日志 {{ row.logPathCount }} 条</el-tag>
            </div>

            <p class="project-card-shell__summary">{{ row.summaryText }}</p>

            <section
              v-if="row.service.latestAiReason || row.service.latestAiSolution"
              class="project-card-shell__ai"
            >
              <strong>AI 诊断</strong>
              <p>{{ row.service.latestAiReason || "-" }}</p>
              <small>{{ row.service.latestAiSolution || "-" }}</small>
            </section>

            <footer class="project-card-shell__actions">
              <el-tooltip content="启动项目">
                <el-button
                  circle
                  plain
                  type="success"
                  :loading="projectActionKey === `start:${row.service.serverServiceId}`"
                  @click.stop="runProjectAction(row.service, 'start')"
                >
                  <IconifyIconOnline icon="ri:play-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="停止项目">
                <el-button
                  circle
                  plain
                  type="warning"
                  :loading="projectActionKey === `stop:${row.service.serverServiceId}`"
                  @click.stop="runProjectAction(row.service, 'stop')"
                >
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="重启项目">
                <el-button
                  circle
                  plain
                  :loading="projectActionKey === `restart:${row.service.serverServiceId}`"
                  @click.stop="runProjectAction(row.service, 'restart')"
                >
                  <IconifyIconOnline icon="ri:restart-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="状态检查">
                <el-button
                  circle
                  plain
                  :loading="projectActionKey === `status:${row.service.serverServiceId}`"
                  @click.stop="runProjectAction(row.service, 'status')"
                >
                  <IconifyIconOnline icon="ri:pulse-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="脚本编辑">
                <el-button
                  circle
                  plain
                  @click.stop="openStandaloneScriptDialog(row.service)"
                >
                  <IconifyIconOnline icon="ri:file-code-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="项目配置">
                <el-button
                  circle
                  plain
                  @click.stop="openProjectEditor(row.service)"
                >
                  <IconifyIconOnline icon="ri:settings-4-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="详情">
                <el-button
                  circle
                  plain
                  @click.stop="openProjectDetail(row.service)"
                >
                  <IconifyIconOnline icon="ri:article-line" />
                </el-button>
              </el-tooltip>
            </footer>
          </article>
        </template>
      </ScTable>
      <el-empty
        v-else
        description="当前没有手工项目主档，可以直接在这里创建"
      />
    </article>

    <div class="panel-head project-installation-head">
      <div>
        <h3>安装项目实例</h3>
        <p>保留 soft 安装实例的运行、配置快照、日志追尾和回滚能力。</p>
      </div>
      <div class="actions">
        <span class="chip">安装实例 {{ filteredCards.length }}</span>
      </div>
    </div>

    <div v-loading="loading" class="grid">
      <article
        v-for="item in filteredCards"
        :key="item.installation.softInstallationId"
        class="card"
        :class="item.tone"
        role="button"
        tabindex="0"
        @click="openDetail(item)"
        @keydown.enter.prevent="openDetail(item)"
      >
        <header class="card-head">
          <div>
            <strong>{{ item.installation.installationName }}</strong>
            <p>
              {{ item.typeLabel }} /
              {{ item.installation.serviceName || "未绑定服务" }}
            </p>
          </div>
          <span class="chip">{{ item.runtimeLabel }}</span>
        </header>
        <div class="chips">
          <span class="chip">{{
            item.installation.installPath || "未配置安装目录"
          }}</span>
          <span class="chip">{{
            item.detail?.target?.targetType || "LOCAL"
          }}</span>
          <span class="chip">SPI {{ item.executionProviderLabel }}</span>
          <span class="chip"
            >快照 {{ item.detail?.snapshots?.length || 0 }}</span
          >
        </div>
        <p class="message">
          {{
            item.serverService?.latestAiReason ||
            item.installation.lastOperationMessage ||
            "支持启停、重启、状态、日志追尾和回滚"
          }}
        </p>
        <div
          v-if="
            item.serverService?.latestAiReason ||
            item.serverService?.latestAiSolution
          "
          class="ai-box"
        >
          <strong>AI 诊断</strong>
          <p>{{ item.serverService?.latestAiReason || "-" }}</p>
          <small>{{ item.serverService?.latestAiSolution || "-" }}</small>
        </div>
        <div class="actions">
          <el-button
            circle
            plain
            type="success"
            :loading="
              actionKey === `start:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'start')
            "
            ><IconifyIconOnline icon="ri:play-circle-line"
          /></el-button>
          <el-button
            circle
            plain
            type="warning"
            :loading="
              actionKey === `stop:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'stop')
            "
            ><IconifyIconOnline icon="ri:stop-circle-line"
          /></el-button>
          <el-button
            circle
            plain
            :loading="
              actionKey === `restart:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'restart')
            "
            ><IconifyIconOnline icon="ri:restart-line"
          /></el-button>
          <el-button
            circle
            plain
            :loading="
              actionKey === `status:${item.installation.softInstallationId}`
            "
            @click.stop="
              runAction(item.installation.softInstallationId!, 'status')
            "
            ><IconifyIconOnline icon="ri:pulse-line"
          /></el-button>
          <el-button
            circle
            plain
            :disabled="!item.serverService?.serverServiceId"
            @click.stop="openScriptDialog(item)"
            ><IconifyIconOnline icon="ri:file-code-line"
          /></el-button>
          <el-button circle plain @click.stop="openDetail(item)"
            ><IconifyIconOnline icon="ri:article-line"
          /></el-button>
        </div>
      </article>
      <el-empty
        v-if="!loading && !filteredCards.length"
        description="当前服务器还没有可管理的项目实例"
      />
    </div>

    <el-dialog
      v-model="detailVisible"
      width="1120px"
      destroy-on-close
      :title="
        selectedCard
          ? `${selectedCard.installation.installationName} · 项目详情`
          : '项目详情'
      "
      @closed="stopWatch"
    >
      <template v-if="selectedCard">
        <div class="detail-hero">
          <div>
            <h3>{{ selectedCard.installation.installationName }}</h3>
            <p>
              {{ selectedCard.installation.installPath || "未配置安装目录" }}
            </p>
          </div>
          <div class="actions">
            <el-button
              plain
              type="success"
              :loading="
                actionKey ===
                `start:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'start',
                )
              "
              >启动</el-button
            >
            <el-button
              plain
              type="warning"
              :loading="
                actionKey ===
                `stop:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(selectedCard.installation.softInstallationId!, 'stop')
              "
              >停止</el-button
            >
            <el-button
              plain
              :loading="
                actionKey ===
                `restart:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'restart',
                )
              "
              >重启</el-button
            >
            <el-button
              plain
              :loading="
                actionKey ===
                `status:${selectedCard.installation.softInstallationId}`
              "
              @click="
                runAction(
                  selectedCard.installation.softInstallationId!,
                  'status',
                )
              "
              >状态</el-button
            >
            <el-button
              plain
              @click="loadDetail(selectedCard.installation.softInstallationId!)"
              >刷新</el-button
            >
            <el-button
              plain
              :disabled="!selectedCard.serverService?.serverServiceId"
              @click="openScriptDialog(selectedCard)"
              >脚本</el-button
            >
          </div>
        </div>

        <div class="summary">
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('meta')"
            @keydown.enter.prevent="scrollToDetailSection('meta')"
          >
            <small>运行态</small
            ><strong>{{ selectedCard.runtimeLabel }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('meta')"
            @keydown.enter.prevent="scrollToDetailSection('meta')"
          >
            <small>类型</small><strong>{{ selectedCard.typeLabel }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('service')"
            @keydown.enter.prevent="scrollToDetailSection('service')"
          >
            <small>绑定服务</small
            ><strong>{{
              selectedCard.serverService?.serviceName || "未绑定"
            }}</strong>
          </article>
          <article
            class="summary-card summary-card--action"
            role="button"
            tabindex="0"
            @click="scrollToDetailSection('snapshot')"
            @keydown.enter.prevent="scrollToDetailSection('snapshot')"
          >
            <small>配置快照</small
            ><strong>{{ selectedCard.detail?.snapshots?.length || 0 }}</strong>
          </article>
        </div>

        <div class="detail-grid">
          <article ref="metaPanelRef" class="panel">
            <h4>基础信息</h4>
            <dl class="meta">
              <div>
                <dt>目标</dt>
                <dd>{{ selectedCard.detail?.target?.targetName || "-" }}</dd>
              </div>
              <div>
                <dt>类型</dt>
                <dd>{{ selectedCard.detail?.target?.targetType || "-" }}</dd>
              </div>
              <div>
                <dt>版本</dt>
                <dd>{{ selectedCard.detail?.version?.versionName || "-" }}</dd>
              </div>
              <div>
                <dt>服务名</dt>
                <dd>{{ selectedCard.installation.serviceName || "-" }}</dd>
              </div>
              <div>
                <dt>SPI 通道</dt>
                <dd>{{ selectedCard.executionProviderLabel }}</dd>
              </div>
              <div>
                <dt>服务维护</dt>
                <dd>{{ selectedCard.serviceManageMode }}</dd>
              </div>
            </dl>
            <p class="hint">
              {{
                selectedCard.installation.lastOperationMessage ||
                "暂无最近操作说明"
              }}
            </p>
          </article>

          <article ref="progressPanelRef" class="panel">
            <h4>实时进度</h4>
            <el-progress
              :percentage="Number(operationLatest?.progressPercent || 0)"
            />
            <p class="hint">
              {{ operationLatest?.message || "执行操作后会在这里显示实时进度" }}
            </p>
            <div class="chips">
              <span
                v-for="stage in operationStages"
                :key="stage"
                class="chip"
                >{{ stage }}</span
              >
            </div>
          </article>

          <article ref="logPanelRef" class="panel panel-wide">
            <div class="panel-head">
              <h4>实时日志</h4>
              <div class="actions">
                <el-button plain @click="toggleWatch">{{
                  runtimeWatching ? "停止追尾" : "开始追尾"
                }}</el-button>
                <el-button plain @click="refreshLogTail">拉取尾部</el-button>
              </div>
            </div>
            <ScCodeEditor
              :model-value="runtimeLogText"
              :read-only="true"
              height="220px"
              mode="shell"
            />
          </article>

          <article ref="snapshotPanelRef" class="panel">
            <h4>配置快照</h4>
            <div class="list">
              <button
                v-for="snapshot in selectedCard.detail?.snapshots || []"
                :key="snapshot.softConfigSnapshotId"
                type="button"
                class="snapshot"
                @click="rollbackSnapshot(snapshot.softConfigSnapshotId)"
              >
                <strong>{{
                  snapshot.snapshotName ||
                  `快照 #${snapshot.softConfigSnapshotId}`
                }}</strong>
                <span>{{ snapshot.createTime || "-" }}</span>
              </button>
              <el-empty
                v-if="!(selectedCard.detail?.snapshots || []).length"
                description="当前还没有配置快照"
              />
            </div>
          </article>

          <article ref="aiPanelRef" class="panel">
            <h4>AI 失败分析</h4>
            <template
              v-if="
                selectedCard.serverService?.latestAiReason ||
                selectedCard.serverService?.latestAiSolution
              "
            >
              <p class="hint">
                {{ selectedCard.serverService?.latestAiReason || "-" }}
              </p>
              <p class="hint">
                {{ selectedCard.serverService?.latestAiSolution || "-" }}
              </p>
              <div class="chips">
                <span
                  v-if="selectedCard.serverService?.latestKnowledgeId"
                  class="chip"
                  >知识库 #{{
                    selectedCard.serverService?.latestKnowledgeId
                  }}</span
                >
              </div>
            </template>
            <template v-else-if="!capabilities?.aiEnabled">
              <p class="hint">
                {{
                  capabilities?.aiUnavailableReason ||
                  "当前未检测到可用 AI Provider"
                }}
              </p>
              <div class="chips">
                <span
                  v-for="item in aiDiagnosticChips"
                  :key="`detail-${item.label}`"
                  class="chip ai-status__chip"
                  :class="`ai-status__chip--${item.tone}`"
                >
                  {{ item.label }} · {{ item.value }}
                </span>
              </div>
              <div class="actions">
                <el-tooltip content="打开系统设置并配置 AI Provider">
                  <el-button
                    circle
                    plain
                    type="primary"
                    @click="openAiSettings"
                  >
                    <IconifyIconOnline icon="ri:settings-4-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
            <el-empty v-else description="当前没有 AI 失败诊断记录" />
          </article>

          <article ref="servicePanelRef" class="panel panel-wide">
            <div class="panel-head">
              <h4>服务操作记录</h4>
              <el-button
                plain
                :disabled="!selectedCard.serverService?.serverServiceId"
                @click="
                  selectedCard.serverService?.serverServiceId &&
                  loadServiceLogs(selectedCard.serverService.serverServiceId)
                "
                >刷新</el-button
              >
            </div>
            <div class="list">
              <article
                v-for="item in selectedServiceLogs"
                :key="item.serverServiceOperationLogId"
                class="op"
              >
                <header>
                  <strong>{{ item.operationType || "OPERATION" }}</strong
                  ><span>{{ item.createTime || "-" }}</span>
                </header>
                <p>{{ item.operationMessage || "-" }}</p>
                <small>{{
                  item.aiReason ||
                  item.aiSolution ||
                  (item.expireAt ? `保留到 ${item.expireAt}` : "未写入 AI 分析")
                }}</small>
              </article>
              <el-empty
                v-if="!selectedServiceLogs.length"
                description="当前没有服务操作记录"
              />
            </div>
          </article>
        </div>
      </template>
    </el-dialog>
    <ServerProjectScriptDialog
      v-model="scriptDialogVisible"
      :service="scriptDialogService"
      :saving="scriptDialogSaving"
      :ai-enabled="capabilities?.aiEnabled"
      :ai-unavailable-reason="capabilities?.aiUnavailableReason"
      :execution-provider="scriptDialogExecutionProvider"
      :host-context="scriptDialogHostContext"
      @submit="saveProjectScripts"
    />
    <ServerServiceEditorDialog
      v-model="projectEditorVisible"
      :form="projectForm"
      :saving="projectEditorSaving"
      :generating="projectEditorGenerating"
      :ai-enabled="capabilities?.aiEnabled"
      :ai-unavailable-reason="capabilities?.aiUnavailableReason"
      :execution-provider="projectExecutionProvider"
      :service-type-options="serviceTypeOptions"
      :template-options="serviceTemplateOptions"
      @update:form="projectForm = $event"
      @submit="submitProjectEditor"
      @generate-ai-draft="generateProjectAiDraft"
      @apply-template="applyProjectTemplate"
    />
    <ServerServiceDetailDialog
      v-model="projectDetailVisible"
      :service="selectedStandaloneService"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { taskCenterProvider } from "@layout/default";
import { emitter } from "@repo/core";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import ServerProjectScriptDialog from "../components/ServerProjectScriptDialog.vue";
import ServerServiceDetailDialog from "../components/ServerServiceDetailDialog.vue";
import ServerServiceEditorDialog from "../components/ServerServiceEditorDialog.vue";
import { useServerAiTaskStream } from "../composables/useServerAiTaskStream";
import {
  createServerService,
  generateServerServiceAiDraft,
  getServerCapabilities,
  getServerServiceByInstallation,
  getServerServiceOperationLogs,
  getServerServiceStatus,
  listServerServices,
  listServerSoftInstallations,
  listSoftBindingTargets,
  restartServerService,
  startServerService,
  stopServerService,
  updateServerService,
  type ServerAiTaskPayload,
  type ServerAiTaskTicket,
  type ServerCapabilityView,
  type ServerService,
  type ServerServiceOperationLog,
  type ServerSoftBindingTarget,
  type ServerSoftInstallation,
} from "../api";
import {
  getSoftInstallationDetail,
  getSoftLogs,
  getSoftServiceStatus,
  listSoftOperationLogs,
  restartSoftService,
  rollbackSoftConfigSnapshot,
  startSoftLogWatch,
  startSoftService,
  stopSoftLogWatch,
  stopSoftService,
  type SoftInstallationDetail,
  type SoftLogWatchTicket,
  type SoftOperationLog,
  type SoftOperationTicket,
} from "../../../soft/src/api";
import { useSoftOperationStream } from "../../../soft/src/composables/useSoftOperationStream";
import { useSoftRuntimeLogStream } from "../../../soft/src/composables/useSoftRuntimeLogStream";

type Filter = "all" | "running" | "issue" | "ai";
type Action = "start" | "stop" | "restart" | "status";
type AiDiagnosticChipTone = "success" | "primary" | "warning" | "danger";
type AiDiagnosticChip = {
  label: string;
  value: string;
  tone: AiDiagnosticChipTone;
};
type ProjectServiceAction = "start" | "stop" | "restart" | "status";
type Card = {
  installation: ServerSoftInstallation;
  detail: SoftInstallationDetail | null;
  target: ServerSoftBindingTarget | null;
  serverService: ServerService | null;
  typeLabel: string;
  runtimeLabel: string;
  tone: string;
  issue: boolean;
  executionProviderLabel: string;
  serviceManageMode: string;
};
type ManualProjectCard = {
  projectId: number | string;
  service: ServerService;
  typeLabel: string;
  runtimeLabel: string;
  tone: string;
  issue: boolean;
  executionProviderLabel: string;
  manageMode: string;
  logPathCount: number;
  pathLabel: string;
  summaryText: string;
};
type ProjectFocusEntry =
  | {
      kind: "installation";
      card: Card;
      timestamp: number;
    }
  | {
      kind: "manual";
      card: ManualProjectCard;
      timestamp: number;
    };

const serviceTypeOptions = [
  { label: "Systemd 服务", value: "SYSTEMD_SERVICE" },
  { label: "Windows 服务", value: "WINDOWS_SERVICE" },
  { label: "Spring Boot", value: "SPRING_BOOT_APP" },
  { label: "Nginx", value: "NGINX" },
  { label: "Docker 容器", value: "DOCKER_CONTAINER" },
];

const serviceTemplateOptions = [
  { key: "systemd", label: "Systemd" },
  { key: "windows", label: "Windows 服务" },
  { key: "springboot", label: "Spring Boot" },
  { key: "nginx", label: "Nginx" },
  { key: "docker", label: "Docker" },
];

const route = useRoute();
const serverId = computed(() => {
  const value = Number(route.query.serverId || 0);
  return Number.isFinite(value) && value > 0 ? value : null;
});
const loading = ref(false);
const actionKey = ref("");
const keyword = ref("");
const filter = ref<Filter>("all");
const capabilities = ref<ServerCapabilityView | null>(null);
const targets = ref<ServerSoftBindingTarget[]>([]);
const installations = ref<ServerSoftInstallation[]>([]);
const services = ref<ServerService[]>([]);
const operationLogs = ref<SoftOperationLog[]>([]);
const detailMap = ref<Record<number, SoftInstallationDetail>>({});
const serviceMap = ref<Record<number, ServerService | null>>({});
const serviceLogMap = ref<Record<number, ServerServiceOperationLog[]>>({});
const detailVisible = ref(false);
const scriptDialogVisible = ref(false);
const scriptDialogSaving = ref(false);
const scriptDialogService = ref<ServerService | null>(null);
const scriptDialogExecutionProvider = ref("");
const scriptDialogHostContext = ref<Record<string, unknown> | null>(null);
const projectEditorVisible = ref(false);
const projectEditorSaving = ref(false);
const projectEditorGenerating = ref(false);
const projectDetailVisible = ref(false);
const projectActionKey = ref("");
const selectedStandaloneService = ref<ServerService | null>(null);
const selectedInstallationId = ref<number | null>(null);
const projectForm = ref<ServerService>({
  serverId: undefined,
  serverName: "",
  serviceName: "",
  serviceType: "SPRING_BOOT_APP",
  installPath: "",
  runtimeStatus: "UNKNOWN",
  enabled: true,
  description: "",
  configPathsJson: "",
  logPathsJson: "",
  configTemplate: "",
  initScript: "",
  installScript: "",
  uninstallScript: "",
  detectScript: "",
  registerScript: "",
  unregisterScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  metadataJson: "",
});
const metaPanelRef = ref<HTMLElement | null>(null);
const progressPanelRef = ref<HTMLElement | null>(null);
const logPanelRef = ref<HTMLElement | null>(null);
const snapshotPanelRef = ref<HTMLElement | null>(null);
const aiPanelRef = ref<HTMLElement | null>(null);
const servicePanelRef = ref<HTMLElement | null>(null);
const runtimeWatchTicket = ref<SoftLogWatchTicket | null>(null);
const runtimeWatching = ref(false);
const runtimeLines = ref<string[]>([]);
let runtimeLogPollTimer: number | undefined;
const {
  latest: operationLatestRef,
  stages: operationStagesRef,
  connect: connectOperation,
  disconnect: disconnectOperation,
} = useSoftOperationStream();
const {
  latest: runtimeLatestRef,
  connect: connectRuntime,
  disconnect: disconnectRuntime,
} = useSoftRuntimeLogStream();
const aiTaskStream = useServerAiTaskStream();

const aiText = computed(() =>
  capabilities.value?.aiEnabled
    ? [
        capabilities.value?.aiProvider || capabilities.value?.aiDefaultProvider,
        capabilities.value?.aiProviderCount
          ? `${capabilities.value.aiProviderCount}P`
          : "",
      ]
        .filter(Boolean)
        .join(" · ") || "已激活"
    : [
        capabilities.value?.aiUnavailableReason || "未激活",
        capabilities.value?.aiConfigReady ? "配置就绪" : "配置未就绪",
        capabilities.value?.aiChatClientReady
          ? "ChatClient 已装配"
          : "ChatClient 未装配",
      ]
        .filter(Boolean)
        .join(" · "),
);
const buildAiDiagnosticChip = (
  label: string,
  value: unknown,
  tone: AiDiagnosticChipTone,
) => {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  return {
    label,
    value: text,
    tone,
  } satisfies AiDiagnosticChip;
};
const aiDiagnosticChips = computed(() =>
  [
    buildAiDiagnosticChip(
      "默认 Provider",
      capabilities.value?.aiDefaultProvider || capabilities.value?.aiProvider,
      "primary",
    ),
    buildAiDiagnosticChip(
      "当前 Provider",
      capabilities.value?.aiProvider,
      capabilities.value?.aiEnabled ? "success" : "warning",
    ),
    buildAiDiagnosticChip(
      "Provider 数量",
      capabilities.value?.aiProviderCount,
      Number(capabilities.value?.aiProviderCount || 0) > 0
        ? "success"
        : "warning",
    ),
    buildAiDiagnosticChip(
      "配置状态",
      capabilities.value?.aiConfigReady ? "已就绪" : "未就绪",
      capabilities.value?.aiConfigReady ? "success" : "warning",
    ),
    buildAiDiagnosticChip(
      "ChatClient",
      capabilities.value?.aiChatClientReady ? "已装配" : "未装配",
      capabilities.value?.aiChatClientReady ? "success" : "danger",
    ),
    buildAiDiagnosticChip(
      "原因代码",
      capabilities.value?.aiUnavailableCode,
      "danger",
    ),
    buildAiDiagnosticChip(
      "Provider 解析",
      capabilities.value?.aiProviderResolvedFrom,
      "primary",
    ),
  ].filter((item): item is AiDiagnosticChip => Boolean(item)),
);
const operationLatest = computed(() => operationLatestRef.value);
const operationStages = computed(() => operationStagesRef.value);
const runtimeLogText = computed(() => runtimeLines.value.join("\n"));
const latestOpTime = computed(() => {
  const timestamps = [
    operationLogs.value[0]?.startTime,
    ...services.value
      .map((item) => item.lastOperationTime || item.createTime)
      .filter(Boolean),
  ]
    .map((item) => Date.parse(String(item || "")))
    .filter((item) => Number.isFinite(item))
    .sort((left, right) => right - left);
  return timestamps.length ? new Date(timestamps[0]).toLocaleString("zh-CN") : "";
});

const parseMetadata = (value?: string | null) => {
  try {
    return value ? (JSON.parse(value) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
};

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

const manageModeLabel = (value?: unknown, detected?: unknown) => {
  if (String(value || "").trim()) {
    return String(value);
  }
  return detected ? "自动检测" : "手工维护";
};

const runtimeMeta = (value?: string | null, latestSuccess?: boolean | null) => {
  const runtimeStatus = String(value || "UNKNOWN").toUpperCase();
  const runtimeLabel =
    runtimeStatus === "RUNNING"
      ? "运行中"
      : runtimeStatus === "STOPPED"
        ? "已停止"
        : ["FAILED", "ERROR"].includes(runtimeStatus)
          ? "异常"
          : runtimeStatus;
  const issue =
    ["FAILED", "ERROR", "STOPPED"].includes(runtimeStatus) ||
    latestSuccess === false;
  return {
    runtimeStatus,
    runtimeLabel,
    issue,
    tone:
      runtimeLabel === "运行中"
        ? "is-success"
        : issue
          ? "is-danger"
          : "is-muted",
  };
};

const parseJsonArray = (value?: string | null) => {
  if (!value?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
  } catch {
    return value
      .split(/[\r\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const isManualProjectService = (service?: ServerService | null) => {
  if (!service || service.softInstallationId) {
    return false;
  }
  const metadata = parseMetadata(service.metadataJson);
  const manageMode = String(metadata.manageMode || "").trim().toUpperCase();
  if (metadata.projectManaged === true || manageMode === "PROJECT_MANUAL") {
    return true;
  }
  if (metadata.detected === true || manageMode === "SPI") {
    return false;
  }
  return Boolean(service.installPath?.trim());
};

const createEmptyProjectForm = (): ServerService => ({
  serverId: serverId.value || undefined,
  serverName: String(route.query.serverName || ""),
  serviceName: "",
  serviceType: "SPRING_BOOT_APP",
  installPath: "/opt/app",
  runtimeStatus: "UNKNOWN",
  enabled: true,
  description: "",
  configPathsJson: "[]",
  logPathsJson: "[]",
  configTemplate: "",
  initScript: "",
  installScript: "",
  uninstallScript: "",
  detectScript: "",
  registerScript: "",
  unregisterScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  metadataJson: JSON.stringify(
    {
      manageMode: "PROJECT_MANUAL",
      projectManaged: true,
    },
    null,
    2,
  ),
});

const patchProjectForm = (value?: ServerService | null) => {
  projectForm.value = {
    ...createEmptyProjectForm(),
    ...(value || {}),
  };
};

const buildScriptHostContext = (card?: Card | null) => ({
  serverId: serverId.value,
  serverName: route.query.serverName || card?.target?.targetName || "",
  targetType: card?.detail?.target?.targetType || card?.target?.targetType || "",
  osType: card?.detail?.target?.osType || card?.target?.osType || "",
  architecture: card?.detail?.target?.architecture || card?.target?.architecture || "",
  host: card?.detail?.target?.host || card?.target?.host || "",
  port: card?.detail?.target?.port || card?.target?.port || "",
  username: card?.detail?.target?.username || card?.target?.username || "",
  baseDirectory:
    card?.detail?.target?.baseDirectory || card?.target?.baseDirectory || "",
});

const currentTarget = computed(
  () =>
    targets.value.find((item) =>
      visibleTargetIds.value.has(Number(item.softTargetId || 0)),
    ) || null,
);

const buildStandaloneHostContext = (service?: ServerService | null) => ({
  serverId: serverId.value,
  serverName:
    String(route.query.serverName || "") ||
    currentTarget.value?.targetName ||
    service?.serverName ||
    "",
  targetType: currentTarget.value?.targetType || "",
  osType: currentTarget.value?.osType || "",
  architecture: currentTarget.value?.architecture || "",
  host: currentTarget.value?.host || service?.host || "",
  port: currentTarget.value?.port || "",
  username: currentTarget.value?.username || "",
  baseDirectory: currentTarget.value?.baseDirectory || "",
});
const visibleTargetIds = computed(
  () =>
    new Set(
      targets.value
        .filter((item) => {
          if (!serverId.value) return true;
          const metadata = parseMetadata(item.metadataJson);
          return (
            Number(
              metadata.serverId ??
                metadata.monitorServerId ??
                metadata.hostId ??
                0,
            ) === serverId.value ||
            item.targetCode === `server-${serverId.value}`
          );
        })
        .map((item) => item.softTargetId)
        .filter((item): item is number => Number.isFinite(Number(item))),
    ),
);

const cards = computed<Card[]>(() =>
  installations.value
    .filter((item) =>
      visibleTargetIds.value.has(Number(item.softTargetId || 0)),
    )
    .map((installation) => {
      const detail =
        detailMap.value[Number(installation.softInstallationId || 0)] || null;
      const serverService =
        serviceMap.value[Number(installation.softInstallationId || 0)] || null;
      const meta = runtimeMeta(
        serverService?.runtimeStatus ||
          installation.runtimeStatus ||
          installation.installStatus,
        serverService?.latestOperationSuccess,
      );
      const packageCode = String(
        detail?.package?.packageCode || "",
      ).toLowerCase();
      const serviceMetadata = parseMetadata(serverService?.metadataJson);
      return {
        installation,
        detail,
        target:
          targets.value.find(
            (item) => item.softTargetId === installation.softTargetId,
          ) || null,
        serverService,
        typeLabel: packageCode.includes("nginx")
          ? "Nginx / 静态页"
          : packageCode.includes("spring")
            ? "Spring Boot"
            : "资源分离 / 通用项目",
        runtimeLabel: meta.runtimeLabel,
        tone: meta.tone,
        issue: meta.issue,
        executionProviderLabel: providerLabel(
          serviceMetadata.executionProvider ||
            serviceMetadata.spiChannel ||
            detail?.target?.targetType,
        ),
        serviceManageMode: manageModeLabel(
          serviceMetadata.manageMode,
          serviceMetadata.detected,
        ),
      };
    }),
);

const manualProjectCards = computed<ManualProjectCard[]>(() =>
  services.value
    .filter((item) => isManualProjectService(item))
    .filter(
      (item) =>
        !serverId.value || Number(item.serverId || 0) === serverId.value,
    )
    .filter((item) => {
      if (filter.value === "running" && item.runtimeStatus !== "RUNNING") {
        return false;
      }
      if (
        filter.value === "issue" &&
        item.latestOperationSuccess !== false &&
        !["ERROR", "FAILED", "STOPPED"].includes(
          String(item.runtimeStatus || "").toUpperCase(),
        )
      ) {
        return false;
      }
      if (
        filter.value === "ai" &&
        !(item.latestAiReason || item.latestAiSolution)
      ) {
        return false;
      }
      const text = keyword.value.trim().toLowerCase();
      if (!text) {
        return true;
      }
      return [
        item.serviceName,
        item.serviceType,
        item.installPath,
        item.description,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(text));
    })
    .map((service) => {
      const metadata = parseMetadata(service.metadataJson);
      const meta = runtimeMeta(service.runtimeStatus, service.latestOperationSuccess);
      const serviceType = String(service.serviceType || "").toLowerCase();
      return {
        projectId:
          service.serverServiceId ||
          service.serviceCode ||
          `${service.serviceName || "project"}-${service.installPath || "path"}`,
        service,
        typeLabel: serviceType.includes("nginx")
          ? "Nginx / 静态页"
          : serviceType.includes("spring")
            ? "Spring Boot / 单体"
            : serviceType.includes("docker")
              ? "Docker / 容器"
              : "手工项目 / 通用脚本",
        runtimeLabel: meta.runtimeLabel,
        tone: meta.tone,
        issue: meta.issue,
        executionProviderLabel: providerLabel(
          metadata.executionProvider ||
            metadata.spiChannel ||
            currentTarget.value?.targetType,
        ),
        manageMode: manageModeLabel(
          metadata.manageMode || "PROJECT_MANUAL",
          metadata.detected,
        ),
        logPathCount: parseJsonArray(service.logPathsJson).length,
        pathLabel: service.installPath || "未配置项目目录",
        summaryText:
          service.latestAiReason ||
          service.lastOperationMessage ||
          service.description ||
          "支持脚本化启动、停止、重启、状态检查、AI 草稿和日志维护。",
      };
    }),
);

const projectFocusEntries = computed<ProjectFocusEntry[]>(() => {
  const installationEntries = cards.value.map((card) => ({
    kind: "installation" as const,
    card,
    timestamp: Date.parse(
      String(
        card.installation.lastOperationTime || card.installation.updateTime || "",
      ),
    ),
  }));
  const manualEntries = manualProjectCards.value.map((card) => ({
    kind: "manual" as const,
    card,
    timestamp: Date.parse(
      String(
        card.service.lastOperationTime ||
          card.service.updateTime ||
          card.service.createTime ||
          "",
      ),
    ),
  }));
  return [...installationEntries, ...manualEntries]
    .map((item) => ({
      ...item,
      timestamp: Number.isFinite(item.timestamp) ? item.timestamp : 0,
    }))
    .sort((left, right) => right.timestamp - left.timestamp);
});

const latestOperationCard = computed(() => projectFocusEntries.value[0] || null);

const filteredCards = computed(() =>
  cards.value.filter((item) => {
    if (filter.value === "running" && item.runtimeLabel !== "运行中")
      return false;
    if (filter.value === "issue" && !item.issue) return false;
    if (
      filter.value === "ai" &&
      !(
        item.serverService?.latestAiReason ||
        item.serverService?.latestAiSolution
      )
    )
      return false;
    const text = keyword.value.trim().toLowerCase();
    if (!text) return true;
    return [
      item.installation.installationName,
      item.installation.installPath,
      item.installation.serviceName,
      item.typeLabel,
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(text));
  }),
);
const selectedCard = computed(
  () =>
    cards.value.find(
      (item) =>
        item.installation.softInstallationId === selectedInstallationId.value,
    ) || null,
);
const selectedServiceLogs = computed(() =>
  selectedInstallationId.value
    ? serviceLogMap.value[selectedInstallationId.value] || []
    : [],
);
const totalProjectCount = computed(
  () => cards.value.length + manualProjectCards.value.length,
);
const runningCount = computed(
  () =>
    cards.value.filter((item) => item.runtimeLabel === "运行中").length +
    manualProjectCards.value.filter((item) => item.runtimeLabel === "运行中")
      .length,
);
const issueCount = computed(
  () =>
    cards.value.filter((item) => item.issue).length +
    manualProjectCards.value.filter((item) => item.issue).length,
);
const scrollToElement = async (target?: HTMLElement | null) => {
  await nextTick();
  target?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};
const scrollToDetailSection = async (
  section: "meta" | "progress" | "log" | "snapshot" | "ai" | "service",
) => {
  const element =
    section === "meta"
      ? metaPanelRef.value
      : section === "progress"
        ? progressPanelRef.value
        : section === "log"
          ? logPanelRef.value
          : section === "snapshot"
            ? snapshotPanelRef.value
            : section === "ai"
              ? aiPanelRef.value
              : servicePanelRef.value;
  await scrollToElement(element);
};
const focusSummary = async (target: "all" | "running" | "issue" | "latest") => {
  if (target === "all") {
    filter.value = "all";
    keyword.value = "";
    if (projectFocusEntries.value.length === 1) {
      const [entry] = projectFocusEntries.value;
      if (entry?.kind === "manual") {
        openProjectDetail(entry.card.service);
      } else if (entry?.kind === "installation") {
        await openDetail(entry.card);
      }
    }
    return;
  }
  if (target === "running") {
    filter.value = "running";
    keyword.value = "";
    if (runningCount.value === 1) {
      const nextEntry = projectFocusEntries.value.find((item) =>
        item.kind === "manual"
          ? item.card.runtimeLabel === "运行中"
          : item.card.runtimeLabel === "运行中",
      );
      if (nextEntry?.kind === "manual") {
        openProjectDetail(nextEntry.card.service);
      } else if (nextEntry?.kind === "installation") {
        await openDetail(nextEntry.card);
      }
    }
    return;
  }
  if (target === "issue") {
    filter.value = "issue";
    keyword.value = "";
    if (issueCount.value === 1) {
      const nextEntry = projectFocusEntries.value.find((item) =>
        item.kind === "manual" ? item.card.issue : item.card.issue,
      );
      if (nextEntry?.kind === "manual") {
        openProjectDetail(nextEntry.card.service);
      } else if (nextEntry?.kind === "installation") {
        await openDetail(nextEntry.card);
      }
    }
    return;
  }
  if (latestOperationCard.value) {
    if (latestOperationCard.value.kind === "manual") {
      openProjectDetail(latestOperationCard.value.card.service);
    } else {
      await openDetail(latestOperationCard.value.card);
    }
  }
};
const openAiSettings = () => {
  emitter.emit("openPanel");
};

const projectActionLabelMap: Record<ProjectServiceAction, string> = {
  start: "启动项目",
  stop: "停止项目",
  restart: "重启项目",
  status: "状态检查",
};

const installationActionLabelMap: Record<Action, string> = {
  start: "启动安装项目",
  stop: "停止安装项目",
  restart: "重启安装项目",
  status: "安装项目状态检查",
};

const findProjectServiceById = (serverServiceId?: number | null) =>
  services.value.find(
    (item) =>
      Number(item.serverServiceId || 0) === Number(serverServiceId || 0),
  ) ||
  (Number(selectedStandaloneService.value?.serverServiceId || 0) ===
  Number(serverServiceId || 0)
    ? selectedStandaloneService.value
    : null);

const mergeProjectAiDraft = (draft?: Partial<ServerService> | null) => {
  if (!draft) {
    return;
  }
  const fields: Array<keyof ServerService> = [
    "description",
    "configPathsJson",
    "logPathsJson",
    "configTemplate",
    "initScript",
    "installScript",
    "uninstallScript",
    "detectScript",
    "registerScript",
    "unregisterScript",
    "startScript",
    "stopScript",
    "restartScript",
    "statusScript",
  ];
  const next = { ...projectForm.value };
  fields.forEach((field) => {
    const value = draft[field];
    if (typeof value === "string" && value.trim()) {
      next[field] = value;
    }
  });
  if (typeof draft.latestAiProvider === "string" && draft.latestAiProvider) {
    next.latestAiProvider = draft.latestAiProvider;
  }
  if (typeof draft.latestAiModel === "string" && draft.latestAiModel) {
    next.latestAiModel = draft.latestAiModel;
  }
  if (typeof draft.latestAiSolution === "string" && draft.latestAiSolution) {
    next.latestAiSolution = draft.latestAiSolution;
  }
  projectForm.value = next;
};

const resolveProjectAiTaskTitle = (payload: ServerAiTaskPayload) => {
  const service = findProjectServiceById(payload.serverServiceId);
  if (payload.taskType === "GENERATE_DRAFT") {
    return `AI 项目草稿 · ${
      service?.serviceName || payload.serverServiceId || "未命名项目"
    }`;
  }
  if (payload.taskType === "DIAGNOSE_FAILURE") {
    return `AI 项目诊断 · ${
      service?.serviceName || payload.serverServiceId || "未命名项目"
    }`;
  }
  return "AI 项目任务";
};

const syncProjectAiTaskCenter = (payload: ServerAiTaskPayload) => {
  if (!payload.taskId) {
    return;
  }
  const title = resolveProjectAiTaskTitle(payload);
  const taskMessage =
    payload.message ||
    (payload.status === "COMPLETED"
      ? "AI 项目任务已完成"
      : payload.status === "FAILED"
        ? "AI 项目任务失败"
        : "AI 项目任务执行中");
  if (payload.status === "COMPLETED") {
    taskCenterProvider.finishTask(payload.taskId, {
      title,
      progress: 100,
      message: taskMessage,
    });
    return;
  }
  if (payload.status === "FAILED") {
    taskCenterProvider.failTask(payload.taskId, {
      title,
      progress: 100,
      message: taskMessage,
    });
    return;
  }
  taskCenterProvider.updateTask(payload.taskId, {
    title,
    mode: "stream",
    status: "running",
    progress: 45,
    message: taskMessage,
  });
};

const applyProjectAiTaskPayload = async (payload?: ServerAiTaskPayload | null) => {
  if (!payload?.taskId) {
    return;
  }
  syncProjectAiTaskCenter(payload);
  const isEditingCurrentProject =
    Number(projectForm.value.serverServiceId || 0) ===
    Number(payload.serverServiceId || 0);
  if (payload.taskType === "GENERATE_DRAFT") {
    if (payload.status === "RUNNING" && isEditingCurrentProject) {
      projectEditorGenerating.value = true;
      return;
    }
    if (payload.status === "COMPLETED") {
      if (isEditingCurrentProject) {
        mergeProjectAiDraft({
          ...(payload.draft || {}),
          latestAiProvider: payload.aiProvider,
          latestAiModel: payload.aiModel,
          latestAiSolution: payload.draft?.summary,
        });
        projectEditorGenerating.value = false;
      }
      ElMessage.success(
        payload.message ||
          `AI 项目草稿已生成${payload.aiProvider ? ` · ${payload.aiProvider}` : ""}`,
      );
      await loadPage();
      return;
    }
    if (payload.status === "FAILED") {
      if (isEditingCurrentProject) {
        projectEditorGenerating.value = false;
      }
      ElMessage.error(payload.message || "AI 项目草稿生成失败");
    }
    return;
  }
  if (payload.taskType !== "DIAGNOSE_FAILURE") {
    return;
  }
  if (payload.status === "COMPLETED") {
    ElMessage.success(payload.message || "AI 项目诊断完成");
    await loadPage();
    return;
  }
  if (payload.status === "FAILED") {
    ElMessage.error(payload.message || "AI 项目诊断失败");
  }
};

const mergeLines = (current: string[], incoming: string[]) =>
  [...current, ...incoming.filter(Boolean)]
    .filter((line, index, array) => index === 0 || line !== array[index - 1])
    .slice(-400);
const clearPoller = () => {
  if (runtimeLogPollTimer) {
    window.clearInterval(runtimeLogPollTimer);
    runtimeLogPollTimer = undefined;
  }
};
const refreshLogTail = async () => {
  if (!selectedInstallationId.value) return;
  const result = await getSoftLogs(selectedInstallationId.value, {
    lines: 200,
  }).catch(() => null);
  runtimeLines.value = mergeLines(
    runtimeLines.value,
    result?.data?.lines || [],
  );
};
const stopWatch = async () => {
  try {
    if (selectedInstallationId.value && runtimeWatchTicket.value?.watchId)
      await stopSoftLogWatch(
        selectedInstallationId.value,
        runtimeWatchTicket.value.watchId,
      ).catch(() => false);
  } finally {
    clearPoller();
    runtimeWatchTicket.value = null;
    runtimeWatching.value = false;
    disconnectRuntime();
  }
};
const toggleWatch = async () => {
  if (!selectedInstallationId.value) return;
  if (runtimeWatching.value) {
    await stopWatch();
    return;
  }
  const result = await startSoftLogWatch(selectedInstallationId.value).catch(
    () => null,
  );
  runtimeWatchTicket.value = result?.data || null;
  runtimeWatching.value = Boolean(runtimeWatchTicket.value?.watchId);
  connectRuntime(selectedInstallationId.value);
  await refreshLogTail();
  clearPoller();
  runtimeLogPollTimer = window.setInterval(() => {
    if (detailVisible.value && runtimeWatching.value && !document.hidden)
      void refreshLogTail();
  }, 3000);
};
const loadServiceLogs = async (serverServiceId: number) => {
  const result = await getServerServiceOperationLogs(serverServiceId, 12).catch(
    () => null,
  );
  if (selectedInstallationId.value)
    serviceLogMap.value = {
      ...serviceLogMap.value,
      [selectedInstallationId.value]: result?.data || [],
    };
};
const loadDetail = async (installationId: number) => {
  const [detailResult, serviceResult] = await Promise.all([
    getSoftInstallationDetail(installationId).catch(() => null),
    getServerServiceByInstallation(installationId).catch(() => null),
  ]);
  detailMap.value = {
    ...detailMap.value,
    [installationId]: detailResult?.data || null,
  };
  serviceMap.value = {
    ...serviceMap.value,
    [installationId]: serviceResult?.data || null,
  };
  if (serviceResult?.data?.serverServiceId)
    await loadServiceLogs(serviceResult.data.serverServiceId);
};
const loadPage = async () => {
  loading.value = true;
  try {
    const [
      capabilityResult,
      targetResult,
      installationResult,
      operationResult,
      serviceResult,
    ] = await Promise.all([
      getServerCapabilities().catch(() => null),
      listSoftBindingTargets().catch(() => null),
      listServerSoftInstallations().catch(() => null),
      listSoftOperationLogs().catch(() => null),
      listServerServices(
        serverId.value ? { serverId: serverId.value, enabled: undefined } : {},
      ).catch(() => null),
    ]);
    capabilities.value = capabilityResult?.data || null;
    targets.value = targetResult?.data || [];
    installations.value = installationResult?.data || [];
    operationLogs.value = operationResult?.data || [];
    services.value = serviceResult?.data || [];
    await Promise.all(
      installations.value
        .filter((item) =>
          visibleTargetIds.value.has(Number(item.softTargetId || 0)),
        )
        .map((item) => loadDetail(Number(item.softInstallationId || 0))),
    );
  } finally {
    loading.value = false;
  }
};
const openDetail = async (card: Card) => {
  selectedInstallationId.value =
    Number(card.installation.softInstallationId || 0) || null;
  runtimeLines.value = [];
  disconnectOperation();
  await stopWatch();
  if (selectedInstallationId.value) {
    await loadDetail(selectedInstallationId.value);
    await refreshLogTail();
  }
  detailVisible.value = true;
};

const openCreateProject = () => {
  patchProjectForm(createEmptyProjectForm());
  projectEditorVisible.value = true;
};

const openProjectEditor = (service?: ServerService | null) => {
  patchProjectForm(service || createEmptyProjectForm());
  projectEditorVisible.value = true;
};

const handleManualProjectRowClick = (row?: ManualProjectCard) => {
  if (!row?.service) {
    return;
  }
  openProjectDetail(row.service);
};

const openProjectDetail = (service?: ServerService | null) => {
  selectedStandaloneService.value = service ? { ...service } : null;
  projectDetailVisible.value = Boolean(service);
};

const openStandaloneScriptDialog = (service?: ServerService | null) => {
  if (!service?.serverServiceId) {
    ElMessage.warning("请先保存项目主档后再维护脚本");
    return;
  }
  scriptDialogService.value = {
    ...service,
  };
  scriptDialogExecutionProvider.value = providerLabel(
    parseMetadata(service.metadataJson).executionProvider ||
      parseMetadata(service.metadataJson).spiChannel ||
      currentTarget.value?.targetType,
  );
  scriptDialogHostContext.value = buildStandaloneHostContext(service);
  scriptDialogVisible.value = true;
};

const openScriptDialog = (card?: Card | null) => {
  if (!card?.serverService?.serverServiceId) {
    ElMessage.warning("当前项目还没有绑定可维护的服务主档");
    return;
  }
  selectedInstallationId.value =
    Number(card.installation.softInstallationId || 0) || selectedInstallationId.value;
  scriptDialogService.value = {
    ...card.serverService,
  };
  scriptDialogExecutionProvider.value = card.executionProviderLabel;
  scriptDialogHostContext.value = buildScriptHostContext(card);
  scriptDialogVisible.value = true;
};
const saveProjectScripts = async (service: ServerService) => {
  if (!service.serverServiceId) {
    ElMessage.warning("当前项目缺少可保存的服务主档");
    return;
  }
  scriptDialogSaving.value = true;
  const task = taskCenterProvider.addTask({
    requestId: `project-script-save-${service.serverServiceId}-${Date.now()}`,
    title: `保存项目脚本 · ${service.serviceName || service.serverServiceId}`,
    mode: "progress",
    status: "running",
    progress: 35,
    message: "正在保存项目脚本",
  });
  try {
    const result = await updateServerService(service.serverServiceId, service);
    scriptDialogService.value = result.data || service;
    if (selectedInstallationId.value) {
      serviceMap.value = {
        ...serviceMap.value,
        [selectedInstallationId.value]: result.data || service,
      };
    } else {
      services.value = services.value.map((item) =>
        item.serverServiceId === service.serverServiceId
          ? { ...(result.data || service) }
          : item,
      );
      selectedStandaloneService.value = result.data || service;
    }
    scriptDialogVisible.value = false;
    task.success({
      progress: 100,
      message: "项目脚本已保存到服务主档",
    });
    ElMessage.success("项目脚本已保存到服务主档");
    if (selectedInstallationId.value) {
      await loadDetail(selectedInstallationId.value);
    }
  } catch (error) {
    console.error(error);
    task.error({
      message: "项目脚本保存失败",
    });
    ElMessage.error("项目脚本保存失败");
  } finally {
    scriptDialogSaving.value = false;
  }
};

const runProjectAction = async (
  service: ServerService,
  action: ProjectServiceAction,
) => {
  if (!service.serverServiceId) {
    ElMessage.warning("项目主档尚未保存，无法执行操作");
    return;
  }
  projectActionKey.value = `${action}:${service.serverServiceId}`;
  const task = taskCenterProvider.addTask({
    requestId: `project-action-${action}-${service.serverServiceId}-${Date.now()}`,
    title: `${projectActionLabelMap[action]} · ${
      service.serviceName || service.serverServiceId
    }`,
    mode: "stream",
    status: "running",
    progress: 25,
    message: `正在执行${projectActionLabelMap[action]}`,
  });
  try {
    const executor =
      action === "start"
        ? startServerService
        : action === "stop"
          ? stopServerService
          : action === "restart"
            ? restartServerService
            : getServerServiceStatus;
    const result = await executor(service.serverServiceId);
    const payload = result.data || {};
    const success = payload.success !== false;
    if (payload.taskId) {
      taskCenterProvider.addTask({
        requestId: payload.taskId,
        title: `AI 项目诊断 · ${service.serviceName || service.serverServiceId}`,
        mode: "stream",
        status:
          String(payload.aiTaskStatus || "").toUpperCase() === "FAILED"
            ? "error"
            : String(payload.aiTaskStatus || "").toUpperCase() === "COMPLETED"
              ? "success"
              : "running",
        progress:
          String(payload.aiTaskStatus || "").toUpperCase() === "RUNNING"
            ? 45
            : 100,
        message:
          payload.aiReason || payload.aiSolution
            ? payload.message || "AI 项目诊断结果已返回"
            : "检测到项目异常，正在请求 AI 分析",
      });
    }
    if (success) {
      task.success({
        progress: 100,
        message: payload.message || "项目操作已提交",
      });
      ElMessage.success(payload.message || "项目操作已提交");
    } else {
      task.error({
        progress: 100,
        message: payload.message || "项目操作提交失败",
      });
      ElMessage.error(payload.message || "项目操作提交失败");
    }
    await loadPage();
    selectedStandaloneService.value =
      services.value.find(
        (item) => item.serverServiceId === service.serverServiceId,
      ) || service;
  } catch (error) {
    console.error(error);
    task.error({
      message: "项目操作提交失败",
    });
    ElMessage.error("项目操作提交失败");
  } finally {
    projectActionKey.value = "";
  }
};

const applyProjectTemplate = (key: string) => {
  const next = { ...projectForm.value };
  const installPath = next.installPath?.trim() || "/opt/app";
  const normalizedPath = installPath.replace(/[\\/]+$/, "");
  const serviceName = next.serviceName?.trim() || "demo-project";
  const logPath = `${normalizedPath}/logs/${serviceName}.log`;
  switch (key) {
    case "springboot":
      Object.assign(next, {
        serviceType: "SPRING_BOOT_APP",
        logPathsJson: JSON.stringify([logPath], null, 2),
        startScript:
          next.startScript ||
          `cd ${normalizedPath} && nohup java -jar ${serviceName}.jar >> ${logPath} 2>&1 &`,
        stopScript: next.stopScript || `pkill -f '${serviceName}.jar'`,
        statusScript: next.statusScript || `pgrep -af '${serviceName}.jar'`,
      });
      break;
    case "nginx":
      Object.assign(next, {
        serviceType: "NGINX",
        startScript: next.startScript || "nginx",
        stopScript: next.stopScript || "nginx -s stop",
        restartScript: next.restartScript || "nginx -s reload",
        statusScript: next.statusScript || "pgrep -af nginx",
      });
      break;
    case "docker":
      Object.assign(next, {
        serviceType: "DOCKER_CONTAINER",
        startScript: next.startScript || `docker start ${serviceName}`,
        stopScript: next.stopScript || `docker stop ${serviceName}`,
        restartScript: next.restartScript || `docker restart ${serviceName}`,
        statusScript:
          next.statusScript ||
          `docker inspect -f '{{.State.Status}}' ${serviceName}`,
      });
      break;
    default:
      Object.assign(next, {
        serviceType: "SYSTEMD_SERVICE",
        startScript:
          next.startScript || `systemctl start ${serviceName}.service`,
        stopScript: next.stopScript || `systemctl stop ${serviceName}.service`,
        restartScript:
          next.restartScript || `systemctl restart ${serviceName}.service`,
        statusScript:
          next.statusScript || `systemctl status ${serviceName}.service`,
      });
      break;
  }
  patchProjectForm(next);
};

const submitProjectEditor = async (draft?: ServerService) => {
  const next = {
    ...createEmptyProjectForm(),
    ...projectForm.value,
    ...(draft || {}),
    serverId: serverId.value || projectForm.value.serverId,
    serverName: String(route.query.serverName || projectForm.value.serverName || ""),
  };
  if (!next.serverId) {
    ElMessage.warning("当前没有选中服务器，无法保存项目主档");
    return;
  }
  if (!next.serviceName?.trim()) {
    ElMessage.warning("项目名称不能为空");
    return;
  }
  projectEditorSaving.value = true;
  const task = taskCenterProvider.addTask({
    requestId: `project-editor-${next.serverServiceId || "create"}-${Date.now()}`,
    title: `${next.serverServiceId ? "更新项目主档" : "创建项目主档"} · ${next.serviceName}`,
    mode: "progress",
    status: "running",
    progress: 30,
    message: "正在保存项目主档",
  });
  try {
    const result = next.serverServiceId
      ? await updateServerService(next.serverServiceId, next)
      : await createServerService(next);
    projectForm.value = result.data || next;
    projectEditorVisible.value = false;
    task.success({
      progress: 100,
      message: next.serverServiceId ? "项目主档已更新" : "项目主档已创建",
    });
    ElMessage.success(next.serverServiceId ? "项目主档已更新" : "项目主档已创建");
    await loadPage();
  } catch (error) {
    console.error(error);
    task.error({
      message: "项目主档保存失败",
    });
    ElMessage.error("项目主档保存失败");
  } finally {
    projectEditorSaving.value = false;
  }
};

const generateProjectAiDraft = async (draft?: ServerService) => {
  const next = { ...projectForm.value, ...(draft || {}) };
  if (!next.serverServiceId) {
    ElMessage.warning("请先保存项目主档，再调用 AI 生成脚本草稿");
    return;
  }
  projectEditorGenerating.value = true;
  const requestId = `project-ai-draft-${next.serverServiceId}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `AI 项目草稿 · ${next.serviceName || next.serverServiceId}`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: "正在提交 AI 项目草稿任务",
  });
  try {
    const result = await generateServerServiceAiDraft(next.serverServiceId);
    const ticket = result.data as ServerAiTaskTicket | undefined;
    if (ticket?.taskId && String(ticket.taskId) !== String(requestId)) {
      task.update({
        requestId: ticket.taskId,
        title: `AI 项目草稿 · ${next.serviceName || next.serverServiceId}`,
      });
    }
    if (ticket?.taskId) {
      task.progress(45, {
        message: ticket.message || "AI 项目草稿任务已进入后台执行",
      });
    } else {
      task.success({
        progress: 100,
        message: ticket?.message || "AI 草稿生成任务已提交",
      });
    }
    ElMessage.success(ticket?.message || "AI 草稿生成任务已提交");
  } catch (error) {
    console.error(error);
    task.error({
      message: "AI 项目草稿生成失败",
    });
    ElMessage.error("AI 项目草稿生成失败");
  } finally {
    projectEditorGenerating.value = false;
  }
};

const runAction = async (installationId: number, action: Action) => {
  actionKey.value = `${action}:${installationId}`;
  const task = taskCenterProvider.addTask({
    requestId: `installation-project-${action}-${installationId}-${Date.now()}`,
    title: `${installationActionLabelMap[action]} · ${installationId}`,
    mode: "progress",
    status: "running",
    progress: 25,
    message: `正在执行${installationActionLabelMap[action]}`,
  });
  try {
    const executor =
      action === "start"
        ? startSoftService
        : action === "stop"
          ? stopSoftService
          : action === "restart"
            ? restartSoftService
            : getSoftServiceStatus;
    const result = await executor(installationId);
    if (result.data?.operationId) connectOperation(result.data.operationId);
    task.success({
      progress: 100,
      message: "已提交项目操作",
    });
    ElMessage.success("已提交项目操作");
    await loadPage();
    if (selectedInstallationId.value === installationId)
      await loadDetail(installationId);
  } catch (error) {
    console.error(error);
    task.error({
      message: "项目操作提交失败",
    });
    ElMessage.error("项目操作提交失败");
  } finally {
    actionKey.value = "";
  }
};
const rollbackSnapshot = async (snapshotId?: number) => {
  if (!selectedInstallationId.value || !snapshotId) return;
  await ElMessageBox.confirm("确认回滚到该配置快照？", "回滚配置", {
    type: "warning",
  });
  try {
    const result = await rollbackSoftConfigSnapshot(
      selectedInstallationId.value,
      snapshotId,
    );
    if (result.data?.operationId) connectOperation(result.data.operationId);
    ElMessage.success("已提交配置回滚任务");
    await loadDetail(selectedInstallationId.value);
  } catch (error) {
    console.error(error);
    ElMessage.error("配置回滚失败");
  }
};

watch(
  () => runtimeLatestRef.value?.line,
  (line) => {
    if (line) runtimeLines.value = mergeLines(runtimeLines.value, [line]);
  },
);
watch(
  () => aiTaskStream.tasks.value,
  (value) => {
    Object.values(value || {}).forEach((item) => {
      void applyProjectAiTaskPayload(item);
    });
  },
  { deep: true },
);
watch(
  () => route.query.serverId,
  () => {
    void loadPage();
  },
);
onMounted(() => {
  aiTaskStream.connect();
  void loadPage();
});
onUnmounted(() => {
  aiTaskStream.disconnect();
  disconnectOperation();
  void stopWatch();
});
</script>

<style scoped lang="scss">
.server-project-page {
  display: grid;
  gap: 20px;
  min-height: calc(100vh - 140px);
  padding: 20px;
  color: #1e293b;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 28%),
    radial-gradient(circle at right 20%, rgba(59, 130, 246, 0.1), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, #eef5ff 46%, #f6f9fc 100%);
}
.hero,
.summary-card,
.card,
.panel {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(14px);
}
.hero,
.toolbar,
.card-head,
.actions,
.detail-hero,
.panel-head {
  display: flex;
  align-items: center;
}
.hero,
.toolbar,
.card-head,
.detail-hero,
.panel-head {
  justify-content: space-between;
}
.hero {
  gap: 20px;
  padding: 26px 28px;
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute;
  inset: auto -10% -48% auto;
  width: 320px;
  height: 320px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(14, 165, 233, 0.18), transparent 68%);
  pointer-events: none;
}
.hero h1 {
  margin: 8px 0 10px;
  font-size: 34px;
  letter-spacing: -0.03em;
  color: #0f172a;
}
.hero p,
.chip,
.message,
.hint,
.card p,
.ai-status p,
.ai-box p,
.ai-box small,
.op p,
.op small {
  color: #475569;
}
.hero small {
  color: #0284c7;
  font-weight: 700;
  letter-spacing: 0.16em;
}
.chips,
.actions,
.summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.manual-project-section,
.project-installation-head {
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 20px 38px rgba(15, 23, 42, 0.07);
  backdrop-filter: blur(14px);
}
.chip {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.68);
  font-size: 12px;
  color: #334155;
}
.summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}
.summary-card {
  display: grid;
  gap: 8px;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;
}
.summary-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  background: linear-gradient(180deg, #38bdf8 0%, #2563eb 100%);
}
.summary-card strong {
  font-size: 26px;
  line-height: 1;
  color: #0f172a;
}
.summary-card small {
  color: #64748b;
  font-weight: 600;
}
.toolbar {
  gap: 14px;
  padding: 14px 18px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.06);
}
.toolbar :deep(.el-input) {
  max-width: 380px;
}
.toolbar :deep(.el-radio-group),
.toolbar :deep(.el-input),
.toolbar :deep(.sc-input) {
  min-height: 40px;
}
.manual-project-section {
  display: grid;
  gap: 14px;
  padding: 20px 22px 24px;
}
.manual-project-section__head h3,
.project-installation-head h3 {
  margin: 0 0 6px;
  color: #0f172a;
}
.manual-project-section__head p,
.project-installation-head p {
  margin: 0;
  color: #64748b;
}
.project-installation-head {
  padding: 18px 20px;
  margin-top: 2px;
}
.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  align-content: start;
}
.ai-status {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}
.ai-status.is-inactive {
  border-color: rgba(245, 158, 11, 0.24);
  background: rgba(255, 247, 237, 0.88);
}
.ai-status h3 {
  margin: 0 0 6px;
  color: #0f172a;
}
.ai-status__chip--success {
  background: rgba(220, 252, 231, 0.9);
}
.ai-status__chip--primary {
  background: rgba(224, 242, 254, 0.95);
}
.ai-status__chip--warning {
  background: rgba(254, 243, 199, 0.96);
}
.ai-status__chip--danger {
  background: rgba(254, 226, 226, 0.96);
}
.card {
  display: grid;
  gap: 14px;
  padding: 18px 20px;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow: 0 24px 36px rgba(15, 23, 42, 0.12);
}
.card.is-success {
  box-shadow:
    inset 0 0 0 1px rgba(34, 197, 94, 0.16),
    0 18px 34px rgba(15, 23, 42, 0.08);
}
.card.is-danger {
  box-shadow:
    inset 0 0 0 1px rgba(248, 113, 113, 0.18),
    0 18px 34px rgba(15, 23, 42, 0.08);
}
.card strong,
.detail-hero h3,
.panel h4 {
  color: #0f172a;
}
.ai-box {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 247, 237, 0.9);
  border: 1px solid rgba(251, 191, 36, 0.24);
}
.detail-hero {
  gap: 16px;
  margin-bottom: 14px;
}
.detail-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.panel {
  display: grid;
  gap: 12px;
  padding: 18px 20px;
}
.panel-wide {
  grid-column: 1/-1;
}
.meta {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}
.meta dt {
  color: #64748b;
  font-size: 12px;
}
.manual-project-table :deep(.sc-table__do) {
  display: none;
}
.manual-project-table :deep(.card-view-container) {
  padding: 2px 0 0;
  background: transparent;
}
.manual-project-table :deep(.card-grid) {
  gap: 18px;
}
.manual-project-table :deep(.card-item-wrapper) {
  background: transparent;
}
.manual-project-table :deep(.card-inner.card-default) {
  padding: 0;
  border-radius: 26px;
  border: none;
  background: transparent;
  box-shadow: none;
}
.project-card-shell {
  display: grid;
  gap: 16px;
  min-height: 250px;
  padding: 22px;
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94)),
    linear-gradient(120deg, rgba(14, 165, 233, 0.06), transparent 42%);
  box-shadow: 0 24px 42px rgba(15, 23, 42, 0.1);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}
.project-card-shell:hover {
  transform: translateY(-3px);
  border-color: rgba(59, 130, 246, 0.26);
  box-shadow: 0 28px 48px rgba(15, 23, 42, 0.14);
}
.project-card-shell.is-success {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(240, 253, 244, 0.9)),
    linear-gradient(135deg, rgba(34, 197, 94, 0.08), transparent 42%);
}
.project-card-shell.is-danger {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(254, 242, 242, 0.92)),
    linear-gradient(135deg, rgba(248, 113, 113, 0.08), transparent 42%);
}
.project-card-shell__head,
.project-card-shell__actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.project-card-shell__title strong {
  display: block;
  margin-bottom: 6px;
  font-size: 18px;
  color: #0f172a;
}
.project-card-shell__title p {
  margin: 0;
  color: #64748b;
}
.project-card-shell__status {
  flex-shrink: 0;
}
.project-card-shell__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.project-card-shell__meta :deep(.el-tag) {
  margin: 0;
  max-width: 100%;
}
.project-card-shell__summary {
  margin: 0;
  min-height: 42px;
  color: #334155;
  line-height: 1.65;
}
.project-card-shell__ai {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(251, 191, 36, 0.26);
  background: linear-gradient(180deg, rgba(255, 247, 237, 0.96), rgba(255, 251, 235, 0.92));
}
.project-card-shell__ai strong {
  color: #92400e;
}
.project-card-shell__ai p,
.project-card-shell__ai small {
  margin: 0;
  color: #92400e;
}
.project-card-shell__actions {
  align-items: center;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 6px;
}
.project-card-shell__actions :deep(.el-button) {
  box-shadow: 0 8px 16px rgba(15, 23, 42, 0.08);
}
@media (max-width: 960px) {
  .summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .server-project-page {
    padding: 14px;
  }
  .hero,
  .toolbar,
  .manual-project-section,
  .project-installation-head,
  .ai-status {
    padding-left: 16px;
    padding-right: 16px;
  }
  .hero,
  .toolbar,
  .panel-head,
  .project-card-shell__head {
    flex-direction: column;
    align-items: stretch;
  }
  .summary {
    grid-template-columns: 1fr;
  }
}
.list {
  display: grid;
  gap: 10px;
}
.snapshot,
.op {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.34);
  color: inherit;
  text-align: left;
}
.snapshot {
  cursor: pointer;
}
.op header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #f8fafc;
}
@media (max-width: 1080px) {
  .summary,
  .detail-grid,
  .meta {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 760px) {
  .hero,
  .toolbar,
  .detail-hero,
  .summary,
  .detail-grid,
  .meta {
    display: grid;
    grid-template-columns: 1fr;
  }
}
</style>
