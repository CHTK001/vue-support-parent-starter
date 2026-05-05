<template>
  <div class="pcsp">
    <header class="pcsp__hero">
      <div>
        <p class="pcsp__eyebrow">Container Service</p>
        <h2>{{ projectNameText }}</h2>
        <p class="pcsp__meta">
          项目ID：{{ projectIdText }}
          <template v-if="serverSummary"> · 服务器：{{ serverSummary }}</template>
        </p>
      </div>
      <div class="pcsp__hero-actions">
        <ScTooltip content="刷新服务数据" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle plain @click="reloadAll">
            <IconifyIconOnline icon="ep:refresh" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="加载已保存编排" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle plain :loading="topologyPersisting" @click="loadTopologyFromBackend">
            <IconifyIconOnline icon="ri:download-cloud-2-line" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="保存当前编排" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle plain :loading="topologyPersisting" @click="saveTopologyToBackend">
            <IconifyIconOnline icon="ri:save-3-line" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="启动编排项目" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle type="primary" plain :loading="topologyRunning" :disabled="topologyRunning" @click="runTopologyAction('START')">
            <IconifyIconOnline icon="ep:video-play" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="停止编排项目（反向顺序）" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle type="danger" plain :loading="topologyRunning" :disabled="topologyRunning" @click="runTopologyAction('STOP')">
            <IconifyIconOnline icon="ep:video-pause" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="重启编排项目" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle type="warning" plain :loading="topologyRunning" :disabled="topologyRunning" @click="runTopologyAction('RESTART')">
            <IconifyIconOnline icon="ep:refresh-right" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="导入已有项目" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle plain @click="openProjectImportDialog">
            <IconifyIconOnline icon="ri:folder-transfer-line" />
          </ScButton>
        </ScTooltip>
        <ScTooltip content="导入预设软件" placement="bottom">
          <ScButton class="pcsp__icon-action" size="small" circle plain @click="openPresetImportDialog">
            <IconifyIconOnline icon="ri:apps-2-add-line" />
          </ScButton>
        </ScTooltip>
      </div>
    </header>

    <div class="pcsp__layout">
      <aside class="pcsp__aside">
        <section class="pcsp__panel pcsp__panel--stretch">
          <div class="pcsp__panel-head">
            <div>
              <h3>左侧服务节点</h3>
              <p>显示已安装的软件服务与已导入项目</p>
            </div>
          </div>

          <div class="pcsp__node-section">
            <div class="pcsp__node-section-head">
              <strong>软件服务</strong>
              <span>{{ bindings.length }}</span>
            </div>
            <div class="pcsp__list thin-scroller pcsp__list--nodes">
              <article
                v-for="item in bindings"
                :key="`software-${item.sysProjectContainerSoftwareBindingId}`"
                class="pcsp__node-card pcsp__node-card--software"
                draggable="true"
                @dragstart="handleServiceNodeDragStart($event, 'software', resolveBindingNodeId(item))"
                @click="focusNode(resolveBindingNodeId(item))"
              >
                <div class="pcsp__node-card-main">
                  <div class="pcsp__node-card-title">
                    <strong>{{ item.softwareName || item.softwareCode }}</strong>
                    <el-tag size="small" :type="resolveRuntimeTagType(item.runtimeStatus)">
                      {{ item.runtimeStatus || "UNKNOWN" }}
                    </el-tag>
                  </div>
                  <span>{{ item.softwareVersion || "-" }}</span>
                  <small>安装状态：{{ item.installStatus || "UNKNOWN" }}</small>
                </div>
                <div class="pcsp__node-toolbar">
                  <ScTooltip content="刷新状态" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click.stop="handleOperate(item, 'STATUS')">
                      <IconifyIconOnline icon="ep:refresh" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="showInstallAction(item)" content="安装服务" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="success"
                      plain
                      @click.stop="handleOperate(item, 'INSTALL')"
                    >
                      <IconifyIconOnline icon="ri:download-cloud-2-line" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="showStartAction(item)" content="启动服务" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="primary"
                      plain
                      @click.stop="handleOperate(item, 'START')"
                    >
                      <IconifyIconOnline icon="ep:video-play" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="showStopAction(item)" content="停止服务" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="danger"
                      plain
                      @click.stop="handleOperate(item, 'STOP')"
                    >
                      <IconifyIconOnline icon="ep:video-pause" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="showRestartAction(item)" content="重启服务" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="warning"
                      plain
                      @click.stop="handleOperate(item, 'RESTART')"
                    >
                      <IconifyIconOnline icon="ep:refresh-right" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="服务配置" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click.stop="openSoftwareConfig(item)">
                      <IconifyIconOnline icon="ep:setting" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="卸载服务" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click.stop="handleOperate(item, 'UNINSTALL')">
                      <IconifyIconOnline icon="ri:delete-bin-6-line" />
                    </ScButton>
                  </ScTooltip>
                </div>
              </article>
            </div>
          </div>

          <div class="pcsp__node-section">
            <div class="pcsp__node-section-head">
              <strong>导入项目</strong>
              <span>{{ importedProjects.length }}</span>
            </div>
            <div class="pcsp__list thin-scroller pcsp__list--nodes">
              <article
                v-for="item in importedProjects"
                :key="`project-${item.projectId}`"
                class="pcsp__node-card pcsp__node-card--project"
                draggable="true"
                @dragstart="handleServiceNodeDragStart($event, 'project', resolveProjectNodeId(item.projectId))"
                @click="focusNode(resolveProjectNodeId(item.projectId))"
              >
                <div class="pcsp__node-card-main">
                  <div class="pcsp__node-card-title">
                    <strong>{{ item.projectName || `项目-${item.projectId}` }}</strong>
                    <el-tag size="small" :type="resolveProjectRuntimeTagType(item.runtimeStatus)">
                      {{ item.runtimeStatus || "unknown" }}
                    </el-tag>
                  </div>
                  <span>项目ID：{{ item.projectId }}</span>
                  <small>{{ item.projectDescription || "复用项目管理能力" }}</small>
                </div>
                <div class="pcsp__node-toolbar">
                  <ScTooltip content="刷新状态" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click.stop="refreshImportedProjectStatus(item)">
                      <IconifyIconOnline icon="ep:refresh" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="String(item.runtimeStatus || '').toLowerCase() !== 'running'" content="启动项目" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="primary"
                      plain
                      @click.stop="handleImportedProjectAction(item, 'start')"
                    >
                      <IconifyIconOnline icon="ep:video-play" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip v-if="String(item.runtimeStatus || '').toLowerCase() === 'running'" content="停止项目" placement="top">
                    <ScButton
                      class="pcsp__icon-action"
                      size="small"
                      circle
                      type="danger"
                      plain
                      @click.stop="handleImportedProjectAction(item, 'stop')"
                    >
                      <IconifyIconOnline icon="ep:video-pause" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="重启项目" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle type="warning" plain @click.stop="handleImportedProjectAction(item, 'restart')">
                      <IconifyIconOnline icon="ep:refresh-right" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="移除导入项目" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click.stop="handleRemoveImportedProject(item.projectId)">
                      <IconifyIconOnline icon="ri:delete-bin-6-line" />
                    </ScButton>
                  </ScTooltip>
                </div>
              </article>
            </div>
          </div>
        </section>
      </aside>

      <section class="pcsp__main">
        <div class="pcsp__panel pcsp__panel--editor">
          <div class="pcsp__panel-head">
            <div>
              <h3>右侧编排</h3>
              <p>使用 ScFlowEditor 基于 node / edge 生成编排任务</p>
            </div>
            <div class="pcsp__panel-actions">
              <ScTooltip content="同步左侧服务节点" placement="top">
                <ScButton class="pcsp__icon-action" size="small" circle plain @click="syncEditorDataFromServices">
                  <IconifyIconOnline icon="ri:node-tree" />
                </ScButton>
              </ScTooltip>
              <ScTooltip content="生成编排任务" placement="top">
                <ScButton class="pcsp__icon-action" size="small" circle type="primary" plain @click="rebuildExecutionPlan">
                  <IconifyIconOnline icon="ri:flow-chart" />
                </ScButton>
              </ScTooltip>
            </div>
          </div>

          <div
            class="pcsp__editor-dropzone"
            @dragover.prevent
            @drop="handleEditorDrop"
          >
            <ScFlowEditor
              :nodes="editorNodes"
              :edges="editorEdges"
              class="pcsp__editor"
              :show-node-panel="false"
              :show-property-panel="true"
              :show-statusbar="true"
              :minimap="true"
              :auto-arrange="true"
              background="dots"
              @update:nodes="handleEditorNodesChanged"
              @update:edges="handleEditorEdgesChanged"
              @data-changed="handleEditorDataChanged"
              @node-selected="handleEditorNodeSelected"
            >
              <template #property-panel="{ node }">
              <div class="pcsp__property-panel">
                <ScInput
                  :model-value="resolveNodeLabel(node?.id)"
                  placeholder="节点名称"
                  :disabled="isProjectNodeId(String(node?.id || ''))"
                  @update:modelValue="updateSelectedNodeLabel(node?.id, $event)"
                />
                <ScInput :model-value="String(node?.id || '')" disabled placeholder="节点ID" />
                <ScInput :model-value="resolveNodeKindText(node?.id)" disabled placeholder="节点类型" />
                <div class="pcsp__property-actions">
                  <ScTooltip content="刷新节点状态" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle plain @click="operateEditorNode(String(node?.id || ''), 'STATUS')">
                      <IconifyIconOnline icon="ep:refresh" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="启动当前节点" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle type="primary" plain @click="operateEditorNode(String(node?.id || ''), 'START')">
                      <IconifyIconOnline icon="ep:video-play" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="停止当前节点" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle type="danger" plain @click="operateEditorNode(String(node?.id || ''), 'STOP')">
                      <IconifyIconOnline icon="ep:video-pause" />
                    </ScButton>
                  </ScTooltip>
                  <ScTooltip content="重启当前节点" placement="top">
                    <ScButton class="pcsp__icon-action" size="small" circle type="warning" plain @click="operateEditorNode(String(node?.id || ''), 'RESTART')">
                      <IconifyIconOnline icon="ep:refresh-right" />
                    </ScButton>
                  </ScTooltip>
                </div>
                <ScSelect
                  :model-value="readNodeConfig(String(node?.id || '')).required"
                  placeholder="是否关键节点"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'required', $event)"
                >
                  <ScOption :value="true" label="关键节点" />
                  <ScOption :value="false" label="可选节点" />
                </ScSelect>
                <ScSelect
                  :model-value="readNodeConfig(String(node?.id || '')).failurePolicy"
                  placeholder="失败策略"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'failurePolicy', $event)"
                >
                  <ScOption value="stop" label="失败即中断" />
                  <ScOption value="continue" label="失败后继续" />
                </ScSelect>
                <ScInput
                  :model-value="String(readNodeConfig(String(node?.id || '')).startDelaySec || 0)"
                  placeholder="启动延迟秒数"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'startDelaySec', Number($event || 0))"
                />
                <ScInput
                  :model-value="readNodeConfig(String(node?.id || '')).healthCheckHint"
                  placeholder="健康检查提示"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'healthCheckHint', $event)"
                />
                <ScInput
                  :model-value="readNodeConfig(String(node?.id || '')).beforeStartNote"
                  type="textarea"
                  :rows="3"
                  placeholder="启动前置说明"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'beforeStartNote', $event)"
                />
                <ScInput
                  :model-value="readNodeConfig(String(node?.id || '')).afterStartNote"
                  type="textarea"
                  :rows="3"
                  placeholder="启动后置说明"
                  @update:modelValue="updateNodeConfigField(String(node?.id || ''), 'afterStartNote', $event)"
                />
                <div class="pcsp__node-log-panel">
                  <div class="pcsp__node-log-tabs">
                    <ScButton
                      v-for="item in nodeLogTabs"
                      :key="item.value"
                      size="small"
                      :type="selectedNodeLogTab === item.value ? 'primary' : undefined"
                      plain
                      @click="selectedNodeLogTab = item.value"
                    >
                      {{ item.label }}
                    </ScButton>
                  </div>
                  <pre class="pcsp__node-log-content thin-scroller">{{ selectedNodeLogText }}</pre>
                </div>
              </div>
              </template>
            </ScFlowEditor>
          </div>
        </div>

        <div class="pcsp__bottom">
          <section class="pcsp__panel pcsp__panel--log">
            <div class="pcsp__panel-head">
              <div>
                <h3>实时日志</h3>
                <p>{{ streamStatusText }}</p>
              </div>
            </div>
            <pre class="pcsp__log-content thin-scroller">{{ logText }}</pre>
          </section>
        </div>
      </section>
    </div>

    <ScTaskMessageDialog
      v-model:visible="taskDialogVisible"
      title="容器服务任务"
      :task="taskDialogModel"
      @refresh="refreshTaskDialog"
    />

    <ScDialog
      v-model="projectImportDialogVisible"
      title="导入已有项目"
      width="720px"
      destroy-on-close
    >
      <div class="pcsp__dialog-list thin-scroller">
        <div v-if="loadingProjectCandidates" class="pcsp__empty">正在加载项目...</div>
        <template v-else>
          <div
            v-for="item in projectCandidates"
            :key="item.projectId"
            class="pcsp__item"
          >
            <div class="pcsp__item-main">
              <strong>{{ item.projectName || `项目-${item.projectId}` }}</strong>
              <span>{{ item.runtimeStatus || "unknown" }}</span>
              <small>项目ID：{{ item.projectId }}</small>
            </div>
            <ScTooltip content="导入到当前编排项目" placement="top">
              <ScButton class="pcsp__icon-action" size="small" circle type="primary" plain @click="handleImportProject(item)">
                <IconifyIconOnline icon="ri:folder-add-line" />
              </ScButton>
            </ScTooltip>
          </div>
        </template>
        <div v-if="!loadingProjectCandidates && !projectCandidates.length" class="pcsp__empty">
          暂无可导入项目
        </div>
      </div>
      <template #footer>
        <ScButton @click="projectImportDialogVisible = false">关闭</ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="presetImportDialogVisible"
      title="导入预设软件"
      width="820px"
      destroy-on-close
    >
      <div class="pcsp__dialog-list pcsp__dialog-list--presets thin-scroller">
        <div
          v-for="item in installablePresets"
          :key="item.sysProjectContainerSoftwarePresetId"
          class="pcsp__item"
        >
          <div class="pcsp__item-main">
            <strong>{{ item.softwareName || item.softwareCode }}</strong>
            <span>{{ item.softwareVersion || "-" }} · {{ item.softwareCategory || "-" }}</span>
            <small>{{ item.osType || "-" }} / {{ item.softwareArch || "-" }} · {{ item.presetRemark || "预设安装到服务" }}</small>
          </div>
          <ScTooltip content="安装到当前服务" placement="top">
            <ScButton
              class="pcsp__icon-action"
              size="small"
              circle
              type="primary"
              plain
              :loading="importingPresetId === item.sysProjectContainerSoftwarePresetId"
              @click="handleImportPreset(item)"
            >
              <IconifyIconOnline icon="ri:download-cloud-2-line" />
            </ScButton>
          </ScTooltip>
        </div>
        <div v-if="!installablePresets.length" class="pcsp__empty">
          暂无可用预设
        </div>
      </div>
      <template #footer>
        <ScButton @click="presetImportDialogVisible = false">关闭</ScButton>
      </template>
    </ScDialog>

    <ScDialog
      v-model="configDialogVisible"
      :title="configDialogTitle"
      width="960px"
      destroy-on-close
      @closed="handleConfigDialogClosed"
    >
      <div v-if="configDialogMode === 'software'" class="pcsp__config-grid">
        <ScInput v-model="softwareConfigForm.softwareName" placeholder="服务名称" />
        <ScInput v-model="softwareConfigForm.softwareCode" placeholder="服务编码" />
        <ScInput v-model="softwareConfigForm.softwareVersion" placeholder="版本" />
        <ScInput v-model="softwareConfigForm.installPath" placeholder="安装路径" />
        <ScInput v-model="softwareConfigForm.exposePorts" placeholder="暴露端口，如 80,443" />
        <ScInput v-model="softwareConfigRemarkText" placeholder="备注" />
      </div>
      <div v-if="configDialogMode === 'software' && softwareConfigProfile" class="pcsp__config-grid pcsp__config-grid--runtime">
        <template v-if="softwareConfigProfile === 'mysql8'">
          <ScInput v-model="softwareRuntimeConfigForm.mysqlPort" placeholder="MySQL 端口，如 3306" />
          <ScInput v-model="softwareRuntimeConfigForm.mysqlDataDir" placeholder="数据目录，如 /var/lib/mysql" />
          <ScInput v-model="softwareRuntimeConfigForm.mysqlRootPassword" type="password" placeholder="root 密码" />
          <ScSelect v-model="softwareRuntimeConfigForm.mysqlRemoteAccess" placeholder="远程访问">
            <ScOption :value="true" label="允许 root 远程访问" />
            <ScOption :value="false" label="仅本机访问" />
          </ScSelect>
        </template>
        <template v-else-if="softwareConfigProfile === 'guacamole'">
          <ScInput v-model="softwareRuntimeConfigForm.guacamolePort" placeholder="Web 端口，如 8080" />
          <ScInput v-model="softwareRuntimeConfigForm.guacamoleHome" placeholder="配置目录，如 /etc/guacamole" />
          <ScInput v-model="softwareRuntimeConfigForm.guacamoleVersion" placeholder="Guacamole 版本，如 1.5.5" />
          <ScInput v-model="softwareRuntimeConfigForm.guacamoleUsername" placeholder="默认账号" />
          <ScInput v-model="softwareRuntimeConfigForm.guacamolePassword" type="password" placeholder="默认密码" />
        </template>
        <template v-else-if="softwareConfigProfile === 'nginx'">
          <ScInput v-model="softwareRuntimeConfigForm.nginxPort" placeholder="Nginx 端口，如 80" />
          <ScInput v-model="softwareRuntimeConfigForm.nginxRoot" placeholder="root 目录，如 /usr/share/nginx/html" />
          <ScSelect v-model="softwareRuntimeConfigForm.enableAutostart" placeholder="开机自启">
            <ScOption :value="true" label="启用自启" />
            <ScOption :value="false" label="不启用自启" />
          </ScSelect>
        </template>
        <template v-else-if="softwareConfigProfile === 'redis'">
          <ScInput v-model="softwareRuntimeConfigForm.redisPort" placeholder="Redis 端口，如 6379" />
          <ScInput v-model="softwareRuntimeConfigForm.redisPassword" type="password" placeholder="访问密码，可为空" />
          <ScSelect v-model="softwareRuntimeConfigForm.redisAppendOnly" placeholder="AOF 持久化">
            <ScOption :value="true" label="开启 AOF" />
            <ScOption :value="false" label="关闭 AOF" />
          </ScSelect>
          <ScSelect v-model="softwareRuntimeConfigForm.enableAutostart" placeholder="开机自启">
            <ScOption :value="true" label="启用自启" />
            <ScOption :value="false" label="不启用自启" />
          </ScSelect>
        </template>
      </div>
      <div v-if="configDialogMode === 'software'" class="pcsp__config-grid pcsp__config-grid--scripts">
        <ScScriptEditor
          v-model="softwareConfigForm.installScript"
          label="安装脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑安装脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
        <ScScriptEditor
          v-model="softwareConfigForm.startScript"
          label="启动脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑启动脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
        <ScScriptEditor
          v-model="softwareConfigForm.stopScript"
          label="停止脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑停止脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
        <ScScriptEditor
          v-model="softwareConfigForm.restartScript"
          label="重启脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑重启脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
        <ScScriptEditor
          v-model="softwareConfigForm.statusScript"
          label="状态脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑状态脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
        <ScScriptEditor
          v-model="softwareConfigForm.uninstallScript"
          label="卸载脚本"
          language="shell"
          :title-visible="true"
          empty-text="点击编辑卸载脚本"
          :keyword-highlights="scriptKeywordHighlights"
        />
      </div>
      <div v-else-if="configDialogMode === 'project'" class="pcsp__config-grid pcsp__config-grid--project">
        <ScInput v-model="projectConfigForm.projectName" disabled placeholder="显示名称" />
        <ScInput v-model="projectConfigForm.projectDescription" disabled type="textarea" :rows="4" placeholder="描述" />
        <ScInput :model-value="String(projectConfigForm.projectId || '')" disabled placeholder="项目ID" />
        <ScInput :model-value="projectConfigForm.runtimeStatus || ''" disabled placeholder="运行状态" />
      </div>
      <div class="pcsp__config-grid pcsp__config-grid--orchestration">
        <ScSelect v-model="orchestrationConfigForm.required" placeholder="是否关键节点">
          <ScOption :value="true" label="关键节点" />
          <ScOption :value="false" label="可选节点" />
        </ScSelect>
        <ScInput v-model="orchestrationConfigForm.startDelaySec" placeholder="启动延迟秒数，如 0/5/10" />
        <ScSelect v-model="orchestrationConfigForm.failurePolicy" placeholder="失败策略">
          <ScOption value="stop" label="失败即中断" />
          <ScOption value="continue" label="失败后继续" />
        </ScSelect>
        <ScInput v-model="orchestrationConfigForm.healthCheckHint" placeholder="健康检查提示，如 curl http://127.0.0.1:8080/actuator/health" />
        <ScInput v-model="orchestrationConfigForm.beforeStartNote" type="textarea" :rows="3" placeholder="启动前置条件/说明" />
        <ScInput v-model="orchestrationConfigForm.afterStartNote" type="textarea" :rows="3" placeholder="启动后校验/说明" />
      </div>
      <template #footer>
        <ScButton @click="configDialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="configSaving" @click="saveCurrentConfig">保存</ScButton>
      </template>
    </ScDialog>

    <SoftwareInstallWizard
      v-model:visible="installWizardVisible"
      :software-profile="installWizardSoftwareProfile"
      :preset-data="installWizardPresetData"
      @complete="handleInstallWizardComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from "vue";
