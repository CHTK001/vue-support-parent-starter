<template>
  <section class="docker-manage-shell">
    <div class="docker-manage-shell__backdrop" aria-hidden="true">
      <span class="docker-manage-shell__orb docker-manage-shell__orb--cyan" />
      <span class="docker-manage-shell__orb docker-manage-shell__orb--emerald" />
      <span class="docker-manage-shell__grid" />
    </div>

    <header class="docker-topbar">
      <div class="docker-brand">
        <div class="docker-brand__logo">
          <IconifyIconOnline icon="mdi:docker" />
        </div>
        <div>
          <span class="docker-brand__eyebrow">SERVER DOCKER CONSOLE</span>
          <strong>Docker管理平台</strong>
          <p>{{ heroSubtitle }}</p>
        </div>
      </div>


      <div class="docker-topbar__tools">
        <span class="docker-badge" :class="dockerSocketBadgeClass">
          {{ dockerSocketBadgeText }}
        </span>
        <span v-if="projectContextBadgeText" class="docker-badge">
          {{ projectContextBadgeText }}
        </span>
        <label class="docker-searchbox">
          <IconifyIconOnline icon="ri:search-line" />
          <input
            v-model="queryKeyword"
            type="text"
            placeholder="搜索容器 / 镜像 / 数据卷 / 网络"
          />
        </label>
        <button
          type="button"
          class="docker-icon-button"
          :disabled="loading"
          title="刷新 Docker 数据"
          aria-label="刷新 Docker 数据"
          @click="refreshPageData"
        >
          <IconifyIconOnline :icon="loading ? 'svg-spinners:90-ring-with-bg' : 'ri:refresh-line'" />
        </button>
      </div>
    </header>

    <main class="docker-layout">
      <aside class="docker-sidebar">
        <ScCard
          class="docker-card docker-card--menu"
          layout="tech"
          theme="cyan"
          skin="scifi"
          :show-header="false"
        >
          <div class="docker-card__eyebrow">RESOURCE SWITCH</div>
          <button
            v-for="item in navItems"
            :key="`side-${item.key}`"
            type="button"
            class="docker-side-link"
            :class="{ 'is-active': activeSection === item.key }"
            @click="switchSection(item.key)"
          >
            <span class="docker-side-link__icon">
              <IconifyIconOnline :icon="item.icon" />
            </span>
            <span class="docker-side-link__copy">
              <strong>{{ item.label }}</strong>
              <small>{{ item.description }}</small>
            </span>
            <span class="docker-side-link__count">{{ item.count }}</span>
          </button>
        </ScCard>
      </aside>

      <section class="docker-content">
        <template v-if="activeSection === 'overview'">
          <section class="docker-overview-grid">
            <ScCard
              class="docker-card docker-card--runtime"
              layout="tech"
              theme="cyan"
              skin="scifi"
              :show-header="false"
            >
              <header class="docker-panel-header">
                <div>
                  <small>RUNTIME CORE</small>
                  <h3>正在运行的容器</h3>
                  <p>{{ runtimePanelDescription }}</p>
                </div>
                <span class="docker-badge" :class="statusToneClass">
                  {{ capability?.dockerConnectable ? "CONNECTED" : "CHECKING" }}
                </span>
              </header>

              <div class="docker-runtime-scene">
                <div class="docker-runtime-scene__ring" />
                <div class="docker-runtime-scene__stack">
                  <span />
                  <span />
                </div>
                <div class="docker-runtime-scene__pulse" />
              </div>

              <div class="docker-runtime-metrics">
                <article>
                  <span>运行中</span>
                  <strong>{{ runningContainerCount }}</strong>
                </article>
                <article>
                  <span>已停止</span>
                  <strong>{{ stoppedContainerCount }}</strong>
                </article>
                <article>
                  <span>容器总量</span>
                  <strong>{{ containers.length }}</strong>
                </article>
              </div>
            </ScCard>

            <ScCard
              class="docker-card docker-card--table docker-card--main-table"
              layout="tech"
              theme="cyan"
              skin="scifi"
              :show-header="false"
            >
              <header class="docker-panel-header">
                <div>
              <small>02 CONTAINER TABLE</small>
                  <h3>当前所有容器</h3>
                  <p>进入首页后直接按 serverId 读取 docker 配置与资源，不再依赖地址栏传整包服务器信息。</p>
                </div>
                <span class="docker-badge">{{ containerTable.rows.length }} 条</span>
              </header>
              <div class="docker-table-shell">
                <div class="docker-table-shell__toolbar">
                  <span class="docker-table-shell__chip">
                    <IconifyIconOnline icon="ri:apps-2-line" />
                    资源主屏
                  </span>
                  <button type="button" class="docker-table-shell__arrow" @click="switchSection('containers')">
                    <IconifyIconOnline icon="ri:arrow-right-s-line" />
                  </button>
                </div>
                <div class="docker-table-wrap">
                  <ScTable
                    v-if="containerTable.rows.length"
                    class="docker-sc-table"
                    table-id="docker-overview-container-table"
                    table-name="docker-overview-container-table"
                    :data="containerTable.rows"
                    row-key="key"
                    :search="false"
                    :hide-do="true"
                    :hide-pagination="true"
                    :hide-refresh="true"
                    :hide-setting="true"
                    :border="false"
                    stripe
                    skin="scifi"
                    theme="default"
                    :row-class-name="resolveDockerRowClassName"
                  >
                    <ScTableColumn
                      v-for="(header, columnIndex) in containerTable.headers.slice(0, -1)"
                      :key="`overview-col-${header}`"
                      :prop="`cell-${columnIndex}`"
                      :label="header"
                      :min-width="columnIndex === 0 ? 210 : 140"
                      show-overflow-tooltip
                    >
                      <template #default="{ row }">
                        <span
                          class="docker-table__cell"
                          :class="[
                            row.key === selectedRowKey ? 'is-selected' : '',
                            row.cells?.[columnIndex]?.tone ? `is-${row.cells[columnIndex].tone}` : '',
                            row.cells?.[columnIndex]?.kind ? `is-${row.cells[columnIndex].kind}` : '',
                          ]"
                        >
                          <el-tooltip
                            v-if="row.cells?.[columnIndex]?.kind === 'status' && row.cells?.[columnIndex]?.text === '运行中'"
                            :content="row.cells?.[columnIndex]?.text"
                            placement="top"
                            effect="dark"
                          >
                            <span class="docker-status-icon" aria-label="运行中">
                              <span class="docker-status-icon__ring" aria-hidden="true" />
                              <IconifyIconOnline class="docker-status-icon__core" icon="ri:play-circle-fill" />
                            </span>
                          </el-tooltip>
                          <ScTimeText
                            v-else-if="row.cells?.[columnIndex]?.kind === 'time'"
                            :model-value="row.cells?.[columnIndex]?.text || ''"
                            skin="scifi"
                          />
                          <template v-else>
                            {{ row.cells?.[columnIndex]?.text || "-" }}
                          </template>
                        </span>
                      </template>
                    </ScTableColumn>
                    <ScTableColumn label="操作" width="280">
                      <template #default="{ row }">
                        <div
                          v-if="(row.actions || []).length"
                          class="docker-table__actions"
                          :class="{ 'is-selected': row.key === selectedRowKey }"
                        >
                          <button
                            v-for="action in row.actions || []"
                            :key="`${row.key}-${action.key}`"
                            type="button"
                            class="docker-action-button"
                            :class="action.tone ? `is-${action.tone}` : ''"
                            :disabled="actionLoadingKey === `containers:${row.key}:${action.key}`"
                            :title="action.label"
                            :aria-label="action.label"
                            @click="handleRowAction('containers', row, action.key)"
                          >
                            <IconifyIconOnline :icon="action.icon" />
                            <span class="docker-sr-only">{{ action.label }}</span>
                          </button>
                        </div>
                        <span v-else class="docker-table__cell">-</span>
                      </template>
                    </ScTableColumn>
                  </ScTable>
                  <el-empty v-else :description="loading ? '正在读取容器数据' : '当前服务器暂无容器'" />
                </div>
              </div>
            </ScCard>

            <ScCard
              v-for="card in overviewCards"
              :key="card.key"
              class="docker-card docker-card--feature"
              layout="tech"
              theme="cyan"
              skin="scifi"
              :show-header="false"
              @click="switchSection(card.key)"
            >
              <header class="docker-feature-header">
                <span class="docker-feature-header__icon">
                  <IconifyIconOnline :icon="card.icon" />
                </span>
                <div>
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.description }}</p>
                </div>
                <strong>{{ card.count }}</strong>
              </header>

              <div class="docker-feature-illustration" :class="`is-${card.key}`">
                <div class="docker-feature-illustration__frame">
                  <div class="docker-feature-illustration__iconbox">
                    <IconifyIconOnline :icon="card.icon" />
                  </div>
                </div>
                <div class="docker-feature-illustration__base" />
                <span class="docker-feature-illustration__dot is-a" />
                <span class="docker-feature-illustration__dot is-b" />
                <span class="docker-feature-illustration__dot is-c" />
              </div>
            </ScCard>
          </section>
        </template>

        <template v-else-if="activeSection === 'terminal'">
          <section class="docker-terminal-shell">
            <ScCard
              class="docker-card docker-card--terminal"
              layout="tech"
              theme="cyan"
              skin="scifi"
              :show-header="false"
            >
              <header class="docker-panel-header">
                <div>
                  <small>06 CONTAINER TERMINAL</small>
                  <h3>{{ terminalContainerTitle }}</h3>
                  <p>{{ terminalContainerDescription }}</p>
                </div>
                <div class="docker-terminal-header-actions">
                  <span class="docker-badge" :class="terminalLogStreaming ? 'is-ok' : 'is-warn'">
                    {{ terminalLogStreaming ? "LOG STREAMING" : "LOG IDLE" }}
                  </span>
                  <button type="button" class="docker-table-shell__arrow" @click="switchSection('containers')">
                    <IconifyIconOnline icon="ri:arrow-left-s-line" />
                  </button>
                </div>
              </header>

              <div class="docker-terminal-workspace">
                <section class="docker-terminal-console">
                  <div class="docker-terminal-toolbar">
                    <span class="docker-table-shell__chip">
                      <IconifyIconOnline icon="ri:terminal-box-line" />
                      {{ activeContainerId || "-" }}
                    </span>
                    <div class="docker-terminal-toolbar__actions">
                      <span class="docker-terminal-status">{{ terminalLastStatus }}</span>
                      <button type="button" class="docker-action-button" @click="clearEmbeddedTerminal">
                        清屏
                      </button>
                      <button type="button" class="docker-action-button" @click="copyTerminalSelection">
                        复制
                      </button>
                    </div>
                  </div>

                  <div class="docker-terminal-plugin-shell">
                    <div ref="terminalPluginRef" class="docker-terminal-plugin" />
                    <div v-if="!terminalPluginReady" class="docker-terminal-empty">
                      正在初始化终端插件...
                    </div>
                  </div>
                </section>

                <aside class="docker-terminal-logs">
                  <div class="docker-terminal-logs__header">
                    <div>
                      <small>REALTIME LOG</small>
                      <strong>实时日志</strong>
                    </div>
                    <div class="docker-terminal-logs__actions">
                      <button
                        type="button"
                        class="docker-action-button"
                        :disabled="terminalLogLoading || !activeContainerId"
                        @click="refreshTerminalLogs"
                      >
                        刷新
                      </button>
                      <button
                        type="button"
                        class="docker-action-button"
                        :class="terminalLogStreaming ? 'is-warn' : 'is-ok'"
                        :disabled="terminalLogLoading || !activeContainerId"
                        @click="toggleTerminalLogStream"
                      >
                        {{ terminalLogStreaming ? "停止订阅" : "开始订阅" }}
                      </button>
                    </div>
                  </div>
                  <p class="docker-terminal-logs__hint">{{ terminalLogHint }}</p>
                  <div ref="terminalLogRef" class="docker-terminal-logbox">
                    <div v-for="(line, index) in terminalLogLines" :key="`${index}-${line}`" class="docker-terminal-logbox__line">
                      {{ line }}
                    </div>
                    <div v-if="!terminalLogLines.length" class="docker-terminal-empty">
                      暂无日志，点击“开始订阅”后将通过 socket 持续接收。
                    </div>
                  </div>
                </aside>
              </div>
            </ScCard>
          </section>
        </template>

        <template v-else>
          <section class="docker-detail-shell">
            <ScCard
              class="docker-card docker-card--table docker-card--main-table"
              layout="tech"
              theme="cyan"
              skin="scifi"
              :show-header="false"
            >
              <header class="docker-panel-header">
                <div>
                  <small>{{ activeSectionMeta.serial }} {{ activeSectionMeta.label }}</small>
                  <h3>{{ activeSectionMeta.tableTitle }}</h3>
                  <p>{{ activeSectionMeta.description }}</p>
                </div>
                <span class="docker-badge">{{ activeTable.rows.length }} 条</span>
              </header>
              <div class="docker-table-shell">
                <div class="docker-table-shell__toolbar">
                  <div class="docker-table-shell__toolbar-left">
                    <span class="docker-table-shell__chip">
                      <IconifyIconOnline :icon="activeSectionMeta.icon" />
                      {{ activeSectionMeta.label }}
                    </span>
                    <div
                      v-if="activeSection === 'containers'"
                      class="docker-filter-group"
                      role="tablist"
                      aria-label="容器状态筛选"
                    >
                      <button
                        v-for="filter in containerStatusFilters"
                        :key="filter.key"
                        type="button"
                        class="docker-filter-button"
                        :class="{ 'is-active': containerStatusFilter === filter.key }"
                        @click="containerStatusFilter = filter.key"
                      >
                        <IconifyIconOnline :icon="filter.icon" />
                        <span>{{ filter.label }}</span>
                      </button>
                    </div>
                    <div class="docker-toolbar-actions">
                      <button
                        v-if="activeSection === 'containers'"
                        type="button"
                        class="docker-icon-action-button is-ok"
                        title="安装容器"
                        aria-label="安装容器"
                        @click="openInstallDialog"
                      >
                        <IconifyIconOnline icon="ri:add-circle-line" />
                        <span class="docker-sr-only">安装容器</span>
                      </button>
                      <button
                        v-if="activeSection === 'images'"
                        type="button"
                        class="docker-icon-action-button is-ok"
                        title="拉取镜像"
                        aria-label="拉取镜像"
                        @click="openImagePullDialog"
                      >
                        <IconifyIconOnline icon="ri:download-2-line" />
                        <span class="docker-sr-only">拉取镜像</span>
                      </button>
                      <button
                        v-if="activeSection === 'networks'"
                        type="button"
                        class="docker-icon-action-button is-ok"
                        title="新增网络"
                        aria-label="新增网络"
                        @click="openNetworkDialog()"
                      >
                        <IconifyIconOnline icon="ri:share-forward-2-line" />
                        <span class="docker-sr-only">新增网络</span>
                      </button>
                    </div>
                  </div>
                  <button type="button" class="docker-table-shell__arrow" @click="switchSection('containers')">
                    <IconifyIconOnline icon="ri:arrow-left-s-line" />
                  </button>
                </div>
                <div class="docker-table-wrap">
                  <ScTable
                    v-if="activeTable.rows.length"
                    class="docker-sc-table"
                    table-id="docker-active-resource-table"
                    table-name="docker-active-resource-table"
                    :data="activeTable.rows"
                    row-key="key"
                    :search="false"
                    :hide-do="true"
                    :hide-pagination="true"
                    :hide-refresh="true"
                    :hide-setting="true"
                    :border="false"
                    stripe
              skin="scifi"
                    theme="default"
                    :row-class-name="resolveDockerRowClassName"
                  >
                    <ScTableColumn
                      v-for="(header, columnIndex) in activeTable.headers.slice(0, -1)"
                      :key="`active-col-${header}`"
                      :prop="`active-cell-${columnIndex}`"
                      :label="header"
                      :min-width="columnIndex === 0 ? 210 : 140"
                      show-overflow-tooltip
                    >
                      <template #default="{ row }">
                        <span
                          class="docker-table__cell"
                          :class="[
                            row.key === selectedRowKey ? 'is-selected' : '',
                            row.cells?.[columnIndex]?.tone ? `is-${row.cells[columnIndex].tone}` : '',
                            row.cells?.[columnIndex]?.kind ? `is-${row.cells[columnIndex].kind}` : '',
                          ]"
                        >
                          <el-tooltip
                            v-if="row.cells?.[columnIndex]?.kind === 'status' && row.cells?.[columnIndex]?.text === '运行中'"
                            :content="row.cells?.[columnIndex]?.text"
                            placement="top"
                            effect="dark"
                          >
                            <span class="docker-status-icon" aria-label="运行中">
                              <span class="docker-status-icon__ring" aria-hidden="true" />
                              <IconifyIconOnline class="docker-status-icon__core" icon="ri:play-circle-fill" />
                            </span>
                          </el-tooltip>
                          <ScTimeText
                            v-else-if="row.cells?.[columnIndex]?.kind === 'time'"
                            :model-value="row.cells?.[columnIndex]?.text || ''"
                            skin="scifi"
                          />
                          <template v-else>
                            {{ row.cells?.[columnIndex]?.text || "-" }}
                          </template>
                        </span>
                      </template>
                    </ScTableColumn>
                    <ScTableColumn label="操作" width="280">
                      <template #default="{ row }">
                        <div
                          v-if="(row.actions || []).length"
                          class="docker-table__actions"
                          :class="{ 'is-selected': row.key === selectedRowKey }"
                        >
                          <button
                            v-for="action in row.actions || []"
                            :key="`${row.key}-${action.key}`"
                            type="button"
                            class="docker-action-button"
                            :class="action.tone ? `is-${action.tone}` : ''"
                            :disabled="actionLoadingKey === `${activeSection}:${row.key}:${action.key}`"
                            :title="action.label"
                            :aria-label="action.label"
                            @click="handleRowAction(activeSection, row, action.key)"
                          >
                            <IconifyIconOnline :icon="action.icon" />
                            <span class="docker-sr-only">{{ action.label }}</span>
                          </button>
                        </div>
                        <span v-else class="docker-table__cell">-</span>
                      </template>
                    </ScTableColumn>
                  </ScTable>
                  <el-empty
                    v-else
                    :description="loading ? '正在读取当前服务器 Docker 数据' : `${activeSectionMeta.label} 暂无可展示数据`"
                  />
                </div>
              </div>
            </ScCard>
          </section>
        </template>

        <section v-if="loadWarnings.length" class="docker-warning-strip">
          <span v-for="warning in loadWarnings" :key="warning">{{ warning }}</span>
        </section>
      </section>
    </main>

    <ScDialog
      v-model="containerLogDialogVisible"
      mode="element"
      layout="default"
      theme="tech"
      skin="scifi"
      :title="containerLogDialogTitle"
      width="960px"
      destroy-on-close
      class="docker-shell-dialog docker-terminal-dialog"
    >
      <section class="docker-log-dialog-shell">
        <div class="docker-terminal-logs__header">
          <div>
            <small>REALTIME LOG</small>
            <strong>容器日志窗口</strong>
          </div>
          <div class="docker-terminal-logs__actions">
            <button
              type="button"
              class="docker-action-button"
              :disabled="containerLogDialogLoading || !containerLogDialogContainerId"
              @click="refreshContainerLogDialog"
            >
              刷新
            </button>
            <button
              type="button"
              class="docker-action-button"
              :class="containerLogDialogStreaming ? 'is-warn' : 'is-ok'"
              :disabled="containerLogDialogLoading || !containerLogDialogContainerId"
              @click="toggleContainerLogDialogStream"
            >
              {{ containerLogDialogStreaming ? "停止订阅" : "开始订阅" }}
            </button>
          </div>
        </div>
        <p class="docker-terminal-logs__hint">{{ containerLogDialogHint }}</p>
        <div ref="containerLogDialogRef" class="docker-terminal-logbox">
          <div
            v-for="(line, index) in containerLogDialogLines"
            :key="`${index}-${line}`"
            class="docker-terminal-logbox__line"
          >
            {{ line }}
          </div>
          <div v-if="!containerLogDialogLines.length" class="docker-terminal-empty">
            暂无日志，点击“开始订阅”后将通过 socket 持续接收。
          </div>
        </div>
      </section>
    </ScDialog>

    <ScDialog
      v-model="configDialogVisible"
      mode="element"
      layout="default"
      theme="tech"
      skin="scifi"
      title="容器配置"
      width="620px"
      destroy-on-close
      class="docker-shell-dialog"
    >
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="重启策略">
            <el-input v-model="configForm.restartPolicy" placeholder="always / unless-stopped / on-failure" />
          </el-form-item>
          <el-form-item label="CPU 限制">
            <el-input v-model="configForm.cpuLimit" placeholder="例如 1.5" />
          </el-form-item>
          <el-form-item label="内存限制">
            <el-input v-model="configForm.memoryLimit" placeholder="例如 512m" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="configDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="configSubmitting" @click="submitContainerConfig">
          保存
        </button>
      </template>
    </ScDialog>

    <ScDialog
      v-model="installDialogVisible"
      mode="element"
      layout="default"
      theme="tech"
      skin="scifi"
      title="安装容器"
      width="720px"
      destroy-on-close
      class="docker-shell-dialog"
    >
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="镜像名">
            <el-input v-model="installForm.imageName" placeholder="例如 alpine / nginx / python" />
          </el-form-item>
          <el-form-item label="标签">
            <el-input v-model="installForm.imageTag" placeholder="默认 latest" />
          </el-form-item>
          <el-form-item label="容器名称">
            <el-input v-model="installForm.containerName" placeholder="例如 codex-e2e-container" />
          </el-form-item>
          <el-form-item label="启动命令">
            <el-input
              v-model="installForm.commandLine"
              placeholder='例如 sh -c "sleep 3600"'
            />
          </el-form-item>
          <el-form-item label="网络（可选）">
            <el-input
              v-model="installNetworkName"
              placeholder="例如 bridge / codex-net-xxxx"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="installDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="installSubmitting" @click="submitInstallation">
          安装
        </button>
      </template>
    </ScDialog>

    <ScDialog
      v-model="imagePullVisible"
      mode="element"
      layout="default"
      theme="tech"
      skin="scifi"
      title="拉取镜像"
      width="560px"
      destroy-on-close
      class="docker-shell-dialog"
    >
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="镜像名">
            <el-input v-model="imagePullForm.imageName" placeholder="例如 nginx 或 registry.example.com/team/nginx" />
          </el-form-item>
          <el-form-item label="标签">
            <el-input v-model="imagePullForm.imageTag" placeholder="默认 latest" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="imagePullVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="imagePullSubmitting" @click="submitImagePull">
          拉取
        </button>
      </template>
    </ScDialog>

    <ScDialog
      v-model="networkDialogVisible"
      mode="element"
      layout="default"
      theme="tech"
      skin="scifi"
      title="新增网络"
      width="620px"
      destroy-on-close
      class="docker-shell-dialog"
    >
      <div class="docker-dialog-form">
        <el-form label-position="top">
          <el-form-item label="网络名称">
            <el-input v-model="networkForm.networkName" />
          </el-form-item>
          <el-form-item label="驱动">
            <el-input v-model="networkForm.driver" placeholder="bridge / overlay / macvlan" />
          </el-form-item>
          <el-form-item label="网段">
            <el-input v-model="networkForm.subnetCidr" placeholder="例如 172.18.0.0/16" />
          </el-form-item>
          <el-form-item label="网关">
            <el-input v-model="networkForm.gatewayIp" placeholder="例如 172.18.0.1" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <button type="button" class="docker-action-button" @click="networkDialogVisible = false">取消</button>
        <button type="button" class="docker-action-button is-ok" :disabled="networkSubmitting" @click="submitNetwork">
          保存
        </button>
      </template>
    </ScDialog>

    <ScTaskMessageDialog
      v-model:visible="dockerTaskDialogVisible"
      title="Docker 实时任务"
      :task="dockerTaskDialogModel"
      :loading="loading"
      @refresh="loadPageData"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { resolveRuntimeProviders } from "@layout/default";
