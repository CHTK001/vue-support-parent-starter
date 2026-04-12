<template>
  <div class="server-page">
    <section
      v-loading="loading"
      class="server-layout"
      :class="{ 'is-sidebar-collapsed': sidebarCollapsed }"
    >
      <ServerHostSidebar
        :loading="loading"
        :entries="visibleHostEntries"
        :selected-id="selectedId"
        :collapsed="sidebarCollapsed"
        :keyword="sidebarKeyword"
        :filter="sidebarFilter"
        :soft-enabled="softEnabled"
        :filter-options="sidebarFilterOptions"
        :selection-mode="aggregateMode"
        :aggregate-ids="aggregateHostIds"
        @refresh="loadAll"
        @create="openCreate"
        @open-global-remote="openGlobalRemoteGateway"
        @open-global-alert="openGlobalAlertSettings"
        @toggle-aggregate-mode="toggleAggregateMode"
        @toggle-aggregate-host="toggleAggregateHostSelection"
        @open-aggregate-dashboard="openAggregateDashboard"
        @select="selectHost($event.serverId)"
        @edit="openEdit"
        @toggle-enabled="toggleEnabled"
        @open-soft="openSoftDrawer"
        @open-install="openInstallDialog"
        @open-remote="openRemoteConsole"
        @open-processes="openProcessDialog"
        @update:collapsed="sidebarCollapsed = $event"
        @update:keyword="sidebarKeyword = $event"
        @update:filter="sidebarFilter = $event"
        @contextmenu="openHostContextMenu"
      />

      <ServerHostBasicPanel
        :host="selectedHost"
        :snapshot="selectedSnapshot"
        :history="selectedMetricHistory"
        :runtime-detail="selectedMetricDetail"
        :remote-config="selectedRemoteGateway"
        :can-open-remote="canOpenRemoteConsole"
        :soft-enabled="softEnabled"
        :ai-enabled="aiEnabled"
        :ai-provider="serverCapabilities?.aiProvider"
        :ai-default-provider="serverCapabilities?.aiDefaultProvider"
        :ai-provider-count="serverCapabilities?.aiProviderCount"
        :ai-provider-names="serverCapabilities?.aiProviderNames"
        :ai-config-ready="serverCapabilities?.aiConfigReady"
        :ai-chat-client-ready="serverCapabilities?.aiChatClientReady"
        :ai-status-text="serverCapabilities?.aiStatusText"
        :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
        :ai-unavailable-code="serverCapabilities?.aiUnavailableCode"
        :ai-provider-resolved-from="serverCapabilities?.aiProviderResolvedFrom"
        :alert-settings="selectedHostAlertSettings"
        :alert-settings-enabled="selectedHostAlertSettings?.enabled !== false"
        :alert-message-enabled="
          selectedHostAlertSettings?.messageEnabled === true
        "
        :stability-ai-task="selectedHostAiAnalysis"
        :analyzing-stability="selectedHostAiAnalyzing"
        :latest-alerts="selectedHostAlerts"
        :can-auto-detect-services="serviceAutoDetectEnabled"
        :detecting-services="serviceDetecting"
        :software-summary="selectedHostSoftSummary"
        :services="selectedHostServerServices"
        :service-action-loading-key="serverServiceActionLoadingKey"
        @open-files="openFileDrawer()"
        @open-metrics-task="openMetricsTaskDialog"
        @open-alert-settings="
          selectedHost && openHostAlertSettings(selectedHost)
        "
        @open-install="selectedHost && openInstallDialog(selectedHost)"
        @open-soft="selectedHost && openSoftDrawer(selectedHost)"
        @open-dashboard="selectedHost && openDashboard(selectedHost)"
        @open-projects="selectedHost && openProjectManagement(selectedHost)"
        @open-processes="selectedHost && openProcessDialog(selectedHost)"
        @open-remote="openRemoteConsole()"
        @open-basic-detail="selectedHost && openHostOverview(selectedHost)"
        @open-remote-settings="
          selectedHost && openHostRemoteGateway(selectedHost)
        "
        @edit="selectedHost && openEdit(selectedHost)"
        @toggle-enabled="selectedHost && toggleEnabled(selectedHost)"
        @open-metric-detail="openMetricDetail"
        @create-service="selectedHost && openCreateService(selectedHost)"
        @service-action="runServerServiceAction"
        @service-ai-fix="runServerServiceAiFix"
        @view-service-logs="openServiceLogs"
        @edit-service="openServiceEditor"
        @detail-service="openServiceDetail"
        @detect-services="selectedHost && detectHostServices(selectedHost)"
        @analyze-stability="selectedHost && analyzeSelectedHostStability()"
        @open-alert-detail="openAlertDetail"
      />
    </section>
    <ServerHostContextMenu
      ref="hostContextMenuRef"
      :soft-enabled="softEnabled"
      @select="selectHost($event.serverId)"
      @edit="openEdit"
      @remove="removeHost"
      @toggle-enabled="toggleEnabled"
      @open-soft="openSoftDrawer"
      @open-install="openInstallDialog"
      @open-remote="openRemoteConsole"
      @open-processes="openProcessDialog"
      @open-files="openFileDrawer"
      @dashboard="openDashboard"
    />

    <el-drawer
      v-model="fileDrawerVisible"
      size="1220px"
      destroy-on-close
      :title="
        selectedHost ? `${selectedHost.serverName} · 文件管理` : '文件管理'
      "
    >
      <template v-if="selectedHost">
        <div class="server-file-toolbar">
          <div class="server-chip-group">
            <span class="server-chip"
              >当前目录 {{ fileDisplayCurrentPath }}</span
            >
            <span class="server-chip">{{ fileLiveStatus }}</span>
            <span class="server-chip">预览 {{ filePreviewLines }} 行</span>
            <span class="server-chip">根目录 ./</span>
          </div>
          <div class="server-action-row server-file-toolbar__actions">
            <el-radio-group v-model="fileViewMode" size="small">
              <el-radio-button value="list">列表</el-radio-button>
              <el-radio-button value="tree">树状</el-radio-button>
            </el-radio-group>
            <el-button
              v-if="canNavigateParentDirectory"
              circle
              @click="openParentDirectory"
            >
              <IconifyIconOnline icon="ri:arrow-up-line" />
            </el-button>
            <el-button circle @click="loadFiles()">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
            <el-button circle @click="createFolder">
              <IconifyIconOnline icon="ri:folder-add-line" />
            </el-button>
            <el-button circle @click="triggerUpload">
              <IconifyIconOnline icon="ri:upload-2-line" />
            </el-button>
            <el-button
              circle
              :type="fileWatchEnabled ? 'danger' : 'success'"
              @click="toggleFileWatch()"
            >
              <IconifyIconOnline
                :icon="
                  fileWatchEnabled ? 'ri:stop-circle-line' : 'ri:radar-line'
                "
              />
            </el-button>
          </div>
        </div>
        <input
          id="server-file-upload-input"
          :key="uploadInputKey"
          class="server-file-upload-input"
          type="file"
          @change="handleUpload"
        />
        <div class="server-file-grid">
          <div v-loading="fileLoading" class="server-file-list">
            <template v-if="fileViewMode === 'list'">
              <div
                v-for="entry in fileEntries"
                :key="entry.path"
                class="server-file-item"
                :class="{
                  'is-active': entry.path === filePreviewPath,
                  'is-directory': entry.directory,
                  'is-file': entry.file,
                }"
                @click="enterFileEntry(entry)"
              >
                <div class="server-file-item__main">
                  <span class="server-file-item__icon">
                    <IconifyIconOnline :icon="fileEntryIcon(entry)" />
                  </span>
                  <div>
                    <strong>{{ entry.name }}</strong>
                    <p>{{ toRelativeFilePath(entry.path, selectedHost) }}</p>
                    <p>
                      {{ formatFileSize(entry.size) }} ·
                      {{ formatFileTime(entry.lastModified) }}
                    </p>
                  </div>
                </div>
                <div class="server-action-row">
                  <el-button circle @click.stop="renameEntry(entry)">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                  <el-button
                    circle
                    :disabled="entry.directory"
                    @click.stop="downloadEntry(entry)"
                  >
                    <IconifyIconOnline icon="ri:download-2-line" />
                  </el-button>
                  <el-button
                    circle
                    type="danger"
                    plain
                    @click.stop="removeEntry(entry)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-6-line" />
                  </el-button>
                </div>
              </div>
              <el-empty
                v-if="!fileEntries.length"
                description="当前目录没有文件"
              />
            </template>
            <div v-else class="server-file-tree">
              <el-tree
                :data="fileTreeData"
                node-key="key"
                lazy
                highlight-current
                :expand-on-click-node="false"
                :load="loadFileTreeChildren"
                @node-click="handleFileTreeSelect"
              >
                <template #default="{ data }">
                  <div class="server-file-tree__node">
                    <span class="server-file-item__icon server-file-tree__icon">
                      <IconifyIconOnline
                        :icon="
                          data.directory
                            ? 'ri:folder-open-line'
                            : fileEntryIcon(data)
                        "
                      />
                    </span>
                    <div class="server-file-tree__meta">
                      <strong>{{ data.name }}</strong>
                      <p>{{ data.relativePath }}</p>
                    </div>
                  </div>
                </template>
              </el-tree>
              <el-empty
                v-if="!fileTreeData.length"
                description="当前根目录没有可展示的文件"
              />
            </div>
          </div>

          <div class="server-file-preview">
            <div class="server-file-preview__header">
              <div>
                <h4>{{ fileDisplayPreviewPath || "选择文件查看内容" }}</h4>
                <p>
                  {{
                    filePreview?.truncated
                      ? "当前内容为截断预览，暂不允许直接同步"
                      : fileDirty
                        ? "内容已修改，点击同步写回服务器"
                        : "支持文本编辑与日志实时追尾"
                  }}
                </p>
              </div>
              <div class="server-file-preview__header-actions">
                <span class="server-chip">{{
                  filePreview?.language || "text"
                }}</span>
                <el-button
                  v-if="fileDirty"
                  size="small"
                  plain
                  @click="resetFileDraft"
                >
                  还原
                </el-button>
                <el-button
                  v-if="fileDirty"
                  size="small"
                  type="primary"
                  :loading="fileSaving"
                  @click="saveFileDraft"
                >
                  同步
                </el-button>
              </div>
            </div>
            <div
              v-if="filePreviewPath"
              v-loading="fileContentLoading"
              class="server-file-preview__editor"
            >
              <ScCodeEditor
                v-model="fileDraftContent"
                :read-only="fileEditorReadonly"
                :height="'420px'"
                :mode="
                  resolveFileEditorMode(filePreview?.language, filePreviewPath)
                "
              />
            </div>
            <el-empty v-else description="选择左侧文件后在这里预览" />
          </div>
        </div>
      </template>
      <el-empty v-else description="请选择服务器后再查看文件管理" />
    </el-drawer>

    <ServerHostFormDialog
      v-model="dialogVisible"
      :editing-id="editingId"
      :form="form"
      :saving="saving"
      :code-preview="formServerCodePreview"
      :server-type-options="serverTypeOptions"
      :os-type-options="osTypeOptions"
      :architecture-options="architectureOptions"
      :tag-suggestions="hostTagSuggestions"
      @update:form="patchHostFormValues"
      @submit="submit"
    />

    <ServerHostOverviewDialog
      v-model="hostOverviewVisible"
      :host="selectedHost"
      :snapshot="selectedSnapshot"
      :runtime-detail="selectedMetricDetail"
      :soft-enabled="softEnabled"
      :ai-enabled="aiEnabled"
      :ai-provider="serverCapabilities?.aiProvider"
      :ai-default-provider="serverCapabilities?.aiDefaultProvider"
      :ai-provider-count="serverCapabilities?.aiProviderCount"
      :ai-provider-names="serverCapabilities?.aiProviderNames"
      :ai-config-ready="serverCapabilities?.aiConfigReady"
      :ai-chat-client-ready="serverCapabilities?.aiChatClientReady"
      :ai-status-text="serverCapabilities?.aiStatusText"
      :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
      :ai-unavailable-code="serverCapabilities?.aiUnavailableCode"
      :ai-provider-resolved-from="serverCapabilities?.aiProviderResolvedFrom"
    />

    <ServerServiceEditorDialog
      v-model="serviceEditorVisible"
      :form="serviceForm"
      :host="selectedHost"
      :saving="serviceEditorSaving"
      :generating="serviceEditorGenerating"
      :publishing="serviceEditorPublishing"
      :ai-enabled="aiEnabled"
      :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
      :execution-provider="serviceEditorExecutionProvider"
      :service-type-options="serviceTypeOptions"
      :template-options="serviceTemplateOptions"
      @update:form="patchServiceForm"
      @submit="submitServiceEditor"
      @publish-config="publishServiceConfig"
      @generate-ai-draft="generateServiceAiDraft"
      @apply-template="applyServiceTemplate"
    />

    <ServerServiceDetailDialog
      v-model="serviceDetailVisible"
      :service="selectedServiceDetail"
    />

    <el-drawer
      v-model="serviceLogsVisible"
      size="760px"
      destroy-on-close
      :title="
        serviceLogService
          ? `${serviceLogService.serviceName} · 启动日志`
          : '服务日志'
      "
    >
      <div v-loading="serviceLogLoading" class="server-service-log-drawer">
        <div class="server-service-log-drawer__toolbar">
          <div class="server-chip-group">
            <span class="server-chip">{{
              serviceLogService?.serviceType || "SERVER_SERVICE"
            }}</span>
            <span class="server-chip">{{
              serviceLogService?.installPath || "未配置安装目录"
            }}</span>
          </div>
          <el-button
            v-if="serviceLogService?.serverServiceId"
            plain
            @click="openServiceLogs(serviceLogService)"
          >
            <IconifyIconOnline icon="ri:refresh-line" />
            <span>刷新日志</span>
          </el-button>
        </div>

        <div v-if="serviceLogs.length" class="server-service-log-drawer__list">
          <article
            v-for="item in serviceLogs"
            :key="item.serverServiceOperationLogId"
            class="server-service-log-drawer__item"
          >
            <header>
              <div>
                <strong>{{
                  serverServiceActionLabelMap[
                    toServiceActionLabelKey(item.operationType)
                  ] ||
                  item.operationType ||
                  "操作"
                }}</strong>
                <p>{{ item.createTime || "-" }}</p>
              </div>
              <span class="server-chip">{{
                item.success ? "成功" : "失败"
              }}</span>
            </header>
            <p class="server-service-log-drawer__message">
              {{ item.operationMessage || "-" }}
            </p>
            <div
              v-if="item.aiReason || item.aiSolution"
              class="server-service-log-drawer__ai"
            >
              <p><span>原因</span>{{ item.aiReason || "-" }}</p>
              <p><span>方案</span>{{ item.aiSolution || "-" }}</p>
              <p v-if="item.knowledgeId">
                <span>知识库</span>#{{ item.knowledgeId }}
              </p>
              <p v-if="item.expireAt"><span>保留到</span>{{ item.expireAt }}</p>
            </div>
            <ScCodeEditor
              :model-value="item.operationOutput || ''"
              :read-only="true"
              height="180px"
              mode="shell"
            />
          </article>
        </div>
        <el-empty v-else description="当前服务还没有操作日志" />
      </div>
    </el-drawer>

    <el-drawer
      v-model="remoteConsoleVisible"
      size="min(84vw, 1280px)"
      destroy-on-close
      append-to-body
      class="server-remote-console"
      :class="{ 'is-fullscreen': remoteConsoleFullscreen }"
      :title="
        remoteConsoleHostName
          ? `${remoteConsoleHostName} · 远程控制`
          : '远程控制'
      "
      @closed="handleRemoteConsoleClosed"
    >
      <div ref="remoteConsoleContainerRef" class="server-remote-console__body">
        <div class="server-remote-console__toolbar">
          <div class="server-remote-console__meta">
            <div class="server-chip-group">
              <span class="server-chip">{{
                remoteConsoleConfig?.provider || "remote"
              }}</span>
              <span class="server-chip">{{
                remoteConsoleConfig?.protocol || "auto"
              }}</span>
              <span class="server-chip">{{
                remoteConsoleConfig?.connectionId || "-"
              }}</span>
            </div>
            <p class="server-remote-console__hint">
              {{
                remoteConsoleLaunchUrl
                  ? "右侧面板已加载远程入口，可直接全屏或新标签打开"
                  : remoteConsoleConfig?.message || "当前远程入口未返回可用地址"
              }}
            </p>
          </div>
          <div class="server-action-row">
            <el-tooltip
              v-if="remoteConsoleLaunchUrl"
              content="新标签页打开远程控制"
            >
              <el-button circle @click="openRemoteConsoleInNewTab">
                <IconifyIconOnline icon="ri:external-link-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip :content="remoteConsoleFullscreenTooltip">
              <el-button circle @click="toggleRemoteConsoleFullscreen">
                <IconifyIconOnline :icon="remoteConsoleFullscreenIcon" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="关闭远程面板">
              <el-button circle @click="remoteConsoleVisible = false">
                <IconifyIconOnline icon="ri:close-line" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
        <div
          v-loading="remoteConsoleLoading"
          class="server-remote-console__stage"
        >
          <iframe
            v-if="remoteConsoleConfig?.launchUrl"
            class="server-remote-console__frame"
            :src="remoteConsoleConfig.launchUrl"
            allowfullscreen
            @load="remoteConsoleLoading = false"
            @error="remoteConsoleLoading = false"
          />
          <el-empty
            v-else
            :description="
              remoteConsoleConfig?.message || '当前远程入口未返回可用地址'
            "
          />
        </div>
      </div>
    </el-drawer>

    <ServerRemoteGatewayDialog
      v-model="globalRemoteGatewayVisible"
      title="全局远程代理"
      description="为服务器管理统一设置默认远程代理入口，未单独覆盖的服务器都会继承这里。"
      :saving="remoteGatewaySaving"
      :form="globalRemoteGatewayForm"
      :provider-options="remoteGatewayProviderOptions"
      :protocol-options="remoteGatewayProtocolOptions"
      @update:form="patchRemoteGatewayForm(globalRemoteGatewayForm, $event)"
      @submit="submitGlobalRemoteGateway"
    />

    <ServerRemoteGatewayDialog
      v-model="hostRemoteGatewayVisible"
      :title="hostRemoteGatewayTitle"
      description="当前服务器可以继承全局远程代理，也可以覆盖成自己的独立入口。"
      :saving="remoteGatewaySaving"
      :form="hostRemoteGatewayForm"
      :provider-options="remoteGatewayProviderOptions"
      :protocol-options="remoteGatewayProtocolOptions"
      show-inherit
      @update:form="patchRemoteGatewayForm(hostRemoteGatewayForm, $event)"
      @submit="submitHostRemoteGateway"
    />

    <ServerAlertSettingsDialog
      v-model="globalAlertSettingsVisible"
      title="全局预警设置"
      description="全局阈值会作为服务器默认预警规则，未单独覆盖的服务器会直接继承。"
      :form="globalAlertSettingsForm"
      :saving="alertSettingsSaving"
      @update:form="
        patchAlertSettingsFormValues(globalAlertSettingsForm, $event)
      "
      @submit="submitGlobalAlertSettings"
    />

    <ServerAlertSettingsDialog
      v-model="hostAlertSettingsVisible"
      :title="hostAlertSettingsTitle"
      description="为当前服务器覆盖 CPU、内存、磁盘、IO、延迟阈值，命中后会实时推送告警。"
      :form="hostAlertSettingsForm"
      :saving="alertSettingsSaving"
      show-inherit
      @update:form="patchAlertSettingsFormValues(hostAlertSettingsForm, $event)"
      @submit="submitHostAlertSettings"
    />

    <ServerMetricDetailDialog
      v-model="metricDetailVisible"
      :metric-key="metricDetailKey"
      :host="selectedHost"
      :snapshot="selectedSnapshot"
      :history="selectedMetricHistory"
      :detail="selectedMetricDetail"
      :alert-settings="selectedHostAlertSettings"
      :ai-enabled="aiEnabled"
      :ai-analyzing-key="metricHistoryAiAnalyzingKey"
      :ai-advice-map="metricHistoryAiMap"
      :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
      @change-history-range="handleMetricHistoryRangeChange"
      @analyze-history="analyzeMetricHistory"
    />

    <ServerMetricsTaskDialog
      v-model="metricsTaskVisible"
      :form="metricsTaskSettings"
      :saving="metricsTaskSaving"
      @submit="submitMetricsTaskSettings"
      @refresh-now="refreshMetricsTaskNow"
    />

    <ServerAlertDetailDialog
      v-model="alertDetailVisible"
      :alert="selectedAlertDetail"
      :history="selectedAlertHistory"
      :ai-enabled="aiEnabled"
      :ai-analyzing-key="alertHistoryAiAnalyzingKey"
      :ai-advice-map="alertHistoryAiMap"
      :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
      @select-alert="selectedAlertDetail = $event"
      @analyze-history="analyzeAlertHistory"
    />

    <ServerProcessDialog
      v-model="processDialogVisible"
      :host="selectedHost"
      :processes="serverProcesses"
      :selected-process="selectedProcessItem"
      :loading="processLoading"
      :keyword="processKeyword"
      :auto-refresh="processAutoRefresh"
      :refreshed-at="processRefreshedAt"
      :stream-connected="processStream.connected.value"
      :stream-last-event-at="processStream.lastEventAt.value"
      :ai-enabled="aiEnabled"
      :ai-unavailable-reason="serverCapabilities?.aiUnavailableReason"
      :ai-analyzing="processAiAnalyzing"
      :ai-advice="selectedProcessAiAdvice"
      :action-loading-key="processActionLoadingKey"
      @update:keyword="processKeyword = $event"
      @update:auto-refresh="processAutoRefresh = $event"
      @refresh="loadHostProcesses()"
      @select-process="selectProcessItem"
      @analyze-process="analyzeProcessItem"
      @terminate-process="terminateProcessItem"
    />

    <el-drawer
      v-model="softDrawerVisible"
      size="620px"
      destroy-on-close
      :title="
        softDrawerHost
          ? `${softDrawerHost.serverName} 的软件驾驶舱`
          : '软件驾驶舱'
      "
    >
      <ScScrollbar v-loading="softLoading" class="soft-drawer__scroll">
        <template v-if="softDrawerHost && softEnabled">
          <div class="server-action-row soft-drawer__toolbar">
            <el-button
              type="primary"
              plain
              @click="openInstallDialog(softDrawerHost)"
            >
              <IconifyIconOnline icon="ri:download-cloud-2-line" />
              <span>安装软件</span>
            </el-button>
          </div>

          <div class="soft-drawer__stats">
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerTargets.length }}</strong>
              <span>绑定目标</span>
            </div>
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerInstallations.length }}</strong>
              <span>软件实例</span>
            </div>
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerServerServices.length }}</strong>
              <span>服务器服务</span>
            </div>
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerOperations.length }}</strong>
              <span>最近操作</span>
            </div>
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerBackupCount }}</strong>
              <span>备份点</span>
            </div>
            <div class="soft-drawer__stat">
              <strong>{{ softDrawerUpgradeableCount }}</strong>
              <span>可升级</span>
            </div>
          </div>

          <article class="soft-drawer__card">
            <header>
              <h3>软件实例</h3>
              <p>服务实例、备份点和升级候选都会在这里收口</p>
            </header>
            <div
              v-if="softDrawerInstallations.length"
              class="soft-drawer__list"
            >
              <button
                v-for="item in softDrawerInstallations"
                :key="item.softInstallationId"
                type="button"
                class="soft-drawer__item"
                @click="openInstallationDetail(item)"
              >
                <div>
                  <strong>{{
                    item.packageName || item.installationName
                  }}</strong>
                  <p>
                    {{ item.installationName }} /
                    {{
                      item.versionName || item.installedVersion || "默认版本"
                    }}
                  </p>
                  <div class="soft-drawer__item-chips">
                    <span class="server-chip">
                      备份点 {{ getInstallationBackupCount(item) }}
                    </span>
                    <span class="server-chip">
                      {{ getInstallationUpgradeText(item) }}
                    </span>
                  </div>
                </div>
                <div class="soft-drawer__item-meta">
                  <span>{{
                    softStatusLabel(item.runtimeStatus || item.installStatus)
                  }}</span>
                  <small>{{ item.serviceName || "未配置服务名" }}</small>
                </div>
              </button>
            </div>
            <el-empty v-else description="当前服务器还没有 soft 安装实例" />
          </article>

          <article class="soft-drawer__card">
            <header>
              <h3>服务器服务</h3>
              <p>服务主档已下沉到服务器模块，可选关联软件安装。</p>
            </header>
            <div
              v-if="softDrawerServerServices.length"
              class="soft-drawer__list"
            >
              <div
                v-for="item in softDrawerServerServices"
                :key="
                  item.serverServiceId || item.serviceCode || item.serviceName
                "
                class="soft-drawer__item soft-drawer__item--static soft-drawer__service-card"
              >
                <div class="soft-drawer__service-body">
                  <div>
                    <strong>{{ item.serviceName }}</strong>
                    <p>
                      {{ item.serviceType || "SERVER_SERVICE" }} /
                      {{ item.installPath || "未配置安装目录" }}
                    </p>
                    <div class="soft-drawer__item-chips">
                      <span class="server-chip">
                        {{
                          item.softInstallationId
                            ? `安装实例 #${item.softInstallationId}`
                            : "独立服务器服务"
                        }}
                      </span>
                      <span v-if="item.softPackageId" class="server-chip">
                        软件 #{{ item.softPackageId }}
                      </span>
                    </div>
                  </div>
                  <div class="soft-drawer__item-meta">
                    <span>{{ softStatusLabel(item.runtimeStatus) }}</span>
                    <small>{{
                      item.lastOperationMessage || "服务器服务主档"
                    }}</small>
                  </div>
                </div>
                <div class="soft-drawer__service-actions">
                  <el-tooltip content="状态检查">
                    <el-button
                      circle
                      plain
                      :loading="isServerServiceActionLoading(item, 'status')"
                      @click="runServerServiceAction(item, 'status')"
                    >
                      <IconifyIconOnline icon="ri:pulse-line" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    :content="
                      isServerServiceRunning(item) ? '停止服务' : '启动服务'
                    "
                  >
                    <el-button
                      circle
                      plain
                      :type="
                        isServerServiceRunning(item) ? 'danger' : 'success'
                      "
                      :loading="
                        isServerServiceActionLoading(
                          item,
                          isServerServiceRunning(item) ? 'stop' : 'start',
                        )
                      "
                      @click="
                        runServerServiceAction(
                          item,
                          isServerServiceRunning(item) ? 'stop' : 'start',
                        )
                      "
                    >
                      <IconifyIconOnline
                        :icon="
                          isServerServiceRunning(item)
                            ? 'ri:stop-circle-line'
                            : 'ri:play-circle-line'
                        "
                      />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="重启服务">
                    <el-button
                      circle
                      plain
                      :loading="isServerServiceActionLoading(item, 'restart')"
                      @click="runServerServiceAction(item, 'restart')"
                    >
                      <IconifyIconOnline icon="ri:restart-line" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    v-if="hasServerServiceRegisterScript(item)"
                    content="注册服务"
                  >
                    <el-button
                      circle
                      plain
                      :loading="isServerServiceActionLoading(item, 'register')"
                      @click="runServerServiceAction(item, 'register')"
                    >
                      <IconifyIconOnline icon="ri:shield-check-line" />
                    </el-button>
                  </el-tooltip>
                  <el-tooltip
                    v-if="hasServerServiceUnregisterScript(item)"
                    content="取消注册"
                  >
                    <el-button
                      circle
                      plain
                      type="warning"
                      :loading="
                        isServerServiceActionLoading(item, 'unregister')
                      "
                      @click="runServerServiceAction(item, 'unregister')"
                    >
                      <IconifyIconOnline icon="ri:shield-cross-line" />
                    </el-button>
                  </el-tooltip>
                </div>
              </div>
            </div>
            <el-empty v-else description="当前服务器没有已绑定的服务器服务" />
          </article>

          <article class="soft-drawer__card">
            <header>
              <h3>最近操作</h3>
              <p>最近 8 条软件操作，便于直接从服务器视角看安装与服务动作</p>
            </header>
            <div v-if="softDrawerOperations.length" class="soft-drawer__list">
              <div
                v-for="item in softDrawerOperations.slice(0, 8)"
                :key="item.softOperationLogId"
                class="soft-drawer__item soft-drawer__item--static"
              >
                <div>
                  <strong>{{ softOperationLabel(item.operationType) }}</strong>
                  <p>
                    {{ item.detailMessage || item.operationMessage || "-" }}
                  </p>
                </div>
                <div class="soft-drawer__item-meta">
                  <span>{{ softStatusLabel(item.operationStatus) }}</span>
                  <small>{{ item.endTime || item.startTime || "-" }}</small>
                </div>
              </div>
            </div>
            <el-empty v-else description="当前服务器没有相关操作记录" />
          </article>
        </template>

        <el-empty
          v-else
          description="soft 模块未启用，无法展示服务器的软件与服务"
        />
      </ScScrollbar>
    </el-drawer>

    <el-dialog
      v-model="installVisible"
      width="1120px"
      :title="installHost ? `安装软件到 ${installHost.serverName}` : '安装软件'"
    >
      <el-steps :active="installStep" simple class="install-steps">
        <el-step title="选择软件" />
        <el-step title="选择版本与引导配置" />
        <el-step title="提交与日志" />
      </el-steps>

      <section v-if="installStep === 0" class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>当前服务器</h3>
            <p>软件列表已按当前服务器的操作系统、架构和启用状态过滤</p>
          </header>
          <div class="server-chip-group">
            <span class="server-chip">{{
              installHost?.serverName || "-"
            }}</span>
            <span class="server-chip">{{ hostAddress(installHost) }}</span>
            <span class="server-chip">
              {{ osLabel(installHost?.osType) }} /
              {{ archLabel(installHost?.architecture) }}
            </span>
          </div>
        </article>

        <article class="server-detail-card">
          <header>
            <h3>选择软件</h3>
            <p>这里只展示当前服务器可安装的软件。</p>
          </header>
          <ScSelect
            v-model="installPackageId"
            :options="installPackageOptions"
            layout="list"
            width="100%"
            list-height="320px"
            list-placeholder="搜索软件名称、编码或分类"
            list-empty-text="当前服务器没有匹配的软件"
          >
            <template #content="{ option }">
              <div class="server-install-option">
                <strong>{{ option.label }}</strong>
                <span>
                  {{ option.packageCode }} ·
                  {{ option.packageCategory || "未分类" }}
                </span>
                <small>
                  {{ option.description || "可直接进入版本与引导配置。" }}
                </small>
              </div>
            </template>
          </ScSelect>
        </article>
      </section>

      <section v-else-if="installStep === 1" class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>选择版本</h3>
            <p>默认选最新版本，可切换并补充安装引导参数。</p>
          </header>

          <div class="server-form-grid">
            <el-form-item label="软件版本">
              <el-select
                v-model="installForm.softPackageVersionId"
                placeholder="选择版本"
                style="width: 100%"
              >
                <el-option
                  v-for="version in installVersions"
                  :key="version.softPackageVersionId"
                  :label="`${version.versionName} (${version.versionCode})`"
                  :value="version.softPackageVersionId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="实例名称">
              <ScInput v-model="installForm.installationName" />
            </el-form-item>
            <el-form-item label="安装路径">
              <ScInput v-model="installForm.installPath" />
            </el-form-item>
            <el-form-item label="服务名称">
              <ScInput v-model="installForm.serviceName" />
            </el-form-item>
          </div>
        </article>

        <div v-if="installGuideLoading" class="server-install-loading">
          <el-skeleton :rows="10" animated />
        </div>
        <template v-else>
          <article
            v-for="section in installGuideSections"
            :key="section.key"
            class="server-detail-card"
          >
            <header>
              <h3>{{ section.title }}</h3>
              <p>{{ section.hint }}</p>
            </header>

            <div class="server-form-grid">
              <el-form-item
                v-for="field in section.fields"
                :key="`${section.key}-${field.fieldKey}`"
                :label="field.fieldLabel || field.fieldKey"
                :class="{
                  'server-form-grid__span-2': isInstallTextareaField(field),
                }"
              >
                <el-switch
                  v-if="isInstallBooleanField(field)"
                  :model-value="
                    Boolean(resolveInstallModel(section.scope)[field.fieldKey])
                  "
                  @change="
                    updateInstallBoolean(section.scope, field.fieldKey, $event)
                  "
                />
                <ScInput
                  v-else-if="isInstallNumberField(field)"
                  v-model="resolveInstallModel(section.scope)[field.fieldKey]"
                  type="number"
                  layout="stepper"
                  :min="numberValidation(field.validation, 'min')"
                  :max="numberValidation(field.validation, 'max')"
                />
                <ScInput
                  v-else-if="isInstallTextareaField(field)"
                  v-model="resolveInstallModel(section.scope)[field.fieldKey]"
                  type="textarea"
                  :rows="4"
                />
                <ScInput
                  v-else
                  v-model="resolveInstallModel(section.scope)[field.fieldKey]"
                  :type="isInstallPasswordField(field) ? 'password' : 'text'"
                  passwd-strong="none"
                />
                <small class="server-install-field__hint">
                  {{ field.fieldDescription || "按当前软件画像动态生成" }}
                </small>
              </el-form-item>
            </div>
          </article>
        </template>
      </section>

      <section v-else class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>提交安装</h3>
            <p>安装提交后会直接跳转到对应软件实例详情页继续查看日志和控制。</p>
          </header>

          <div class="server-chip-group">
            <span class="server-chip">{{
              installHost?.serverName || "-"
            }}</span>
            <span class="server-chip">{{
              installSelectedPackage?.packageName || "-"
            }}</span>
            <span class="server-chip">{{ installSelectedVersionLabel }}</span>
          </div>

          <el-alert
            v-if="installTask"
            :title="installTask.message || '安装任务已提交'"
            type="success"
            :closable="false"
          />
          <el-empty v-else description="确认无误后提交安装。" />
        </article>
      </section>

      <template #footer>
        <el-button v-if="installStep > 0" @click="installStep -= 1">
          上一步
        </el-button>
        <el-button @click="installVisible = false">取消</el-button>
        <el-button
          v-if="installStep === 0"
          type="primary"
          :disabled="!normalizedInstallPackageId"
          @click="goInstallVersionStep"
        >
          下一步
        </el-button>
        <el-button
          v-else-if="installStep === 1"
          type="primary"
          :loading="installSubmitting"
          @click="submitInstallFromServer"
        >
          提交安装
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { taskCenterProvider } from "@layout/default";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { message } from "@repo/utils";
import {
  analyzeServerHostProcess,
  analyzeServerHostMetricHistory,
  analyzeServerHostAlertHistory,
  aiFixStartServerService,
  analyzeServerHostStability,
  createServerService,
  createServerHost,
  createServerDirectory,
  deleteServerHost,
  deleteServerFile,
  detectServerHostServices,
  downloadServerFile,
  getServerAlertSettings,
  getServerCapabilities,
  getServerHostAlertSettings,
  getServerHostMetricsDetail,
  getServerHostMetricsTaskSettings,
  getServerHostRemoteGateway,
  getServerHostMetrics,
  getServerHostMetricsHistory,
  getServerHostRemoteConsoleConfig,
  getServerMetricsTaskSettings,
  getServerRemoteGatewaySettings,
  generateServerServiceAiDraft,
  getServerServiceStatus,
  getServerServiceOperationLogs,
  listServerHosts,
  listServerFiles,
  listServerAlerts,
  listServerHostProcesses,
  listServerServices,
  listServerSoftInstallations,
  listServerSoftOperations,
  listSoftBindingTargets,
  readServerFileContent,
  refreshServerHostMetrics,
  registerServerService,
  renameServerFile,
  restartServerService,
  startServerService,
  startServerFileWatch,
  stopServerService,
  stopServerFileWatch,
  terminateServerHostProcess,
  unregisterServerService,
  updateServerAlertSettings,
  updateServerHost,
  updateServerHostEnabled,
  updateServerHostAlertSettings,
  updateServerHostMetricsTaskSettings,
  updateServerHostRemoteGateway,
  updateServerMetricsTaskSettings,
  updateServerRemoteGatewaySettings,
  updateServerService,
  uploadServerFile,
  writeServerFileContent,
  writeServerServiceConfig,
  type ServerAiTaskPayload,
  type ServerAiTaskTicket,
  type ServerAlertEvent,
  type ServerAlertSettings,
  type ServerCapabilityView,
  type ServerFileContent,
  type ServerFileEntry,
  type ServerFileWatchTicket,
  type ServerHost,
  type ServerMetricsDetail,
  type ServerMetricsSnapshot,
  type ServerMetricsTaskSettings,
  type ServerProcessAiAdvice,
  type ServerProcessView,
  type ServerRemoteConsoleConfig,
  type ServerRemoteGatewaySettings,
  type ServerService,
  type ServerServiceAiDraft,
  type ServerServiceCommandResult,
  type ServerServiceOperationLog,
  type ServerSoftBindingTarget,
  type ServerSoftInstallation,
  type ServerSoftOperation,
} from "../api";
import {
  createSoftTarget,
  getSoftInstallationDetail,
  getSoftPackageDetail,
  getSoftVersionGuide,
  installSoftPackage,
  listSoftPackages,
  updateSoftTarget,
  type SoftGuideField,
  type SoftInstallationDetail,
  type SoftInstallRequest,
  type SoftPackage,
  type SoftPackageDetail,
  type SoftPackageGuide,
  type SoftPackageVersion,
  type SoftTarget,
} from "../../../soft/src/api";
import { useServerAiTaskStream } from "../composables/useServerAiTaskStream";
import { useServerAlertStream } from "../composables/useServerAlertStream";
import { useServerFileLogStream } from "../composables/useServerFileLogStream";
import { useServerMetricsStream } from "../composables/useServerMetricsStream";
import { useServerProcessStream } from "../composables/useServerProcessStream";
import { useServerServiceStream } from "../composables/useServerServiceStream";
import ScInput from "@repo/components/ScInput/index.vue";
import ServerAlertSettingsDialog from "../components/ServerAlertSettingsDialog.vue";
import ServerAlertDetailDialog from "../components/ServerAlertDetailDialog.vue";
import ServerHostBasicPanel from "../components/ServerHostBasicPanel.vue";
import ServerHostCard from "../components/ServerHostCard.vue";
import ServerHostContextMenu from "../components/ServerHostContextMenu.vue";
import ServerHostFormDialog from "../components/ServerHostFormDialog.vue";
import ServerHostOverviewDialog from "../components/ServerHostOverviewDialog.vue";
import ServerRemoteGatewayDialog from "../components/ServerRemoteGatewayDialog.vue";
import ServerServiceEditorDialog from "../components/ServerServiceEditorDialog.vue";
import ServerServiceDetailDialog from "../components/ServerServiceDetailDialog.vue";
import ServerHostSidebar from "../components/ServerHostSidebar.vue";
import ServerMetricDetailDialog from "../components/ServerMetricDetailDialog.vue";
import ServerMetricsTaskDialog from "../components/ServerMetricsTaskDialog.vue";
import ServerProcessDialog from "../components/ServerProcessDialog.vue";
import {
  buildAlertHistoryAiFilterKey,
  buildMetricHistoryAiFilterKey,
} from "../utils/historyAi";
import type {
  RemoteGatewayFormModel,
  SelectOption,
  ServerHostListEntry,
} from "../components/server-types";
import {
  archLabel,
  buildServerCodeFromHost,
  formatLatency,
  formatMetricPercent,
  hostAddress,
  hostAvatarIcon,
  metricDotClass,
  metricToneClass,
  normalizeArch,
  normalizeOs,
  normalizeText,
  osIcon,
  osLabel,
  serverTypeLabel,
} from "../utils/serverHost";