import type { EditorData } from "@repo/components/ScFlowEditor";
import { ScFlowEditor } from "@repo/components/ScFlowEditor";
import { resolveRuntimeProviders, tryUseOverlayStack } from "@layout/default";
import { IconifyIconOnline } from "@repo/components";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import type { TaskDialogModel } from "@repo/components/ScTaskMessageDialog/types";
import type { RemoteApi, RemoteProject } from "../../api/manage/remote";
import ScScriptEditor from "@repo/components/ScScriptEditor";
import SoftwareInstallWizard from "../../../../panel/src/components/ServicePanel/SoftwareInstallWizard.vue";
import {
  type ProjectContainerSoftwareTopologyStepRequest,
  type ProjectContainerSoftwareBinding,
  type ProjectContainerServiceTopology,
  type ProjectContainerSoftwareOperationTicket,
  type ProjectContainerSoftwarePreset,
  fetchDeleteProjectContainerSoftwareBinding,
  fetchImportProjectContainerSoftwarePreset,
  fetchOperateProjectContainerSoftwareBinding,
  fetchOperateProjectContainerSoftwareTopology,
  fetchProjectContainerSoftwareBindingList,
  fetchProjectContainerServiceTopologyDetail,
  fetchProjectContainerSoftwarePresetList,
  fetchSaveProjectContainerServiceTopology,
  fetchUpdateProjectContainerSoftwareBinding,
} from "../../api/manage/project-container-software";
import { useProjectContainerSoftwareStream } from "../../composables/useProjectContainerSoftwareStream";
import type { BaseNode } from "@repo/components/ScFlowEditor";

type ImportedProjectNode = Pick<
  RemoteProject,
  "projectId" | "projectName" | "projectDescription" | "runtimeStatus"
>;

type ExecutionPlanItem = {
  order: number;
  nodeId: string;
  label: string;
  kind: "software" | "project";
  dependsOn: string[];
  required: boolean;
  startDelaySec: number;
  failurePolicy: "stop" | "continue";
  healthCheckHint: string;
  beforeStartNote: string;
  afterStartNote: string;
};

type NodeOrchestrationConfig = {
  required: boolean;
  startDelaySec: number;
  failurePolicy: "stop" | "continue";
  healthCheckHint: string;
  beforeStartNote: string;
  afterStartNote: string;
};

type SoftwareConfigProfile = "" | "mysql8" | "guacamole" | "nginx" | "redis";
type NodeLogKind =
  | "runtime"
  | "realtime"
  | "install"
  | "uninstall"
  | "start"
  | "stop"
  | "restart"
  | "notice";