import { DockerTopics } from "@repo/core";
import "xterm/css/xterm.css";
import ScCard from "@repo/components/ScCard";
import ScTimeText from "@repo/components/ScTimeText";
import ScTaskMessageDialog from "@repo/components/ScTaskMessageDialog";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebLinksAddon } from "xterm-addon-web-links";
import {
  createDockerInstallation,
  createDockerNetwork,
  deleteDockerContainer,
  deleteDockerImage,
  execDockerContainer,
  getDockerContainerLogs,
  getDockerServerConnection,
  listDockerContainers,
  listDockerImages,
  listDockerMounts,
  listDockerNetworks,
  listDockerRegistries,
  listDockerServerCapabilities,
  pullDockerImage,
  restartDockerContainer,
  startDockerContainer,
  startDockerContainerLogStream,
  stopDockerContainerLogStream,
  stopDockerContainer,
  updateDockerContainerConfig,
} from "../api";
import { useDockerRealtimeStream } from "../composables/useDockerRealtimeStream";
import { useDockerSocketService } from "../composables/useDockerSocketService";
import { message } from "@repo/utils";
import type {
  DockerContainerView,
  DockerImageView,
  DockerInstallRequest,
  DockerContainerConfigUpdateRequest,
  DockerMount,
  DockerNetwork,
  DockerRealtimeEnvelope,
  DockerRegistry,
  DockerServerCapabilityView,
  DockerServerConnectionConfig,
  TaskDialogModel,
  TaskDialogStep,
} from "../types";

