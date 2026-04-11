<template>
  <SoftWorkspace title="软件详情">
    <section v-if="currentPackage" class="package-hero">
      <div class="package-hero__main">
        <div class="package-hero__avatar">
          <img
            v-if="currentPackage.iconUrl"
            :src="currentPackage.iconUrl"
            :alt="currentPackage.packageName"
          />
          <span v-else>{{ packageInitials(currentPackage.packageName) }}</span>
        </div>
        <div class="package-hero__content">
          <div class="package-hero__title-row">
            <h2>{{ currentPackage.packageName }}</h2>
            <div class="package-hero__actions">
              <SoftStatusTag
                :status="
                  currentInstallationDetail?.installation.runtimeStatus ||
                  'IDLE'
                "
              />
              <el-tooltip content="回到目录" placement="top">
                <el-button circle @click="router.push('/soft/catalog')">
                  <IconifyIconOnline icon="ri:arrow-left-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="刷新详情" placement="top">
                <el-button circle type="primary" @click="reloadAll">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
          <p>
            {{ currentPackage.description || "当前软件暂未补充中文描述。" }}
          </p>
          <div class="package-hero__meta">
            <span>{{ currentPackage.packageCode }}</span>
            <span>{{ currentPackage.packageCategory || "未分类" }}</span>
            <span>{{ packagePlatformText }}</span>
            <span>{{ versions.length }} 个版本</span>
            <span>{{ relatedInstallations.length }} 台服务器实例</span>
          </div>
        </div>
      </div>
    </section>

    <section class="installation-switcher">
      <header class="switcher-header">
        <div>
          <h3>服务实例</h3>
          <p>
            同一软件的不同服务器、不同端口和不同服务实例都会独立展示，切换后下方信息同步联动
          </p>
        </div>
        <div class="switcher-header__actions">
          <span>{{ relatedInstallations.length }} 个实例</span>
          <ScSelect
            v-model="instanceViewMode"
            :options="instanceViewModeOptions"
            layout="pill"
            class="instance-mode-select"
          >
            <template #pill="{ item, selected }">
              <button
                type="button"
                class="instance-mode-pill"
                :class="{ 'is-selected': selected }"
              >
                <IconifyIconOnline
                  :icon="String(item.icon || 'ri:layout-grid-line')"
                />
                <span>{{ item.label }}</span>
              </button>
            </template>
          </ScSelect>
        </div>
      </header>

      <div
        v-if="relatedInstallations.length && instanceViewMode === 'cards'"
        class="installation-card-grid"
      >
        <button
          v-for="item in relatedInstallations"
          :key="item.uniqueKey"
          type="button"
          class="installation-card"
          :class="{
            'is-active': item.softInstallationId === selectedInstallationId,
          }"
          @click="selectedInstallationId = item.softInstallationId || undefined"
        >
          <div class="installation-card__header">
            <div>
              <strong>{{ item.installationName || item.targetDisplay }}</strong>
              <p>{{ item.targetDisplay }}</p>
            </div>
            <SoftStatusTag :status="item.runtimeStatus || item.installStatus" />
          </div>
          <div class="installation-card__meta">
            <span>
              <IconifyIconOnline icon="ri:earth-line" />
              {{ item.connectionText || item.targetDisplay }}
            </span>
            <span>
              <IconifyIconOnline icon="ri:settings-3-line" />
              {{ item.serviceName || "未配置服务名" }}
            </span>
            <span>
              <IconifyIconOnline icon="ri:folder-2-line" />
              {{ item.installPath || "-" }}
            </span>
          </div>
        </button>
      </div>

      <ScSelect
        v-else-if="relatedInstallations.length"
        v-model="selectedInstallationId"
        placeholder="选择服务实例"
        :options="installationOptions"
        layout="dropdown"
        class="installation-switcher__select"
        dropdown-title="选择服务实例"
        dropdown-placeholder="搜索实例名称、服务器、服务名或路径"
        dropdown-icon="ri:server-line"
        :dropdown-col="1"
        display-mode="normal"
      >
        <template #content="{ option }">
          <div class="installation-option">
            <div class="installation-option__title">
              <strong>{{ option.label }}</strong>
              <SoftStatusTag
                :status="
                  String(
                    option.runtimeStatus || option.installStatus || 'UNKNOWN',
                  )
                "
              />
            </div>
            <div class="installation-option__meta">
              <span>{{
                option.connectionText || option.targetName || "-"
              }}</span>
              <span>{{ option.platformText || "-" }}</span>
              <span>{{ option.installPath || "-" }}</span>
            </div>
          </div>
        </template>
      </ScSelect>

      <el-empty v-else description="当前软件还没有安装实例" />
    </section>

    <el-tabs v-model="activeTab" stretch>
      <el-tab-pane label="基础信息" name="overview">
        <div class="overview-grid">
          <article class="info-card">
            <header>
              <h3>软件主档</h3>
              <p>{{ currentPackage?.packageCode }}</p>
            </header>
            <dl>
              <div>
                <dt>名称</dt>
                <dd>{{ currentPackage?.packageName || "-" }}</dd>
              </div>
              <div>
                <dt>分类</dt>
                <dd>{{ currentPackage?.packageCategory || "-" }}</dd>
              </div>
              <div>
                <dt>平台</dt>
                <dd>{{ packagePlatformText }}</dd>
              </div>
              <div>
                <dt>描述</dt>
                <dd>{{ currentPackage?.description || "暂无描述" }}</dd>
              </div>
            </dl>
          </article>

          <article class="info-card">
            <header>
              <h3>版本清单</h3>
              <p>仓库同步结果</p>
            </header>
            <el-table :data="versions" size="small" border>
              <el-table-column
                prop="versionName"
                label="版本"
                min-width="160"
              />
              <el-table-column
                prop="versionCode"
                label="版本号"
                min-width="120"
              />
              <el-table-column
                prop="md5"
                label="MD5"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column label="能力" min-width="180">
                <template #default="{ row }">
                  <span>{{
                    (row.capabilityFlags || []).join(" / ") || "基础安装"
                  }}</span>
                </template>
              </el-table-column>
            </el-table>
          </article>
        </div>

        <article v-if="currentInstallationDetail" class="info-card">
          <header>
            <h3>当前服务器实例</h3>
            <p>当前已选服务器上的安装状态、服务名和路径</p>
          </header>
          <dl>
            <div>
              <dt>实例名称</dt>
              <dd>
                {{
                  currentInstallationDetail.installation.installationName || "-"
                }}
              </dd>
            </div>
            <div>
              <dt>服务器</dt>
              <dd>{{ currentInstallationDetail.target.targetName || "-" }}</dd>
            </div>
            <div>
              <dt>安装状态</dt>
              <dd>
                {{
                  statusLabel(
                    currentInstallationDetail.installation.installStatus,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>运行状态</dt>
              <dd>
                {{
                  statusLabel(
                    currentInstallationDetail.installation.runtimeStatus,
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>服务名称</dt>
              <dd>
                {{
                  currentInstallationDetail.installation.serviceName || "未配置"
                }}
              </dd>
            </div>
              <div>
                <dt>安装路径</dt>
                <dd>
                  {{ currentInstallationDetail.installation.installPath || "-" }}
                </dd>
              </div>
              <div>
                <dt>备份点</dt>
                <dd>{{ snapshots.length }} 个</dd>
              </div>
              <div>
                <dt>升级候选</dt>
                <dd>{{ upgradeSuggestion }}</dd>
              </div>
            </dl>
          </article>

        <div
          v-if="currentInstallationDetail"
          class="overview-grid overview-grid--summary"
        >
          <article class="info-card">
            <header>
              <h3>安装参数摘要</h3>
              <p>安装引导参数快照</p>
            </header>
            <dl>
              <div
                v-for="item in installSummaryEntries"
                :key="`install-${item.key}`"
              >
                <dt>{{ item.key }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </article>

          <article class="info-card">
            <header>
              <h3>服务引导摘要</h3>
              <p>服务注册与运行参数</p>
            </header>
            <dl>
              <div
                v-for="item in serviceSummaryEntries"
                :key="`service-${item.key}`"
              >
                <dt>{{ item.key }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </article>

          <article class="info-card">
            <header>
              <h3>配置参数摘要</h3>
              <p>配置初始化与模板变量</p>
            </header>
            <dl>
              <div
                v-for="item in configSummaryEntries"
                :key="`config-${item.key}`"
              >
                <dt>{{ item.key }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </article>

          <article class="info-card">
            <header>
              <h3>模板与落地路径</h3>
              <p>模板摘要与最终文件路径</p>
            </header>
            <dl>
              <div
                v-for="item in templateSummaryEntries"
                :key="`template-${item.key}`"
              >
                <dt>{{ item.key }}</dt>
                <dd>{{ item.value }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </el-tab-pane>

      <el-tab-pane label="安装示例" name="example">
        <template v-if="currentInstallationDetail">
          <div class="overview-grid">
            <article class="info-card">
              <header>
                <h3>安装时序</h3>
                <p>按当前软件与当前实例生成的引导时序和落地步骤</p>
              </header>
              <el-timeline class="example-timeline">
                <el-timeline-item
                  v-for="item in installExampleTimeline"
                  :key="item.step"
                  :timestamp="item.step"
                  :type="item.type"
                >
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.description }}</p>
                </el-timeline-item>
              </el-timeline>
            </article>

            <article class="info-card">
              <header>
                <h3>示例参数</h3>
                <p>当前实例摘要，可直接作为安装引导参考</p>
              </header>
              <dl>
                <div>
                  <dt>安装目录</dt>
                  <dd>
                    {{
                      currentInstallationDetail.installation.installPath || "-"
                    }}
                  </dd>
                </div>
                <div>
                  <dt>服务名称</dt>
                  <dd>
                    {{
                      currentInstallationDetail.installation.serviceName || "-"
                    }}
                  </dd>
                </div>
                <div>
                  <dt>默认日志</dt>
                  <dd>{{ availableLogPaths[0] || "未声明日志路径" }}</dd>
                </div>
                <div>
                  <dt>默认配置</dt>
                  <dd>{{ availableConfigPaths[0] || "未声明配置路径" }}</dd>
                </div>
              </dl>
            </article>
          </div>

          <div class="service-grid service-grid--example-records">
            <article class="info-card">
              <header>
                <h3>示例记录</h3>
                <p>当前实例最近的真实操作记录，点击任一记录可在右侧控制台重播</p>
              </header>
              <div v-if="exampleRecords.length" class="record-replay-list">
                <button
                  v-for="record in exampleRecords"
                  :key="record.softOperationLogId"
                  type="button"
                  class="record-replay-item"
                  :class="{
                    'is-active': record.softOperationLogId === replayRecordId,
                  }"
                  @click="replayOperationRecord(record)"
                >
                  <div>
                    <strong>
                      #{{ record.softOperationLogId }}
                      {{ operationTypeLabel(record.operationType) }}
                    </strong>
                    <p>
                      {{
                        record.detailMessage ||
                        record.operationMessage ||
                        "当前记录没有补充说明"
                      }}
                    </p>
                  </div>
                  <div class="record-replay-item__meta">
                    <span>{{ statusLabel(record.operationStatus) }}</span>
                    <small>{{ record.endTime || record.startTime || "-" }}</small>
                  </div>
                </button>
              </div>
              <el-empty v-else description="当前实例还没有可供重播的操作记录" />
            </article>

            <article class="info-card">
              <header>
                <h3>记录重播控制台</h3>
                <p>
                  {{
                    replayRecordId
                      ? `正在查看记录 #${replayRecordId}${replayRunning ? " 的动态重播" : " 的静态回放"}`
                      : "选择左侧记录后，这里会按执行顺序重播输出"
                  }}
                </p>
              </header>
              <div class="watch-hint">
                <span>记录 {{ replayRecordId || "-" }}</span>
                <span>状态 {{ replayRunning ? "重播中" : "待命" }}</span>
              </div>
              <div class="code-console code-console--replay">
                <pre>{{ replayConsoleText }}</pre>
              </div>
            </article>
          </div>

          <div class="service-grid">
            <article class="info-card">
              <header>
                <h3>安装脚本示例</h3>
                <p>当前版本的安装模板输出</p>
              </header>
              <div class="code-console">
                <pre>{{ installScriptExample }}</pre>
              </div>
            </article>

            <article class="info-card">
              <header>
                <h3>启动 / 服务脚本示例</h3>
                <p>启动或服务注册模板输出</p>
              </header>
              <div class="code-console">
                <pre>{{ runtimeScriptExample }}</pre>
              </div>
            </article>
          </div>
        </template>
        <el-empty v-else description="先选择一个安装实例" />
      </el-tab-pane>

      <el-tab-pane label="服务控制" name="service">
        <template v-if="currentInstallationDetail">
          <div class="service-grid">
            <article class="info-card">
              <header>
                <h3>当前服务</h3>
                <p>
                  {{
                    currentInstallationDetail.installation.serviceName ||
                    "未配置服务名称"
                  }}
                </p>
              </header>
              <dl>
                <div>
                  <dt>目标</dt>
                  <dd>{{ currentInstallationDetail.target.targetName }}</dd>
                </div>
                <div>
                  <dt>安装路径</dt>
                  <dd>
                    {{
                      currentInstallationDetail.installation.installPath || "-"
                    }}
                  </dd>
                </div>
                <div>
                  <dt>运行状态</dt>
                  <dd>
                    {{
                      statusLabel(
                        currentInstallationDetail.installation.runtimeStatus,
                      )
                    }}
                  </dd>
                </div>
                <div>
                  <dt>状态输出</dt>
                  <dd>{{ serviceStatusText || "尚未执行状态检查" }}</dd>
                </div>
              </dl>
            </article>

            <article class="info-card">
              <header>
                <h3>控制台</h3>
                <p>systemd / WinSW 统一操作</p>
              </header>
              <div class="service-actions">
                <el-tooltip content="注册服务" placement="top">
                  <el-button circle @click="runServiceAction('register')">
                    <IconifyIconOnline icon="ri:shield-check-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="启动服务" placement="top">
                  <el-button
                    circle
                    type="success"
                    @click="runServiceAction('start')"
                  >
                    <IconifyIconOnline icon="ri:play-circle-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="停止服务" placement="top">
                  <el-button
                    circle
                    type="warning"
                    @click="runServiceAction('stop')"
                  >
                    <IconifyIconOnline icon="ri:pause-circle-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="重启服务" placement="top">
                  <el-button circle @click="runServiceAction('restart')">
                    <IconifyIconOnline icon="ri:restart-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="检查状态" placement="top">
                  <el-button
                    circle
                    type="primary"
                    @click="runServiceAction('status')"
                  >
                    <IconifyIconOnline icon="ri:pulse-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="取消注册" placement="top">
                  <el-button
                    circle
                    type="danger"
                    plain
                    @click="runServiceAction('unregister')"
                  >
                    <IconifyIconOnline icon="ri:shield-cross-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </article>
          </div>
        </template>
        <el-empty v-else description="先选择一个安装实例" />
      </el-tab-pane>

      <el-tab-pane label="实时日志" name="logs">
        <template v-if="currentInstallationDetail">
          <div class="stream-toolbar">
            <ScSelect
              v-model="selectedLogPath"
              placeholder="选择日志路径"
              :options="logPathOptions"
              layout="dropdown"
              width="100%"
              class="stream-toolbar__select"
              dropdown-title="选择日志路径"
              dropdown-placeholder="选择日志路径"
              dropdown-icon="ri:file-list-3-line"
              :dropdown-col="1"
              display-mode="normal"
            >
              <template #content="{ option }">
                <div class="installation-option">
                  <div class="installation-option__title">
                    <strong>{{ option.label }}</strong>
                  </div>
                  <div class="installation-option__meta">
                    <span>{{ option.description || "日志输出路径" }}</span>
                  </div>
                </div>
              </template>
            </ScSelect>
            <el-tooltip content="读取最新日志" placement="top">
              <el-button circle @click="loadLogs">
                <IconifyIconOnline icon="ri:file-list-3-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip
              v-if="!runtimeState.connected"
              content="建立日志 watch"
              placement="top"
            >
              <el-button circle type="primary" @click="connectLogStream">
                <IconifyIconOnline icon="ri:radar-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip v-else content="停止日志 watch" placement="top">
              <el-button
                circle
                type="danger"
                plain
                @click="disconnectLogStream"
              >
                <IconifyIconOnline icon="ri:stop-circle-line" />
              </el-button>
            </el-tooltip>
            <span class="stream-toolbar__meta">{{
              selectedLogPath || "自动选择有效日志文件"
            }}</span>
          </div>

          <div class="watch-hint">
            <span>watchId {{ activeWatchTicket?.watchId || "-" }}</span>
            <span
              >状态 {{ connectionStatusLabel(runtimeState.connected) }}</span
            >
          </div>

          <el-alert
            v-if="runtimeState.error"
            :title="runtimeState.error"
            type="error"
            :closable="false"
            class="stream-alert"
          />

          <el-scrollbar height="420px" class="log-console">
            <pre>{{ runtimeLogText || "暂无日志输出" }}</pre>
          </el-scrollbar>
        </template>
        <el-empty v-else description="先选择一个安装实例" />
      </el-tab-pane>

      <el-tab-pane label="配置管理" name="config">
        <template v-if="currentInstallationDetail">
          <div class="stream-toolbar">
            <ScSelect
              v-model="selectedConfigPath"
              placeholder="选择配置文件"
              :options="configPathOptions"
              layout="dropdown"
              width="100%"
              class="stream-toolbar__select"
              dropdown-title="选择配置文件"
              dropdown-placeholder="选择配置文件"
              dropdown-icon="ri:file-copy-2-line"
              :dropdown-col="1"
              display-mode="normal"
            >
              <template #content="{ option }">
                <div class="installation-option">
                  <div class="installation-option__title">
                    <strong>{{ option.label }}</strong>
                  </div>
                  <div class="installation-option__meta">
                    <span>{{ option.description || "配置文件路径" }}</span>
                  </div>
                </div>
              </template>
            </ScSelect>
            <el-tooltip content="读取配置" placement="top">
              <el-button circle @click="loadConfig">
                <IconifyIconOnline icon="ri:file-copy-2-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="保存配置" placement="top">
              <el-button
                circle
                type="primary"
                :loading="savingConfig"
                @click="saveConfig"
              >
                <IconifyIconOnline icon="ri:save-line" />
              </el-button>
            </el-tooltip>
          </div>

          <div class="config-editor">
            <ScCodeEditor
              v-model="configDraft"
              :mode="configEditorMode"
              :height="420"
              theme="idea"
              class="config-editor__textarea"
            />
          </div>

          <div class="watch-hint watch-hint--config">
            <span>编辑模式 {{ configEditorLabel }}</span>
            <span>当前路径 {{ selectedConfigPath || "-" }}</span>
            <span>备份点 {{ snapshots.length }}</span>
          </div>

          <el-divider>备份点</el-divider>

          <el-table :data="snapshots" border size="small">
            <el-table-column
              prop="snapshotName"
              label="快照名称"
              min-width="160"
            />
            <el-table-column
              prop="configPath"
              label="路径"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column
              prop="operationRemark"
              label="备注"
              min-width="180"
              show-overflow-tooltip
            />
            <el-table-column prop="createTime" label="时间" min-width="170" />
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-tooltip content="回滚到这个备份点" placement="top">
                  <el-button
                    circle
                    type="warning"
                    plain
                    @click="rollback(row.softConfigSnapshotId)"
                  >
                    <IconifyIconOnline icon="ri:history-line" />
                  </el-button>
                </el-tooltip>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <el-empty v-else description="先选择一个安装实例" />
      </el-tab-pane>
    </el-tabs>

    <article v-if="activeOperationTicket" class="operation-panel">
      <div class="operation-panel__header">
        <div>
          <strong>实时操作 #{{ activeOperationTicket.operationId }}</strong>
          <p>
            {{ operationTypeLabel(activeOperationTicket.operationType) }} ·
            {{
              operationLatest?.message ||
              statusLabel(activeOperationTicket.operationStatus)
            }}
          </p>
        </div>
        <SoftStatusTag
          :status="
            operationLatest?.status || activeOperationTicket.operationStatus
          "
        />
      </div>

      <el-progress
        :percentage="operationLatest?.progressPercent || 0"
        :status="
          operationLatest?.status === 'FAILED'
            ? 'exception'
            : operationLatest?.status === 'SUCCESS'
              ? 'success'
              : undefined
        "
      />

      <div class="watch-hint">
        <span>阶段 {{ stageLabel(operationLatest?.stage) }}</span>
        <span>实例 {{ activeOperationTicket.installationId || "-" }}</span>
      </div>

      <el-scrollbar height="220px" class="log-console">
        <pre>{{ operationConsoleText }}</pre>
      </el-scrollbar>
    </article>
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  getSoftConfig,
  getSoftInstallationDetail,
  getSoftLogs,
  getSoftPackageDetail,
  getSoftServiceStatus,
  listSoftConfigSnapshots,
  listSoftInstallations,
  listSoftOperationLogs,
  listSoftTargets,
  registerSoftService,
  restartSoftService,
  rollbackSoftConfigSnapshot,
  startSoftLogWatch,
  startSoftService,
  stopSoftLogWatch,
  stopSoftService,
  unregisterSoftService,
  updateSoftConfig,
  type SoftConfigSnapshot,
  type SoftInstallation,
  type SoftInstallationDetail,
  type SoftLogWatchTicket,
  type SoftOperationLog,
  type SoftOperationTicket,
  type SoftPackage,
  type SoftPackageVersion,
  type SoftTarget,
} from "../api";
import ScCodeEditor from "@repo/components/ScCodeEditor";
import { useSoftOperationStream } from "../composables/useSoftOperationStream";
import { useSoftRuntimeLogStream } from "../composables/useSoftRuntimeLogStream";
import SoftStatusTag from "../components/SoftStatusTag.vue";
import SoftWorkspace from "../components/SoftWorkspace.vue";

type SummaryEntry = {
  key: string;
  value: string;
};

type InstallationOption = {
  value: number;
  label: string;
  targetName?: string;
  installPath?: string;
  installStatus?: string;
  runtimeStatus?: string;
  platformText?: string;
  connectionText?: string;
};

type ResolvedInstallation = SoftInstallation & {
  resolvedTarget: SoftTarget | null;
  uniqueKey: string;
  targetDisplay: string;
  connectionText: string;
};

type SelectPathOption = {
  label: string;
  value: string;
  description?: string;
  icon?: string;
};

type InstanceViewMode = "cards" | "list";

type InstallTimelineItem = {
  step: string;
  title: string;
  description: string;
  type: "primary" | "success" | "warning" | "info" | "danger";
};

const route = useRoute();
const router = useRouter();

const activeTab = ref("overview");
const currentPackage = ref<SoftPackage | null>(null);
const versions = ref<SoftPackageVersion[]>([]);
const installations = ref<SoftInstallation[]>([]);
const targets = ref<SoftTarget[]>([]);
const selectedInstallationId = ref<number | undefined>();
const instanceViewMode = ref<InstanceViewMode>("cards");
const currentInstallationDetail = ref<SoftInstallationDetail | null>(null);
const snapshots = ref<SoftConfigSnapshot[]>([]);
const operationRecords = ref<SoftOperationLog[]>([]);
const selectedLogPath = ref("");
const selectedConfigPath = ref("");
const configDraft = ref("");
const serviceStatusText = ref("");
const savingConfig = ref(false);
const activeWatchTicket = ref<SoftLogWatchTicket | null>(null);
const activeOperationTicket = ref<SoftOperationTicket | null>(null);
const watchedInstallationId = ref<number | null>(null);
const watchedLogPath = ref("");
const reconnectingWatch = ref(false);
const replayRecordId = ref<number | null>(null);
const replayRunning = ref(false);
const replayConsoleLines = ref<string[]>([]);
let runtimeLogPollTimer: number | undefined;
let replayTimer: number | undefined;

const {
  latest: operationLatestRef,
  lines: operationLinesRef,
  connect: connectOperation,
} = useSoftOperationStream();
const {
  state: runtimeStateRef,
  lines: runtimeLinesRef,
  connect: connectRuntime,
  disconnect: disconnectRuntime,
} = useSoftRuntimeLogStream();

const operationLatest = computed(() => operationLatestRef.value);
const runtimeState = computed(() => runtimeStateRef.value);

const statusTextMap: Record<string, string> = {
  RUNNING: "运行中",
  SUCCESS: "成功",
  INSTALLED: "已安装",
  ENABLED: "已启用",
  INSTALLING: "安装中",
  RUNNING_WAIT: "等待运行",
  UNINSTALLING: "卸载中",
  FAILED: "失败",
  ERROR: "异常",
  DISABLED: "已停用",
  STOPPED: "已停止",
  UNINSTALLED: "未安装",
  UNKNOWN: "未知",
  IDLE: "空闲",
};

const normalizeOs = (value?: string | null) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) {
    return "";
  }
  if (text.includes("win")) {
    return "windows";
  }
  if (text.includes("linux")) {
    return "linux";
  }
  if (text.includes("mac") || text.includes("darwin")) {
    return "macos";
  }
  return text;
};

const normalizeArch = (value?: string | null) => {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  if (!text) {
    return "";
  }
  if (["x64", "x86_64", "amd64"].includes(text)) {
    return "amd64";
  }
  if (["arm64", "aarch64"].includes(text)) {
    return "arm64";
  }
  return text;
};

const osLabel = (value?: string | null) =>
  normalizeOs(value) === "windows"
    ? "Windows"
    : normalizeOs(value) === "linux"
      ? "Linux"
      : normalizeOs(value) === "macos"
        ? "macOS"
        : value || "通用系统";

const architectureLabel = (value?: string | null) => {
  const normalized = normalizeArch(value);
  if (!normalized) {
    return "通用架构";
  }
  if (normalized === "amd64") {
    return "AMD64";
  }
  if (normalized === "arm64") {
    return "ARM64";
  }
  return String(value || normalized).toUpperCase();
};

const packageInitials = (value?: string | null) =>
  String(value || "SO")
    .trim()
    .slice(0, 2)
    .toUpperCase();

const statusLabel = (value?: string | null) =>
  statusTextMap[String(value || "UNKNOWN").toUpperCase()] || value || "未知";

const connectionStatusLabel = (connected?: boolean) =>
  connected ? "已连接" : "未连接";

const operationTypeLabel = (value?: string | null) =>
  value === "INSTALL"
    ? "安装"
    : value === "UNINSTALL"
      ? "卸载"
      : value === "REGISTER" || value === "SERVICE_REGISTER"
        ? "注册服务"
        : value === "UNREGISTER" || value === "SERVICE_UNREGISTER"
          ? "取消注册"
          : value === "START"
            ? "启动服务"
            : value === "STOP"
              ? "停止服务"
              : value === "RESTART"
                ? "重启服务"
                : value === "STATUS"
                  ? "检查状态"
                  : value === "CONFIG_WRITE"
                    ? "写入配置"
                    : value || "实时操作";

const stageLabel = (value?: string | null) =>
  value === "PREPARE"
    ? "准备"
    : value === "VALIDATE"
      ? "校验"
      : value === "RENDER"
        ? "渲染"
        : value === "CONFIGURE"
          ? "配置"
          : value === "BACKUP"
            ? "备份"
            : value === "DOWNLOAD"
              ? "下载"
              : value === "INSTALL"
                ? "安装"
                : value === "UNINSTALL"
                  ? "卸载"
                  : value === "EXECUTE"
                    ? "执行"
                    : value === "WRITE"
                      ? "写入"
                      : value === "SERVICE_GUIDE"
                        ? "服务引导"
                        : value === "VERIFY"
                          ? "校验结果"
                          : value === "FINISH"
                            ? "完成"
                            : value || "-";

const packageId = computed(() => {
  const value = Number(route.params.id);
  return Number.isFinite(value) && value > 0 ? value : undefined;
});
const queryInstallationId = computed(
  () => Number(route.query.installationId || 0) || undefined,
);

const targetMap = computed(
  () =>
    new Map(
      targets.value.map((item) => [item.softTargetId || 0, item] as const),
    ),
);

const relatedInstallations = computed<ResolvedInstallation[]>(() => {
  return installations.value
    .filter((item) => item.softPackageId === packageId.value)
    .map((item) => {
      const target = targetMap.value.get(item.softTargetId || 0) || null;
      return {
        ...item,
        resolvedTarget: target,
        uniqueKey: String(
          item.softInstallationId ||
            `${item.softTargetId || item.targetName}-${item.installationName}-${item.installPath}`,
        ),
        targetDisplay:
          target?.targetName ||
          item.targetName ||
          `目标 #${item.softTargetId || "-"}`,
        connectionText: [
          target?.host
            ? `${target.host}${target.port ? `:${target.port}` : ""}`
            : "",
          target?.username || "",
        ]
          .filter(Boolean)
          .join(" / "),
      };
    })
    .sort((left, right) => {
      const timeCompare = String(right.lastOperationTime || "").localeCompare(
        String(left.lastOperationTime || ""),
      );
      if (timeCompare !== 0) {
        return timeCompare;
      }
      return String(left.installationName || "").localeCompare(
        String(right.installationName || ""),
      );
    });
});

const packagePlatformText = computed(
  () =>
    `${osLabel(currentPackage.value?.osType)} / ${architectureLabel(currentPackage.value?.architecture)}`,
);

const installationOptions = computed<InstallationOption[]>(() =>
  relatedInstallations.value.map((item) => ({
    value: item.softInstallationId || 0,
    label: `${item.targetDisplay} · ${item.installationName}`,
    targetName: item.targetDisplay,
    installPath: item.installPath,
    installStatus: item.installStatus,
    runtimeStatus: item.runtimeStatus,
    platformText: `${item.versionName || "默认版本"} / ${statusLabel(item.runtimeStatus || item.installStatus)}`,
    connectionText: item.connectionText || item.installPath,
  })),
);

const instanceViewModeOptions = [
  {
    label: "卡片",
    value: "cards",
    icon: "ri:layout-grid-line",
  },
  {
    label: "清单",
    value: "list",
    icon: "ri:list-check-3",
  },
];

const logPathOptions = computed<SelectPathOption[]>(() =>
  availableLogPaths.value.map((path) => ({
    label: path,
    value: path,
    description: "日志输出路径",
    icon: "ri:file-list-3-line",
  })),
);

const configPathOptions = computed<SelectPathOption[]>(() =>
  availableConfigPaths.value.map((path) => ({
    label: path,
    value: path,
    description: "配置文件路径",
    icon: "ri:file-copy-2-line",
  })),
);

const installScriptExample = computed(
  () =>
    currentInstallationDetail.value?.version.installScript ||
    "当前版本未提供安装脚本示例",
);

const runtimeScriptExample = computed(
  () =>
    currentInstallationDetail.value?.version.startScript ||
    currentInstallationDetail.value?.version.serviceRegisterScript ||
    "当前版本未提供启动或服务脚本示例",
);

const installExampleSteps = computed(() => {
  if (!currentInstallationDetail.value) {
    return [];
  }
  const installation = currentInstallationDetail.value.installation;
  const target = currentInstallationDetail.value.target;
  return [
    `选择服务器 ${target.targetName || "-"}，确认系统 ${osLabel(target.osType)} / ${architectureLabel(target.architecture)}`,
    `安装版本默认使用 ${currentInstallationDetail.value.version.versionName || currentInstallationDetail.value.version.versionCode || "最新版本"}`,
    `安装目录建议为 ${installation.installPath || "-"}`,
    `服务名称建议为 ${installation.serviceName || "未配置服务名"}`,
    `配置文件默认落地到 ${availableConfigPaths.value[0] || "模板未声明配置路径"}`,
  ];
});

const installExampleTimeline = computed<InstallTimelineItem[]>(() =>
  installExampleSteps.value.map((step, index) => ({
    step: `STEP 0${index + 1}`,
    title:
      index === 0
        ? "锁定运行平台"
        : index === 1
          ? "选择交付版本"
          : index === 2
            ? "准备安装目录"
            : index === 3
              ? "准备服务引导"
              : "落地配置文件",
    description: step,
    type:
      index === 0
        ? "primary"
        : index === installExampleSteps.value.length - 1
          ? "success"
          : "info",
  })),
);

const runtimeLogText = computed(() => runtimeLinesRef.value.join("\n"));
const replayConsoleText = computed(() =>
  replayConsoleLines.value.length
    ? replayConsoleLines.value.join("\n")
    : "选择左侧记录后，这里会按执行顺序重播输出。",
);

const operationConsoleText = computed(() => {
  if (operationLinesRef.value.length) {
    return operationLinesRef.value.join("\n");
  }
  return (
    operationLatest.value?.detail ||
    operationLatest.value?.message ||
    "等待操作输出..."
  );
});

const installSummaryEntries = computed(() =>
  toSummaryEntries(
    parseJsonRecord(
      currentInstallationDetail.value?.installation.installOptionsJson,
    ),
  ),
);
const serviceSummaryEntries = computed(() =>
  toSummaryEntries(
    parseJsonRecord(
      currentInstallationDetail.value?.installation.serviceOptionsJson,
    ),
  ),
);
const configSummaryEntries = computed(() =>
  toSummaryEntries(
    parseJsonRecord(
      currentInstallationDetail.value?.installation.configOptionsJson,
    ),
  ),
);
const templateSummaryEntries = computed(() =>
  toSummaryEntries(
    parseJsonRecord(
      currentInstallationDetail.value?.installation.templateSummaryJson,
    ),
  ),
);

const exampleRecords = computed(() =>
  operationRecords.value
    .filter(
      (item) => item.softInstallationId === selectedInstallationId.value,
    )
    .sort((left, right) =>
      String(right.endTime || right.startTime || "").localeCompare(
        String(left.endTime || left.startTime || ""),
      ),
    )
    .slice(0, 8),
);

const latestVersion = computed(() => versions.value[0] || null);
const upgradeSuggestion = computed(() => {
  const currentVersion = currentInstallationDetail.value?.installation
    .installedVersion;
  const latest = latestVersion.value?.versionCode || latestVersion.value?.versionName;
  if (!latest) {
    return "暂无可比较版本";
  }
  if (!currentVersion) {
    return `建议安装最新版本 ${latest}`;
  }
  return currentVersion === latest
    ? `当前已是最新版本 ${latest}`
    : `可升级到 ${latest}`;
});

const availableLogPaths = computed(() => {
  const fromVersion = currentInstallationDetail.value?.version.logPaths || [];
  const fromTemplate = extractStringList(
    parseJsonRecord(
      currentInstallationDetail.value?.installation.templateSummaryJson,
    ).logPaths,
  );
  return Array.from(new Set([...fromVersion, ...fromTemplate]));
});

const availableConfigPaths = computed(() => {
  const fromVersion =
    currentInstallationDetail.value?.version.configPaths || [];
  const summary = parseJsonRecord(
    currentInstallationDetail.value?.installation.templateSummaryJson,
  );
  const fromSummary = extractStringList(summary.renderedConfigPaths);
  return Array.from(new Set([...fromVersion, ...fromSummary]));
});

const configEditorMode = computed(() =>
  inferEditorMode(selectedConfigPath.value, configDraft.value),
);

const configEditorLabel = computed(() =>
  editorModeLabel(configEditorMode.value),
);

const clearReplayTimer = () => {
  if (replayTimer) {
    window.clearInterval(replayTimer);
    replayTimer = undefined;
  }
  replayRunning.value = false;
};

const resetReplayConsole = () => {
  clearReplayTimer();
  replayRecordId.value = null;
  replayConsoleLines.value = [];
};

const replayOperationRecord = (record: SoftOperationLog) => {
  clearReplayTimer();
  replayRecordId.value = record.softOperationLogId || null;
  const seed = String(
    record.operationOutput ||
      record.detailMessage ||
      record.operationMessage ||
      "当前记录没有输出内容。",
  )
    .split(/\r?\n/)
    .filter(Boolean);
  if (!seed.length) {
    replayConsoleLines.value = ["当前记录没有输出内容。"];
    return;
  }
  replayConsoleLines.value = [];
  replayRunning.value = true;
  let index = 0;
  replayTimer = window.setInterval(() => {
    replayConsoleLines.value = [...replayConsoleLines.value, seed[index]];
    index += 1;
    if (index >= seed.length) {
      clearReplayTimer();
    }
  }, 70);
};

const inferEditorMode = (path?: string, content?: string) => {
  const lowerPath = String(path || "").toLowerCase();
  if (
    lowerPath.endsWith(".json") ||
    String(content || "").trim().startsWith("{")
  ) {
    return "application/json";
  }
  if (lowerPath.endsWith(".properties") || lowerPath.endsWith(".env")) {
    return "text/x-properties";
  }
  if (lowerPath.endsWith(".yaml") || lowerPath.endsWith(".yml")) {
    return "text/x-yaml";
  }
  if (lowerPath.endsWith(".xml")) {
    return "application/xml";
  }
  if (
    lowerPath.endsWith(".sh") ||
    lowerPath.endsWith(".bash") ||
    lowerPath.endsWith(".ps1")
  ) {
    return "text/x-sh";
  }
  return "text/plain";
};

const editorModeLabel = (mode: string) =>
  mode === "application/json"
    ? "JSON"
    : mode === "text/x-properties"
      ? "Properties / ENV"
      : mode === "text/x-yaml"
        ? "YAML"
        : mode === "application/xml"
          ? "XML"
          : mode === "text/x-sh"
            ? "Shell"
            : "纯文本";

const clearRuntimeLogPoller = () => {
  if (runtimeLogPollTimer) {
    window.clearInterval(runtimeLogPollTimer);
    runtimeLogPollTimer = undefined;
  }
};

const diffRuntimeLines = (previous: string[], current: string[]) => {
  if (!previous.length) {
    return current;
  }
  if (!current.length) {
    return [];
  }
  const overlap = Math.min(previous.length, current.length);
  for (let size = overlap; size > 0; size -= 1) {
    const previousSuffix = previous.slice(previous.length - size);
    const currentPrefix = current.slice(0, size);
    if (previousSuffix.join("\n") === currentPrefix.join("\n")) {
      return current.slice(size);
    }
  }
  if (current.length >= previous.length) {
    const currentHead = current.slice(0, previous.length);
    if (currentHead.join("\n") === previous.join("\n")) {
      return current.slice(previous.length);
    }
  }
  return current;
};

const mergeRuntimeLines = (current: string[], incoming: string[]) => {
  const additions = diffRuntimeLines(current, incoming);
  if (!additions.length) {
    return current;
  }
  return [...current, ...additions];
};

const refreshRuntimeLogTail = async () => {
  if (!selectedInstallationId.value) {
    return;
  }
  const result = await getSoftLogs(selectedInstallationId.value, {
    logPath: selectedLogPath.value || undefined,
    lines: 200,
  });
  const nextLines = result.data?.lines || [];
  if (!nextLines.length) {
    return;
  }
  if (result.data?.logPath) {
    selectedLogPath.value = result.data.logPath;
  }
  runtimeLinesRef.value = mergeRuntimeLines(runtimeLinesRef.value, nextLines);
};

const startRuntimeLogPoller = () => {
  clearRuntimeLogPoller();
  runtimeLogPollTimer = window.setInterval(() => {
    if (
      document.hidden ||
      activeTab.value !== "logs" ||
      !activeWatchTicket.value?.watchId ||
      !selectedInstallationId.value
    ) {
      return;
    }
    void refreshRuntimeLogTail();
  }, 3000);
};

const stopCurrentWatch = async () => {
  try {
    if (watchedInstallationId.value && activeWatchTicket.value?.watchId) {
      await stopSoftLogWatch(
        watchedInstallationId.value,
        activeWatchTicket.value.watchId,
      );
    }
  } finally {
    clearRuntimeLogPoller();
    watchedInstallationId.value = null;
    watchedLogPath.value = "";
    activeWatchTicket.value = null;
    disconnectRuntime();
  }
};

const syncInstallationQuery = async () => {
  const nextInstallationId = selectedInstallationId.value
    ? String(selectedInstallationId.value)
    : undefined;
  const currentInstallationId = Array.isArray(route.query.installationId)
    ? route.query.installationId[0]
    : route.query.installationId
      ? String(route.query.installationId)
      : undefined;
  if (currentInstallationId === nextInstallationId) {
    return;
  }
  const nextQuery = { ...route.query } as Record<string, string>;
  if (nextInstallationId) {
    nextQuery.installationId = nextInstallationId;
  } else {
    delete nextQuery.installationId;
  }
  await router.replace({
    path: route.path,
    query: nextQuery,
  });
};

const resolvePackageRouteFromInstallation = async () => {
  if (!queryInstallationId.value) {
    return false;
  }
  const detailResult = await getSoftInstallationDetail(
    queryInstallationId.value,
  );
  const resolvedPackageId = detailResult.data?.installation?.softPackageId;
  if (!resolvedPackageId || resolvedPackageId === packageId.value) {
    return false;
  }
  await router.replace(
    `/soft/detail/${resolvedPackageId}?installationId=${queryInstallationId.value}`,
  );
  message("详情路由已按安装实例自动切换到对应软件主档", { type: "info" });
  return true;
};

const loadPackage = async () => {
  if (!packageId.value) {
    throw new Error("INVALID_SOFT_PACKAGE_ID");
  }
  const result = await getSoftPackageDetail(packageId.value);
  currentPackage.value = result.data?.package || null;
  versions.value = result.data?.versions || [];
};

const loadInstallations = async () => {
  const [installationResult, targetResult] = await Promise.all([
    listSoftInstallations(),
    listSoftTargets(),
  ]);
  installations.value = installationResult.data || [];
  targets.value = targetResult.data || [];
  if (
    queryInstallationId.value &&
    relatedInstallations.value.some(
      (item) => item.softInstallationId === queryInstallationId.value,
    )
  ) {
    selectedInstallationId.value = queryInstallationId.value;
    return;
  }
  const currentInstallationId = relatedInstallations.value.find(
    (item) => item.softInstallationId === selectedInstallationId.value,
  )?.softInstallationId;
  selectedInstallationId.value =
    currentInstallationId || relatedInstallations.value[0]?.softInstallationId;
};

const loadOperationRecords = async () => {
  const result = await listSoftOperationLogs();
  operationRecords.value = result.data || [];
};

const loadCurrentInstallation = async () => {
  if (!selectedInstallationId.value) {
    currentInstallationDetail.value = null;
    snapshots.value = [];
    selectedLogPath.value = "";
    selectedConfigPath.value = "";
    configDraft.value = "";
    serviceStatusText.value = "";
    runtimeLinesRef.value = [];
    resetReplayConsole();
    await stopCurrentWatch();
    return;
  }
  const [detailResult, snapshotResult] = await Promise.all([
    getSoftInstallationDetail(selectedInstallationId.value),
    listSoftConfigSnapshots(selectedInstallationId.value),
  ]);
  currentInstallationDetail.value = detailResult.data || null;
  snapshots.value = snapshotResult.data || [];
  selectedLogPath.value = availableLogPaths.value.includes(
    selectedLogPath.value,
  )
    ? selectedLogPath.value
    : availableLogPaths.value[0] || "";
  selectedConfigPath.value = availableConfigPaths.value.includes(
    selectedConfigPath.value,
  )
    ? selectedConfigPath.value
    : availableConfigPaths.value[0] || "";
};

const loadLogs = async () => {
  if (!selectedInstallationId.value) {
    return;
  }
  const result = await getSoftLogs(selectedInstallationId.value, {
    logPath: selectedLogPath.value || undefined,
    lines: 200,
  });
  const lines = result.data?.lines || [];
  if (lines.length) {
    runtimeLinesRef.value = lines;
    if (result.data?.logPath) {
      selectedLogPath.value = result.data.logPath;
    }
    return;
  }
  if (!selectedLogPath.value) {
    runtimeLinesRef.value = [];
    return;
  }
  const fallback = await getSoftLogs(selectedInstallationId.value, {
    lines: 200,
  });
  runtimeLinesRef.value = fallback.data?.lines || [];
  if (fallback.data?.logPath) {
    selectedLogPath.value = fallback.data.logPath;
  }
};

const connectLogStream = async () => {
  if (!selectedInstallationId.value) {
    return;
  }
  await stopCurrentWatch();
  const result = await startSoftLogWatch(
    selectedInstallationId.value,
    selectedLogPath.value || undefined,
  );
  activeWatchTicket.value = result.data || null;
  watchedInstallationId.value = selectedInstallationId.value;
  watchedLogPath.value = selectedLogPath.value;
  connectRuntime(selectedInstallationId.value, { preserveLines: true });
  startRuntimeLogPoller();
};

const disconnectLogStream = async () => {
  await stopCurrentWatch();
};

const loadConfig = async () => {
  if (!selectedInstallationId.value) {
    return;
  }
  const result = await getSoftConfig(
    selectedInstallationId.value,
    selectedConfigPath.value || undefined,
  );
  selectedConfigPath.value =
    result.data?.configPath || selectedConfigPath.value;
  configDraft.value = result.data?.configContent || "";
};

const saveConfig = async () => {
  if (!selectedInstallationId.value || !selectedConfigPath.value) {
    message("请选择配置文件", { type: "warning" });
    return;
  }
  savingConfig.value = true;
  try {
    const result = await updateSoftConfig(selectedInstallationId.value, {
      configPath: selectedConfigPath.value,
      configContent: configDraft.value,
      snapshotName: `${currentPackage.value?.packageCode || "soft"}-${Date.now()}`,
      operationRemark: "页面保存配置",
    });
    activeOperationTicket.value = result.data || null;
    if (activeOperationTicket.value?.operationId) {
      connectOperation(activeOperationTicket.value.operationId);
    }
    message("配置保存命令已提交", { type: "success" });
  } finally {
    savingConfig.value = false;
  }
};

const rollback = async (snapshotId?: number) => {
  if (!selectedInstallationId.value || !snapshotId) {
    return;
  }
  await ElMessageBox.confirm("回滚会覆盖当前配置文件，确认继续？", "回滚配置", {
    type: "warning",
  });
  const result = await rollbackSoftConfigSnapshot(
    selectedInstallationId.value,
    snapshotId,
  );
  activeOperationTicket.value = result.data || null;
  if (activeOperationTicket.value?.operationId) {
    connectOperation(activeOperationTicket.value.operationId);
  }
  message("回滚命令已提交", { type: "success" });
};

const runServiceAction = async (
  action: "register" | "unregister" | "start" | "stop" | "restart" | "status",
) => {
  if (!selectedInstallationId.value) {
    return;
  }
  let result;
  if (action === "register") {
    result = await registerSoftService(selectedInstallationId.value);
  } else if (action === "unregister") {
    result = await unregisterSoftService(selectedInstallationId.value);
  } else if (action === "start") {
    result = await startSoftService(selectedInstallationId.value);
  } else if (action === "stop") {
    result = await stopSoftService(selectedInstallationId.value);
  } else if (action === "restart") {
    result = await restartSoftService(selectedInstallationId.value);
  } else {
    result = await getSoftServiceStatus(selectedInstallationId.value);
  }
  activeOperationTicket.value = result.data || null;
  if (activeOperationTicket.value?.operationId) {
    connectOperation(activeOperationTicket.value.operationId);
  }
  serviceStatusText.value =
    action === "status" ? "状态检查命令已提交" : serviceStatusText.value;
  const actionLabelMap = {
    register: "注册服务",
    unregister: "取消注册",
    start: "启动服务",
    stop: "停止服务",
    restart: "重启服务",
    status: "检查状态",
  } as const;
  message(`${actionLabelMap[action]}命令已提交`, { type: "success" });
};

const reloadAll = async () => {
  if (!packageId.value) {
    if (await resolvePackageRouteFromInstallation()) {
      return;
    }
    currentPackage.value = null;
    versions.value = [];
    installations.value = [];
    currentInstallationDetail.value = null;
    snapshots.value = [];
    await stopCurrentWatch();
    message("软件详情地址无效，请从软件目录或安装实例重新进入。", {
      type: "error",
    });
    return;
  }
  try {
    await loadPackage();
  } catch (error) {
    if (await resolvePackageRouteFromInstallation()) {
      return;
    }
    currentPackage.value = null;
    versions.value = [];
    installations.value = [];
    currentInstallationDetail.value = null;
    snapshots.value = [];
    await stopCurrentWatch();
    console.error(error);
    message("软件详情不存在或加载失败", { type: "error" });
    return;
  }

  try {
    await loadInstallations();
    await loadCurrentInstallation();
    await loadOperationRecords();
  } catch (error) {
    console.error(error);
    message("软件详情加载不完整，请稍后重试", { type: "error" });
  }
};

function parseJsonRecord(source?: string): Record<string, unknown> {
  if (!source) {
    return {};
  }
  try {
    const parsed = JSON.parse(source) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function extractStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item || "")).filter(Boolean);
}

function stringifyValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => stringifyValue(item)).join(" / ");
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .slice(0, 4)
      .map(([key, item]) => `${key}: ${stringifyValue(item)}`);
    return entries.length ? entries.join(" | ") : "-";
  }
  if (value === undefined || value === null || value === "") {
    return "-";
  }
  return String(value);
}