const scriptKeywordHighlights = [
  "sudo",
  "systemctl",
  "service",
  "apt-get",
  "yum",
  "dnf",
  "brew",
  "mysql",
  "redis",
  "nginx",
  "guacamole",
  "ERROR",
  "FAILED",
  "SUCCESS",
];

const props = defineProps<{
  projectId?: number | string | null;
  projectName?: string;
  serverSummary?: string;
  remoteApi?: RemoteApi | null;
}>();

const runtimeProviders = resolveRuntimeProviders({
  module: "project.container.software",
  socketName: "project-container-software",
});
const runtimeMessage = runtimeProviders.message.provider;
const runtimeTask = runtimeProviders.task.provider;
const overlayStack = tryUseOverlayStack();
const stream = useProjectContainerSoftwareStream(runtimeProviders.socket.provider);

const sysProjectId = computed(() => {
  const id = Number(props.projectId || 0);
  return Number.isInteger(id) && id > 0 ? id : 0;
});
const projectNameText = computed(
  () => props.projectName || `服务面板 · ${sysProjectId.value || "-"}`,
);
const projectIdText = computed(() => String(sysProjectId.value || "-"));
const serverSummary = computed(() => String(props.serverSummary || "").trim());

const presets = ref<ProjectContainerSoftwarePreset[]>([]);
const bindings = ref<ProjectContainerSoftwareBinding[]>([]);
const projectCandidates = ref<RemoteProject[]>([]);
const importedProjects = ref<ImportedProjectNode[]>([]);
type EditorNodeData = EditorData["nodes"];
type EditorEdgeData = EditorData["connections"];
type EditorNode = EditorNodeData[number];
type ServiceNodeDragKind = "software" | "project";

const SERVICE_NODE_DND_TYPE = "application/x-project-container-service-node";

const editorNodes = ref<EditorNodeData>([]);
const editorEdges = ref<EditorEdgeData>([]);
const executionPlan = ref<ExecutionPlanItem[]>([]);
const importingPresetId = ref<number | null>(null);
const loadingProjectCandidates = ref(false);
const topologyRunning = ref(false);
const topologyPersisting = ref(false);
const presetImportDialogVisible = ref(false);
const projectImportDialogVisible = ref(false);
const activeOverlayId = ref("");
const configDialogVisible = ref(false);
const configDialogMode = ref<"software" | "project">("software");
const configSaving = ref(false);
const configNodeId = ref("");
const installAfterConfig = ref(false);
const installWizardVisible = ref(false);
const installWizardSoftwareProfile = ref("");
const installWizardPresetData = ref<Record<string, any>>({});
const taskDialogVisible = ref(false);
const taskDialogModel = ref<TaskDialogModel | null>(null);
const selectedEditorNodeId = ref("");
const activePollingOperation = ref<{
  operationId: string;
  bindingId: number;
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL";
} | null>(null);
let pollingTimer: ReturnType<typeof setInterval> | null = null;
const softwareConfigRemarkText = ref("");
const softwareConfigForm = reactive<Partial<ProjectContainerSoftwareBinding>>({
  sysProjectContainerSoftwareBindingId: undefined,
  softwareName: "",
  softwareCode: "",
  softwareVersion: "",
  installPath: "",
  exposePorts: "",
  installScript: "",
  startScript: "",
  stopScript: "",
  restartScript: "",
  statusScript: "",
  uninstallScript: "",
  bindingRemark: "",
});
const softwareRuntimeConfigForm = reactive({
  mysqlPort: "3306",
  mysqlRootPassword: "root@123456",
  mysqlDataDir: "/var/lib/mysql",
  mysqlRemoteAccess: true,
  guacamolePort: "8080",
  guacamoleHome: "/etc/guacamole",
  guacamoleVersion: "1.5.5",
  guacamoleUsername: "guacadmin",
  guacamolePassword: "guacadmin",
  nginxPort: "80",
  nginxRoot: "/usr/share/nginx/html",
  redisPort: "6379",
  redisPassword: "",
  redisAppendOnly: true,
  enableAutostart: true,
});
const projectConfigForm = reactive<ImportedProjectNode>({
  projectId: undefined,
  projectName: "",
  projectDescription: "",
  runtimeStatus: "unknown",
});
const orchestrationConfigForm = reactive<NodeOrchestrationConfig>({
  required: true,
  startDelaySec: 0,
  failurePolicy: "stop",
  healthCheckHint: "",
  beforeStartNote: "",
  afterStartNote: "",
});
const nodeConfigMap = ref<Record<string, NodeOrchestrationConfig>>({});
const nodeLogMap = ref<Record<string, Record<NodeLogKind, string[]>>>({});
const selectedNodeLogTab = ref<NodeLogKind>("realtime");
const nodeLogTabs: Array<{ label: string; value: NodeLogKind }> = [
  { label: "实时", value: "realtime" },
  { label: "运行", value: "runtime" },
  { label: "安装", value: "install" },
  { label: "卸载", value: "uninstall" },
  { label: "启动", value: "start" },
  { label: "停止", value: "stop" },
  { label: "重启", value: "restart" },
  { label: "通知", value: "notice" },
];

const localLogLines = ref<string[]>([]);
const logText = computed(() => {
  const lines = [...localLogLines.value, ...stream.lines.value];
  return lines.join("\n") || "暂无实时日志";
});
const streamStatusText = computed(() => {
  if (stream.state.value.error) return stream.state.value.error;
  if (stream.state.value.connecting) return "连接中…";
  if (stream.latest.value?.message) return String(stream.latest.value.message);
  return "等待操作";
});
const configDialogTitle = computed(() =>
  configDialogMode.value === "software"
    ? `服务配置 · ${softwareConfigForm.softwareName || softwareConfigForm.softwareCode || "未命名服务"}`
    : `项目配置 · ${projectConfigForm.projectName || projectConfigForm.projectId || "未命名项目"}`,
);
const softwareConfigProfile = computed(() =>
  resolveSoftwareConfigProfile(
    softwareConfigForm.softwareCode,
    softwareConfigForm.softwareName,
    softwareConfigForm.softwareVersion,
  ),
);
const installablePresets = computed(() =>
  presets.value.filter((item) =>
    Boolean(resolveSoftwareConfigProfile(item.softwareCode, item.softwareName, item.softwareVersion)),
  ),
);
const selectedNodeLogText = computed(() => {
  const nodeId = selectedEditorNodeId.value;
  const lines = nodeLogMap.value[nodeId]?.[selectedNodeLogTab.value] || [];
  return lines.join("\n") || "暂无节点日志";
});
const storageKey = computed(
  () => `project-container-service-panel:${sysProjectId.value || "unknown"}`,
);

const createDefaultNodeConfig = (): NodeOrchestrationConfig => ({
  required: true,
  startDelaySec: 0,
  failurePolicy: "stop",
  healthCheckHint: "",
  beforeStartNote: "",
  afterStartNote: "",
});

const readNodeConfig = (nodeId: string): NodeOrchestrationConfig => ({
  ...createDefaultNodeConfig(),
  ...(nodeConfigMap.value[nodeId] || {}),
});

const writeNodeConfig = (nodeId: string, config: NodeOrchestrationConfig) => {
  nodeConfigMap.value = {
    ...nodeConfigMap.value,
    [nodeId]: {
      ...createDefaultNodeConfig(),
      ...config,
      startDelaySec: Number(config.startDelaySec || 0),
    },
  };
};

const appendLocalLog = (text: string) => {
  localLogLines.value.unshift(
    `[${new Date().toLocaleString()}] ${text}`,
  );
  localLogLines.value = localLogLines.value.slice(0, 200);
};

const resolveSoftwareConfigProfile = (
  code?: string,
  name?: string,
  version?: string,
): SoftwareConfigProfile => {
  const text = `${code || ""} ${name || ""}`.toLowerCase();
  const versionText = String(version || "").toLowerCase();
  if (text.includes("guacamole")) return "guacamole";
  if (text.includes("nginx")) return "nginx";
  if (text.includes("redis")) return "redis";
  if (text.includes("mysql") && (!versionText || versionText.startsWith("8"))) return "mysql8";
  return "";
};

const actionToNodeLogKind = (action?: string): NodeLogKind => {
  const normalized = String(action || "").toUpperCase();
  if (normalized.includes("INSTALL") && !normalized.includes("UNINSTALL")) return "install";
  if (normalized.includes("UNINSTALL")) return "uninstall";
  if (normalized.includes("START")) return "start";
  if (normalized.includes("STOP")) return "stop";
  if (normalized.includes("RESTART")) return "restart";
  if (normalized.includes("STATUS")) return "runtime";
  return "realtime";
};

const appendNodeLog = (nodeId: string, kind: NodeLogKind, text: string) => {
  if (!nodeId || !text) return;
  const current = nodeLogMap.value[nodeId] || {};
  const line = `[${new Date().toLocaleString()}] ${text}`;
  nodeLogMap.value = {
    ...nodeLogMap.value,
    [nodeId]: {
      ...current,
      realtime: [line, ...(current.realtime || [])].slice(0, 300),
      [kind]: [line, ...(current[kind] || [])].slice(0, 300),
    },
  };
};

const parseSoftwareConfigPayload = (remark?: string) => {
  try {
    const parsed = JSON.parse(String(remark || ""));
    if (parsed && typeof parsed === "object" && parsed.pcspSoftwareConfig) {
      return {
        config: parsed.pcspSoftwareConfig as Record<string, any>,
        note: String(parsed.note || ""),
      };
    }
  } catch {
    // plain remark
  }
  return {
    config: {},
    note: String(remark || ""),
  };
};

const applySoftwareRuntimeDefaults = (
  profile: SoftwareConfigProfile,
  binding: Partial<ProjectContainerSoftwareBinding>,
) => {
  const parsed = parseSoftwareConfigPayload(binding.bindingRemark);
  softwareConfigRemarkText.value = parsed.note;
  Object.assign(softwareRuntimeConfigForm, {
    mysqlPort: "3306",
    mysqlRootPassword: "root@123456",
    mysqlDataDir: binding.installPath || "/var/lib/mysql",
    mysqlRemoteAccess: true,
    guacamolePort: "8080",
    guacamoleHome: binding.installPath || "/etc/guacamole",
    guacamoleVersion: binding.softwareVersion || "1.5.5",
    guacamoleUsername: "guacadmin",
    guacamolePassword: "guacadmin",
    nginxPort: String(binding.exposePorts || "80").split(",")[0] || "80",
    nginxRoot: binding.installPath || "/usr/share/nginx/html",
    redisPort: String(binding.exposePorts || "6379").split(",")[0] || "6379",
    redisPassword: "",
    redisAppendOnly: true,
    enableAutostart: true,
    ...parsed.config,
  });
  if (profile === "mysql8") {
    softwareRuntimeConfigForm.mysqlDataDir = String(parsed.config.mysqlDataDir || binding.installPath || "/var/lib/mysql");
  }
};

const shellQuote = (value: unknown) =>
  `'${String(value ?? "").replace(/'/g, `'\\''`)}'`;

const sqlString = (value: unknown) =>
  `'${String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;

const xmlAttributeEscape = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const numericText = (value: unknown, fallback: string) => {
  const text = String(value ?? "").trim();
  return /^\d{1,5}$/.test(text) ? text : fallback;
};

const buildSoftwareRemark = (profile: SoftwareConfigProfile) =>
  JSON.stringify({
    pcspSoftwareConfig: { ...softwareRuntimeConfigForm },
    profile,
    note: softwareConfigRemarkText.value,
  });