type SectionKey = "overview" | "containers" | "images" | "mounts" | "networks" | "terminal";
type TableCell = {
  text: string;
  tone?: "ok" | "warn" | "plain";
  kind?: "badge" | "mono" | "time" | "status";
};
type TableAction = {
  key: string;
  label: string;
  icon: string;
  tone?: "ok" | "warn" | "plain";
};
type TableRow = {
  key: string;
  cells: TableCell[];
  actions?: TableAction[];
  meta?: Record<string, unknown>;
};
const sectionCatalog: Array<{
  key: SectionKey;
  serial: string;
  label: string;
  tableTitle: string;
  description: string;
  icon: string;
}> = [
  {
    key: "overview",
    serial: "01",
    label: "总览面板",
    tableTitle: "服务器资源总览",
    description: "顶部切换后只动态加载下方组件，不切路由页面。",
    icon: "ri:dashboard-line",
  },
  {
    key: "images",
    serial: "02",
    label: "镜像仓",
    tableTitle: "镜像资产",
    description: "镜像资源统一切到右侧主表展示，不再切路由。",
    icon: "ri:image-2-line",
  },
  {
    key: "containers",
    serial: "03",
    label: "容器管理",
    tableTitle: "容器清单",
    description: "当前服务器所有容器统一按主屏表格样式展示。",
    icon: "mdi:cube-outline",
  },
  {
    key: "mounts",
    serial: "04",
    label: "数据卷",
    tableTitle: "实时数据卷",
    description: "直接展示 Docker Volume 运行时数据，页面仅提供创建入口。",
    icon: "ri:database-2-line",
  },
  {
    key: "networks",
    serial: "05",
    label: "网络管理",
    tableTitle: "实时网络",
    description: "直接展示 Docker Network 运行时数据，页面仅提供创建入口。",
    icon: "ri:share-forward-2-line",
  },
  {
    key: "terminal",
    serial: "06",
    label: "容器终端",
    tableTitle: "容器终端主段",
    description: "进入容器后切到 terminal 主段执行命令，日志单独由列表日志按钮弹框查看。",
    icon: "ri:terminal-box-line",
  },
];

const route = useRoute();
const runtimeProviders = resolveRuntimeProviders({
  module: "docker.manage.runtime",
  socketName: "docker-page-global",
});
const runtimeMessage = runtimeProviders.message.provider;
const runtimeTask = runtimeProviders.task.provider;
const dockerSocketService = useDockerSocketService(runtimeProviders.socket.provider);
const {
  latest: dockerRealtimeLatestRef,
  state: dockerRealtimeState,
  logs: dockerRealtimeLogs,
  connect: connectDockerRealtimeStream,
  disconnect: disconnectDockerRealtimeStream,
} = useDockerRealtimeStream(runtimeProviders.socket.provider);
const loading = ref(false);
const loadWarnings = ref<string[]>([]);
const queryKeyword = ref("");
const activeSection = ref<SectionKey>("overview");
const containerStatusFilter = ref<"all" | "running" | "stopped">("all");
const serverContext = ref<{
  serverId?: number;
  projectId?: string;
  projectName?: string;
}>({});
const capability = ref<DockerServerCapabilityView | null>(null);
const connection = ref<DockerServerConnectionConfig | null>(null);
const containers = ref<DockerContainerView[]>([]);
const images = ref<DockerImageView[]>([]);
const mounts = ref<DockerMount[]>([]);
const networks = ref<DockerNetwork[]>([]);
const registries = ref<DockerRegistry[]>([]);
const loadToken = ref(0);
const selectedRowKey = ref("");
const actionLoadingKey = ref("");
const dockerTaskDialogVisible = ref(false);
const dockerTaskDialogModel = ref<TaskDialogModel | null>(null);
const activeContainerId = ref("");
const terminalSubmitting = ref(false);
const terminalContainer = ref<DockerContainerView | null>(null);
const terminalLogLines = ref<string[]>([]);
const terminalLogStreaming = ref(false);
const terminalLogLoading = ref(false);
const terminalLastStatus = ref("等待执行");
const terminalPluginReady = ref(false);
const dockerTerminalSessionId = ref("");
const dockerTerminalConnected = ref(false);
const containerLogDialogVisible = ref(false);
const containerLogDialogContainerId = ref("");
const containerLogDialogContainer = ref<DockerContainerView | null>(null);
const containerLogDialogLines = ref<string[]>([]);
const containerLogDialogStreaming = ref(false);
const containerLogDialogLoading = ref(false);
const configDialogVisible = ref(false);
const configSubmitting = ref(false);
const installDialogVisible = ref(false);
const installSubmitting = ref(false);
const installNetworkName = ref("");
const installForm = ref<DockerInstallRequest>({
  serverIds: [],
  imageName: "alpine",
  imageTag: "latest",
  containerName: "",
  commandLine: "sh -c \"sleep 3600\"",
  env: {},
  portMappings: [],
  mounts: [],
  networks: [],
  syncInputMounts: true,
  syncInputNetworks: true,
});
const configForm = ref<DockerContainerConfigUpdateRequest>({
  restartPolicy: "",
  cpuLimit: "",
  memoryLimit: "",
});
const imagePullVisible = ref(false);
const imagePullSubmitting = ref(false);
const imagePullForm = ref({
  imageName: "",
  imageTag: "latest",
});
const networkDialogVisible = ref(false);
const networkSubmitting = ref(false);
const networkForm = ref<DockerNetwork>({
  serverId: 0,
  networkName: "",
  driver: "bridge",
  subnetCidr: "",
  gatewayIp: "",
  attachable: true,
  internalNetwork: false,
  enabled: true,
});
const terminalPluginRef = ref<HTMLElement | null>(null);
const terminalLogRef = ref<HTMLElement | null>(null);
const containerLogDialogRef = ref<HTMLElement | null>(null);
let embeddedTerminal: Terminal | null = null;
let embeddedFitAddon: FitAddon | null = null;
let terminalInputBuffer = "";
let terminalCommandHistory: string[] = [];
let terminalHistoryCursor = -1;

const dockerSocketBadgeText = computed(() => {
  const source = runtimeProviders.log.socketSource;
  const sourceLabel =
    source === "lay-xx"
      ? "接入"
      : source === "@repo/core"
        ? "核心"
        : source === "@repo/core-named"
          ? "命名"
          : "回退";
  return dockerRealtimeState.value.connected
    ? `实时通道 · ${sourceLabel}`
    : `实时通道 · ${sourceLabel} · 等待`;
});

const dockerSocketBadgeClass = computed(() =>
  dockerRealtimeState.value.connected ? "is-ok" : "is-warn",
);

const readQueryText = (value: unknown) => Array.isArray(value) ? String(value[0] || "") : String(value || "");
const normalizeText = (value: unknown) => String(value || "").trim().toLowerCase();
const resolveSection = (value: unknown): SectionKey => {
  const target = readQueryText(value) as SectionKey;
  return sectionCatalog.some((item) => item.key === target) ? target : "overview";
};

const serverId = computed(() => Number(serverContext.value.serverId || 0) || 0);
const projectId = computed(() => readQueryText(serverContext.value.projectId));
const projectDisplayName = computed(
  () => readQueryText(serverContext.value.projectName) || (projectId.value ? `项目 #${projectId.value}` : ""),
);
const projectContextBadgeText = computed(() =>
  projectId.value ? `来源项目 ${projectDisplayName.value}` : "",
);
const serverDisplayName = computed(() => connection.value?.serverName || capability.value?.serverName || (serverId.value ? `服务器 #${serverId.value}` : "未指定服务器"));
const addressText = computed(() => {
  const host = capability.value?.host || connection.value?.serverHost || "未提供";
  const port = connection.value?.serverPort ? `:${connection.value.serverPort}` : "";
  return `${host}${port}`;
});
const connectionTypeText = computed(
  () =>
    connection.value?.connectionType?.toUpperCase() ||
    capability.value?.runtimeType ||
    "LOCAL",
);
const serverCaption = computed(
  () => [connection.value?.serverOsType || "-", connection.value?.serverType || "-", connection.value?.serverUsername || "匿名访问"].join(" / "),
);
const heroSubtitle = computed(() =>
  serverId.value
    ? projectId.value
      ? `当前页面按 serverId=${serverId.value} 读取 Docker 资源，来源项目为 ${projectDisplayName.value}。`
      : `当前页面仅依赖 serverId=${serverId.value}，由 docker 模块直接读取该服务器的连接配置与资源。`
    : "等待地址栏中的服务器信息完成解析。",
);
const runningContainerCount = computed(
  () => containers.value.filter((item) => ["running", "up", "healthy"].some((flag) => normalizeText(item.status).includes(flag))).length,
);
const stoppedContainerCount = computed(() => Math.max(containers.value.length - runningContainerCount.value, 0));
const statusToneClass = computed(() => capability.value?.dockerConnectable ? "is-ok" : "is-warn");
const runtimePanelDescription = computed(
  () => capability.value?.dockerConnectable
    ? `${serverDisplayName.value} 已连通 Docker，首页主屏只展示运行态与容器主表。`
    : `${serverDisplayName.value} 当前处于待探测状态，仍可查看已同步的主表数据。`,
);

const containerStatusFilters = [
  { key: "all", label: "全部", icon: "ri:apps-2-line" },
  { key: "running", label: "运行中", icon: "ri:play-circle-line" },
  { key: "stopped", label: "已停止", icon: "ri:stop-circle-line" },
] as const;

const keyword = computed(() => normalizeText(queryKeyword.value));
const matchKeyword = (...fields: Array<unknown>) =>
  !keyword.value || fields.some((field) => normalizeText(field).includes(keyword.value));

const isRunningStatus = (value: unknown) =>
  ["running", "up", "healthy"].some((flag) => normalizeText(value).includes(flag));

const filteredContainers = computed(() =>
  containers.value.filter((item) =>
    matchKeyword(item.containerName, item.imageName, item.imageTag, item.status, item.ports),
  ),
);
const filteredContainersByStatus = computed(() => {
  if (containerStatusFilter.value === "running") {
    return filteredContainers.value.filter((item) => isRunningStatus(item.status));
  }
  if (containerStatusFilter.value === "stopped") {
    return filteredContainers.value.filter((item) => !isRunningStatus(item.status));
  }
  return filteredContainers.value;
});
const filteredImages = computed(() =>
  images.value.filter((item) =>
    matchKeyword(item.imageName, item.imageTag, item.status, item.imageId),
  ),
);
const filteredMounts = computed(() =>
  mounts.value.filter((item) =>
    matchKeyword(item.mountName, item.hostPath, item.containerPath, item.mountType),
  ),
);
const filteredNetworks = computed(() =>
  networks.value.filter((item) =>
    matchKeyword(item.networkName, item.driver, item.subnetCidr, item.gatewayIp),
  ),
);

const navItems = computed(() =>
  sectionCatalog
    .filter((item) => item.key !== "terminal")
    .map((item) => ({
    ...item,
    count:
      item.key === "overview"
        ? String(containers.value.length + images.value.length + mounts.value.length + networks.value.length)
        : item.key === "containers"
          ? String(containers.value.length)
          : item.key === "images"
            ? String(images.value.length)
            : item.key === "mounts"
              ? String(mounts.value.length)
              : String(networks.value.length),
    })),
);
const activeSectionMeta = computed(() => sectionCatalog.find((item) => item.key === activeSection.value) || sectionCatalog[0]);
const terminalContainerTitle = computed(() =>
  terminalContainer.value?.containerName
    ? `容器终端 · ${terminalContainer.value.containerName}`
    : "容器终端工作区",
);
const terminalContainerDescription = computed(() =>
  terminalContainer.value?.containerId
    ? `${terminalContainer.value.containerId} · ${terminalContainer.value.imageName || "-"}:${terminalContainer.value.imageTag || "latest"}`
    : "选择容器后进入 terminal 主段执行命令。",
);
const terminalLogHint = computed(() =>
  terminalLogStreaming.value
    ? "当前已通过 socket 接收增量日志。"
    : "当前显示最近一次日志快照，可点击“开始订阅”接收实时日志。",
);
const containerLogDialogTitle = computed(() =>
  containerLogDialogContainer.value?.containerName
    ? `容器日志 · ${containerLogDialogContainer.value.containerName}`
    : "容器日志",
);
const containerLogDialogHint = computed(() =>
  containerLogDialogStreaming.value
    ? "当前日志弹框已通过 socket 接收增量日志。"
    : "当前显示最近一次日志快照，可点击“开始订阅”接收实时日志。",
);