function toSummaryEntries(source: Record<string, unknown>): SummaryEntry[] {
  const entries = Object.entries(source || {}).map(([key, value]) => ({
    key,
    value: stringifyValue(value),
  }));
  return entries.length
    ? entries
    : [{ key: "摘要", value: "当前实例暂无对应快照" }];
}

watch(
  () => selectedInstallationId.value,
  async () => {
    await syncInstallationQuery();
    const shouldResumeWatch =
      runtimeState.value.connected || Boolean(activeWatchTicket.value?.watchId);
    await stopCurrentWatch();
    runtimeLinesRef.value = [];
    await loadCurrentInstallation();
    if (activeTab.value === "logs" && selectedInstallationId.value) {
      await loadLogs();
      if (shouldResumeWatch) {
        await connectLogStream();
      }
    }
  },
);

watch(
  () => selectedLogPath.value,
  async (value, oldValue) => {
    if (
      !selectedInstallationId.value ||
      !runtimeState.value.connected ||
      value === oldValue ||
      reconnectingWatch.value
    ) {
      return;
    }
    reconnectingWatch.value = true;
    try {
      await loadLogs();
      await connectLogStream();
    } finally {
      reconnectingWatch.value = false;
    }
  },
);

watch(
  () => activeTab.value,
  async (tab) => {
    if (
      tab === "logs" &&
      selectedInstallationId.value &&
      !runtimeLinesRef.value.length
    ) {
      await loadLogs();
    }
  },
);