const toNumericId = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
};

type GuideScope = "install" | "service" | "config";

type GuideSection = {
  key: string;
  title: string;
  hint: string;
  scope: GuideScope;
  fields: SoftGuideField[];
};

type ServerInstallTask = {
  operationId?: number;
  installationId?: number;
  status?: string;
  stage?: string;
  progressPercent?: number;
  message?: string;
};

type ServerMetadata = Record<string, unknown>;
type ServerServiceAction =
  | "register"
  | "unregister"
  | "start"
  | "stop"
  | "restart"
  | "status"
  | "ai-fix"
  | "config-write";
type RunnableServerServiceAction = Exclude<ServerServiceAction, "config-write">;
type MetricDetailKey = "cpu" | "memory" | "disk" | "io";
type FileViewMode = "list" | "tree";
type ServerFileTreeNode = {
  key: string;
  name: string;
  label: string;
  path: string;
  relativePath: string;
  directory: boolean;
  file: boolean;
  leaf: boolean;
  extension?: string;
};

const router = useRouter();
const aiTaskStream = useServerAiTaskStream();
const alertStream = useServerAlertStream();
const metricsStream = useServerMetricsStream();
const fileLogStream = useServerFileLogStream();
const processStream = useServerProcessStream();
const serviceStream = useServerServiceStream();

const loading = ref(false);
const saving = ref(false);
const softLoading = ref(false);
const fileLoading = ref(false);
const fileContentLoading = ref(false);
const serviceDetecting = ref(false);
const hostStabilityAnalyzingId = ref<number | null>(null);
const serviceEditorVisible = ref(false);
const serviceEditorSaving = ref(false);
const serviceEditorGenerating = ref(false);
const serviceEditorPublishing = ref(false);
const hostOverviewVisible = ref(false);
const serviceDetailVisible = ref(false);
const serviceLogsVisible = ref(false);
const serviceLogLoading = ref(false);
const processDialogVisible = ref(false);
const processLoading = ref(false);
const processAiAnalyzing = ref(false);
const dialogVisible = ref(false);
const fileDrawerVisible = ref(false);
const softDrawerVisible = ref(false);
const installVisible = ref(false);
const globalRemoteGatewayVisible = ref(false);
const hostRemoteGatewayVisible = ref(false);
const globalAlertSettingsVisible = ref(false);
const hostAlertSettingsVisible = ref(false);
const serverServiceActionLoadingKey = ref("");
const remoteGatewaySaving = ref(false);
const alertSettingsSaving = ref(false);
const editingId = ref<number | null>(null);
const selectedId = ref<number | null>(null);
const softDrawerHostId = ref<number | null>(null);
const installHostId = ref<number | null>(null);
const installPackageId = ref<number | null>(null);
const softEnabled = ref(false);
const installGuideLoading = ref(false);
const installSubmitting = ref(false);
const installStep = ref(0);
const sidebarCollapsed = ref(false);
const sidebarKeyword = ref("");
const sidebarFilter = ref("ALL");
const aggregateMode = ref(false);
const aggregateHostIds = ref<number[]>([]);
const fileViewMode = ref<FileViewMode>("list");
const fileCurrentPath = ref("");
const filePreviewPath = ref("");
const fileWatchEnabled = ref(false);
const fileSaving = ref(false);
const fileLiveStatus = ref("未建立追尾");
const fileWatchTicket = ref<ServerFileWatchTicket | null>(null);
const selectedRemoteGateway = ref<ServerRemoteConsoleConfig | null>(null);
const filePreview = ref<ServerFileContent | null>(null);
const fileEntries = ref<ServerFileEntry[]>([]);
const fileDraftContent = ref("");
const fileOriginalContent = ref("");
const fileTreeData = ref<ServerFileTreeNode[]>([]);
const fileLogLineCount = ref(0);
const uploadInputKey = ref(0);
const remoteConsoleVisible = ref(false);
const remoteConsoleLoading = ref(false);
const remoteConsoleConfig = ref<ServerRemoteConsoleConfig | null>(null);
const remoteConsoleHostName = ref("");
const remoteConsoleFullscreen = ref(false);
const remoteConsoleContainerRef = ref<HTMLElement | null>(null);
const hostContextMenuRef = ref<{
  open: (event: MouseEvent, entry: ServerHostListEntry) => void;
} | null>(null);
const handledAiTaskStateKeys = new Set<string>();