const formatBytes = (value?: number) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = size;
  let index = 0;
  while (current >= 1024 && index < units.length - 1) {
    current /= 1024;
    index += 1;
  }
  return `${current.toFixed(index === 0 ? 0 : 4)} ${units[index]}`;
};

const formatDateTime = (value?: number) => {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
};

const formatTerminalTime = (value?: number) => {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "--:--:--";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`;
};

const formatDurationFromCreatedAt = (value?: number, running?: boolean) => {
  const timestamp = Number(value || 0);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
  const delta = Math.max(Date.now() - timestamp, 0);
  const seconds = Math.floor(delta / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${running ? "已运行" : "已存在"} ${days}天 ${hours}小时`;
  if (hours > 0) return `${running ? "已运行" : "已存在"} ${hours}小时 ${minutes}分钟`;
  return `${running ? "已运行" : "已存在"} ${Math.max(minutes, 1)}分钟`;
};

const formatContainerStatusText = (value?: string) => {
  const text = normalizeText(value);
  if (["running", "up", "healthy"].some((item) => text.includes(item))) return "运行中";
  if (["paused"].some((item) => text.includes(item))) return "已暂停";
  if (["created"].some((item) => text.includes(item))) return "已创建";
  if (["restarting"].some((item) => text.includes(item))) return "重启中";
  if (["dead", "exited", "stopped", "down"].some((item) => text.includes(item))) return "已停止";
  if (!text) return "-";
  return String(value);
};

const formatImageStatusText = (value?: string) => {
  const text = normalizeText(value);
  if (!text || text === "available") return "可用";
  return String(value);
};

const formatSourceTypeText = (value?: string) => {
  const text = normalizeText(value);
  if (text === "runtime") return "运行时";
  if (text === "manual") return "手工";
  if (!text) return "-";
  return String(value);
};

const formatNetworkDriverText = (value?: string) => {
  const text = normalizeText(value);
  if (text === "bridge") return "桥接";
  if (text === "host") return "主机";
  if (text === "null") return "空网络";
  if (text === "overlay") return "覆盖网络";
  if (!text) return "-";
  return String(value);
};

const resolveTone = (value: unknown): TableCell["tone"] => {
  const text = normalizeText(value);
  if (["running", "up", "healthy", "enabled", "bridge", "available"].some((item) => text.includes(item))) return "ok";
  if (["stopped", "down", "disabled", "error", "none"].some((item) => text.includes(item))) return "warn";
  return "plain";
};

const containerTable = computed<{ headers: string[]; rows: TableRow[] }>(() => ({
  headers: ["容器编号", "容器名称", "状态", "镜像", "端口", "创建时间", "运行时间", "操作"],
  rows: filteredContainersByStatus.value.slice(0, 8).map((item) => ({
    key: item.containerId,
    cells: [
      { text: item.containerId || "-", kind: "mono" },
      { text: item.containerName || "-" },
      { text: formatContainerStatusText(item.status), tone: resolveTone(item.status), kind: "status" },
      { text: `${item.imageName || "-"}:${item.imageTag || "latest"}` },
      { text: item.ports || "-" },
      { text: formatDateTime(item.createdAt), kind: "time" },
      { text: formatDurationFromCreatedAt(item.createdAt, isRunningStatus(item.status)) },
    ],
    actions: [
      isRunningStatus(item.status)
        ? { key: "stop", label: "停止", icon: "ri:stop-circle-line", tone: "warn" }
        : { key: "start", label: "启动", icon: "ri:play-circle-line", tone: "ok" },
      { key: "restart", label: "重启", icon: "ri:restart-line", tone: "plain" },
      { key: "exec", label: "终端", icon: "ri:terminal-box-line", tone: "plain" },
      { key: "logs", label: "日志", icon: "ri:file-list-3-line", tone: "plain" },
      { key: "config", label: "配置", icon: "ri:settings-3-line", tone: "plain" },
      { key: "remove", label: "删除", icon: "ri:delete-bin-6-line", tone: "warn" },
    ],
    meta: { containerId: item.containerId, status: item.status },
  })),
}));

const activeTable = computed<{ headers: string[]; rows: TableRow[] }>(() => {
  if (activeSection.value === "containers") {
    return {
      headers: containerTable.value.headers,
      rows: containerTable.value.rows,
    };
  }
  if (activeSection.value === "images") {
    return {
      headers: ["镜像编号", "镜像名", "标签", "大小", "创建时间", "状态", "操作"],
      rows: filteredImages.value.slice(0, 10).map((item) => ({
        key: item.imageId,
        cells: [
          { text: item.imageId || "-", kind: "mono" },
          { text: item.imageName || "-" },
          { text: item.imageTag || "-" },
          { text: formatBytes(item.sizeBytes) },
          { text: formatDateTime(item.createdAt), kind: "time" },
          { text: formatImageStatusText(item.status || "AVAILABLE"), tone: resolveTone(item.status || "available"), kind: "badge" },
        ],
        actions: [
          { key: "pull", label: "拉取", icon: "ri:download-2-line", tone: "ok" },
          { key: "remove", label: "删除", icon: "ri:delete-bin-6-line", tone: "warn" },
        ],
        meta: { imageId: item.imageId },
      })),
    };
  }
  if (activeSection.value === "mounts") {
    return {
      headers: ["数据卷", "挂载点", "驱动", "来源", "状态", "操作"],
      rows: filteredMounts.value.slice(0, 10).map((item) => ({
        key: String(item.mountName || item.hostPath || "-"),
        cells: [
          { text: item.mountName || "-" },
          { text: item.hostPath || "-", kind: "mono" },
          { text: formatNetworkDriverText(item.mountType || "local") },
          { text: formatSourceTypeText(item.sourceType || "runtime"), kind: "badge" },
          { text: item.enabled === false ? "禁用" : "启用", tone: resolveTone(item.enabled === false ? "disabled" : "enabled"), kind: "badge" },
        ],
        actions: [],
        meta: {},
      })),
    };
  }
  return {
    headers: ["网络名", "驱动", "网段", "网关", "状态", "操作"],
    rows: filteredNetworks.value.slice(0, 10).map((item) => ({
      key: String(item.networkName || "-"),
        cells: [
          { text: item.networkName || "-" },
          { text: formatNetworkDriverText(item.driver || "-") },
          { text: item.subnetCidr || "-", kind: "mono" },
          { text: item.gatewayIp || "-" },
          { text: item.enabled === false ? "禁用" : "启用", tone: resolveTone(item.enabled === false ? "disabled" : "enabled"), kind: "badge" },
      ],
      actions: [],
      meta: {},
    })),
  };
});

const overviewCards = computed(() => [
  {
    key: "images" as SectionKey,
    icon: "ri:image-2-line",
    title: "镜像仓",
    count: images.value.length,
    description: `${images.value.length} 个镜像资产`,
  },
  {
    key: "mounts" as SectionKey,
    icon: "ri:database-2-line",
    title: "数据卷",
    count: mounts.value.length,
    description: `${mounts.value.length} 个实时数据卷`,
  },
  {
    key: "networks" as SectionKey,
    icon: "ri:share-forward-2-line",
    title: "网络管理",
    count: networks.value.length,
    description: `${networks.value.length} 个实时网络`,
  },
]);

const switchSection = (next: SectionKey) => {
  activeSection.value = next;
  containerStatusFilter.value = "all";
  if (typeof window !== "undefined") {
    const current = window.location.hash || "#/docker";
    const [pathPart, queryPart = ""] = current.slice(1).split("?");
    const params = new URLSearchParams(queryPart);
    params.set("tab", next);
    if (serverId.value) {
      params.set("serverId", String(serverId.value));
    }
    if (projectId.value) {
      params.set("projectId", projectId.value);
    }
    if (projectDisplayName.value) {
      params.set("projectName", projectDisplayName.value);
    }
    window.history.replaceState(window.history.state, "", `#${pathPart}?${params.toString()}`);
  }
};

const refreshPageData = () => {
  void loadPageData();
};

const resolveDockerRowClassName = ({ row }: { row: TableRow }) =>
  selectedRowKey.value === row.key ? "docker-table-row--selected" : "";

const handleRowAction = (section: SectionKey, row: TableRow, actionKey: string) => {
  selectedRowKey.value = row.key;
  void runRowAction(section, row, actionKey);
};

const scrollTerminalPanelsToBottom = () => {
  requestAnimationFrame(() => {
    if (terminalLogRef.value) {
      terminalLogRef.value.scrollTop = terminalLogRef.value.scrollHeight;
    }
    if (containerLogDialogRef.value) {
      containerLogDialogRef.value.scrollTop = containerLogDialogRef.value.scrollHeight;
    }
  });
};

const getTerminalPrompt = () =>
  `docker@${terminalContainer.value?.containerName || "container"} $ `;

const writeTerminalLine = (text = "", options?: { preserveIndent?: boolean }) => {
  if (!embeddedTerminal) return;
  const normalized = options?.preserveIndent
    ? text.replace(/\r?\n/g, "\r\n")
    : text
        .split(/\r?\n/)
        .map((line) => line.trimEnd())
        .join("\r\n");
  embeddedTerminal.write(`${normalized}\r\n`);
};

const renderTerminalPrompt = () => {
  if (!embeddedTerminal) return;
  embeddedTerminal.write(getTerminalPrompt());
};

const clearEmbeddedTerminal = () => {
  if (!embeddedTerminal) return;
  embeddedTerminal.clear();
  renderTerminalPrompt();
};

const copyTerminalSelection = async () => {
  if (!embeddedTerminal) return;
  const selection = embeddedTerminal.getSelection();
  if (!selection) {
    message("请先在终端中选择内容", { type: "warning" });
    return;
  }
  try {
    await navigator.clipboard.writeText(selection);
    message("终端选中内容已复制", { type: "success" });
  } catch (error: any) {
    message(error?.message || "复制终端内容失败", { type: "error" });
  }
};

const tokenizeTerminalCommand = (raw: string) => {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | "" = "";
  let escaping = false;

  for (const char of raw) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (quote) {
      if (char === quote) {
        quote = "";
      } else {
        current += char;
      }
      continue;
    }
    if (char === "'" || char === "\"") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += char;
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
};

const executeTerminalCommand = async (rawCommand: string) => {
  if (!activeContainerId.value || !rawCommand.trim() || !dockerTerminalSessionId.value) {
    return;
  }
  terminalSubmitting.value = true;
  terminalLastStatus.value = "执行中";
  try {
    dockerSocketService.ensureConnected()?.emit(
      DockerTopics.EVENTS.TERMINAL_INPUT,
      JSON.stringify({
        dockerTerminalSessionId: dockerTerminalSessionId.value,
        containerId: activeContainerId.value,
        serverId: serverId.value,
        command: rawCommand.trim(),
      }),
    );
  } catch (error: any) {
    writeTerminalLine(error?.message || "执行失败", { preserveIndent: true });
    terminalLastStatus.value = "执行失败";
  }
};

const emitDockerTerminalResize = () => {
  if (!dockerTerminalSessionId.value || !embeddedTerminal) {
    return;
  }
  dockerSocketService.ensureConnected()?.emit(
    DockerTopics.EVENTS.TERMINAL_RESIZE,
    JSON.stringify({
      dockerTerminalSessionId: dockerTerminalSessionId.value,
      containerId: activeContainerId.value,
      serverId: serverId.value,
      cols: embeddedTerminal.cols,
      rows: embeddedTerminal.rows,
    }),
  );
};

const connectDockerTerminalSession = () => {
  if (!activeContainerId.value) {
    return;
  }
  dockerTerminalSessionId.value = `docker-terminal-${activeContainerId.value}-${Date.now()}`;
  dockerTerminalConnected.value = false;
  dockerSocketService.ensureConnected()?.emit(
    DockerTopics.EVENTS.TERMINAL_CONNECT,
    JSON.stringify({
      dockerTerminalSessionId: dockerTerminalSessionId.value,
      containerId: activeContainerId.value,
      serverId: serverId.value,
      cols: embeddedTerminal?.cols || 120,
      rows: embeddedTerminal?.rows || 32,
    }),
  );
};

const disconnectDockerTerminalSession = () => {
  if (!dockerTerminalSessionId.value) {
    return;
  }
  dockerSocketService.ensureConnected()?.emit(
    DockerTopics.EVENTS.TERMINAL_DISCONNECT,
    JSON.stringify({
      dockerTerminalSessionId: dockerTerminalSessionId.value,
      containerId: activeContainerId.value,
      serverId: serverId.value,
    }),
  );
  dockerTerminalConnected.value = false;
  dockerTerminalSessionId.value = "";
};