const buildMysql8Scripts = () => {
  const port = numericText(softwareRuntimeConfigForm.mysqlPort, "3306");
  const dataDir = shellQuote(softwareRuntimeConfigForm.mysqlDataDir || "/var/lib/mysql");
  const rootPasswordText = softwareRuntimeConfigForm.mysqlRootPassword || "root@123456";
  const rootPassword = shellQuote(rootPasswordText);
  const rootPasswordSql = sqlString(rootPasswordText);
  const bindAddress = softwareRuntimeConfigForm.mysqlRemoteAccess ? "0.0.0.0" : "127.0.0.1";
  return {
    installPath: softwareRuntimeConfigForm.mysqlDataDir || "/var/lib/mysql",
    exposePorts: port,
    installScript: `#!/bin/bash
set -euo pipefail
MYSQL_PORT=${port}
MYSQL_DATA_DIR=${dataDir}
MYSQL_ROOT_PASSWORD=${rootPassword}
MYSQL_BIND_ADDRESS=${shellQuote(bindAddress)}
echo "[mysql8] installing mysql server"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
  MYSQL_SERVICE=mysql
  MYSQL_CONF=/etc/mysql/mysql.conf.d/mysqld.cnf
elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
  PM=$(command -v dnf >/dev/null 2>&1 && echo dnf || echo yum)
  sudo $PM install -y mysql-server || sudo $PM install -y community-mysql-server
  MYSQL_SERVICE=mysqld
  MYSQL_CONF=/etc/my.cnf
else
  echo "unsupported package manager"; exit 1
fi
sudo mkdir -p "$MYSQL_DATA_DIR"
sudo chown -R mysql:mysql "$MYSQL_DATA_DIR" || true
if [ -f "$MYSQL_CONF" ]; then
  sudo cp "$MYSQL_CONF" "$MYSQL_CONF.pcsp.bak.$(date +%Y%m%d%H%M%S)" || true
  sudo sed -i -E "s/^#?\\s*port\\s*=.*/port = $MYSQL_PORT/" "$MYSQL_CONF" || true
  sudo sed -i -E "s|^#?\\s*datadir\\s*=.*|datadir = $MYSQL_DATA_DIR|" "$MYSQL_CONF" || true
  sudo sed -i -E "s/^#?\\s*bind-address\\s*=.*/bind-address = $MYSQL_BIND_ADDRESS/" "$MYSQL_CONF" || true
fi
sudo systemctl enable "$MYSQL_SERVICE" || true
sudo systemctl restart "$MYSQL_SERVICE" || sudo service "$MYSQL_SERVICE" restart
sleep 2
sudo mysql -uroot <<SQL || mysql -uroot <<SQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ${rootPasswordSql};
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY ${rootPasswordSql};
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
SQL
MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin -uroot -P"$MYSQL_PORT" ping
echo "[mysql8] install finished"`,
    startScript: `#!/bin/bash
set -e
sudo systemctl start mysqld || sudo systemctl start mysql || sudo service mysqld start || sudo service mysql start`,
    stopScript: `#!/bin/bash
set -e
sudo systemctl stop mysqld || sudo systemctl stop mysql || sudo service mysqld stop || sudo service mysql stop`,
    restartScript: `#!/bin/bash
set -e
sudo systemctl restart mysqld || sudo systemctl restart mysql || sudo service mysqld restart || sudo service mysql restart`,
    statusScript: `#!/bin/bash
MYSQL_PWD=${rootPassword} mysqladmin -uroot -P${port} ping || sudo systemctl is-active mysqld || sudo systemctl is-active mysql`,
    uninstallScript: `#!/bin/bash
set -e
sudo systemctl stop mysqld || sudo systemctl stop mysql || true
if command -v apt-get >/dev/null 2>&1; then sudo apt-get remove -y mysql-server; elif command -v yum >/dev/null 2>&1; then sudo yum remove -y mysql-server community-mysql-server; elif command -v dnf >/dev/null 2>&1; then sudo dnf remove -y mysql-server community-mysql-server; fi
echo "[mysql8] uninstalled, data directory kept: ${softwareRuntimeConfigForm.mysqlDataDir || "/var/lib/mysql"}"`,
  };
};

const buildNginxScripts = () => {
  const port = numericText(softwareRuntimeConfigForm.nginxPort, "80");
  const root = softwareRuntimeConfigForm.nginxRoot || "/usr/share/nginx/html";
  const autostart = softwareRuntimeConfigForm.enableAutostart;
  return {
    installPath: root,
    exposePorts: port,
    installScript: `#!/bin/bash
set -euo pipefail
NGINX_PORT=${port}
NGINX_ROOT=${shellQuote(root)}
echo "[nginx] installing"
if command -v apt-get >/dev/null 2>&1; then sudo apt-get update && sudo apt-get install -y nginx; elif command -v yum >/dev/null 2>&1; then sudo yum install -y epel-release || true; sudo yum install -y nginx; elif command -v dnf >/dev/null 2>&1; then sudo dnf install -y nginx; else echo "unsupported package manager"; exit 1; fi
sudo mkdir -p "$NGINX_ROOT"
echo "ok" | sudo tee "$NGINX_ROOT/index.html" >/dev/null
sudo tee /etc/nginx/conf.d/pcsp-default.conf >/dev/null <<EOF
server {
    listen $NGINX_PORT;
    server_name _;
    root $NGINX_ROOT;
    index index.html index.htm;
    location / { try_files \\$uri \\$uri/ =404; }
}
EOF
sudo nginx -t
${autostart ? "sudo systemctl enable nginx || true" : "sudo systemctl disable nginx || true"}
sudo systemctl restart nginx || sudo service nginx restart
echo "[nginx] install finished"`,
    startScript: `#!/bin/bash
set -e
sudo systemctl start nginx || sudo service nginx start`,
    stopScript: `#!/bin/bash
set -e
sudo systemctl stop nginx || sudo service nginx stop`,
    restartScript: `#!/bin/bash
set -e
sudo nginx -t && (sudo systemctl restart nginx || sudo service nginx restart)`,
    statusScript: `#!/bin/bash
sudo systemctl is-active nginx || sudo service nginx status || ps -ef | grep nginx | grep -v grep`,
    uninstallScript: `#!/bin/bash
set -e
sudo systemctl stop nginx || sudo service nginx stop || true
if command -v apt-get >/dev/null 2>&1; then sudo apt-get remove -y nginx; elif command -v yum >/dev/null 2>&1; then sudo yum remove -y nginx; elif command -v dnf >/dev/null 2>&1; then sudo dnf remove -y nginx; fi`,
  };
};

const buildRedisScripts = () => {
  const port = numericText(softwareRuntimeConfigForm.redisPort, "6379");
  const password = String(softwareRuntimeConfigForm.redisPassword || "");
  const appendOnly = softwareRuntimeConfigForm.redisAppendOnly ? "yes" : "no";
  const autostart = softwareRuntimeConfigForm.enableAutostart;
  return {
    installPath: "/etc/redis",
    exposePorts: port,
    installScript: `#!/bin/bash
set -euo pipefail
REDIS_PORT=${port}
REDIS_PASSWORD=${shellQuote(password)}
REDIS_APPENDONLY=${appendOnly}
echo "[redis] installing"
if command -v apt-get >/dev/null 2>&1; then sudo apt-get update && sudo apt-get install -y redis-server; REDIS_CONF=/etc/redis/redis.conf; REDIS_SERVICE=redis-server; elif command -v yum >/dev/null 2>&1; then sudo yum install -y epel-release || true; sudo yum install -y redis; REDIS_CONF=/etc/redis.conf; REDIS_SERVICE=redis; elif command -v dnf >/dev/null 2>&1; then sudo dnf install -y redis; REDIS_CONF=/etc/redis.conf; REDIS_SERVICE=redis; else echo "unsupported package manager"; exit 1; fi
sudo cp "$REDIS_CONF" "$REDIS_CONF.pcsp.bak.$(date +%Y%m%d%H%M%S)" || true
sudo sed -i -E "s/^#?\\s*port\\s+.*/port $REDIS_PORT/" "$REDIS_CONF" || true
sudo sed -i -E "s/^#?\\s*appendonly\\s+.*/appendonly $REDIS_APPENDONLY/" "$REDIS_CONF" || true
if [ -n "$REDIS_PASSWORD" ]; then
  if grep -q "^#*\\s*requirepass" "$REDIS_CONF"; then sudo sed -i -E "s/^#?\\s*requirepass\\s+.*/requirepass $REDIS_PASSWORD/" "$REDIS_CONF"; else echo "requirepass $REDIS_PASSWORD" | sudo tee -a "$REDIS_CONF" >/dev/null; fi
fi
${autostart ? "sudo systemctl enable \"$REDIS_SERVICE\" || true" : "sudo systemctl disable \"$REDIS_SERVICE\" || true"}
sudo systemctl restart "$REDIS_SERVICE" || sudo service "$REDIS_SERVICE" restart
if [ -n "$REDIS_PASSWORD" ]; then
  REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -p "$REDIS_PORT" ping
else
  redis-cli -p "$REDIS_PORT" ping
fi
echo "[redis] install finished"`,
    startScript: `#!/bin/bash
set -e
sudo systemctl start redis || sudo systemctl start redis-server || sudo service redis start || sudo service redis-server start`,
    stopScript: `#!/bin/bash
set -e
sudo systemctl stop redis || sudo systemctl stop redis-server || sudo service redis stop || sudo service redis-server stop`,
    restartScript: `#!/bin/bash
set -e
sudo systemctl restart redis || sudo systemctl restart redis-server || sudo service redis restart || sudo service redis-server restart`,
    statusScript: `#!/bin/bash
REDIS_PASSWORD=${shellQuote(password)}
if [ -n "$REDIS_PASSWORD" ]; then
  REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -p ${port} ping
else
  redis-cli -p ${port} ping
fi || sudo systemctl is-active redis || sudo systemctl is-active redis-server`,
    uninstallScript: `#!/bin/bash
set -e
sudo systemctl stop redis || sudo systemctl stop redis-server || true
if command -v apt-get >/dev/null 2>&1; then sudo apt-get remove -y redis-server; elif command -v yum >/dev/null 2>&1; then sudo yum remove -y redis; elif command -v dnf >/dev/null 2>&1; then sudo dnf remove -y redis; fi`,
  };
};

const buildGuacamoleScripts = () => {
  const port = numericText(softwareRuntimeConfigForm.guacamolePort, "8080");
  const home = softwareRuntimeConfigForm.guacamoleHome || "/etc/guacamole";
  const version = softwareRuntimeConfigForm.guacamoleVersion || "1.5.5";
  const username = softwareRuntimeConfigForm.guacamoleUsername || "guacadmin";
  const password = softwareRuntimeConfigForm.guacamolePassword || "guacadmin";
  const usernameXml = xmlAttributeEscape(username);
  const passwordXml = xmlAttributeEscape(password);
  return {
    installPath: home,
    exposePorts: port,
    installScript: `#!/bin/bash
set -euo pipefail
GUAC_VERSION=${shellQuote(version)}
GUAC_HOME=${shellQuote(home)}
GUAC_PORT=${port}
GUAC_USER=${shellQuote(username)}
GUAC_PASSWORD=${shellQuote(password)}
GUAC_USER_XML=${shellQuote(usernameXml)}
GUAC_PASSWORD_XML=${shellQuote(passwordXml)}
echo "[guacamole] installing"
if command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y tomcat9 guacd libguacamole-client-rdp0 libguacamole-client-vnc0 libguacamole-client-ssh0 wget xmlstarlet || sudo apt-get install -y tomcat9 guacd wget
  TOMCAT_SERVICE=tomcat9
  TOMCAT_WEBAPPS=/var/lib/tomcat9/webapps
elif command -v yum >/dev/null 2>&1 || command -v dnf >/dev/null 2>&1; then
  PM=$(command -v dnf >/dev/null 2>&1 && echo dnf || echo yum)
  sudo $PM install -y epel-release || true
  sudo $PM install -y tomcat guacd wget || sudo $PM install -y tomcat wget
  TOMCAT_SERVICE=tomcat
  TOMCAT_WEBAPPS=/var/lib/tomcat/webapps
else
  echo "unsupported package manager"; exit 1
fi
sudo mkdir -p "$GUAC_HOME" "$TOMCAT_WEBAPPS"
sudo wget -q -O "$TOMCAT_WEBAPPS/guacamole.war" "https://archive.apache.org/dist/guacamole/$GUAC_VERSION/binary/guacamole-$GUAC_VERSION.war"
sudo tee "$GUAC_HOME/guacamole.properties" >/dev/null <<EOF
guacd-hostname: localhost
guacd-port: 4822
EOF
sudo tee "$GUAC_HOME/user-mapping.xml" >/dev/null <<EOF
<user-mapping>
  <authorize username="$GUAC_USER_XML" password="$GUAC_PASSWORD_XML">
  </authorize>
</user-mapping>
EOF
sudo mkdir -p /usr/share/tomcat9 /var/lib/tomcat9 /usr/share/tomcat /var/lib/tomcat
sudo ln -sfn "$GUAC_HOME" /usr/share/tomcat9/.guacamole || true
sudo ln -sfn "$GUAC_HOME" /var/lib/tomcat9/.guacamole || true
sudo ln -sfn "$GUAC_HOME" /usr/share/tomcat/.guacamole || true
sudo ln -sfn "$GUAC_HOME" /var/lib/tomcat/.guacamole || true
sudo systemctl enable guacd || true
sudo systemctl enable "$TOMCAT_SERVICE" || true
sudo systemctl restart guacd || sudo service guacd restart || true
sudo systemctl restart "$TOMCAT_SERVICE" || sudo service "$TOMCAT_SERVICE" restart
echo "[guacamole] install finished: http://host:$GUAC_PORT/guacamole"`,
    startScript: `#!/bin/bash
set -e
sudo systemctl start guacd || sudo service guacd start || true
sudo systemctl start tomcat9 || sudo systemctl start tomcat || sudo service tomcat9 start || sudo service tomcat start`,
    stopScript: `#!/bin/bash
set -e
sudo systemctl stop tomcat9 || sudo systemctl stop tomcat || sudo service tomcat9 stop || sudo service tomcat stop
sudo systemctl stop guacd || sudo service guacd stop || true`,
    restartScript: `#!/bin/bash
set -e
sudo systemctl restart guacd || sudo service guacd restart || true
sudo systemctl restart tomcat9 || sudo systemctl restart tomcat || sudo service tomcat9 restart || sudo service tomcat restart`,
    statusScript: `#!/bin/bash
(sudo systemctl is-active guacd || true) && (sudo systemctl is-active tomcat9 || sudo systemctl is-active tomcat || ps -ef | grep '[t]omcat')`,
    uninstallScript: `#!/bin/bash
set -e
sudo systemctl stop tomcat9 || sudo systemctl stop tomcat || true
sudo systemctl stop guacd || true
sudo rm -f /var/lib/tomcat9/webapps/guacamole.war /var/lib/tomcat/webapps/guacamole.war
echo "[guacamole] webapp removed, config kept: ${home}"`,
  };
};