const serverCapabilities = ref<ServerCapabilityView | null>(null);
const alertEventMap = ref<Record<number, ServerAlertEvent>>({});
const hostAiAnalysisMap = ref<Record<number, ServerAiTaskPayload>>({});
const metricHistoryAiMap = ref<Record<string, ServerAiTaskPayload>>({});
const alertHistoryAiMap = ref<Record<string, ServerAiTaskPayload>>({});
const globalAlertSettings = ref<ServerAlertSettings | null>(null);
const selectedHostAlertSettings = ref<ServerAlertSettings | null>(null);
const selectedAlertDetail = ref<ServerAlertEvent | null>(null);
const selectedAlertHistory = ref<ServerAlertEvent[]>([]);
const hosts = ref<ServerHost[]>([]);
const serverServices = ref<ServerService[]>([]);
const serviceLogs = ref<ServerServiceOperationLog[]>([]);
const serviceLogService = ref<ServerService | null>(null);
const selectedServiceDetail = ref<ServerService | null>(null);
const softTargets = ref<ServerSoftBindingTarget[]>([]);
const softInstallations = ref<ServerSoftInstallation[]>([]);
const softOperations = ref<ServerSoftOperation[]>([]);
const installPackages = ref<SoftPackage[]>([]);
const installVersions = ref<SoftPackageVersion[]>([]);
const installGuide = ref<SoftPackageGuide | null>(null);
const installTask = ref<ServerInstallTask | null>(null);
const softInstallationDetailMap = ref<Record<number, SoftInstallationDetail>>(
  {},
);
const softPackageDetailMap = ref<Record<number, SoftPackageDetail>>({});
const installVersionCache = new Map<number, SoftPackageVersion[]>();
const serverMetricsMap = ref<Record<number, ServerMetricsSnapshot>>({});
const alertDetailVisible = ref(false);
const serverMetricsHistoryMap = ref<Record<number, ServerMetricsSnapshot[]>>(
  {},
);
const serverMetricsDetailMap = ref<Record<number, ServerMetricsDetail>>({});
const installOptions = reactive<Record<string, unknown>>({});
const installServiceOptions = reactive<Record<string, unknown>>({});
const installConfigOptions = reactive<Record<string, unknown>>({});
const globalRemoteGatewayForm = reactive<RemoteGatewayFormModel>({
  enabled: false,
  provider: "guacamole",
  gatewayUrl: "",
  protocol: "",
  launchPath: "",
  websocketPath: "",
  connectionId: "",
});
const hostRemoteGatewayForm = reactive<RemoteGatewayFormModel>({
  inheritGlobal: true,
  enabled: false,
  provider: "guacamole",
  gatewayUrl: "",
  protocol: "",
  launchPath: "",
  websocketPath: "",
  connectionId: "",
});
const globalAlertSettingsForm = reactive<ServerAlertSettings>({
  enabled: true,
  messageEnabled: false,
  cpuWarningPercent: 75,
  cpuDangerPercent: 90,
  memoryWarningPercent: 75,
  memoryDangerPercent: 90,
  diskWarningPercent: 80,
  diskDangerPercent: 92,
  ioWarningBytesPerSecond: 50 * 1024 * 1024,
  ioDangerBytesPerSecond: 120 * 1024 * 1024,
  latencyWarningMs: 120,
  latencyDangerMs: 250,
});
const hostAlertSettingsForm = reactive<ServerAlertSettings>({
  inheritGlobal: true,
  enabled: true,
  messageEnabled: false,
  cpuWarningPercent: 75,
  cpuDangerPercent: 90,
  memoryWarningPercent: 75,
  memoryDangerPercent: 90,
  diskWarningPercent: 80,
  diskDangerPercent: 92,
  ioWarningBytesPerSecond: 50 * 1024 * 1024,
  ioDangerBytesPerSecond: 120 * 1024 * 1024,
  latencyWarningMs: 120,
  latencyDangerMs: 250,
});
const installForm = reactive<SoftInstallRequest>({
  softPackageId: 0,
  softPackageVersionId: 0,
  softTargetId: 0,
  installationName: "",
  installPath: "",
  serviceName: "",
  installOptions,
  serviceOptions: installServiceOptions,
  configOptions: installConfigOptions,
});
const metricDetailVisible = ref(false);
const metricDetailKey = ref<MetricDetailKey | null>(null);
const metricHistoryAiAnalyzingKey = ref("");
const alertHistoryAiAnalyzingKey = ref("");
const metricsTaskVisible = ref(false);
const metricsTaskSaving = ref(false);
const metricsTaskSettings = ref<ServerMetricsTaskSettings | null>(null);
const processKeyword = ref("");
const processAutoRefresh = ref(true);
const processRefreshedAt = ref<number | null>(null);
const processActionLoadingKey = ref("");
const processSelectedPid = ref<number | null>(null);
const serverProcesses = ref<ServerProcessView[]>([]);
const selectedProcessAiAdvice = ref<ServerProcessAiAdvice | null>(null);
let processRefreshTimer: ReturnType<typeof setInterval> | null = null;
let processSearchTimer: ReturnType<typeof setTimeout> | null = null;

const normalizeProcessKeyword = (value?: string | null) =>
  String(value || "")
    .trim()
    .toLowerCase();

const serverTypeOptions: SelectOption[] = [
  {
    label: "本机",
    value: "LOCAL",
    icon: "ri:computer-line",
    description: "当前宿主机直接执行",
  },
  {
    label: "SSH",
    value: "SSH",
    icon: "ri:terminal-box-line",
    description: "Linux / Unix 远程连接",
  },
  {
    label: "WinRM",
    value: "WINRM",
    icon: "ri:windows-line",
    description: "Windows 远程连接",
  },
];
const osTypeOptions: SelectOption[] = [
  {
    label: "Windows",
    value: "windows",
    icon: "ri:windows-line",
    description: "Windows 服务器",
  },
  {
    label: "Linux",
    value: "linux",
    icon: "ri:ubuntu-line",
    description: "Linux 服务器",
  },
  {
    label: "macOS",
    value: "macos",
    icon: "ri:apple-fill",
    description: "macOS 主机",
  },
];
const architectureOptions: SelectOption[] = [
  {
    label: "AMD64",
    value: "amd64",
    icon: "ri:cpu-line",
    description: "x86_64 / amd64",
  },
  {
    label: "ARM64",
    value: "arm64",
    icon: "ri:cpu-fill",
    description: "aarch64 / arm64",
  },
];
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
const remoteGatewayProviderOptions: SelectOption[] = [
  {
    label: "Guacamole",
    value: "guacamole",
    icon: "ri:route-line",
    description: "当前默认远程网关实现，保留现有连接与代理兼容能力",
  },
];
const sidebarFilterOptions: SelectOption[] = [
  {
    label: "全部",
    value: "ALL",
    icon: "ri:apps-2-line",
    description: "显示全部服务器",
  },
  {
    label: "本机",
    value: "LOCAL",
    icon: "ri:home-5-line",
    description: "只看本机服务器",
  },
  {
    label: "远程",
    value: "REMOTE",
    icon: "ri:global-line",
    description: "只看远程服务器",
  },
  {
    label: "启用",
    value: "ENABLED",
    icon: "ri:checkbox-circle-line",
    description: "只看启用服务器",
  },
  {
    label: "停用",
    value: "DISABLED",
    icon: "ri:pause-circle-line",
    description: "只看停用服务器",
  },
  {
    label: "Windows",
    value: "WINDOWS",
    icon: "ri:windows-line",
    description: "只看 Windows 服务器",
  },
  {
    label: "Linux",
    value: "LINUX",
    icon: "ri:ubuntu-line",
    description: "只看 Linux 服务器",
  },
];
const remoteGatewayProtocolOptions: SelectOption[] = [
  {
    label: "自动选择",
    value: "",
    icon: "ri:magic-line",
    description: "Windows 默认 RDP，Linux 默认 SSH",
  },
  {
    label: "SSH",
    value: "ssh",
    icon: "ri:terminal-box-line",
    description: "适合 Linux 终端远控",
  },
  {
    label: "RDP",
    value: "rdp",
    icon: "ri:computer-line",
    description: "适合 Windows 桌面远控",
  },
  {
    label: "VNC",
    value: "vnc",
    icon: "ri:device-line",
    description: "适合通用图形桌面远控",
  },
];

const emptyForm = (): ServerHost => ({
  serverName: "",
  serverCode: "",
  serverType: "LOCAL",
  osType: "windows",
  architecture: "amd64",
  host: "127.0.0.1",
  port: 0,
  username: "",
  password: "",
  privateKey: "",
  baseDirectory: "C:/",
  tags: "",
  tagsList: [],
  enabled: true,
  description: "",
  metadataJson: "",
});

const emptyServiceForm = (): ServerService => ({
  serverServiceId: undefined,
  serverId: undefined,
  serviceCode: "",
  serviceName: "",
  serviceType: "",
  installPath: "",
  runtimeStatus: "UNKNOWN",
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
  enabled: true,
  description: "",
  metadataJson: "",
  latestAiReason: "",
  latestAiSolution: "",
  latestAiFixScript: "",
  latestAiProvider: "",
  latestAiModel: "",
});

const normalizeMetricTimestamp = (
  value: number | undefined,
  history: ServerMetricsSnapshot[] = [],
) => {
  const fallback = Number(value || Date.now());
  const last = Number(history[history.length - 1]?.collectTimestamp || 0);
  return fallback > last ? fallback : last + 1;
};

const resolveDefaultBaseDirectory = (osType?: string | null) =>
  normalizeOs(osType) === "windows" ? "C:/" : "/";

const form = reactive<ServerHost>(emptyForm());
const serviceForm = reactive<ServerService>(emptyServiceForm());
const hostItems = computed(() => hosts.value || []);
const serviceEditorExecutionProvider = computed(() => {
  const host = hostItems.value.find(
    (item) => Number(item.serverId || 0) === Number(serviceForm.serverId || 0),
  );
  const serverType = String(host?.serverType || "LOCAL").toUpperCase();
  if (serverType === "SSH") {
    return "SSH SPI / 远程命令";
  }
  if (serverType === "WINRM") {
    return "WinRM SPI / PowerShell";
  }
  return "本机 SPI / OSHI / 操作系统能力";
});
const visibleHostItems = computed(() => {
  const keyword = normalizeText(sidebarKeyword.value);
  return hostItems.value.filter((item) => {
    const matchesKeyword =
      !keyword ||
      [
        item.serverName,
        item.serverCode,
        item.host,
        item.username,
        item.description,
        item.tags,
        ...(item.tagsList || []),
      ]
        .filter(Boolean)
        .some((field) => normalizeText(field).includes(keyword));

    if (!matchesKeyword) {
      return false;
    }

    switch (sidebarFilter.value) {
      case "LOCAL":
        return item.serverType === "LOCAL";
      case "REMOTE":
        return item.serverType !== "LOCAL";
      case "ENABLED":
        return !!item.enabled;
      case "DISABLED":
        return !item.enabled;
      case "WINDOWS":
        return normalizeOs(item.osType) === "windows";
      case "LINUX":
        return normalizeOs(item.osType) === "linux";
      default:
        return true;
    }
  });
});
const hostTagSuggestions = computed(() =>
  Array.from(
    new Set(
      hostItems.value.flatMap((item) => [
        ...(item.tagsList || []),
        ...splitTags(item.tags),
      ]),
    ),
  )
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, "zh-CN")),
);
const visibleHostEntries = computed<ServerHostListEntry[]>(() =>
  visibleHostItems.value.map((host) => ({
    host,
    snapshot: resolveHostSnapshot(host),
    summary: getHostSoftSummary(host),
    remoteConfig: host.remoteGatewayConfig || host.guacamoleConfig || null,
  })),
);
const formServerCodePreview = computed(() => buildServerCodeFromHost(form));
const selectedHost = computed(
  () =>
    hostItems.value.find((item) => item.serverId === selectedId.value) || null,
);
const softDrawerHost = computed(
  () =>
    hostItems.value.find((item) => item.serverId === softDrawerHostId.value) ||
    null,
);
const installHost = computed(
  () =>
    hostItems.value.find((item) => item.serverId === installHostId.value) ||
    null,
);
const selectedSnapshot = computed(() =>
  selectedHost.value ? resolveHostSnapshot(selectedHost.value) : null,
);
const selectedMetricHistory = computed(() =>
  selectedHost.value?.serverId
    ? serverMetricsHistoryMap.value[selectedHost.value.serverId] || []
    : [],
);
const selectedMetricDetail = computed(() =>
  selectedHost.value?.serverId
    ? serverMetricsDetailMap.value[selectedHost.value.serverId] || null
    : null,
);
const selectedProcessItem = computed(
  () =>
    serverProcesses.value.find(
      (item) => item.pid === processSelectedPid.value,
    ) ||
    serverProcesses.value[0] ||
    null,
);
const filePreviewLines = computed(() =>
  filePreview.value?.content
    ? filePreview.value.content.split(/\r?\n/).filter(Boolean).length
    : 0,
);
const fileDirty = computed(
  () =>
    Boolean(filePreviewPath.value) &&
    fileDraftContent.value !== fileOriginalContent.value,
);
const fileDisplayCurrentPath = computed(() =>
  toRelativeFilePath(fileCurrentPath.value, selectedHost.value),
);
const fileDisplayPreviewPath = computed(() =>
  filePreviewPath.value
    ? toRelativeFilePath(filePreviewPath.value, selectedHost.value)
    : "",
);
const fileEditorReadonly = computed(
  () =>
    !filePreviewPath.value ||
    fileWatchEnabled.value ||
    Boolean(filePreview.value?.truncated),
);
const selectedHostSoftSummary = computed(() =>
  selectedHost.value
    ? getHostSoftSummary(selectedHost.value)
    : { targets: 0, installations: 0, services: 0 },
);
const selectedHostServerServices = computed(() =>
  getHostServerServices(selectedHost.value),
);
const canOpenRemoteConsole = computed(() =>
  Boolean(selectedRemoteGateway.value?.enabled),
);
const remoteConsoleLaunchUrl = computed(
  () => remoteConsoleConfig.value?.launchUrl || "",
);
const remoteConsoleFullscreenIcon = computed(() =>
  remoteConsoleFullscreen.value
    ? "ri:fullscreen-exit-line"
    : "ri:fullscreen-line",
);
const remoteConsoleFullscreenTooltip = computed(() =>
  remoteConsoleFullscreen.value ? "退出全屏" : "远程控制全屏",
);
const hostRemoteGatewayTitle = computed(() =>
  selectedHost.value?.serverName
    ? `${selectedHost.value.serverName} · 远程代理`
    : "服务器远程代理",
);
const hostAlertSettingsTitle = computed(() =>
  selectedHost.value?.serverName
    ? `${selectedHost.value.serverName} · 预警设置`
    : "服务器预警设置",
);
const aiEnabled = computed(() => Boolean(serverCapabilities.value?.aiEnabled));
const serviceAutoDetectEnabled = computed(() =>
  Boolean(serverCapabilities.value?.serviceAutoDetectEnabled),
);
const selectedHostAlerts = computed(() =>
  Object.values(alertEventMap.value)
    .filter(
      (item) =>
        Number(item.serverId || 0) ===
        Number(selectedHost.value?.serverId || 0),
    )
    .sort((left, right) => {
      const timeLeft = new Date(left.createTime || 0).getTime() || 0;
      const timeRight = new Date(right.createTime || 0).getTime() || 0;
      if (timeLeft !== timeRight) {
        return timeRight - timeLeft;
      }
      return (
        Number(right.serverAlertEventId || 0) -
        Number(left.serverAlertEventId || 0)
      );
    })
    .slice(0, 8),
);
const selectedHostAiAnalysis = computed(() =>
  selectedHost.value?.serverId
    ? hostAiAnalysisMap.value[selectedHost.value.serverId] || null
    : null,
);
const selectedHostAiAnalyzing = computed(
  () =>
    Number(hostStabilityAnalyzingId.value || 0) ===
    Number(selectedHost.value?.serverId || 0),
);

const parseJsonObject = (value?: string) => {
  if (!value) {
    return {} as ServerMetadata;
  }
  try {
    const parsed = JSON.parse(value) as ServerMetadata;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {} as ServerMetadata;
  }
};
const softStatusLabel = (value?: string | null) =>
  value === "RUNNING"
    ? "运行中"
    : value === "INSTALLED"
      ? "已安装"
      : value === "SUCCESS"
        ? "成功"
        : value === "FAILED"
          ? "失败"
          : value === "STOPPED"
            ? "已停止"
            : value === "RUNNING_WAIT"
              ? "启动中"
              : value === "UNINSTALLED"
                ? "未安装"
                : value || "未知";
const softOperationLabel = (value?: string | null) =>
  value === "INSTALL"
    ? "安装"
    : value === "UNINSTALL"
      ? "卸载"
      : value === "START"
        ? "启动"
        : value === "STOP"
          ? "停止"
          : value === "RESTART"
            ? "重启"
            : value === "STATUS"
              ? "状态检查"
              : value === "REGISTER"
                ? "注册服务"
                : value === "UNREGISTER"
                  ? "取消注册"
                  : value === "CONFIG_WRITE"
                    ? "写入配置"
                    : value || "操作";
const hostDefaultPath = (host?: ServerHost | null) => {
  if (host?.baseDirectory) {
    return host.baseDirectory;
  }
  return normalizeOs(host?.osType) === "windows" ? "C:/" : "/";
};
const normalizeDirectoryPath = (value?: string | null, windows = false) => {
  const separator = windows ? "\\" : "/";
  const normalized = String(value || "")
    .replace(/[\\/]+/g, separator)
    .replace(new RegExp(`${windows ? "\\\\" : "/"}+$`), "");
  if (!normalized) {
    return windows ? "C:\\" : "/";
  }
  if (windows && /^[a-z]:$/i.test(normalized)) {
    return `${normalized}\\`;
  }
  return normalized;
};
const isInsideBaseDirectory = (path: string, host?: ServerHost | null) => {
  if (!host) {
    return false;
  }
  const windows = normalizeOs(host.osType) === "windows";
  const root = normalizeDirectoryPath(hostDefaultPath(host), windows);
  const normalized = normalizeDirectoryPath(path, windows);
  const compareRoot = windows ? root.toLowerCase() : root;
  const comparePath = windows ? normalized.toLowerCase() : normalized;
  const separator = windows ? "\\" : "/";
  const compareRootPrefix = compareRoot.endsWith(separator)
    ? compareRoot
    : `${compareRoot}${separator}`;
  return (
    comparePath === compareRoot || comparePath.startsWith(compareRootPrefix)
  );
};
const isParentDirectoryEntry = (entry?: ServerFileEntry | null) => {
  const name = String(entry?.name || "").trim();
  return name === ".." || name === "../" || name === "..\\";
};
const sanitizeFileEntries = (
  entries: ServerFileEntry[] = [],
  host?: ServerHost | null,
) =>
  entries.filter((entry) => {
    if (!entry?.path || isParentDirectoryEntry(entry)) {
      return false;
    }
    return isInsideBaseDirectory(entry.path, host);
  });