const initEmbeddedTerminal = async () => {
  await nextTick();
  if (!terminalPluginRef.value) return;
  if (!embeddedTerminal) {
    embeddedTerminal = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Consolas, "Courier New", monospace',
      theme: {
        background: "#02080e",
        foreground: "#eafcff",
        cursor: "#42f5e6",
        selectionBackground: "rgba(66, 245, 230, 0.24)",
      },
      convertEol: true,
      scrollback: 3000,
      allowProposedApi: false,
    });
    embeddedFitAddon = new FitAddon();
    embeddedTerminal.loadAddon(embeddedFitAddon);
    embeddedTerminal.loadAddon(new WebLinksAddon());
    embeddedTerminal.open(terminalPluginRef.value);
    embeddedTerminal.onData(async (data: string) => {
      if (terminalSubmitting.value) {
        return;
      }
      if (data === "\r") {
        const command = terminalInputBuffer;
        embeddedTerminal?.write("\r\n");
        if (command.trim()) {
          terminalCommandHistory = [...terminalCommandHistory, command];
        }
        terminalHistoryCursor = terminalCommandHistory.length;
        terminalInputBuffer = "";
        await executeTerminalCommand(command);
        return;
      }
      if (data === "\u007F") {
        if (terminalInputBuffer.length > 0) {
          terminalInputBuffer = terminalInputBuffer.slice(0, -1);
          embeddedTerminal?.write("\b \b");
        }
        return;
      }
      if (data === "\u0003") {
        terminalInputBuffer = "";
        embeddedTerminal?.write("^C\r\n");
        terminalLastStatus.value = "已中断";
        renderTerminalPrompt();
        return;
      }
      if (data === "\u000c") {
        clearEmbeddedTerminal();
        terminalInputBuffer = "";
        return;
      }
      if (data === "\u001b[A") {
        if (!terminalCommandHistory.length) return;
        if (terminalHistoryCursor > 0) {
          terminalHistoryCursor -= 1;
        } else {
          terminalHistoryCursor = 0;
        }
        const next = terminalCommandHistory[terminalHistoryCursor] || "";
        while (terminalInputBuffer.length > 0) {
          embeddedTerminal?.write("\b \b");
          terminalInputBuffer = terminalInputBuffer.slice(0, -1);
        }
        terminalInputBuffer = next;
        embeddedTerminal?.write(next);
        return;
      }
      if (data === "\u001b[B") {
        if (!terminalCommandHistory.length) return;
        if (terminalHistoryCursor < terminalCommandHistory.length - 1) {
          terminalHistoryCursor += 1;
          const next = terminalCommandHistory[terminalHistoryCursor] || "";
          while (terminalInputBuffer.length > 0) {
            embeddedTerminal?.write("\b \b");
            terminalInputBuffer = terminalInputBuffer.slice(0, -1);
          }
          terminalInputBuffer = next;
          embeddedTerminal?.write(next);
          return;
        }
        while (terminalInputBuffer.length > 0) {
          embeddedTerminal?.write("\b \b");
          terminalInputBuffer = terminalInputBuffer.slice(0, -1);
        }
        terminalHistoryCursor = terminalCommandHistory.length;
        return;
      }
      if (data >= " " || data === "\t") {
        terminalInputBuffer += data;
        embeddedTerminal?.write(data);
      }
    });
  }
  embeddedFitAddon?.fit();
  embeddedTerminal.focus();
  terminalPluginReady.value = true;
  emitDockerTerminalResize();
};

const refreshTerminalLogs = async () => {
  if (!activeContainerId.value) return;
  terminalLogLoading.value = true;
  try {
    const result = await getDockerContainerLogs(activeContainerId.value, {
      serverId: serverId.value,
      lines: 200,
    });
    terminalLogLines.value = String(result.data || "")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .slice(-300);
    scrollTerminalPanelsToBottom();
  } catch (error: any) {
    writeTerminalLine(error?.message || "读取容器日志失败");
  } finally {
    terminalLogLoading.value = false;
  }
};

const stopTerminalLogStream = async () => {
  if (!activeContainerId.value || !terminalLogStreaming.value) return;
  try {
    await stopDockerContainerLogStream(activeContainerId.value);
  } catch (_) {
    // 忽略停止失败，避免影响页面切换
  } finally {
    terminalLogStreaming.value = false;
  }
};

const startTerminalLogStream = async () => {
  if (!activeContainerId.value) return;
  terminalLogLoading.value = true;
  try {
    await startDockerContainerLogStream(activeContainerId.value, {
      serverId: serverId.value,
      lines: 200,
    });
    terminalLogStreaming.value = true;
    await refreshTerminalLogs();
  } catch (error: any) {
    terminalLogStreaming.value = false;
    writeTerminalLine(error?.message || "启动容器日志订阅失败");
  } finally {
    terminalLogLoading.value = false;
  }
};

const toggleTerminalLogStream = async () => {
  if (terminalLogStreaming.value) {
    await stopTerminalLogStream();
    return;
  }
  await startTerminalLogStream();
};

const openTerminalWorkspace = async (containerId: string) => {
  await stopTerminalLogStream();
  activeContainerId.value = containerId;
  terminalContainer.value =
    containers.value.find((item) => item.containerId === containerId) || null;
  terminalLogLines.value = [];
  terminalLastStatus.value = "终端插件已就绪";
  terminalPluginReady.value = false;
  dockerTerminalSessionId.value = "";
  dockerTerminalConnected.value = false;
  terminalInputBuffer = "";
  if (embeddedTerminal) {
    embeddedTerminal.clear();
  }
  switchSection("terminal");
  await initEmbeddedTerminal();
  writeTerminalLine(`已进入容器 ${terminalContainer.value?.containerName || containerId}`);
  writeTerminalLine("支持回车执行、方向键历史、Ctrl+C 中断、Ctrl+L 清屏；命令通过 docker socket 异步执行。");
  renderTerminalPrompt();
  connectDockerTerminalSession();
  await refreshTerminalLogs();
  await startTerminalLogStream();
};

const refreshContainerLogDialog = async () => {
  if (!containerLogDialogContainerId.value) return;
  containerLogDialogLoading.value = true;
  try {
    const result = await getDockerContainerLogs(containerLogDialogContainerId.value, {
      serverId: serverId.value,
      lines: 200,
    });
    containerLogDialogLines.value = String(result.data || "")
      .split(/\r?\n/)
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .slice(-300);
    scrollTerminalPanelsToBottom();
  } catch (error: any) {
    message(error?.message || "读取容器日志失败", { type: "error" });
  } finally {
    containerLogDialogLoading.value = false;
  }
};

const stopContainerLogDialogStream = async () => {
  if (!containerLogDialogContainerId.value || !containerLogDialogStreaming.value) return;
  try {
    await stopDockerContainerLogStream(containerLogDialogContainerId.value);
  } catch (_) {
    // 忽略停止失败，避免影响弹框关闭
  } finally {
    containerLogDialogStreaming.value = false;
  }
};

const startContainerLogDialogStream = async () => {
  if (!containerLogDialogContainerId.value) return;
  containerLogDialogLoading.value = true;
  try {
    await startDockerContainerLogStream(containerLogDialogContainerId.value, {
      serverId: serverId.value,
      lines: 200,
    });
    containerLogDialogStreaming.value = true;
    await refreshContainerLogDialog();
  } catch (error: any) {
    containerLogDialogStreaming.value = false;
    message(error?.message || "启动容器日志订阅失败", { type: "error" });
  } finally {
    containerLogDialogLoading.value = false;
  }
};

const toggleContainerLogDialogStream = async () => {
  if (containerLogDialogStreaming.value) {
    await stopContainerLogDialogStream();
    return;
  }
  await startContainerLogDialogStream();
};

const openContainerLogDialog = async (containerId: string) => {
  await stopContainerLogDialogStream();
  containerLogDialogContainerId.value = containerId;
  containerLogDialogContainer.value =
    containers.value.find((item) => item.containerId === containerId) || null;
  containerLogDialogLines.value = [];
  containerLogDialogVisible.value = true;
  await refreshContainerLogDialog();
  await startContainerLogDialogStream();
};

const resetContainerLogDialog = () => {
  containerLogDialogContainerId.value = "";
  containerLogDialogContainer.value = null;
  containerLogDialogLines.value = [];
  containerLogDialogStreaming.value = false;
  containerLogDialogLoading.value = false;
};

const openConfigDialog = (containerId: string) => {
  activeContainerId.value = containerId;
  configForm.value = {
    restartPolicy: "",
    cpuLimit: "",
    memoryLimit: "",
  };
  configDialogVisible.value = true;
};

const openInstallDialog = () => {
  installForm.value = {
    serverIds: serverId.value ? [serverId.value] : [],
    imageName: "alpine",
    imageTag: "latest",
    containerName: `codex-e2e-${Date.now()}`,
    commandLine: "sh -c \"sleep 3600\"",
    env: {},
    portMappings: [],
    mounts: [],
    networks: [],
    syncInputMounts: true,
    syncInputNetworks: true,
  };
  installNetworkName.value = "";
  installDialogVisible.value = true;
};

const openImagePullDialog = () => {
  imagePullForm.value = {
    imageName: "",
    imageTag: "latest",
  };
  imagePullVisible.value = true;
};

const openNetworkDialog = () => {
  networkForm.value = {
    serverId: serverId.value,
    networkName: "",
    driver: "bridge",
    subnetCidr: "",
    gatewayIp: "",
    attachable: true,
    internalNetwork: false,
    enabled: true,
  };
  networkDialogVisible.value = true;
};

const resolveDockerTaskStatus = (status?: string | null) => {
  const normalized = String(status || "RUNNING").toUpperCase();
  if (normalized === "SUCCESS") return "SUCCESS";
  if (normalized === "FAILED" || normalized === "ERROR" || normalized === "CANCELLED") return "FAILED";
  return "RUNNING";
};

const resolveDockerRuntimeTaskState = (status?: string | null) => {
  const normalized = resolveDockerTaskStatus(status);
  if (normalized === "SUCCESS") return "success";
  if (normalized === "FAILED") return "error";
  return "running";
};

const resolveDockerTaskTitle = (payload?: Record<string, unknown> | null) => {
  const scope = String(payload?.scope || "");
  const stepKey = String(payload?.stepKey || "");
  if (scope === "install") {
    return "容器安装";
  }
  if (scope === "operation") {
    if (stepKey.includes("image.pull")) return "镜像拉取";
    if (stepKey.includes("image.import")) return "镜像导入";
    if (stepKey.includes("image.export")) return "镜像导出";
    return "Docker 操作";
  }
  if (scope === "images") return "镜像同步";
  if (scope === "containers") return "容器同步";
  return "Docker 任务";
};

const resolveDockerStepTitle = (stepKey?: string | null, scope?: string | null) => {
  const normalized = String(stepKey || "").toLowerCase();
  if (scope === "install") {
    const installMap: Record<string, string> = {
      servers: "选择服务器",
      "registry-image": "仓库与镜像",
      "container-config": "容器参数",
      dockerfile: "Dockerfile",
      confirm: "确认执行",
    };
    return installMap[normalized] || (normalized ? normalized : "安装执行");
  }
  if (normalized.includes("image.pull")) return "镜像拉取";
  if (normalized.includes("image.import")) return "镜像导入";
  if (normalized.includes("image.export")) return "镜像导出";
  if (scope === "images") return "镜像同步";
  if (scope === "containers") return "容器同步";
  return stepKey || "任务执行";
};

const resolveDockerSummaryItems = (
  payload: Record<string, unknown>,
  taskId: string,
) => {
  const detail =
    payload.detail && typeof payload.detail === "object"
      ? (payload.detail as Record<string, unknown>)
      : {};
  const target = String(detail.target || detail.imageName || "");
  const operationType = String(detail.operationType || payload.stepKey || "");
  return [
    {
      label: "任务类型",
      value: resolveDockerTaskTitle(payload),
    },
    {
      label: "任务编号",
      value: taskId,
    },
    {
      label: "服务器",
      value: String(detail.serverId || serverId.value || "-"),
    },
    {
      label: "目标",
      value: target || operationType || "-",
    },
  ];
};

const mergeDockerTaskStep = (
  steps: TaskDialogStep[],
  payload: Record<string, unknown>,
  messageText: string,
  updatedAt: number,
) => {
  const stepKey = String(payload.stepKey || payload.scope || "docker-task");
  const nextSteps = [...steps];
  const exists = nextSteps.find(item => item.stepKey === stepKey);
  if (exists) {
    exists.status = resolveDockerTaskStatus(String(payload.status || ""));
    exists.message = messageText;
    exists.updatedAt = updatedAt;
    return nextSteps;
  }
  nextSteps.push({
    stepKey,
    title: resolveDockerStepTitle(String(payload.stepKey || ""), String(payload.scope || "")),
    status: resolveDockerTaskStatus(String(payload.status || "")),
    message: messageText,
    updatedAt,
  });
  return nextSteps;
};