watch(
  () => operationLatest.value?.finished,
  async (finished) => {
    if (finished) {
      await loadInstallations();
      await loadCurrentInstallation();
      await loadOperationRecords();
    }
  },
);

watch(
  () => selectedInstallationId.value,
  () => {
    resetReplayConsole();
  },
);

watch(
  () => route.params.id,
  async () => {
    await reloadAll();
  },
);

onMounted(reloadAll);

onUnmounted(() => {
  clearRuntimeLogPoller();
  clearReplayTimer();
  void stopCurrentWatch();
});
</script>

<style scoped lang="scss">
.package-hero,
.installation-switcher,
.installation-card-grid,
.installation-card,
.overview-grid,
.service-grid,
.info-card,
.operation-panel,
.stream-toolbar,
.config-editor,
.log-console,
.watch-hint,
.record-replay-list,
.record-replay-item {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.package-hero,
.installation-switcher,
.info-card,
.operation-panel {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.97),
    rgba(241, 245, 249, 0.9)
  );
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
}

.package-hero,
.installation-switcher,
.info-card,
.operation-panel {
  padding: 18px;
}

.package-hero,
.installation-switcher {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.package-hero__main,
.package-hero__title-row,
.package-hero__actions,
.package-hero__meta,
.switcher-header,
.switcher-header__actions,
.installation-option__title,
.installation-option__meta,
.service-actions,
.operation-panel__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.package-hero__main {
  align-items: flex-start;
}

.package-hero__avatar {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a, #0ea5e9);
  color: #f8fafc;
  font-size: 20px;
  font-weight: 700;
  overflow: hidden;
  flex-shrink: 0;
}

.package-hero__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.package-hero__content {
  display: grid;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.package-hero__title-row h2,
.switcher-header h3,
.info-card header h3 {
  margin: 0;
  color: #0f172a;
}

.package-hero__content p,
.switcher-header p,
.info-card header p,
.watch-hint,
.operation-panel__header p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.package-hero__meta span {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
  max-width: 100%;
  word-break: break-all;
}

.switcher-header span,
.stream-toolbar__meta {
  color: #64748b;
  font-size: 12px;
}

.installation-switcher__select {
  width: 100%;
}

.switcher-header__actions {
  justify-content: flex-end;
}

.instance-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.instance-mode-pill.is-selected {
  border-color: rgba(14, 165, 233, 0.34);
  background: rgba(224, 242, 254, 0.92);
  color: #0f172a;
  box-shadow: 0 10px 18px rgba(14, 165, 233, 0.12);
}

.installation-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.installation-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.installation-card:hover,
.installation-card.is-active {
  border-color: rgba(14, 165, 233, 0.28);
  box-shadow: 0 18px 30px rgba(14, 165, 233, 0.12);
  transform: translateY(-2px);
}

.installation-card__header,
.installation-card__meta,
.record-replay-item,
.record-replay-item__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.installation-card__header strong,
.record-replay-item strong {
  color: #0f172a;
}

.installation-card__header p,
.record-replay-item p,
.record-replay-item__meta small {
  margin: 4px 0 0;
  color: #64748b;
  line-height: 1.65;
}

.installation-card__meta {
  flex-wrap: wrap;
}

.installation-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.installation-option {
  display: grid;
  gap: 8px;
}

.installation-option__title strong {
  color: #0f172a;
}

.installation-option__meta,
.installation-option__meta span {
  margin: 0;
  color: #64748b;
  font-size: 12px;
}

.overview-grid,
.service-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.service-grid--example-records {
  grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr);
}

.info-card,
.operation-panel {
  display: grid;
  gap: 14px;
}

.info-card header {
  margin-bottom: 0;
}

.info-card dl {
  display: grid;
  gap: 10px;
  margin: 0;
}

.info-card dl div {
  display: grid;
  gap: 4px;
}

.info-card dt {
  color: #475569;
  font-size: 12px;
}

.info-card dd {
  margin: 0;
  color: #0f172a;
  line-height: 1.7;
  word-break: break-all;
}

.example-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 18px;
  color: #334155;
  line-height: 1.75;
}