const resolveFilePathWithinRoot = (
  path: string | undefined,
  host?: ServerHost | null,
) => {
  if (!host) {
    return path || "";
  }
  const windows = normalizeOs(host.osType) === "windows";
  const root = normalizeDirectoryPath(hostDefaultPath(host), windows);
  const normalized = normalizeDirectoryPath(path || root, windows);
  return isInsideBaseDirectory(normalized, host) ? normalized : root;
};
const toRelativeFilePath = (path?: string | null, host?: ServerHost | null) => {
  if (!path) {
    return "./";
  }
  if (!host) {
    return String(path);
  }
  const windows = normalizeOs(host.osType) === "windows";
  const root = normalizeDirectoryPath(hostDefaultPath(host), windows);
  const normalized = normalizeDirectoryPath(path, windows);
  const compareRoot = windows ? root.toLowerCase() : root;
  const comparePath = windows ? normalized.toLowerCase() : normalized;
  if (comparePath === compareRoot) {
    return "./";
  }
  const separator = windows ? "\\" : "/";
  const prefix = compareRoot.endsWith(separator)
    ? compareRoot
    : `${compareRoot}${separator}`;
  if (!comparePath.startsWith(prefix)) {
    return normalized.replace(/\\/g, "/");
  }
  const start = prefix.length;
  const relative = normalized.slice(start).replace(/\\/g, "/");
  return relative ? `./${relative}` : "./";
};
const buildFileTreeNode = (
  entry: ServerFileEntry,
  host?: ServerHost | null,
): ServerFileTreeNode => ({
  key: entry.path,
  name: entry.name,
  label: entry.name,
  path: entry.path,
  relativePath: toRelativeFilePath(entry.path, host),
  directory: Boolean(entry.directory),
  file: Boolean(entry.file),
  leaf: !entry.directory,
  extension: entry.extension,
});
const toTreeFileEntry = (node: ServerFileTreeNode): ServerFileEntry => ({
  name: node.name,
  path: node.path,
  directory: node.directory,
  file: node.file,
  extension: node.extension,
});
const canNavigateParentDirectory = computed(() => {
  if (!selectedHost.value || !fileCurrentPath.value) {
    return false;
  }
  const windows = normalizeOs(selectedHost.value.osType) === "windows";
  const root = normalizeDirectoryPath(
    hostDefaultPath(selectedHost.value),
    windows,
  );
  const current = normalizeDirectoryPath(fileCurrentPath.value, windows);
  return current !== root;
});
const resolveHostSnapshot = (host?: ServerHost | null) => {
  if (!host?.serverId) {
    return host?.statusSnapshot || null;
  }
  return serverMetricsMap.value[host.serverId] || host.statusSnapshot || null;
};
const formatFileTime = (value?: number) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};
const formatFileSize = (value?: number) => {
  const size = Number(value || 0);
  if (!size) {
    return "0 B";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};
const fileEntryIcon = (entry: ServerFileEntry) => {
  if (entry.directory) {
    return "ri:folder-open-line";
  }
  if (
    ["log", "txt", "out", "err"].includes(
      String(entry.extension || "").toLowerCase(),
    )
  ) {
    return "ri:file-text-line";
  }
  if (
    ["json", "yaml", "yml", "properties", "xml"].includes(
      String(entry.extension || "").toLowerCase(),
    )
  ) {
    return "ri:file-code-line";
  }
  return "ri:file-line";
};
const isTextPreviewable = (entry?: ServerFileEntry | null) => {
  if (!entry || !entry.file) {
    return false;
  }
  const extension = String(entry.extension || "").toLowerCase();
  return (
    !extension ||
    [
      "log",
      "txt",
      "json",
      "yaml",
      "yml",
      "xml",
      "properties",
      "conf",
      "ini",
      "sh",
      "ps1",
      "cmd",
      "bat",
      "md",
      "env",
      "sql",
    ].includes(extension)
  );
};
const resolveFileEditorMode = (
  language?: string | null,
  path?: string | null,
) => {
  const normalized = normalizeText(language || path?.split(".").pop());
  if (["json", "javascript", "js"].includes(normalized)) {
    return "javascript";
  }
  if (["yaml", "yml"].includes(normalized)) {
    return "yaml";
  }
  if (["xml", "html"].includes(normalized)) {
    return "xml";
  }
  if (["properties", "conf", "ini", "env"].includes(normalized)) {
    return "properties";
  }
  if (["sql"].includes(normalized)) {
    return "sql";
  }
  if (["sh", "shell", "bash", "ps1", "cmd", "bat"].includes(normalized)) {
    return "shell";
  }
  return "properties";
};

const matchPackageServer = (
  softPackage: SoftPackage | null | undefined,
  server: ServerHost | null | undefined,
) => {
  if (!softPackage || !server) {
    return false;
  }
  const packageOs = normalizeOs(softPackage.osType);
  const serverOs = normalizeOs(server.osType);
  if (packageOs && serverOs && packageOs !== serverOs) {
    return false;
  }
  const packageArch = normalizeArch(softPackage.architecture);
  const serverArch = normalizeArch(server.architecture);
  if (packageArch && serverArch && packageArch !== serverArch) {
    return false;
  }
  return true;
};

const patchForm = (value: ServerHost) => {
  Object.assign(form, emptyForm(), value, {
    tagsList: [...(value.tagsList || splitTags(value.tags))],
  });
  form.tags = (form.tagsList || []).join(", ");
};
const patchHostFormValues = (value: Partial<ServerHost>) => {
  Object.assign(form, value);
};
const patchServiceForm = (value: ServerService) => {
  Object.assign(serviceForm, emptyServiceForm(), value);
};
const patchAlertSettingsForm = (
  target: ServerAlertSettings,
  value?: ServerAlertSettings | null,
) => {
  Object.assign(
    target,
    {
      serverId: undefined,
      inheritGlobal: false,
      enabled: true,
      messageEnabled: false,
      cpuWarningPercent: 75,
      cpuDangerPercent: 90,
      memoryWarningPercent: 75,
      memoryDangerPercent: 90,
      diskWarningPercent: 80,
      diskDangerPercent: 92,
      ioWarningBytesPerSecond: 50 * 1024 * 1024,
      ioDangerBytesPerSecond: 120 * 1024 * 1024,
      latencyWarningMs: 120,
      latencyDangerMs: 250,
    },
    value || {},
  );
};
const patchAlertSettingsFormValues = (
  target: ServerAlertSettings,
  value: Partial<ServerAlertSettings>,
) => {
  Object.assign(target, value);
};
const toAlertSettingsPayload = (value: ServerAlertSettings) => ({
  serverId: toNumericId(value.serverId) || undefined,
  inheritGlobal: Boolean(value.inheritGlobal),
  enabled: value.enabled !== false,
  messageEnabled: Boolean(value.messageEnabled),
  cpuWarningPercent: Number(value.cpuWarningPercent || 0),
  cpuDangerPercent: Number(value.cpuDangerPercent || 0),
  memoryWarningPercent: Number(value.memoryWarningPercent || 0),
  memoryDangerPercent: Number(value.memoryDangerPercent || 0),
  diskWarningPercent: Number(value.diskWarningPercent || 0),
  diskDangerPercent: Number(value.diskDangerPercent || 0),
  ioWarningBytesPerSecond: Number(value.ioWarningBytesPerSecond || 0),
  ioDangerBytesPerSecond: Number(value.ioDangerBytesPerSecond || 0),
  latencyWarningMs: Number(value.latencyWarningMs || 0),
  latencyDangerMs: Number(value.latencyDangerMs || 0),
});
const mergeAlertEvents = (items: ServerAlertEvent[] = []) => {
  if (!items.length) {
    return;
  }
  const next = { ...alertEventMap.value };
  items.forEach((item) => {
    if (!item?.serverAlertEventId) {
      return;
    }
    next[item.serverAlertEventId] = item;
  });
  alertEventMap.value = next;
};
const normalizeHostList = (value: unknown): ServerHost[] => {
  if (Array.isArray(value)) return value as ServerHost[];
  if (value && typeof value === "object") {
    const container = value as Record<string, unknown>;
    if (Array.isArray(container.records))
      return container.records as ServerHost[];
    if (Array.isArray(container.list)) return container.list as ServerHost[];
    if (Array.isArray(container.items)) return container.items as ServerHost[];
    if (Array.isArray(container.data)) return container.data as ServerHost[];
  }
  return [];
};
const splitTags = (value?: string) =>
  String(value || "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
const emptyRemoteGatewayForm = (): RemoteGatewayFormModel => ({
  inheritGlobal: false,
  enabled: false,
  provider: "guacamole",
  gatewayUrl: "",
  protocol: "",
  launchPath: "",
  websocketPath: "",
  connectionId: "",
});
const textValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";
const applyRemoteGatewayForm = (
  target: RemoteGatewayFormModel,
  value?: Partial<ServerRemoteGatewaySettings> | null,
) => {
  Object.assign(target, emptyRemoteGatewayForm(), {
    inheritGlobal: value?.inheritGlobal ?? false,
    enabled: Boolean(value?.enabled),
    provider: textValue(value?.provider) || "guacamole",
    gatewayUrl: textValue(value?.gatewayUrl),
    protocol: textValue(value?.protocol),
    launchPath: textValue(value?.launchPath),
    websocketPath: textValue(value?.websocketPath),
    connectionId: textValue(value?.connectionId),
  });
};
const patchRemoteGatewayForm = (
  target: RemoteGatewayFormModel,
  value: Partial<RemoteGatewayFormModel>,
) => {
  Object.assign(target, value);
};
const toRemoteGatewayPayload = (value: RemoteGatewayFormModel) => ({
  inheritGlobal: Boolean(value.inheritGlobal),
  enabled: Boolean(value.enabled),
  provider: textValue(value.provider) || "guacamole",
  gatewayUrl: textValue(value.gatewayUrl),
  protocol: textValue(value.protocol),
  launchPath: textValue(value.launchPath),
  websocketPath: textValue(value.websocketPath),
  connectionId: textValue(value.connectionId),
});
const syncFormTags = () => {
  form.tagsList = [
    ...new Set([...(form.tagsList || []), ...splitTags(form.tags)]),
  ];
  form.tags = (form.tagsList || []).join(", ");
};

const matchesHostWithSoftTarget = (
  host: ServerHost,
  target: ServerSoftBindingTarget,
) => {
  if (!host.serverId) return false;
  const metadata = parseJsonObject(target.metadataJson);
  const metadataServerId = Number(
    metadata.serverId ?? metadata.monitorServerId ?? metadata.hostId ?? 0,
  );
  if (metadataServerId && metadataServerId === host.serverId) return true;
  const metadataServerCode = String(metadata.serverCode || "");
  if (
    metadataServerCode &&
    host.serverCode &&
    metadataServerCode === host.serverCode
  )
    return true;
  if (target.targetCode === `server-${host.serverId}`) return true;
  const sameHost =
    normalizeText(target.host) &&
    normalizeText(host.host) &&
    normalizeText(target.host) === normalizeText(host.host);
  const sameUser =
    normalizeText(target.username) &&
    normalizeText(host.username) &&
    normalizeText(target.username) === normalizeText(host.username);
  return Boolean(sameHost && (sameUser || host.serverType === "LOCAL"));
};
const getHostSoftTargets = (host?: ServerHost | null) =>
  !host || !softEnabled.value
    ? []
    : softTargets.value.filter((item) => matchesHostWithSoftTarget(host, item));
const getHostSoftInstallations = (host?: ServerHost | null) => {
  const targetIds = new Set(
    getHostSoftTargets(host)
      .map((item) => item.softTargetId)
      .filter((item): item is number => Number.isFinite(Number(item))),
  );
  if (!targetIds.size) return [] as ServerSoftInstallation[];
  return softInstallations.value.filter((item) =>
    targetIds.has(Number(item.softTargetId)),
  );
};
const getHostSoftOperations = (host?: ServerHost | null) => {
  const targetIds = new Set(
    getHostSoftTargets(host)
      .map((item) => item.softTargetId)
      .filter((item): item is number => Number.isFinite(Number(item))),
  );
  const installationIds = new Set(
    getHostSoftInstallations(host)
      .map((item) => item.softInstallationId)
      .filter((item): item is number => Number.isFinite(Number(item))),
  );
  return softOperations.value
    .filter(
      (item) =>
        targetIds.has(Number(item.softTargetId)) ||
        installationIds.has(Number(item.softInstallationId)),
    )
    .sort((left, right) =>
      String(right.endTime || right.startTime || "").localeCompare(
        String(left.endTime || left.startTime || ""),
      ),
    );
};
const getHostServerServices = (host?: ServerHost | null) =>
  !host?.serverId
    ? []
    : serverServices.value.filter(
        (item) => Number(item.serverId || 0) === Number(host.serverId || 0),
      );
const getHostSoftServiceNames = (host?: ServerHost | null) =>
  Array.from(
    new Set(
      getHostServerServices(host)
        .map((item) => item.serviceName || "")
        .filter(Boolean),
    ),
  );
const getHostSoftSummary = (host?: ServerHost | null) => ({
  targets: softEnabled.value ? getHostSoftTargets(host).length : 0,
  installations: softEnabled.value ? getHostSoftInstallations(host).length : 0,
  services: getHostServerServices(host).length,
});

const compatibleInstallPackages = computed(() =>
  installPackages.value.filter(
    (item) =>
      toNumericId(item.softPackageId) !== null &&
      matchPackageServer(item, installHost.value),
  ),
);

const installPackageOptions = computed(() =>
  compatibleInstallPackages.value
    .map((item) => {
      const packageId = toNumericId(item.softPackageId);
      if (!packageId) {
        return null;
      }
      return {
        label: item.packageName,
        value: packageId,
        packageCode: item.packageCode,
        packageCategory: item.packageCategory,
        description: item.description,
      };
    })
    .filter(Boolean),
);

const normalizedInstallPackageId = computed(() => {
  return toNumericId(installPackageId.value);
});

const installSelectedPackage = computed(
  () =>
    compatibleInstallPackages.value.find(
      (item) =>
        toNumericId(item.softPackageId) === normalizedInstallPackageId.value,
    ) || null,
);

const installSelectedVersionLabel = computed(() => {
  const version = installVersions.value.find(
    (item) =>
      toNumericId(item.softPackageVersionId) ===
      toNumericId(installForm.softPackageVersionId),
  );
  return version
    ? `${version.versionName} (${version.versionCode})`
    : "未选择版本";
});

const installGuideSections = computed<GuideSection[]>(() => {
  const guide = installGuide.value;
  if (!guide) {
    return [];
  }
  return [
    {
      key: "install",
      title: "基础安装",
      hint: "安装阶段参数会映射到脚本和配置模板。",
      scope: "install",
      fields: guide.installFields || [],
    },
    {
      key: "service",
      title: "服务引导",
      hint: "服务注册、启动和状态检查相关参数。",
      scope: "service",
      fields: guide.serviceFields || [],
    },
    {
      key: "config",
      title: "配置初始化",
      hint: "配置模板与初始化变量。",
      scope: "config",
      fields: guide.configFields || [],
    },
  ].filter((section) => section.fields.length);
});

const resolveInstallModel = (scope: GuideScope) => {
  if (scope === "service") {
    return installServiceOptions;
  }
  if (scope === "config") {
    return installConfigOptions;
  }
  return installOptions;
};

const updateInstallBoolean = (
  scope: GuideScope,
  fieldKey: string,
  value: string | number | boolean,
) => {
  resolveInstallModel(scope)[fieldKey] = Boolean(value);
};

const isInstallTextareaField = (field: SoftGuideField) =>
  ["textarea", "code", "json", "script"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isInstallNumberField = (field: SoftGuideField) =>
  ["number", "port", "integer"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isInstallBooleanField = (field: SoftGuideField) =>
  ["switch", "boolean", "checkbox"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isInstallPasswordField = (field: SoftGuideField) =>
  ["password", "secret"].includes(
    String(field.componentType || "").toLowerCase(),
  ) ||
  ["password", "token", "secret"].some((item) =>
    String(field.fieldKey || "")
      .toLowerCase()
      .includes(item),
  );

const numberValidation = (
  validation: Record<string, unknown> | undefined,
  key: "min" | "max",
) => {
  const value = validation?.[key];
  if (typeof value === "number") {
    return value;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const clearInstallModels = () => {
  Object.keys(installOptions).forEach((key) => delete installOptions[key]);
  Object.keys(installServiceOptions).forEach(
    (key) => delete installServiceOptions[key],
  );
  Object.keys(installConfigOptions).forEach(
    (key) => delete installConfigOptions[key],
  );
};

const applyInstallFieldDefaults = (
  fields: SoftGuideField[] | undefined,
  model: Record<string, unknown>,
) => {
  Object.keys(model).forEach((key) => delete model[key]);
  for (const field of fields || []) {
    if (
      field.defaultValue !== undefined &&
      field.defaultValue !== null &&
      field.defaultValue !== ""
    ) {
      model[field.fieldKey] = field.defaultValue;
      continue;
    }
    if (isInstallBooleanField(field)) {
      model[field.fieldKey] = false;
    }
  }
};

const loadInstallPackageVersions = async (
  softPackageId: number,
  force = false,
) => {
  const cached = installVersionCache.get(softPackageId);
  if (cached && !force) {
    return cached;
  }
  const detailResult = await getSoftPackageDetail(softPackageId);
  const versions = detailResult.data?.versions || [];
  installVersionCache.set(softPackageId, versions);
  return versions;
};

const findSoftTargetForHost = (host: ServerHost) =>
  softTargets.value.find((target) => matchesHostWithSoftTarget(host, target));

const buildSoftTargetPayload = (host: ServerHost): SoftTarget => ({
  targetName: host.serverName,
  targetCode: `server-${host.serverId}`,
  targetType: host.serverType,
  osType: host.osType,
  architecture: host.architecture,
  host: host.serverType === "LOCAL" ? "127.0.0.1" : host.host,
  port: host.port,
  username: host.username,
  password: host.password,
  privateKey: host.privateKey,
  baseDirectory: host.baseDirectory,
  enabled: host.enabled,
  description: host.description,
  metadataJson: JSON.stringify({
    source: "server-host",
    serverId: host.serverId,
    serverCode: host.serverCode,
  }),
});

const ensureSoftTargetForHost = async (host: ServerHost) => {
  const existing = findSoftTargetForHost(host);
  const payload = buildSoftTargetPayload(host);
  if (existing?.softTargetId) {
    const result = await updateSoftTarget(existing.softTargetId, {
      ...payload,
      softTargetId: existing.softTargetId,
    });
    const saved = result.data;
    softTargets.value = softTargets.value.map((item) =>
      item.softTargetId === saved.softTargetId
        ? (saved as unknown as ServerSoftBindingTarget)
        : item,
    );
    return saved.softTargetId!;
  }
  const result = await createSoftTarget(payload);
  const saved = result.data;
  softTargets.value = [
    saved as unknown as ServerSoftBindingTarget,
    ...softTargets.value,
  ];
  return saved.softTargetId!;
};

const reloadInstallGuide = async () => {
  if (
    !installSelectedPackage.value?.softPackageId ||
    !installForm.softPackageVersionId
  ) {
    installGuide.value = null;
    return;
  }
  installGuideLoading.value = true;
  try {
    const targetId = installHost.value
      ? await ensureSoftTargetForHost(installHost.value)
      : undefined;
    const result = await getSoftVersionGuide(
      installSelectedPackage.value.softPackageId,
      installForm.softPackageVersionId,
      { targetId },
    );
    installGuide.value = result.data || null;
    applyInstallFieldDefaults(
      installGuide.value?.installFields,
      installOptions,
    );
    applyInstallFieldDefaults(
      installGuide.value?.serviceFields,
      installServiceOptions,
    );
    applyInstallFieldDefaults(
      installGuide.value?.configFields,
      installConfigOptions,
    );
  } finally {
    installGuideLoading.value = false;
  }
};

const resetInstallDialog = () => {
  installStep.value = 0;
  installPackageId.value = null;
  installVersions.value = [];
  installGuide.value = null;
  installTask.value = null;
  installForm.softPackageId = 0;
  installForm.softPackageVersionId = 0;
  installForm.softTargetId = 0;
  installForm.installationName = "";
  installForm.installPath = "";
  installForm.serviceName = "";
  clearInstallModels();
};

const openInstallDialog = async (host: ServerHost) => {
  if (!softEnabled.value) {
    message("soft 模块当前未启用", { type: "warning" });
    return;
  }
  installHostId.value = host.serverId || null;
  resetInstallDialog();
  if (!installPackages.value.length) {
    const packageResult = await listSoftPackages();
    installPackages.value = packageResult.data || [];
  }
  installVisible.value = true;
};

const goInstallVersionStep = async () => {
  const softPackageId = normalizedInstallPackageId.value;
  if (!softPackageId || !installSelectedPackage.value) {
    return;
  }
  installForm.softPackageId = softPackageId;
  installForm.installationName =
    installSelectedPackage.value.packageName ||
    installSelectedPackage.value.packageCode;
  installForm.serviceName =
    installSelectedPackage.value.packageCode ||
    installSelectedPackage.value.packageName;
  installVersions.value = await loadInstallPackageVersions(softPackageId);
  installForm.softPackageVersionId =
    toNumericId(installVersions.value[0]?.softPackageVersionId) || 0;
  await reloadInstallGuide();
  installStep.value = 1;
};

const submitInstallFromServer = async () => {
  if (
    !installHost.value ||
    !installSelectedPackage.value ||
    !installForm.softPackageVersionId
  ) {
    message("请先选择软件和版本", { type: "warning" });
    return;
  }
  installSubmitting.value = true;
  try {
    const softTargetId = await ensureSoftTargetForHost(installHost.value);
    const packageId =
      toNumericId(installSelectedPackage.value.softPackageId) || 0;
    const result = await installSoftPackage({
      ...installForm,
      softPackageId: packageId,
      softPackageVersionId: toNumericId(installForm.softPackageVersionId) || 0,
      softTargetId,
      installOptions: { ...installOptions },
      serviceOptions: { ...installServiceOptions },
      configOptions: { ...installConfigOptions },
    });
    const ticket = result.data;
    installTask.value = {
      operationId: ticket.operationId,
      installationId: ticket.installationId,
      status: ticket.operationStatus,
      message: `安装任务已提交到 ${installHost.value.serverName}`,
    };
    installStep.value = 2;
    message("安装任务已提交，正在跳转到实例详情", { type: "success" });
    installVisible.value = false;
    await loadSoftState();
    if (packageId && ticket.installationId) {
      router.push(
        `/soft/detail/${packageId}?installationId=${ticket.installationId}`,
      );
    }
  } finally {
    installSubmitting.value = false;
  }
};

const getSoftInstallationInsight = (
  installation?: ServerSoftInstallation | null,
) =>
  installation?.softInstallationId
    ? softInstallationDetailMap.value[installation.softInstallationId]
    : undefined;

const getSoftPackageInsight = (installation?: ServerSoftInstallation | null) =>
  installation?.softPackageId
    ? softPackageDetailMap.value[installation.softPackageId]
    : undefined;

const getInstallationBackupCount = (
  installation?: ServerSoftInstallation | null,
) => getSoftInstallationInsight(installation)?.snapshots?.length || 0;

const getInstallationUpgradeText = (
  installation?: ServerSoftInstallation | null,
) => {
  const detail = getSoftPackageInsight(installation);
  const latestVersion = detail?.versions?.[0];
  const currentVersion =
    installation?.installedVersion || installation?.versionName || "";
  if (!latestVersion?.versionCode && !latestVersion?.versionName) {
    return "未加载升级候选";
  }
  const latestText = latestVersion.versionName || latestVersion.versionCode;
  return currentVersion === latestVersion.versionCode ||
    currentVersion === latestVersion.versionName
    ? `当前已是最新版本 ${latestText}`
    : `可升级到 ${latestText}`;
};

const getInstallationConfigPathSummary = (
  installation?: ServerSoftInstallation | null,
) => {
  const paths =
    getSoftInstallationInsight(installation)?.version?.configPaths || [];
  return paths.length ? paths[0] : "未声明配置路径";
};

const hydrateSoftInsights = async (host?: ServerHost | null) => {
  if (!host || !softEnabled.value) {
    return;
  }
  const installationItems = getHostSoftInstallations(host);
  if (!installationItems.length) {
    return;
  }
  const missingInstallationIds = installationItems
    .map((item) => item.softInstallationId)
    .filter(
      (id): id is number =>
        Number.isFinite(Number(id)) && !softInstallationDetailMap.value[id],
    );
  if (missingInstallationIds.length) {
    const detailResults = await Promise.allSettled(
      missingInstallationIds.map((id) => getSoftInstallationDetail(id)),
    );
    detailResults.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        return;
      }
      const id = missingInstallationIds[index];
      if (result.value.data) {
        softInstallationDetailMap.value = {
          ...softInstallationDetailMap.value,
          [id]: result.value.data,
        };
      }
    });
  }
  const missingPackageIds = installationItems
    .map((item) => item.softPackageId)
    .filter(
      (id): id is number =>
        Number.isFinite(Number(id)) && !softPackageDetailMap.value[id],
    );
  if (missingPackageIds.length) {
    const packageResults = await Promise.allSettled(
      missingPackageIds.map((id) => getSoftPackageDetail(id)),
    );
    packageResults.forEach((result, index) => {
      if (result.status !== "fulfilled") {
        return;
      }
      const id = missingPackageIds[index];
      if (result.value.data) {
        softPackageDetailMap.value = {
          ...softPackageDetailMap.value,
          [id]: result.value.data,
        };
      }
    });
  }
};

const selectedHostSoftTargets = computed(() =>
  getHostSoftTargets(selectedHost.value),
);
const selectedHostSoftInstallations = computed(() =>
  getHostSoftInstallations(selectedHost.value),
);
const selectedHostSoftOperations = computed(() =>
  getHostSoftOperations(selectedHost.value),
);
const selectedHostServiceNames = computed(() =>
  getHostSoftServiceNames(selectedHost.value),
);
const selectedHostBackupCount = computed(() =>
  selectedHostSoftInstallations.value.reduce(
    (total, item) => total + getInstallationBackupCount(item),
    0,
  ),
);
const selectedHostUpgradeableCount = computed(
  () =>
    selectedHostSoftInstallations.value.filter((item) =>
      getInstallationUpgradeText(item).startsWith("可升级到 "),
    ).length,
);
const softDrawerTargets = computed(() =>
  getHostSoftTargets(softDrawerHost.value),
);
const softDrawerInstallations = computed(() =>
  getHostSoftInstallations(softDrawerHost.value),
);
const softDrawerOperations = computed(() =>
  getHostSoftOperations(softDrawerHost.value),
);
const softDrawerServerServices = computed(() =>
  getHostServerServices(softDrawerHost.value),
);
const softDrawerServiceNames = computed(() =>
  getHostSoftServiceNames(softDrawerHost.value),
);
const softDrawerBackupCount = computed(() =>
  softDrawerInstallations.value.reduce(
    (total, item) => total + getInstallationBackupCount(item),
    0,
  ),
);
const softDrawerUpgradeableCount = computed(
  () =>
    softDrawerInstallations.value.filter((item) =>
      getInstallationUpgradeText(item).startsWith("可升级到 "),
    ).length,
);

const serverServiceActionLabelMap: Record<ServerServiceAction, string> = {
  register: "注册服务",
  unregister: "取消注册",
  start: "启动服务",
  stop: "停止服务",
  restart: "重启服务",
  status: "状态检查",
  "ai-fix": "AI 修复启动",
  "config-write": "推送配置",
};

const serverServiceActionExecutor: Record<
  RunnableServerServiceAction,
  (id: number) => Promise<{ data?: ServerServiceCommandResult }>
> = {
  register: registerServerService,
  unregister: unregisterServerService,
  start: startServerService,
  stop: stopServerService,
  restart: restartServerService,
  status: getServerServiceStatus,
  "ai-fix": aiFixStartServerService,
};

const toServiceActionLabelKey = (
  value?: string | null,
): ServerServiceAction => {
  const normalized = normalizeText(value).replace(/_/g, "-");
  if (normalized === "register") return "register";
  if (normalized === "unregister") return "unregister";
  if (normalized === "start") return "start";
  if (normalized === "stop") return "stop";
  if (normalized === "restart") return "restart";
  if (normalized === "status") return "status";
  if (normalized === "ai-fix" || normalized === "aifix") return "ai-fix";
  if (normalized === "config-write" || normalized === "configwrite")
    return "config-write";
  return "status";
};

const resolveServerServiceActionKey = (
  service: ServerService,
  action: ServerServiceAction,
) =>
  `${service.serverServiceId || service.serviceCode || service.serviceName}:${action}`;

const isServerServiceActionLoading = (
  service: ServerService,
  action: ServerServiceAction,
) =>
  serverServiceActionLoadingKey.value ===
  resolveServerServiceActionKey(service, action);

const isServerServiceRunning = (service?: ServerService | null) => {
  const status = normalizeText(service?.runtimeStatus).toUpperCase();
  return status === "RUNNING" || status === "ACTIVE";
};

const hasServerServiceRegisterScript = (service?: ServerService | null) =>
  Boolean(service?.registerScript && service.registerScript.trim());

const hasServerServiceUnregisterScript = (service?: ServerService | null) =>
  Boolean(service?.unregisterScript && service.unregisterScript.trim());

const refreshServerServiceState = async () => {
  await loadServerServices();
  await loadSoftState();
  if (selectedHost.value) {
    await hydrateSoftInsights(selectedHost.value);
  }
  if (
    softDrawerHost.value?.serverId &&
    softDrawerHost.value.serverId !== selectedHost.value?.serverId
  ) {
    await hydrateSoftInsights(softDrawerHost.value);
  }
  if (serviceLogsVisible.value && serviceLogService.value?.serverServiceId) {
    await openServiceLogs(serviceLogService.value);
  }
};

const findServerServiceById = (id?: number | null) =>
  serverServices.value.find(
    (item) => Number(item.serverServiceId || 0) === Number(id || 0),
  ) || null;

const mergeServerServiceSnapshot = (service?: ServerService | null) => {
  if (!service?.serverServiceId) {
    return;
  }
  const next = [...serverServices.value];
  const index = next.findIndex(
    (item) =>
      Number(item.serverServiceId || 0) ===
      Number(service.serverServiceId || 0),
  );
  if (index >= 0) {
    next.splice(index, 1, { ...next[index], ...service });
  } else {
    next.unshift(service);
  }
  serverServices.value = next;
};

const runServerServiceAction = async (
  service: ServerService,
  action: RunnableServerServiceAction,
) => {
  if (!service.serverServiceId) {
    return;
  }
  const actionKey = resolveServerServiceActionKey(service, action);
  serverServiceActionLoadingKey.value = actionKey;
  const requestId = `server-service-${action}-${service.serverServiceId}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `${serverServiceActionLabelMap[action]} · ${
      service.serviceName || service.serverServiceId
    }`,
    mode: "stream",
    status: "running",
    progress: 25,
    message: `正在执行${serverServiceActionLabelMap[action]}`,
  });
  try {
    const result = await serverServiceActionExecutor[action](
      service.serverServiceId,
    );
    const payload = result.data || {};
    const success = payload.success !== false;
    const aiHint =
      !success && (payload.aiReason || payload.aiSolution)
        ? `\n\nAI 原因：${payload.aiReason || "-"}\nAI 方案：${payload.aiSolution || "-"}`
        : "";
    const runtimeText = payload.runtimeStatus
      ? `：${softStatusLabel(payload.runtimeStatus)}`
      : payload.message
        ? `：${payload.message}`
        : "";
    if (payload.taskId) {
      taskCenterProvider.addTask({
        requestId: payload.taskId,
        title: `AI 故障诊断 · ${service.serviceName || service.serverServiceId}`,
        mode: "stream",
        status:
          normalizeText(payload.aiTaskStatus).toUpperCase() === "FAILED"
            ? "error"
            : normalizeText(payload.aiTaskStatus).toUpperCase() === "COMPLETED"
              ? "success"
              : "running",
        progress:
          normalizeText(payload.aiTaskStatus).toUpperCase() === "RUNNING"
            ? 45
            : 100,
        message:
          payload.aiReason || payload.aiSolution
            ? payload.message || "AI 诊断结果已返回"
            : "检测到服务异常，正在请求 AI 分析",
      });
    }
    if (success) {
      task.success({
        progress: 100,
        message: payload.message || `${serverServiceActionLabelMap[action]}完成`,
      });
    } else {
      task.error({
        progress: 100,
        message: payload.message || `${serverServiceActionLabelMap[action]}失败`,
      });
    }
    message(
      `${serverServiceActionLabelMap[action]}${success ? "完成" : "失败"}${runtimeText}${aiHint}`,
      { type: success ? "success" : "error" },
    );
    await refreshServerServiceState();
    const latestService = findServerServiceById(service.serverServiceId);
    if (!success && latestService) {
      await openServiceLogs(latestService);
    }
  } catch (error) {
    console.error(error);
    task.error({
      message: `${serverServiceActionLabelMap[action]}失败`,
    });
    message(`${serverServiceActionLabelMap[action]}失败`, { type: "error" });
  } finally {
    if (serverServiceActionLoadingKey.value === actionKey) {
      serverServiceActionLoadingKey.value = "";
    }
  }
};

const runServerServiceAiFix = async (service: ServerService) =>
  runServerServiceAction(service, "ai-fix");

const detectHostServices = async (host?: ServerHost | null, silent = false) => {
  if (!host?.serverId) {
    return false;
  }
  serviceDetecting.value = true;
  try {
    const result = await detectServerHostServices(host.serverId);
    if (!silent) {
      message(`已同步 ${result.data?.length || 0} 个服务器服务`, {
        type: "success",
      });
    }
    await refreshServerServiceState();
    return true;
  } catch (error) {
    console.error(error);
    if (!silent) {
      message("自动检测服务器服务失败", { type: "error" });
    }
    return false;
  } finally {
    serviceDetecting.value = false;
  }
};

const openServiceLogs = async (service: ServerService) => {
  if (!service.serverServiceId) {
    return;
  }
  serviceLogService.value = service;
  serviceLogsVisible.value = true;
  serviceLogLoading.value = true;
  try {
    const result = await getServerServiceOperationLogs(
      service.serverServiceId,
      20,
    );
    serviceLogs.value = result.data || [];
  } finally {
    serviceLogLoading.value = false;
  }
};

const openServiceEditor = (service: ServerService) => {
  patchServiceForm(service);
  serviceEditorVisible.value = true;
};

const openServiceDetail = (service: ServerService) => {
  selectedServiceDetail.value = service;
  serviceDetailVisible.value = true;
};

const openHostOverview = async (host: ServerHost) => {
  await loadHostMetricsDetail(host, true);
  hostOverviewVisible.value = true;
};

const openCreateService = (host: ServerHost) => {
  patchServiceForm({
    ...emptyServiceForm(),
    serverId: host.serverId,
    serverName: host.serverName,
    host: host.host,
    enabled: true,
    serviceType:
      normalizeOs(host.osType) === "windows"
        ? "WINDOWS_SERVICE"
        : "SYSTEMD_SERVICE",
    installPath: host.baseDirectory || resolveDefaultBaseDirectory(host.osType),
  });
  serviceEditorVisible.value = true;
};

const applyServiceTemplate = (key: string) => {
  const host = hosts.value.find(
    (item) => Number(item.serverId || 0) === Number(serviceForm.serverId || 0),
  );
  const os = normalizeOs(host?.osType);
  const installPath =
    serviceForm.installPath ||
    host?.baseDirectory ||
    resolveDefaultBaseDirectory(host?.osType);
  const serviceName = serviceForm.serviceName?.trim() || "demo-service";
  const normalizedInstallPath = installPath.replace(/[\\/]+$/, "");
  const logPath =
    os === "windows"
      ? `${normalizedInstallPath}\\logs\\${serviceName}.log`
      : `${normalizedInstallPath}/logs/${serviceName}.log`;
  const next = { ...serviceForm };
  switch (key) {
    case "windows":
      Object.assign(next, {
        serviceType: "WINDOWS_SERVICE",
        installPath,
        statusScript: next.statusScript || `Get-Service -Name "${serviceName}"`,
      });
      break;
    case "springboot":
      Object.assign(next, {
        serviceType: "SPRING_BOOT_APP",
        installPath,
        logPathsJson: next.logPathsJson || JSON.stringify([logPath], null, 2),
        startScript:
          next.startScript ||
          (os === "windows"
            ? `Start-Process -FilePath "java" -ArgumentList '-jar','${serviceName}.jar' -WorkingDirectory '${installPath}'`
            : `cd ${installPath} && nohup java -jar ${serviceName}.jar >> ${logPath} 2>&1 &`),
        stopScript:
          next.stopScript ||
          (os === "windows"
            ? `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${serviceName}.jar*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`
            : `pkill -f '${serviceName}.jar'`),
        statusScript:
          next.statusScript ||
          (os === "windows"
            ? `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*${serviceName}.jar*' }`
            : `pgrep -af '${serviceName}.jar'`),
      });
      break;
    case "nginx":
      Object.assign(next, {
        serviceType: "NGINX",
        installPath,
        startScript:
          next.startScript || (os === "windows" ? "nginx.exe" : "nginx"),
        stopScript:
          next.stopScript ||
          (os === "windows" ? "nginx.exe -s stop" : "nginx -s stop"),
        restartScript:
          next.restartScript ||
          (os === "windows" ? "nginx.exe -s reload" : "nginx -s reload"),
        statusScript:
          next.statusScript ||
          (os === "windows"
            ? "Get-Process nginx -ErrorAction SilentlyContinue"
            : "pgrep -af nginx"),
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
        serviceType: os === "windows" ? "WINDOWS_SERVICE" : "SYSTEMD_SERVICE",
        installPath,
      });
      break;
  }
  patchServiceForm(next);
};