const upsertDockerRealtimeTask = (envelope: DockerRealtimeEnvelope | null) => {
  const payload = (envelope?.data || null) as Record<string, unknown> | null;
  const taskId = String(envelope?.dataId || payload?.taskId || "").trim();
  if (!payload || !taskId) {
    return;
  }
  const now = Date.now();
  const status = resolveDockerTaskStatus(String(payload.status || ""));
  const messageText = String(payload.message || payload.line || "Docker 任务更新");
  const current = dockerTaskDialogModel.value?.taskId === taskId ? dockerTaskDialogModel.value : null;
  const nextLogs = dockerRealtimeLogs.value[taskId] ? [...dockerRealtimeLogs.value[taskId]] : (current?.logs || []);
  const nextSteps = mergeDockerTaskStep(current?.steps || [], payload, messageText, now);
  const nextTask: TaskDialogModel = {
    taskId,
    status,
    message: messageText,
    serverIds: current?.serverIds || [String((payload.detail as Record<string, unknown> | undefined)?.serverId || serverId.value || "-")],
    imageName: current?.imageName,
    imageTag: current?.imageTag,
    summaryItems: resolveDockerSummaryItems(payload, taskId),
    errorSummary: status === "FAILED" ? messageText : undefined,
    logs: nextLogs,
    createdAt: current?.createdAt || now,
    updatedAt: now,
    steps: nextSteps,
  };
  dockerTaskDialogModel.value = nextTask;

  runtimeTask.updateTask(taskId, {
    requestId: taskId,
    title: resolveDockerTaskTitle(payload),
    description: serverDisplayName.value ? `服务器 ${serverDisplayName.value}` : undefined,
    status: resolveDockerRuntimeTaskState(String(payload.status || "")),
    progress: Number.isFinite(Number(payload.progressPercent))
      ? Math.max(0, Math.min(100, Number(payload.progressPercent)))
      : status === "SUCCESS"
        ? 100
        : 40,
    source: "system",
    mode: "stream",
    message: messageText,
    stageLabel: resolveDockerStepTitle(String(payload.stepKey || ""), String(payload.scope || "")),
  });

  if (payload.line) {
    runtimeTask.appendMessage(taskId, { content: String(payload.line) });
  }

  if (payload.scope === "install" || payload.scope === "operation") {
    dockerTaskDialogVisible.value = true;
  }

  if (payload.finished === true) {
    if (status === "SUCCESS") {
      runtimeTask.finishTask(taskId, { message: messageText, progress: 100 });
      runtimeMessage.success(messageText);
    } else if (status === "FAILED") {
      runtimeTask.failTask(taskId, { message: messageText });
      runtimeMessage.error(messageText);
    }
    void loadPageData();
  }
};

const runRowAction = async (section: SectionKey, row: TableRow, actionKey: string) => {
  const actionId = `${section}:${row.key}:${actionKey}`;
  actionLoadingKey.value = actionId;
  try {
    if (section === "containers") {
      const containerId = String(row.meta?.containerId || row.key || "");
      if (!containerId) return;
      if (actionKey === "start") {
        await startDockerContainer(containerId);
        message("容器已启动", { type: "success" });
      } else if (actionKey === "stop") {
        await stopDockerContainer(containerId);
        message("容器已停止", { type: "success" });
      } else if (actionKey === "restart") {
        await restartDockerContainer(containerId);
        message("容器已重启", { type: "success" });
      } else if (actionKey === "exec") {
        await openTerminalWorkspace(containerId);
        return;
      } else if (actionKey === "logs") {
        await openContainerLogDialog(containerId);
        return;
      } else if (actionKey === "config") {
        openConfigDialog(containerId);
        return;
      } else if (actionKey === "remove") {
        if (typeof window !== "undefined" && !window.confirm(`确认删除容器 ${containerId}？`)) return;
        await deleteDockerContainer(containerId, true);
        message("容器已删除", { type: "success" });
      }
      await loadPageData();
      return;
    }

    if (section === "images") {
      const imageId = String(row.meta?.imageId || row.key || "");
      if (!imageId) return;
      if (actionKey === "pull") {
        imagePullForm.value.imageName = imageId;
        imagePullVisible.value = true;
        return;
      }
      if (typeof window !== "undefined" && !window.confirm(`确认删除镜像 ${imageId}？`)) return;
      await deleteDockerImage(imageId, { serverId: serverId.value, force: true });
      message("镜像已删除", { type: "success" });
      await loadPageData();
      return;
    }

    if (section === "mounts" || section === "networks") return;
  } catch (error: any) {
    message(error?.message || "Docker 操作失败", { type: "error" });
  } finally {
    actionLoadingKey.value = "";
  }
};

const submitTerminalCommand = async () => {
  if (!terminalInputBuffer.trim()) {
    message("请输入要执行的命令", { type: "warning" });
    return;
  }
  const rawCommand = terminalInputBuffer;
  terminalInputBuffer = "";
  embeddedTerminal?.write("\r\n");
  await executeTerminalCommand(rawCommand);
};

const submitContainerConfig = async () => {
  if (!activeContainerId.value) return;
  configSubmitting.value = true;
  try {
    await updateDockerContainerConfig(activeContainerId.value, configForm.value);
    message("容器配置已提交", { type: "success" });
    configDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "保存容器配置失败", { type: "error" });
  } finally {
    configSubmitting.value = false;
  }
};

const submitInstallation = async () => {
  if (!serverId.value) {
    message("缺少 serverId，无法安装容器", { type: "warning" });
    return;
  }
  if (!installForm.value.imageName?.trim()) {
    message("请输入镜像名", { type: "warning" });
    return;
  }
  if (!installForm.value.containerName?.trim()) {
    message("请输入容器名称", { type: "warning" });
    return;
  }
  installSubmitting.value = true;
  try {
    const payload: DockerInstallRequest = {
      ...installForm.value,
      serverIds: [serverId.value],
      imageName: installForm.value.imageName.trim(),
      imageTag: installForm.value.imageTag?.trim() || "latest",
      containerName: installForm.value.containerName.trim(),
      commandLine: installForm.value.commandLine?.trim() || "",
      networks: installNetworkName.value.trim()
        ? [{ networkName: installNetworkName.value.trim(), driver: "bridge" }]
        : [],
      mounts: [],
      portMappings: [],
      syncInputMounts: true,
      syncInputNetworks: true,
    };
    const result = await createDockerInstallation(payload);
    message(result.data?.message || result.message || "安装任务已执行", { type: "success" });
    installDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "安装容器失败", { type: "error" });
  } finally {
    installSubmitting.value = false;
  }
};

const submitImagePull = async () => {
  if (!imagePullForm.value.imageName.trim()) {
    message("请输入镜像名", { type: "warning" });
    return;
  }
  imagePullSubmitting.value = true;
  try {
    const result = await pullDockerImage({
      serverId: serverId.value,
      imageName: imagePullForm.value.imageName.trim(),
      imageTag: imagePullForm.value.imageTag.trim() || "latest",
    });
    if (result.data?.operationId && !dockerTaskDialogModel.value) {
      runtimeTask.updateTask(result.data.operationId, {
        requestId: result.data.operationId,
        title: "镜像拉取",
        description: `服务器 ${serverDisplayName.value}`,
        status: resolveDockerRuntimeTaskState(result.data.status),
        progress: result.data.status === "SUCCESS" ? 100 : 20,
        source: "system",
        mode: "stream",
        message: result.data.message,
        stageLabel: "镜像拉取",
      });
    }
    imagePullVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "拉取镜像失败", { type: "error" });
  } finally {
    imagePullSubmitting.value = false;
  }
};

const submitNetwork = async () => {
  if (!networkForm.value.networkName?.trim()) {
    message("请输入网络名称", { type: "warning" });
    return;
  }
  networkSubmitting.value = true;
  try {
    const payload = {
      ...networkForm.value,
      serverId: serverId.value,
      networkName: networkForm.value.networkName.trim(),
      driver: networkForm.value.driver?.trim() || "bridge",
      subnetCidr: networkForm.value.subnetCidr?.trim() || "",
      gatewayIp: networkForm.value.gatewayIp?.trim() || "",
    };
    await createDockerNetwork(payload);
    message("网络已创建", { type: "success" });
    networkDialogVisible.value = false;
    await loadPageData();
  } catch (error: any) {
    message(error?.message || "创建网络失败", { type: "error" });
  } finally {
    networkSubmitting.value = false;
  }
};

const loadPageData = async () => {
  const currentToken = ++loadToken.value;
  loading.value = true;
  loadWarnings.value = [];
  capability.value = null;
  connection.value = null;
  containers.value = [];
  images.value = [];
  mounts.value = [];
  networks.value = [];
  registries.value = [];

  serverContext.value = {
    serverId: Number(readQueryText(route.query.serverId) || 0) || undefined,
    projectId: readQueryText(route.query.projectId) || undefined,
    projectName: readQueryText(route.query.projectName) || undefined,
  };
  const currentServerId = serverId.value;
  if (!currentServerId) {
    loadWarnings.value = ["地址栏缺少 serverId，无法加载该服务器的 Docker 数据"];
    loading.value = false;
    return;
  }

  const results = await Promise.allSettled([
    listDockerServerCapabilities({ serverId: currentServerId }),
    getDockerServerConnection(currentServerId),
    listDockerContainers({ serverId: currentServerId }),
    listDockerImages({ serverId: currentServerId }),
    listDockerMounts({ serverId: currentServerId }),
    listDockerNetworks({ serverId: currentServerId }),
    listDockerRegistries({ enabled: true }),
  ]);
  if (currentToken !== loadToken.value) return;

  const [capabilityResult, connectionResult, containerResult, imageResult, mountResult, networkResult, registryResult] = results;
  if (capabilityResult.status === "fulfilled") {
    capability.value =
      capabilityResult.value.data?.find((item) => Number(item.serverId) === currentServerId) || null;
  } else loadWarnings.value.push("服务器 Docker 能力信息读取失败");
  if (connectionResult.status === "fulfilled") {
    connection.value = connectionResult.value.data || null;
  } else loadWarnings.value.push("Docker 连接配置读取失败");
  if (containerResult.status === "fulfilled") containers.value = containerResult.value.data || [];
  else loadWarnings.value.push("容器列表加载失败");
  if (imageResult.status === "fulfilled") images.value = imageResult.value.data || [];
  else loadWarnings.value.push("镜像列表加载失败");
  if (mountResult.status === "fulfilled") mounts.value = mountResult.value.data || [];
  else loadWarnings.value.push("数据卷列表加载失败");
  if (networkResult.status === "fulfilled") networks.value = networkResult.value.data || [];
  else loadWarnings.value.push("网络列表加载失败");
  if (registryResult.status === "fulfilled") registries.value = registryResult.value.data || [];
  else loadWarnings.value.push("仓库列表加载失败");

  loading.value = false;
};