const buildConfiguredSoftwarePatch = (profile: SoftwareConfigProfile) => {
  if (profile === "mysql8") return buildMysql8Scripts();
  if (profile === "guacamole") return buildGuacamoleScripts();
  if (profile === "nginx") return buildNginxScripts();
  if (profile === "redis") return buildRedisScripts();
  return {};
};

const resolveBindingNodeId = (item: ProjectContainerSoftwareBinding) =>
  `software-${item.sysProjectContainerSoftwareBindingId}`;
const resolveProjectNodeId = (projectId?: number) => `project-${projectId}`;

const showInstallAction = (item: ProjectContainerSoftwareBinding) =>
  String(item.installStatus || "").toUpperCase() !== "SUCCESS";
const showStartAction = (item: ProjectContainerSoftwareBinding) =>
  String(item.runtimeStatus || "").toUpperCase() !== "RUNNING";
const showStopAction = (item: ProjectContainerSoftwareBinding) =>
  String(item.runtimeStatus || "").toUpperCase() === "RUNNING";
const showRestartAction = (item: ProjectContainerSoftwareBinding) =>
  String(item.installStatus || "").toUpperCase() === "SUCCESS" ||
  String(item.runtimeStatus || "").toUpperCase() === "RUNNING";

const resolveRuntimeTagType = (status?: string) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "RUNNING") return "success";
  if (normalized === "STOPPED") return "info";
  if (normalized === "ERROR" || normalized === "FAILED") return "danger";
  return "warning";
};
const resolveProjectRuntimeTagType = (status?: string) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "running") return "success";
  if (normalized === "stopped") return "info";
  if (normalized === "error") return "danger";
  return "warning";
};

const findBindingByNodeId = (nodeId: string) =>
  bindings.value.find(
    (item) => resolveBindingNodeId(item) === nodeId,
  );
const findImportedProjectByNodeId = (nodeId: string) =>
  importedProjects.value.find(
    (item) => resolveProjectNodeId(item.projectId) === nodeId,
  );
const isProjectNodeId = (nodeId?: string) =>
  String(nodeId || "").startsWith("project-");
const resolveNodeLabel = (nodeId?: string) =>
  editorNodes.value.find((item) => item.id === String(nodeId || ""))?.label || "";
const resolveNodeKindText = (nodeId?: string) =>
  isProjectNodeId(nodeId) ? "项目节点" : "软件节点";

const reloadPresets = async () => {
  const res = await fetchProjectContainerSoftwarePresetList({
    presetStatus: 1,
    presetDelete: 0,
  });
  if (res.code === "00000") {
    presets.value = res.data || [];
  }
};

const reloadBindings = async () => {
  if (!sysProjectId.value) return;
  const res = await fetchProjectContainerSoftwareBindingList(sysProjectId.value);
  if (res.code === "00000") {
    bindings.value = res.data || [];
  }
};

const loadProjectCandidates = async () => {
  if (!props.remoteApi) {
    return;
  }
  loadingProjectCandidates.value = true;
  try {
    const res = await props.remoteApi.listProjects();
    if (res.code === "00000") {
      projectCandidates.value = (res.data || []).filter(
        (item) => String(item.projectId || "") !== String(sysProjectId.value || ""),
      );
    }
  } finally {
    loadingProjectCandidates.value = false;
  }
};

const reloadAll = async () => {
  await Promise.all([reloadPresets(), reloadBindings()]);
};

const applyTopologyPayload = (topology?: ProjectContainerServiceTopology | null) => {
  if (!topology) {
    return;
  }
  try {
    editorNodes.value = topology.editorNodesJson ? JSON.parse(topology.editorNodesJson) : [];
    editorEdges.value = topology.editorEdgesJson ? JSON.parse(topology.editorEdgesJson) : [];
    importedProjects.value = topology.importedProjectsJson ? JSON.parse(topology.importedProjectsJson) : [];
    nodeConfigMap.value = topology.nodeConfigJson ? JSON.parse(topology.nodeConfigJson) : {};
  } catch {
    // keep current in-memory state if persisted json is broken
  }
};

const loadTopologyFromBackend = async () => {
  if (!sysProjectId.value) {
    return;
  }
  topologyPersisting.value = true;
  try {
    const res = await fetchProjectContainerServiceTopologyDetail(sysProjectId.value);
    if (res.code !== "00000") {
      runtimeMessage.error(res.message || "加载编排失败");
      return;
    }
    if (!res.data) {
      runtimeMessage.warning("当前项目暂无已保存编排");
      return;
    }
    applyTopologyPayload(res.data);
    rebuildExecutionPlan();
    persistLocalState();
    runtimeMessage.success("已加载服务编排");
  } finally {
    topologyPersisting.value = false;
  }
};

const persistTopologyToBackend = async (options?: { silent?: boolean }) => {
  if (!sysProjectId.value) {
    return;
  }
  if (!options?.silent) {
    topologyPersisting.value = true;
  }
  try {
    const res = await fetchSaveProjectContainerServiceTopology({
      sysProjectId: sysProjectId.value,
      topologyName: projectNameText.value,
      editorNodesJson: JSON.stringify(editorNodes.value),
      editorEdgesJson: JSON.stringify(editorEdges.value),
      importedProjectsJson: JSON.stringify(importedProjects.value),
      nodeConfigJson: JSON.stringify(nodeConfigMap.value),
      topologyStatus: 1,
      topologyDelete: 0,
      topologyRemark: `服务面板编排 - ${projectNameText.value}`,
    });
    if (res.code !== "00000") {
      if (!options?.silent) {
        runtimeMessage.error(res.message || "保存编排失败");
      }
      return;
    }
    if (!options?.silent) {
      runtimeMessage.success("服务编排已保存");
    }
  } finally {
    if (!options?.silent) {
      topologyPersisting.value = false;
    }
  }
};

const saveTopologyToBackend = async () => persistTopologyToBackend();

const loadLocalState = () => {
  try {
    const raw = localStorage.getItem(storageKey.value);
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      importedProjects?: ImportedProjectNode[];
      editorData?: EditorData;
      editorEdges?: EditorEdgeData;
      editorNodes?: EditorNodeData;
      nodeConfigMap?: Record<string, NodeOrchestrationConfig>;
    };
    importedProjects.value = parsed.importedProjects || [];
    nodeConfigMap.value = parsed.nodeConfigMap || {};
    if (parsed.editorNodes || parsed.editorEdges) {
      editorNodes.value = parsed.editorNodes || [];
      editorEdges.value = parsed.editorEdges || [];
    } else {
      editorNodes.value = parsed.editorData?.nodes || [];
      editorEdges.value = parsed.editorData?.connections || [];
    }
  } catch {
    importedProjects.value = [];
    nodeConfigMap.value = {};
    editorNodes.value = [];
    editorEdges.value = [];
  }
};

const persistLocalState = () => {
  localStorage.setItem(
    storageKey.value,
    JSON.stringify({
      importedProjects: importedProjects.value,
      editorData: {
        nodes: editorNodes.value,
        connections: editorEdges.value,
      },
      editorNodes: editorNodes.value,
      editorEdges: editorEdges.value,
      nodeConfigMap: nodeConfigMap.value,
    }),
  );
};

const createSoftwareEditorNode = (
  item: ProjectContainerSoftwareBinding,
  index: number,
  position?: EditorNode["position"],
): EditorNode => {
  const id = resolveBindingNodeId(item);
  return {
    id,
    type: "process",
    label: item.softwareName || item.softwareCode || `软件-${index + 1}`,
    position: position || { x: 80, y: 80 + index * 120 },
    controls: {
      kind: "software",
      bindingId: item.sysProjectContainerSoftwareBindingId,
      runtimeStatus: item.runtimeStatus,
      installStatus: item.installStatus,
      ...readNodeConfig(id),
    },
  };
};

const createProjectEditorNode = (
  item: ImportedProjectNode,
  index: number,
  position?: EditorNode["position"],
): EditorNode => {
  const id = resolveProjectNodeId(item.projectId);
  return {
    id,
    type: "input",
    label: item.projectName || `项目-${item.projectId}`,
    position: position || { x: 460, y: 80 + index * 120 },
    controls: {
      kind: "project",
      projectId: item.projectId,
      runtimeStatus: item.runtimeStatus,
      ...readNodeConfig(id),
    },
  };
};

const syncEditorDataFromServices = () => {
  const existingMap = new Map(editorNodes.value.map((node) => [node.id, node]));
  const nextNodes = [
    ...bindings.value.map((item, index) => {
      const id = resolveBindingNodeId(item);
      const existing = existingMap.get(id);
      return createSoftwareEditorNode(item, index, existing?.position);
    }),
    ...importedProjects.value.map((item, index) => {
      const id = resolveProjectNodeId(item.projectId);
      const existing = existingMap.get(id);
      return createProjectEditorNode(item, index, existing?.position);
    }),
  ];
  const validIds = new Set(nextNodes.map((item) => item.id));
  const nextConnections = editorEdges.value.filter(
    (item) =>
      validIds.has(String((item as any).sourceId || (item as any).source || "")) &&
      validIds.has(String((item as any).targetId || (item as any).target || "")),
  );
  editorNodes.value = nextNodes;
  editorEdges.value = nextConnections;
  rebuildExecutionPlan();
};

const rebuildExecutionPlan = () => {
  const nodes = editorNodes.value;
  const connections = editorEdges.value;
  if (!nodes.length) {
    executionPlan.value = [];
    return;
  }
  const indegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const labelMap = new Map<string, string>();
  const kindMap = new Map<string, "software" | "project">();
  nodes.forEach((node) => {
    indegree.set(node.id, 0);
    adjacency.set(node.id, []);
    labelMap.set(node.id, node.label);
    kindMap.set(
      node.id,
      node.id.startsWith("project-") ? "project" : "software",
    );
  });
  connections.forEach((connection) => {
    const source = String((connection as any).source || (connection as any).sourceId || "");
    const target = String((connection as any).target || (connection as any).targetId || "");
    if (!source || !target || !adjacency.has(source) || !indegree.has(target)) {
      return;
    }
    adjacency.get(source)?.push(target);
    indegree.set(target, Number(indegree.get(target) || 0) + 1);
  });
  const queue = [...[...indegree.entries()].filter(([, value]) => value === 0).map(([id]) => id)];
  const nextPlan: ExecutionPlanItem[] = [];
  let order = 1;
  while (queue.length) {
    const current = queue.shift()!;
    const dependsOn = connections
      .filter((item) => String((item as any).target || (item as any).targetId || "") === current)
      .map((item) => {
        const sourceId = String((item as any).source || (item as any).sourceId || "");
        return labelMap.get(sourceId) || sourceId;
      });
    nextPlan.push({
      order,
      nodeId: current,
      label: labelMap.get(current) || current,
      kind: kindMap.get(current) || "software",
      dependsOn,
      ...readNodeConfig(current),
    });
    order += 1;
    for (const target of adjacency.get(current) || []) {
      indegree.set(target, Number(indegree.get(target) || 1) - 1);
      if (Number(indegree.get(target) || 0) === 0) {
        queue.push(target);
      }
    }
  }
  if (nextPlan.length !== nodes.length) {
    executionPlan.value = nodes.map((node, index) => ({
      order: index + 1,
      nodeId: node.id,
      label: node.label,
      kind: node.id.startsWith("project-") ? "project" : "software",
      dependsOn: [],
      ...readNodeConfig(node.id),
    }));
    return;
  }
  executionPlan.value = nextPlan;
};