const submitServiceEditor = async (draft?: ServerService) => {
  const next = { ...serviceForm, ...(draft || {}) };
  patchServiceForm(next);
  if (!next.serverId) {
    message("请先选择服务器后再维护服务", { type: "warning" });
    return;
  }
  if (!next.serviceName?.trim()) {
    message("服务名称不能为空", { type: "warning" });
    return;
  }
  serviceEditorSaving.value = true;
  try {
    if (next.serverServiceId) {
      await updateServerService(next.serverServiceId, {
        ...next,
      });
    } else {
      await createServerService({
        ...next,
      });
    }
    message(next.serverServiceId ? "服务主档已保存" : "服务已新增", {
      type: "success",
    });
    serviceEditorVisible.value = false;
    await refreshServerServiceState();
  } finally {
    serviceEditorSaving.value = false;
  }
};

const resolveServiceConfigPath = (value?: string | null) => {
  if (!value?.trim()) {
    return "";
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return String(
        parsed.find((item) => String(item || "").trim()) || "",
      ).trim();
    }
  } catch {
    // ignore invalid JSON and fall back to line parsing
  }
  return (
    String(value)
      .split(/[\r\n,;]+/)
      .map((item) => item.trim())
      .find(Boolean) || ""
  );
};

const publishServiceConfig = async (draft?: ServerService) => {
  const next = { ...serviceForm, ...(draft || {}) };
  patchServiceForm(next);
  if (!next.serverServiceId) {
    message("请先保存服务，再推送配置", { type: "warning" });
    return;
  }
  serviceEditorPublishing.value = true;
  try {
    const path = resolveServiceConfigPath(next.configPathsJson);
    const result = await writeServerServiceConfig(next.serverServiceId, {
      path,
      content: next.configTemplate || "",
    });
    const output = result.data?.output || path || "已写入服务器";
    message(`配置推送完成：${output}`, { type: "success" });
    await refreshServerServiceState();
  } catch (error) {
    console.error(error);
    message("配置推送失败", { type: "error" });
  } finally {
    serviceEditorPublishing.value = false;
  }
};