const handleContainerLogEnvelope = (payload: Record<string, unknown>) => {
  const detail =
    payload.detail && typeof payload.detail === "object"
      ? (payload.detail as Record<string, unknown>)
      : {};
  const payloadContainerId = String(
    detail.containerId || payload.taskId || "",
  ).trim();
  if (!payloadContainerId) {
    return;
  }
  const nextLines = String(payload.line || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
  if (!nextLines.length) {
    return;
  }
  if (payloadContainerId === activeContainerId.value) {
    terminalLogLines.value = [...terminalLogLines.value, ...nextLines].slice(-500);
  }
  if (payloadContainerId === containerLogDialogContainerId.value) {
    containerLogDialogLines.value = [...containerLogDialogLines.value, ...nextLines].slice(-500);
  }
  scrollTerminalPanelsToBottom();
};

const handleDockerTerminalEnvelope = (payload: Record<string, unknown>) => {
  const detail =
    payload.detail && typeof payload.detail === "object"
      ? (payload.detail as Record<string, unknown>)
      : {};
  const dockerTerminalPayloadSessionId = String(
    detail.dockerTerminalSessionId || payload.taskId || "",
  ).trim();
  if (!dockerTerminalPayloadSessionId || dockerTerminalPayloadSessionId !== dockerTerminalSessionId.value) {
    return;
  }
  if (String(payload.stepKey || "") === "dockerTerminalOutput" && payload.line) {
    writeTerminalLine(String(payload.line), { preserveIndent: true });
  }
  if (String(payload.stepKey || "") === "dockerTerminalStatus") {
    const dockerTerminalStatus = String(payload.status || "").toUpperCase();
    dockerTerminalConnected.value =
      dockerTerminalStatus === "CONNECTED" || dockerTerminalStatus === "RUNNING";
    terminalLastStatus.value = String(payload.message || terminalLastStatus.value || "docker terminal 已连接");
    if (payload.finished === true) {
      terminalSubmitting.value = false;
      if (terminalLogStreaming.value) {
        void refreshTerminalLogs();
      }
      renderTerminalPrompt();
    }
  }
};

activeSection.value = resolveSection(route.query.tab);

watch(
  () => [route.query.serverId, route.query.projectId, route.query.projectName],
  () => {
    loadPageData();
  },
  { immediate: true },
);

watch(
  () => route.query.tab,
  (value) => {
    activeSection.value = resolveSection(value);
  },
  { immediate: true },
);

watch(
  activeSection,
  (value, previous) => {
    if (previous === "terminal" && value !== "terminal") {
      void stopTerminalLogStream();
      disconnectDockerTerminalSession();
    }
    if (value === "terminal") {
      void initEmbeddedTerminal();
    }
  },
);

watch(
  containerLogDialogVisible,
  (visible, previous) => {
    if (previous && !visible) {
      void stopContainerLogDialogStream();
      resetContainerLogDialog();
    }
  },
);

watch(
  dockerRealtimeLatestRef,
  (value) => {
    const payload = (value?.data || null) as Record<string, unknown> | null;
    if (payload && String(payload.scope || "") === "container.log") {
      handleContainerLogEnvelope(payload);
      return;
    }
    if (payload && String(payload.scope || "") === "docker.terminal") {
      handleDockerTerminalEnvelope(payload);
      return;
    }
    upsertDockerRealtimeTask(value);
  },
  { deep: true },
);

onMounted(() => {
  connectDockerRealtimeStream();
});

onUnmounted(() => {
  void stopTerminalLogStream();
  disconnectDockerTerminalSession();
  disconnectDockerRealtimeStream();
  embeddedTerminal?.dispose();
  embeddedTerminal = null;
  embeddedFitAddon = null;
});
</script>

<style scoped>
.docker-manage-shell {
  --docker-line: rgba(48, 226, 217, 0.34);
  --docker-line-strong: rgba(67, 243, 238, 0.72);
  --docker-text: #edf7ff;
  --docker-text-soft: rgba(192, 225, 242, 0.8);
  --docker-accent: #42f5e6;
  --docker-success: #67f6a8;
  --docker-warn: #ffb86c;
  position: relative;
  height: 100vh;
  width: 100vw;
  padding: 24px;
  overflow: auto;
  color: var(--docker-text);
  background:
    radial-gradient(circle at top left, rgba(53, 126, 196, 0.24), transparent 26%),
    radial-gradient(circle at 82% 12%, rgba(43, 241, 220, 0.12), transparent 18%),
    linear-gradient(180deg, #091522 0%, #060d16 100%);
}

.docker-manage-shell__backdrop { position: absolute; inset: 0; pointer-events: none; }
.docker-manage-shell__orb { position: absolute; border-radius: 999px; filter: blur(90px); opacity: 0.4; }
.docker-manage-shell__orb--cyan { top: -80px; left: 12%; width: 340px; height: 340px; background: rgba(44, 197, 255, 0.18); }
.docker-manage-shell__orb--emerald { right: 8%; top: 22%; width: 300px; height: 300px; background: rgba(66, 245, 230, 0.16); }
.docker-manage-shell__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(75, 138, 165, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(75, 138, 165, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent 92%);
}

.docker-topbar,
.docker-card { position: relative; z-index: 1; }

.docker-topbar {
  display: grid;
  grid-template-columns: 1.25fr 1.7fr 1fr;
  gap: 18px;
  align-items: center;
  padding: 18px 22px;
  border: 1px solid var(--docker-line);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(10, 25, 41, 0.96), rgba(8, 19, 31, 0.9));
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset, 0 24px 48px rgba(1, 8, 16, 0.42);
}

.docker-brand { display: flex; align-items: center; gap: 14px; min-width: 0; }
.docker-brand__logo {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border: 1px solid rgba(66, 245, 230, 0.52);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(54, 227, 255, 0.2), rgba(66, 245, 230, 0.08));
  color: var(--docker-accent);
  font-size: 30px;
  box-shadow: 0 0 36px rgba(66, 245, 230, 0.16);
}

.docker-brand__eyebrow,
.docker-card__eyebrow,
.docker-panel-header small {
  display: block;
  margin-bottom: 8px;
  color: rgba(123, 197, 223, 0.84);
  font-size: 11px;
  letter-spacing: 0.26em;
  text-transform: uppercase;
}

.docker-brand strong { display: block; margin-bottom: 4px; font-size: 20px; font-family: "Bahnschrift", "DIN Alternate", "Microsoft YaHei", sans-serif; }
.docker-brand p,
.docker-panel-header p,
.docker-feature-header p,
.docker-card--server p { margin: 0; color: var(--docker-text-soft); line-height: 1.6; }

.docker-topbar__nav {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: 88px;
  padding: 0 24px;
  border: 1px solid rgba(66, 245, 230, 0.34);
  border-radius: 26px;
  overflow: hidden;
  clip-path: polygon(4% 0, 96% 0, 100% 50%, 96% 100%, 4% 100%, 0 50%);
  background: linear-gradient(90deg, rgba(8, 19, 31, 0.92), rgba(14, 31, 47, 0.92));
}

.docker-topbar__nav-item {
  position: relative;
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 16px 10px;
  border: 0;
  color: rgba(210, 231, 243, 0.72);
  background: transparent;
  cursor: pointer;
}
.docker-topbar__nav-item::after {
  content: "";
  position: absolute;
  left: 20%;
  right: 20%;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
}
.docker-topbar__nav-item.is-active {
  color: var(--docker-accent);
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.18), rgba(66, 245, 230, 0.06));
}
.docker-topbar__nav-item.is-active::after {
  background: linear-gradient(90deg, rgba(66, 245, 230, 0.1), var(--docker-accent), rgba(66, 245, 230, 0.1));
}

.docker-topbar__tools { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
.docker-searchbox {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 280px;
  padding: 0 16px;
  height: 48px;
  border: 1px solid rgba(71, 129, 152, 0.3);
  border-radius: 999px;
  background: rgba(5, 13, 22, 0.64);
  color: var(--docker-text-soft);
}
.docker-searchbox input { width: 100%; border: 0; outline: 0; color: var(--docker-text); background: transparent; }
.docker-icon-button {
  display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid rgba(71, 129, 152, 0.3);
  border-radius: 999px; color: var(--docker-text); background: rgba(5, 13, 22, 0.64); cursor: pointer;
}

.docker-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 22px; margin-top: 22px; position: relative; z-index: 1; }
.docker-sidebar { display: grid; gap: 18px; }
.docker-content { display: grid; gap: 20px; }

.docker-card {
  padding: 22px;
  border: 1px solid var(--docker-line);
  border-radius: 28px;
  background: linear-gradient(180deg, rgba(10, 24, 40, 0.9), rgba(7, 18, 30, 0.84));
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset, 0 18px 42px rgba(1, 7, 15, 0.34);
}

.docker-card.tech-card {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.docker-card.tech-card :deep(.tech-card__inner) {
  padding: 22px;
}

.docker-card--server h2,
.docker-panel-header h3,
.docker-feature-header h3 { margin: 0 0 8px; font-family: "Bahnschrift", "DIN Alternate", "Microsoft YaHei", sans-serif; }

.docker-server-address {
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid rgba(66, 245, 230, 0.24);
  border-radius: 18px;
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.08), rgba(66, 245, 230, 0.04));
}
.docker-server-address span,
.docker-server-meta dt,
.docker-runtime-metrics span,
.docker-feature-header strong { color: rgba(167, 213, 233, 0.78); font-size: 12px; }
.docker-server-address strong,
.docker-server-meta dd,
.docker-runtime-metrics strong { display: block; margin-top: 4px; font-size: 16px; font-weight: 700; }

.docker-server-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 0;
}
.docker-server-meta div,
.docker-runtime-metrics article { padding: 14px; border: 1px solid rgba(67, 111, 130, 0.24); border-radius: 18px; background: rgba(4, 13, 21, 0.42); }

.docker-side-link {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 12px;
  align-items: center;
  width: 100%;
  min-height: 92px;
  padding: 14px;
  border: 1px solid transparent;
  border-radius: 18px;
  color: var(--docker-text);
  background: transparent;
  cursor: pointer;
}
.docker-side-link + .docker-side-link { margin-top: 10px; }
.docker-side-link__icon {
  display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: var(--docker-accent);
  background: rgba(66, 245, 230, 0.1);
}
.docker-side-link__copy strong,
.docker-side-link__count { display: block; font-weight: 700; }
.docker-side-link__copy small {
  display: -webkit-box;
  margin-top: 4px;
  overflow: hidden;
  color: var(--docker-text-soft);
  line-height: 1.5;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.docker-side-link__count {
  min-width: 40px;
  text-align: right;
}
.docker-side-link.is-active,
.docker-side-link:hover { border-color: rgba(66, 245, 230, 0.34); background: linear-gradient(90deg, rgba(66, 245, 230, 0.12), rgba(66, 245, 230, 0.02)); }

.docker-overview-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.86fr) minmax(0, 1.34fr);
  gap: 20px;
}
.docker-card--runtime { min-height: 410px; }
.docker-card--main-table { min-height: 410px; }
.docker-card--feature { min-height: 260px; text-align: left; cursor: pointer; }
.docker-card--feature:hover,
.docker-card--feature:focus-visible { border-color: var(--docker-line-strong); box-shadow: 0 0 0 1px rgba(66, 245, 230, 0.12) inset, 0 18px 38px rgba(0, 0, 0, 0.34), 0 0 32px rgba(66, 245, 230, 0.1); }

.docker-panel-header,
.docker-feature-header { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
.docker-badge {
  display: inline-flex; align-items: center; height: 32px; padding: 0 14px; border: 1px solid rgba(66, 245, 230, 0.26);
  border-radius: 999px; background: rgba(66, 245, 230, 0.08); font-size: 12px; letter-spacing: 0.14em;
}
.docker-badge.is-ok,
.docker-table__cell.is-ok { color: var(--docker-success); }
.docker-badge.is-warn,
.docker-table__cell.is-warn { color: var(--docker-warn); }

.docker-runtime-scene {
  position: relative;
  height: 220px;
  margin: 24px 0 18px;
  overflow: hidden;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 26px;
  background: radial-gradient(circle at 50% 30%, rgba(66, 245, 230, 0.12), transparent 34%), linear-gradient(180deg, rgba(7, 21, 35, 0.88), rgba(4, 12, 22, 0.9));
}
.docker-runtime-scene__ring,
.docker-runtime-scene__pulse { position: absolute; left: 50%; transform: translateX(-50%); border-radius: 999px; }
.docker-runtime-scene__ring { bottom: 28px; width: 72%; height: 72px; border: 1px solid rgba(66, 245, 230, 0.26); box-shadow: 0 0 28px rgba(66, 245, 230, 0.12); }
.docker-runtime-scene__pulse { top: 34px; width: 10px; height: 10px; background: var(--docker-accent); box-shadow: 0 0 18px rgba(66, 245, 230, 0.92); animation: pulse-glow 2.4s ease-in-out infinite; }
.docker-runtime-scene__stack { position: absolute; left: 50%; bottom: 54px; display: grid; gap: 12px; width: 160px; transform: translateX(-50%); }
.docker-runtime-scene__stack span { display: block; height: 42px; border: 1px solid rgba(66, 245, 230, 0.32); border-radius: 10px; background: linear-gradient(90deg, rgba(66, 245, 230, 0.22), rgba(82, 208, 255, 0.12)); }
.docker-runtime-metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }

.docker-table-shell {
  margin-top: 18px;
  padding: 14px;
  border: 1px solid rgba(66, 245, 230, 0.22);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(9, 21, 34, 0.72), rgba(6, 15, 26, 0.84));
}
.docker-table-shell__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.docker-table-shell__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.08);
}
.docker-table-shell__toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.docker-toolbar-actions,
.docker-filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.docker-table-shell__arrow {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 999px;
  color: var(--docker-text);
  background: transparent;
  cursor: pointer;
}

.docker-table-wrap { overflow: auto; }
.docker-sc-table {
  width: 100%;
}

.docker-sc-table :deep(.sc-table-container),
.docker-sc-table :deep(.sc-table-wrapper),
.docker-sc-table :deep(.table-container) {
  background: transparent;
}

.docker-sc-table :deep(.sc-table-pagination-wrapper) {
  display: none;
}