const handleEditorDataChanged = (data: EditorData) => {
  editorNodes.value = data.nodes;
  editorEdges.value = data.connections;
  persistLocalState();
  rebuildExecutionPlan();
};

const handleEditorNodeSelected = (node: BaseNode | null) => {
  selectedEditorNodeId.value = String(node?.id || "");
};

const handleEditorNodesChanged = (nodes: EditorNodeData) => {
  editorNodes.value = nodes;
  persistLocalState();
  rebuildExecutionPlan();
};

const handleEditorEdgesChanged = (edges: EditorEdgeData) => {
  editorEdges.value = edges;
  persistLocalState();
  rebuildExecutionPlan();
};

const focusNode = (nodeId: string) => {
  const exists = editorNodes.value.some((item) => item.id === nodeId);
  selectedEditorNodeId.value = nodeId;
  if (!exists) {
    syncEditorDataFromServices();
  }
};

const handleServiceNodeDragStart = (
  event: DragEvent,
  kind: ServiceNodeDragKind,
  nodeId: string,
) => {
  if (!nodeId || !event.dataTransfer) {
    return;
  }
  event.dataTransfer.effectAllowed = "copyMove";
  event.dataTransfer.setData(
    SERVICE_NODE_DND_TYPE,
    JSON.stringify({ kind, nodeId }),
  );
};

const resolveDraggedEditorNode = (
  kind: ServiceNodeDragKind,
  nodeId: string,
  position: EditorNode["position"],
): EditorNode | null => {
  if (kind === "software") {
    const index = bindings.value.findIndex(
      (item) => resolveBindingNodeId(item) === nodeId,
    );
    const binding = index >= 0 ? bindings.value[index] : null;
    return binding ? createSoftwareEditorNode(binding, index, position) : null;
  }
  const index = importedProjects.value.findIndex(
    (item) => resolveProjectNodeId(item.projectId) === nodeId,
  );
  const project = index >= 0 ? importedProjects.value[index] : null;
  return project ? createProjectEditorNode(project, index, position) : null;
};

const handleEditorDrop = (event: DragEvent) => {
  const raw = event.dataTransfer?.getData(SERVICE_NODE_DND_TYPE);
  if (!raw) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const position = {
    x: Math.max(24, Math.round(event.clientX - rect.left - 110)),
    y: Math.max(24, Math.round(event.clientY - rect.top - 48)),
  };
  try {
    const payload = JSON.parse(raw) as {
      kind?: ServiceNodeDragKind;
      nodeId?: string;
    };
    if (!payload.kind || !payload.nodeId) {
      return;
    }
    const draggedNode = resolveDraggedEditorNode(
      payload.kind,
      payload.nodeId,
      position,
    );
    if (!draggedNode) {
      return;
    }
    const exists = editorNodes.value.some((node) => node.id === draggedNode.id);
    editorNodes.value = exists
      ? editorNodes.value.map((node) =>
          node.id === draggedNode.id
            ? { ...draggedNode, controls: { ...node.controls, ...draggedNode.controls } }
            : node,
        )
      : [...editorNodes.value, draggedNode];
    selectedEditorNodeId.value = draggedNode.id;
    persistLocalState();
    rebuildExecutionPlan();
  } catch {
    // ignore malformed drag payload
  }
};

const updateSelectedNodeLabel = (nodeId: string | undefined, label: string) => {
  const id = String(nodeId || "");
  if (!id) return;
  if (isProjectNodeId(id)) {
    runtimeMessage.warning("导入项目不允许编辑名称");
    return;
  }
  editorNodes.value = editorNodes.value.map((item) =>
    item.id === id
      ? {
          ...item,
          label,
        }
      : item,
  );
  persistLocalState();
  rebuildExecutionPlan();
};

const updateNodeConfigField = <K extends keyof NodeOrchestrationConfig>(
  nodeId: string,
  key: K,
  value: NodeOrchestrationConfig[K],
) => {
  if (!nodeId) return;
  const next = {
    ...readNodeConfig(nodeId),
    [key]: value,
  };
  writeNodeConfig(nodeId, next);
  persistLocalState();
  syncEditorDataFromServices();
};

const openProjectImportDialog = async () => {
  projectImportDialogVisible.value = true;
  if (!projectCandidates.value.length && !loadingProjectCandidates.value) {
    await loadProjectCandidates();
  }
};

const openPresetImportDialog = async () => {
  presetImportDialogVisible.value = true;
  if (!presets.value.length) {
    await reloadPresets();
  }
};

const handleImportProject = async (project: RemoteProject) => {
  if (!project.projectId) return;
  if (importedProjects.value.some((item) => String(item.projectId || "") === String(project.projectId || ""))) {
    runtimeMessage.warning("该项目已导入");
    return;
  }
  importedProjects.value = [
    ...importedProjects.value,
    {
      projectId: project.projectId,
      projectName: project.projectName,
      projectDescription: project.projectDescription,
      runtimeStatus: project.runtimeStatus,
    },
  ];
  syncEditorDataFromServices();
  persistLocalState();
  await persistTopologyToBackend({ silent: true });
  runtimeMessage.success("项目已导入服务面板");
};

const openSoftwareConfig = (
  item: ProjectContainerSoftwareBinding,
  options?: { installAfterSave?: boolean },
) => {
  configDialogMode.value = "software";
  configNodeId.value = resolveBindingNodeId(item);
  installAfterConfig.value = Boolean(options?.installAfterSave);
  const profile = resolveSoftwareConfigProfile(
    item.softwareCode,
    item.softwareName,
    item.softwareVersion,
  );
  Object.assign(softwareConfigForm, {
    sysProjectContainerSoftwareBindingId: item.sysProjectContainerSoftwareBindingId,
    softwareName: item.softwareName || "",
    softwareCode: item.softwareCode || "",
    softwareVersion: item.softwareVersion || "",
    installPath: item.installPath || "",
    exposePorts: item.exposePorts || "",
    installScript: item.installScript || "",
    startScript: item.startScript || "",
    stopScript: item.stopScript || "",
    restartScript: item.restartScript || "",
    statusScript: item.statusScript || "",
    uninstallScript: item.uninstallScript || "",
    bindingRemark: item.bindingRemark || "",
  });
  applySoftwareRuntimeDefaults(profile, item);
  Object.assign(orchestrationConfigForm, readNodeConfig(configNodeId.value));
  configDialogVisible.value = true;
};

const openImportedProjectConfig = (item: ImportedProjectNode) => {
  configDialogMode.value = "project";
  configNodeId.value = resolveProjectNodeId(item.projectId);
  installAfterConfig.value = false;
  Object.assign(projectConfigForm, {
    projectId: item.projectId,
    projectName: item.projectName || "",
    projectDescription: item.projectDescription || "",
    runtimeStatus: item.runtimeStatus || "unknown",
  });
  Object.assign(orchestrationConfigForm, readNodeConfig(configNodeId.value));
  configDialogVisible.value = true;
};

const handleConfigDialogClosed = () => {
  if (!configSaving.value) {
    installAfterConfig.value = false;
  }
};

const handleInstallWizardComplete = async (data: any) => {
  runtimeMessage.success("软件配置已完成，请点击安装");
};

const handleRemoveImportedProject = async (projectId?: number) => {
  const nodeId = resolveProjectNodeId(projectId);
  importedProjects.value = importedProjects.value.filter(
    (item) => String(item.projectId || "") !== String(projectId || ""),
  );
  editorNodes.value = editorNodes.value.filter((item) => item.id !== nodeId);
  editorEdges.value = editorEdges.value.filter((item) => {
    const source = String((item as any).source || (item as any).sourceId || "");
    const target = String((item as any).target || (item as any).targetId || "");
    return source !== nodeId && target !== nodeId;
  });
  const nextConfig = { ...nodeConfigMap.value };
  delete nextConfig[nodeId];
  nodeConfigMap.value = nextConfig;
  const nextLogs = { ...nodeLogMap.value };
  delete nextLogs[nodeId];
  nodeLogMap.value = nextLogs;
  syncEditorDataFromServices();
  persistLocalState();
  await persistTopologyToBackend({ silent: true });
  runtimeMessage.success("已移除导入项目");
};

const saveCurrentConfig = async () => {
  configSaving.value = true;
  try {
    if (configDialogMode.value === "software") {
      if (!softwareConfigForm.sysProjectContainerSoftwareBindingId) {
        runtimeMessage.error("缺少服务绑定ID");
        return;
      }
      const profile = softwareConfigProfile.value;
      const softwarePatch = buildConfiguredSoftwarePatch(profile);
      const res = await fetchUpdateProjectContainerSoftwareBinding({
        ...softwareConfigForm,
        ...softwarePatch,
        bindingRemark: profile ? buildSoftwareRemark(profile) : softwareConfigRemarkText.value,
      });
      if (res.code !== "00000") {
        runtimeMessage.error(res.message || "服务配置保存失败");
        return;
      }
      runtimeMessage.success("服务配置已保存");
      if (configNodeId.value) {
        writeNodeConfig(configNodeId.value, { ...orchestrationConfigForm });
      }
      await reloadBindings();
      syncEditorDataFromServices();
      persistLocalState();
      configDialogVisible.value = false;
      if (installAfterConfig.value) {
        installAfterConfig.value = false;
        const binding = bindings.value.find(
          (item) =>
            Number(item.sysProjectContainerSoftwareBindingId || 0) ===
            Number(softwareConfigForm.sysProjectContainerSoftwareBindingId || 0),
        );
        if (binding) {
          await submitSoftwareOperation(binding, "INSTALL");
        }
      }
      return;
    }
    if (configNodeId.value) {
      writeNodeConfig(configNodeId.value, { ...orchestrationConfigForm });
    }
    runtimeMessage.success("项目编排参数已保存");
    syncEditorDataFromServices();
    persistLocalState();
    configDialogVisible.value = false;
  } finally {
    configSaving.value = false;
  }
};

const refreshImportedProjectStatus = async (item: ImportedProjectNode) => {
  if (!item.projectId) return;
  if (!props.remoteApi) return;
  appendNodeLog(resolveProjectNodeId(item.projectId), "runtime", "刷新项目运行状态");
  const res = await props.remoteApi.listProjects();
  if (res.code !== "00000") return;
  const latest = (res.data || []).find(
    (project) => String(project.projectId || "") === String(item.projectId || ""),
  );
  if (!latest) return;
  importedProjects.value = importedProjects.value.map((current) =>
    String(current.projectId || "") === String(item.projectId || "")
      ? {
          ...current,
          runtimeStatus: latest.runtimeStatus,
        }
      : current,
  );
  syncEditorDataFromServices();
  persistLocalState();
};

const handleImportedProjectAction = async (
  item: ImportedProjectNode,
  action: "start" | "stop" | "restart",
) => {
  if (!item.projectId) return;
  if (!props.remoteApi) return;
  const nodeId = resolveProjectNodeId(item.projectId);
  appendNodeLog(nodeId, actionToNodeLogKind(action), `提交项目${action}操作`);
  const projectId = String(item.projectId);
  const res =
    action === "start"
      ? await props.remoteApi.startProject(projectId)
      : action === "stop"
        ? await props.remoteApi.stopProject(projectId)
        : await props.remoteApi.restartProject(projectId);
  if (res.code === "00000") {
    runtimeMessage.success((res as any).data?.message || "操作成功");
    appendNodeLog(nodeId, actionToNodeLogKind(action), (res as any).data?.message || "操作成功");
    importedProjects.value = importedProjects.value.map((current) =>
      String(current.projectId || "") === String(item.projectId || "")
        ? {
            ...current,
            runtimeStatus:
              action === "stop"
                ? "stopped"
                : "running",
          }
        : current,
    );
    syncEditorDataFromServices();
    persistLocalState();
  } else {
    runtimeMessage.error(res.message || "操作失败");
    appendNodeLog(nodeId, "notice", res.message || "操作失败");
  }
};