const mergeServiceAiDraft = (draft?: ServerServiceAiDraft | null) => {
  if (!draft) {
    return;
  }
  const fields: Array<keyof ServerServiceAiDraft> = [
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
  const patch: Partial<ServerService> = {};
  fields.forEach((field) => {
    const value = draft[field];
    if (typeof value === "string" && value.trim()) {
      patch[field as keyof ServerService] = value;
    }
  });
  Object.assign(serviceForm, patch);
  if (draft.provider?.trim()) {
    serviceForm.latestAiProvider = draft.provider;
  }
  if (draft.model?.trim()) {
    serviceForm.latestAiModel = draft.model;
  }
  if (draft.summary?.trim()) {
    serviceForm.latestAiSolution = draft.summary;
  }
};

const findServerHostById = (id?: number | null) =>
  hosts.value.find((item) => Number(item.serverId || 0) === Number(id || 0)) ||
  null;

const resolveAiTaskTitle = (payload: ServerAiTaskPayload) => {
  if (payload.taskType === "GENERATE_DRAFT") {
    const service = findServerServiceById(payload.serverServiceId);
    return `AI 服务草稿 · ${
      service?.serviceName || payload.serverServiceId || "未命名服务"
    }`;
  }
  if (payload.taskType === "ANALYZE_HOST_STABILITY") {
    const host = findServerHostById(payload.serverId);
    return `预警中心 AI 分析 · ${
      host?.serverName || payload.serverId || "未命名服务器"
    }`;
  }
  if (payload.taskType === "DIAGNOSE_FAILURE") {
    const service = findServerServiceById(payload.serverServiceId);
    return `AI 故障诊断 · ${
      service?.serviceName || payload.serverServiceId || "未命名服务"
    }`;
  }
  if (payload.taskType === "ANALYZE_METRIC_HISTORY") {
    const host = findServerHostById(payload.serverId);
    return `指标历史 AI 分析 · ${
      host?.serverName || payload.serverId || "未命名服务器"
    } · ${payload.metricType || "指标"}`;
  }
  if (payload.taskType === "ANALYZE_ALERT_HISTORY") {
    const host = findServerHostById(payload.serverId);
    return `告警历史 AI 分析 · ${
      host?.serverName || payload.serverId || "未命名服务器"
    }${payload.metricType ? ` · ${payload.metricType}` : ""}`;
  }
  return "AI 任务";
};

const syncAiTaskCenterStatus = (payload: ServerAiTaskPayload) => {
  if (!payload.taskId) {
    return;
  }
  const title = resolveAiTaskTitle(payload);
  const taskMessage =
    payload.message ||
    (payload.status === "COMPLETED"
      ? "AI 任务已完成"
      : payload.status === "FAILED"
        ? "AI 任务执行失败"
        : "AI 任务执行中");
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

const applyAiTaskPayload = async (payload?: ServerAiTaskPayload | null) => {
  if (!payload?.taskId) {
    return;
  }
  const stateKey = `${payload.taskId}:${payload.status || "UNKNOWN"}`;
  if (handledAiTaskStateKeys.has(stateKey)) {
    return;
  }
  handledAiTaskStateKeys.add(stateKey);
  syncAiTaskCenterStatus(payload);

  const isEditingCurrentService =
    Number(serviceForm.serverServiceId || 0) ===
    Number(payload.serverServiceId || 0);

  if (payload.taskType === "GENERATE_DRAFT") {
    if (payload.status === "RUNNING" && isEditingCurrentService) {
      serviceEditorGenerating.value = true;
      return;
    }
    if (payload.status === "COMPLETED") {
      if (isEditingCurrentService) {
        mergeServiceAiDraft(payload.draft || null);
        serviceEditorGenerating.value = false;
      }
      message(
        `AI 草稿已生成${payload.aiProvider ? ` · ${payload.aiProvider}` : ""}`,
        { type: "success" },
      );
      return;
    }
    if (payload.status === "FAILED") {
      if (isEditingCurrentService) {
        serviceEditorGenerating.value = false;
      }
      message(payload.message || "AI 草稿生成失败", { type: "error" });
      return;
    }
    return;
  }

  if (payload.taskType === "ANALYZE_HOST_STABILITY") {
    if (payload.serverId) {
      hostAiAnalysisMap.value = {
        ...hostAiAnalysisMap.value,
        [payload.serverId]: payload,
      };
    }
    if (payload.status === "RUNNING") {
      hostStabilityAnalyzingId.value = payload.serverId || null;
      return;
    }
    if (payload.status === "COMPLETED") {
      hostStabilityAnalyzingId.value = null;
      message(payload.message || "AI 稳定性分析完成", { type: "success" });
      return;
    }
    if (payload.status === "FAILED") {
      hostStabilityAnalyzingId.value = null;
      message(payload.message || "AI 稳定性分析失败", { type: "error" });
      return;
    }
    return;
  }

  if (payload.taskType === "ANALYZE_METRIC_HISTORY") {
    const historyKey =
      payload.filterKey ||
      buildMetricHistoryAiFilterKey(payload.serverId, {
        metricKey: payload.metricType,
        minutes: payload.minutes,
        startTime: payload.startTime,
        endTime: payload.endTime,
        stateFilter: payload.stateFilter,
      });
    if (payload.serverId && payload.metricType) {
      metricHistoryAiMap.value = {
        ...metricHistoryAiMap.value,
        [historyKey]: payload,
      };
    }
    if (payload.status === "RUNNING") {
      metricHistoryAiAnalyzingKey.value = historyKey;
      return;
    }
    if (payload.status === "COMPLETED") {
      metricHistoryAiAnalyzingKey.value = "";
      message(payload.message || "指标历史 AI 分析完成", { type: "success" });
      return;
    }
    if (payload.status === "FAILED") {
      metricHistoryAiAnalyzingKey.value = "";
      message(payload.message || "指标历史 AI 分析失败", { type: "error" });
      return;
    }
    return;
  }

  if (payload.taskType === "ANALYZE_ALERT_HISTORY") {
    const historyKey =
      payload.filterKey ||
      buildAlertHistoryAiFilterKey(payload.serverId, {
        metricType: payload.metricType,
        severity: payload.severity,
        startTime: payload.startTime,
        endTime: payload.endTime,
        limit: 80,
      });
    if (payload.serverId) {
      alertHistoryAiMap.value = {
        ...alertHistoryAiMap.value,
        [historyKey]: payload,
      };
    }
    if (payload.status === "RUNNING") {
      alertHistoryAiAnalyzingKey.value = historyKey;
      return;
    }
    if (payload.status === "COMPLETED") {
      alertHistoryAiAnalyzingKey.value = "";
      message(payload.message || "告警历史 AI 分析完成", { type: "success" });
      return;
    }
    if (payload.status === "FAILED") {
      alertHistoryAiAnalyzingKey.value = "";
      message(payload.message || "告警历史 AI 分析失败", { type: "error" });
      return;
    }
    return;
  }

  if (payload.taskType !== "DIAGNOSE_FAILURE") {
    return;
  }

  if (payload.status === "COMPLETED") {
    if (isEditingCurrentService) {
      serviceForm.latestAiReason =
        payload.aiReason || serviceForm.latestAiReason;
      serviceForm.latestAiSolution =
        payload.aiSolution || serviceForm.latestAiSolution;
      serviceForm.latestAiFixScript =
        payload.aiFixScript || serviceForm.latestAiFixScript;
      serviceForm.latestAiProvider =
        payload.aiProvider || serviceForm.latestAiProvider;
      serviceForm.latestAiModel = payload.aiModel || serviceForm.latestAiModel;
    }
    if (
      serviceLogsVisible.value &&
      Number(serviceLogService.value?.serverServiceId || 0) ===
        Number(payload.serverServiceId || 0)
    ) {
      await openServiceLogs(serviceLogService.value as ServerService);
    }
    message(payload.message || "AI 诊断完成", { type: "success" });
    return;
  }

  if (payload.status === "FAILED") {
    message(payload.message || "AI 诊断失败", { type: "error" });
  }
};

const generateServiceAiDraft = async (draft?: ServerService) => {
  const next = { ...serviceForm, ...(draft || {}) };
  patchServiceForm(next);
  if (!next.serverServiceId) {
    message("请先保存服务，再调用 AI 生成草稿", { type: "warning" });
    return;
  }
  serviceEditorGenerating.value = true;
  const requestId = `server-service-ai-draft-${next.serverServiceId}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `AI 服务草稿 · ${next.serviceName || next.serverServiceId}`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: "正在提交 AI 服务草稿任务",
  });
  try {
    const result = await generateServerServiceAiDraft(next.serverServiceId);
    const ticket = result.data as ServerAiTaskTicket | undefined;
    if (ticket?.taskId && String(ticket.taskId) !== String(requestId)) {
      task.update({
        requestId: ticket.taskId,
        title: `AI 服务草稿 · ${next.serviceName || next.serverServiceId}`,
      });
    }
    if (ticket?.taskId) {
      task.progress(45, {
        message: ticket.message || "AI 草稿任务已进入后台执行",
      });
    } else {
      task.success({
        progress: 100,
        message: ticket?.message || "AI 草稿生成任务已受理",
      });
    }
    message(ticket?.message || "AI 草稿生成任务已受理", { type: "success" });
  } catch (error) {
    console.error(error);
    task.error({
      message: "AI 生成服务主档失败",
    });
    message("AI 生成服务主档失败", { type: "error" });
  } finally {
    serviceEditorGenerating.value = false;
  }
};

const syncSelection = () => {
  if (!hostItems.value.length) {
    selectedId.value = null;
    return;
  }
  if (
    !selectedId.value ||
    !hostItems.value.some((item) => item.serverId === selectedId.value)
  ) {
    selectedId.value = hostItems.value[0].serverId || null;
  }
};

const toggleAggregateMode = () => {
  aggregateMode.value = !aggregateMode.value;
  if (!aggregateMode.value) {
    aggregateHostIds.value = [];
  }
};

const toggleAggregateHostSelection = (host: ServerHost) => {
  const serverId = Number(host.serverId || 0);
  if (!serverId) {
    return;
  }
  const exists = aggregateHostIds.value.includes(serverId);
  aggregateHostIds.value = exists
    ? aggregateHostIds.value.filter((item) => item !== serverId)
    : [...aggregateHostIds.value, serverId];
};

const openAggregateDashboard = () => {
  if (!aggregateHostIds.value.length) {
    message("请先在左侧多选至少一台服务器", { type: "warning" });
    return;
  }
  router.push({
    path: "/server/techui/aggregate",
    query: {
      ids: aggregateHostIds.value.join(","),
    },
  });
};

const applyMetricSnapshots = (snapshots: ServerMetricsSnapshot[] = []) => {
  if (!snapshots.length) {
    return;
  }
  const nextMetrics = { ...serverMetricsMap.value };
  const nextHistory = { ...serverMetricsHistoryMap.value };
  snapshots.forEach((item) => {
    if (!item?.serverId) {
      return;
    }
    nextMetrics[item.serverId] = item;
    const currentHistory = nextHistory[item.serverId] || [];
    nextHistory[item.serverId] = [
      ...currentHistory.slice(-19),
      {
        ...item,
        collectTimestamp: normalizeMetricTimestamp(
          item.collectTimestamp,
          currentHistory,
        ),
      },
    ];
  });
  serverMetricsMap.value = nextMetrics;
  serverMetricsHistoryMap.value = nextHistory;
  hosts.value = hosts.value.map((host) => ({
    ...host,
    statusSnapshot: host.serverId
      ? nextMetrics[host.serverId] || host.statusSnapshot
      : host.statusSnapshot,
  }));
};

const loadHosts = async () => {
  loading.value = true;
  try {
    const result = await listServerHosts({
      keyword: undefined,
      serverType: undefined,
      enabled: "",
    });
    hosts.value = normalizeHostList(result.data);
    syncSelection();
  } finally {
    loading.value = false;
  }
};

const loadMetrics = async (forceRefresh = false) => {
  const listResult = forceRefresh
    ? await refreshServerHostMetrics().catch(() => null)
    : null;
  if (listResult?.data?.length) {
    applyMetricSnapshots(listResult.data);
    return;
  }
  if (selectedHost.value?.serverId) {
    const snapshotResult = await getServerHostMetrics(
      selectedHost.value.serverId,
    ).catch(() => null);
    if (snapshotResult?.data) {
      applyMetricSnapshots([snapshotResult.data]);
    }
  }
};

const loadHostMetricsDetail = async (
  host?: ServerHost | null,
  force = false,
) => {
  const serverId = toNumericId(host?.serverId);
  if (!serverId) {
    return null;
  }
  if (!force && serverMetricsDetailMap.value[serverId]) {
    return serverMetricsDetailMap.value[serverId];
  }
  const result = await getServerHostMetricsDetail(serverId).catch(() => null);
  if (!result?.data) {
    return null;
  }
  serverMetricsDetailMap.value = {
    ...serverMetricsDetailMap.value,
    [serverId]: result.data,
  };
  return result.data;
};

const loadHostMetricsHistory = async (
  host?: ServerHost | null,
  minutes = 120,
  force = false,
) => {
  const serverId = toNumericId(host?.serverId);
  if (!serverId) {
    return [] as ServerMetricsSnapshot[];
  }
  const current = serverMetricsHistoryMap.value[serverId] || [];
  const cutoff = Date.now() - minutes * 60 * 1000;
  if (
    !force &&
    current.some((item) => Number(item.collectTimestamp || 0) >= cutoff)
  ) {
    return current;
  }
  const result = await getServerHostMetricsHistory(serverId, {
    minutes,
  }).catch(() => null);
  if (!result?.data?.length) {
    return current;
  }
  const sorted = [...result.data].sort(
    (left, right) =>
      Number(left.collectTimestamp || 0) - Number(right.collectTimestamp || 0),
  );
  const normalized = sorted.reduce<ServerMetricsSnapshot[]>((history, item) => {
    history.push({
      ...item,
      collectTimestamp: normalizeMetricTimestamp(
        item.collectTimestamp,
        history,
      ),
    });
    return history;
  }, []);
  serverMetricsHistoryMap.value = {
    ...serverMetricsHistoryMap.value,
    [serverId]: normalized,
  };
  return normalized;
};

const openMetricDetail = async (metric: MetricDetailKey) => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  metricDetailKey.value = metric;
  metricDetailVisible.value = true;
  await Promise.all([
    loadHostMetricsDetail(selectedHost.value, true),
    loadHostMetricsHistory(selectedHost.value, 120, true),
  ]);
};

const handleMetricHistoryRangeChange = async (minutes: number) => {
  if (!metricDetailVisible.value || !selectedHost.value?.serverId) {
    return;
  }
  await loadHostMetricsHistory(selectedHost.value, minutes, true);
};

const analyzeMetricHistory = async (payload: {
  metricKey: MetricDetailKey;
  minutes: number;
  startTime?: number;
  endTime?: number;
  stateFilter: "all" | "normal" | "warning" | "danger";
}) => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  const metricType = payload.metricKey.toUpperCase();
  const filterKey = buildMetricHistoryAiFilterKey(selectedHost.value.serverId, {
    metricKey: metricType,
    minutes: payload.minutes,
    startTime: payload.startTime,
    endTime: payload.endTime,
    stateFilter: payload.stateFilter,
  });
  const requestId = `server-metric-history-ai-${selectedHost.value.serverId}-${metricType}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `指标历史 AI 分析 · ${selectedHost.value.serverName || selectedHost.value.serverId} · ${metricType}`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: `正在分析${metricType}历史趋势`,
  });
  metricHistoryAiAnalyzingKey.value = filterKey;
  try {
    const result = await analyzeServerHostMetricHistory(
      selectedHost.value.serverId,
      {
        metricType,
        minutes: payload.minutes,
        startTime: payload.startTime,
        endTime: payload.endTime,
        stateFilter: payload.stateFilter,
      },
    );
    const ticket = result.data || {};
    if (ticket?.taskId && String(ticket.taskId) !== String(requestId)) {
      task.update({
        requestId: ticket.taskId,
        title: `指标历史 AI 分析 · ${selectedHost.value.serverName || selectedHost.value.serverId} · ${metricType}`,
      });
    }
    if (ticket?.taskId) {
      task.progress(45, {
        message: ticket.message || "指标历史 AI 分析已进入后台执行",
      });
    } else {
      task.success({
        progress: 100,
        message: ticket?.message || "指标历史 AI 分析任务已受理",
      });
      metricHistoryAiAnalyzingKey.value = "";
    }
    message(ticket?.message || "指标历史 AI 分析任务已受理", {
      type: "success",
    });
  } catch (error) {
    console.error(error);
    metricHistoryAiAnalyzingKey.value = "";
    task.error({
      message: "指标历史 AI 分析提交失败",
    });
    message("指标历史 AI 分析提交失败", { type: "error" });
  }
};

const loadMetricsTaskSettings = async (host?: ServerHost | null) => {
  const serverId = toNumericId(host?.serverId);
  const result = serverId
    ? await getServerHostMetricsTaskSettings(serverId).catch(() => null)
    : await getServerMetricsTaskSettings().catch(() => null);
  metricsTaskSettings.value = result?.data || null;
};

const openMetricsTaskDialog = async () => {
  metricsTaskVisible.value = true;
  await loadMetricsTaskSettings(selectedHost.value);
};

const submitMetricsTaskSettings = async (
  value: Partial<ServerMetricsTaskSettings> = {},
) => {
  metricsTaskSaving.value = true;
  try {
    const payload = {
      inheritGlobal: value.inheritGlobal,
      enabled: Boolean(value.enabled),
      refreshIntervalMs: Math.max(Number(value.refreshIntervalMs || 0), 1000),
      timeoutMs: Math.max(Number(value.timeoutMs || 0), 1000),
      cacheEnabled: Boolean(value.cacheEnabled),
      cacheTtlSeconds: Math.max(Number(value.cacheTtlSeconds || 0), 60),
    };
    const serverId = toNumericId(selectedHost.value?.serverId);
    const result = serverId
      ? await updateServerHostMetricsTaskSettings(serverId, payload)
      : await updateServerMetricsTaskSettings(payload);
    metricsTaskSettings.value = result.data || null;
    message(serverId ? "服务器采集策略已更新" : "指标采集任务已更新", {
      type: "success",
    });
    metricsTaskVisible.value = false;
  } catch (error) {
    console.error(error);
    message("指标采集任务更新失败", { type: "error" });
  } finally {
    metricsTaskSaving.value = false;
  }
};

const refreshMetricsTaskNow = async () => {
  const requestId = `server-metrics-refresh-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: "指标采集任务",
    mode: "stream",
    status: "running",
    progress: 30,
    message: "正在手工触发指标采集",
  });
  try {
    await refreshServerHostMetrics();
    await Promise.all([
      loadMetricsTaskSettings(selectedHost.value),
      selectedHost.value
        ? loadHostMetricsDetail(selectedHost.value, true)
        : Promise.resolve(),
      selectedHost.value
        ? loadHostMetricsHistory(selectedHost.value, 120, true)
        : Promise.resolve(),
    ]);
    task.success({
      progress: 100,
      message: "指标采集完成",
    });
    message("指标采集已刷新", { type: "success" });
  } catch (error) {
    console.error(error);
    task.error({
      message: "指标采集失败",
    });
    message("指标采集失败", { type: "error" });
  }
};

const analyzeSelectedHostStability = async () => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  hostStabilityAnalyzingId.value = selectedHost.value.serverId;
  const requestId = `server-host-stability-${selectedHost.value.serverId}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `预警中心 AI 分析 · ${
      selectedHost.value.serverName || selectedHost.value.serverId
    }`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: "正在提交服务器稳定性分析",
  });
  try {
    const result = await analyzeServerHostStability(
      selectedHost.value.serverId,
    );
    const ticket = result.data || {};
    if (ticket?.taskId && String(ticket.taskId) !== String(requestId)) {
      task.update({
        requestId: ticket.taskId,
        title: `预警中心 AI 分析 · ${
          selectedHost.value.serverName || selectedHost.value.serverId
        }`,
      });
    }
    if (ticket?.taskId) {
      task.progress(45, {
        message: ticket.message || "稳定性分析任务已进入后台执行",
      });
    } else {
      task.success({
        progress: 100,
        message: ticket?.message || "AI 稳定性分析任务已受理",
      });
    }
    message(result.data?.message || "AI 稳定性分析任务已受理", {
      type: "success",
    });
  } catch (error) {
    console.error(error);
    hostStabilityAnalyzingId.value = null;
    task.error({
      message: "AI 稳定性分析提交失败",
    });
    message("AI 稳定性分析提交失败", { type: "error" });
  }
};

const loadSelectedRemoteGateway = async (host?: ServerHost | null) => {
  if (!host?.serverId) {
    selectedRemoteGateway.value =
      host?.remoteGatewayConfig || host?.guacamoleConfig || null;
    return;
  }
  const result = await getServerHostRemoteConsoleConfig(host.serverId).catch(
    () => null,
  );
  selectedRemoteGateway.value =
    result?.data || host.remoteGatewayConfig || host.guacamoleConfig || null;
};

const loadGlobalAlertSettings = async () => {
  const result = await getServerAlertSettings().catch(() => null);
  globalAlertSettings.value = result?.data || null;
  patchAlertSettingsForm(globalAlertSettingsForm, result?.data || null);
};

const loadHostAlertSettings = async (host?: ServerHost | null) => {
  if (!host?.serverId) {
    selectedHostAlertSettings.value = null;
    patchAlertSettingsForm(hostAlertSettingsForm, {
      inheritGlobal: true,
      serverId: undefined,
    });
    return;
  }
  const result = await getServerHostAlertSettings(host.serverId).catch(
    () => null,
  );
  selectedHostAlertSettings.value = result?.data || null;
  patchAlertSettingsForm(
    hostAlertSettingsForm,
    result?.data || {
      serverId: host.serverId,
      inheritGlobal: true,
    },
  );
};

const loadAlerts = async (serverId?: number | null) => {
  const result = await listServerAlerts({
    serverId: toNumericId(serverId),
    limit: serverId ? 30 : 60,
  }).catch(() => null);
  mergeAlertEvents(result?.data || []);
};

const loadAlertHistory = async (alert?: ServerAlertEvent | null) => {
  const serverId = toNumericId(alert?.serverId || selectedHost.value?.serverId);
  if (!serverId) {
    selectedAlertHistory.value = [];
    return;
  }
  const result = await listServerAlerts({
    serverId,
    limit: 160,
  }).catch(() => null);
  selectedAlertHistory.value = result?.data || [];
};

