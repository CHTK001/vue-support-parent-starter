<template>
  <div class="panel-root">
    <PanelDataSourceHub
      v-if="viewMode === 'hub'"
      :model-value="jdbcForm"
      :cached-count="cachedConnections.length"
      :sources="savedSources"
      :submitting="submitting"
      :testing-connection="testingConnection"
      :uploading-driver="uploadingDriver"
      @delete-source="handleDeleteSource"
      @edit-source="handleEditSource"
      @open-source="handleOpenSource"
      @open-sources="handleOpenSources"
      @open-project-management="handleOpenNginxProjectManagement"
      @open-service-panel="handleOpenServicePanel"
      @open-system-log="handleOpenSystemLog"
      @reset-form="resetForm"
      @save-source="handleSaveSource"
      @test-source="handleTestSource"
      @toggle-favorite="handleToggleFavorite"
      @upload-driver="handleUploadDriver"
      @update:model-value="handleFormUpdate"
    />

    <!-- 服务面板入口 -->
    <div v-if="viewMode === 'hub'" class="service-panel-entry" @click="viewMode = 'service-panel'">
      <IconifyIconOnline icon="ep:setting" style="font-size: 20px" />
      <span>服务面板</span>
    </div>

    <div v-else-if="viewMode === 'booting'" class="workspace-booting">
      <ElIcon class="is-loading workspace-booting__icon"><Loading /></ElIcon>
      <span>{{ bootingHint }}</span>
    </div>

    <!-- Nginx 工作区 -->
    <div v-else-if="viewMode === 'nginx'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Nginx" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <NginxProjectPanel
          v-if="nginxConnectionId && nginxProjectStandalone"
          :connection-id="nginxConnectionId"
          :host="workspaceSource?.host || ''"
          :port="workspaceSource?.port || 22"
          :username="workspaceSource?.username || 'root'"
          :password="workspaceSource?.password"
          :private-key="getStringAttribute(workspaceSource?.attributes, 'privateKey')"
        />
        <NginxWorkspace
          v-else-if="nginxConnectionId"
          :connection-id="nginxConnectionId"
          :host="workspaceSource?.host"
          :port="workspaceSource?.port"
          :username="workspaceSource?.username || 'root'"
          :password="workspaceSource?.password"
          :initial-tab="initialNginxTab"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="SSH 连接中..." />
      </div>
    </div>

    <!-- Redis 工作区 -->
    <div v-else-if="viewMode === 'redis'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Redis" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <RedisWorkspace
          v-if="redisConnectionId"
          :connection-id="redisConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="Redis 连接中..." />
      </div>
    </div>

    <!-- MongoDB 工作区 -->
    <div v-else-if="viewMode === 'mongo'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "MongoDB" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <MongoWorkspace
          v-if="mongoConnectionId"
          :connection-id="mongoConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="MongoDB 连接中..." />
      </div>
    </div>

    <!-- ZooKeeper 工作区 -->
    <div v-else-if="viewMode === 'zookeeper'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "ZooKeeper" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <ZookeeperWorkspace
          v-if="zookeeperConnectionId"
          :connection-id="zookeeperConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="ZooKeeper 连接中..." />
      </div>
    </div>

    <!-- Prometheus 工作区 -->
    <div v-else-if="viewMode === 'prometheus'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Prometheus" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <PrometheusWorkspace
          v-if="prometheusConnectionId"
          :connection-id="prometheusConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="Prometheus 连接中..." />
      </div>
    </div>

    <!-- InfluxDB 2.x 工作区 -->
    <div v-else-if="viewMode === 'influx'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "InfluxDB" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <InfluxWorkspace
          v-if="influxConnectionId"
          :connection-id="influxConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="InfluxDB 连接中..." />
      </div>
    </div>

    <!-- InfluxDB 3.x 工作区 -->
    <div v-else-if="viewMode === 'influxv3'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "InfluxDB 3" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <InfluxV3Workspace
          v-if="influxV3ConnectionId"
          :connection-id="influxV3ConnectionId"
          @close="handleBackHome"
        />
        <ElEmpty v-else description="InfluxDB 3 连接中..." />
      </div>
    </div>

    <!-- Nacos 工作区 -->
    <div v-else-if="viewMode === 'nacos'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Nacos" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <NacosWorkspace
          v-if="nacosConnectionId"
          :connection-id="nacosConnectionId"
        />
        <ElEmpty v-else description="Nacos 连接中..." />
      </div>
    </div>

    <!-- Docker 工作区 -->
    <div v-else-if="viewMode === 'docker'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Docker" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <DockerWorkspace
          v-if="dockerConnectionId"
          :connection-id="dockerConnectionId"
        />
        <ElEmpty v-else description="Docker 连接中..." />
      </div>
    </div>

    <!-- Kafka 工作区 -->
    <div v-else-if="viewMode === 'kafka'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "Kafka" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <KafkaWorkspace
          v-if="kafkaConnectionId"
          :connection-id="kafkaConnectionId"
        />
        <ElEmpty v-else description="Kafka 连接中..." />
      </div>
    </div>

    <div v-else-if="viewMode === 'rabbitmq'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "RabbitMQ" }}</strong>
          <span
            >{{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}</span
          >
        </div>
      </header>
      <div class="redis-mode__body">
        <RabbitMQWorkspace
          v-if="rabbitmqConnectionId"
          :connection-id="rabbitmqConnectionId"
        />
        <ElEmpty v-else description="RabbitMQ 连接中..." />
      </div>
    </div>

    <!-- MQTT 工作区 -->
    <div v-else-if="viewMode === 'mqtt'" class="mqtt-mode">
      <MqttWorkspace
        v-if="mqttConnectionId"
        :connection-id="mqttConnectionId"
        @close="handleBackHome"
      />
      <ElEmpty v-else description="MQTT 连接中..." />
    </div>

    <!-- DBX Web 工作区 -->
    <div v-else-if="viewMode === 'dbx'" class="dbx-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ workspaceSource?.connectionName || "DBX Web" }}</strong>
          <span>
            {{ workspaceSource?.host || "-" }}:{{ workspaceSource?.port || "-" }}
            / {{ workspaceSource?.databaseName || "-" }}
          </span>
        </div>
      </header>
      <div class="dbx-mode__body">
        <iframe
          v-if="dbxFrameUrl"
          class="dbx-frame"
          :src="dbxFrameUrl"
          title="DBX Web"
          allow="clipboard-read; clipboard-write"
          @load="onDbxIframeLoad"
        />
        <ElEmpty v-else description="DBX Web 正在准备..." />
      </div>
    </div>

    <!-- 服务面板 -->
    <div v-else-if="viewMode === 'service-panel'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackFromServicePanel">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>{{ sshSource?.connectionName || "服务面板" }}</strong>
          <span v-if="sshConnected">
            {{ sshSource?.host || "-" }}:{{ sshSource?.port || "-" }}
            <ElTooltip content="连接状态已固化，刷新页面不会丢失" placement="top">
              <IconifyIconOnline icon="ep:lock" style="margin-left: 4px; font-size: 12px; color: var(--el-color-warning); vertical-align: middle;" />
            </ElTooltip>
          </span>
          <span v-else>未连接服务器</span>
        </div>
      </header>
      <div class="redis-mode__body">
        <ServicePanelPage
          :sources="sshCapableSources"
          :sys-project-id="1"
          :ssh-connection-id="sshConnectionId"
          :ssh-connection-ids="sshConnectionIds"
          :ssh-connected="sshConnected"
          :ssh-connecting="sshConnecting"
          :ssh-error="sshError"
          :ssh-source="sshSource"
          :ssh-sources="sshSources"
          :install-preset="pendingInstallPreset"
          @back="handleBackFromServicePanel"
          @navigate="handleServiceNavigate"
          @open-panel="handleServiceOpenPanel"
          @connect="handleServicePanelConnect"
          @disconnect="handleServicePanelDisconnect"
          @consumed-install-preset="pendingInstallPreset = null"
        />
      </div>
    </div>

    <!-- 软件管理 -->
    <div v-else-if="viewMode === 'soft-manage'" class="redis-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip content="返回服务面板" placement="top">
            <ElButton circle plain size="small" @click="handleBackToServicePanel">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>
        </div>
        <div class="workspace-bar__meta">
          <strong>软件管理</strong>
          <span>管理可安装的软件定义</span>
        </div>
      </header>
      <div class="redis-mode__body">
        <SoftwareManagePage
          @install="handleServiceInstallPreset"
          @navigate="handleServiceNavigate"
        />
      </div>
    </div>

    <section v-else class="workspace-mode">
      <header class="workspace-bar">
        <div class="workspace-bar__main">
          <ElTooltip :content="asideCollapsed ? '展开对象树' : '收起对象树'">
            <ElButton
              circle
              plain
              size="small"
              :icon="asideCollapsed ? Expand : Fold"
              @click="toggleAside"
            />
          </ElTooltip>
          <ElTooltip content="返回数据源" placement="top">
            <ElButton circle plain size="small" @click="handleBackHome">
              <IconifyIconOnline icon="ep:back" />
            </ElButton>
          </ElTooltip>

          <ElPopover placement="bottom" trigger="click" width="220">
            <template #reference>
              <ElButton plain size="small">配置</ElButton>
            </template>
            <div class="config-panel">
              <span>默认预览条数</span>
              <ElInputNumber
                :controls="false"
                :min="100"
                :model-value="previewLimit"
                :step="100"
                @update:model-value="handlePreviewLimitChange"
              />
              <div class="config-panel__switch">
                <span>允许多项展开</span>
                <ElSwitch
                  :model-value="treeMultiExpand"
                  @update:model-value="handleTreeMultiExpandChange"
                />
              </div>
            </div>
          </ElPopover>
        </div>

        <div class="workspace-bar__meta">
          <strong>{{
            workspaceSource?.connectionName || "未命名数据源"
          }}</strong>
          <span>
            {{ workspaceSource?.host || "-" }}:{{
              workspaceSource?.port || "-"
            }}
            / {{ workspaceSource?.databaseName || "-" }}
          </span>
        </div>
      </header>

      <ScLayout
        class="workspace-frame"
        :left-collapsed="asideCollapsed"
        :left-collapsed-width="0"
        :left-enabled="true"
        :left-width="asideWidth"
        :rail-enabled="false"
        @left-resize="asideWidth = $event.width"
        @update:left-collapsed="asideCollapsed = $event"
      >
        <template #left>
          <JdbcCatalogTree
            :active-node-id="activeNode?.nodeId || ''"
            :catalog-tree="explorerTree"
            :collapsed="asideCollapsed"
            :expanded-keys="treeExpandedKeys"
            :multiple-expand="treeMultiExpand"
            :search-keyword="searchKeyword"
            :source-name="workspaceSource?.connectionName || ''"
            @collapse-table="handleCollapseTable"
            @collapse-node="handleCollapseNode"
            @context-action="handleContextAction"
            @expand-node="handleExpandNode"
            @expand-table="handleExpandTable"
            @inject-sql="
              (node) => {
                injectSql(`select * from ${fullTableName(node)};`);
                activeInspectorTabId = 'workspace';
              }
            "
            @open-table="handleOpenTable"
            @refresh="handleLoadCatalog"
            @search="handleSearch"
            @toggle-collapse="toggleAside"
            @update:search-keyword="searchKeyword = $event"
          />
        </template>

        <template #default>
          <div class="workspace-main">
            <JdbcDetailCard
              ref="detailRef"
              v-model:sql-text="sqlText"
              :active-path="activePath"
              :active-tab-id="activeInspectorTabId"
              :capabilities="capabilities"
              :catalogs="workspaceCatalogs"
              :datasource-metadata="datasourceMetadata"
              :error-message="errorMessage"
              :mysql-process-refresh-interval="mysqlProcessRefreshInterval"
              :preview-limit="previewLimit"
              :query-result="queryResult"
              :sql-result-page-num="sqlResultPageNum"
              :sql-explain-content="sqlExplainContent"
              :sql-explain-rows="sqlExplainRows"
              :sql-suggestions="sqlSuggestions"
              :submitting="submitting"
              :table-tabs="inspectorTabs"
              @change-tab-setting="handleTableTabSettingChange"
              @activate-tab="handleActivateInspectorTab"
              @close-tab="handleCloseInspectorTab"
              @create-account="handleCreateAccount"
              @delete-account="handleDeleteAccount"
              @execute="handleExecuteSql"
              @execute-selected="handleExecuteSelected"
              @execute-page="handleExecuteSqlPage"
              @explain="handleExplainSql"
              @grant-account="handleGrantAccount"
              @refresh-table-data="handleRefreshTableData"
              @revoke-account="handleRevokeAccount"
              @save-table-design="handleSaveTableDesign"
              @save-table-data="handleSaveTableData"
              @update-account="handleUpdateAccount"
              @generate-sql="handleGenerateSql"
              @quick-run="handleQuickRun"
              :backup-schedule="backupSchedule"
              :backup-loading="backupLoading"
              :backup-records="backupRecords"
              @refresh-mysql-process="handleRefreshMysqlProcess"
              @update-mysql-process-refresh-interval="
                handleUpdateMysqlProcessRefreshInterval
              "
              @kill-mysql-process="handleKillMysqlProcess"
              @execute-backup="handleExecuteBackup"
              @stop-backup="handleStopBackup"
              @open-backup-config="handleOpenBackupConfig"
              @delete-backup="handleDeleteBackup"
              @download-backup="handleDownloadBackup"
              :binlog-running="binlogRunning"
              :binlog-events="binlogEvents"
              @start-binlog="handleStartBinlog"
              @stop-binlog="handleStopBinlog"
              @refresh-binlog-events="handleRefreshBinlogEvents"
            />
          </div>
        </template>
      </ScLayout>
    </section>

    <teleport to="body">
      <div
        v-if="noteEditor.visible"
        class="note-popover"
        :style="{ left: `${noteEditor.x}px`, top: `${noteEditor.y}px` }"
      >
        <div class="note-popover__head">
          <strong>编辑备注</strong>
          <button type="button" @click="closeNoteEditor">×</button>
        </div>
        <ElInput
          v-model="noteEditor.value"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="输入备注内容"
          type="textarea"
        />
        <div class="note-popover__actions">
          <ElButton size="small" @click="closeNoteEditor">取消</ElButton>
          <ElButton size="small" type="primary" @click="submitNoteEditor"
            >保存</ElButton
          >
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { Expand, Fold, Loading } from "@element-plus/icons-vue";
import {
  ElButton,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElPopover,
  ElSwitch,
  ElTooltip,
} from "element-plus";
import {
  computed,
  nextTick,
watch,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import { decodeScParam, type ServerCredential } from "@repo/utils";
import ScLayout from "@repo/components/ScLayout";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  JdbcCatalogTree,
  JdbcDetailCard,
  PanelDataSourceHub,
  RedisWorkspace,
  NginxWorkspace,
  MongoWorkspace,
  ZookeeperWorkspace,
  PrometheusWorkspace,
  InfluxWorkspace,
  InfluxV3Workspace,
  NacosWorkspace,
  DockerWorkspace,
  KafkaWorkspace,
  RabbitMQWorkspace,
  MqttWorkspace,
} from "./components";
import NginxProjectPanel from "./components/NginxWorkspace/NginxProjectPanel.vue";
import ServicePanelPage from "./components/ServicePanel/ServicePanelPage.vue";
import SoftwareManagePage from "./components/ServicePanel/SoftwareManagePage.vue";
import {
  DEFAULT_JDBC_CONNECTION,
  PANEL_SOURCE_STORAGE_KEY,
  type JdbcConnectionForm,
  type PanelSavedSource,
} from "./panel";
import {
  closeJdbcConnection,
  createJdbcAccount,
  deleteJdbcAccount,
  deletePanelDatasource,
  executeJdbcTableAction,
  explainJdbcExecution,
  executeJdbcSql,
  explainJdbcStructure,
  fetchJdbcAccounts,
  fetchJdbcCapabilities,
  fetchJdbcConnectionMetadata,
  fetchJdbcProcessList,
  fetchPanelDbxFrame,
  fetchPanelDbxFrames,
  killJdbcProcess,
  fetchJdbcDatabaseDocument,
  fetchPanelSqlTemplate,
  fetchJdbcTableData,
  fetchJdbcTableStructure,
  generateJdbcSql,
  listJdbcCachedConnections,
  listPanelDatasources,
  listJdbcCatalogTree,
  listPanelRemarks,
  openJdbcConnection,
  grantJdbcAccount,
  revokeJdbcAccount,
  updateJdbcColumnComment,
  updateJdbcTableComment,
  savePanelRemark,
  savePanelDatasource,
  saveJdbcTableData,
  testPanelDatasource,
  searchJdbcCatalogTree,
  updateJdbcAccount,
  uploadPanelDatasourceDriver,
  startBackupSchedule,
  stopBackupSchedule,
  getBackupStatus,
  executeBackupNow,
  listBackups,
  deleteBackup,
  type PanelBackupSchedule,
  type PanelBackupRecord,
  startBinlogMonitor,
  stopBinlogMonitor,
  getBinlogStatus,
  getBinlogEvents,
  type PanelBinlogEvent,
  openRedisConnection,
  closeRedisConnection,
  openNginxConnection,
  closeNginxConnection,
  openSshConnection,
  closeSshConnection,
  openMongoConnection,
  closeMongoConnection,
  openZookeeperConnection,
  closeZookeeperConnection,
  openPrometheusConnection,
  closePrometheusConnection,
  openInfluxConnection,
  closeInfluxConnection,
  openInfluxV3Connection,
  closeInfluxV3Connection,
  openNacosConnection,
  closeNacosConnection,
  openDockerConnection,
  closeDockerConnection,
  openKafkaConnection,
  closeKafkaConnection,
  openRabbitMQConnection,
  closeRabbitMQConnection,
  openMqttConnection,
  closeMqttConnection,
  type JdbcCatalogNode,
  type JdbcConnectionMetadata,
  type JdbcQueryResult,
  type JdbcTableStructure,
  type PanelJdbcAccountSaveRequest,
  type PanelDatabaseDocumentView,
  type PanelJdbcAccountView,
  type PanelJdbcPrivilegeRequest,
  type PanelCapabilitySummary,
  type PanelConnectionDescriptor,
  type PanelDatasourcePayload,
  type PanelDatasourceView,
  type PanelRemarkView,
  type PanelTableRowUpdate,
  type PanelTableFilterItem,
  type PanelTableFilterJoin,
  type PanelTableDataView,
  type SoftwareBinding,
  type SoftwarePreset,
} from "./api";
import {
  decryptWorkspaceTicket,
  encryptWorkspaceTicket,
} from "./utils/workspaceTicket";

type ViewMode =
  | "hub"
  | "booting"
  | "redis"
  | "nginx"
  | "mongo"
  | "zookeeper"
  | "prometheus"
  | "influx"
  | "influxv3"
  | "nacos"
  | "docker"
  | "kafka"
  | "rabbitmq"
  | "mqtt"
  | "dbx"
  | "workspace"
  | "service-panel"
  | "soft-manage";
type NginxRailTab = "dashboard" | "editor" | "project" | "log";
type InspectorTabType =
  | "account"
  | "database-document"
  | "table"
  | "table-edit";
type InspectorViewMode =
  | "account"
  | "data"
  | "ddl"
  | "database-document"
  | "ai"
  | "indexes"
  | "columns";
type CommentMode = "comment" | "mixed" | "native";
type PaginationMode = "full" | "pagination";
type SortOrder = "" | "asc" | "desc";

interface InspectorTableTab {
  accounts: PanelJdbcAccountView[];
  aiContent: string;
  columnOrder: string[];
  databaseDocument?: PanelDatabaseDocumentView | null;
  dataCommentMode: CommentMode;
  dataResult: PanelTableDataView | null;
  ddlText: string;
  documentContent: string;
  filterKeyword: string;
  filterJoin: PanelTableFilterJoin;
  filters: PanelTableFilterItem[];
  frozenColumns: string[];
  hiddenColumns: string[];
  loadTotal: boolean;
  node: JdbcCatalogNode;
  paginationMode: PaginationMode;
  pageNum: number;
  pageSize: number;
  railShape: "default" | "round";
  showSequence: boolean;
  sortField: string;
  sortOrder: SortOrder;
  structure: JdbcTableStructure | null;
  tabId: string;
  tabName: string;
  tableCommentMode: CommentMode;
  tabType: InspectorTabType;
  viewMode: InspectorViewMode;
}

type TableArtifacts = Pick<
  InspectorTableTab,
  "aiContent" | "ddlText" | "documentContent" | "structure"
>;

const PANEL_CONFIG_STORAGE_KEY = "panel:workspace-config:v1";
const parseInitialQuery = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash || "";
  const queryMarkIndex = hash.indexOf("?");
  if (queryMarkIndex >= 0) {
    const hashQuery = hash.slice(queryMarkIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    hashParams.forEach((value, key) => {
      if (!searchParams.has(key)) {
        searchParams.set(key, value);
      }
    });
  }
  return searchParams;
};
const INITIAL_QUERY = parseInitialQuery();
const getInitialQueryValue = (key: string) => INITIAL_QUERY.get(key);
const INITIAL_WORKSPACE_TICKET = getInitialQueryValue("ticket");
const parseInitialNginxTab = (value: string | null): NginxRailTab =>
  value === "editor" || value === "project" || value === "log"
    ? value
    : "dashboard";
const isTruthyQueryFlag = (value: string | null) =>
  ["1", "true", "yes", "on"].includes(String(value || "").toLowerCase());
const initialScRaw = getInitialQueryValue("_sc");
const nginxProjectStandalone =
  isTruthyQueryFlag(getInitialQueryValue("nginxProjectStandalone")) ||
  Boolean(initialScRaw);
const initialNginxTab = parseInitialNginxTab(
  getInitialQueryValue("nginxTab") ||
    (nginxProjectStandalone ? "project" : null),
);

type NoteEditorState = {
  node: JdbcCatalogNode | null;
  targetType: "catalog" | "field" | "table";
  value: string;
  visible: boolean;
  x: number;
  y: number;
};

const jdbcForm = reactive<JdbcConnectionForm>({ ...DEFAULT_JDBC_CONNECTION });
const viewMode = ref<ViewMode>(INITIAL_WORKSPACE_TICKET ? "booting" : "hub");
const bootingHint = ref("正在恢复工作区...");
const savedSources = ref<PanelSavedSource[]>([]);
const cachedConnections = ref<PanelConnectionDescriptor[]>([]);
const workspaceSource = ref<PanelSavedSource | null>(null);
const sshCapableSources = computed(() =>
  savedSources.value.filter((s) => {
    const type = String(s.sourceType || "").toUpperCase();
    return (type === "SSH" || type === "NGINX") && s.host && s.port && s.username;
  }),
);
const activeConnectionId = ref("");
const dbxFrameUrl = ref("");
const dbxPassword = ref("springtest");
const dbxAutoLoginEnabled = ref(true);
const searchKeyword = ref("");
const catalogTree = ref<JdbcCatalogNode[]>([]);
const activeNode = ref<JdbcCatalogNode | null>(null);
const tableStructureCache = ref<Record<string, JdbcTableStructure>>({});
const fieldNotes = ref<Record<string, string>>({});
const objectNotes = ref<Record<string, string>>({});
const inspectorTabs = ref<InspectorTableTab[]>([]);
const activeInspectorTabId = ref("workspace");
const expandedCatalogNodeId = ref("");
const expandedTableNodeId = ref("");
const capabilities = ref<PanelCapabilitySummary | null>(null);
const datasourceMetadata = ref<JdbcConnectionMetadata | null>(null);
const queryResult = ref<JdbcQueryResult | null>(null);
const sqlResultPageNum = ref(1);
const mysqlProcessRefreshInterval = ref(10000);
const mysqlProcessAutoRefresh = ref(false);
let mysqlProcessRefreshTimer: number | null = null;
const backupSchedule = ref<PanelBackupSchedule | null>(null);
const backupRecords = ref<PanelBackupRecord[]>([]);
const backupLoading = ref(false);
const binlogRunning = ref(false);
const binlogEvents = ref<PanelBinlogEvent[]>([]);
const testingConnection = ref(false);
const redisConnectionId = ref("");
const nginxConnectionId = ref("");
const mongoConnectionId = ref("");
const zookeeperConnectionId = ref("");
const prometheusConnectionId = ref("");
const influxConnectionId = ref("");
const influxV3ConnectionId = ref("");
const nacosConnectionId = ref("");
const dockerConnectionId = ref("");
const kafkaConnectionId = ref("");
const rabbitmqConnectionId = ref("");
const mqttConnectionId = ref("");
const sshConnectionId = ref("");
const sshConnectionIds = ref<string[]>([]);
const sshSource = ref<PanelSavedSource | null>(null);
const sshSources = ref<PanelSavedSource[]>([]);
const sshConnecting = ref(false);
const sshError = ref<string | null>(null);
const sshConnected = computed(() => !!sshConnectionId.value);

/** SSH连接持久化（sessionStorage，防止刷新丢失） */
const SSH_SESSION_KEY = "panel:ssh:session";
interface SshSessionData {
  sourceId: string;
  host: string;
  port: number;
  username: string;
  connectionName: string;
  savedAt: number;
}
const saveSshSession = (source: PanelSavedSource) => {
  try {
    const data: SshSessionData = {
      sourceId: source.sourceId,
      host: source.host,
      port: source.port,
      username: source.username || "root",
      connectionName: source.connectionName,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(SSH_SESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
};
const clearSshSession = () => {
  try { sessionStorage.removeItem(SSH_SESSION_KEY); } catch { /* ignore */ }
};
const loadSshSession = (): SshSessionData | null => {
  try {
    const raw = sessionStorage.getItem(SSH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

// ─── URL 视图状态持久化 ──────────────────────────────────

const syncViewToUrl = () => {
  try {
    const params: string[] = [];
    if (viewMode.value !== 'hub') {
      params.push('view=' + encodeURIComponent(viewMode.value));
    }
    if (viewMode.value === 'service-panel' && sshSource.value) {
      params.push('source=' + encodeURIComponent(sshSource.value.sourceId));
    }
    if (viewMode.value !== 'hub' && viewMode.value !== 'service-panel' && workspaceSource.value) {
      params.push('source=' + encodeURIComponent(workspaceSource.value.sourceId));
    }
    const hash = params.length > 0 ? '#/?' + params.join('&') : '#/';
    history.replaceState(history.state, '', hash);
  } catch { /* ignore */ }
};

const parseUrlViewState = (): { view: string; sourceId?: string } | null => {
  try {
    const hash = window.location.hash;
    const m = hash.match(/[?&]view=([^&]+)/);
    if (!m) return null;
    const view = decodeURIComponent(m[1]);
    const sourceId = hash.match(/[?&]source=([^&]+)/)?.[1];
    return { view, sourceId: sourceId ? decodeURIComponent(sourceId) : undefined };
  } catch { return null; }
};

const resetWorkspaceConnectionRefs = () => {
  activeConnectionId.value = "";
  redisConnectionId.value = "";
  nginxConnectionId.value = "";
  mongoConnectionId.value = "";
  zookeeperConnectionId.value = "";
  prometheusConnectionId.value = "";
  influxConnectionId.value = "";
  influxV3ConnectionId.value = "";
  nacosConnectionId.value = "";
  dockerConnectionId.value = "";
  kafkaConnectionId.value = "";
  rabbitmqConnectionId.value = "";
  mqttConnectionId.value = "";
  dbxFrameUrl.value = "";
};
const sqlText = ref("select 1 as ping;");
const sqlExplainContent = ref("");
const sqlExplainRows = ref<Record<string, any>[]>([]);
const errorMessage = ref("");
const submitting = ref(false);
const uploadingDriver = ref(false);
const previewLimit = ref(1000);
const treeMultiExpand = ref(false);
const asideWidth = ref(236);
const asideCollapsed = ref(true);
const detailRef = ref<{
  exportPdf: () => Promise<void>;
  exportWord: () => Promise<void>;
  resetTableEditDraft: (tabId: string) => void;
} | null>(null);
const noteEditor = reactive<NoteEditorState>({
  node: null,
  targetType: "table",
  value: "",
  visible: false,
  x: 0,
  y: 0,
});
const tableArtifactRequests = new Map<string, Promise<TableArtifacts>>();
const tableDataRefreshTimers = new Map<string, number>();

const currentInspectorTab = computed(
  () =>
    inspectorTabs.value.find(
      (tab) => tab.tabId === activeInspectorTabId.value,
    ) || null,
);

const activePath = computed(() => {
  const node = currentInspectorTab.value?.node || activeNode.value;
  if (!node) {
    return "";
  }

  if (node.nodeType === "field") {
    return [node.catalogName, node.tableName, node.columnName || node.nodeName]
      .filter(Boolean)
      .join(".");
  }

  return [node.catalogName, node.schemaName, node.tableName || node.nodeName]
    .filter(Boolean)
    .join(".");
});

const buildFieldNoteKey = (node: JdbcCatalogNode, columnName: string) =>
  [
    activeConnectionId.value ||
      workspaceSource.value?.sourceId ||
      workspaceSource.value?.connectionName ||
      "workspace",
    node.catalogName || "catalog",
    node.tableName || node.nodeName,
    columnName,
  ].join("::");

const buildObjectNoteKey = (node: JdbcCatalogNode) =>
  [
    activeConnectionId.value ||
      workspaceSource.value?.sourceId ||
      workspaceSource.value?.connectionName ||
      "workspace",
    node.nodeType,
    node.catalogName || "catalog",
    node.schemaName || "schema",
    node.tableName || node.nodeName,
  ].join("::");

const buildFieldNodes = (tableNode: JdbcCatalogNode) => {
  const structure = tableStructureCache.value[tableNode.nodeId];
  if (!structure) {
    return [];
  }

  return structure.columns.map((column, index) => {
    const fieldName = String(column.name || `field_${index + 1}`);
    const fieldNote =
      fieldNotes.value[buildFieldNoteKey(tableNode, fieldName)] ||
      String(column.comment || "");
    return {
      nodeId: `${tableNode.nodeId}::field::${fieldName}`,
      parentId: tableNode.nodeId,
      nodeType: "field",
      nodeName: fieldName,
      columnName: fieldName,
      tableName: tableNode.tableName || tableNode.nodeName,
      catalogName: tableNode.catalogName,
      schemaName: tableNode.schemaName,
      description: fieldNote || String(column.comment || column.type || "字段"),
      attributes: {
        fieldType: column.type,
        fieldComment: column.comment,
        fieldNote,
      },
      children: [],
    } satisfies JdbcCatalogNode;
  });
};

const explorerTree = computed<JdbcCatalogNode[]>(() =>
  catalogTree.value.map((catalog) => ({
    ...catalog,
    nodeType: "catalog",
    nodeName: catalog.catalogName || catalog.nodeName,
    description:
      objectNotes.value[buildObjectNoteKey(catalog)] ||
      catalog.description ||
      "数据库",
    children: (catalog.children || []).flatMap((schema) =>
      (schema.children || []).map((table) => ({
        ...table,
        parentId: catalog.nodeId,
        nodeType: "table",
        nodeName: table.tableName || table.nodeName,
        description:
          objectNotes.value[buildObjectNoteKey(table)] ||
          tableStructureCache.value[table.nodeId]?.tableComment ||
          schema.nodeName ||
          schema.schemaName ||
          "Table",
        children: buildFieldNodes(table),
      })),
    ),
  })),
);

const treeExpandedKeys = computed(() => {
  return [expandedCatalogNodeId.value, expandedTableNodeId.value].filter(
    Boolean,
  ) as string[];
});

const workspaceCatalogs = computed(() =>
  explorerTree.value
    .map((item) => item.catalogName || item.nodeName)
    .filter((item): item is string => Boolean(item)),
);

const sqlSuggestions = computed(() => {
  const tokens = new Set<string>();

  explorerTree.value.forEach((catalog) => {
    (catalog.children || []).forEach((table) => {
      tokens.add(String(table.tableName || table.nodeName));
      const fullName = [
        table.catalogName,
        table.schemaName,
        table.tableName || table.nodeName,
      ]
        .filter(Boolean)
        .join(".");
      if (fullName) {
        tokens.add(fullName);
      }
    });
  });

  Object.values(tableStructureCache.value).forEach((structure) => {
    structure.columns.forEach((column) => {
      if (column.name) {
        tokens.add(String(column.name));
      }
    });
  });

  return [...tokens];
});

const resetForm = () => {
  Object.assign(jdbcForm, { ...DEFAULT_JDBC_CONNECTION });
};

const handleFormUpdate = (value: JdbcConnectionForm) => {
  Object.assign(jdbcForm, value);
};

const normalizeTree = (nodes: JdbcCatalogNode[]) =>
  nodes.map((node) => ({
    ...node,
    children: normalizeTree(node.children || []),
  }));

const normalizeAttributes = (value?: Record<string, any> | null) =>
  value && typeof value === "object" ? { ...value } : {};

const getStringAttribute = (
  attributes: Record<string, any> | undefined,
  key: string,
  fallback?: string,
) => {
  const value = attributes?.[key];
  return value === undefined || value === null || value === ""
    ? fallback
    : String(value);
};

const getNumberAttribute = (
  attributes: Record<string, any> | undefined,
  key: string,
  fallback = 0,
) => {
  const value = Number(attributes?.[key]);
  return Number.isFinite(value) ? value : fallback;
};

const resolvePayloadDatabaseName = (
  source: PanelSavedSource | JdbcConnectionForm,
) => {
  const attributes = normalizeAttributes(source.attributes);
  if (source.sourceType === "REDIS") {
    return String(
      getNumberAttribute(
        attributes,
        "dbIndex",
        Number(source.databaseName) || 0,
      ),
    );
  }
  if (source.sourceType === "MONGODB") {
    return (
      getStringAttribute(
        attributes,
        "authDatabase",
        source.databaseName || "",
      ) || ""
    );
  }
  return source.databaseName || "";
};

const buildJdbcProtocol = (source: PanelSavedSource | JdbcConnectionForm) => {
  const dialect = String(source.jdbcDialectType || "MYSQL").toUpperCase();
  const protocol = (source.protocol || "").trim();
  if (protocol.startsWith("jdbc:")) {
    // 避免误把示例 H2 URL 当成 MySQL 连接使用（会导致后端识别为 H2Dialect）
    if (
      (dialect === "MYSQL" || dialect === "MARIADB") &&
      protocol.toLowerCase().startsWith("jdbc:h2:")
    ) {
      // 忽略 H2 协议，走 host/port 拼接 MySQL/MariaDB URL
    } else {
      return protocol;
    }
  }
  const host = String(source.host || "").trim();
  const port = Number(source.port || 0);
  const database = String(source.databaseName || "").trim();
  if (!host || port <= 0) {
    return protocol;
  }

  const attributes = normalizeAttributes(source.attributes);
  const queryParams = new URLSearchParams();
  if (source.sslEnabled) {
    queryParams.set(dialect === "POSTGRESQL" ? "ssl" : "useSSL", "true");
  }
  if (source.connectTimeoutMillis > 0) {
    queryParams.set(
      dialect === "POSTGRESQL" ? "connectTimeout" : "connectTimeout",
      String(source.connectTimeoutMillis),
    );
  }
  if (source.socketTimeoutMillis > 0) {
    queryParams.set("socketTimeout", String(source.socketTimeoutMillis));
  }
  if ((source.charset || "").trim()) {
    queryParams.set("characterEncoding", String(source.charset).trim());
  }
  const extraParams = String(attributes.extraParams || "").trim();
  if (extraParams) {
    for (const part of extraParams.split(/[&;\n]/)) {
      const segment = part.trim();
      if (!segment) {
        continue;
      }
      const [name, rawValue] = segment.split("=", 2);
      if (name) {
        queryParams.set(name.trim(), (rawValue || "").trim());
      }
    }
  }

  const querySuffix = queryParams.toString();
  const withQuery = (base: string) =>
    querySuffix ? `${base}?${querySuffix}` : base;
  const withSemicolon = (base: string) =>
    querySuffix
      ? `${base};${querySuffix
          .split("&")
          .map((segment) => segment.replace("=", "="))
          .join(";")}`
      : base;

  switch (dialect) {
    case "ORACLE":
      return database
        ? `jdbc:oracle:thin:@//${host}:${port}/${database}`
        : `jdbc:oracle:thin:@${host}:${port}`;
    case "POSTGRESQL":
      return withQuery(
        `jdbc:postgresql://${host}:${port}${database ? `/${database}` : ""}`,
      );
    case "SQLSERVER":
      return withSemicolon(
        `jdbc:sqlserver://${host}:${port}${database ? `;databaseName=${database}` : ""}`,
      );
    case "CLICKHOUSE":
      return withQuery(
        `jdbc:clickhouse://${host}:${port}${database ? `/${database}` : ""}`,
      );
    case "MARIADB":
      return withQuery(
        `jdbc:mariadb://${host}:${port}${database ? `/${database}` : ""}`,
      );
    default:
      return withQuery(
        `jdbc:mysql://${host}:${port}${database ? `/${database}` : ""}`,
      );
  }
};

const buildJdbcConnectionAttributes = (
  source: PanelSavedSource | JdbcConnectionForm,
) => ({
  ...normalizeAttributes(source.attributes),
  panelDialectType: source.jdbcDialectType || "MYSQL",
  panelDriverClassName: source.driverClassName || "",
  panelDriverJarName: source.driverJarName || "",
  panelDriverJarPath: source.driverJarPath || "",
});

const mapDatasourceViewToSource = (
  item: PanelDatasourceView,
): PanelSavedSource => ({
  sourceId: item.panelSourceId,
  connectionId: item.panelConnectionId || "",
  sourceType: item.panelSourceType || "JDBC",
  jdbcDialectType:
    item.panelDialectType || (item.panelSourceType === "JDBC" ? "MYSQL" : ""),
  connectionName: item.panelConnectionName || "",
  host: item.panelHost || "",
  port: Number(item.panelPort || 0),
  databaseName: item.panelDatabaseName || "",
  username: item.panelUsername || "",
  password: item.panelPassword || "",
  driverClassName: item.panelDriverClassName || "com.mysql.cj.jdbc.Driver",
  driverJarName: item.panelDriverJarName || "",
  driverJarPath: item.panelDriverJarPath || "",
  protocol: item.panelProtocol || "",
  environment: item.panelEnvironment || "dev",
  owner: item.panelOwner || "",
  readOnly: Boolean(item.panelReadOnly),
  sslEnabled: Boolean(item.panelSslEnabled),
  connectTimeoutMillis: Number(item.panelConnectTimeoutMillis || 5000),
  socketTimeoutMillis: Number(item.panelSocketTimeoutMillis || 10000),
  charset: item.panelCharset || "utf8mb4",
  lastLatencyMs: item.panelLastLatencyMs,
  lastConnectedAt: item.panelLastConnectedAt || "",
  detectedVersion: item.panelDetectedVersion || "",
  attributes: normalizeAttributes(item.panelAttributes),
  note: item.panelNote || "",
  favorite: Boolean(item.panelFavorite),
  updatedAt: item.panelUpdatedAt,
});

const mapSourceToDatasourcePayload = (
  source: PanelSavedSource | JdbcConnectionForm,
): PanelDatasourcePayload => ({
  panelSourceId: source.sourceId || undefined,
  panelConnectionId: source.connectionId || undefined,
  panelSourceType: source.sourceType,
  panelConnectionName: source.connectionName,
  panelHost: source.host,
  panelPort: Number(source.port || 0),
  panelDatabaseName: resolvePayloadDatabaseName(source),
  panelUsername: source.username,
  panelPassword: source.password,
  panelProtocol:
    source.sourceType === "JDBC"
      ? buildJdbcProtocol(source)
      : source.protocol || "",
  panelDialectType:
    source.sourceType === "JDBC"
      ? source.jdbcDialectType || "MYSQL"
      : undefined,
  panelDriverClassName:
    source.sourceType === "JDBC" ? source.driverClassName || "" : undefined,
  panelDriverJarName:
    source.sourceType === "JDBC" ? source.driverJarName || "" : undefined,
  panelDriverJarPath:
    source.sourceType === "JDBC" ? source.driverJarPath || "" : undefined,
  panelEnvironment: source.environment || "",
  panelOwner: source.owner || "",
  panelReadOnly: Boolean(source.readOnly),
  panelSslEnabled: Boolean(source.sslEnabled),
  panelConnectTimeoutMillis: Number(source.connectTimeoutMillis || 0),
  panelSocketTimeoutMillis: Number(source.socketTimeoutMillis || 0),
  panelCharset: source.charset || "",
  panelLastLatencyMs: source.lastLatencyMs,
  panelLastConnectedAt: source.lastConnectedAt || undefined,
  panelDetectedVersion: source.detectedVersion || undefined,
  panelAttributes: normalizeAttributes(source.attributes),
  panelNote: source.note || "",
  panelFavorite: Boolean(source.favorite),
  panelUpdatedAt: source.updatedAt || undefined,
});

const validateJdbcFormBeforeSave = (form: JdbcConnectionForm) => {
  if (!String(form.sourceType || "").trim()) {
    return "请选择数据源类型";
  }
  if (!String(form.connectionName || "").trim()) {
    return "请输入数据源名称";
  }
  if (!String(form.host || "").trim()) {
    return "请输入主机地址";
  }
  if (Number(form.port) <= 0) {
    return "请输入有效端口";
  }
  if (form.sourceType === "JDBC" && !String(form.username || "").trim()) {
    return "JDBC 数据源必须填写用户名";
  }
  if (
    form.sourceType === "JDBC" &&
    !String(form.jdbcDialectType || "").trim()
  ) {
    return "请选择数据库类型";
  }
  if (
    form.sourceType === "JDBC" &&
    !String(form.driverClassName || "").trim()
  ) {
    return "请选择 JDBC 驱动类";
  }
  return "";
};

const persistSources = () => {
  localStorage.setItem(
    PANEL_SOURCE_STORAGE_KEY,
    JSON.stringify(savedSources.value),
  );
};

const persistConfig = () => {
  localStorage.setItem(
    PANEL_CONFIG_STORAGE_KEY,
    JSON.stringify({
      previewLimit: previewLimit.value,
      treeMultiExpand: treeMultiExpand.value,
    }),
  );
};

const loadSourcesFromStorage = () => {
  try {
    const raw = localStorage.getItem(PANEL_SOURCE_STORAGE_KEY);
    savedSources.value = raw ? JSON.parse(raw) : [];
  } catch {
    savedSources.value = [];
  }
};

const loadSources = async () => {
  try {
    const response = await listPanelDatasources();
    if (!Array.isArray(response?.data)) {
      loadSourcesFromStorage();
      return;
    }
    const remoteSources = response.data.map(mapDatasourceViewToSource);
    savedSources.value = remoteSources;
    persistSources();
  } catch {
    // API 不可用时从 localStorage 恢复
    loadSourcesFromStorage();
  }
};

const loadConfig = () => {
  try {
    const raw = localStorage.getItem(PANEL_CONFIG_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    previewLimit.value =
      Number(parsed.previewLimit) > 0 ? Number(parsed.previewLimit) : 1000;
    treeMultiExpand.value = Boolean(parsed.treeMultiExpand);
  } catch {
    previewLimit.value = 1000;
    treeMultiExpand.value = false;
  }
};

const loadCachedConnections = async () => {
  try {
    const response = await listJdbcCachedConnections();
    cachedConnections.value = response?.data || [];
  } catch (error: any) {
    errorMessage.value = error?.message || "读取缓存连接失败";
  }
};

const handleSaveSource = async () => {
  const validationMessage = validateJdbcFormBeforeSave(jdbcForm);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  submitting.value = true;
  try {
    const response = await savePanelDatasource(
      mapSourceToDatasourcePayload({
        ...jdbcForm,
        sourceId: jdbcForm.sourceId || "",
        updatedAt: jdbcForm.updatedAt || "",
      }),
    );
    const next = response?.data
      ? mapDatasourceViewToSource(response.data)
      : null;
    if (!next) {
      return;
    }
    const index = savedSources.value.findIndex(
      (item) => item.sourceId === next.sourceId,
    );
    if (index >= 0) {
      savedSources.value[index] = next;
    } else {
      savedSources.value.unshift(next);
    }
    persistSources();
    resetForm();
  } catch (error: any) {
    errorMessage.value = error?.message || "保存数据源失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

const handleTestSource = async () => {
  const validationMessage = validateJdbcFormBeforeSave(jdbcForm);
  if (validationMessage) {
    ElMessage.warning(validationMessage);
    return;
  }
  testingConnection.value = true;
  try {
    const response = await testPanelDatasource(
      mapSourceToDatasourcePayload({
        ...jdbcForm,
        sourceId: jdbcForm.sourceId || "",
        updatedAt: jdbcForm.updatedAt || "",
      }),
    );
    const result = response?.data;
    if (!result?.panelSuccess) {
      throw new Error(result?.panelMessage || "测试连接失败");
    }
    Object.assign(jdbcForm, {
      lastLatencyMs: result.panelLatencyMs,
      lastConnectedAt: new Date().toISOString(),
      detectedVersion: result.panelDetectedVersion || jdbcForm.detectedVersion,
    });
    ElMessage.success(
      [
        result.panelMessage || "连接成功",
        result.panelLatencyMs ? `${result.panelLatencyMs}ms` : "",
        result.panelDetectedVersion || "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
  } catch (error: any) {
    errorMessage.value = error?.message || "测试连接失败";
    ElMessage.error(errorMessage.value);
  } finally {
    testingConnection.value = false;
  }
};

const handleEditSource = (source: PanelSavedSource) => {
  Object.assign(jdbcForm, {
    ...source,
    attributes: normalizeAttributes(source.attributes),
  });
};

const handleDeleteSource = async (sourceId: string) => {
  submitting.value = true;
  try {
    await deletePanelDatasource(sourceId);
    savedSources.value = savedSources.value.filter(
      (item) => item.sourceId !== sourceId,
    );
    persistSources();
    if (jdbcForm.sourceId === sourceId) {
      resetForm();
    }
  } catch (error: any) {
    errorMessage.value = error?.message || "删除数据源失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

const handleToggleFavorite = async (sourceId: string) => {
  const current = savedSources.value.find(
    (source) => source.sourceId === sourceId,
  );
  if (!current) {
    return;
  }
  const next = {
    ...current,
    favorite: !current.favorite,
    updatedAt: new Date().toISOString(),
  };
  try {
    const response = await savePanelDatasource(
      mapSourceToDatasourcePayload(next),
    );
    const saved = response?.data
      ? mapDatasourceViewToSource(response.data)
      : next;
    savedSources.value = savedSources.value.map((source) =>
      source.sourceId === sourceId ? saved : source,
    );
    persistSources();
  } catch (error: any) {
    errorMessage.value = error?.message || "更新收藏失败";
    ElMessage.error(errorMessage.value);
  }
};

const handleUploadDriver = async (file: File) => {
  if (!file) {
    return;
  }
  uploadingDriver.value = true;
  try {
    const response = await uploadPanelDatasourceDriver(
      file,
      jdbcForm.jdbcDialectType || "MYSQL",
    );
    const driver = response?.data;
    if (!driver) {
      return;
    }
    Object.assign(jdbcForm, {
      jdbcDialectType: driver.panelDialectType || jdbcForm.jdbcDialectType,
      driverClassName: driver.panelDriverClassName || jdbcForm.driverClassName,
      driverJarName: driver.panelDriverJarName || "",
      driverJarPath: driver.panelDriverJarPath || "",
    });
    ElMessage.success("驱动包已上传");
  } catch (error: any) {
    errorMessage.value = error?.message || "上传驱动包失败";
    ElMessage.error(errorMessage.value);
  } finally {
    uploadingDriver.value = false;
  }
};

const openSourceInWorkspace = async (
  source: PanelSavedSource,
  options?: { nginxProjectManagement?: boolean },
) => {
  const ticket = await encryptWorkspaceTicket({ source });
  const url = new URL(window.location.href);
  url.searchParams.set("ticket", ticket);
  const sourceType = String(source.sourceType || "")
    .trim()
    .toUpperCase();
  const isNginxSource =
    sourceType === "NGINX" ||
    sourceType === "NGINX_HTTP" ||
    sourceType === "NGINX_WORKSPACE";
  if (isNginxSource && options?.nginxProjectManagement) {
    url.searchParams.set("nginxProjectStandalone", "1");
    url.searchParams.set("nginxTab", "project");
  } else {
    url.searchParams.delete("nginxProjectStandalone");
    url.searchParams.delete("nginxTab");
  }
  const child = window.open("", "_blank");
  if (child) {
    child.opener = null;
    child.location.href = url.toString();
    return;
  }
  window.location.href = url.toString();
};

const handleOpenSource = async (source: PanelSavedSource) => {
  const type = String(source.sourceType || "").toUpperCase();
  if (type === "SSH") {
    // SSH sources open the service panel directly with auto-connect
    viewMode.value = "service-panel";
    sshSource.value = source;
    await handleServicePanelConnect([source]);
    return;
  }
  // Redis 和 JDBC 都走 ticket 跳转，在新标签页打开
  await openSourceInWorkspace(source);
};

const handleOpenNginxProjectManagement = async (source: PanelSavedSource) => {
  await openSourceInWorkspace(source, { nginxProjectManagement: true });
};

const handleOpenServicePanel = () => {
  viewMode.value = "service-panel";
};

const handleOpenSystemLog = () => {
  ElMessage.info("系统日志功能开发中");
};

const normalizeSourceType = (sourceType?: string) => {
  const raw = String(sourceType || "")
    .trim()
    .toUpperCase();
  if (raw === "NGINX" || raw === "NGINX_HTTP" || raw === "NGINX_WORKSPACE") {
    return "NGINX";
  }
  if (raw === "REDIS") return "REDIS";
  if (raw === "MONGODB" || raw === "MONGO") return "MONGODB";
  if (raw === "ZOOKEEPER" || raw === "ZK") return "ZOOKEEPER";
  if (raw === "PROMETHEUS") return "PROMETHEUS";
  if (raw === "INFLUXDB2" || raw === "INFLUX") return "INFLUXDB2";
  if (raw === "INFLUXDB3" || raw === "INFLUX_V3") return "INFLUXDB3";
  if (raw === "NACOS") return "NACOS";
  if (raw === "DOCKER") return "DOCKER";
  if (raw === "KAFKA") return "KAFKA";
  if (raw === "RABBITMQ") return "RABBITMQ";
  if (raw === "MQTT") return "MQTT";
  return "JDBC";
};

const openRedisWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "redis";
  submitting.value = true;
  try {
    const res = await openRedisConnection(
      source.host,
      source.port,
      source.password || "",
      getNumberAttribute(
        source.attributes,
        "dbIndex",
        Number(source.databaseName) || 0,
      ),
    );
    redisConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "Redis 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openNginxWorkspace = async (
  source: PanelSavedSource,
  options?: { deferView?: boolean },
) => {
  workspaceSource.value = source;
  if (!options?.deferView) {
    viewMode.value = "nginx";
  }
  submitting.value = true;
  try {
    const res = await openNginxConnection(
      source.host,
      source.port,
      source.username || "root",
      source.password || undefined,
      getStringAttribute(source.attributes, "privateKey"),
    );
    nginxConnectionId.value = res?.data || "";
    viewMode.value = "nginx";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "SSH 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openMongoWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "mongo";
  submitting.value = true;
  try {
    const res = await openMongoConnection(
      source.host,
      source.port,
      source.username || undefined,
      source.password || undefined,
      getStringAttribute(
        source.attributes,
        "authDatabase",
        source.databaseName || undefined,
      ),
    );
    mongoConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "MongoDB 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openZookeeperWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "zookeeper";
  submitting.value = true;
  try {
    const res = await openZookeeperConnection(
      source.host,
      source.port,
      getNumberAttribute(source.attributes, "sessionTimeoutMillis", 30000),
    );
    zookeeperConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "ZooKeeper 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openPrometheusWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "prometheus";
  submitting.value = true;
  try {
    const res = await openPrometheusConnection(
      source.host,
      source.port,
      source.username || undefined,
      source.password || undefined,
    );
    prometheusConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "Prometheus 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openInfluxWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "influx";
  submitting.value = true;
  try {
    const res = await openInfluxConnection(
      source.host,
      source.port,
      source.password || "",
      source.username || "",
      source.databaseName || "",
    );
    influxConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "InfluxDB 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openInfluxV3Workspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "influxv3";
  submitting.value = true;
  try {
    const res = await openInfluxV3Connection(
      source.host,
      source.port,
      source.password || "",
      source.databaseName || "",
    );
    influxV3ConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg =
      error?.response?.data?.msg || error?.message || "InfluxDB 3 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openNacosWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "nacos";
  submitting.value = true;
  try {
    const res = await openNacosConnection(
      source.host,
      source.port,
      source.username || undefined,
      source.password || undefined,
      source.protocol || undefined,
    );
    nacosConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "Nacos 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openDockerWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "docker";
  submitting.value = true;
  const protocol = source.protocol || "tcp";
  const isSocket = ["unix", "socket"].includes(protocol.toLowerCase());
  try {
    const res = await openDockerConnection(
      source.host,
      isSocket ? 0 : source.port,
      protocol,
      isSocket ? source.databaseName || "/var/run/docker.sock" : undefined,
    );
    dockerConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "Docker 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openKafkaWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "kafka";
  submitting.value = true;
  try {
    const res = await openKafkaConnection(
      source.host,
      source.port,
      source.username || undefined,
      source.password || undefined,
      source.protocol || undefined,
    );
    kafkaConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "Kafka 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openRabbitMQWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "rabbitmq";
  submitting.value = true;
  try {
    const res = await openRabbitMQConnection(
      source.host,
      source.port,
      source.username || "guest",
      source.password || "guest",
      source.attributes?.managementPort || undefined,
    );
    rabbitmqConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "RabbitMQ 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const openMqttWorkspace = async (source: PanelSavedSource) => {
  workspaceSource.value = source;
  viewMode.value = "mqtt";
  submitting.value = true;
  try {
    const res = await openMqttConnection(
      source.host,
      source.port,
      source.username || undefined,
      source.password || undefined,
    );
    mqttConnectionId.value = res?.data || "";
  } catch (error: any) {
    const msg = error?.response?.data?.msg || error?.message || "MQTT 连接失败";
    ElMessage.error(`连接失败：${msg}`);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const resetWorkspaceState = () => {
  catalogTree.value = [];
  activeNode.value = null;
  tableStructureCache.value = {};
  fieldNotes.value = {};
  objectNotes.value = {};
  inspectorTabs.value = [];
  activeInspectorTabId.value = "workspace";
  expandedCatalogNodeId.value = "";
  expandedTableNodeId.value = "";
  queryResult.value = null;
  sqlExplainContent.value = "";
  sqlExplainRows.value = [];
  errorMessage.value = "";
  capabilities.value = null;
  datasourceMetadata.value = null;
  backupSchedule.value = null;
  backupRecords.value = [];
  backupLoading.value = false;
  binlogRunning.value = false;
  binlogEvents.value = [];
};

const loadWorkspaceCapabilities = async () => {
  if (!activeConnectionId.value) {
    return;
  }

  try {
    const response = await fetchJdbcCapabilities(activeConnectionId.value);
    capabilities.value = response?.data || null;
  } catch {
    capabilities.value = {
      aiEnabled: true,
      aiStarterEnabled: false,
      documentEnabled: true,
      jdbcEnabled: true,
      message: "能力接口未返回，已使用前端默认值。",
    };
  }
};

const loadWorkspaceMetadata = async () => {
  if (!activeConnectionId.value) {
    return;
  }

  try {
    const response = await fetchJdbcConnectionMetadata(
      activeConnectionId.value,
    );
    datasourceMetadata.value = response?.data || null;
  } catch {
    datasourceMetadata.value = {
      connectionId: activeConnectionId.value,
      host: workspaceSource.value?.host,
      port: workspaceSource.value?.port,
    };
  }
};

const applyPanelRemarks = (remarks: PanelRemarkView[]) => {
  const nextFieldNotes: Record<string, string> = {};
  const nextObjectNotes: Record<string, string> = {};

  remarks.forEach((item) => {
    const nodeType = item.panelNodeType;
    if (nodeType === "catalog") {
      const key = [
        item.panelConnectionId || "workspace",
        nodeType,
        item.panelCatalogName || "catalog",
        item.panelSchemaName || "schema",
        item.panelTableName || item.panelCatalogName || "node",
      ].join("::");
      nextObjectNotes[key] = item.panelRemarkContent || "";
    }
  });

  fieldNotes.value = nextFieldNotes;
  objectNotes.value = nextObjectNotes;
};

const loadWorkspaceRemarks = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    const response = await listPanelRemarks(activeConnectionId.value);
    applyPanelRemarks(response?.data || []);
  } catch (error: any) {
    errorMessage.value = error?.message || "读取备注失败";
  }
};

const bootstrapWorkspace = async (source: PanelSavedSource) => {
  // 进入工作区时设置页面标题为数据源名称
  document.title = source.connectionName || source.host || "Panel Workspace";
  viewMode.value = "booting";
  bootingHint.value = "正在恢复工作区...";
  resetWorkspaceConnectionRefs();
  const sourceType = normalizeSourceType(source.sourceType);
  // Redis 数据源走 Redis 工作区
  if (sourceType === "REDIS") {
    bootingHint.value = "正在连接 Redis 工作区...";
    await openRedisWorkspace(source);
    return;
  }
  // Nginx 数据源走 Nginx 工作区
  if (sourceType === "NGINX") {
    bootingHint.value = "正在连接 Nginx 工作区...";
    await openNginxWorkspace(source, { deferView: true });
    return;
  }
  // MongoDB 数据源走 Mongo 工作区
  if (sourceType === "MONGODB") {
    bootingHint.value = "正在连接 MongoDB 工作区...";
    await openMongoWorkspace(source);
    return;
  }
  // ZooKeeper 数据源走 ZooKeeper 工作区
  if (sourceType === "ZOOKEEPER") {
    bootingHint.value = "正在连接 ZooKeeper 工作区...";
    await openZookeeperWorkspace(source);
    return;
  }
  // Prometheus 数据源走 Prometheus 工作区
  if (sourceType === "PROMETHEUS") {
    bootingHint.value = "正在连接 Prometheus 工作区...";
    await openPrometheusWorkspace(source);
    return;
  }
  // InfluxDB 2.x 数据源走 Influx 工作区
  if (sourceType === "INFLUXDB2") {
    bootingHint.value = "正在连接 InfluxDB 工作区...";
    await openInfluxWorkspace(source);
    return;
  }
  // InfluxDB 3.x 数据源走 InfluxV3 工作区
  if (sourceType === "INFLUXDB3") {
    bootingHint.value = "正在连接 InfluxDB 3 工作区...";
    await openInfluxV3Workspace(source);
    return;
  }
  if (sourceType === "NACOS") {
    bootingHint.value = "正在连接 Nacos 工作区...";
    await openNacosWorkspace(source);
    return;
  }
  if (sourceType === "DOCKER") {
    bootingHint.value = "正在连接 Docker 工作区...";
    await openDockerWorkspace(source);
    return;
  }
  if (sourceType === "KAFKA") {
    bootingHint.value = "正在连接 Kafka 工作区...";
    await openKafkaWorkspace(source);
    return;
  }
  if (sourceType === "RABBITMQ") {
    bootingHint.value = "正在连接 RabbitMQ 工作区...";
    await openRabbitMQWorkspace(source);
    return;
  }
  if (sourceType === "MQTT") {
    bootingHint.value = "正在连接 MQTT 工作区...";
    await openMqttWorkspace(source);
    return;
  }
  await openDbxWorkspace([source]);
};

const openDbxWorkspace = async (sources: PanelSavedSource[]) => {
  const jdbcSources = sources.filter((item) => item.sourceType === "JDBC");
  if (!jdbcSources.length) {
    ElMessage.warning("??? JDBC ???");
    return;
  }
  bootingHint.value = jdbcSources.length > 1 ? "?????? JDBC DBX Web ???..." : "???? DBX Web ???...";
  workspaceSource.value = {
    ...jdbcSources[0],
    connectionName: jdbcSources.length > 1 ? `${jdbcSources[0].connectionName} ? ${jdbcSources.length} ? JDBC` : jdbcSources[0].connectionName,
  };
  resetWorkspaceState();
  resetWorkspaceConnectionRefs();
  submitting.value = true;
  try {
    const response = jdbcSources.length === 1
      ? await fetchPanelDbxFrame(jdbcSources[0].sourceId)
      : await fetchPanelDbxFrames(jdbcSources.map((item) => item.sourceId));
    activeConnectionId.value = response?.data?.connectionId || "";
    dbxFrameUrl.value = response?.data?.frameUrl || "";
    if (!dbxFrameUrl.value) {
      throw new Error("DBX Web iframe ????");
    }
    viewMode.value = "dbx";
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.msg || error?.message || "?? DBX Web ?????";
    ElMessage.error(errorMessage.value);
    viewMode.value = "hub";
  } finally {
    submitting.value = false;
  }
};

const handleOpenSources = async (sources: PanelSavedSource[]) => {
  await openDbxWorkspace(sources);
};

/** DBX iframe 加载完成后自动注入密码并登录 */
const onDbxIframeLoad = () => {
  if (!dbxAutoLoginEnabled.value) return;
  try {
    const iframe = document.querySelector('.dbx-frame') as HTMLIFrameElement;
    if (!iframe?.contentDocument) {
      console.warn('[Panel] DBX iframe 跨域，无法自动登录，请手动输入密码');
      return;
    }
    const doc = iframe.contentDocument;
    // 查找密码输入框 — DBX LoginPage 使用 Input 组件，type=password 的 input
    const passwordInput = doc.querySelector('input[type="password"]') as HTMLInputElement | null;
    if (passwordInput) {
      passwordInput.value = dbxPassword.value;
      // 触发 input 事件（Vue 组件需要）
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      // 自动提交表单
      const form = doc.querySelector('form') as HTMLFormElement | null;
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      } else {
        // 没有 form 就直接查找登录按钮点击
        const loginBtn = doc.querySelector('button[type="submit"]');
        if (loginBtn) {
          loginBtn.click();
        }
      }
    }
  } catch (err) {
    console.error('[Panel] DBX 自动登录失败:', err);
  }
};

const handleBackHome = async () => {
  if (activeConnectionId.value) {
    try {
      await closeJdbcConnection(activeConnectionId.value);
    } catch {
      // ignore
    }
  }
  if (redisConnectionId.value) {
    try {
      await closeRedisConnection(redisConnectionId.value);
    } catch {
      // ignore
    }
    redisConnectionId.value = "";
  }
  if (nginxConnectionId.value) {
    try {
      await closeNginxConnection(nginxConnectionId.value);
    } catch {
      // ignore
    }
    nginxConnectionId.value = "";
  }
  if (mongoConnectionId.value) {
    try {
      await closeMongoConnection(mongoConnectionId.value);
    } catch {
      // ignore
    }
    mongoConnectionId.value = "";
  }
  if (zookeeperConnectionId.value) {
    try {
      await closeZookeeperConnection(zookeeperConnectionId.value);
    } catch {
      // ignore
    }
    zookeeperConnectionId.value = "";
  }
  if (prometheusConnectionId.value) {
    try {
      await closePrometheusConnection(prometheusConnectionId.value);
    } catch {
      // ignore
    }
    prometheusConnectionId.value = "";
  }
  if (influxConnectionId.value) {
    try {
      await closeInfluxConnection(influxConnectionId.value);
    } catch {
      // ignore
    }
    influxConnectionId.value = "";
  }
  if (influxV3ConnectionId.value) {
    try {
      await closeInfluxV3Connection(influxV3ConnectionId.value);
    } catch {
      // ignore
    }
    influxV3ConnectionId.value = "";
  }
  if (nacosConnectionId.value) {
    try {
      await closeNacosConnection(nacosConnectionId.value);
    } catch {
      // ignore
    }
    nacosConnectionId.value = "";
  }
  if (dockerConnectionId.value) {
    try {
      await closeDockerConnection(dockerConnectionId.value);
    } catch {
      // ignore
    }
    dockerConnectionId.value = "";
  }
  if (kafkaConnectionId.value) {
    try {
      await closeKafkaConnection(kafkaConnectionId.value);
    } catch {
      // ignore
    }
    kafkaConnectionId.value = "";
  }
  if (rabbitmqConnectionId.value) {
    try {
      await closeRabbitMQConnection(rabbitmqConnectionId.value);
    } catch {
      // ignore
    }
    rabbitmqConnectionId.value = "";
  }
  if (mqttConnectionId.value) {
    try {
      await closeMqttConnection(mqttConnectionId.value);
    } catch {
      // ignore
    }
    mqttConnectionId.value = "";
  }
  // Close all SSH connections
  const allSshIds = [...(sshConnectionIds.value || [])];
  if (sshConnectionId.value && !allSshIds.includes(sshConnectionId.value)) {
    allSshIds.push(sshConnectionId.value);
  }
  for (const cid of allSshIds) {
    try { await closeSshConnection(cid); } catch { /* ignore */ }
  }
  sshConnectionId.value = "";
  sshConnectionIds.value = [];
  sshSource.value = null;
  sshSources.value = [];
  activeConnectionId.value = "";
  workspaceSource.value = null;
  viewMode.value = "hub";
  document.title = "Panel Workspace Hub";
  asideCollapsed.value = true;
  resetWorkspaceState();
  const url = new URL(window.location.href);
  url.searchParams.delete("ticket");
  url.searchParams.delete("nginxTab");
  url.searchParams.delete("nginxProjectStandalone");
  url.searchParams.delete("_sc");
  window.history.replaceState({}, "", url.toString());
  await loadCachedConnections();
};

/** 返回服务面板 */
const handleBackToServicePanel = () => {
  viewMode.value = "service-panel";
};

/** 从服务面板返回主页（关闭 SSH 连接） */
const handleBackFromServicePanel = async () => {
  const allSshIds = [...(sshConnectionIds.value || [])];
  if (sshConnectionId.value && !allSshIds.includes(sshConnectionId.value)) {
    allSshIds.push(sshConnectionId.value);
  }
  for (const cid of allSshIds) {
    try { await closeSshConnection(cid); } catch { /* ignore */ }
  }
  sshConnectionId.value = "";
  sshConnectionIds.value = [];
  sshSource.value = null;
  sshSources.value = [];
  viewMode.value = "hub";
};

/** 服务面板 SSH 连接（支持多服务器） */
const handleServicePanelConnect = async (sources: PanelSavedSource[]) => {
  if (!sources || sources.length === 0) return;
  sshConnecting.value = true;
  sshError.value = null;
  const newIds: string[] = [];
  const newSources: PanelSavedSource[] = [];
  let firstError: string | null = null;

  for (const source of sources) {
    try {
      const res = await openSshConnection(
        source.host,
        source.port,
        source.username || "root",
        source.password || undefined,
        source.attributes?.privateKey,
      );
      const rawId = res?.data;
      const connId = typeof rawId === "string" ? rawId : (rawId?.data || "");
      if (connId) {
        newIds.push(connId);
        newSources.push(source);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.msg || error?.message || "SSH 连接失败";
      ElMessage.error(`连接 ${source.connectionName || source.host} 失败：${msg}`);
      if (!firstError) firstError = msg;
    }
  }

  if (newIds.length > 0) {
    sshConnectionIds.value = newIds;
    sshSources.value = newSources;
    sshConnectionId.value = newIds[0];
    sshSource.value = newSources[0];
    if (newSources[0]) saveSshSession(newSources[0]);
    if (newIds.length > 1) {
      ElMessage.success(`已连接 ${newIds.length} 台服务器`);
    }
  }
  if (firstError) sshError.value = firstError;
  sshConnecting.value = false;
};

/** 服务面板 SSH 断开 */
const handleServicePanelDisconnect = async () => {
  const allIds = [...(sshConnectionIds.value || [])];
  if (sshConnectionId.value && !allIds.includes(sshConnectionId.value)) {
    allIds.push(sshConnectionId.value);
  }
  for (const cid of allIds) {
    try {
      await closeSshConnection(cid);
    } catch { /* ignore */ }
  }
  sshConnectionIds.value = [];
  sshConnectionId.value = "";
  sshSources.value = [];
  sshSource.value = null;
  clearSshSession();
};

/** 服务面板导航 */
const handleServiceNavigate = (view: string) => {
  if (view === "soft-manage") {
    viewMode.value = "soft-manage";
  }
};

/** 待安装预设（从软件管理页传参到服务面板） */
const pendingInstallPreset = ref<SoftwarePreset | null>(null);

/** 从软件管理页安装预设 */
const handleServiceInstallPreset = (preset: SoftwarePreset) => {
  pendingInstallPreset.value = preset;
  viewMode.value = "service-panel";
};

/** 打开对应软件管理面板（如 Nginx） */
const handleServiceOpenPanel = async (
  binding: SoftwareBinding,
  _encryptedInfo: string,
) => {
  const code = binding.softwareCode?.toLowerCase() || "";
  // Map software code to source type
  const typeMap: Record<string, string> = {
    nginx: "NGINX",
    redis: "REDIS",
    mysql: "JDBC",
    mongo: "MONGODB",
    mongodb: "MONGODB",
    zookeeper: "ZOOKEEPER",
    prometheus: "PROMETHEUS",
    nacos: "NACOS",
    docker: "DOCKER",
    kafka: "KAFKA",
    influx: "INFLUXDB2",
    influxdb: "INFLUXDB2",
    influxdb3: "INFLUXDB3",
  };
  const targetType = typeMap[code];
  if (!targetType) {
    ElMessage.info(`「${binding.softwareName}」暂未集成管理面板`);
    return;
  }

  // Search saved sources for matching type
  let matched = savedSources.value.find(
    (s) => String(s.sourceType || "").toUpperCase() === targetType,
  );
  // If not exact match, try partial match
  if (!matched) {
    matched = savedSources.value.find((s) =>
      String(s.sourceType || "").toUpperCase().startsWith(targetType),
    );
  }

  if (matched) {
    await openSourceInWorkspace(matched);
  } else {
    ElMessage.info(
      `未找到「${binding.softwareName}」数据源，请先在数据源管理中添加`,
    );
  }
};

const handleLoadCatalog = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  activeNode.value = null;
  expandedCatalogNodeId.value = "";
  expandedTableNodeId.value = "";
  catalogTree.value = [];
  const response = await listJdbcCatalogTree(activeConnectionId.value);
  catalogTree.value = normalizeTree(response?.data || []);
};

const restructureFlatToTree = (flatNodes: JdbcCatalogNode[]): JdbcCatalogNode[] => {
  const catalogMap = new Map<string, JdbcCatalogNode>();
  for (const node of flatNodes) {
    const catName = node.catalogName || "__default__";
    const schName = node.schemaName || "__default__";
    if (!catalogMap.has(catName)) {
      catalogMap.set(catName, {
        nodeId: `search_catalog_${catName}`,
        nodeType: "catalog",
        nodeName: catName,
        catalogName: catName,
        description: "数据库",
        children: [],
      });
    }
    const catalog = catalogMap.get(catName)!;
    let schema = catalog.children!.find((s) => s.schemaName === schName);
    if (!schema) {
      schema = {
        nodeId: `search_schema_${catName}_${schName}`,
        parentId: catalog.nodeId,
        nodeType: "schema",
        nodeName: schName,
        schemaName: schName,
        description: schName,
        children: [],
      };
      catalog.children!.push(schema);
    }
    schema.children!.push({ ...node, nodeType: "table", children: node.children || [] });
  }
  return Array.from(catalogMap.values());
};

const handleSearch = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  if (!searchKeyword.value.trim()) {
    await handleLoadCatalog();
    return;
  }
  const response = await searchJdbcCatalogTree(
    activeConnectionId.value,
    searchKeyword.value,
  );
  const rawData = response?.data || [];
  const isFlat = rawData.length > 0 && rawData.every((n: JdbcCatalogNode) => n.nodeType === "table");
  catalogTree.value = normalizeTree(isFlat ? restructureFlatToTree(rawData) : rawData);
};

const buildTableTabId = (node: JdbcCatalogNode, tabType: InspectorTabType) =>
  `${tabType}::${node.nodeId}`;

const createInspectorTabDefaults = () => ({
  accounts: [] as PanelJdbcAccountView[],
  columnOrder: [] as string[],
  databaseDocument: null as PanelDatabaseDocumentView | null,
  dataCommentMode: "native" as CommentMode,
  dataResult: null as PanelTableDataView | null,
  filterKeyword: "",
  filterJoin: "and" as PanelTableFilterJoin,
  filters: [] as PanelTableFilterItem[],
  frozenColumns: [] as string[],
  hiddenColumns: [] as string[],
  loadTotal: false,
  paginationMode: "pagination" as PaginationMode,
  pageNum: 1,
  pageSize: 100,
  railShape: "default" as "default" | "round",
  showSequence: true,
  sortField: "",
  sortOrder: "" as SortOrder,
  tableCommentMode: "native" as CommentMode,
});

const buildTableDdl = (structure: JdbcTableStructure | null) => {
  if (!structure) {
    return "";
  }

  const tableName =
    [structure.catalogName, structure.schemaName, structure.tableName]
      .filter(Boolean)
      .join(".") || structure.tableName;
  const columns = structure.columns.map((column) => {
    const parts = [`  ${column.name} ${column.type || "varchar(255)"}`];
    if (column.comment) {
      parts.push(`comment '${String(column.comment).replace(/'/g, "''")}'`);
    }
    return parts.join(" ");
  });
  const primaryKeys = structure.primaryKeys.length
    ? `,\n  primary key (${structure.primaryKeys.join(", ")})`
    : "";

  return `create table ${tableName} (\n${columns.join(",\n")}${primaryKeys}\n);`;
};

const fetchTableArtifacts = async (node: JdbcCatalogNode) => {
  const requestKey = `${activeConnectionId.value}::${node.nodeId}`;
  const pending = tableArtifactRequests.get(requestKey);
  if (pending) {
    return pending;
  }

  const tableName = node.tableName || node.nodeName;
  const catalogName = node.catalogName || undefined;
  const schemaName = node.schemaName || undefined;

  const request = (async () => {
    const [structureResponse, aiResponse] = await Promise.all([
      fetchJdbcTableStructure(
        activeConnectionId.value,
        tableName,
        catalogName,
        schemaName,
      ),
      explainJdbcStructure(
        activeConnectionId.value,
        tableName,
        catalogName,
        schemaName,
      ),
    ]);

    const structure = structureResponse?.data || null;
    if (structure) {
      tableStructureCache.value = {
        ...tableStructureCache.value,
        [node.nodeId]: structure,
      };
    }

    return {
      aiContent: aiResponse?.data || "",
      ddlText: buildTableDdl(structure),
      documentContent: "",
      structure,
    };
  })();

  tableArtifactRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    tableArtifactRequests.delete(requestKey);
  }
};

const buildPreviewSql = (node: JdbcCatalogNode) =>
  `select * from ${fullTableName(node)};`;

const fetchTableDataForTab = async (
  tab: InspectorTableTab,
  pageNum = 1,
  pageSize = 100,
  loadTotal = false,
) => {
  if (!activeConnectionId.value) {
    return null;
  }
  const response = await fetchJdbcTableData(activeConnectionId.value, {
    panelCatalogName: tab.node.catalogName,
    panelSchemaName: tab.node.schemaName,
    panelTableName: tab.node.tableName || tab.node.nodeName,
    panelPageNum: pageNum,
    panelPageSize: pageSize,
    panelLoadTotal: loadTotal,
    panelFilterKeyword: tab.filterKeyword.trim() || undefined,
    panelFilterJoin: tab.filterJoin,
    panelFilters: tab.filters,
    panelSortField: tab.sortField || undefined,
    panelSortOrder: tab.sortOrder || undefined,
  });
  return response?.data || null;
};

const clearTableDataRefreshTimer = (tabId: string) => {
  const timer = tableDataRefreshTimers.get(tabId);
  if (timer !== undefined) {
    window.clearTimeout(timer);
    tableDataRefreshTimers.delete(tabId);
  }
};

const fetchJdbcAccountTab = async (node: JdbcCatalogNode) => {
  if (!activeConnectionId.value) {
    return [];
  }
  const response = await fetchJdbcAccounts(activeConnectionId.value);
  return response?.data || [];
};

const fetchJdbcDatabaseDocumentTab = async (node: JdbcCatalogNode) => {
  if (!activeConnectionId.value) {
    return null;
  }
  const response = await fetchJdbcDatabaseDocument(
    activeConnectionId.value,
    node.catalogName || undefined,
  );
  return response?.data || null;
};

const upsertInspectorTab = (tab: InspectorTableTab) => {
  inspectorTabs.value = [
    ...inspectorTabs.value.filter((item) => item.tabId !== tab.tabId),
    tab,
  ];
};

const updateInspectorTab = (
  tabId: string,
  updater: (tab: InspectorTableTab) => InspectorTableTab,
) => {
  inspectorTabs.value = inspectorTabs.value.map((tab) =>
    tab.tabId === tabId ? updater(tab) : tab,
  );
};

const syncInspectorTabArtifacts = async (
  node: JdbcCatalogNode,
  tabType: InspectorTabType,
) => {
  const tabId = buildTableTabId(node, tabType);
  try {
    const artifacts = await fetchTableArtifacts(node);
    inspectorTabs.value = inspectorTabs.value.map((tab) =>
      tab.tabId === tabId ? { ...tab, ...artifacts } : tab,
    );
  } catch (error: any) {
    if (activeNode.value?.nodeId === node.nodeId) {
      errorMessage.value = error?.message || "读取表信息失败";
    }
  }
};

const deferBackgroundTask = (task: () => void) => {
  window.setTimeout(task, 0);
};

const ensureInspectorTab = async (
  node: JdbcCatalogNode,
  tabType: InspectorTabType,
  viewMode: InspectorViewMode,
  activate = true,
  waitForArtifacts = false,
) => {
  const tabId = buildTableTabId(node, tabType);
  const existing = inspectorTabs.value.find((item) => item.tabId === tabId);
  const cachedStructure = tableStructureCache.value[node.nodeId] || null;
  if (tabType === "account") {
    const nextTab: InspectorTableTab = {
      ...createInspectorTabDefaults(),
      aiContent: "",
      ddlText: "",
      documentContent: "",
      structure: null,
      accounts: existing?.accounts || [],
      node,
      tabId,
      tabName: `${node.nodeName} 账号`,
      tabType,
      viewMode,
      columnOrder: existing?.columnOrder || [],
      loadTotal: false,
      paginationMode: existing?.paginationMode || "pagination",
      pageNum: 1,
      pageSize: 100,
      railShape: existing?.railShape || "default",
      showSequence: existing?.showSequence ?? true,
      sortField: existing?.sortField || "",
      sortOrder: existing?.sortOrder || "",
      tableCommentMode: "native",
      dataCommentMode: "native",
      filterKeyword: existing?.filterKeyword || "",
      filterJoin: existing?.filterJoin || "and",
      filters: existing?.filters || [],
      frozenColumns: existing?.frozenColumns || [],
      hiddenColumns: existing?.hiddenColumns || [],
      dataResult: null,
    };
    upsertInspectorTab(nextTab);
    if (activate) {
      activeInspectorTabId.value = tabId;
    }
    activeNode.value = node;
    return nextTab;
  }
  if (tabType === "database-document") {
    const nextTab: InspectorTableTab = {
      ...createInspectorTabDefaults(),
      aiContent: "",
      ddlText: "",
      documentContent: "",
      structure: null,
      accounts: [],
      databaseDocument: existing?.databaseDocument || null,
      node,
      tabId,
      tabName: `${node.nodeName} 文档`,
      tabType,
      viewMode,
      columnOrder: existing?.columnOrder || [],
      loadTotal: false,
      paginationMode: existing?.paginationMode || "pagination",
      pageNum: 1,
      pageSize: 100,
      railShape: existing?.railShape || "default",
      showSequence: existing?.showSequence ?? true,
      sortField: existing?.sortField || "",
      sortOrder: existing?.sortOrder || "",
      tableCommentMode: "native",
      dataCommentMode: "native",
      filterKeyword: existing?.filterKeyword || "",
      filterJoin: existing?.filterJoin || "and",
      filters: existing?.filters || [],
      frozenColumns: existing?.frozenColumns || [],
      hiddenColumns: existing?.hiddenColumns || [],
      dataResult: null,
    };
    upsertInspectorTab(nextTab);
    if (activate) {
      activeInspectorTabId.value = tabId;
    }
    activeNode.value = node;
    return nextTab;
  }
  const needsHydration = !cachedStructure || !existing || !existing.aiContent;
  const baseArtifacts = {
    aiContent: existing?.aiContent || "",
    ddlText: existing?.ddlText || buildTableDdl(cachedStructure),
    documentContent: existing?.documentContent || "",
    structure: cachedStructure,
  };
  const artifacts =
    waitForArtifacts && needsHydration
      ? await fetchTableArtifacts(node)
      : baseArtifacts;

  const nextTab: InspectorTableTab = {
    ...createInspectorTabDefaults(),
    ...artifacts,
    accounts: existing?.accounts || [],
    columnOrder: existing?.columnOrder || [],
    dataCommentMode: existing?.dataCommentMode || "native",
    dataResult: existing?.dataResult || null,
    filterKeyword: existing?.filterKeyword || "",
    filterJoin: existing?.filterJoin || "and",
    filters: existing?.filters || [],
    frozenColumns: existing?.frozenColumns || [],
    hiddenColumns: existing?.hiddenColumns || [],
    loadTotal: existing?.loadTotal || false,
    node,
    paginationMode: existing?.paginationMode || "pagination",
    pageNum: existing?.pageNum || 1,
    pageSize: existing?.pageSize || 100,
    railShape: existing?.railShape || "default",
    showSequence: existing?.showSequence ?? true,
    sortField: existing?.sortField || "",
    sortOrder: existing?.sortOrder || "",
    tabId,
    tabName: node.tableName || node.nodeName,
    tableCommentMode: existing?.tableCommentMode || "native",
    tabType,
    viewMode,
  };

  upsertInspectorTab(nextTab);

  if (activate) {
    activeInspectorTabId.value = tabId;
  }
  activeNode.value = node;
  if (!waitForArtifacts && needsHydration) {
    deferBackgroundTask(() => {
      void syncInspectorTabArtifacts(node, tabType);
    });
  }
  return nextTab;
};

const handleOpenTable = async (node: JdbcCatalogNode) => {
  const tab = await ensureInspectorTab(node, "table", "data", true, false);
  activeInspectorTabId.value = tab.tabId;
  deferBackgroundTask(() => {
    void handleRefreshTableData(tab.tabId);
  });
};

const handleExpandTable = async (node: JdbcCatalogNode) => {
  expandedCatalogNodeId.value = node.parentId || expandedCatalogNodeId.value;
  expandedTableNodeId.value = node.nodeId;
  activeNode.value = node;
  if (!tableStructureCache.value[node.nodeId]) {
    deferBackgroundTask(() => {
      void fetchTableArtifacts(node);
    });
  }
};

const handleExpandNode = (node: JdbcCatalogNode) => {
  if (treeMultiExpand.value) {
    return;
  }
  if (node.nodeType === "catalog") {
    expandedCatalogNodeId.value = node.nodeId;
    expandedTableNodeId.value = "";
    return;
  }
  if (node.nodeType === "table") {
    expandedCatalogNodeId.value = node.parentId || expandedCatalogNodeId.value;
  }
};

const handleCollapseTable = (node: JdbcCatalogNode) => {
  if (expandedTableNodeId.value === node.nodeId) {
    expandedTableNodeId.value = "";
  }
};

const handleCollapseNode = (node: JdbcCatalogNode) => {
  if (
    node.nodeType === "catalog" &&
    expandedCatalogNodeId.value === node.nodeId
  ) {
    expandedCatalogNodeId.value = "";
    expandedTableNodeId.value = "";
  }
};

const handleActivateInspectorTab = (tabId: string) => {
  activeInspectorTabId.value = tabId;
  const tab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (tab?.node) {
    activeNode.value = tab.node;
  }
};

const handleTableTabSettingChange = async (
  tabId: string,
  patch: Partial<
    Pick<
      InspectorTableTab,
      | "columnOrder"
      | "dataCommentMode"
      | "filterJoin"
      | "filterKeyword"
      | "filters"
      | "frozenColumns"
      | "hiddenColumns"
      | "loadTotal"
      | "paginationMode"
      | "pageNum"
      | "pageSize"
      | "railShape"
      | "showSequence"
      | "sortField"
      | "sortOrder"
      | "tableCommentMode"
      | "viewMode"
    >
  >,
) => {
  const currentTab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (!currentTab) {
    return;
  }
  const nextPaginationMode = patch.paginationMode ?? currentTab.paginationMode;
  const nextPageNum =
    nextPaginationMode === "full" ? 1 : (patch.pageNum ?? currentTab.pageNum);
  const nextPageSize =
    nextPaginationMode === "full"
      ? Math.max(previewLimit.value, patch.pageSize ?? currentTab.pageSize)
      : (patch.pageSize ?? currentTab.pageSize);
  const nextPatch = {
    ...patch,
    pageNum: nextPageNum,
    pageSize: nextPageSize,
  };
  updateInspectorTab(tabId, (tab) => ({ ...tab, ...nextPatch }));
  if (currentTab.tabType !== "table") {
    return;
  }
  const nextViewMode = nextPatch.viewMode ?? currentTab.viewMode;
  const filterChanged =
    "filterKeyword" in patch || "filterJoin" in patch || "filters" in patch;
  const shouldRefreshData =
    nextViewMode === "data" &&
    (filterChanged ||
      "loadTotal" in patch ||
      "pageNum" in patch ||
      "pageSize" in patch ||
      "paginationMode" in patch ||
      "sortField" in patch ||
      "sortOrder" in patch);
  if (!shouldRefreshData) {
    return;
  }
  const refreshTableData = async () => {
    const nextLoadTotal = patch.loadTotal ?? currentTab.loadTotal;
    try {
      const dataResult = await fetchTableDataForTab(
        { ...currentTab, ...nextPatch },
        nextPageNum,
        nextPageSize,
        nextLoadTotal,
      );
      updateInspectorTab(tabId, (tab) => ({ ...tab, dataResult }));
    } catch (error: any) {
      errorMessage.value = error?.message || "读取表数据失败";
    }
  };
  clearTableDataRefreshTimer(tabId);
  if (filterChanged) {
    tableDataRefreshTimers.set(
      tabId,
      window.setTimeout(() => {
        clearTableDataRefreshTimer(tabId);
        void refreshTableData();
      }, 250),
    );
    return;
  }
  await refreshTableData();
};

const handleRefreshTableData = async (tabId: string) => {
  const currentTab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "table") {
    return;
  }
  clearTableDataRefreshTimer(tabId);
  try {
    const dataResult = await fetchTableDataForTab(
      currentTab,
      currentTab.pageNum,
      currentTab.pageSize,
      currentTab.loadTotal,
    );
    updateInspectorTab(tabId, (tab) => ({ ...tab, dataResult }));
  } catch (error: any) {
    errorMessage.value = error?.message || "刷新表数据失败";
  }
};

const refreshTableStructureForNode = async (node: JdbcCatalogNode) => {
  if (!activeConnectionId.value) {
    return null;
  }
  const response = await fetchJdbcTableStructure(
    activeConnectionId.value,
    node.tableName || node.nodeName,
    node.catalogName || undefined,
    node.schemaName || undefined,
  );
  const structure = response?.data || null;
  if (!structure) {
    return null;
  }
  tableStructureCache.value = {
    ...tableStructureCache.value,
    [node.nodeId]: structure,
  };
  inspectorTabs.value = inspectorTabs.value.map((tab) =>
    tab.node.nodeId === node.nodeId &&
    (tab.tabType === "table" || tab.tabType === "table-edit")
      ? { ...tab, ddlText: buildTableDdl(structure), structure }
      : tab,
  );
  return structure;
};

const refreshOpenTableTabsByNode = async (node: JdbcCatalogNode) => {
  const tableTabs = inspectorTabs.value.filter(
    (tab) => tab.node.nodeId === node.nodeId && tab.tabType === "table",
  );
  await Promise.all(tableTabs.map((tab) => handleRefreshTableData(tab.tabId)));
};

const handleSaveTableData = async (
  tabId: string,
  updates: PanelTableRowUpdate[],
) => {
  const currentTab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (
    !currentTab ||
    currentTab.tabType !== "table" ||
    !activeConnectionId.value
  ) {
    return;
  }
  if (!updates.length) {
    ElMessage.info("当前没有需要保存的数据");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await saveJdbcTableData(activeConnectionId.value, {
      panelCatalogName: currentTab.node.catalogName,
      panelSchemaName: currentTab.node.schemaName,
      panelTableName: currentTab.node.tableName || currentTab.node.nodeName,
      panelUpdates: updates,
    });
    const result = response?.data;
    ElMessage.success(result?.panelMessage || "表数据已保存");
    await handleRefreshTableData(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "保存表数据失败";
  } finally {
    submitting.value = false;
  }
};

const handleSaveTableDesign = async (tabId: string, sql: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  const currentTab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "table-edit") {
    return;
  }
  const statement = String(sql || "").trim();
  if (!statement) {
    ElMessage.info("当前设计没有变更");
    return;
  }

  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(activeConnectionId.value, statement);
    const result = response?.data || null;
    queryResult.value = result;
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];

    await refreshTableStructureForNode(currentTab.node);
    await refreshOpenTableTabsByNode(currentTab.node);
    await nextTick();
    detailRef.value?.resetTableEditDraft(tabId);

    const elapsed = result?.elapsedMillis;
    ElMessage.success(
      elapsed !== undefined && elapsed !== null
        ? `表结构已直接保存，耗时 ${elapsed} ms`
        : "表结构已直接保存",
    );
  } catch (error: any) {
    errorMessage.value = error?.message || "保存表结构失败";
  } finally {
    submitting.value = false;
  }
};

const handleOpenAccountManager = async (node: JdbcCatalogNode) => {
  const accountTab = await ensureInspectorTab(
    node,
    "account",
    "account",
    true,
    false,
  );
  try {
    const accounts = await fetchJdbcAccountTab(node);
    updateInspectorTab(accountTab.tabId, (tab) => ({ ...tab, accounts }));
    activeInspectorTabId.value = accountTab.tabId;
  } catch (error: any) {
    errorMessage.value = error?.message || "读取账号管理失败";
  }
};

const reloadAccountTab = async (tabId: string) => {
  const currentTab = inspectorTabs.value.find((item) => item.tabId === tabId);
  if (!currentTab || currentTab.tabType !== "account") {
    return;
  }
  const accounts = await fetchJdbcAccountTab(currentTab.node);
  updateInspectorTab(tabId, (tab) => ({ ...tab, accounts }));
};

const handleCreateAccount = async (
  tabId: string,
  request: PanelJdbcAccountSaveRequest,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await createJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("账号已创建");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "创建账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleUpdateAccount = async (
  tabId: string,
  request: PanelJdbcAccountSaveRequest,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await updateJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("账号已更新");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "更新账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleDeleteAccount = async (
  tabId: string,
  accountName: string,
  host?: string,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `即将删除账号 ${accountName}@${host || "%"}`,
      "删除账号",
      {
        cancelButtonText: "取消",
        confirmButtonText: "删除",
        confirmButtonClass: "el-button--danger",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await deleteJdbcAccount(activeConnectionId.value, accountName, host);
    ElMessage.success("账号已删除");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "删除账号失败";
  } finally {
    submitting.value = false;
  }
};

const handleGrantAccount = async (
  tabId: string,
  request: PanelJdbcPrivilegeRequest,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await grantJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("权限已授予");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "授予权限失败";
  } finally {
    submitting.value = false;
  }
};

const handleRevokeAccount = async (
  tabId: string,
  request: PanelJdbcPrivilegeRequest,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await revokeJdbcAccount(activeConnectionId.value, request);
    ElMessage.success("权限已回收");
    await reloadAccountTab(tabId);
  } catch (error: any) {
    errorMessage.value = error?.message || "回收权限失败";
  } finally {
    submitting.value = false;
  }
};

const handleOpenDatabaseDocument = async (node: JdbcCatalogNode) => {
  const documentTab = await ensureInspectorTab(
    node,
    "database-document",
    "database-document",
    true,
    false,
  );
  try {
    const databaseDocument = await fetchJdbcDatabaseDocumentTab(node);
    updateInspectorTab(documentTab.tabId, (tab) => ({
      ...tab,
      databaseDocument,
    }));
    activeInspectorTabId.value = documentTab.tabId;
  } catch (error: any) {
    errorMessage.value = error?.message || "读取数据库文档失败";
  }
};

const handleCloseInspectorTab = (tabId: string) => {
  inspectorTabs.value = inspectorTabs.value.filter(
    (item) => item.tabId !== tabId,
  );
  if (activeInspectorTabId.value === tabId) {
    activeInspectorTabId.value = "workspace";
  }
};

const fullTableName = (node: JdbcCatalogNode) =>
  [node.catalogName, node.schemaName, node.tableName || node.nodeName]
    .filter(Boolean)
    .join(".");

const injectSql = (sql: string) => {
  sqlText.value = sql;
};

const handleExecuteSelected = async (selection: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  const statement = selection.trim();
  if (!statement) {
    ElMessage.warning("请先选中要执行的 SQL 片段");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(activeConnectionId.value, statement);
    queryResult.value = response?.data || null;
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];
    activeInspectorTabId.value = "workspace";
  } catch (error: any) {
    errorMessage.value = error?.message || "执行选中 SQL 失败";
  } finally {
    submitting.value = false;
  }
};

const handleQuickRun = async (sql: string) => {
  injectSql(sql);
  await handleExecuteSql(sql);
};

const isConnectionExpiredError = (error: any) =>
  String(error?.message || "").includes("连接不存在或已过期");

const reopenActiveJdbcConnection = async () => {
  if (!workspaceSource.value) {
    return false;
  }
  const response = await openJdbcConnection({
    ...workspaceSource.value,
    connectionType: "JDBC",
    enabled: true,
    protocol: buildJdbcProtocol(workspaceSource.value),
    attributes: buildJdbcConnectionAttributes(workspaceSource.value),
  });
  const nextConnectionId = response?.data?.connectionId || "";
  if (!nextConnectionId) {
    return false;
  }
  activeConnectionId.value = nextConnectionId;
  await Promise.all([
    loadCachedConnections(),
    loadWorkspaceCapabilities(),
    loadWorkspaceMetadata(),
    loadWorkspaceRemarks(),
    loadBackupStatus(),
    loadBackupList(),
    loadBinlogStatus(),
    loadBinlogEvents(),
  ]);
  return true;
};

const handleRefreshMysqlProcess = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await fetchJdbcProcessList(activeConnectionId.value);
    queryResult.value = response?.data || null;
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];
  } catch (error: any) {
    if (isConnectionExpiredError(error)) {
      try {
        const recovered = await reopenActiveJdbcConnection();
        if (recovered) {
          const response = await fetchJdbcProcessList(activeConnectionId.value);
          queryResult.value = response?.data || null;
          sqlExplainContent.value = "";
          sqlExplainRows.value = [];
          return;
        }
      } catch (retryError: any) {
        errorMessage.value = retryError?.message || "重建连接后刷新 MySQL 进程失败";
        return;
      }
    }
    errorMessage.value = error?.message || "刷新 MySQL 进程失败";
  } finally {
    submitting.value = false;
  }
};

const stopMysqlProcessAutoRefresh = () => {
  if (mysqlProcessRefreshTimer !== null) {
    window.clearInterval(mysqlProcessRefreshTimer);
    mysqlProcessRefreshTimer = null;
  }
};

const startMysqlProcessAutoRefresh = () => {
  stopMysqlProcessAutoRefresh();
  if (viewMode.value !== "workspace" || activeInspectorTabId.value !== "mysql-process") {
    return;
  }
  if (!activeConnectionId.value) {
    return;
  }
  if (mysqlProcessRefreshInterval.value <= 0) {
    return;
  }
  mysqlProcessRefreshTimer = window.setInterval(() => {
    void handleRefreshMysqlProcess();
  }, Math.max(1000, mysqlProcessRefreshInterval.value));
};

const handleUpdateMysqlProcessRefreshInterval = (value: number) => {
  const next = Number(value);
  if (!Number.isFinite(next) || next < 0) {
    return;
  }
  mysqlProcessRefreshInterval.value = next;
  if (next > 0 && viewMode.value === "workspace" && activeInspectorTabId.value === "mysql-process") {
    void handleRefreshMysqlProcess();
  }
  startMysqlProcessAutoRefresh();
};

const handleKillMysqlProcess = async (processIds: number[]) => {
  if (!activeConnectionId.value) {
    return;
  }
  const ids = (processIds || [])
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);
  if (!ids.length) {
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认关闭选中的 ${ids.length} 个进程？`,
      "关闭进程确认",
      {
        confirmButtonText: "关闭",
        cancelButtonText: "取消",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await killJdbcProcess(activeConnectionId.value, { processIds: ids });
    ElMessage.success("已提交关闭进程请求");
    await handleRefreshMysqlProcess();
  } catch (error: any) {
    if (isConnectionExpiredError(error)) {
      const recovered = await reopenActiveJdbcConnection();
      if (recovered) {
        await killJdbcProcess(activeConnectionId.value, { processIds: ids });
        ElMessage.success("已重建连接并关闭进程");
        await handleRefreshMysqlProcess();
        return;
      }
    }
    errorMessage.value = error?.message || "关闭 MySQL 进程失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

// ── 备份管理 ──────────────────────────────────────────

const loadBackupStatus = async () => {
  if (!activeConnectionId.value) return;
  try {
    const res = await getBackupStatus(activeConnectionId.value);
    backupSchedule.value = res?.data || null;
  } catch { /* ignore */ }
};

const loadBackupList = async () => {
  if (!activeConnectionId.value) return;
  try {
    const res = await listBackups(activeConnectionId.value);
    backupRecords.value = res?.data || [];
  } catch { backupRecords.value = []; }
};

const handleOpenBackupConfig = async () => {
  if (!activeConnectionId.value) return;
  try {
    const { value } = await ElMessageBox.prompt("请输入 Cron 表达式（如 0 2 * * * 表示每天凌晨2点）", "定时备份配置", {
      confirmButtonText: "启动",
      cancelButtonText: "取消",
      inputPlaceholder: "0 2 * * *",
      inputValue: backupSchedule.value?.cronExpression || "0 2 * * *",
      inputValidator: (v) => (v && v.trim().split(/\s+/).length >= 5) ? true : "请输入合法的 cron 表达式",
    });
    backupLoading.value = true;
    await startBackupSchedule(activeConnectionId.value, { cronExpression: value.trim() });
    ElMessage.success("定时备份已启动");
    await loadBackupStatus();
  } catch (e: any) {
    if (e !== "cancel" && e?.message) ElMessage.error(e.message);
  } finally {
    backupLoading.value = false;
  }
};

const handleStopBackup = async () => {
  if (!activeConnectionId.value) return;
  try {
    await ElMessageBox.confirm("确认停止定时备份？", "停止备份", { type: "warning" });
  } catch { return; }
  backupLoading.value = true;
  try {
    await stopBackupSchedule(activeConnectionId.value);
    ElMessage.success("定时备份已停止");
    await loadBackupStatus();
  } catch (e: any) {
    ElMessage.error(e?.message || "停止备份失败");
  } finally {
    backupLoading.value = false;
  }
};

const handleExecuteBackup = async () => {
  if (!activeConnectionId.value) return;
  backupLoading.value = true;
  try {
    await executeBackupNow(activeConnectionId.value);
    ElMessage.success("备份完成");
    await Promise.all([loadBackupStatus(), loadBackupList()]);
  } catch (e: any) {
    ElMessage.error(e?.message || "备份失败");
  } finally {
    backupLoading.value = false;
  }
};

const handleDeleteBackup = async (backupId: string) => {
  if (!activeConnectionId.value) return;
  backupLoading.value = true;
  try {
    await deleteBackup(activeConnectionId.value, backupId);
    ElMessage.success("已删除");
    await loadBackupList();
  } catch (e: any) {
    ElMessage.error(e?.message || "删除失败");
  } finally {
    backupLoading.value = false;
  }
};

const handleDownloadBackup = (backupId: string) => {
  if (!activeConnectionId.value) return;
  const url = `/v1/panel/jdbc/${activeConnectionId.value}/backup/${backupId}/download`;
  window.open(url, "_blank");
};

// ── Binlog 增量监听 ──

const loadBinlogStatus = async () => {
  if (!activeConnectionId.value) return;
  try {
    const res = await getBinlogStatus(activeConnectionId.value);
    binlogRunning.value = res?.data?.running || false;
  } catch { binlogRunning.value = false; }
};

const loadBinlogEvents = async () => {
  if (!activeConnectionId.value) return;
  try {
    const res = await getBinlogEvents(activeConnectionId.value, 100);
    binlogEvents.value = res?.data || [];
  } catch { binlogEvents.value = []; }
};

const handleStartBinlog = async () => {
  if (!activeConnectionId.value) return;
  try {
    await startBinlogMonitor(activeConnectionId.value);
    ElMessage.success("Binlog 监听已启动");
    await loadBinlogStatus();
  } catch (e: any) {
    ElMessage.error(e?.message || "启动失败");
  }
};

const handleStopBinlog = async () => {
  if (!activeConnectionId.value) return;
  try {
    await stopBinlogMonitor(activeConnectionId.value);
    ElMessage.success("Binlog 监听已停止");
    binlogRunning.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || "停止失败");
  }
};

const handleRefreshBinlogEvents = async () => {
  if (!activeConnectionId.value) return;
  await loadBinlogEvents();
};

const handleExecuteSql = async (statement?: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  const currentSql = (statement || sqlText.value).trim();
  if (!currentSql) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcSql(
      activeConnectionId.value,
      currentSql,
      sqlResultPageNum.value,
      previewLimit.value,
    );
    const resultData = response?.data;
    if (resultData?.errorMessage) {
      errorMessage.value = resultData.errorMessage;
      queryResult.value = null;
    } else {
      queryResult.value = resultData || null;
      if (queryResult.value?.pageNum) {
        sqlResultPageNum.value = queryResult.value.pageNum;
      }
    }
    sqlExplainContent.value = "";
    sqlExplainRows.value = [];
  } catch (error: any) {
    errorMessage.value = error?.message || "执行 SQL 失败";
  } finally {
    submitting.value = false;
  }
};

const handleExecuteSqlPage = async (page: number) => {
  sqlResultPageNum.value = page;
  await handleExecuteSql();
};

const handleExplainSql = async () => {
  if (!activeConnectionId.value) {
    return;
  }
  const currentSql = sqlText.value.trim();
  if (!currentSql) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await explainJdbcExecution(
      activeConnectionId.value,
      currentSql,
    );
    const explainResult = response?.data || null;
    queryResult.value = explainResult;
    sqlExplainRows.value = explainResult?.rows || [];
    sqlExplainContent.value = explainResult
      ? `EXPLAIN 返回 ${explainResult.rows?.length || 0} 行，耗时 ${explainResult.elapsedMillis ?? 0} ms`
      : "";
    activeInspectorTabId.value = "workspace";
  } catch (error: any) {
    errorMessage.value = error?.message || "执行 EXPLAIN 失败";
  } finally {
    submitting.value = false;
  }
};

const handleGenerateSql = async (prompt: string) => {
  if (!activeConnectionId.value) {
    return;
  }
  try {
    const response = await generateJdbcSql(activeConnectionId.value, {
      prompt,
      tableNames: explorerTree.value
        .flatMap((catalog) => catalog.children || [])
        .map((table) => String(table.tableName || table.nodeName))
        .slice(0, 50),
    });
    sqlText.value = response?.data || "";
  } catch (error: any) {
    errorMessage.value = error?.message || "AI 生成 SQL 失败";
  }
};

const handleFieldNote = (node: JdbcCatalogNode) => {
  const key = buildFieldNoteKey(
    {
      ...node,
      tableName: node.tableName || node.nodeName,
    } as JdbcCatalogNode,
    node.columnName || node.nodeName,
  );
  return (
    fieldNotes.value[key] ||
    node.attributes?.fieldComment ||
    node.description ||
    ""
  );
};

const handleObjectNote = (node: JdbcCatalogNode) => {
  const key = buildObjectNoteKey(node);
  return (
    objectNotes.value[key] ||
    tableStructureCache.value[node.nodeId]?.tableComment ||
    node.description ||
    ""
  );
};

const closeNoteEditor = () => {
  noteEditor.visible = false;
  noteEditor.node = null;
  noteEditor.value = "";
};

const openNoteEditor = (
  node: JdbcCatalogNode,
  targetType: "catalog" | "field" | "table",
  position: { x: number; y: number },
) => {
  noteEditor.node = node;
  noteEditor.targetType = targetType;
  noteEditor.value =
    targetType === "field" ? handleFieldNote(node) : handleObjectNote(node);
  noteEditor.x = Math.max(16, Math.min(window.innerWidth - 320, position.x));
  noteEditor.y = Math.max(16, Math.min(window.innerHeight - 220, position.y));
  noteEditor.visible = true;
};

const submitNoteEditor = async () => {
  if (!activeConnectionId.value || !noteEditor.node) {
    return;
  }

  const panelNode = noteEditor.node;
  const remarkContent = noteEditor.value.trim();

  submitting.value = true;
  errorMessage.value = "";
  try {
    if (noteEditor.targetType === "catalog") {
      const response = await savePanelRemark(activeConnectionId.value, {
        panelNodeType: "catalog",
        panelCatalogName: panelNode.catalogName || panelNode.nodeName,
        panelSchemaName: panelNode.schemaName,
        panelTableName: panelNode.tableName || panelNode.nodeName,
        panelColumnName: null,
        panelRemarkContent: remarkContent,
      });
      const noteKey = buildObjectNoteKey(panelNode);
      objectNotes.value = {
        ...objectNotes.value,
        [noteKey]: response?.data?.panelRemarkContent || remarkContent,
      };
      ElMessage.success("备注已保存");
      closeNoteEditor();
      return;
    }

    const tableNode =
      noteEditor.targetType === "field"
        ? explorerTree.value
            .flatMap((catalog) => catalog.children || [])
            .find((table) => table.nodeId === panelNode.parentId)
        : panelNode;
    if (!tableNode) {
      throw new Error("未找到所属数据表");
    }

    if (noteEditor.targetType === "field") {
      await updateJdbcColumnComment(activeConnectionId.value, {
        panelCatalogName: tableNode.catalogName,
        panelSchemaName: tableNode.schemaName,
        panelTableName: tableNode.tableName || tableNode.nodeName,
        panelColumnName: panelNode.columnName || panelNode.nodeName,
        panelCommentContent: remarkContent,
      });
      const noteKey = buildFieldNoteKey(
        tableNode,
        panelNode.columnName || panelNode.nodeName,
      );
      fieldNotes.value = {
        ...fieldNotes.value,
        [noteKey]: remarkContent,
      };
    } else {
      await updateJdbcTableComment(activeConnectionId.value, {
        panelCatalogName: tableNode.catalogName,
        panelSchemaName: tableNode.schemaName,
        panelTableName: tableNode.tableName || tableNode.nodeName,
        panelCommentContent: remarkContent,
      });
      const noteKey = buildObjectNoteKey(tableNode);
      objectNotes.value = {
        ...objectNotes.value,
        [noteKey]: remarkContent,
      };
    }

    await refreshTableStructureForNode(tableNode);
    await refreshOpenTableTabsByNode(tableNode);
    ElMessage.success("备注已写入数据库");
    closeNoteEditor();
  } catch (error: any) {
    errorMessage.value = error?.message || "保存备注失败";
    ElMessage.error(errorMessage.value);
  } finally {
    submitting.value = false;
  }
};

const handleGlobalPointerDown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!noteEditor.visible) {
    return;
  }
  if (target?.closest(".note-popover")) {
    return;
  }
  closeNoteEditor();
};

const requestSqlTemplate = async (
  node: JdbcCatalogNode,
  panelActionType: string,
  panelBackupTableName?: string,
) => {
  if (!activeConnectionId.value) {
    return "";
  }
  const response = await fetchPanelSqlTemplate(activeConnectionId.value, {
    panelCatalogName: node.catalogName,
    panelSchemaName: node.schemaName,
    panelTableName: node.tableName || node.nodeName,
    panelActionType,
    panelBackupTableName,
    panelPreviewLimit: previewLimit.value,
  });
  return response?.data || "";
};

const buildDefaultBackupTableName = (node: JdbcCatalogNode) =>
  `${node.tableName || node.nodeName}_panel_backup_${Date.now()}`;

const removeTableTabsByNode = (node: JdbcCatalogNode) => {
  const removedTabIds = inspectorTabs.value
    .filter((tab) => tab.node.nodeId === node.nodeId)
    .map((tab) => tab.tabId);
  inspectorTabs.value = inspectorTabs.value.filter(
    (tab) => tab.node.nodeId !== node.nodeId,
  );
  if (removedTabIds.includes(activeInspectorTabId.value)) {
    activeInspectorTabId.value = "workspace";
  }
};

const executeTableNodeAction = async (
  node: JdbcCatalogNode,
  panelActionType: string,
  label: string,
  panelBackupTableName?: string,
) => {
  if (!activeConnectionId.value) {
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    const response = await executeJdbcTableAction(activeConnectionId.value, {
      panelCatalogName: node.catalogName,
      panelSchemaName: node.schemaName,
      panelTableName: node.tableName || node.nodeName,
      panelActionType,
      panelBackupTableName,
    });
    const result = response?.data;
    ElMessage.success(result?.panelMessage || `${label}已完成`);

    if (panelActionType === "drop") {
      removeTableTabsByNode(node);
    }
    if (panelActionType === "clear" || panelActionType === "truncate") {
      const targetTab = inspectorTabs.value.find(
        (tab) => tab.node.nodeId === node.nodeId && tab.tabType === "table",
      );
      if (targetTab) {
        await handleRefreshTableData(targetTab.tabId);
      }
    }
    await handleLoadCatalog();
  } catch (error: any) {
    errorMessage.value = error?.message || `${label}失败`;
  } finally {
    submitting.value = false;
  }
};

const confirmDangerousTableAction = async (
  node: JdbcCatalogNode,
  label: string,
  actionType: string,
) => {
  try {
    await ElMessageBox.confirm(
      `即将对表 ${fullTableName(node)} 执行“${label}”操作，是否继续？`,
      `${label}确认`,
      {
        cancelButtonText: "取消",
        confirmButtonText: "继续",
        confirmButtonClass: "el-button--danger",
        type: "warning",
      },
    );
  } catch {
    return;
  }
  await executeTableNodeAction(node, actionType, label);
};

const promptBackupTableAction = async (node: JdbcCatalogNode) => {
  let backupTableName = "";
  try {
    const result = await ElMessageBox.prompt(
      `请输入 ${fullTableName(node)} 的备份表名`,
      "备份表",
      {
        cancelButtonText: "取消",
        confirmButtonText: "生成并执行",
        inputPlaceholder: "输入备份表名",
        inputValue: buildDefaultBackupTableName(node),
      },
    );
    backupTableName = result.value.trim();
  } catch {
    return;
  }
  if (!backupTableName) {
    ElMessage.warning("请输入备份表名");
    return;
  }
  await executeTableNodeAction(node, "backup", "备份表", backupTableName);
};

const handleContextAction = async ({
  action,
  node,
  position,
  targetType,
}: {
  action: string;
  node: JdbcCatalogNode | null;
  position: { x: number; y: number };
  targetType: string;
}) => {
  if (action === "refresh") {
    await handleLoadCatalog();
    return;
  }

  if (action === "refresh-data") {
    await handleLoadCatalog();
    return;
  }

  if (action === "toggle-collapse") {
    toggleAside();
    return;
  }

  if (action === "close-connection") {
    await handleBackHome();
    return;
  }

  if (action === "edit-field-note" && node) {
    openNoteEditor(node, "field", position);
    return;
  }

  if (action === "edit-note" && node) {
    openNoteEditor(
      node,
      node.nodeType === "catalog" ? "catalog" : "table",
      position,
    );
    return;
  }

  if (action === "copy-name" && node) {
    await navigator.clipboard.writeText(
      node.columnName || fullTableName(node) || node.nodeName,
    );
    return;
  }

  if (action === "new-sql") {
    if (targetType === "datasource") {
      injectSql(`select 1 as ping;\n-- 默认预览 limit ${previewLimit.value}`);
      activeInspectorTabId.value = "workspace";
      return;
    }
    if (node) {
      injectSql(`select * from ${fullTableName(node)};`);
      activeInspectorTabId.value = "workspace";
    }
    return;
  }

  if (!node) {
    return;
  }

  if (action === "design-table") {
    const tab = await ensureInspectorTab(
      node,
      "table-edit",
      "columns",
      true,
      false,
    );
    activeInspectorTabId.value = tab.tabId;
    return;
  }

  if (action === "open-data") {
    const tab = await ensureInspectorTab(node, "table", "data", true, false);
    activeInspectorTabId.value = tab.tabId;
    deferBackgroundTask(() => {
      void handleRefreshTableData(tab.tabId);
    });
    return;
  }

  if (action === "refresh-table") {
    await refreshTableStructureForNode(node);
    await refreshOpenTableTabsByNode(node);
    return;
  }

  if (action === "account-manage" || action === "manage-account") {
    await handleOpenAccountManager(node);
    return;
  }

  if (action === "open-database-document") {
    await handleOpenDatabaseDocument(node);
    return;
  }

  if (action === "sql-select") {
    injectSql(await requestSqlTemplate(node, "select"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-count") {
    injectSql(await requestSqlTemplate(node, "count"));
    activeInspectorTabId.value = "workspace";
    return;
  }

  if (action === "sql-clear") {
    await confirmDangerousTableAction(node, "清空表", "clear");
    return;
  }

  if (action === "sql-backup") {
    await promptBackupTableAction(node);
    return;
  }

  if (action === "sql-truncate") {
    await confirmDangerousTableAction(node, "截断表", "truncate");
    return;
  }

  if (action === "sql-drop") {
    await confirmDangerousTableAction(node, "删除表", "drop");
  }
};

const handlePreviewLimitChange = (value: number | undefined) => {
  previewLimit.value = value && value > 0 ? value : 1000;
  persistConfig();
};

const handleTreeMultiExpandChange = (value: boolean | string | number) => {
  treeMultiExpand.value = Boolean(value);
  if (!treeMultiExpand.value) {
    expandedCatalogNodeId.value = "";
    expandedTableNodeId.value = "";
  }
  persistConfig();
};

const toggleAside = () => {
  asideCollapsed.value = !asideCollapsed.value;
};

const decodeScCredential = (scRaw: string | null): ServerCredential | null => {
  if (!scRaw) {
    return null;
  }
  try {
    const salt = import.meta.env.VITE_SC_SALT ?? "default-salt";
    return decodeScParam(decodeURIComponent(scRaw), salt);
  } catch {
    return null;
  }
};

const buildNginxSourceFromSc = (credential: ServerCredential): PanelSavedSource => {
  const host = String(credential.host || "").trim();
  const port = Number(credential.port || 22);
  const username = String(credential.username || "root").trim() || "root";
  const privateKey = String(credential.privateKey || "").trim();
  const connectionName = host ? `Nginx@${host}` : "Nginx";
  return {
    ...DEFAULT_JDBC_CONNECTION,
    sourceId: `sc-nginx-${host || "host"}-${port || 22}`,
    sourceType: "NGINX",
    connectionName,
    host,
    port: Number.isFinite(port) && port > 0 ? port : 22,
    username,
    password: credential.password || "",
    attributes: {
      ...DEFAULT_JDBC_CONNECTION.attributes,
      privateKey: privateKey || undefined,
      serverType: credential.serverType,
      connectTimeout: credential.connectTimeout,
    },
    updatedAt: new Date().toISOString(),
  };
};

watch(viewMode, () => { syncViewToUrl(); });
watch(sshSource, () => { syncViewToUrl(); });

onMounted(async () => {
  const scCredential = decodeScCredential(initialScRaw);
  await loadSources();
  loadConfig();
  document.addEventListener("mousedown", handleGlobalPointerDown);
  await loadCachedConnections();
  const ticket = INITIAL_WORKSPACE_TICKET;
  if (ticket) {
    // 清理 URL 中的 ticket 参数，防止地址栏越来越长
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("ticket");
    window.history.replaceState({}, "", cleanUrl.toString());

    viewMode.value = "booting";
    bootingHint.value = "正在解析工作区 ticket...";
    try {
      const payload = await decryptWorkspaceTicket<{ source: PanelSavedSource }>(
        ticket,
      );
      if (payload?.source) {
        await bootstrapWorkspace(payload.source);
      }
    } catch (error: any) {
      errorMessage.value = error?.message || "ticket 解密失败";
      viewMode.value = "hub";
    }
    return;
  }

  if (scCredential?.serverType === "SSH") {
    console.info("[Panel] 检测到 _sc 参数，自动进入 Nginx 项目管理模式");
    viewMode.value = "booting";
    bootingHint.value = "正在根据地址栏服务器信息打开项目管理...";
    await bootstrapWorkspace(buildNginxSourceFromSc(scCredential));
    return;
  }

  /** 恢复 SSH 会话（防止页面刷新重新设置） */
  const savedSession = loadSshSession();
  if (savedSession) {
    const matched = savedSources.value.find(
      (s) => s.sourceId === savedSession.sourceId,
    );
    if (matched) {
      viewMode.value = "service-panel";
      sshSource.value = matched;
      await handleServicePanelConnect([matched]);
    } else {
      clearSshSession();
    }
  }

  // URL 视图状态恢复（优先级低于 ticket/_sc，高于默认 hub）
  const urlState = parseUrlViewState();
  if (urlState && viewMode.value === 'hub') {
    if (urlState.view === 'service-panel') {
      const matched = savedSources.value.find(
        (s) => s.sourceId === urlState.sourceId,
      );
      if (matched) {
        viewMode.value = 'service-panel';
        sshSource.value = matched;
        await handleServicePanelConnect([matched]);
      }
    }
  }
});

watch(
  [
    mysqlProcessAutoRefresh,
    mysqlProcessRefreshInterval,
    activeInspectorTabId,
    activeConnectionId,
    viewMode,
  ],
  () => {
    startMysqlProcessAutoRefresh();
  },
);

onBeforeUnmount(() => {
  stopMysqlProcessAutoRefresh();
  tableDataRefreshTimers.forEach((timer) => window.clearTimeout(timer));
  tableDataRefreshTimers.clear();
  document.removeEventListener("mousedown", handleGlobalPointerDown);
});
</script>

<style scoped lang="scss">
.panel-root {
  min-height: 100%;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2eaf1 50%, #e8eef5 100%);
  animation: panel-enter 0.4s ease-out;

  @keyframes panel-enter {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}

/* 服务面板入口 */
.service-panel-entry {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.4);
  z-index: 100;
  transition: all 0.2s;
}
.service-panel-entry:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(64, 158, 255, 0.5);
}

.workspace-mode {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}

.redis-mode,
.dbx-mode {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100vh;
  min-height: 0;
  overflow: hidden;
  animation: mode-enter 0.35s ease-out;

  @keyframes mode-enter {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

/* MQTT 工作台 -- ScLayout 内部处理布局，外层只需撑满视口 */
.mqtt-mode {
  height: 100vh;
  overflow: hidden;
  animation: mode-enter 0.35s ease-out;
}

.redis-mode__body,
.dbx-mode__body {
  min-height: 0;
  overflow: hidden;
  border-radius: 12px;
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  border: 1px solid var(--dt-glass-border-light);
  margin: 0;
  transition: background 0.3s ease, border-color 0.3s ease;
}

.dbx-frame {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #fff;
}

.workspace-booting {
  display: grid;
  place-items: center;
  gap: 14px;
  height: 100vh;
  color: #4f6778;
  font-size: 14px;
  animation: boot-enter 0.4s ease-out;
  border-radius: 20px;
  border: 1px solid rgba(123, 142, 154, 0.08);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.88),
    rgba(243, 247, 250, 0.84)
  );
  backdrop-filter: blur(12px);
  margin: 0;

  @keyframes boot-enter {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
  }
}

.workspace-booting__icon {
  font-size: 28px;
  color: #6366f1;
}

.workspace-bar {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  padding: 8px 14px;
  border: 1px solid var(--dt-glass-border-light);
  border-radius: var(--dt-radius-xl);
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  -webkit-backdrop-filter: var(--dt-glass-blur-light);
  min-height: 44px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.04), transparent 50%);
    pointer-events: none;
  }
}

.workspace-bar__main {
  display: flex;
  gap: 10px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.workspace-bar__meta {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: #64748b;
  font-size: 12px;
  position: relative;
  z-index: 1;
}

.workspace-bar__meta strong {
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.01em;
  background: linear-gradient(135deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* 深色模式 */
html.dark .workspace-bar {
  background: var(--dt-glass-bg-dark);
  border-color: var(--dt-glass-border-dark);
  box-shadow: var(--dt-shadow-sm);

  &::before {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), transparent 50%);
  }

  .workspace-bar__meta {
    color: #8899a8;
  }

  .workspace-bar__meta strong {
    color: #d0dce8;
  }
}

html.dark .redis-mode__body,
html.dark .dbx-mode__body {
  background: var(--dt-glass-bg-dark);
  border-color: var(--dt-glass-border-dark);
}

html.dark .dbx-frame {
  background: #0f172a;
}

html.dark .workspace-booting {
  background: linear-gradient(
    180deg,
    rgba(15, 23, 42, 0.84),
    rgba(20, 30, 48, 0.8)
  );
  border-color: rgba(148, 163, 184, 0.06);
  color: #94a3b8;
}

.config-panel {
  display: grid;
  gap: 8px;
}

.config-panel span {
  color: #60798a;
  font-size: 12px;
}

.config-panel__switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.workspace-frame {
  min-height: 0;
  height: 100%;
}

.workspace-main {
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  padding: 0;
}

.panel-root :deep(.el-button) {
  border-radius: 10px;
}

.note-popover {
  position: fixed;
  z-index: 60;
  display: grid;
  gap: 10px;
  width: 300px;
  padding: 10px;
  border: 1px solid rgba(116, 133, 146, 0.2);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
}

.note-popover__head,
.note-popover__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.note-popover__head strong {
  color: #133042;
  font-size: 13px;
}

.note-popover__head button {
  border: 0;
  background: transparent;
  color: #60798a;
  font-size: 16px;
  cursor: pointer;
}

.note-popover :deep(.el-textarea__inner) {
  border-radius: 10px;
}

@media (max-width: 1024px) {
  .workspace-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .workspace-main {
    padding-left: 0;
  }
}
</style>