.docker-sc-table :deep(.table-container) {
  border-radius: 18px;
  overflow: hidden;
}

.docker-sc-table :deep(.el-table) {
  background: transparent;
}

.docker-sc-table :deep(th.el-table__cell) {
  padding: 14px 10px;
  color: rgba(150, 201, 220, 0.84);
  font-size: 12px;
  font-weight: 600;
}

.docker-sc-table :deep(td.el-table__cell) {
  padding: 14px 10px;
}

.docker-table { width: 100%; border-collapse: collapse; }
.docker-table th,
.docker-table td { padding: 14px 10px; text-align: left; border-bottom: 1px solid rgba(66, 245, 230, 0.12); }
.docker-table th { color: rgba(150, 201, 220, 0.84); font-size: 12px; font-weight: 600; }
.docker-table__cell { display: inline-flex; align-items: center; min-height: 24px; color: var(--docker-text); }
.docker-table__cell.is-selected {
  color: #f4feff;
  text-shadow: 0 0 10px rgba(66, 245, 230, 0.18);
}
.docker-table tbody tr { transition: background 0.2s ease, box-shadow 0.2s ease; }
.docker-table tbody tr.is-selected { background: rgba(66, 245, 230, 0.08); box-shadow: inset 0 0 0 1px rgba(66, 245, 230, 0.16); }
.docker-table__cell.is-badge {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.08);
}
.docker-table__cell.is-mono {
  font-family: "Consolas", "Courier New", monospace;
  font-size: 12px;
  color: rgba(205, 230, 242, 0.88);
}
.docker-status-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: var(--docker-success);
  line-height: 1;
  cursor: help;
  animation: docker-status-glow-breathe 1.8s ease-in-out infinite;
}
.docker-status-icon__core {
  font-size: 16px;
  animation: docker-status-breathe 1.8s ease-in-out infinite;
}
.docker-status-icon__ring {
  position: absolute;
  inset: -3px;
  border-radius: 999px;
  border: 1px solid rgba(103, 246, 168, 0.45);
  animation: docker-status-pulse 1.8s ease-out infinite;
}
@keyframes docker-status-breathe {
  0%, 100% { transform: scale(1); opacity: 0.92; }
  50% { transform: scale(1.08); opacity: 1; }
}
@keyframes docker-status-glow-breathe {
  0%, 100% { filter: drop-shadow(0 0 2px rgba(103, 246, 168, 0.35)); }
  50% { filter: drop-shadow(0 0 10px rgba(103, 246, 168, 0.9)); }
}
@keyframes docker-status-pulse {
  0% { transform: scale(0.9); opacity: 0.65; }
  80% { transform: scale(1.35); opacity: 0; }
  100% { transform: scale(1.35); opacity: 0; }
}
.docker-table__actions { display: flex; flex-wrap: wrap; gap: 8px; }
.docker-table__actions.is-selected {
  padding: 4px 0;
  border-radius: 14px;
}
.docker-action-button {
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.06);
  color: var(--docker-text);
  cursor: pointer;
}
.docker-action-button.is-ok { color: var(--docker-success); }
.docker-action-button.is-warn { color: var(--docker-warn); }
.docker-icon-action-button,
.docker-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.docker-icon-action-button {
  width: 34px;
  height: 34px;
  border: 1px solid rgba(66, 245, 230, 0.18);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.06);
  color: var(--docker-text);
  cursor: pointer;
}
.docker-icon-action-button.is-ok { color: var(--docker-success); }
.docker-icon-action-button.is-warn { color: var(--docker-warn); }
.docker-filter-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.04);
  color: var(--docker-text-soft);
  cursor: pointer;
}
.docker-filter-button.is-active {
  color: var(--docker-accent);
  border-color: rgba(66, 245, 230, 0.32);
  background: rgba(66, 245, 230, 0.12);
}
.docker-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.docker-feature-header__icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border: 1px solid rgba(66, 245, 230, 0.26);
  border-radius: 18px;
  color: var(--docker-accent);
  background: rgba(66, 245, 230, 0.1);
  font-size: 24px;
}
.docker-feature-illustration {
  position: relative;
  height: 140px;
  margin-top: 24px;
  border: 1px solid rgba(66, 245, 230, 0.14);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(5, 17, 28, 0.6), rgba(7, 19, 31, 0.9));
}
.docker-feature-illustration::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 24px;
  background:
    radial-gradient(circle at 22% 24%, rgba(66, 245, 230, 0.2), transparent 40%),
    radial-gradient(circle at 76% 78%, rgba(66, 245, 230, 0.12), transparent 44%);
  pointer-events: none;
}
.docker-feature-illustration__frame {
  position: absolute;
  top: 18px;
  left: 50%;
  width: 92px;
  height: 92px;
  transform: translateX(-50%);
  border: 1px solid rgba(66, 245, 230, 0.56);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(18, 65, 94, 0.46), rgba(9, 31, 48, 0.62));
  box-shadow:
    0 0 20px rgba(66, 245, 230, 0.22),
    inset 0 0 16px rgba(66, 245, 230, 0.12);
  display: grid;
  place-items: center;
}
.docker-feature-illustration__iconbox {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  border: 1px solid rgba(66, 245, 230, 0.38);
  background: rgba(8, 29, 44, 0.72);
  color: #42f5e6;
  font-size: 28px;
}
.docker-feature-illustration__base {
  position: absolute;
  left: 50%;
  bottom: 22px;
  width: 96px;
  height: 16px;
  transform: translateX(-50%);
  border: 1px solid rgba(66, 245, 230, 0.26);
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(66, 245, 230, 0.2), rgba(66, 245, 230, 0.06));
}
.docker-feature-illustration__dot {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 999px;
  background: rgba(66, 245, 230, 0.95);
  box-shadow: 0 0 10px rgba(66, 245, 230, 0.5);
}
.docker-feature-illustration__dot.is-a { top: 28px; left: 24%; }
.docker-feature-illustration__dot.is-b { top: 44px; right: 24%; }
.docker-feature-illustration__dot.is-c { bottom: 34px; right: 32%; }

.docker-detail-shell { display: block; }
.docker-terminal-shell { display: block; }
.docker-card--terminal { min-height: 620px; }
.docker-terminal-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.docker-terminal-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.docker-terminal-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.85fr);
  gap: 18px;
  margin-top: 18px;
}
.docker-terminal-console,
.docker-terminal-logs {
  min-height: 520px;
  padding: 16px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(6, 15, 26, 0.9), rgba(4, 11, 20, 0.96));
}
.docker-terminal-toolbar,
.docker-terminal-logs__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.docker-terminal-status,
.docker-terminal-logs__hint {
  color: var(--docker-text-soft);
  font-size: 12px;
  letter-spacing: 0.04em;
}
.docker-terminal-plugin-shell {
  position: relative;
  margin-top: 16px;
  min-height: 478px;
  border: 1px solid rgba(66, 245, 230, 0.12);
  border-radius: 16px;
  background: rgba(2, 8, 14, 0.88);
  overflow: hidden;
}
.docker-terminal-plugin {
  min-height: 478px;
  padding: 10px 12px;
}
.docker-terminal-plugin :deep(.xterm) {
  height: 100%;
}
.docker-terminal-plugin :deep(.xterm-viewport) {
  overflow-y: auto;
  scrollbar-width: thin;
}
.docker-terminal-plugin :deep(.xterm-screen) {
  width: 100% !important;
}
.docker-terminal-history,
.docker-terminal-logbox {
  margin-top: 16px;
  min-height: 420px;
  max-height: 420px;
  overflow: auto;
  padding: 14px;
  border: 1px solid rgba(66, 245, 230, 0.12);
  border-radius: 16px;
  background: rgba(2, 8, 14, 0.88);
  font-family: "Consolas", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.65;
}
.docker-terminal-line {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 12px;
  padding: 2px 0;
}
.docker-terminal-line__time {
  color: rgba(123, 197, 223, 0.58);
}
.docker-terminal-line__content {
  white-space: pre-wrap;
  word-break: break-word;
}
.docker-terminal-line.is-command .docker-terminal-line__content { color: #9ad7ff; }
.docker-terminal-line.is-output .docker-terminal-line__content { color: #eafcff; }
.docker-terminal-line.is-error .docker-terminal-line__content { color: #ffb7a0; }
.docker-terminal-line.is-meta .docker-terminal-line__content { color: #abf2cb; }
.docker-terminal-empty {
  color: rgba(192, 225, 242, 0.62);
  font-size: 12px;
}
.docker-log-dialog-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 460px;
}
.docker-terminal-inputbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}
.docker-terminal-prompt {
  color: var(--docker-accent);
  font-family: "Consolas", "Courier New", monospace;
  font-size: 12px;
}
.docker-terminal-input {
  width: 100%;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid rgba(66, 245, 230, 0.16);
  border-radius: 12px;
  color: var(--docker-text);
  background: rgba(4, 13, 21, 0.68);
  outline: none;
}
.docker-terminal-input:focus {
  border-color: rgba(66, 245, 230, 0.38);
  box-shadow: 0 0 0 1px rgba(66, 245, 230, 0.12) inset;
}
.docker-terminal-logs__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.docker-terminal-logbox__line {
  padding: 2px 0;
  color: #eafcff;
  white-space: pre-wrap;
  word-break: break-word;
}
.docker-warning-strip { display: flex; flex-wrap: wrap; gap: 10px; }
.docker-warning-strip span {
  padding: 10px 14px;
  border: 1px solid rgba(255, 184, 108, 0.2);
  border-radius: 14px;
  color: rgba(255, 210, 161, 0.94);
  background: rgba(255, 184, 108, 0.08);
  font-size: 13px;
}

:deep(.docker-shell-dialog .el-dialog) {
  border: 1px solid var(--docker-line);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(10, 24, 40, 0.96), rgba(7, 18, 30, 0.92));
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 24px 52px rgba(1, 7, 15, 0.48),
    0 0 36px rgba(66, 245, 230, 0.08);
}

:deep(.docker-shell-dialog .el-dialog__header) {
  margin: 0;
  padding: 18px 22px 14px;
  border-bottom: 1px solid rgba(66, 245, 230, 0.14);
  background: linear-gradient(180deg, rgba(12, 29, 46, 0.98), rgba(9, 21, 34, 0.92));
}

:deep(.docker-shell-dialog .el-dialog__title) {
  color: var(--docker-text);
  font-weight: 700;
  letter-spacing: 0.08em;
}

:deep(.docker-shell-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--docker-text-soft);
}

:deep(.docker-shell-dialog .el-dialog__body) {
  padding: 20px 22px;
  color: var(--docker-text);
  background: linear-gradient(180deg, rgba(8, 19, 31, 0.88), rgba(6, 15, 26, 0.94));
}

:deep(.docker-shell-dialog .el-dialog__footer) {
  padding: 14px 22px 20px;
  border-top: 1px solid rgba(66, 245, 230, 0.12);
  background: linear-gradient(180deg, rgba(8, 19, 31, 0.9), rgba(5, 13, 22, 0.96));
}

:deep(.docker-shell-dialog .el-form-item__label) {
  color: rgba(192, 225, 242, 0.86);
}

:deep(.docker-shell-dialog .el-input__wrapper),
:deep(.docker-shell-dialog .el-textarea__inner) {
  border-color: rgba(66, 245, 230, 0.14);
  color: var(--docker-text);
  background: rgba(4, 13, 21, 0.68);
  box-shadow: 0 0 0 1px rgba(66, 245, 230, 0.08) inset;
}

:deep(.docker-shell-dialog .sc-dialog__body) {
  padding: 0;
}

@keyframes pulse-glow {
  0%, 100% { transform: translateX(-50%) scale(0.85); opacity: 0.64; }
  50% { transform: translateX(-50%) scale(1.2); opacity: 1; }
}

@media (max-width: 1460px) {
  .docker-topbar { grid-template-columns: 1fr; }
  .docker-topbar__tools { justify-content: flex-start; }
  .docker-layout { grid-template-columns: 1fr; }
}

@media (max-width: 1180px) {
  .docker-overview-grid { grid-template-columns: 1fr; }
  .docker-terminal-workspace { grid-template-columns: 1fr; }
}

@media (max-width: 820px) {
  .docker-manage-shell { padding: 16px; }
  .docker-topbar { padding: 16px; }
  .docker-topbar__nav { grid-template-columns: repeat(2, minmax(0, 1fr)); clip-path: none; border-radius: 20px; }
  .docker-topbar__tools { flex-direction: column; align-items: stretch; }
  .docker-searchbox { min-width: 0; width: 100%; }
  .docker-server-meta,
  .docker-runtime-metrics { grid-template-columns: 1fr; }
}
</style>
