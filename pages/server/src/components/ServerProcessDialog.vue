<template>
  <ScDialog
    v-model="dialogVisible"
    destroy-on-close
    width="94vw"
    class="server-process-dialog"
    :title="host ? `${host.serverName} · 进程管理` : '进程管理'"
>
    <template #header>
      <div class="server-process-dialog__header">
        <div>
          <h3>{{ host ? `${host.serverName} · 进程管理` : "进程管理" }}</h3>
          <p>
            支持实时刷新、进程结束和 AI 风险分析，作为服务器任务管理器入口。
          </p>
          <small
            v-if="!aiEnabled && aiUnavailableReason"
            class="server-process-dialog__hint"
          >
            AI 未激活: {{ aiUnavailableReason }}
          </small>
        </div>
        <div class="server-process-dialog__summary">
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            总数 {{ processes.length }}
          </ScTag>
          <ScTag
            v-if="zombieCount > 0"
            size="small"
            effect="plain"
            round
            class="server-process-dialog__chip server-process-dialog__chip--zombie"
          >
            僵尸 {{ zombieCount }}
          </ScTag>
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            SPI {{ processProviderText }}
          </ScTag>
          <ScTag
            size="small"
            effect="plain"
            round
            class="server-process-dialog__chip server-process-dialog__chip--action"
            @click="highLoadVisible = true"
          >
            高负载 {{ highRiskCount }}
          </ScTag>
          <ScTag
            size="small"
            effect="plain"
            round
            class="server-process-dialog__chip"
            :type="streamConnected ? 'success' : 'info'"
            :class="streamConnected ? 'is-success' : 'is-muted'"
          >
            {{
              streamConnected
                ? `Socket ${streamLastEventAt ? `· ${formatDateTime(streamLastEventAt)}` : "在线"}`
                : "Socket 未接管"
            }}
          </ScTag>
          <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
            {{
              refreshedAt
                ? `刷新于 ${formatDateTime(refreshedAt)}`
                : "尚未拉取进程"
            }}
          </ScTag>
        </div>
      </div>
    </template>

    <div class="server-process-dialog__toolbar">
      <ScInput
        class="server-process-dialog__search"
        :model-value="keyword"
        clearable
        placeholder="搜索进程名 / PID / 命令行"
        @update:model-value="emit('update:keyword', String($event || ''))"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </ScInput>
      <div class="flex-1 flex server-process-dialog__toolbar_reverse">
        <el-radio-group
          :model-value="stateFilter"
          size="small"
          class="server-process-dialog__state-filter"
          @update:model-value="emit('update:stateFilter', String($event || ''))"
        >
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button value="Z">
            <span class="server-process-dialog__filter-zombie">僵尸</span>
          </el-radio-button>
          <el-radio-button value="R">运行中</el-radio-button>
          <el-radio-button value="S">休眠</el-radio-button>
        </el-radio-group>
        <el-radio-group
          :model-value="viewMode"
          size="small"
          @update:model-value="emit('update:viewMode', toViewMode($event))"
        >
          <el-radio-button value="list">列表</el-radio-button>
          <el-radio-button value="tree">树形</el-radio-button>
          <el-radio-button value="card">卡片</el-radio-button>
        </el-radio-group>
        <div class="server-process-dialog__toolbar-actions">
          <template v-if="terminateSelectionMode">
            <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
              已选 {{ selectedProcesses.length }}
            </ScTag>
            <ScButton size="small" plain @click="emit('update:terminateSelectionMode', false)">
              取消多选
            </ScButton>
            <ScButton
              size="small"
              type="warning"
              plain
              :disabled="!selectedProcesses.length"
              @click="emit('batch-terminate', { processes: selectedProcesses, force: false })"
            >
              结束选中
            </ScButton>
            <ScButton
              size="small"
              type="danger"
              plain
              :disabled="!selectedProcesses.length"
              @click="emit('batch-terminate', { processes: selectedProcesses, force: true })"
            >
              强制结束
            </ScButton>
          </template>
          <ScButton
            v-else
            size="small"
            type="warning"
            plain
            @click="emit('update:terminateSelectionMode', true)"
          >
            结束进程
          </ScButton>
          <span class="server-process-dialog__switch-label">实时刷新</span>
          <el-switch
            :model-value="autoRefresh"
            @update:model-value="emit('update:autoRefresh', Boolean($event))"
          />
          <ScButton circle :loading="loading" @click="emit('refresh')">
            <IconifyIconOnline icon="ri:refresh-line" />
          </ScButton>
        </div>
      </div>
    </div>

    <div
      class="server-process-dialog__stage"
      :class="{ 'server-process-dialog__stage--detail': showInlineDetail }"
    >
      <div v-loading="loading" class="server-process-dialog__list thin-scroller">
        <template v-if="viewMode === 'card'">
          <article
            v-for="item in displayedProcesses"
            :key="item.pid"
            class="server-process-dialog__item"
            role="button"
            tabindex="0"
            :class="{
              'is-active': item.pid === selectedProcess?.pid,
              'is-warning':
                toPercent(item.cpuPercent) >= 40 ||
                toPercent(item.memoryPercent) >= 15,
              'is-danger':
                toPercent(item.cpuPercent) >= 80 ||
                toPercent(item.memoryPercent) >= 30,
              'is-zombie': isZombie(item),
            }"
            @click="handleSelectProcess(item)"
            @dblclick="openDetail(item)"
            @keydown.enter.prevent="handleSelectProcess(item)"
          >
            <div class="server-process-dialog__item-top">
              <div class="server-process-dialog__item-head-main">
                <el-checkbox
                  v-if="terminateSelectionMode"
                  :model-value="selectedProcessIdsSet.has(Number(item.pid || 0))"
                  @click.stop
                  @change="toggleProcessSelection(item, Boolean($event))"
                />
                <div>
                  <el-tooltip
                    :content="item.name || item.command || '未命名进程'"
                    placement="top"
                  >
                    <strong>{{ shortProcessName(item) }}</strong>
                  </el-tooltip>
                  <p class="server-process-dialog__inline-meta">
                    PID {{ item.pid || "--" }}
                    <template v-if="item.parentPid">
                      · PPID {{ item.parentPid }}</template
                    >
                    <template v-if="item.user"> · {{ item.user }}</template>
                    <template v-if="item.startTime">
                      · 启动 {{ formatStartTime(item.startTime) }}</template
                    >
                  </p>
                </div>
              </div>
              <span
                class="server-process-dialog__state"
                :class="{ 'is-zombie': isZombie(item) }"
              >
                <template v-if="isZombie(item)">ZOMBIE</template>
                <template v-else>{{ item.state || "RUNNING" }}</template>
              </span>
            </div>
            <div class="server-process-dialog__metric-row">
              <span>CPU {{ formatPercent(item.cpuPercent) }}</span>
              <span>内存 {{ formatPercent(item.memoryPercent) }}</span>
              <span>{{ formatBytes(item.memoryBytes) }}</span>
              <span>运行 {{ formatElapsed(item.elapsed) }}</span>
              <span>SPI {{ processProviderLabel(item) }}</span>
            </div>
            <el-tooltip
              :content="item.commandLine || item.command || '-'"
              placement="top"
            >
              <p class="server-process-dialog__command">
                {{ item.commandLine || item.command || "-" }}
              </p>
            </el-tooltip>
            <div class="server-process-dialog__item-bottom">
              <div class="server-process-dialog__metric-row">
                <span>线程 {{ item.threadCount || "--" }}</span>
                <span>{{ formatStartTime(item.startTime) }}</span>
                <span v-if="isJavaProcess(item)">Java 进程</span>
              </div>
              <div class="server-process-dialog__item-actions">
                <el-tooltip
                  v-if="isZombie(item)"
                  content="僵尸进程清理（发送 SIGCHLD 至父进程）"
                >
                  <ScButton
                    circle
                    plain
                    type="danger"
                    :loading="zombieLoadingKey === String(item.pid)"
                    @click.stop="emit('zombie-cleanup', item)"
                  >
                    <IconifyIconOnline icon="ri:refresh-line" />
                  </ScButton>
                </el-tooltip>
                <el-tooltip content="结束进程">
                  <ScButton
                    circle
                    plain
                    type="warning"
                    :loading="actionLoadingKey === `terminate:${item.pid}`"
                    @click.stop="
                      emit('terminate-process', {
                        process: item,
                        force: false,
                      })
                    "
                  >
                    <IconifyIconOnline icon="ri:stop-circle-line" />
                  </ScButton>
                </el-tooltip>
                <el-tooltip content="查看进程详情">
                  <ScButton circle plain @click.stop="openDetail(item)">
                    <IconifyIconOnline icon="ri:article-line" />
                  </ScButton>
                </el-tooltip>
                <ServerAiActionButton
                  :icon="isJavaProcess(item) ? 'ri:java-line' : 'ri:ai-generate-2'"
                  :tooltip="isJavaProcess(item) ? 'JVM / Java 分析' : 'AI 进程分析'"
                  :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
                  scene="server-process-ai"
                  system-prompt="你是服务器进程分析助手，需要输出中文风险诊断和处理建议。"
                  :prompt="buildProcessAiPrompt(item)"
                  :method="aiEnabled ? () => emit('analyze-process', item) : undefined"
                />
              </div>
            </div>
          </article>
          <el-empty
            v-if="!loading && !displayedProcesses.length"
            description="当前没有匹配的进程"
          />
        </template>

        <el-table
          v-else-if="viewMode === 'tree'"
          :data="treeProcesses"
          height="620"
          class="server-process-dialog__table"
          row-key="pid"
          default-expand-all
          :tree-props="{ children: 'children' }"
          :row-class-name="processRowClassName"
          @row-click="handleSelectProcess"
          @selection-change="handleSelectionChange"
          @sort-change="handleTableSortChange"
        >
          <el-table-column v-if="terminateSelectionMode" type="selection" width="52" />
          <el-table-column prop="name" label="进程" min-width="300" sortable="custom">
            <template #default="{ row }">
              <div class="server-process-dialog__table-main">
                <div class="server-process-dialog__table-headline">
                  <el-tooltip
                    :content="row.name || row.command || '未命名进程'"
                    placement="top"
                  >
                    <strong>{{ shortProcessName(row) }}</strong>
                  </el-tooltip>
                  <ScTag
                    v-if="isJavaProcess(row)"
                    size="small"
                    effect="plain"
                    round
                    class="server-process-dialog__chip"
                  >
                    Java
                  </ScTag>
                </div>
                <el-tooltip
                  :content="row.commandLine || row.command || '-'"
                  placement="top"
                >
                  <span class="server-process-dialog__command server-process-dialog__command--table">
                    {{ row.commandLine || row.command || "-" }}
                  </span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="pid" label="PID" width="90" sortable="custom" />
          <el-table-column label="状态" width="88">
            <template #default="{ row }">
              <ScTag
                size="small"
                effect="plain"
                :type="isZombie(row) ? 'danger' : 'info'"
                class="server-process-dialog__state-tag"
              >
                {{ isZombie(row) ? "ZOMBIE" : (row.state || "运行") }}
              </ScTag>
            </template>
          </el-table-column>
          <el-table-column prop="cpuPercent" label="CPU" width="110" sortable="custom">
            <template #default="{ row }">
              {{ formatPercent(row.cpuPercent) }}
            </template>
          </el-table-column>
          <el-table-column prop="memoryPercent" label="内存" width="120" sortable="custom">
            <template #default="{ row }">
              {{ formatPercent(row.memoryPercent) }}
            </template>
          </el-table-column>
          <el-table-column label="占用" width="120">
            <template #default="{ row }">
              {{ formatBytes(row.memoryBytes) }}
            </template>
          </el-table-column>
          <el-table-column prop="handleCount" label="句柄数" width="100" />
          <el-table-column prop="user" label="用户" min-width="100" />
          <el-table-column label="启动时间" min-width="170">
            <template #default="{ row }">
              {{ formatStartTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="elapsed" label="运行时长" min-width="120" sortable="custom">
            <template #default="{ row }">
              {{ formatElapsed(row.elapsed) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="186" fixed="right">
            <template #default="{ row }">
              <div class="server-process-dialog__table-actions">
                <el-tooltip
                  v-if="isZombie(row)"
                  content="僵尸进程清理（发送 SIGCHLD 至父进程）"
                >
                  <ScButton
                    circle
                    plain
                    type="danger"
                    :loading="zombieLoadingKey === String(row.pid)"
                    @click.stop="emit('zombie-cleanup', row)"
                  >
                    <IconifyIconOnline icon="ri:refresh-line" />
                  </ScButton>
                </el-tooltip>
                <ScButton
                  circle
                  plain
                  type="warning"
                  :loading="actionLoadingKey === `terminate:${row.pid}`"
                  @click.stop="
                    emit('terminate-process', {
                      process: row,
                      force: false,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </ScButton>
                <ScButton circle plain @click.stop="openDetail(row)">
                  <IconifyIconOnline icon="ri:article-line" />
                </ScButton>
                <ServerAiActionButton
                  :icon="isJavaProcess(row) ? 'ri:java-line' : 'ri:ai-generate-2'"
                  :tooltip="isJavaProcess(row) ? 'JVM / Java 分析' : 'AI 进程分析'"
                  :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
                  scene="server-process-ai"
                  system-prompt="你是服务器进程分析助手，需要输出中文风险诊断和处理建议。"
                  :prompt="buildProcessAiPrompt(row)"
                  :method="aiEnabled ? () => emit('analyze-process', row) : undefined"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>

        <el-table
          v-else
          :data="listProcesses"
          height="620"
          class="server-process-dialog__table server-process-dialog__table--list"
          row-key="pid"
          :row-class-name="processRowClassName"
          @row-click="handleSelectProcess"
          @selection-change="handleSelectionChange"
          @sort-change="handleTableSortChange"
        >
          <el-table-column v-if="terminateSelectionMode" type="selection" width="52" />
          <el-table-column prop="name" label="Name" min-width="280" sortable="custom">
            <template #default="{ row }">
              <div class="server-process-dialog__taskmgr-main">
                <div class="server-process-dialog__taskmgr-name">
                  <el-tooltip
                    :content="row.name || row.command || '未命名进程'"
                    placement="top"
                  >
                    <strong>{{ shortProcessName(row) }}</strong>
                  </el-tooltip>
                  <span class="server-process-dialog__taskmgr-meta">
                    PID {{ row.pid || "--" }}
                    <template v-if="row.user"> · {{ row.user }}</template>
                  </span>
                </div>
                <el-tooltip
                  :content="row.description || row.commandLine || row.command || '-'"
                  placement="top"
                >
                  <span class="server-process-dialog__taskmgr-desc">
                    {{ row.description || row.commandLine || row.command || "-" }}
                  </span>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="pid" label="PID" width="90" sortable="custom" />
          <el-table-column label="状态" width="88">
            <template #default="{ row }">
              <ScTag
                size="small"
                effect="plain"
                :type="isZombie(row) ? 'danger' : 'info'"
                class="server-process-dialog__state-tag"
              >
                {{ isZombie(row) ? "ZOMBIE" : (row.state || "运行") }}
              </ScTag>
            </template>
          </el-table-column>
          <el-table-column prop="cpuPercent" label="CPU" width="90" sortable="custom">
            <template #default="{ row }">
              {{ formatPercent(row.cpuPercent) }}
            </template>
          </el-table-column>
          <el-table-column label="I/O total rate" width="140">
            <template #default="{ row }">
              {{ formatBytesPerSecond(row.ioBytesPerSecond) }}
            </template>
          </el-table-column>
          <el-table-column label="Private bytes" width="130">
            <template #default="{ row }">
              {{ formatBytes(row.memoryBytes) }}
            </template>
          </el-table-column>
          <el-table-column prop="handleCount" label="Handles" width="96" />
          <el-table-column prop="memoryPercent" label="内存%" width="100" sortable="custom">
            <template #default="{ row }">
              {{ formatPercent(row.memoryPercent) }}
            </template>
          </el-table-column>
          <el-table-column prop="user" label="User name" min-width="140" />
          <el-table-column label="Description" min-width="220">
            <template #default="{ row }">
              <span class="server-process-dialog__taskmgr-desc-cell">
                {{ row.description || "-" }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="186" fixed="right">
            <template #default="{ row }">
              <div class="server-process-dialog__table-actions">
                <el-tooltip
                  v-if="isZombie(row)"
                  content="僵尸进程清理（发送 SIGCHLD 至父进程）"
                >
                  <ScButton
                    circle
                    plain
                    type="danger"
                    :loading="zombieLoadingKey === String(row.pid)"
                    @click.stop="emit('zombie-cleanup', row)"
                  >
                    <IconifyIconOnline icon="ri:refresh-line" />
                  </ScButton>
                </el-tooltip>
                <ScButton
                  circle
                  plain
                  type="warning"
                  :loading="actionLoadingKey === `terminate:${row.pid}`"
                  @click.stop="
                    emit('terminate-process', {
                      process: row,
                      force: false,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </ScButton>
                <ScButton circle plain @click.stop="openDetail(row)">
                  <IconifyIconOnline icon="ri:article-line" />
                </ScButton>
                <ServerAiActionButton
                  :icon="isJavaProcess(row) ? 'ri:java-line' : 'ri:ai-generate-2'"
                  :tooltip="isJavaProcess(row) ? 'JVM / Java 分析' : 'AI 进程分析'"
                  :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
                  scene="server-process-ai"
                  system-prompt="你是服务器进程分析助手，需要输出中文风险诊断和处理建议。"
                  :prompt="buildProcessAiPrompt(row)"
                  :method="aiEnabled ? () => emit('analyze-process', row) : undefined"
                />
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="showInlineDetail" class="server-process-dialog__detail thin-scroller">
        <template v-if="selectedProcess">
          <div class="server-process-dialog__detail-hero">
            <div>
              <h4>
                {{
                  selectedProcess.name ||
                  selectedProcess.command ||
                  "未命名进程"
                }}
              </h4>
              <p>
                {{
                  selectedProcess.commandLine || selectedProcess.command || "-"
                }}
              </p>
              <div class="server-process-dialog__detail-pills">
                <ScTag size="small" effect="plain" round>
                  PID {{ selectedProcess.pid || "--" }}
                </ScTag>
                <ScTag size="small" effect="plain" round :type="isZombie(selectedProcess) ? 'danger' : 'info'">
                  {{ isZombie(selectedProcess) ? "ZOMBIE" : (selectedProcess.state || "RUNNING") }}
                </ScTag>
                <ScTag size="small" effect="plain" round>
                  SPI {{ processProviderLabel(selectedProcess) }}
                </ScTag>
              </div>
            </div>
            <div class="server-process-dialog__detail-actions">
              <ScButton plain size="small" @click="closeInlineDetail">
                关闭右侧
              </ScButton>
              <el-tooltip
                v-if="isZombie(selectedProcess)"
                content="僵尸进程清理（发送 SIGCHLD 至父进程）"
              >
                <ScButton
                  circle
                  type="danger"
                  plain
                  :loading="zombieLoadingKey === String(selectedProcess.pid)"
                  @click="emit('zombie-cleanup', selectedProcess)"
                >
                  <IconifyIconOnline icon="ri:refresh-line" />
                </ScButton>
              </el-tooltip>
              <ServerAiActionButton
                tooltip="AI 分析"
                :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
                :loading="aiAnalyzing"
                scene="server-process-ai"
                system-prompt="你是服务器进程分析助手，需要输出中文风险诊断和处理建议。"
                :prompt="buildProcessAiPrompt(selectedProcess)"
                :method="
                  aiEnabled ? () => emit('analyze-process', selectedProcess) : undefined
                "
              />
              <el-tooltip content="结束进程">
                <ScButton
                  circle
                  type="warning"
                  plain
                  :loading="
                    actionLoadingKey === `terminate:${selectedProcess.pid}`
                  "
                  @click="
                    emit('terminate-process', {
                      process: selectedProcess,
                      force: false,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="强制结束">
                <ScButton
                  circle
                  type="danger"
                  plain
                  :loading="actionLoadingKey === `force:${selectedProcess.pid}`"
                  @click="
                    emit('terminate-process', {
                      process: selectedProcess,
                      force: true,
                    })
                  "
                >
                  <IconifyIconOnline icon="ri:close-circle-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="弹框查看详情">
                <ScButton circle plain @click="openDetail(selectedProcess)">
                  <IconifyIconOnline icon="ri:article-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="进程关系图谱">
                <ScButton
                  circle
                  plain
                  :loading="relationGraphLoading"
                  @click="openProcessRelationGraph(selectedProcess)"
                >
                  <IconifyIconOnline icon="ri:node-tree" />
                </ScButton>
              </el-tooltip>
            </div>
          </div>

          <div class="server-process-dialog__stats">
            <div class="server-process-dialog__stat">
              <small>CPU</small>
              <strong
                class="server-process-dialog__stat-value"
                :key="'cpu-' + (selectedProcess.pid || '') + '-' + (selectedProcess.cpuPercent ?? '')"
              >{{ formatPercent(selectedProcess.cpuPercent) }}</strong>
              <div class="server-process-dialog__stat-bar">
                <span :style="{ width: `${toPercent(selectedProcess.cpuPercent)}%` }" />
              </div>
              <span>当前按 {{ sortLabel }} 排序</span>
            </div>
            <div class="server-process-dialog__stat">
              <small>内存</small>
              <strong
                class="server-process-dialog__stat-value"
                :key="'mem-' + (selectedProcess.pid || '') + '-' + (selectedProcess.memoryPercent ?? '')"
              >{{
                formatPercent(selectedProcess.memoryPercent)
              }}</strong>
              <div class="server-process-dialog__stat-bar is-memory">
                <span
                  :style="{ width: `${toPercent(selectedProcess.memoryPercent)}%` }"
                />
              </div>
              <span>{{ formatBytes(selectedProcess.memoryBytes) }}</span>
            </div>
            <div class="server-process-dialog__stat">
              <small>线程</small>
              <strong>{{ selectedProcess.threadCount || "--" }}</strong>
              <span>
                状态 {{ selectedProcess.state || "RUNNING" }} · SPI
                {{ processProviderLabel(selectedProcess) }}
              </span>
            </div>
            <div class="server-process-dialog__stat">
              <small>运行时长</small>
              <strong
                class="server-process-dialog__stat-value"
                :key="'time-' + (selectedProcess.pid || '') + '-' + (selectedProcess.elapsed || '')"
              >{{ selectedProcess.elapsed || "--" }}</strong>
              <span>{{ selectedProcess.startTime || "启动时间未知" }}</span>
            </div>
          </div>

          <div class="server-process-dialog__detail-card">
            <div class="server-process-dialog__detail-grid">
              <div>
                <small>PID</small>
                <strong>{{ selectedProcess.pid || "--" }}</strong>
              </div>
              <div>
                <small>父进程</small>
                <strong>{{ selectedProcess.parentPid || "--" }}</strong>
              </div>
              <div>
                <small>所属用户</small>
                <strong>{{ selectedProcess.user || "--" }}</strong>
              </div>
              <div>
                <small>命令</small>
                <strong>{{
                  selectedProcess.command || selectedProcess.name || "--"
                }}</strong>
              </div>
              <div>
                <small>执行通道</small>
                <strong>{{ processProviderLabel(selectedProcess) }}</strong>
              </div>
            </div>
            <div class="server-process-dialog__detail-block">
              <small>命令行</small>
              <p>{{ selectedProcess.commandLine || "-" }}</p>
            </div>
          </div>

          <article
            v-if="aiAdvice?.summary || aiAdvice?.suggestion"
            class="server-process-dialog__ai-card"
          >
            <div class="server-process-dialog__ai-top">
              <strong>AI / 诊断结论</strong>
              <div class="server-process-dialog__summary">
                <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
                  {{ aiAdvice?.riskLevel || "UNKNOWN" }}
                </ScTag>
                <ScTag size="small" effect="plain" round class="server-process-dialog__chip">
                  {{ aiAdvice?.provider || "LOCAL_HEURISTIC" }}
                </ScTag>
              </div>
            </div>
            <p>{{ aiAdvice?.summary }}</p>
            <small>{{ aiAdvice?.suggestion }}</small>
          </article>
          <el-empty
            v-else
            description="选择 AI 分析后，这里会展示进程风险判断和处理建议"
          />
        </template>
        <el-empty v-else description="从左侧选择一个进程查看详情" />
      </div>
    </div>

    <ScDialog
      v-model="highLoadVisible"
      destroy-on-close
      width="920px"
      append-to-body
      class="server-process-detail-dialog"
      title="高负载进程"
>
      <div class="server-process-detail-dialog__grid">
        <article
          v-for="item in highLoadProcesses"
          :key="`high-${item.pid}`"
          class="server-process-detail-dialog__card"
        >
          <div class="server-process-detail-dialog__ai-top">
            <h5>{{ shortProcessName(item) }}</h5>
            <span class="server-process-dialog__chip">
              PID {{ item.pid || "--" }}
            </span>
          </div>
          <p class="server-process-detail-dialog__command">
            {{ item.commandLine || item.command || "-" }}
          </p>
          <dl class="server-process-detail-dialog__meta">
            <div>
              <dt>CPU</dt>
              <dd>{{ formatPercent(item.cpuPercent) }}</dd>
            </div>
            <div>
              <dt>内存</dt>
              <dd>{{ formatPercent(item.memoryPercent) }}</dd>
            </div>
            <div>
              <dt>启动时间</dt>
              <dd>{{ formatStartTime(item.startTime) }}</dd>
            </div>
            <div>
              <dt>运行时长</dt>
              <dd>{{ formatElapsed(item.elapsed) }}</dd>
            </div>
          </dl>
        </article>
        <el-empty
          v-if="!highLoadProcesses.length"
          description="当前没有命中的高负载进程"
        />
      </div>
    </ScDialog>

    <ScDialog
      v-model="detailVisible"
      destroy-on-close
      width="960px"
      append-to-body
      class="server-process-detail-dialog"
      :title="
        detailProcess
          ? `${detailProcess.name || detailProcess.command || '未命名进程'} · 进程详情`
          : '进程详情'
      "
>
      <template v-if="detailProcess">
        <div class="server-process-detail-dialog__hero">
          <div>
            <h4>
              {{ detailProcess.name || detailProcess.command || "未命名进程" }}
            </h4>
            <p>
              {{ detailProcess.commandLine || detailProcess.command || "-" }}
            </p>
          </div>
          <div class="server-process-detail-dialog__actions">
            <el-tooltip
              v-if="isZombie(detailProcess)"
              content="僵尸进程清理（发送 SIGCHLD 至父进程）"
            >
              <ScButton
                circle
                type="danger"
                plain
                :loading="zombieLoadingKey === String(detailProcess.pid)"
                @click="emit('zombie-cleanup', detailProcess)"
              >
                <IconifyIconOnline icon="ri:refresh-line" />
              </ScButton>
            </el-tooltip>
            <ServerAiActionButton
              tooltip="AI 分析"
              :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
              :loading="aiAnalyzing && detailProcess.pid === selectedProcess?.pid"
              scene="server-process-ai"
              system-prompt="你是服务器进程分析助手，需要输出中文风险诊断和处理建议。"
              :prompt="buildProcessAiPrompt(detailProcess)"
              :method="
                aiEnabled ? () => emit('analyze-process', detailProcess) : undefined
              "
            />
            <el-tooltip content="结束进程">
              <ScButton
                circle
                type="warning"
                plain
                :loading="actionLoadingKey === `terminate:${detailProcess.pid}`"
                @click="
                  emit('terminate-process', {
                    process: detailProcess,
                    force: false,
                  })
                "
              >
                <IconifyIconOnline icon="ri:stop-circle-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="强制结束">
              <ScButton
                circle
                type="danger"
                plain
                :loading="actionLoadingKey === `force:${detailProcess.pid}`"
                @click="
                  emit('terminate-process', {
                    process: detailProcess,
                    force: true,
                  })
                "
              >
                <IconifyIconOnline icon="ri:close-circle-line" />
              </ScButton>
            </el-tooltip>
          </div>
        </div>

        <div class="server-process-detail-dialog__stats">
          <div class="server-process-detail-dialog__stat">
            <small>PID</small>
            <strong>{{ detailProcess.pid || "--" }}</strong>
            <span>父进程 {{ detailProcess.parentPid || "--" }}</span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>CPU</small>
            <strong>{{ formatPercent(detailProcess.cpuPercent) }}</strong>
            <span>
              线程 {{ detailProcess.threadCount || "--" }} · SPI
              {{ processProviderLabel(detailProcess) }}
            </span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>内存</small>
            <strong>{{ formatPercent(detailProcess.memoryPercent) }}</strong>
            <span>{{ formatBytes(detailProcess.memoryBytes) }}</span>
          </div>
          <div class="server-process-detail-dialog__stat">
            <small>运行状态</small>
            <strong>{{ detailProcess.state || "RUNNING" }}</strong>
            <span>{{ detailProcess.elapsed || "刚启动" }}</span>
          </div>
        </div>

        <div class="server-process-detail-dialog__grid">
          <article class="server-process-detail-dialog__card">
            <h5>基础字段</h5>
            <dl class="server-process-detail-dialog__meta">
              <div>
                <dt>所属用户</dt>
                <dd>{{ detailProcess.user || "--" }}</dd>
              </div>
              <div>
                <dt>启动时间</dt>
                <dd>{{ detailProcess.startTime || "--" }}</dd>
              </div>
              <div>
                <dt>命令</dt>
                <dd>
                  {{ detailProcess.command || detailProcess.name || "--" }}
                </dd>
              </div>
              <div>
                <dt>是否存活</dt>
                <dd>{{ detailProcess.alive === false ? "否" : "是" }}</dd>
              </div>
            </dl>
          </article>

          <article class="server-process-detail-dialog__card">
            <h5>命令行</h5>
            <p class="server-process-detail-dialog__command">
              {{ detailProcess.commandLine || "-" }}
            </p>
          </article>

          <article
            class="server-process-detail-dialog__card server-process-detail-dialog__card--wide"
          >
            <div class="server-process-detail-dialog__ai-top">
              <h5>AI 分析</h5>
              <span class="server-process-dialog__chip">
                {{
                  aiAdvice && detailProcess.pid === selectedProcess?.pid
                    ? aiAdvice.provider || aiAdvice.riskLevel || "AI"
                    : "等待分析"
                }}
              </span>
            </div>
            <template
              v-if="aiAdvice && detailProcess.pid === selectedProcess?.pid"
            >
              <p class="server-process-detail-dialog__command">
                {{ aiAdvice.summary || "暂无摘要" }}
              </p>
              <p class="server-process-detail-dialog__command">
                {{ aiAdvice.suggestion || "暂无建议" }}
              </p>
            </template>
            <el-empty
              v-else
              description="触发 AI 分析后，会在这里展示风险等级与处理建议"
            />
          </article>
        </div>
      </template>
      <el-empty v-else description="未选择进程" />
    </ScDialog>
  </ScDialog>

  <!-- 进程关系图谱对话框 -->
  <ScDialog
    v-model="relationGraphVisible"
    destroy-on-close
    append-to-body
    width="90vw"
    class="server-process-graph-dialog"
    title="进程关系图谱"
  >
    <div class="server-process-graph-dialog__toolbar">
      <ScTag>{{ graphNodes.length }} 节点</ScTag>
      <ScTag>{{ graphEdges.length }} 关系</ScTag>
      <ScButton size="small" @click="fitGraphView">适应画布</ScButton>
    </div>
    <div ref="graphContainerRef" class="server-process-graph-dialog__canvas" />
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScButton from "@repo/components/ScButton/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import ServerAiActionButton from "./ServerAiActionButton.vue";
import { Graph as G6Graph } from "@antv/g6";
import type {
  ServerHost,
  ServerProcessAiAdvice,
  ServerProcessView,
  ServerProcessRelationGraph,
} from "../api";
import { getProcessRelations } from "../api";

type ProcessTreeNode = ServerProcessView & {
  children?: ProcessTreeNode[];
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    host?: ServerHost | null;
    processes?: ServerProcessView[];
    selectedProcess?: ServerProcessView | null;
    loading?: boolean;
    keyword?: string;
    autoRefresh?: boolean;
    refreshedAt?: number | null;
    streamConnected?: boolean;
    streamLastEventAt?: number | null;
    viewMode?: "card" | "list" | "tree";
    sortKey?: "cpu" | "memory" | "pid" | "name" | "elapsed";
    sortOrder?: "asc" | "desc";
    terminateSelectionMode?: boolean;
    selectedProcessIds?: number[];
    aiEnabled?: boolean;
    aiUnavailableReason?: string;
    aiAnalyzing?: boolean;
    aiAdvice?: ServerProcessAiAdvice | null;
    actionLoadingKey?: string;
    processStats?: Record<string, number> | null;
    stateFilter?: string;
    zombieLoadingKey?: string;
  }>(),
  {
    host: null,
    processes: () => [],
    selectedProcess: null,
    loading: false,
    keyword: "",
    autoRefresh: true,
    refreshedAt: null,
    streamConnected: false,
    streamLastEventAt: null,
    viewMode: "list",
    sortKey: "cpu",
    sortOrder: "desc",
    terminateSelectionMode: false,
    selectedProcessIds: () => [],
    aiEnabled: false,
    aiUnavailableReason: "",
    aiAnalyzing: false,
    aiAdvice: null,
    actionLoadingKey: "",
    processStats: null,
    stateFilter: "",
    zombieLoadingKey: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:keyword": [value: string];
  "update:autoRefresh": [value: boolean];
  "update:viewMode": [value: "card" | "list" | "tree"];
  "update:sortKey": [value: "cpu" | "memory" | "pid" | "name" | "elapsed"];
  "update:sortOrder": [value: "asc" | "desc"];
  "update:terminateSelectionMode": [value: boolean];
  "update:selectedProcessIds": [value: number[]];
  "update:stateFilter": [value: string];
  "sort-change": [
    payload: {
      sortKey: "cpu" | "memory" | "pid" | "name" | "elapsed";
      sortOrder: "asc" | "desc";
    },
  ];
  refresh: [];
  "select-process": [process: ServerProcessView];
  "analyze-process": [process: ServerProcessView];
  "terminate-process": [
    payload: { process: ServerProcessView; force: boolean },
  ];
  "batch-terminate": [
    payload: { processes: ServerProcessView[]; force: boolean },
  ];
  "zombie-cleanup": [process: ServerProcessView];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
const detailVisible = ref(false);
const highLoadVisible = ref(false);
const detailPid = ref<number | null>(null);
const inlineDetailVisible = ref(false);

const detailProcess = computed(() => {
  if (detailPid.value === null) {
    return props.selectedProcess || null;
  }
  return (
    props.processes.find((item) => item.pid === detailPid.value) ||
    props.selectedProcess ||
    null
  );
});

const showInlineDetail = computed(
  () => inlineDetailVisible.value && Boolean(props.selectedProcess),
);

const openDetail = (process?: ServerProcessView | null) => {
  detailPid.value = Number(process?.pid || 0) || null;
  detailVisible.value = Boolean(process);
};

const handleSelectProcess = (process: ServerProcessView) => {
  emit("select-process", process);
  inlineDetailVisible.value = true;
};

const closeInlineDetail = () => {
  inlineDetailVisible.value = false;
};

// ── 进程关系图谱 ──────────────────────────────
const relationGraphVisible = ref(false);
const relationGraphLoading = ref(false);
const graphContainerRef = ref<HTMLDivElement | null>(null);
const graphNodes = ref<ServerProcessRelationGraph["nodes"]>([]);
const graphEdges = ref<ServerProcessRelationGraph["edges"]>([]);
let graphInstance: G6Graph | null = null;
const graphProcessName = ref("");

const openProcessRelationGraph = async (process?: ServerProcessView | null) => {
  if (!process?.pid || !props.host?.serverId) return;
  relationGraphLoading.value = true;
  graphProcessName.value = process.name || `PID ${process.pid}`;
  relationGraphVisible.value = true;
  try {
    const res = await getProcessRelations(props.host.serverId, process.pid);
    const data = res.data || { nodes: [], edges: [] };
    graphNodes.value = data.nodes;
    graphEdges.value = data.edges;
    await nextTick();
    renderProcessGraph(data);
  } finally {
    relationGraphLoading.value = false;
  }
};

const renderProcessGraph = (data: ServerProcessRelationGraph) => {
  if (!graphContainerRef.value) return;
  graphInstance?.destroy();

  const g6Data = {
    nodes: data.nodes.map((n) => ({
      id: String(n.pid),
      label: n.name,
      style: {
        fill: n.isTarget ? "#e6a817" : "#1677ff",
        lineWidth: n.isTarget ? 3 : 1,
        labelText: n.name + (n.pid > 0 ? `\nPID ${n.pid}` : ""),
        labelPlacement: "bottom" as const,
      },
    })),
    edges: data.edges.map((e) => ({
      id: `${e.source}-${e.target}`,
      source: String(e.source),
      target: String(e.target),
      style: {
        lineWidth: 1,
        endArrow: true,
        labelText: e.relation === "client-ip" ? e.label || "" : "",
      },
    })),
  };

  const container = graphContainerRef.value;
  graphInstance = new G6Graph({
    container: container,
    width: container.scrollWidth,
    height: 580,
    data: g6Data,
    node: {
      style: {
        labelText: (d: any) => d.style?.labelText || d.id,
        labelPlacement: "bottom",
      },
    },
    edge: {
      style: {
        endArrow: true,
      },
    },
    layout: {
      type: "force",
      linkDistance: 150,
    },
    behaviors: ["drag-canvas", "zoom-canvas", "drag-element"],
  });
  graphInstance.render();
};

const fitGraphView = () => {
  graphInstance?.fitView();
};

watch(relationGraphVisible, (visible) => {
  if (!visible) {
    graphInstance?.destroy();
    graphInstance = null;
  } else {
    nextTick(() => {
      if (graphContainerRef.value) {
        graphInstance?.setSize(
          graphContainerRef.value.scrollWidth,
          580,
        );
      }
    });
  }
});

const buildProcessAiPrompt = (process?: ServerProcessView | null) =>
  [
    `服务器：${props.host?.serverName || props.host?.host || "-"}`,
    `进程名称：${process?.name || process?.command || "-"}`,
    `PID：${process?.pid || "-"}`,
    `用户：${process?.user || "-"}`,
    `CPU：${formatPercent(process?.cpuPercent)}`,
    `内存：${formatPercent(process?.memoryPercent)}`,
    `内存占用：${formatBytes(process?.memoryBytes)}`,
    `启动时间：${formatStartTime(process?.startTime)}`,
    `命令行：${process?.commandLine || process?.command || "-"}`,
    "请判断该进程是否存在风险、是否异常占用资源，以及优先处理建议。",
  ].join("\n");

const highRiskCount = computed(
  () =>
    props.processes.filter(
      (item) =>
        toPercent(item.cpuPercent) >= 80 || toPercent(item.memoryPercent) >= 30,
    ).length,
);

const toViewMode = (value: unknown): "card" | "list" | "tree" => {
  if (value === "card" || value === "tree") {
    return value;
  }
  return "list";
};

const toSortKey = (
  value: unknown,
): "cpu" | "memory" | "pid" | "name" | "elapsed" => {
  if (
    value === "memory" ||
    value === "pid" ||
    value === "name" ||
    value === "elapsed"
  ) {
    return value;
  }
  return "cpu";
};

const selectedProcessIdsSet = computed(
  () =>
    new Set(
      (props.selectedProcessIds || [])
        .map((item) => Number(item || 0))
        .filter((item) => item > 0),
    ),
);

const displayedProcesses = computed(() => [...(props.processes || [])]);
const treeProcesses = computed<ProcessTreeNode[]>(() => {
  const source = displayedProcesses.value;
  const nodeMap = new Map<number, ProcessTreeNode>();
  const roots: ProcessTreeNode[] = [];
  source.forEach((item) => {
    const pid = Number(item.pid || 0);
    if (pid > 0) {
      nodeMap.set(pid, { ...item, children: [] });
    }
  });
  source.forEach((item) => {
    const pid = Number(item.pid || 0);
    const parentPid = Number(item.parentPid || 0);
    const node = pid > 0 ? nodeMap.get(pid) : null;
    if (!node) {
      return;
    }
    if (parentPid > 0 && parentPid !== pid && nodeMap.has(parentPid)) {
      nodeMap.get(parentPid)?.children?.push(node);
      return;
    }
    roots.push(node);
  });
  return roots;
});

const listProcesses = computed(() => displayedProcesses.value);
const highLoadProcesses = computed(() =>
  displayedProcesses.value.filter(
    (item) =>
      toPercent(item.cpuPercent) >= 80 || toPercent(item.memoryPercent) >= 30,
  ),
);

const selectedProcesses = computed(() => {
  const selectedIds = selectedProcessIdsSet.value;
  return displayedProcesses.value.filter((item) =>
    selectedIds.has(Number(item.pid || 0)),
  );
});

const handleSelectionChange = (rows: ServerProcessView[]) => {
  if (!props.terminateSelectionMode) {
    return;
  }
  emit(
    "update:selectedProcessIds",
    rows
      .map((item) => Number(item.pid || 0))
      .filter((item) => item > 0),
  );
};

const isZombie = (process?: ServerProcessView | null) => {
  const state = String(process?.state || "").toUpperCase();
  return state.startsWith("Z");
};

const zombieCount = computed(
  () => props.processStats?.zombie ?? props.processes.filter(isZombie).length,
);

const processRowClassName = ({ row }: { row: ServerProcessView }) => {
  if (isZombie(row)) {
    return "row-zombie";
  }
  const cpu = toPercent(row.cpuPercent);
  const mem = toPercent(row.memoryPercent);
  if (cpu >= 80 || mem >= 30) {
    return "row-danger";
  }
  if (cpu >= 40 || mem >= 15) {
    return "row-warning";
  }
  return "row-ok";
};

const formatBytesPerSecond = (value?: number | null) => {
  const v = Number(value || 0);
  if (!Number.isFinite(v) || v <= 0) {
    return "-";
  }
  return `${formatBytes(v)}/s`;
};

const toggleProcessSelection = (
  process: ServerProcessView,
  checked: boolean,
) => {
  const pid = Number(process.pid || 0);
  if (!pid) {
    return;
  }
  const next = new Set(selectedProcessIdsSet.value);
  if (checked) {
    next.add(pid);
  } else {
    next.delete(pid);
  }
  emit("update:selectedProcessIds", [...next]);
};

const handleTableSortChange = (payload: {
  prop?: string;
  order?: "ascending" | "descending" | null;
}) => {
  const sortKey = toSortKey(
    payload.prop === "cpuPercent"
      ? "cpu"
      : payload.prop === "memoryPercent"
        ? "memory"
        : payload.prop === "pid"
          ? "pid"
          : payload.prop === "name"
            ? "name"
            : payload.prop === "elapsed"
              ? "elapsed"
              : props.sortKey,
  );
  const sortOrder: "asc" | "desc" =
    payload.order === "ascending" ? "asc" : "desc";
  emit("update:sortKey", sortKey);
  emit("update:sortOrder", sortOrder);
  emit("sort-change", { sortKey, sortOrder });
};

const sortLabel = computed(() => {
  const value = toSortKey(props.sortKey);
  return (
    {
      cpu: "CPU",
      memory: "内存",
      pid: "PID",
      name: "名称",
      elapsed: "运行时长",
    }[value] || "CPU"
  );
});

const processProviderLabel = (process?: ServerProcessView | null) => {
  const normalized = String(
    process?.executionProvider || process?.spiChannel || props.host?.serverType,
  )
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

const processProviderText = computed(() =>
  processProviderLabel(props.selectedProcess || props.processes[0] || null),
);

const shortProcessName = (process?: ServerProcessView | null) => {
  const name = String(process?.name || process?.command || "未命名进程").trim();
  return name.length > 26 ? `${name.slice(0, 26)}...` : name;
};

const isJavaProcess = (process?: ServerProcessView | null) => {
  const text = `${process?.name || ""} ${process?.command || ""} ${process?.commandLine || ""}`.toLowerCase();
  return text.includes("java");
};

const toPercent = (value?: number | null) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const formatPercent = (value?: number | null) =>
  Number.isFinite(Number(value)) ? `${Number(value).toFixed(1)}%` : "--";

const formatBytes = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "内存未知";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = numeric;
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index += 1;
  }
  return `${size.toFixed(size >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatDateTime = (value?: number | null) =>
  value ? new Date(value).toLocaleString("zh-CN", { hour12: false }) : "--";
const formatStartTime = (value?: string | null) => {
  if (!value) {
    return "启动时间未知";
  }
  const time = new Date(value).getTime();
  if (!Number.isFinite(time) || time <= 0) {
    return value;
  }
  return new Date(time).toLocaleString("zh-CN", { hour12: false });
};
const formatElapsed = (value?: string | null) => value || "刚启动";

watch(
  () => props.selectedProcess?.pid,
  (value) => {
    if (!value) {
      inlineDetailVisible.value = false;
    }
    if (!detailVisible.value || !value) {
      return;
    }
    detailPid.value = value;
  },
);

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      return;
    }
    detailVisible.value = false;
    highLoadVisible.value = false;
    detailPid.value = null;
    inlineDetailVisible.value = false;
  },
);

watch(
  () => props.terminateSelectionMode,
  (enabled) => {
    if (enabled) {
      return;
    }
    emit("update:selectedProcessIds", []);
  },
);
</script>

<style scoped lang="scss">
.server-process-dialog :deep(.el-dialog) {
  max-width: 1460px;
  border-radius: 32px;
  overflow: hidden;
  box-shadow:
    0 48px 96px rgba(15, 23, 42, 0.16),
    0 24px 48px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.server-process-dialog :deep(.el-dialog__body) {
  padding-top: 0;
}

.server-process-dialog__header,
.server-process-dialog__summary,
.server-process-dialog__toolbar,
.server-process-dialog__toolbar-actions,
.server-process-dialog__item-top,
.server-process-dialog__item-bottom,
.server-process-dialog__metric-row,
.server-process-dialog__detail-hero,
.server-process-dialog__detail-actions,
.server-process-dialog__ai-top,
.server-process-detail-dialog__hero,
.server-process-detail-dialog__actions,
.server-process-detail-dialog__ai-top {
  display: flex;
  align-items: center;
}

.server-process-dialog__toolbar_reverse {
  flex: 1;
  flex-direction: row-reverse;
  gap: 20;
  align-items: center;
}
.server-process-dialog__header,
.server-process-dialog__toolbar,
.server-process-dialog__detail-hero,
.server-process-dialog__ai-top {
  justify-content: space-between;
}

.server-process-dialog__header {
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.server-process-dialog__header h3 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.server-process-dialog__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__hint {
  display: block;
  margin-top: 6px;
  color: #b45309;
  font-size: 12px;
}

.server-process-dialog__summary {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-process-dialog__chip {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  color: #334155;
  background: rgba(15, 23, 42, 0.06);
}

.server-process-dialog__chip--action {
  cursor: pointer;
}

.server-process-dialog__chip.is-success {
  color: #047857;
  background: rgba(16, 185, 129, 0.12);
}

.server-process-dialog__chip--zombie {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
  font-weight: 600;
}

.server-process-dialog__state-filter {
  margin-right: 12px;
}

.server-process-dialog__filter-zombie {
  color: #dc2626;
  font-weight: 600;
}

.server-process-dialog__state-tag {
  font-size: 11px;
  font-weight: 600;
}

.server-process-dialog__chip.is-muted {
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
}

.server-process-dialog__toolbar {
  gap: 14px;
  margin-bottom: 16px;
  padding: 16px 18px;
  border-radius: 24px;
  background:
    radial-gradient(ellipse 80% 60% at 95% 5%, rgba(14, 165, 233, 0.1), transparent 50%),
    radial-gradient(ellipse 60% 40% at 5% 95%, rgba(245, 158, 11, 0.06), transparent 50%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(248, 250, 252, 0.96));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 20px 40px rgba(15, 23, 42, 0.06),
    0 8px 16px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-process-dialog__toolbar-actions {
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.server-process-dialog__sorter {
  width: 148px;
}

.server-process-dialog__search {
  width: min(320px, 100%);
}

.server-process-dialog__switch-label {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__stage {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  min-height: 620px;
  align-items: stretch;
}

.server-process-dialog__stage--detail {
  grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1.22fr);
}

.server-process-dialog__list,
.server-process-dialog__detail {
  min-height: 0;
  min-width: 0;
  padding: 18px;
  border-radius: 26px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 22%),
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 30%),
    rgba(248, 250, 252, 0.94);
  box-shadow:
    0 18px 34px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-process-dialog__list {
  display: grid;
  gap: 10px;
  align-content: start;
  overflow: auto;
  max-height: 620px;
  overflow-x: hidden;
}

.server-process-dialog__detail {
  display: grid;
  gap: 14px;
  align-content: start;
  overflow: auto;
  max-height: 620px;
  overflow-x: hidden;
}

.server-process-dialog__table :deep(.el-table) {
  border-radius: 20px;
  overflow: hidden;
}

.server-process-dialog__table--list :deep(.el-table__row.row-ok) {
  background: rgba(16, 185, 129, 0.06);
}

.server-process-dialog__table--list :deep(.el-table__row.row-warning) {
  background: rgba(245, 158, 11, 0.1);
}

.server-process-dialog__table--list :deep(.el-table__row.row-zombie) {
  background: rgba(239, 68, 68, 0.08);
}

.server-process-dialog__table--list :deep(.el-table__row.row-zombie:hover) {
  background: rgba(239, 68, 68, 0.16);
}

.server-process-dialog__table :deep(.el-table__row.row-zombie) {
  background: rgba(239, 68, 68, 0.08);
}

.server-process-dialog__table :deep(.el-table__row.row-zombie:hover) {
  background: rgba(239, 68, 68, 0.16);
}

.server-process-dialog__table--list :deep(.el-table__row.row-danger) {
  background: rgba(239, 68, 68, 0.1);
}

.server-process-dialog__taskmgr-main {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.server-process-dialog__taskmgr-name {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.server-process-dialog__taskmgr-meta {
  flex-shrink: 0;
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__taskmgr-desc,
.server-process-dialog__taskmgr-desc-cell {
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-process-dialog__table-main {
  display: grid;
  gap: 4px;
}

.server-process-dialog__table-headline {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.server-process-dialog__table-main strong {
  color: #0f172a;
}

.server-process-dialog__table-main span {
  color: #64748b;
  font-size: 12px;
  line-height: 1.55;
  overflow: hidden;
  word-break: break-all;
}

.server-process-dialog__item {
  width: 100%;
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.server-process-dialog__item:hover,
.server-process-dialog__item.is-active {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow:
    0 18px 28px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-process-dialog__item.is-warning {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.16);
}

.server-process-dialog__item.is-danger {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-process-dialog__item.is-zombie {
  border-color: rgba(239, 68, 68, 0.35);
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.06), rgba(248, 250, 252, 0.9));
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.25);
}

.server-process-dialog__item-top {
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.server-process-dialog__item-head-main,
.server-process-dialog__item-actions,
.server-process-dialog__table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.server-process-dialog__item-head-main {
  min-width: 0;
}

.server-process-dialog__item-bottom {
  justify-content: space-between;
  gap: 10px;
}

.server-process-dialog__item-top strong,
.server-process-dialog__detail-hero h4 {
  color: #0f172a;
}

.server-process-dialog__item-top strong {
  font-size: 15px;
}

.server-process-dialog__item-top p,
.server-process-dialog__inline-meta,
.server-process-dialog__command,
.server-process-dialog__detail-hero p,
.server-process-dialog__detail-block p,
.server-process-dialog__ai-card p,
.server-process-dialog__ai-card small {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
}

.server-process-dialog__command {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  white-space: normal;
  word-break: break-all;
}

.server-process-dialog__command--table {
  display: -webkit-box;
  max-width: 100%;
}

.server-process-dialog__inline-meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.server-process-dialog__item-head-main strong {
  display: inline-block;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-process-dialog__metric-row {
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
  color: #475569;
  font-size: 12px;
  overflow: hidden;
}

.server-process-dialog__metric-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-process-dialog__state {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(14, 165, 233, 0.1);
  color: #0369a1;
  font-size: 12px;
  font-weight: 600;
}

.server-process-dialog__state.is-zombie {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}

.server-process-dialog__detail-hero {
  gap: 14px;
  align-items: flex-start;
  padding: 20px 22px;
  min-height: 112px;
  border-radius: 26px;
  background:
    radial-gradient(circle at 100% 0%, rgba(245, 158, 11, 0.08), transparent 24%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 34%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 18px 32px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.server-process-dialog__detail-hero h4 {
  margin: 0;
  font-size: 22px;
}

.server-process-dialog__detail-actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex-shrink: 0;
}

.server-process-dialog__detail-pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.server-process-dialog__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.server-process-dialog__stat,
.server-process-dialog__detail-card,
.server-process-dialog__ai-card {
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  box-shadow:
    0 10px 18px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-process-dialog__stat {
  display: grid;
  gap: 6px;
  padding: 14px;
}

.server-process-dialog__stat-bar {
  width: 100%;
  height: 7px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(14, 165, 233, 0.12);
}

.server-process-dialog__stat-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0ea5e9, #0284c7);
}

.server-process-dialog__stat-bar.is-memory {
  background: rgba(99, 102, 241, 0.12);
}

.server-process-dialog__stat-bar.is-memory span {
  background: linear-gradient(90deg, #6366f1, #4338ca);
}

.server-process-dialog__stat small,
.server-process-dialog__detail-grid small,
.server-process-dialog__detail-block small {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__stat strong {
  font-size: 18px;
  color: #0f172a;
}

.server-process-dialog__stat span {
  color: #64748b;
  font-size: 12px;
}

.server-process-dialog__detail-card {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.server-process-dialog__detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.server-process-dialog__detail-grid strong,
.server-process-dialog__detail-block p {
  word-break: break-word;
}

.server-process-dialog__detail-grid strong {
  color: #0f172a;
}

.server-process-dialog__detail-block {
  display: grid;
  gap: 6px;
}

.server-process-dialog__ai-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  background: linear-gradient(
    135deg,
    rgba(14, 165, 233, 0.08),
    rgba(255, 255, 255, 0.98)
  );
}

.server-process-dialog__ai-top strong {
  color: #0f172a;
}

.server-process-detail-dialog__hero,
.server-process-detail-dialog__ai-top {
  justify-content: space-between;
}

.server-process-detail-dialog__hero {
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 14px;
}

.server-process-detail-dialog__hero h4,
.server-process-detail-dialog__card h5 {
  margin: 0;
  color: #0f172a;
}

.server-process-detail-dialog__hero p,
.server-process-detail-dialog__command,
.server-process-detail-dialog__meta dd {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
  word-break: break-word;
}

.server-process-detail-dialog__actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-process-detail-dialog__stats,
.server-process-detail-dialog__grid,
.server-process-detail-dialog__meta {
  display: grid;
  gap: 12px;
}

.server-process-detail-dialog__stats {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
}

.server-process-detail-dialog__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-process-detail-dialog__card,
.server-process-detail-dialog__stat {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(248, 250, 252, 0.92);
}

.server-process-detail-dialog__card--wide {
  grid-column: 1 / -1;
}

.server-process-detail-dialog__stat small,
.server-process-detail-dialog__meta dt {
  color: #64748b;
  font-size: 12px;
}

.server-process-detail-dialog__stat strong,
.server-process-detail-dialog__meta dd {
  color: #0f172a;
}

.server-process-detail-dialog__stat strong {
  font-size: 18px;
}

.server-process-detail-dialog__stat span {
  color: #64748b;
  font-size: 12px;
}

.server-process-detail-dialog__meta {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 1080px) {
  .server-process-dialog__stage {
    grid-template-columns: 1fr;
  }

  .server-process-dialog__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-process-detail-dialog__stats,
  .server-process-detail-dialog__grid,
  .server-process-detail-dialog__meta {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .server-process-dialog__toolbar {
    display: grid;
  }

  .server-process-dialog__toolbar-actions,
  .server-process-dialog__detail-actions,
  .server-process-dialog__summary {
    justify-content: flex-start;
  }

  .server-process-dialog__stats,
  .server-process-dialog__detail-grid,
  .server-process-detail-dialog__stats,
  .server-process-detail-dialog__grid,
  .server-process-detail-dialog__meta {
    grid-template-columns: 1fr;
  }
}

// ── 数字动画 ──────────────────────────────────
.server-process-dialog__stat-value {
  display: inline-block;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  animation: server-process-number-pop 0.4s ease-out;
}

@keyframes server-process-number-pop {
  from {
    opacity: 0.4;
    transform: translateY(4px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// ── 进程关系图谱 ──────────────────────────────
.server-process-graph-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.server-process-graph-dialog__canvas {
  width: 100%;
  height: 580px;
  border-radius: 16px;
  background: #f8fafc;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.15);
}
</style>