const buildOverlayId = (ticket: ProjectContainerSoftwareOperationTicket) =>
  `project-container-software:${ticket.operationId}`;

const refreshTaskDialog = () => {
  if (!taskDialogModel.value) return;
  taskDialogModel.value = {
    ...taskDialogModel.value,
    updatedAt: Date.now(),
  };
};

const stopPollingFallback = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
  activePollingOperation.value = null;
};

const resolveBindingSettledState = (
  binding: ProjectContainerSoftwareBinding,
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL",
) => {
  const runtime = String(binding.runtimeStatus || "").toUpperCase();
  const install = String(binding.installStatus || "").toUpperCase();
  if (action === "STATUS") return runtime ? { done: true, success: runtime !== "ERROR", message: `当前状态：${runtime}` } : { done: false, success: false, message: "等待状态回写" };
  if (action === "INSTALL") return install === "SUCCESS" ? { done: true, success: true, message: "安装成功" } : install === "FAILED" ? { done: true, success: false, message: "安装失败" } : { done: false, success: false, message: "安装执行中" };
  if (action === "UNINSTALL") return install === "UNINSTALLED" ? { done: true, success: true, message: "卸载成功" } : install === "FAILED" ? { done: true, success: false, message: "卸载失败" } : { done: false, success: false, message: "卸载执行中" };
  if (action === "START") return runtime === "RUNNING" ? { done: true, success: true, message: "启动成功" } : runtime === "ERROR" ? { done: true, success: false, message: "启动失败" } : { done: false, success: false, message: "启动执行中" };
  if (action === "STOP") return runtime === "STOPPED" ? { done: true, success: true, message: "停止成功" } : runtime === "ERROR" ? { done: true, success: false, message: "停止失败" } : { done: false, success: false, message: "停止执行中" };
  if (action === "RESTART") return runtime === "RUNNING" ? { done: true, success: true, message: "重启成功" } : runtime === "ERROR" ? { done: true, success: false, message: "重启失败" } : { done: false, success: false, message: "重启执行中" };
  return { done: false, success: false, message: "执行中" };
};

const startPollingFallback = (
  bindingId: number,
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL",
  operationId: string,
) => {
  stopPollingFallback();
  activePollingOperation.value = { bindingId, action, operationId };
  pollingTimer = setInterval(async () => {
    if (!sysProjectId.value || !activePollingOperation.value) {
      stopPollingFallback();
      return;
    }
    const res = await fetchProjectContainerSoftwareBindingList(sysProjectId.value);
    if (res.code !== "00000") return;
    bindings.value = res.data || [];
    const current = bindings.value.find(
      (item) => Number(item.sysProjectContainerSoftwareBindingId || 0) === bindingId,
    );
    if (!current) return;
    const settled = resolveBindingSettledState(current, action);
    runtimeTask.updateTask(operationId, {
      requestId: operationId,
      title: `${action} · ${current.softwareName || current.softwareCode || "未命名软件"}`,
      description: projectNameText.value,
      status: settled.done ? (settled.success ? "success" : "error") : "running",
      progress: settled.done ? 100 : 70,
      source: "system",
      mode: "stream",
      message: settled.message,
      stageLabel: action,
    });
    upsertOverlay(
      {
        operationId,
        action,
        sysProjectContainerSoftwareBindingId: bindingId,
        progressPercent: settled.done ? 100 : 70,
        message: settled.message,
      },
      settled.done ? 100 : 70,
      settled.done ? (settled.success ? "success" : "error") : "info",
      settled.message,
    );
    if (settled.done) {
      (settled.success ? runtimeMessage.success : runtimeMessage.error)(settled.message);
      stopPollingFallback();
      syncEditorDataFromServices();
      persistLocalState();
    }
  }, 2000);
};