.example-timeline {
  margin-top: 4px;
}

.example-timeline :deep(.el-timeline-item__node) {
  background: linear-gradient(135deg, #0ea5e9, #0f172a);
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.12);
}

.example-timeline :deep(.el-timeline-item__timestamp) {
  color: #0369a1;
  font-weight: 600;
}

.example-timeline p {
  margin: 6px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.record-replay-list {
  display: grid;
  gap: 10px;
}

.record-replay-item {
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.82);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.record-replay-item:hover,
.record-replay-item.is-active {
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow: 0 12px 24px rgba(14, 165, 233, 0.1);
  transform: translateY(-1px);
}

.record-replay-item__meta {
  text-align: right;
}

.record-replay-item__meta span {
  color: #0f172a;
  font-size: 13px;
}

.code-console,
.log-console {
  overflow: hidden;
  border-radius: 18px;
  border: 1px solid rgba(59, 130, 246, 0.16);
  background:
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.16), transparent 34%),
    linear-gradient(180deg, #020617 0%, #111827 100%);
  color: #dbeafe;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.code-console pre,
.log-console pre {
  margin: 0;
  padding: 18px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  font-size: 13px;
  font-family:
    "JetBrains Mono",
    "Fira Code",
    "Cascadia Code",
    monospace;
}

.code-console--replay {
  min-height: 320px;
}

.code-console--replay pre {
  min-height: 320px;
}

.service-actions {
  justify-content: flex-start;
}

.stream-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
}