const analyzeAlertHistory = async (payload: {
  metricType?: string;
  severity?: string;
  startTime?: number;
  endTime?: number;
  limit: number;
}) => {
  const serverId = toNumericId(selectedAlertDetail.value?.serverId || selectedHost.value?.serverId);
  if (!serverId) {
    return;
  }
  const filterKey = buildAlertHistoryAiFilterKey(serverId, payload);
  const requestId = `server-alert-history-ai-${serverId}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `告警历史 AI 分析 · ${selectedHost.value?.serverName || serverId}`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: "正在分析历史告警",
  });
  alertHistoryAiAnalyzingKey.value = filterKey;
  try {
    const result = await analyzeServerHostAlertHistory(serverId, {
      metricType: payload.metricType,
      severity: payload.severity,
      startTime: payload.startTime,
      endTime: payload.endTime,
      limit: payload.limit,
    });
    const ticket = result.data || {};
    if (ticket?.taskId && String(ticket.taskId) !== String(requestId)) {
      task.update({
        requestId: ticket.taskId,
        title: `告警历史 AI 分析 · ${selectedHost.value?.serverName || serverId}`,
      });
    }
    if (ticket?.taskId) {
      task.progress(45, {
        message: ticket.message || "告警历史 AI 分析已进入后台执行",
      });
    } else {
      task.success({
        progress: 100,
        message: ticket?.message || "告警历史 AI 分析任务已受理",
      });
      alertHistoryAiAnalyzingKey.value = "";
    }
    message(ticket?.message || "告警历史 AI 分析任务已受理", {
      type: "success",
    });
  } catch (error) {
    console.error(error);
    alertHistoryAiAnalyzingKey.value = "";
    task.error({
      message: "告警历史 AI 分析提交失败",
    });
    message("告警历史 AI 分析提交失败", { type: "error" });
  }
};

const loadServerCapabilities = async () => {
  const result = await getServerCapabilities().catch(() => null);
  serverCapabilities.value = result?.data || null;
  softEnabled.value = Boolean(result?.data?.softEnabled);
};

const loadSoftState = async () => {
  softLoading.value = true;
  try {
    if (!softEnabled.value) {
      softTargets.value = [];
      softInstallations.value = [];
      softOperations.value = [];
      softInstallationDetailMap.value = {};
      softPackageDetailMap.value = {};
      return;
    }
    const [targetResult, installationResult, operationResult] =
      await Promise.all([
        listSoftBindingTargets(),
        listServerSoftInstallations(),
        listServerSoftOperations(),
      ]);
    softTargets.value = targetResult.data || [];
    softInstallations.value = installationResult.data || [];
    softOperations.value = operationResult.data || [];
  } catch (error) {
    console.error(error);
    softEnabled.value = false;
    softTargets.value = [];
    softInstallations.value = [];
    softOperations.value = [];
    softInstallationDetailMap.value = {};
    softPackageDetailMap.value = {};
  } finally {
    softLoading.value = false;
  }
};

const loadFiles = async (path?: string) => {
  if (!selectedHost.value?.serverId) {
    fileEntries.value = [];
    return;
  }
  fileLoading.value = true;
  try {
    const nextPath = resolveFilePathWithinRoot(
      path || fileCurrentPath.value || hostDefaultPath(selectedHost.value),
      selectedHost.value,
    );
    const result = await listServerFiles(selectedHost.value.serverId, nextPath);
    fileCurrentPath.value = nextPath;
    fileEntries.value = sanitizeFileEntries(
      result.data || [],
      selectedHost.value,
    );
  } finally {
    fileLoading.value = false;
  }
};

const reloadFileTree = async (host = selectedHost.value) => {
  if (!host?.serverId) {
    fileTreeData.value = [];
    return;
  }
  const rootPath = resolveFilePathWithinRoot(hostDefaultPath(host), host);
  const result = await listServerFiles(host.serverId, rootPath);
  fileTreeData.value = sanitizeFileEntries(result.data || [], host)
    .sort((left, right) => {
      if (left.directory !== right.directory) {
        return left.directory ? -1 : 1;
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    })
    .map((entry) => buildFileTreeNode(entry, host));
};

const loadFileTreeChildren = async (
  node: { data?: ServerFileTreeNode },
  resolve: (data: ServerFileTreeNode[]) => void,
) => {
  if (!selectedHost.value?.serverId) {
    resolve([]);
    return;
  }
  const nodeData = node.data;
  if (!nodeData?.directory) {
    resolve([]);
    return;
  }
  const result = await listServerFiles(
    selectedHost.value.serverId,
    nodeData.path,
  );
  const children = sanitizeFileEntries(result.data || [], selectedHost.value)
    .sort((left, right) => {
      if (left.directory !== right.directory) {
        return left.directory ? -1 : 1;
      }
      return String(left.name || "").localeCompare(String(right.name || ""));
    })
    .map((entry) => buildFileTreeNode(entry, selectedHost.value));
  resolve(children);
};

const stopFileWatch = async () => {
  if (selectedHost.value?.serverId && fileWatchTicket.value?.watchId) {
    await stopServerFileWatch(
      selectedHost.value.serverId,
      fileWatchTicket.value.watchId,
    ).catch(() => false);
  }
  fileWatchTicket.value = null;
  fileWatchEnabled.value = false;
  fileLogLineCount.value = 0;
  fileLiveStatus.value = "未建立追尾";
  fileLogStream.disconnect();
};

const previewFile = async (entry: ServerFileEntry) => {
  if (!selectedHost.value?.serverId || !isTextPreviewable(entry)) {
    return;
  }
  fileContentLoading.value = true;
  try {
    const result = await readServerFileContent(
      selectedHost.value.serverId,
      entry.path,
      1024 * 256,
    );
    filePreview.value = result.data || null;
    fileDraftContent.value = result.data?.content || "";
    fileOriginalContent.value = result.data?.content || "";
    filePreviewPath.value = result.data?.path || entry.path;
    fileLogLineCount.value = 0;
    fileLogStream.lines.value = [];
    fileLiveStatus.value = result.data?.truncated
      ? "当前预览为截断快照"
      : "文件快照已加载";
    if (fileWatchEnabled.value) {
      await stopFileWatch();
      await toggleFileWatch(true);
    }
  } finally {
    fileContentLoading.value = false;
  }
};

const handleFileTreeSelect = async (node: ServerFileTreeNode) => {
  if (node.directory) {
    filePreview.value = null;
    filePreviewPath.value = "";
    fileDraftContent.value = "";
    fileOriginalContent.value = "";
    await stopFileWatch();
    await loadFiles(node.path);
    return;
  }
  if (selectedHost.value) {
    const windows = normalizeOs(selectedHost.value.osType) === "windows";
    const separatorPattern = windows ? /\\[^\\]+$/ : /\/[^/]+$/;
    const parentPath = normalizeDirectoryPath(
      node.path.replace(separatorPattern, "") ||
        hostDefaultPath(selectedHost.value),
      windows,
    );
    await loadFiles(parentPath);
  }
  await previewFile(toTreeFileEntry(node));
};

const enterFileEntry = async (entry: ServerFileEntry) => {
  if (entry.directory) {
    filePreview.value = null;
    filePreviewPath.value = "";
    fileDraftContent.value = "";
    fileOriginalContent.value = "";
    await stopFileWatch();
    await loadFiles(entry.path);
    return;
  }
  await previewFile(entry);
};

const openParentDirectory = async () => {
  if (!fileCurrentPath.value || !selectedHost.value) {
    return;
  }
  const windows = normalizeOs(selectedHost.value.osType) === "windows";
  const root = normalizeDirectoryPath(
    hostDefaultPath(selectedHost.value),
    windows,
  );
  const normalized = normalizeDirectoryPath(fileCurrentPath.value, windows);
  if (normalized === root) {
    return;
  }
  const separatorPattern = windows ? /\\[^\\]+$/ : /\/[^/]+$/;
  const parent = normalizeDirectoryPath(
    normalized.replace(separatorPattern, "") || root,
    windows,
  );
  if (
    parent.length < root.length ||
    !parent.toLowerCase().startsWith(root.toLowerCase())
  ) {
    await loadFiles(root);
    return;
  }
  await loadFiles(parent);
};

const toggleFileWatch = async (nextValue = !fileWatchEnabled.value) => {
  if (!selectedHost.value?.serverId || !filePreviewPath.value) {
    return;
  }
  if (!nextValue) {
    await stopFileWatch();
    return;
  }
  const result = await startServerFileWatch(
    selectedHost.value.serverId,
    filePreviewPath.value,
  );
  fileWatchTicket.value = result.data || null;
  if (fileWatchTicket.value?.watchId) {
    fileWatchEnabled.value = true;
    fileLiveStatus.value = `日志追尾中 #${fileWatchTicket.value.watchId}`;
    fileLogStream.connect(fileWatchTicket.value.watchId, true);
  }
};

const triggerUpload = () => {
  const input = document.getElementById(
    "server-file-upload-input",
  ) as HTMLInputElement | null;
  input?.click();
};

const handleUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement | null;
  const file = input?.files?.[0];
  if (!selectedHost.value?.serverId || !file) {
    return;
  }
  try {
    await uploadServerFile(
      selectedHost.value.serverId,
      file,
      fileCurrentPath.value || hostDefaultPath(selectedHost.value),
    );
    message(`已上传 ${file.name}`, { type: "success" });
    await loadFiles();
    await reloadFileTree();
  } finally {
    uploadInputKey.value += 1;
  }
};

const createFolder = async () => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  const result = await ElMessageBox.prompt("输入目录名", "新建目录", {
    inputPlaceholder: "logs / backup / release",
  }).catch(() => null);
  if (!result?.value?.trim()) {
    return;
  }
  const nextPath = `${fileCurrentPath.value.replace(/[\\/]+$/, "")}/${result.value.trim()}`;
  await createServerDirectory(selectedHost.value.serverId, nextPath);
  message("目录已创建", { type: "success" });
  await loadFiles();
  await reloadFileTree();
};

const renameEntry = async (entry: ServerFileEntry) => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  const result = await ElMessageBox.prompt("输入新的名称", "重命名", {
    inputValue: entry.name,
  }).catch(() => null);
  if (!result?.value?.trim() || result.value.trim() === entry.name) {
    return;
  }
  const parent = entry.path.replace(/[\\/][^\\/]+$/, "");
  await renameServerFile(selectedHost.value.serverId, {
    path: entry.path,
    targetPath: `${parent}/${result.value.trim()}`,
  });
  message("已重命名", { type: "success" });
  await loadFiles();
  await reloadFileTree();
};

const removeEntry = async (entry: ServerFileEntry) => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  await ElMessageBox.confirm(`确认删除 ${entry.name}？`, "删除文件", {
    type: "warning",
  });
  await deleteServerFile(
    selectedHost.value.serverId,
    entry.path,
    entry.directory,
  );
  if (entry.path === filePreviewPath.value) {
    filePreview.value = null;
    filePreviewPath.value = "";
    await stopFileWatch();
  }
  message("已删除", { type: "success" });
  await loadFiles();
  await reloadFileTree();
};

const downloadEntry = async (entry: ServerFileEntry) => {
  if (!selectedHost.value?.serverId || entry.directory) {
    return;
  }
  const blob = await downloadServerFile(
    selectedHost.value.serverId,
    entry.path,
  );
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = entry.name;
  anchor.click();
  URL.revokeObjectURL(href);
};

const resetFileDraft = () => {
  fileDraftContent.value = fileOriginalContent.value;
};

const saveFileDraft = async () => {
  if (
    !selectedHost.value?.serverId ||
    !filePreviewPath.value ||
    !fileDirty.value
  ) {
    return;
  }
  if (filePreview.value?.truncated) {
    message("当前是截断预览，暂不允许直接同步", { type: "warning" });
    return;
  }
  fileSaving.value = true;
  try {
    await writeServerFileContent(selectedHost.value.serverId, {
      path: filePreviewPath.value,
      content: fileDraftContent.value,
    });
    fileOriginalContent.value = fileDraftContent.value;
    filePreview.value = filePreview.value
      ? {
          ...filePreview.value,
          content: fileDraftContent.value,
          size: new TextEncoder().encode(fileDraftContent.value).length,
          truncated: false,
        }
      : filePreview.value;
    fileLiveStatus.value = "内容已同步";
    message("文件已同步", { type: "success" });
    await loadFiles(
      fileCurrentPath.value || hostDefaultPath(selectedHost.value),
    );
    await reloadFileTree();
  } finally {
    fileSaving.value = false;
  }
};

const openRemoteConsole = async (host?: ServerHost | null) => {
  const targetHost = host || selectedHost.value;
  if (!targetHost) {
    return;
  }
  if (
    targetHost.serverId &&
    targetHost.serverId !== selectedHost.value?.serverId
  ) {
    selectHost(targetHost.serverId);
    await nextTick();
  }
  const config =
    targetHost.remoteGatewayConfig ||
    targetHost.guacamoleConfig ||
    selectedRemoteGateway.value ||
    (targetHost.serverId
      ? (
          await getServerHostRemoteConsoleConfig(targetHost.serverId).catch(
            () => null,
          )
        )?.data
      : null);
  if (!config?.launchUrl) {
    message(config?.message || "当前服务器未配置远程控制入口", {
      type: "warning",
    });
    return;
  }
  remoteConsoleConfig.value = config;
  remoteConsoleHostName.value = targetHost.serverName || "";
  remoteConsoleLoading.value = true;
  remoteConsoleVisible.value = true;
};

const syncRemoteConsoleFullscreenState = () => {
  const container = remoteConsoleContainerRef.value;
  remoteConsoleFullscreen.value = Boolean(
    container && document.fullscreenElement === container,
  );
};

const toggleRemoteConsoleFullscreen = async () => {
  const container = remoteConsoleContainerRef.value;
  if (!container) {
    return;
  }
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await container.requestFullscreen();
  } catch (error) {
    console.error(error);
    message("当前环境不支持远程全屏", { type: "warning" });
  }
};

const openRemoteConsoleInNewTab = () => {
  if (!remoteConsoleLaunchUrl.value) {
    return;
  }
  const popup = window.open(
    remoteConsoleLaunchUrl.value,
    "_blank",
    "noopener,noreferrer",
  );
  if (!popup) {
    message("浏览器拦截了新标签页，请允许弹窗后重试", {
      type: "warning",
    });
  }
};

const handleRemoteConsoleClosed = async () => {
  if (document.fullscreenElement === remoteConsoleContainerRef.value) {
    await document.exitFullscreen().catch(() => undefined);
  }
  remoteConsoleFullscreen.value = false;
  remoteConsoleConfig.value = null;
  remoteConsoleLoading.value = false;
};

const loadServerServices = async () => {
  try {
    const result = await listServerServices();
    serverServices.value = result.data || [];
  } catch (error) {
    console.error(error);
    serverServices.value = [];
  }
};

const loadAll = async () => {
  await loadServerCapabilities();
  await Promise.all([
    loadHosts(),
    loadServerServices(),
    loadMetrics(true),
    loadGlobalAlertSettings(),
  ]);
  await loadSoftState();
  await loadSelectedRemoteGateway(selectedHost.value);
  await Promise.all([
    loadHostAlertSettings(selectedHost.value),
    loadAlerts(selectedHost.value?.serverId),
  ]);
  await Promise.all([
    hydrateSoftInsights(selectedHost.value),
    hydrateSoftInsights(softDrawerHost.value),
  ]);
  if (fileDrawerVisible.value) {
    await loadFiles(hostDefaultPath(selectedHost.value));
    await reloadFileTree(selectedHost.value);
  }
};

const selectHost = (id?: number) => {
  selectedId.value = id || null;
};
const openCreate = () => {
  editingId.value = null;
  patchForm({
    ...emptyForm(),
    baseDirectory: resolveDefaultBaseDirectory("windows"),
  });
  dialogVisible.value = true;
};
const openEdit = (host: ServerHost) => {
  editingId.value = host.serverId || null;
  patchForm(host);
  dialogVisible.value = true;
};
const openHostContextMenu = (event: MouseEvent, entry: ServerHostListEntry) => {
  hostContextMenuRef.value?.open(event, entry);
};
const openGlobalRemoteGateway = async () => {
  const result = await getServerRemoteGatewaySettings().catch(() => null);
  applyRemoteGatewayForm(globalRemoteGatewayForm, result?.data || null);
  globalRemoteGatewayForm.inheritGlobal = false;
  globalRemoteGatewayVisible.value = true;
};
const openGlobalAlertSettings = async () => {
  await loadGlobalAlertSettings();
  globalAlertSettingsVisible.value = true;
};
const openHostAlertSettings = async (host: ServerHost) => {
  if (!host.serverId) {
    return;
  }
  if (host.serverId !== selectedHost.value?.serverId) {
    selectHost(host.serverId);
    await nextTick();
  }
  await loadHostAlertSettings(host);
  hostAlertSettingsVisible.value = true;
};
const openHostRemoteGateway = async (host: ServerHost) => {
  if (!host.serverId) {
    return;
  }
  if (host.serverId !== selectedHost.value?.serverId) {
    selectHost(host.serverId);
    await nextTick();
  }
  const result = await getServerHostRemoteGateway(host.serverId).catch(
    () => null,
  );
  applyRemoteGatewayForm(hostRemoteGatewayForm, result?.data || null);
  hostRemoteGatewayVisible.value = true;
};
const submitGlobalAlertSettings = async () => {
  alertSettingsSaving.value = true;
  try {
    const result = await updateServerAlertSettings(
      toAlertSettingsPayload(globalAlertSettingsForm),
    );
    globalAlertSettings.value = result.data || null;
    patchAlertSettingsForm(globalAlertSettingsForm, result.data || null);
    globalAlertSettingsVisible.value = false;
    if (
      selectedHost.value?.serverId &&
      (!selectedHostAlertSettings.value ||
        selectedHostAlertSettings.value.inheritGlobal)
    ) {
      await loadHostAlertSettings(selectedHost.value);
    }
    message("全局预警设置已保存", { type: "success" });
  } finally {
    alertSettingsSaving.value = false;
  }
};
const submitHostAlertSettings = async () => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  alertSettingsSaving.value = true;
  try {
    const result = await updateServerHostAlertSettings(
      selectedHost.value.serverId,
      toAlertSettingsPayload({
        ...hostAlertSettingsForm,
        serverId: selectedHost.value.serverId,
      }),
    );
    selectedHostAlertSettings.value = result.data || null;
    patchAlertSettingsForm(hostAlertSettingsForm, result.data || null);
    hostAlertSettingsVisible.value = false;
    message("服务器预警设置已保存", { type: "success" });
  } finally {
    alertSettingsSaving.value = false;
  }
};

const stopProcessRefreshLoop = () => {
  if (processRefreshTimer) {
    clearInterval(processRefreshTimer);
    processRefreshTimer = null;
  }
  if (processSearchTimer) {
    clearTimeout(processSearchTimer);
    processSearchTimer = null;
  }
};

const applyProcessRows = (
  rows: ServerProcessView[],
  options?: {
    preserveSelection?: boolean;
    refreshedAt?: number | null;
  },
) => {
  const previousPid =
    options?.preserveSelection === false ? null : processSelectedPid.value;
  serverProcesses.value = rows;
  processRefreshedAt.value = options?.refreshedAt || Date.now();
  const nextProcess =
    rows.find((item) => item.pid === previousPid) || rows[0] || null;
  processSelectedPid.value = nextProcess?.pid || null;
  if (!nextProcess || nextProcess.pid !== previousPid) {
    selectedProcessAiAdvice.value = null;
  }
};

const syncProcessRefreshLoop = () => {
  stopProcessRefreshLoop();
  if (!processDialogVisible.value || !processAutoRefresh.value) {
    return;
  }
  processRefreshTimer = setInterval(() => {
    void loadHostProcesses({ silent: true, preserveSelection: true });
  }, 5000);
};

const selectProcessItem = (process: ServerProcessView | null) => {
  const nextPid = Number(process?.pid || 0) || null;
  if (processSelectedPid.value !== nextPid) {
    selectedProcessAiAdvice.value = null;
  }
  processSelectedPid.value = nextPid;
};

const loadHostProcesses = async (options?: {
  silent?: boolean;
  preserveSelection?: boolean;
}) => {
  const host = selectedHost.value;
  if (!host?.serverId) {
    serverProcesses.value = [];
    processSelectedPid.value = null;
    selectedProcessAiAdvice.value = null;
    return;
  }
  if (!options?.silent) {
    processLoading.value = true;
  }
  try {
    const result = await listServerHostProcesses(host.serverId, {
      keyword: processKeyword.value || undefined,
      limit: 120,
    });
    applyProcessRows(result.data || [], {
      preserveSelection: options?.preserveSelection,
      refreshedAt: Date.now(),
    });
  } finally {
    if (!options?.silent) {
      processLoading.value = false;
    }
  }
};

const openProcessDialog = async (host?: ServerHost | null) => {
  const targetHost = host || selectedHost.value;
  if (!targetHost?.serverId) {
    return;
  }
  if (targetHost.serverId !== selectedHost.value?.serverId) {
    selectHost(targetHost.serverId);
    await nextTick();
  }
  processDialogVisible.value = true;
  selectedProcessAiAdvice.value = null;
  await loadHostProcesses({ preserveSelection: false });
  syncProcessRefreshLoop();
};