const waitForSoftwareAction = async (
  bindingId: number,
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL",
  timeoutMs = 60000,
) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await reloadBindings();
    const current = bindings.value.find(
      (item) => Number(item.sysProjectContainerSoftwareBindingId || 0) === bindingId,
    );
    if (current) {
      const settled = resolveBindingSettledState(current, action);
      if (settled.done) {
        if (!settled.success) {
          throw new Error(settled.message);
        }
        return current;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error(`${action} 超时`);
};

const upsertOverlay = (
  ticket: ProjectContainerSoftwareOperationTicket,
  progress: number,
  tone: "info" | "success" | "warning" | "error",
  messageText: string,
) => {
  if (!overlayStack) return;
  const id = activeOverlayId.value || buildOverlayId(ticket);
  activeOverlayId.value = id;
  overlayStack.upsert({
    id,
    source: "project-container-software",
    title: `${ticket.action} · ${ticket.sysProjectContainerSoftwareBindingId}`,
    description: projectNameText.value,
    tone,
    progress,
    latestMessage: messageText,
    progressLabel: ticket.action || "执行中",
    progressSecondary: projectIdText.value,
    icon:
      tone === "success"
        ? "ep:success-filled"
        : tone === "error"
          ? "ep:circle-close-filled"
          : "ep:loading",
    autoClose: tone === "success",
    autoCloseDelay: 3000,
    closeable: true,
    timestamp: Date.now(),
    createdAt: Date.now(),
  });
};

const handleImportPreset = async (item: ProjectContainerSoftwarePreset) => {
  if (!sysProjectId.value || !item.sysProjectContainerSoftwarePresetId) return;
  importingPresetId.value = item.sysProjectContainerSoftwarePresetId;
  try {
    const res = await fetchImportProjectContainerSoftwarePreset({
      sysProjectId: sysProjectId.value,
      sysProjectContainerSoftwarePresetId: item.sysProjectContainerSoftwarePresetId,
    });
    if (res.code === "00000") {
      runtimeMessage.success("预设软件已导入");
      await reloadBindings();
      syncEditorDataFromServices();
      persistLocalState();
      await persistTopologyToBackend({ silent: true });
    } else {
      runtimeMessage.error(res.message || "导入失败");
    }
  } finally {
    importingPresetId.value = null;
  }
};

const handleDeleteBinding = async (item: ProjectContainerSoftwareBinding) => {
  if (!item.sysProjectContainerSoftwareBindingId) return;
  await fetchDeleteProjectContainerSoftwareBinding(item.sysProjectContainerSoftwareBindingId);
  runtimeMessage.success("已删除容器服务节点");
  await reloadBindings();
  syncEditorDataFromServices();
  persistLocalState();
  await persistTopologyToBackend({ silent: true });
};

const operateEditorNode = async (
  nodeId: string,
  action: "STATUS" | "START" | "STOP" | "RESTART",
) => {
  if (!nodeId) {
    return;
  }
  if (isProjectNodeId(nodeId)) {
    const project = findImportedProjectByNodeId(nodeId);
    if (!project) {
      runtimeMessage.warning("未找到项目节点");
      return;
    }
    if (action === "STATUS") {
      await refreshImportedProjectStatus(project);
      return;
    }
    await handleImportedProjectAction(
      project,
      action === "START" ? "start" : action === "STOP" ? "stop" : "restart",
    );
    return;
  }
  const binding = findBindingByNodeId(nodeId);
  if (!binding) {
    runtimeMessage.warning("未找到服务节点");
    return;
  }
  await handleOperate(binding, action);
};

const handleOperate = async (
  item: ProjectContainerSoftwareBinding,
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL",
) => {
  if (!item.sysProjectContainerSoftwareBindingId) return;
  if (action === "INSTALL") {
    const profile = resolveSoftwareConfigProfile(item.softwareCode, item.softwareName, item.softwareVersion);
    if (!profile) {
      runtimeMessage.warning("当前仅支持 MySQL 8 / Guacamole / Nginx / Redis 安装");
      appendNodeLog(resolveBindingNodeId(item), "notice", "非第一批软件暂不支持安装");
      return;
    }
    appendNodeLog(resolveBindingNodeId(item), "install", "打开安装向导，请先确认配置后再安装");
    openSoftwareConfig(item, { installAfterSave: true });
    return;
  }
  await submitSoftwareOperation(item, action);
};

const submitSoftwareOperation = async (
  item: ProjectContainerSoftwareBinding,
  action: "INSTALL" | "START" | "STOP" | "RESTART" | "STATUS" | "UNINSTALL",
) => {
  if (!item.sysProjectContainerSoftwareBindingId) return;
  const nodeId = resolveBindingNodeId(item);
  appendNodeLog(nodeId, actionToNodeLogKind(action), `提交${action}操作`);
  const res = await fetchOperateProjectContainerSoftwareBinding({
    sysProjectContainerSoftwareBindingId: item.sysProjectContainerSoftwareBindingId,
    action,
  });
  if (res.code !== "00000" || !res.data?.operationId) {
    runtimeMessage.error(res.message || "操作提交失败");
    appendNodeLog(nodeId, "notice", res.message || "操作提交失败");
    return;
  }
  activeOverlayId.value = "";
  stream.connect(String(res.data.operationId));
  runtimeTask.updateTask(String(res.data.operationId), {
    requestId: res.data.operationId,
    title: `${action} · ${item.softwareName || item.softwareCode || "未命名软件"}`,
    description: projectNameText.value,
    status: "running",
    progress: Number(res.data.progressPercent || 10),
    source: "system",
    mode: "stream",
    message: res.data.message || "任务已提交",
    stageLabel: action,
  });
  taskDialogModel.value = {
    taskId: String(res.data.operationId),
    status: "RUNNING",
    message: res.data.message || "任务已提交",
    serverIds: sysProjectId.value ? [sysProjectId.value] : [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    summaryItems: [
      { label: "项目", value: projectNameText.value },
      { label: "服务", value: item.softwareName || item.softwareCode || "-" },
      { label: "操作", value: action },
    ],
    steps: [
      {
        stepKey: "SUBMIT",
        title: "任务提交",
        status: "SUCCESS",
        message: res.data.message || "任务已提交",
        updatedAt: Date.now(),
      },
    ],
  };
  taskDialogVisible.value = true;
  upsertOverlay(
    res.data,
    Number(res.data.progressPercent || 10),
    "info",
    res.data.message || "任务已提交",
  );
  startPollingFallback(
    item.sysProjectContainerSoftwareBindingId,
    action,
    String(res.data.operationId),
  );
};

const runTopologyAction = async (action: "START" | "STOP" | "RESTART") => {
  if (topologyRunning.value) {
    runtimeMessage.warning("整套服务正在执行中");
    return;
  }
  if (!executionPlan.value.length) {
    syncEditorDataFromServices();
  }
  const plan =
    action === "STOP"
      ? [...executionPlan.value].reverse()
      : [...executionPlan.value];
  if (!plan.length) {
    runtimeMessage.warning("当前没有可执行的编排任务");
    return;
  }
  topologyRunning.value = true;
  appendLocalLog(`开始执行整套${action === "START" ? "启动" : action === "STOP" ? "停止" : "重启"}任务，共 ${plan.length} 个节点`);
  const topologySteps = plan
    .map((item): ProjectContainerSoftwareTopologyStepRequest | null => {
      if (item.kind === "software") {
        const binding = findBindingByNodeId(item.nodeId);
        if (!binding?.sysProjectContainerSoftwareBindingId) {
          return null;
        }
        return {
          nodeKind: "SOFTWARE",
          sysProjectContainerSoftwareBindingId:
            binding.sysProjectContainerSoftwareBindingId,
          order: item.order,
          required: item.required,
          failurePolicy: item.failurePolicy,
          startDelaySec: item.startDelaySec,
          label: item.label,
        };
      }
      const project = findImportedProjectByNodeId(item.nodeId);
      if (!project?.projectId) {
        return null;
      }
      return {
        nodeKind: "PROJECT",
        sysProjectContainerSoftwareBindingId: 0,
        remoteProjectId: String(project.projectId),
        order: item.order,
        required: item.required,
        failurePolicy: item.failurePolicy,
        startDelaySec: item.startDelaySec,
        label: item.label,
      };
    })
    .filter(Boolean) as ProjectContainerSoftwareTopologyStepRequest[];
  try {
    if (topologySteps.length === plan.length) {
      if (!topologySteps.length) {
        throw new Error("拓扑中没有可执行的节点");
      }
      const topologyRes = await fetchOperateProjectContainerSoftwareTopology({
        sysProjectId: sysProjectId.value,
        action,
        steps: topologySteps,
      });
      if (topologyRes.code !== "00000" || !topologyRes.data?.operationId) {
        throw new Error(topologyRes.message || "拓扑任务提交失败");
      }
      stream.connect(String(topologyRes.data.operationId));
      runtimeTask.updateTask(String(topologyRes.data.operationId), {
        requestId: String(topologyRes.data.operationId),
        title: `TOPOLOGY_${action}`,
        description: projectNameText.value,
        status: "running",
        progress: Number(topologyRes.data.progressPercent || 10),
        source: "system",
        mode: "stream",
        message: topologyRes.data.message || "拓扑任务已提交",
        stageLabel: `TOPOLOGY_${action}`,
      });
      taskDialogModel.value = {
        taskId: String(topologyRes.data.operationId),
        status: "RUNNING",
        message: topologyRes.data.message || "拓扑任务已提交",
        serverIds: sysProjectId.value ? [sysProjectId.value] : [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        summaryItems: [
          { label: "项目", value: projectNameText.value },
          { label: "模式", value: "后端统一拓扑执行" },
          { label: "操作", value: action },
        ],
        steps: [
          {
            stepKey: "SUBMIT",
            title: "拓扑任务提交",
            status: "SUCCESS",
            message: topologyRes.data.message || "拓扑任务已提交",
            updatedAt: Date.now(),
          },
        ],
      };
      taskDialogVisible.value = true;
      appendLocalLog(`已提交后端统一拓扑任务：${action}`);
      return;
    }
    for (const item of plan) {
      try {
        if (item.kind === "software") {
          const binding = findBindingByNodeId(item.nodeId);
          if (!binding?.sysProjectContainerSoftwareBindingId) {
            appendLocalLog(`跳过软件节点 ${item.label}：未找到绑定`);
            continue;
          }
          appendLocalLog(`执行软件节点 ${item.label}：${action}`);
          if (item.beforeStartNote) {
            appendLocalLog(`节点前置说明 ${item.label}：${item.beforeStartNote}`);
          }
          const res = await fetchOperateProjectContainerSoftwareBinding({
            sysProjectContainerSoftwareBindingId: binding.sysProjectContainerSoftwareBindingId,
            action,
          });
          if (res.code !== "00000" || !res.data?.operationId) {
            throw new Error(res.message || `${item.label} 提交失败`);
          }
          stream.connect(String(res.data.operationId));
          await waitForSoftwareAction(binding.sysProjectContainerSoftwareBindingId, action);
          if (item.startDelaySec > 0) {
            appendLocalLog(`节点 ${item.label} 启动延迟 ${item.startDelaySec}s`);
            await new Promise((resolve) => setTimeout(resolve, item.startDelaySec * 1000));
          }
          if (item.healthCheckHint) {
            appendLocalLog(`节点健康检查提示 ${item.label}：${item.healthCheckHint}`);
          }
          if (item.afterStartNote) {
            appendLocalLog(`节点后置说明 ${item.label}：${item.afterStartNote}`);
          }
          appendLocalLog(`软件节点 ${item.label}：${action} 完成`);
          continue;
        }
        const project = findImportedProjectByNodeId(item.nodeId);
        if (!project?.projectId) {
          appendLocalLog(`跳过项目节点 ${item.label}：未找到项目`);
          continue;
        }
        appendLocalLog(`执行项目节点 ${item.label}：${action}`);
        if (item.beforeStartNote) {
          appendLocalLog(`节点前置说明 ${item.label}：${item.beforeStartNote}`);
        }
        if (!props.remoteApi) {
          throw new Error(`缺少远程项目API，无法执行项目节点 ${item.label}`);
        }
        const projectId = String(project.projectId);
        const res =
          action === "START"
            ? await props.remoteApi.startProject(projectId)
            : action === "STOP"
              ? await props.remoteApi.stopProject(projectId)
              : await props.remoteApi.restartProject(projectId);
        if (res.code !== "00000") {
          throw new Error((res as any).message || `${item.label} 执行失败`);
        }
        importedProjects.value = importedProjects.value.map((current) =>
          String(current.projectId || "") === String(project.projectId || "")
            ? {
                ...current,
                runtimeStatus:
                  action === "STOP" ? "stopped" : "running",
              }
            : current,
        );
        if (item.startDelaySec > 0) {
          appendLocalLog(`节点 ${item.label} 启动延迟 ${item.startDelaySec}s`);
          await new Promise((resolve) => setTimeout(resolve, item.startDelaySec * 1000));
        }
        if (item.healthCheckHint) {
          appendLocalLog(`节点健康检查提示 ${item.label}：${item.healthCheckHint}`);
        }
        if (item.afterStartNote) {
          appendLocalLog(`节点后置说明 ${item.label}：${item.afterStartNote}`);
        }
        appendLocalLog(`项目节点 ${item.label}：${action} 完成`);
      } catch (error: any) {
        if (item.failurePolicy === "continue" || item.required === false) {
          appendLocalLog(`节点 ${item.label} 执行失败但已继续：${error?.message || "未知错误"}`);
          runtimeMessage.warning(`${item.label} 执行失败，已继续后续节点`);
          continue;
        }
        throw error;
      }
    }
    syncEditorDataFromServices();
    persistLocalState();
    runtimeMessage.success(`整套${action === "START" ? "启动" : action === "STOP" ? "停止" : "重启"}完成`);
    appendLocalLog(`整套${action === "START" ? "启动" : action === "STOP" ? "停止" : "重启"}完成`);
  } catch (error: any) {
    runtimeMessage.error(error?.message || "整套编排执行失败");
    appendLocalLog(`整套执行失败：${error?.message || "未知错误"}`);
  } finally {
    if (topologySteps.length !== plan.length) {
      topologyRunning.value = false;
    }
  }
};

watch(stream.latest, async (payload) => {
  if (!payload) return;
  const payloadBindingId = Number(payload.sysProjectContainerSoftwareBindingId || 0);
  if (payloadBindingId > 0) {
    const nodeId = `software-${payloadBindingId}`;
    const text = String(payload.line || payload.message || payload.output || "");
    if (text) {
      appendNodeLog(nodeId, actionToNodeLogKind(payload.action), text);
    }
  }
  const ticket: ProjectContainerSoftwareOperationTicket = {
    operationId: String(payload.operationId || stream.state.value.operationId || ""),
    sysProjectContainerSoftwareBindingId: payload.sysProjectContainerSoftwareBindingId,
    action: payload.action,
    progressPercent: payload.progressPercent,
    message: payload.message,
    operationStatus: payload.status,
  };
  const normalized = String(payload.status || "").toUpperCase();
  const tone =
    normalized === "SUCCESS" ? "success" : normalized === "FAILED" ? "error" : "info";
  upsertOverlay(
    ticket,
    Number(payload.progressPercent || (normalized === "SUCCESS" ? 100 : 50)),
    tone,
    String(payload.message || payload.line || "执行中"),
  );
  runtimeTask.updateTask(ticket.operationId, {
    requestId: ticket.operationId,
    title: `${ticket.action || "操作"} · ${payload.softwareName || payload.softwareCode || "未命名软件"}`,
    description: projectNameText.value,
    status: normalized === "SUCCESS" ? "success" : normalized === "FAILED" ? "error" : "running",
    progress: Number(payload.progressPercent || (normalized === "SUCCESS" ? 100 : 50)),
    source: "system",
    mode: "stream",
    message: String(payload.message || payload.line || "执行中"),
    stageLabel: String(ticket.action || "执行中"),
  });
  if (normalized === "SUCCESS" || normalized === "FAILED") {
    await reloadBindings();
    stopPollingFallback();
    syncEditorDataFromServices();
    persistLocalState();
    if (String(ticket.action || "").startsWith("TOPOLOGY_")) {
      topologyRunning.value = false;
    }
    (normalized === "SUCCESS" ? runtimeMessage.success : runtimeMessage.error)(
      String(payload.message || (normalized === "SUCCESS" ? "操作成功" : "操作失败")),
    );
  }
});

watch(
  () => sysProjectId.value,
  async (projectId) => {
    stopPollingFallback();
    presetImportDialogVisible.value = false;
    projectImportDialogVisible.value = false;
    if (!projectId) {
      presets.value = [];
      bindings.value = [];
      importedProjects.value = [];
      editorNodes.value = [];
      editorEdges.value = [];
      executionPlan.value = [];
      return;
    }
    loadLocalState();
    await reloadAll();
    await loadTopologyFromBackend();
    syncEditorDataFromServices();
    persistLocalState();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPollingFallback();
});
</script>

<style scoped lang="scss">
.pcsp {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  min-height: 0;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 26%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.94));
}
.pcsp__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid rgba(147, 197, 253, 0.35);
  background: linear-gradient(140deg, rgba(255,255,255,0.92), rgba(241,245,249,0.86));
}
.pcsp__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 700;
}
.pcsp__hero h2 { margin: 0; font-size: 20px; color: #0f172a; }
.pcsp__meta { margin: 8px 0 0; font-size: 12px; color: #64748b; }
.pcsp__hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.pcsp__icon-action {
  width: 30px;
  height: 30px;
}
.pcsp__layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.pcsp__aside,
.pcsp__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}
.pcsp__bottom {
  display: grid;
  grid-template-columns: minmax(0, 360px) minmax(0, 1fr);
  gap: 16px;
  min-height: 280px;
}
.pcsp__panel {
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  background: rgba(255,255,255,0.92);
}
.pcsp__panel--stretch { flex: 1; }
.pcsp__panel--editor { min-height: 520px; }
.pcsp__editor-dropzone {
  flex: 1;
  min-height: 420px;
  display: flex;
}
.pcsp__editor { flex: 1; min-height: 420px; }
.pcsp__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.pcsp__panel-head h3 { margin: 0; font-size: 15px; }
.pcsp__panel-head p { margin: 4px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
.pcsp__panel-actions { display:flex; gap:8px; flex-wrap: wrap; }
.pcsp__property-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pcsp__property-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.pcsp__dialog-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 58vh;
  overflow-y: auto;
}
.pcsp__dialog-list--presets {
  max-height: 62vh;
}
.pcsp__node-log-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 180px;
}
.pcsp__node-log-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.pcsp__node-log-content {
  min-height: 150px;
  max-height: 220px;
  margin: 0;
  padding: 10px;
  border-radius: 8px;
  background: #0f172a;
  color: #dbeafe;
  overflow: auto;
  white-space: pre-wrap;
  font-size: 12px;
  line-height: 1.6;
}
.pcsp__list {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pcsp__list--bindings,
.pcsp__list--nodes { flex: 1; }
.pcsp__item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  background: #fff;
}
.pcsp__item--binding { align-items: flex-start; }
.pcsp__item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.pcsp__item-main strong,
.pcsp__item-main span,
.pcsp__item-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pcsp__item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pcsp__item-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.pcsp__config-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.pcsp__config-grid--project {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.pcsp__config-grid--runtime {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.18);
  background: rgba(239, 246, 255, 0.72);
}
.pcsp__config-grid--scripts {
  margin-top: 12px;
}
.pcsp__node-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}
.pcsp__node-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #475569;
  font-size: 12px;
}
.pcsp__node-card {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: #fff;
  padding: 12px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}
.pcsp__node-card[draggable="true"] {
  cursor: grab;
}
.pcsp__node-card[draggable="true"]:active {
  cursor: grabbing;
}
.pcsp__node-card:hover {
  border-color: rgba(59, 130, 246, 0.35);
  transform: translateY(-1px);
}
.pcsp__node-card--software {
  background:
    linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent 42%),
    #fff;
}
.pcsp__node-card--project {
  background:
    linear-gradient(135deg, rgba(16, 185, 129, 0.08), transparent 42%),
    #fff;
}
.pcsp__node-card-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.pcsp__node-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pcsp__node-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 6px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}
.pcsp__node-card:hover .pcsp__node-toolbar {
  opacity: 1;
  pointer-events: auto;
}
.pcsp__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 12px;
  color: #64748b;
}
.pcsp__log-content {
  min-height: 220px;
  max-height: 320px;
  overflow-y: auto;
  background: #0f172a;
  color: #e2e8f0;
  border-radius: 10px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>