.stream-toolbar__select {
  min-width: 0;
  width: 100%;
}

.stream-toolbar__meta {
  grid-column: 1 / -1;
}

.watch-hint {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 12px;
}

.stream-alert {
  margin: 12px 0;
}

.config-editor {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.82);
}

.config-editor__textarea {
  width: 100%;
}

.config-editor :deep(.sc-code-editor) {
  height: 420px;
  border: 0;
}

.config-editor :deep(.CodeMirror) {
  height: 420px;
  font-size: 13px;
}

.watch-hint--config {
  margin-top: 10px;
}

.operation-panel__header strong {
  margin: 0;
  color: #0f172a;
}

.info-card :deep(.el-table),
.info-card :deep(.el-table__inner-wrapper),
.info-card :deep(.el-table__body-wrapper),
.info-card :deep(.el-scrollbar),
.overview-grid > *,
.service-grid > * {
  min-width: 0;
  width: 100%;
  max-width: 100%;
}

:deep(.el-tabs),
:deep(.el-tabs__content),
:deep(.el-tab-pane),
:deep(.el-table),
:deep(.el-table__inner-wrapper),
:deep(.el-scrollbar),
:deep(.el-scrollbar__view),
:deep(.el-textarea),
:deep(.el-textarea__inner) {
  max-width: 100%;
  min-width: 0;
}

:deep(.el-tabs) {
  overflow: hidden;
}

:deep(.el-tabs__content) {
  overflow-x: hidden;
}

:deep(.el-textarea__inner) {
  resize: vertical;
  box-sizing: border-box;
}

@media (max-width: 900px) {
  .installation-card-grid,
  .overview-grid,
  .service-grid,
  .stream-toolbar {
    grid-template-columns: 1fr;
  }

  .package-hero__main,
  .package-hero__title-row,
  .package-hero__actions,
  .switcher-header,
  .operation-panel__header {
    align-items: stretch;
  }
}
</style>