const analyzeProcessItem = async (process: ServerProcessView) => {
  if (!selectedHost.value?.serverId || !process.pid) {
    return;
  }
  processAiAnalyzing.value = true;
  const requestId = `server-process-ai-${selectedHost.value.serverId}-${process.pid}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `进程分析 · ${process.name || process.pid}`,
    mode: "stream",
    status: "running",
    progress: 20,
    message: "开始分析目标进程",
  });
  try {
    const result = await analyzeServerHostProcess(
      selectedHost.value.serverId,
      process.pid,
    );
    selectedProcessAiAdvice.value = result.data || null;
    task.success({
      progress: 100,
      message: "进程分析完成",
    });
    message("进程分析已更新", { type: "success" });
  } catch (error: unknown) {
    const errorMessage =
      (error as { message?: string; msg?: string } | null)?.message ||
      (error as { message?: string; msg?: string } | null)?.msg ||
      "进程分析失败";
    task.error({
      message: errorMessage,
    });
    message(errorMessage, { type: "error" });
  } finally {
    processAiAnalyzing.value = false;
  }
};

const terminateProcessItem = async (payload: {
  process: ServerProcessView;
  force: boolean;
}) => {
  const host = selectedHost.value;
  const process = payload.process;
  if (!host?.serverId || !process.pid) {
    return;
  }
  const actionLabel = payload.force ? "强制结束" : "结束";
  await ElMessageBox.confirm(
    `确认${actionLabel}进程「${process.name || process.pid}」？`,
    `${actionLabel}进程`,
    { type: "warning" },
  );
  processActionLoadingKey.value = `${payload.force ? "force" : "terminate"}:${process.pid}`;
  const requestId = `server-process-stop-${host.serverId}-${process.pid}-${Date.now()}`;
  const task = taskCenterProvider.addTask({
    requestId,
    title: `${actionLabel}进程 · ${process.name || process.pid}`,
    mode: "stream",
    status: "running",
    progress: 25,
    message: `正在${actionLabel}目标进程`,
  });
  try {
    const result = await terminateServerHostProcess(
      host.serverId,
      process.pid,
      payload.force,
    );
    const commandResult = result.data;
    const success = commandResult?.success !== false;
    if (success) {
      task.success({
        progress: 100,
        message: commandResult?.message || `${actionLabel}完成`,
      });
      message(commandResult?.message || `${actionLabel}完成`, {
        type: "success",
      });
    } else {
      task.error({
        message: commandResult?.message || `${actionLabel}失败`,
      });
      message(commandResult?.message || `${actionLabel}失败`, {
        type: "error",
      });
    }
    await loadHostProcesses({ preserveSelection: true });
  } finally {
    processActionLoadingKey.value = "";
  }
};

const openFileDrawer = async (host?: ServerHost | null) => {
  const targetHost = host || selectedHost.value;
  if (!targetHost?.serverId) {
    return;
  }
  if (targetHost.serverId !== selectedHost.value?.serverId) {
    selectHost(targetHost.serverId);
    await nextTick();
  }
  fileDrawerVisible.value = true;
  await loadFiles(fileCurrentPath.value || hostDefaultPath(targetHost));
  await reloadFileTree(targetHost);
};
const openDashboard = async (host?: ServerHost | null) => {
  if (host?.serverId) {
    selectHost(host.serverId);
    await nextTick();
  }
  const target = host || selectedHost.value;
  router.push({
    path: "/server/techui",
    query: {
      serverId: target?.serverId || "",
      serverName: target?.serverName || "",
    },
  });
};

const openProjectManagement = async (host?: ServerHost | null) => {
  if (host?.serverId) {
    selectHost(host.serverId);
    await nextTick();
  }
  const target = host || selectedHost.value;
  router.push({
    path: "/server/projects",
    query: {
      serverId: target?.serverId || "",
      serverName: target?.serverName || "",
    },
  });
};

const openAlertDetail = async (alert: ServerAlertEvent) => {
  selectedAlertDetail.value = alert;
  alertDetailVisible.value = true;
  await loadAlertHistory(alert);
};
const openSoftDrawer = async (host: ServerHost) => {
  if (!softEnabled.value) {
    message("soft 模块当前未启用", { type: "warning" });
    return;
  }
  softDrawerHostId.value = host.serverId || null;
  softDrawerVisible.value = true;
  if (!softTargets.value.length && !softLoading.value) {
    await loadSoftState();
  }
  await hydrateSoftInsights(host);
};
const openInstallationDetail = (installation: ServerSoftInstallation) => {
  if (!installation.softPackageId || !installation.softInstallationId) {
    return;
  }
  router.push(
    `/soft/detail/${installation.softPackageId}?installationId=${installation.softInstallationId}`,
  );
};
const submitGlobalRemoteGateway = async () => {
  remoteGatewaySaving.value = true;
  try {
    await updateServerRemoteGatewaySettings(
      toRemoteGatewayPayload(globalRemoteGatewayForm),
    );
    message("全局远程代理已保存", { type: "success" });
    globalRemoteGatewayVisible.value = false;
    await loadHosts();
    await loadSelectedRemoteGateway(selectedHost.value);
  } finally {
    remoteGatewaySaving.value = false;
  }
};
const submitHostRemoteGateway = async () => {
  if (!selectedHost.value?.serverId) {
    return;
  }
  remoteGatewaySaving.value = true;
  try {
    await updateServerHostRemoteGateway(
      selectedHost.value.serverId,
      toRemoteGatewayPayload(hostRemoteGatewayForm),
    );
    message("服务器远程代理已保存", { type: "success" });
    hostRemoteGatewayVisible.value = false;
    await loadHosts();
    await loadSelectedRemoteGateway(selectedHost.value);
  } finally {
    remoteGatewaySaving.value = false;
  }
};
const submit = async () => {
  if (!form.serverName) {
    message("服务器名称不能为空", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    syncFormTags();
    const payload: ServerHost = {
      ...form,
      serverCode: formServerCodePreview.value,
      host: form.serverType === "LOCAL" ? form.host || "127.0.0.1" : form.host,
      username: form.serverType === "LOCAL" ? "" : form.username,
      password: form.serverType === "LOCAL" ? "" : form.password,
      privateKey: form.serverType === "SSH" ? form.privateKey : "",
      tags: (form.tagsList || []).join(", "),
      metadataJson: form.metadataJson || "",
    };
    if (editingId.value) {
      await updateServerHost(editingId.value, payload);
    } else {
      await createServerHost(payload);
    }
    message("服务器已保存", { type: "success" });
    dialogVisible.value = false;
    await loadAll();
  } finally {
    saving.value = false;
  }
};
const toggleEnabled = async (host: ServerHost) => {
  if (!host.serverId) return;
  await updateServerHostEnabled(host.serverId, !host.enabled);
  message(host.enabled ? "服务器已停用" : "服务器已启用", { type: "success" });
  await loadAll();
};
const removeHost = async (host: ServerHost) => {
  if (!host.serverId) return;
  await ElMessageBox.confirm(
    `确认删除服务器「${host.serverName}」？`,
    "删除服务器",
    { type: "warning" },
  );
  await deleteServerHost(host.serverId);
  message("服务器已删除", { type: "success" });
  if (softDrawerHostId.value === host.serverId) {
    softDrawerVisible.value = false;
    softDrawerHostId.value = null;
  }
  await loadAll();
};

watch(
  () => hostItems.value.map((item) => item.serverId).join(","),
  () => {
    syncSelection();
  },
);
watch(
  () => selectedHost.value?.serverId,
  async () => {
    await stopFileWatch();
    metricDetailVisible.value = false;
    metricDetailKey.value = null;
    filePreview.value = null;
    filePreviewPath.value = "";
    fileDraftContent.value = "";
    fileOriginalContent.value = "";
    fileEntries.value = [];
    fileTreeData.value = [];
    await hydrateSoftInsights(selectedHost.value);
    await loadHostMetricsDetail(selectedHost.value);
    await loadSelectedRemoteGateway(selectedHost.value);
    await loadHostAlertSettings(selectedHost.value);
    await loadAlerts(selectedHost.value?.serverId);
    if (processDialogVisible.value) {
      await loadHostProcesses({ preserveSelection: false });
    }
    if (fileDrawerVisible.value) {
      await loadFiles(hostDefaultPath(selectedHost.value));
      await reloadFileTree(selectedHost.value);
    }
  },
);
watch(
  () => softDrawerHost.value?.serverId,
  async () => {
    await hydrateSoftInsights(softDrawerHost.value);
  },
);
watch(
  () => processDialogVisible.value,
  async (visible) => {
    if (visible) {
      await loadHostProcesses({ preserveSelection: true });
      syncProcessRefreshLoop();
      return;
    }
    stopProcessRefreshLoop();
    processKeyword.value = "";
    processSelectedPid.value = null;
    processRefreshedAt.value = null;
    processActionLoadingKey.value = "";
    processAiAnalyzing.value = false;
    selectedProcessAiAdvice.value = null;
    serverProcesses.value = [];
  },
);
watch(
  () => processAutoRefresh.value,
  () => {
    syncProcessRefreshLoop();
  },
);
watch(
  () => processKeyword.value,
  (value, previous) => {
    if (!processDialogVisible.value || value === previous) {
      return;
    }
    if (processSearchTimer) {
      clearTimeout(processSearchTimer);
    }
    processSearchTimer = setTimeout(() => {
      void loadHostProcesses({ preserveSelection: false });
      syncProcessRefreshLoop();
    }, 260);
  },
);
watch(
  () => processStream.payloads.value,
  (value) => {
    if (!processDialogVisible.value || !selectedHost.value?.serverId) {
      return;
    }
    const payload = value[selectedHost.value.serverId];
    if (!payload?.processes) {
      return;
    }
    const payloadKeyword = normalizeProcessKeyword(payload.keyword);
    const currentKeyword = normalizeProcessKeyword(processKeyword.value);
    if (payloadKeyword !== currentKeyword) {
      return;
    }
    applyProcessRows(payload.processes || [], {
      preserveSelection: true,
      refreshedAt: Number(payload.refreshedAt || 0) || Date.now(),
    });
  },
  { deep: true },
);
watch(
  () => dialogVisible.value,
  (visible) => {
    if (!visible) {
      patchForm(emptyForm());
    }
  },
);
watch(
  () => form.serverType,
  (value, previous) => {
    const nextType = String(value || "LOCAL").toUpperCase();
    const previousType = String(previous || "").toUpperCase();
    const baseDirectoryLooksDefault =
      !form.baseDirectory ||
      ["\\", "/", "C:/", "C:\\", "/opt"].includes(String(form.baseDirectory));
    if (nextType === "LOCAL") {
      form.host = "127.0.0.1";
      form.port = 0;
      form.username = "";
      form.password = "";
      form.privateKey = "";
      if (baseDirectoryLooksDefault) {
        form.baseDirectory = resolveDefaultBaseDirectory(form.osType);
      }
      return;
    }
    if (!form.port || previousType !== nextType) {
      form.port = nextType === "WINRM" ? 5985 : 22;
    }
    if (previousType === "LOCAL") {
      form.host = "";
    }
    if (baseDirectoryLooksDefault) {
      form.baseDirectory = resolveDefaultBaseDirectory(form.osType);
    }
  },
);
watch(
  () => form.osType,
  () => {
    if (
      !form.baseDirectory ||
      ["\\", "/", "C:/", "C:\\", "/opt"].includes(String(form.baseDirectory))
    ) {
      form.baseDirectory = resolveDefaultBaseDirectory(form.osType);
    }
  },
);
watch(
  () => hostItems.value.map((item) => Number(item.serverId || 0)),
  (serverIds) => {
    const available = new Set(serverIds.filter((item) => item > 0));
    aggregateHostIds.value = aggregateHostIds.value.filter((item) =>
      available.has(item),
    );
  },
  { deep: true },
);
watch(
  () => serviceEditorVisible.value,
  (visible) => {
    if (!visible) {
      patchServiceForm(emptyServiceForm());
      serviceEditorGenerating.value = false;
      serviceEditorPublishing.value = false;
    }
  },
);
watch(
  () => serviceLogsVisible.value,
  (visible) => {
    if (!visible) {
      serviceLogs.value = [];
      serviceLogService.value = null;
    }
  },
);
watch(
  () => alertDetailVisible.value,
  (visible) => {
    if (!visible) {
      selectedAlertDetail.value = null;
      selectedAlertHistory.value = [];
      alertHistoryAiAnalyzingKey.value = "";
    }
  },
);
watch(
  () => fileDrawerVisible.value,
  async (visible) => {
    if (visible && selectedHost.value) {
      await loadFiles(
        fileCurrentPath.value || hostDefaultPath(selectedHost.value),
      );
      await reloadFileTree(selectedHost.value);
      return;
    }
    await stopFileWatch();
    fileOriginalContent.value = "";
  },
);
watch(
  () => metricsStream.snapshots.value,
  (value) => {
    const snapshots = Object.values(value || {}).map((item) => ({
      serverId: item.serverId,
      serverCode: item.serverCode,
      status: item.status,
      online: item.online,
      latencyMs: item.latencyMs,
      cpuUsage: item.cpuUsage,
      cpuCores: item.cpuCores,
      memoryUsage: item.memoryUsage,
      memoryTotalBytes: item.memoryTotalBytes,
      memoryUsedBytes: item.memoryUsedBytes,
      diskUsage: item.diskUsage,
      diskTotalBytes: item.diskTotalBytes,
      diskUsedBytes: item.diskUsedBytes,
      ioReadBytesPerSecond: item.ioReadBytesPerSecond,
      ioWriteBytesPerSecond: item.ioWriteBytesPerSecond,
      networkRxPacketsPerSecond: item.networkRxPacketsPerSecond,
      networkTxPacketsPerSecond: item.networkTxPacketsPerSecond,
      collectTimestamp: Number(item.collectTimestamp || Date.now()),
      detailMessage: item.message,
    })) as ServerMetricsSnapshot[];
    applyMetricSnapshots(snapshots);
  },
  { deep: true },
);
watch(
  () => serviceStream.services.value,
  (value) => {
    Object.values(value || {}).forEach((item) =>
      mergeServerServiceSnapshot(item),
    );
  },
  { deep: true },
);
watch(
  () => aiTaskStream.tasks.value,
  (value) => {
    Object.values(value || {}).forEach((item) => {
      void applyAiTaskPayload(item);
    });
  },
  { deep: true },
);
watch(
  () => alertStream.alerts.value,
  (value) => {
    mergeAlertEvents(Object.values(value || {}));
  },
  { deep: true },
);
watch(
  () => fileLogStream.lines.value,
  (lines) => {
    if (!lines.length || lines.length <= fileLogLineCount.value) {
      return;
    }
    const deltaLines = lines.slice(fileLogLineCount.value);
    const dirty = fileDraftContent.value !== fileOriginalContent.value;
    if (dirty) {
      fileLiveStatus.value = `追尾检测到 ${deltaLines.length} 行新内容，请先同步或还原编辑`;
      fileLogLineCount.value = lines.length;
      return;
    }
    const current = fileDraftContent.value.trim();
    const nextContent = [current, deltaLines.join("\n")]
      .filter(Boolean)
      .join("\n");
    fileDraftContent.value = nextContent;
    fileOriginalContent.value = nextContent;
    fileLogLineCount.value = lines.length;
    fileLiveStatus.value = `已追加 ${deltaLines.length} 行`;
  },
  { deep: true },
);
watch(
  () => [installForm.softPackageVersionId, installVisible.value],
  async ([versionId, visible], [oldVersionId, oldVisible]) => {
    if (!visible || !installSelectedPackage.value?.softPackageId) {
      return;
    }
    if (versionId === oldVersionId && visible === oldVisible) {
      return;
    }
    await reloadInstallGuide();
  },
);
watch(
  () => installVisible.value,
  (visible) => {
    if (!visible) {
      installHostId.value = null;
      resetInstallDialog();
    }
  },
);

onMounted(async () => {
  document.addEventListener(
    "fullscreenchange",
    syncRemoteConsoleFullscreenState,
  );
  aiTaskStream.connect();
  alertStream.connect();
  metricsStream.connect();
  processStream.connect();
  serviceStream.connect();
  await loadAll();
});
onUnmounted(() => {
  document.removeEventListener(
    "fullscreenchange",
    syncRemoteConsoleFullscreenState,
  );
  aiTaskStream.disconnect();
  alertStream.disconnect();
  metricsStream.disconnect();
  processStream.disconnect();
  serviceStream.disconnect();
  stopProcessRefreshLoop();
  stopFileWatch();
});
</script>
<style scoped lang="scss">
.server-page,
.server-layout,
.server-toolbar,
.server-toolbar__filters,
.server-toolbar__side,
.server-panel,
.server-panel__scroll,
.server-node-list,
.server-node,
.server-detail-grid,
.server-grid,
.server-grid-card,
.server-form-grid,
.soft-drawer__scroll,
.soft-drawer__list {
  min-width: 0;
}

.server-page {
  display: grid;
  gap: 12px;
  color: #0f172a;
  padding: 6px 0 2px;
  height: calc(
    100vh - var(--layout-navbar-height, 56px) - var(--layout-tag-height, 34px) -
      32px
  );
  min-height: 520px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 28%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 26%);
}

/* 布局容器 */
.server-layout {
  display: grid;
  gap: 16px;
  grid-template-columns: 278px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  align-items: stretch;
  overflow: hidden;
}
.server-layout.is-sidebar-collapsed {
  grid-template-columns: 74px minmax(0, 1fr);
}
.server-grid-shell {
  display: grid;
  gap: 16px;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}
.server-grid-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.server-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}
.view-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  height: 34px;
  padding: 0 14px;
  background: transparent;
  cursor: pointer;
}
.view-mode-pill.is-selected {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
}

/* 左侧面板 */
.server-panel {
  overflow: hidden;
  border: none;
  border-radius: 20px;
  background: #ffffff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.server-panel--list {
  width: 310px;
  max-width: 310px;
  transition: width 0.24s ease;
}
.server-panel--list.is-collapsed {
  width: 70px;
  max-width: 70px;
}
.server-panel :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
  padding: 16px;
  background: transparent;
}

/* 顶部工具栏 */
.server-panel__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.server-panel__header--sidebar {
  padding-bottom: 6px;
}
.server-panel__header-tools {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  flex-wrap: nowrap;
}

/* 搜索栏 */
.server-sidebar__search {
  display: grid;
  gap: 10px;
  margin-bottom: 6px;
}

/* 滚动区域 */
.server-panel__scroll {
  flex: 1;
  min-height: 0;
}
.server-panel__scroll :deep(.el-scrollbar__wrap) {
  height: 100%;
  min-height: 0;
}

/* ============================================== */
/* 核心：左侧服务器卡片 极简美化 + 立体 + 舒适比例 */
/* ============================================== */
.server-node-list {
  display: grid;
  gap: 12px;
  align-content: start;
}

/* 卡片主体 - 立体、圆角、干净 */
.server-node {
  position: relative;
  cursor: pointer;
  border: none;
  border-radius: 18px;
  background: #ffffff;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  transition: all 0.24s cubic-bezier(0.25, 1, 0.5, 1);
}
.server-node :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
}

/* 悬停/选中 立体上浮 */
.server-node:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
}
.server-node.is-active {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(14, 165, 233, 0.15);
}

/* 选中状态左侧蓝条 */
.server-node__active-bar {
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: #0ea5e9;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.server-node.is-active .server-node__active-bar {
  opacity: 1;
}

/* 系统标签 + 状态点 */
.server-node__ribbon {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.server-os-flag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.04);
  font-size: 12px;
}
.server-os-flag__shape {
  width: 20px;
  height: 20px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #fff;
}
.server-node__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

/* 状态颜色 */
.server-node__status-dot.is-online {
  background: #10b981;
}
.server-node__status-dot.is-warning {
  background: #f59e0b;
}
.server-node__status-dot.is-offline {
  background: #ef4444;
}
.server-node__status-dot.is-disabled {
  background: #94a3b8;
}

/* 标题行：名称 + 类型 */
.server-node__title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.server-node__title h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}
.server-node__title p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}
.server-node__type {
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.04);
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
}

/* 指标条：CPU / 内存 / 磁盘 */
.server-node__metric-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.server-node__metric {
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.03);
  text-align: center;
}
.server-node__metric small {
  font-size: 11px;
  color: #64748b;
}
.server-node__metric strong {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  color: #1e293b;
}

/* 地址信息 */
.server-node__meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #64748b;
}

/* 底部：描述 + 操作按钮 */
.server-node__footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
}
.server-node__desc {
  margin: 0;
  font-size: 12px;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
/* 按钮默认隐藏，hover 显示 */
.server-action-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.server-node .server-action-row {
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s ease;
}
.server-node:hover .server-action-row {
  opacity: 1;
  transform: translateY(0);
}

/* 收缩模式小图标 */
.server-node.is-collapsed {
  min-height: 60px;
  display: grid;
  place-items: center;
}
.server-node__collapsed-shell {
  position: relative;
}
.server-node__collapsed-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}
.server-node__collapsed-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

/* 以下为原有右侧详情、弹窗、文件管理样式，保持不变，保证功能完整 */
.server-detail-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.server-detail-card,
.soft-drawer__card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
}
.server-detail-card--wide {
  grid-column: 1 / -1;
}
.server-detail-card header {
  margin-bottom: 14px;
}
.server-detail-card dl {
  display: grid;
  gap: 12px;
  margin: 0;
}
.server-detail-card dl div {
  display: grid;
  gap: 4px;
}
.server-detail-card dt {
  color: #64748b;
  font-size: 12px;
}
.server-detail-card dd {
  margin: 0;
  color: #0f172a;
  line-height: 1.7;
  word-break: break-all;
}
.server-runtime-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.server-runtime-metric {
  display: grid;
  gap: 4px;
  min-height: 86px;
  padding: 14px 16px;
  border-radius: 18px;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.96),
    rgba(255, 255, 255, 0.78)
  );
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.server-runtime-metric small {
  color: #64748b;
  font-size: 11px;
}
.server-runtime-metric strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.45;
}
.server-file-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.server-file-toolbar__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}
.server-file-upload-input {
  display: none;
}
.server-file-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
  min-height: 560px;
}
.server-file-list,
.server-file-preview {
  min-height: 0;
  padding: 14px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 32%),
    rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}
.server-file-list {
  display: grid;
  align-content: start;
  gap: 10px;
  overflow: auto;
  max-height: calc(100vh - 220px);
}
.server-file-tree {
  min-height: 100%;
}
.server-file-tree :deep(.el-tree) {
  background: transparent;
}
.server-file-tree :deep(.el-tree-node__content) {
  height: auto;
  padding: 4px 0;
  border-radius: 12px;
}
.server-file-tree :deep(.el-tree-node__content:hover) {
  background: rgba(14, 165, 233, 0.08);
}
.server-file-tree__node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 6px 8px;
}
.server-file-tree__icon {
  width: 30px;
  height: 30px;
}
.server-file-tree__meta {
  min-width: 0;
}
.server-file-tree__meta strong {
  display: block;
  color: #0f172a;
}
.server-file-tree__meta p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}
.server-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  cursor: default;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.server-file-item.is-directory {
  cursor: pointer;
}

.server-file-item.is-file {
  cursor: text;
}
.server-file-item:hover,
.server-file-item.is-active {
  transform: translateY(-1px);
  border-color: #0ea5e9;
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}
.server-file-item__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.server-file-item__main p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}
.server-file-item__main strong {
  color: #0f172a;
}
.server-file-item__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 12px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  flex-shrink: 0;
}
.server-file-preview {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 220px);
  overflow: hidden;
}
.server-file-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}
.server-file-preview__header h4 {
  margin: 0;
  color: #0f172a;
}
.server-file-preview__header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}
.server-file-preview__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.server-file-preview__editor {
  min-height: 0;
  overflow: hidden;
}
.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.server-chip {
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}
.server-activity-list,
.server-soft-instance-grid,
.soft-drawer__list {
  display: grid;
  gap: 10px;
}
.server-activity-item,
.server-soft-instance,
.soft-drawer__item {
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.92);
}
.server-soft-instance {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.server-soft-instance:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.28);
  box-shadow: 0 16px 26px rgba(14, 165, 233, 0.1);
}
.soft-drawer__item {
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}
.soft-drawer__item:hover {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.26);
  box-shadow: 0 16px 26px rgba(14, 165, 233, 0.1);
}
.soft-drawer__service-card {
  cursor: default;
}
.soft-drawer__service-card:hover {
  transform: none;
}
.soft-drawer__service-body {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}
.soft-drawer__item-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.soft-drawer__item-meta {
  display: grid;
  gap: 4px;
  justify-items: end;
  text-align: right;
}
.soft-drawer__item-meta span {
  color: #0f172a;
  font-weight: 600;
}
.soft-drawer__item-meta small {
  color: #64748b;
}
.soft-drawer__service-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
}
.server-form__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.88);
}
.server-form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.server-form-grid__span-2 {
  grid-column: 1 / -1;
}
.soft-drawer__stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  margin-bottom: 16px;
}
.soft-drawer__stat {
  display: grid;
  gap: 2px;
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.88);
}
.soft-drawer__stat strong {
  color: #0f172a;
  font-size: 20px;
  line-height: 1;
}
.soft-drawer__stat span {
  color: #64748b;
  font-size: 12px;
}
.server-remote-console__body,
.server-remote-console__toolbar {
  display: flex;
  flex-direction: column;
}
.server-remote-console__body {
  gap: 12px;
  height: 100%;
  min-height: 0;
}
.server-remote-console__meta {
  display: grid;
  gap: 8px;
  min-width: 0;
  flex: 1;
}
.server-remote-console__toolbar {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.14);
}
.server-remote-console__hint {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}
.server-remote-console__stage {
  min-height: 0;
  flex: 1;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top, rgba(96, 165, 250, 0.12), transparent 26%),
    rgba(2, 6, 23, 0.94);
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.2);
}
.server-remote-console__frame {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 170px);
  border: none;
  background: #020617;
}
:deep(.server-remote-console.is-fullscreen .el-drawer__body) {
  padding-top: 10px;
}
.server-remote-console.is-fullscreen .server-remote-console__stage {
  border-color: rgba(96, 165, 250, 0.35);
  box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.16);
}
:deep(.el-button.is-circle) {
  width: 30px;
  height: 30px;
}
</style>
