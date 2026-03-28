<template>
  <div class="spring-page-shell spider-page-shell">
    <header class="spring-hero">
      <div>
        <span class="spring-eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </div>
      <div class="spring-hero-actions">
        <button type="button" class="spring-ghost-button" @click="settingsVisible = true">
          接口设置
        </button>
        <button type="button" class="spring-ghost-button" @click="refreshAll">
          刷新
        </button>
        <button type="button" class="spring-primary-button" @click="openEditor()">
          新建任务
        </button>
      </div>
    </header>

    <section class="spring-toolbar spring-card">
      <label class="spring-field">
        <span>任务名称</span>
        <input
          v-model.trim="filters.keyword"
          type="text"
          placeholder="回车搜索"
          @keyup.enter="refreshTasks"
        >
      </label>
      <label class="spring-field">
        <span>任务状态</span>
        <select v-model="filters.status">
          <option value="">全部</option>
          <option v-for="status in TASK_STATUS_OPTIONS" :key="status.value" :value="String(status.value)">
            {{ status.label }}
          </option>
        </select>
      </label>
      <label class="spring-field">
        <span>每页大小</span>
        <select v-model="filters.pageSize">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
        </select>
      </label>
      <label class="spring-field">
        <span>当前任务</span>
        <input
          :value="selectedTask?.spiderTaskName || '未选择任务'"
          type="text"
          readonly
        >
      </label>
      <div class="spring-toolbar-actions">
        <button type="button" class="spring-ghost-button" @click="refreshTasks">
          查询
        </button>
      </div>
    </section>

    <section class="spring-metrics">
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">任务总数</span>
        <strong class="spring-metric-value">{{ formatNumber(taskTotal) }}</strong>
        <small>当前筛选下的任务规模</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">运行中</span>
        <strong class="spring-metric-value spring-accent-green">{{ formatNumber(runningCount) }}</strong>
        <small>状态为 RUNNING 的任务</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">表状态</span>
        <strong class="spring-metric-value spring-accent-blue">{{ tableStatus?.ready ? "READY" : "PENDING" }}</strong>
        <small>{{ tableStatusSummary }}</small>
      </article>
      <article class="spring-metric-card spring-card">
        <span class="spring-metric-label">数据源</span>
        <strong class="spring-metric-value spring-accent-amber">{{ formatNumber(enabledDataSourceCount) }}</strong>
        <small>当前可用数据库输出目标</small>
      </article>
    </section>

    <section class="spring-layout-grid">
      <article class="spring-panel spring-card">
        <div class="spring-panel-header">
          <div>
            <h2>爬虫任务</h2>
            <p>轻页面里直接维护任务、运行状态和可视化编排入口。</p>
          </div>
          <span class="spring-panel-meta">{{ loading.tasks ? "加载中" : `${tasks.length} / ${taskTotal}` }}</span>
        </div>
        <div class="spring-table-shell">
          <table class="spring-table">
            <thead>
              <tr>
                <th>任务</th>
                <th>调度</th>
                <th>状态</th>
                <th>数据</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading.tasks">
                <td colspan="5" class="spring-empty-cell">正在加载任务...</td>
              </tr>
              <tr v-else-if="!tasks.length">
                <td colspan="5" class="spring-empty-cell">当前没有爬虫任务。</td>
              </tr>
              <tr
                v-for="task in tasks"
                v-else
                :key="task.spiderTaskId || task.spiderTaskName"
                :class="{ 'spring-active-row': isSelectedTask(task) }"
                @click="selectedTask = task"
              >
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">{{ task.spiderTaskName || "未命名任务" }}</span>
                    <span class="spring-muted-line">#{{ task.spiderTaskId || "-" }}</span>
                    <span class="spring-muted-line">{{ task.spiderTaskUrl || "未配置 URL" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip">{{ task.spiderTaskScheduleType || "NONE" }}</span>
                    <span class="spring-muted-line">{{ task.spiderTaskCron || "手动执行" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-chip" :class="runStatusClass(task.spiderTaskRunStatus)">
                      {{ task.spiderTaskRunStatus || "IDLE" }}
                    </span>
                    <span class="spring-muted-line">{{ taskStatusLabel(task.spiderTaskStatus) }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <span class="spring-title-strong">
                      {{ formatNumber(task.spiderTaskTotalSuccess) }} / {{ formatNumber(task.spiderTaskTotalFail) }}
                    </span>
                    <span class="spring-muted-line">{{ formatDateTime(task.spiderTaskLastRunTime) || "从未执行" }}</span>
                  </div>
                </td>
                <td>
                  <div class="spring-table-title">
                    <button type="button" class="spring-text-button" @click.stop="focusTaskStudio(task)">编排</button>
                    <button type="button" class="spring-text-button" @click.stop="openEditor(task)">编辑</button>
                    <button
                      type="button"
                      class="spring-text-button"
                      @click.stop="toggleTaskRun(task)"
                    >
                      {{ upper(task.spiderTaskRunStatus) === "RUNNING" ? "停止" : "运行" }}
                    </button>
                    <button type="button" class="spring-text-button" @click.stop="deleteTask(task)">删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="spring-side-column">
        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>任务详情</h2>
              <p>当前选中任务的关键运行配置。</p>
            </div>
            <span class="spring-panel-meta">{{ selectedTask?.spiderTaskRunStatus || "未选择" }}</span>
          </div>
          <div v-if="selectedTask" class="spring-detail-content">
            <div class="spring-detail-grid">
              <div v-for="item in detailItems" :key="item.label" class="spring-detail-item">
                <small>{{ item.label }}</small>
                <strong>{{ item.value }}</strong>
              </div>
            </div>
          </div>
          <div v-else class="spring-detail-content spring-empty-state">
            请选择任务后查看。
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>最近日志</h2>
              <p>展示当前任务最近 6 条执行日志。</p>
            </div>
            <button type="button" class="spring-text-button" @click="loadLogs">
              {{ loading.logs ? "加载中..." : "刷新日志" }}
            </button>
          </div>
          <div class="spring-log-list">
            <div v-if="loading.logs" class="spring-empty-state">正在加载日志...</div>
            <div v-else-if="!logs.length" class="spring-empty-state">
              {{ selectedTask ? "当前任务暂无日志。" : "请选择任务后查看日志。" }}
            </div>
            <article
              v-for="log in logs"
              v-else
              :key="log.spiderLogId || log.createTime"
              class="spring-log-card"
            >
              <div class="spring-log-card-head">
                <div class="spring-table-title">
                  <span class="spring-title-strong">{{ log.spiderLogLevel || "INFO" }}</span>
                  <span class="spring-muted-line">{{ formatDateTime(log.spiderLogTime || log.createTime) || "-" }}</span>
                </div>
                <span class="spring-chip" :class="logLevelClass(log.spiderLogLevel)">
                  {{ log.spiderLogLevel || "INFO" }}
                </span>
              </div>
              <p>{{ log.spiderLogMessage || "暂无日志内容" }}</p>
              <p v-if="log.spiderLogUrl" class="spring-muted-line">{{ log.spiderLogUrl }}</p>
            </article>
          </div>
        </article>

        <article class="spring-panel spring-card">
          <div class="spring-panel-header">
            <div>
              <h2>基础表</h2>
              <p>初始化爬虫任务、节点、连接、日志和数据表。</p>
            </div>
            <span class="spring-panel-meta">{{ tableStatus?.ready ? "已就绪" : "未就绪" }}</span>
          </div>
          <div class="spring-detail-content">
            <div v-if="loading.tables" class="spring-empty-state">正在检查表状态...</div>
            <div v-else-if="!tableStatus" class="spring-empty-state">未获取到表状态。</div>
            <div v-else class="spring-detail-grid">
              <div
                v-for="item in tableStatusItems"
                :key="item.name"
                class="spring-detail-item"
              >
                <small>{{ item.name }}</small>
                <strong>{{ item.exists ? "存在" : "缺失" }}</strong>
                <span class="spring-muted-line">{{ item.note }}</span>
              </div>
            </div>
            <p v-if="missingColumnsSummary" class="spring-muted-line spider-inline-note">{{ missingColumnsSummary }}</p>
          </div>
          <div class="spring-detail-content">
            <div class="spring-detail-actions">
              <button
                type="button"
                class="spring-primary-button"
                :disabled="loading.initTables"
                @click="initializeTables(false)"
              >
                {{ loading.initTables ? "初始化中..." : "初始化表" }}
              </button>
              <button
                type="button"
                class="spring-danger-button"
                :disabled="loading.initTables"
                @click="initializeTables(true)"
              >
                强制重建
              </button>
            </div>
          </div>
        </article>
      </aside>
    </section>

    <section ref="studioRef" class="spider-studio spring-card">
      <div class="spider-studio-header">
        <div>
          <span class="spring-eyebrow spider-studio-eyebrow">Spider Studio</span>
          <h2>可视化编排</h2>
          <p>左侧选插件，中间排节点，右侧配参数。数据处理器和数据库输出支持直接选 XPath。</p>
        </div>
        <div class="spring-hero-actions">
          <button type="button" class="spring-ghost-button" @click="loadCatalog">
            载入插件
          </button>
          <button
            type="button"
            class="spring-ghost-button"
            :disabled="!selectedTask?.spiderTaskId"
            @click="loadDesign"
          >
            重载设计
          </button>
          <button
            type="button"
            class="spring-ghost-button"
            :disabled="!selectedTask?.spiderTaskId"
            @click="validateDesign"
          >
            验证
          </button>
          <button
            type="button"
            class="spring-primary-button"
            :disabled="!selectedTask?.spiderTaskId || loading.saveDesign"
            @click="saveDesign"
          >
            {{ loading.saveDesign ? "保存中..." : "保存编排" }}
          </button>
        </div>
      </div>

      <div v-if="designErrors.length" class="spider-validation-list">
        <article v-for="(item, index) in designErrors" :key="`${index}-${item}`" class="spider-validation-item">
          {{ item }}
        </article>
      </div>

      <div v-if="!selectedTask?.spiderTaskId" class="spring-empty-state spider-studio-empty">
        先在上面选中一个任务，再开始可视化编排。
      </div>
      <div v-else class="spider-studio-body">
        <aside class="spider-palette">
          <div class="spider-palette-header">
            <h3>插件面板</h3>
            <span>{{ paletteCount }} 个可用插件</span>
          </div>
          <section
            v-for="group in paletteGroups"
            :key="group.type"
            class="spider-palette-group"
          >
            <header>
              <strong :style="{ color: group.color }">{{ group.label }}</strong>
              <small>{{ group.items.length }} 个</small>
            </header>
            <div v-if="group.items.length" class="spider-palette-items">
              <button
                v-for="spi in group.items"
                :key="`${group.type}-${spi.name}`"
                type="button"
                class="spider-palette-item"
                @click="addNode(group.type, spi)"
              >
                <span class="spider-palette-item-name">{{ spi.displayName || spi.name }}</span>
                <span class="spider-palette-item-desc">{{ spi.description || "无描述" }}</span>
              </button>
            </div>
            <div v-else class="spider-palette-empty">当前分类暂无插件。</div>
          </section>
        </aside>

        <div class="spider-canvas-shell">
          <div class="spider-canvas-toolbar">
            <div class="spider-canvas-meta">
              <span class="spring-chip">{{ design.nodes.length }} 个节点</span>
              <span class="spring-chip">{{ design.connections.length }} 条连接</span>
              <span v-if="connectingFromNode" class="spring-chip spring-running">
                正在从 {{ connectingFromNode.nodeName }} 连接
              </span>
            </div>
            <div class="spring-toolbar-actions">
              <button
                type="button"
                class="spring-ghost-button"
                :disabled="!selectedTask?.spiderTaskId"
                @click="clearDesign"
              >
                清空画布
              </button>
              <button
                type="button"
                class="spring-ghost-button"
                :disabled="!connectingFromNode"
                @click="cancelConnection"
              >
                取消连线
              </button>
            </div>
          </div>
          <div ref="canvasRef" class="spider-canvas" @click="handleCanvasClick">
            <svg class="spider-connections" preserveAspectRatio="none">
              <path
                v-for="connection in design.connections"
                :key="connection.connectionId || `${connection.sourceNodeId}-${connection.targetNodeId}`"
                :d="connectionPath(connection)"
                class="spider-connection-line"
                @click.stop="deleteConnection(connection)"
              />
            </svg>
            <article
              v-for="node in design.nodes"
              :key="node.nodeId || node.nodeKey || node.nodeName"
              class="spider-node"
              :class="{ 'spider-node-active': selectedNode?.nodeId === node.nodeId }"
              :style="nodeStyle(node)"
              @click.stop="selectNode(node)"
            >
              <header
                class="spider-node-header"
                :style="{ borderColor: nodeColor(node.nodeType) }"
                @mousedown.stop="beginNodeDrag($event, node)"
              >
                <div>
                  <strong>{{ node.nodeName }}</strong>
                  <small>{{ nodeTypeLabel(node.nodeType) }} · {{ node.spiName }}</small>
                </div>
                <button type="button" class="spider-node-delete" @click.stop="deleteNode(node)">
                  ×
                </button>
              </header>
              <div class="spider-node-body">
                <p>{{ node.nodeDescription || "点击右侧开始配置节点参数。" }}</p>
                <div class="spider-node-tags">
                  <span class="spring-chip">{{ node.nodeEnabled === false ? "DISABLED" : "ENABLED" }}</span>
                  <span v-if="node.nodeConfig" class="spring-chip">已配置</span>
                </div>
              </div>
              <footer class="spider-node-footer">
                <button type="button" class="spring-text-button" @click.stop="startConnection(node)">
                  输出端
                </button>
                <button
                  type="button"
                  class="spring-text-button"
                  :disabled="!connectingFromNode || connectingFromNode.nodeId === node.nodeId"
                  @click.stop="completeConnection(node)"
                >
                  输入端
                </button>
              </footer>
            </article>
            <div v-if="!design.nodes.length" class="spring-empty-state spider-canvas-empty">
              从左侧插件面板点击一个组件，开始排你的爬虫流程。
            </div>
          </div>
        </div>

        <aside class="spider-inspector">
          <div class="spider-inspector-header">
            <div>
              <h3>节点属性</h3>
              <p>{{ selectedNode ? `${selectedNode.nodeName} · ${selectedNode.spiName}` : "选择画布节点后查看配置" }}</p>
            </div>
          </div>

          <div v-if="selectedNode" class="spider-inspector-body">
            <div class="spring-form-grid">
              <label class="spring-form-field">
                <span>节点名称</span>
                <input v-model.trim="selectedNode.nodeName" type="text">
              </label>
              <label class="spring-form-field">
                <span>节点类型</span>
                <input :value="nodeTypeLabel(selectedNode.nodeType)" type="text" readonly>
              </label>
              <label class="spring-form-field">
                <span>SPI</span>
                <input :value="selectedNode.spiName" type="text" readonly>
              </label>
              <label class="spring-form-field">
                <span>是否启用</span>
                <select v-model="selectedNodeEnabledValue">
                  <option value="1">启用</option>
                  <option value="0">停用</option>
                </select>
              </label>
              <label class="spring-form-field spring-field-span-2">
                <span>描述</span>
                <textarea
                  v-model.trim="selectedNode.nodeDescription"
                  rows="3"
                  placeholder="这个节点在整条爬虫链路里做什么"
                />
              </label>
            </div>

            <div class="spider-inspector-section">
              <div class="spider-section-head">
                <h4>参数配置</h4>
                <span>{{ nodeParams.length }} 个参数</span>
              </div>
              <div v-if="loading.nodeParams" class="spring-empty-state">正在加载参数...</div>
              <div v-else-if="!nodeParams.length" class="spring-empty-state">当前节点没有额外参数。</div>
              <div v-else class="spring-form-grid">
                <template v-for="param in nodeParams" :key="param.name">
                  <label v-if="isBooleanParam(param)" class="spring-form-field">
                    <span>{{ param.label || param.name }}</span>
                    <select v-model="nodeConfigState[param.name]">
                      <option :value="true">true</option>
                      <option :value="false">false</option>
                    </select>
                  </label>
                  <label v-else-if="isSelectParam(param)" class="spring-form-field">
                    <span>{{ param.label || param.name }}</span>
                    <select v-model="nodeConfigState[param.name]">
                      <option value="">{{ param.placeholder || "请选择" }}</option>
                      <option
                        v-for="option in asList(param.options)"
                        :key="String(option.value)"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </option>
                    </select>
                  </label>
                  <label
                    v-else-if="isLongParam(param)"
                    class="spring-form-field spring-field-span-2"
                  >
                    <span>{{ param.label || param.name }}</span>
                    <textarea
                      v-model="nodeConfigState[param.name]"
                      rows="4"
                      :placeholder="param.placeholder || param.description || ''"
                    />
                  </label>
                  <label v-else class="spring-form-field">
                    <span>{{ param.label || param.name }}</span>
                    <input
                      v-model="nodeConfigState[param.name]"
                      :type="inputType(param)"
                      :placeholder="param.placeholder || param.description || ''"
                    >
                  </label>

                  <div
                    v-if="isSelectorParam(param)"
                    class="spider-selector-tools spring-field-span-2"
                  >
                    <span class="spring-muted-line">
                      {{ param.description || "支持直接写选择器，也支持可视化点选页面元素。" }}
                    </span>
                    <div class="spring-toolbar-actions">
                      <button
                        type="button"
                        class="spring-ghost-button"
                        @click="openInspectorForParam(param)"
                      >
                        可视化选取
                      </button>
                      <button
                        type="button"
                        class="spring-ghost-button"
                        :disabled="loading.selectorTest"
                        @click="testSelectorParam(param)"
                      >
                        测试选择器
                      </button>
                    </div>
                    <div
                      v-if="selectorResults[param.name]?.length"
                      class="spider-selector-result"
                    >
                      <span
                        v-for="(item, index) in selectorResults[param.name].slice(0, 4)"
                        :key="`${param.name}-${index}`"
                        class="spring-chip"
                      >
                        {{ item }}
                      </span>
                      <span
                        v-if="selectorResults[param.name].length > 4"
                        class="spring-muted-line"
                      >
                        +{{ selectorResults[param.name].length - 4 }} 条
                      </span>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <div v-if="isDatabasePipelineSelected" class="spider-inspector-section">
              <div class="spider-section-head">
                <h4>数据库输出</h4>
                <span>建表 / 同步结构</span>
              </div>
              <div class="spring-form-grid">
                <label class="spring-form-field">
                  <span>目标数据源</span>
                  <select v-model="nodeConfigState.dataSourceSettingId">
                    <option value="">当前监控库</option>
                    <option
                      v-for="item in dataSourceOptions"
                      :key="item.settingId ?? `builtin-${item.name}`"
                      :value="item.settingId ?? ''"
                    >
                      {{ item.name }}{{ item.database ? ` / ${item.database}` : "" }}
                    </option>
                  </select>
                </label>
                <label class="spring-form-field">
                  <span>输出表名</span>
                  <input
                    v-model.trim="nodeConfigState.tableName"
                    type="text"
                    placeholder="例如 spider_news_article"
                  >
                </label>
                <label class="spring-form-field spring-field-span-2">
                  <span>表注释</span>
                  <textarea
                    v-model.trim="nodeConfigState.tableComment"
                    rows="2"
                    placeholder="表用途说明"
                  />
                </label>
              </div>

              <div class="spider-table-actions">
                <button type="button" class="spring-ghost-button" @click="checkOutputTableExists">
                  检查表
                </button>
                <button type="button" class="spring-ghost-button" @click="previewOutputTableSql">
                  预览 SQL
                </button>
                <button type="button" class="spring-ghost-button" @click="loadOutputTableStructure">
                  查看结构
                </button>
                <button type="button" class="spring-primary-button" @click="createOutputTable">
                  创建表
                </button>
                <button type="button" class="spring-primary-button" @click="syncOutputTableStructure">
                  同步结构
                </button>
              </div>

              <div class="spider-inline-note">
                输出表是否存在：
                <strong>{{ outputTableExists === null ? "未检查" : outputTableExists ? "已存在" : "不存在" }}</strong>
              </div>

              <div class="spider-columns-header">
                <h5>字段定义</h5>
                <button type="button" class="spring-ghost-button" @click="addOutputColumn">
                  添加字段
                </button>
              </div>
              <div v-if="!outputColumns.length" class="spring-empty-state">
                还没有字段，先添加字段定义。
              </div>
              <div v-else class="spider-column-list">
                <article
                  v-for="(column, index) in outputColumns"
                  :key="`column-${index}`"
                  class="spider-column-card"
                >
                  <div class="spring-form-grid">
                    <label class="spring-form-field">
                      <span>字段名</span>
                      <input v-model.trim="column.name" type="text" placeholder="title">
                    </label>
                    <label class="spring-form-field">
                      <span>字段类型</span>
                      <select v-model="column.type">
                        <option v-for="item in COLUMN_TYPE_OPTIONS" :key="item" :value="item">
                          {{ item }}
                        </option>
                      </select>
                    </label>
                    <label class="spring-form-field">
                      <span>长度</span>
                      <input v-model.number="column.length" type="number" min="0" placeholder="255">
                    </label>
                    <label class="spring-form-field">
                      <span>小数位</span>
                      <input v-model.number="column.scale" type="number" min="0" placeholder="2">
                    </label>
                    <label class="spring-form-field">
                      <span>来源字段</span>
                      <input v-model.trim="column.sourceField" type="text" placeholder="articleTitle">
                    </label>
                    <label class="spring-form-field">
                      <span>XPath</span>
                      <input v-model.trim="column.xpath" type="text" placeholder="/html/body/...">
                    </label>
                    <label class="spring-form-field">
                      <span>默认值</span>
                      <input v-model.trim="column.defaultValue" type="text" placeholder="可选">
                    </label>
                    <label class="spring-form-field">
                      <span>注释</span>
                      <input v-model.trim="column.comment" type="text" placeholder="字段说明">
                    </label>
                    <label class="spring-form-field">
                      <span>允许为空</span>
                      <select v-model="column.nullable">
                        <option :value="true">是</option>
                        <option :value="false">否</option>
                      </select>
                    </label>
                    <label class="spring-form-field">
                      <span>主键 / 自增</span>
                      <div class="spider-inline-switches">
                        <label><input v-model="column.primaryKey" type="checkbox"> 主键</label>
                        <label><input v-model="column.autoIncrement" type="checkbox"> 自增</label>
                      </div>
                    </label>
                  </div>
                  <div class="spring-toolbar-actions spider-column-actions">
                    <button
                      type="button"
                      class="spring-ghost-button"
                      @click="openInspectorForColumn(index)"
                    >
                      选择 XPath
                    </button>
                    <button
                      type="button"
                      class="spring-danger-button"
                      @click="removeOutputColumn(index)"
                    >
                      删除字段
                    </button>
                  </div>
                </article>
              </div>

              <pre v-if="sqlPreview" class="spring-code-block spider-code-preview">{{ sqlPreview }}</pre>

              <div v-if="tableStructure?.columns?.length" class="spider-structure">
                <div class="spider-section-head">
                  <h5>现有表结构</h5>
                  <span>{{ tableStructure.tableName }}</span>
                </div>
                <div class="spider-structure-grid">
                  <div
                    v-for="column in tableStructure.columns"
                    :key="column.name"
                    class="spring-detail-item"
                  >
                    <small>{{ column.name }}</small>
                    <strong>{{ column.fullType || column.dataType || "-" }}</strong>
                    <span class="spring-muted-line">{{ column.comment || "无注释" }}</span>
                  </div>
                </div>
                <pre v-if="tableStructure.createTableDdl" class="spring-code-block spider-code-preview">{{
                  tableStructure.createTableDdl
                }}</pre>
              </div>
            </div>

            <div class="spring-detail-actions">
              <button
                type="button"
                class="spring-primary-button"
                :disabled="loading.saveNode"
                @click="saveNodeConfig"
              >
                {{ loading.saveNode ? "保存中..." : "保存节点配置" }}
              </button>
            </div>
          </div>
          <div v-else class="spring-empty-state spider-inspector-empty">
            选中节点后，这里会出现参数配置、XPath 可视化和数据库输出结构配置。
          </div>
        </aside>
      </div>
    </section>

    <div v-if="editorVisible" class="spring-modal-backdrop" @click.self="editorVisible = false">
      <div class="spring-modal-card spider-editor-card">
        <div class="spring-modal-header">
          <div>
            <h3>{{ form.spiderTaskId ? `编辑任务 #${form.spiderTaskId}` : "新建爬虫任务" }}</h3>
            <p>先把任务基础信息建起来，再到下面 Spider Studio 做节点编排。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="editorVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveTask">
          <div class="spring-form-grid">
            <label class="spring-form-field">
              <span>任务名称</span>
              <input v-model.trim="form.spiderTaskName" type="text" required placeholder="例如：资讯站文章采集">
            </label>
            <label class="spring-form-field">
              <span>目标 URL</span>
              <input v-model.trim="form.spiderTaskUrl" type="url" required placeholder="https://example.com/list">
            </label>
            <label class="spring-form-field spring-field-span-2">
              <span>任务描述</span>
              <textarea v-model.trim="form.spiderTaskDesc" rows="3" placeholder="任务说明" />
            </label>
            <label class="spring-form-field">
              <span>状态</span>
              <select v-model="form.spiderTaskStatus">
                <option v-for="item in TASK_STATUS_OPTIONS" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>调度类型</span>
              <select v-model="form.spiderTaskScheduleType">
                <option v-for="item in SCHEDULE_TYPES" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>CRON</span>
              <input v-model.trim="form.spiderTaskCron" type="text" placeholder="0 */10 * * * ?">
            </label>
            <label class="spring-form-field">
              <span>输出类型</span>
              <select v-model="form.spiderTaskPipelineType">
                <option v-for="item in PIPELINE_TYPES" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>线程数</span>
              <input v-model.number="form.spiderTaskThreadNum" type="number" min="1" max="10">
            </label>
            <label class="spring-form-field">
              <span>间隔(ms)</span>
              <input v-model.number="form.spiderTaskSleepTime" type="number" min="0" step="100">
            </label>
            <label class="spring-form-field">
              <span>超时(s)</span>
              <input v-model.number="form.spiderTaskTimeout" type="number" min="1" max="300">
            </label>
            <label class="spring-form-field">
              <span>最大深度</span>
              <input v-model.number="form.spiderTaskMaxDepth" type="number" min="0" max="10">
            </label>
            <label class="spring-form-field">
              <span>分页模板</span>
              <input v-model.trim="form.spiderTaskPagePattern" type="text" placeholder="https://site/page={page}">
            </label>
            <label class="spring-form-field">
              <span>最大分页数</span>
              <input v-model.number="form.spiderTaskMaxPages" type="number" min="0" max="9999">
            </label>
            <label class="spring-form-field">
              <span>增量模式</span>
              <select v-model="form.spiderTaskIncrementalMode">
                <option v-for="item in INCREMENTAL_MODES" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
            <label class="spring-form-field">
              <span>限速(次/分钟)</span>
              <input v-model.number="form.spiderTaskRateLimit" type="number" min="0" max="99999">
            </label>
            <label class="spring-form-field spring-field-span-2">
              <span>URL 匹配模式</span>
              <input v-model.trim="form.spiderTaskUrlPattern" type="text" placeholder="URL 自动发现正则">
            </label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="editorVisible = false">取消</button>
            <button type="submit" class="spring-primary-button" :disabled="loading.saveTask">
              {{ loading.saveTask ? "保存中..." : "保存任务" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="settingsVisible" class="spring-modal-backdrop" @click.self="settingsVisible = false">
      <div class="spring-modal-card spring-modal-card-small">
        <div class="spring-modal-header">
          <div>
            <h3>接口设置</h3>
            <p>默认走控制台 Session，也支持补自定义请求头。</p>
          </div>
          <button type="button" class="spring-icon-button" @click="settingsVisible = false">×</button>
        </div>
        <form class="spring-modal-form" @submit.prevent="saveSettings">
          <div class="spring-form-grid">
            <label class="spring-form-field spring-field-span-2">
              <span>API 根路径</span>
              <input v-model.trim="settings.apiRoot" type="text" placeholder="../v1/spider/">
            </label>
            <label class="spring-form-field">
              <span>Header 名称</span>
              <input v-model.trim="settings.authHeaderName" type="text" placeholder="可选">
            </label>
            <label class="spring-form-field">
              <span>Header 值</span>
              <input v-model.trim="settings.authHeaderValue" type="password" placeholder="可选">
            </label>
          </div>
          <div class="spring-modal-footer">
            <button type="button" class="spring-ghost-button" @click="settingsVisible = false">取消</button>
            <button type="submit" class="spring-primary-button">保存设置</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="inspectorVisible" class="spring-modal-backdrop spider-selector-modal-backdrop" @click.self="closeInspector">
      <div class="spring-modal-card spider-selector-modal">
        <div class="spring-modal-header">
          <div>
            <h3>可视化选择器</h3>
            <p>
              左侧点页面，右侧点 Elements 树，都会把当前节点的 XPath 自动写回
              {{ inspectorTargetLabel || "目标字段" }}。
            </p>
          </div>
          <button type="button" class="spring-icon-button" @click="closeInspector">×</button>
        </div>
        <div class="spider-selector-toolbar">
          <label class="spring-form-field spider-selector-url-field">
            <span>页面 URL</span>
            <input v-model.trim="inspector.url" type="text" placeholder="https://example.com">
          </label>
          <label class="spring-form-field">
            <span>最大深度</span>
            <input v-model.number="inspector.maxDepth" type="number" min="1" max="12">
          </label>
          <label class="spring-form-field">
            <span>每层节点</span>
            <input v-model.number="inspector.maxChildren" type="number" min="5" max="80">
          </label>
          <div class="spring-toolbar-actions">
            <button
              type="button"
              class="spring-primary-button"
              :disabled="loading.preview"
              @click="loadInspector"
            >
              {{ loading.preview ? "加载中..." : "打开可视化" }}
            </button>
          </div>
        </div>

        <div class="spider-selector-layout">
          <section class="spider-selector-pane">
            <div class="spider-section-head">
              <h4>页面可视化</h4>
              <span>{{ inspector.selectedXpath || "未选择元素" }}</span>
            </div>
            <div class="spider-preview-frame-shell">
              <iframe
                v-if="inspector.previewHtml"
                ref="previewIframe"
                class="spider-preview-frame"
                :srcdoc="inspector.previewHtml"
                sandbox="allow-same-origin"
                @load="handleInspectorIframeLoad"
              />
              <div v-else class="spring-empty-state spider-preview-empty">
                输入 URL 后点击“打开可视化”。
              </div>
            </div>
          </section>

          <section class="spider-selector-pane">
            <div class="spider-section-head">
              <h4>Elements</h4>
              <span>{{ inspectorTreeRows.length }} 个可见节点</span>
            </div>
            <div class="spider-elements-tree">
              <button
                v-for="row in inspectorTreeRows"
                :key="row.node.xpath"
                type="button"
                class="spider-tree-row"
                :class="{ 'spider-tree-row-active': inspector.selectedXpath === row.node.xpath }"
                :style="{ paddingLeft: `${16 + row.depth * 18}px` }"
                @click="selectInspectorTreeNode(row.node)"
              >
                <span
                  class="spider-tree-toggle"
                  @click.stop="toggleInspectorNode(row.node)"
                >
                  {{ row.hasChildren ? (row.expanded ? "▾" : "▸") : "·" }}
                </span>
                <span class="spider-tree-tag">&lt;{{ row.node.tag }}&gt;</span>
                <span v-if="row.node.id" class="spider-tree-id">#{{ row.node.id }}</span>
                <span v-if="row.node.class" class="spider-tree-class">.{{ row.node.class }}</span>
                <span v-if="row.node.text" class="spider-tree-text">{{ row.node.text }}</span>
              </button>
              <div v-if="!inspectorTreeRows.length" class="spring-empty-state">
                暂无 DOM 结构。
              </div>
            </div>
          </section>
        </div>

        <div class="spider-selector-footer">
          <div class="spider-selector-selection">
            <strong>{{ inspector.selectedLabel || "未选择节点" }}</strong>
            <span class="spring-muted-line">{{ inspector.selectedXpath || "点击左侧或右侧节点自动回填 XPath" }}</span>
            <span v-if="inspector.selectedCssSelector" class="spring-muted-line">
              CSS: {{ inspector.selectedCssSelector }}
            </span>
          </div>
          <div class="spring-toolbar-actions">
            <button
              type="button"
              class="spring-ghost-button"
              :disabled="!inspector.selectedXpath"
              @click="copyInspectorXpath"
            >
              复制 XPath
            </button>
            <button type="button" class="spring-primary-button" @click="closeInspector">
              完成
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="spring-toast-stack">
      <div v-for="toast in toasts" :key="toast.id" class="spring-toast" :class="`spring-${toast.type}`">
        {{ toast.message }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import {
  COLUMN_TYPE_OPTIONS,
  INCREMENTAL_MODES,
  PIPELINE_TYPES,
  SCHEDULE_TYPES,
  SPIDER_NODE_CATEGORIES,
  TASK_STATUS_OPTIONS,
  type HtmlTreeNode,
  type SpiderConnection,
  type SpiderDataSourceOption,
  type SpiderNode,
  type SpiderOutputColumnDefinition,
  type SpiderSpiInfo,
  type SpiderSpiParameter,
  type SpiderSpiTypeList,
  type SpiderTableStatus,
  type SpiderTask,
  type SpiderTaskDesign,
  type TableStructureInfo,
} from "../api";

type RecordLike = Record<string, any>;
type Toast = { id: number; message: string; type: "success" | "error" | "info" };
type InspectorTarget = {
  kind: "param" | "column";
  key: string;
  label: string;
  selectorType: "XPATH" | "CSS";
};
type InspectorTreeRow = {
  node: HtmlTreeNode;
  depth: number;
  expanded: boolean;
  hasChildren: boolean;
};

const NODE_WIDTH = 232;
const NODE_HEIGHT = 148;

const props = withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    eyebrow?: string;
    defaultApiRoot?: string;
    storageKey?: string;
  }>(),
  {
    title: "Spider Console",
    description: "在 Spring 模块里直接维护爬虫任务、节点编排、XPath 可视化和数据库输出。",
    eyebrow: "Spider Starter",
    defaultApiRoot: "../v1/spider/",
    storageKey: "spring.simple-pages.spider-console.settings",
  },
);

const loading = reactive({
  tasks: false,
  logs: false,
  tables: false,
  initTables: false,
  catalog: false,
  design: false,
  nodeParams: false,
  saveNode: false,
  saveDesign: false,
  saveTask: false,
  preview: false,
  selectorTest: false,
  dataSources: false,
});

const filters = reactive({
  keyword: "",
  status: "",
  pageSize: "10",
});

const settings = reactive(loadSettings());
const form = reactive(createTaskForm());
const tasks = ref<SpiderTask[]>([]);
const logs = ref<RecordLike[]>([]);
const tableStatus = ref<SpiderTableStatus | null>(null);
const dataSourceOptions = ref<SpiderDataSourceOption[]>([]);
const taskTotal = ref(0);
const selectedTask = ref<SpiderTask | null>(null);
const editorVisible = ref(false);
const settingsVisible = ref(false);
const designErrors = ref<string[]>([]);
const toasts = ref<Toast[]>([]);
const design = reactive<SpiderTaskDesign>({
  taskId: undefined,
  nodes: [],
  connections: [],
});
const nodeParams = ref<SpiderSpiParameter[]>([]);
const spiCatalog = reactive(createEmptyCatalog());
const selectedNodeId = ref<number | null>(null);
const nodeConfigState = reactive<Record<string, any>>({});
const selectorResults = reactive<Record<string, string[]>>({});
const outputTableExists = ref<boolean | null>(null);
const sqlPreview = ref("");
const tableStructure = ref<TableStructureInfo | null>(null);
const connectingFromNodeId = ref<number | null>(null);
const studioRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLElement | null>(null);
const previewIframe = ref<HTMLIFrameElement | null>(null);
const inspectorVisible = ref(false);
const inspector = reactive({
  url: "",
  previewHtml: "",
  rawHtml: "",
  baseUrl: "",
  tree: null as HtmlTreeNode | null,
  maxDepth: 5,
  maxChildren: 25,
  expanded: {} as Record<string, boolean>,
  selectedXpath: "",
  selectedCssSelector: "",
  selectedLabel: "",
  selectedText: "",
  target: null as InspectorTarget | null,
});

let toastSeed = 0;
let previewDoc: Document | null = null;

const paletteGroups = computed(() =>
  SPIDER_NODE_CATEGORIES.map((category) => ({
    ...category,
    items: asList(spiCatalog[category.catalogKey as keyof SpiderSpiTypeList]),
  })),
);

const paletteCount = computed(() =>
  paletteGroups.value.reduce((count, group) => count + group.items.length, 0),
);

const runningCount = computed(
  () => tasks.value.filter((item) => upper(item.spiderTaskRunStatus) === "RUNNING").length,
);

const enabledDataSourceCount = computed(
  () => dataSourceOptions.value.filter((item) => item.enabled !== false).length,
);

const tableStatusSummary = computed(() => {
  if (!tableStatus.value) return "还未获取基础表状态";
  const exists = Object.values(tableStatus.value.tables || {}).filter(Boolean).length;
  const total = Object.keys(tableStatus.value.tables || {}).length;
  return `${exists}/${total} 张基础表可用`;
});

const tableStatusItems = computed(() =>
  Object.entries(tableStatus.value?.tables || {}).map(([name, exists]) => ({
    name,
    exists: Boolean(exists),
    note: exists ? "表已存在" : "表缺失",
  })),
);

const missingColumnsSummary = computed(() => {
  const map = tableStatus.value?.missingColumns || {};
  const lines = Object.entries(map)
    .filter(([, columns]) => asList(columns).length)
    .map(([table, columns]) => `${table}: ${asList(columns).join(", ")}`);
  return lines.join(" | ");
});

const detailItems = computed(() =>
  selectedTask.value
    ? [
        { label: "任务编号", value: selectedTask.value.spiderTaskId || "-" },
        { label: "目标 URL", value: selectedTask.value.spiderTaskUrl || "-" },
        { label: "运行状态", value: selectedTask.value.spiderTaskRunStatus || "IDLE" },
        { label: "任务状态", value: taskStatusLabel(selectedTask.value.spiderTaskStatus) },
        { label: "调度", value: selectedTask.value.spiderTaskCron || selectedTask.value.spiderTaskScheduleType || "NONE" },
        { label: "线程数", value: formatNumber(selectedTask.value.spiderTaskThreadNum) },
        { label: "间隔", value: `${formatNumber(selectedTask.value.spiderTaskSleepTime)} ms` },
        { label: "最大深度", value: formatNumber(selectedTask.value.spiderTaskMaxDepth) },
        { label: "最后执行", value: formatDateTime(selectedTask.value.spiderTaskLastRunTime) || "从未执行" },
        { label: "节点数", value: formatNumber(design.nodes.length) },
      ]
    : [],
);

const selectedNode = computed(
  () => design.nodes.find((item) => String(item.nodeId ?? "") === String(selectedNodeId.value ?? "")) || null,
);

const connectingFromNode = computed(
  () => design.nodes.find((item) => item.nodeId === connectingFromNodeId.value) || null,
);

const isDatabasePipelineSelected = computed(
  () =>
    selectedNode.value?.nodeType === "PIPELINE" &&
    upper(selectedNode.value.spiName) === "DATABASE",
);

const outputColumns = computed(() => {
  if (!Array.isArray(nodeConfigState.columns)) {
    nodeConfigState.columns = [];
  }
  return nodeConfigState.columns as SpiderOutputColumnDefinition[];
});

const selectedNodeEnabledValue = computed({
  get: () => (selectedNode.value?.nodeEnabled === false ? "0" : "1"),
  set: (value: string) => {
    if (selectedNode.value) {
      selectedNode.value.nodeEnabled = value === "1";
    }
  },
});

const inspectorTreeRows = computed(() => flattenInspectorTree(inspector.tree));
const inspectorTargetLabel = computed(() => inspector.target?.label || "");

watch(
  tasks,
  (items) => {
    if (!items.length) {
      selectedTask.value = null;
      return;
    }
    const match = selectedTask.value
      ? items.find((item) => sameTask(item, selectedTask.value))
      : null;
    selectedTask.value = match || items[0] || null;
  },
  { immediate: true },
);

watch(() => filters.status, () => void refreshTasks());
watch(() => filters.pageSize, () => void refreshTasks());

watch(
  () => selectedTask.value?.spiderTaskId,
  async () => {
    outputTableExists.value = null;
    sqlPreview.value = "";
    tableStructure.value = null;
    selectedNodeId.value = null;
    designErrors.value = [];
    await Promise.all([loadLogs(), loadDesign()]);
  },
  { immediate: true },
);

watch(
  () => selectedNode.value?.nodeId,
  async () => {
    clearObject(nodeConfigState);
    clearObject(selectorResults);
    outputTableExists.value = null;
    sqlPreview.value = "";
    tableStructure.value = null;
    nodeParams.value = [];
    if (!selectedNode.value) {
      return;
    }
    Object.assign(nodeConfigState, parseJsonObject(selectedNode.value.nodeConfig));
    await loadNodeParameters(selectedNode.value);
    if (isDatabasePipelineSelected.value && !Array.isArray(nodeConfigState.columns)) {
      nodeConfigState.columns = [];
    }
  },
);

onMounted(async () => {
  await Promise.all([refreshTasks(), loadCatalog(), loadTableStatus(), loadDataSources()]);
});

async function refreshAll() {
  await Promise.all([refreshTasks(), loadCatalog(), loadTableStatus(), loadDataSources()]);
}

async function refreshTasks() {
  loading.tasks = true;
  try {
    const query = new URLSearchParams({
      page: "1",
      pageSize: trim(filters.pageSize) || "10",
    });
    if (trim(filters.keyword)) {
      query.set("spiderTaskName", trim(filters.keyword));
    }
    if (trim(filters.status)) {
      query.set("spiderTaskStatus", trim(filters.status));
    }
    const payload = await request(`page?${query.toString()}`);
    const pagePayload =
      payload && typeof payload === "object" && !Array.isArray(payload) && payload.data && !Array.isArray(payload.data)
        ? payload.data
        : payload;
    tasks.value = asList(pagePayload?.records ?? pagePayload?.data);
    taskTotal.value = intOr(pagePayload?.total ?? pagePayload?.totalCount, tasks.value.length);
  } catch (error) {
    tasks.value = [];
    taskTotal.value = 0;
    notify(resolveError(error, "加载任务失败"), "error");
  } finally {
    loading.tasks = false;
  }
}

async function loadLogs() {
  if (!selectedTask.value?.spiderTaskId) {
    logs.value = [];
    return;
  }
  loading.logs = true;
  try {
    const payload = await request(
      `logs/${encodeURIComponent(String(selectedTask.value.spiderTaskId))}?page=1&size=6`,
    );
    logs.value = asList(payload?.data);
  } catch (error) {
    logs.value = [];
    notify(resolveError(error, "加载日志失败"), "error");
  } finally {
    loading.logs = false;
  }
}

async function loadTableStatus() {
  loading.tables = true;
  try {
    tableStatus.value = await request("table/status");
  } catch (error) {
    tableStatus.value = null;
    notify(resolveError(error, "加载表状态失败"), "error");
  } finally {
    loading.tables = false;
  }
}

async function initializeTables(force: boolean) {
  if (force && !window.confirm("强制重建会覆盖当前爬虫基础表结构，确认继续？")) {
    return;
  }
  loading.initTables = true;
  try {
    await request(`table/initialize?force=${force}`, {
      method: "POST",
    });
    notify(force ? "基础表已强制重建" : "基础表已初始化", "success");
    await loadTableStatus();
  } catch (error) {
    notify(resolveError(error, "初始化基础表失败"), "error");
  } finally {
    loading.initTables = false;
  }
}

async function loadCatalog() {
  loading.catalog = true;
  try {
    const payload = await request("spi/types");
    Object.assign(spiCatalog, createEmptyCatalog(), payload || {});
  } catch (error) {
    Object.assign(spiCatalog, createEmptyCatalog());
    notify(resolveError(error, "加载插件列表失败"), "error");
  } finally {
    loading.catalog = false;
  }
}

async function loadDataSources() {
  loading.dataSources = true;
  try {
    dataSourceOptions.value = asList(await request("data-source/options"));
  } catch (error) {
    dataSourceOptions.value = [];
    notify(resolveError(error, "加载数据库数据源失败"), "error");
  } finally {
    loading.dataSources = false;
  }
}

async function loadDesign() {
  if (!selectedTask.value?.spiderTaskId) {
    resetDesign();
    return;
  }
  loading.design = true;
  try {
    const payload = await request(
      `design/${encodeURIComponent(String(selectedTask.value.spiderTaskId))}`,
    );
    design.taskId = selectedTask.value.spiderTaskId;
    design.nodes = asList(payload?.nodes).map((item) => ({
      ...item,
      positionX: intOr(item?.positionX, 32),
      positionY: intOr(item?.positionY, 32),
      nodeEnabled: item?.nodeEnabled !== false,
    }));
    design.connections = asList(payload?.connections);
    selectedNodeId.value = design.nodes[0]?.nodeId ?? null;
  } catch (error) {
    resetDesign();
    notify(resolveError(error, "加载编排失败"), "error");
  } finally {
    loading.design = false;
  }
}

function resetDesign() {
  design.taskId = selectedTask.value?.spiderTaskId;
  design.nodes = [];
  design.connections = [];
  selectedNodeId.value = null;
}

async function loadNodeParameters(node: SpiderNode) {
  loading.nodeParams = true;
  try {
    const payload = await request(
      `spi/parameters?spiType=${encodeURIComponent(node.nodeType)}&spiName=${encodeURIComponent(node.spiName)}`,
    );
    nodeParams.value = asList(payload).sort(
      (left, right) => intOr(left?.order, 0) - intOr(right?.order, 0),
    );
    nodeParams.value.forEach((param) => {
      if (nodeConfigState[param.name] === undefined) {
        nodeConfigState[param.name] = defaultParamValue(param);
      }
    });
  } catch (error) {
    nodeParams.value = [];
    notify(resolveError(error, "加载节点参数失败"), "error");
  } finally {
    loading.nodeParams = false;
  }
}

async function addNode(type: string, spi: SpiderSpiInfo) {
  if (!selectedTask.value?.spiderTaskId) {
    notify("请先选择任务", "info");
    return;
  }
  try {
    const position = nextNodePosition();
    const node: SpiderNode = {
      nodeName: spi.displayName || spi.name,
      nodeType: type,
      spiName: spi.name,
      nodeDescription: spi.description || "",
      positionX: position.x,
      positionY: position.y,
      nodeEnabled: true,
      nodeConfig: "{}",
    };
    const nodeId = await request(`design/${selectedTask.value.spiderTaskId}/nodes`, {
      method: "POST",
      body: JSON.stringify(node),
    });
    node.nodeId = intOr(nodeId, Date.now());
    design.nodes = [...design.nodes, node];
    selectedNodeId.value = node.nodeId ?? null;
    notify(`已添加节点 ${node.nodeName}`, "success");
  } catch (error) {
    notify(resolveError(error, "添加节点失败"), "error");
  }
}

function nextNodePosition() {
  const index = design.nodes.length;
  return {
    x: 30 + (index % 3) * 260,
    y: 30 + Math.floor(index / 3) * 180,
  };
}

function selectNode(node: SpiderNode) {
  selectedNodeId.value = node.nodeId ?? null;
}

function handleCanvasClick() {
  selectedNodeId.value = null;
}

function nodeStyle(node: SpiderNode) {
  return {
    left: `${intOr(node.positionX, 30)}px`,
    top: `${intOr(node.positionY, 30)}px`,
  };
}

function nodeColor(type: string) {
  return SPIDER_NODE_CATEGORIES.find((item) => item.type === type)?.color || "#1764d5";
}

function nodeTypeLabel(type: string) {
  return SPIDER_NODE_CATEGORIES.find((item) => item.type === type)?.label || type;
}

function beginNodeDrag(event: MouseEvent, node: SpiderNode) {
  if (event.button !== 0 || !canvasRef.value || !node.nodeId) {
    return;
  }
  const rect = canvasRef.value.getBoundingClientRect();
  const startX = event.clientX;
  const startY = event.clientY;
  const originX = intOr(node.positionX, 0);
  const originY = intOr(node.positionY, 0);

  const handleMove = (moveEvent: MouseEvent) => {
    node.positionX = clamp(
      originX + moveEvent.clientX - startX,
      0,
      Math.max(0, rect.width - NODE_WIDTH),
    );
    node.positionY = clamp(
      originY + moveEvent.clientY - startY,
      0,
      Math.max(0, rect.height - NODE_HEIGHT),
    );
  };

  const handleUp = async () => {
    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleUp);
    if (!selectedTask.value?.spiderTaskId || !node.nodeId) {
      return;
    }
    try {
      await request(`design/${selectedTask.value.spiderTaskId}/nodes/positions`, {
        method: "PUT",
        body: JSON.stringify([
          {
            nodeId: node.nodeId,
            x: intOr(node.positionX, 0),
            y: intOr(node.positionY, 0),
          },
        ]),
      });
    } catch (error) {
      notify(resolveError(error, "保存节点位置失败"), "error");
    }
  };

  document.addEventListener("mousemove", handleMove);
  document.addEventListener("mouseup", handleUp);
}

function startConnection(node: SpiderNode) {
  if (!node.nodeId) {
    return;
  }
  connectingFromNodeId.value = node.nodeId;
}

async function completeConnection(node: SpiderNode) {
  if (!selectedTask.value?.spiderTaskId || !node.nodeId || !connectingFromNode.value?.nodeId) {
    return;
  }
  if (connectingFromNode.value.nodeId === node.nodeId) {
    notify("不能连接到自己", "info");
    return;
  }
  const exists = design.connections.some(
    (item) =>
      item.sourceNodeId === connectingFromNode.value?.nodeId &&
      item.targetNodeId === node.nodeId,
  );
  if (exists) {
    notify("这条连接已经存在", "info");
    connectingFromNodeId.value = null;
    return;
  }
  try {
    const connection: SpiderConnection = {
      sourceNodeId: connectingFromNode.value.nodeId,
      targetNodeId: node.nodeId,
      sourcePort: "output",
      targetPort: "input",
    };
    const connectionId = await request(`design/${selectedTask.value.spiderTaskId}/connections`, {
      method: "POST",
      body: JSON.stringify(connection),
    });
    connection.connectionId = intOr(connectionId, Date.now());
    design.connections = [...design.connections, connection];
    notify("连接创建成功", "success");
  } catch (error) {
    notify(resolveError(error, "创建连接失败"), "error");
  } finally {
    connectingFromNodeId.value = null;
  }
}

function cancelConnection() {
  connectingFromNodeId.value = null;
}

async function deleteConnection(connection: SpiderConnection) {
  if (!connection.connectionId || !window.confirm("确认删除这条连接吗？")) {
    return;
  }
  try {
    await request(`design/connections/${connection.connectionId}`, {
      method: "DELETE",
    });
    design.connections = design.connections.filter(
      (item) => item.connectionId !== connection.connectionId,
    );
    notify("连接已删除", "success");
  } catch (error) {
    notify(resolveError(error, "删除连接失败"), "error");
  }
}

async function deleteNode(node: SpiderNode) {
  if (!node.nodeId || !window.confirm(`确认删除节点 ${node.nodeName} 吗？`)) {
    return;
  }
  try {
    await request(`design/nodes/${node.nodeId}`, {
      method: "DELETE",
    });
    design.nodes = design.nodes.filter((item) => item.nodeId !== node.nodeId);
    design.connections = design.connections.filter(
      (item) => item.sourceNodeId !== node.nodeId && item.targetNodeId !== node.nodeId,
    );
    if (selectedNodeId.value === node.nodeId) {
      selectedNodeId.value = null;
    }
    notify("节点已删除", "success");
  } catch (error) {
    notify(resolveError(error, "删除节点失败"), "error");
  }
}

async function saveNodeConfig() {
  if (!selectedNode.value?.nodeId) {
    return;
  }
  loading.saveNode = true;
  try {
    const payload: SpiderNode = {
      ...selectedNode.value,
      nodeConfig: JSON.stringify(normalizeNodeConfig()),
      nodeEnabled: selectedNode.value.nodeEnabled !== false,
    };
    await request(`design/nodes/${selectedNode.value.nodeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    selectedNode.value.nodeConfig = payload.nodeConfig;
    notify("节点配置已保存", "success");
  } catch (error) {
    notify(resolveError(error, "保存节点配置失败"), "error");
  } finally {
    loading.saveNode = false;
  }
}

function normalizeNodeConfig() {
  const result = cloneValue(nodeConfigState) as RecordLike;
  nodeParams.value.forEach((param) => {
    result[param.name] = normalizeParamValue(param, result[param.name]);
    if (isEmptyValue(result[param.name])) {
      delete result[param.name];
    }
  });
  if (result.dataSourceSettingId === "") {
    result.dataSourceSettingId = null;
  } else if (result.dataSourceSettingId != null && trim(result.dataSourceSettingId) !== "") {
    result.dataSourceSettingId = intOr(result.dataSourceSettingId, 0);
  }
  if (Array.isArray(result.columns)) {
    result.columns = result.columns
      .map((column: SpiderOutputColumnDefinition) => normalizeOutputColumn(column))
      .filter((column: SpiderOutputColumnDefinition) => trim(column.name));
  }
  if (isEmptyValue(result.tableName)) {
    delete result.tableName;
  }
  if (isEmptyValue(result.tableComment)) {
    delete result.tableComment;
  }
  return result;
}

function normalizeOutputColumn(column: SpiderOutputColumnDefinition) {
  return {
    name: trim(column.name),
    type: upper(column.type) || "VARCHAR",
    length: nullableNumber(column.length),
    scale: nullableNumber(column.scale),
    nullable: column.nullable !== false,
    defaultValue: trim(column.defaultValue),
    primaryKey: Boolean(column.primaryKey),
    autoIncrement: Boolean(column.autoIncrement),
    comment: trim(column.comment),
    sourceField: trim(column.sourceField),
    xpath: trim(column.xpath),
  };
}

async function saveDesign() {
  if (!selectedTask.value?.spiderTaskId) {
    return;
  }
  loading.saveDesign = true;
  try {
    await request(`design/${selectedTask.value.spiderTaskId}`, {
      method: "POST",
      body: JSON.stringify({
        taskId: selectedTask.value.spiderTaskId,
        nodes: cloneValue(design.nodes),
        connections: cloneValue(design.connections),
      }),
    });
    notify("编排已保存", "success");
  } catch (error) {
    notify(resolveError(error, "保存编排失败"), "error");
  } finally {
    loading.saveDesign = false;
  }
}

async function validateDesign() {
  if (!selectedTask.value?.spiderTaskId) {
    return;
  }
  try {
    const payload = await request(`design/${selectedTask.value.spiderTaskId}/validate`);
    designErrors.value = asList(payload);
    notify(
      designErrors.value.length ? "编排校验发现问题" : "编排校验通过",
      designErrors.value.length ? "info" : "success",
    );
  } catch (error) {
    designErrors.value = [];
    notify(resolveError(error, "验证编排失败"), "error");
  }
}

async function clearDesign() {
  if (!selectedTask.value?.spiderTaskId || !window.confirm("确认清空当前任务的所有编排节点和连接吗？")) {
    return;
  }
  try {
    await request(`design/${selectedTask.value.spiderTaskId}`, {
      method: "DELETE",
    });
    resetDesign();
    notify("画布已清空", "success");
  } catch (error) {
    notify(resolveError(error, "清空画布失败"), "error");
  }
}

function connectionPath(connection: SpiderConnection) {
  const source = design.nodes.find((item) => item.nodeId === connection.sourceNodeId);
  const target = design.nodes.find((item) => item.nodeId === connection.targetNodeId);
  if (!source || !target) {
    return "";
  }
  const x1 = intOr(source.positionX, 0) + NODE_WIDTH;
  const y1 = intOr(source.positionY, 0) + NODE_HEIGHT / 2;
  const x2 = intOr(target.positionX, 0);
  const y2 = intOr(target.positionY, 0) + NODE_HEIGHT / 2;
  const cx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

function openEditor(task?: SpiderTask | null) {
  Object.assign(form, createTaskForm());
  if (task) {
    Object.assign(form, {
      ...task,
      spiderTaskStatus: task.spiderTaskStatus ?? 1,
      spiderTaskScheduleType: task.spiderTaskScheduleType || "NONE",
      spiderTaskPipelineType: task.spiderTaskPipelineType || "JSON",
      spiderTaskThreadNum: intOr(task.spiderTaskThreadNum, 1),
      spiderTaskSleepTime: intOr(task.spiderTaskSleepTime, 1000),
      spiderTaskTimeout: intOr(task.spiderTaskTimeout, 30),
      spiderTaskMaxDepth: intOr(task.spiderTaskMaxDepth, 0),
      spiderTaskMaxPages: intOr(task.spiderTaskMaxPages, 0),
      spiderTaskRateLimit: intOr(task.spiderTaskRateLimit, 0),
      spiderTaskIncrementalMode: task.spiderTaskIncrementalMode || "HASH",
    });
  }
  editorVisible.value = true;
}

async function saveTask() {
  if (!trim(form.spiderTaskName) || !trim(form.spiderTaskUrl)) {
    notify("任务名称和目标 URL 必填", "info");
    return;
  }
  loading.saveTask = true;
  try {
    const editing = Boolean(form.spiderTaskId);
    await request(editing ? "update" : "save", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(buildTaskBody()),
    });
    notify(editing ? "任务已更新" : "任务已创建", "success");
    editorVisible.value = false;
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "保存任务失败"), "error");
  } finally {
    loading.saveTask = false;
  }
}

function buildTaskBody() {
  return {
    ...(form.spiderTaskId ? { spiderTaskId: form.spiderTaskId } : {}),
    spiderTaskName: trim(form.spiderTaskName),
    spiderTaskDesc: trim(form.spiderTaskDesc),
    spiderTaskUrl: trim(form.spiderTaskUrl),
    spiderTaskUrlPattern: trim(form.spiderTaskUrlPattern),
    spiderTaskStatus: intOr(form.spiderTaskStatus, 1),
    spiderTaskScheduleType: trim(form.spiderTaskScheduleType) || "NONE",
    spiderTaskCron: trim(form.spiderTaskCron),
    spiderTaskThreadNum: intOr(form.spiderTaskThreadNum, 1),
    spiderTaskSleepTime: intOr(form.spiderTaskSleepTime, 1000),
    spiderTaskTimeout: intOr(form.spiderTaskTimeout, 30),
    spiderTaskMaxDepth: intOr(form.spiderTaskMaxDepth, 0),
    spiderTaskPagePattern: trim(form.spiderTaskPagePattern),
    spiderTaskMaxPages: intOr(form.spiderTaskMaxPages, 0),
    spiderTaskIncrementalMode: trim(form.spiderTaskIncrementalMode) || "HASH",
    spiderTaskRateLimit: intOr(form.spiderTaskRateLimit, 0),
    spiderTaskPipelineType: trim(form.spiderTaskPipelineType) || "JSON",
    spiderTaskRunStatus: trim(form.spiderTaskRunStatus) || "IDLE",
  };
}

async function toggleTaskRun(task: SpiderTask | null) {
  if (!task?.spiderTaskId) {
    return;
  }
  const action = upper(task.spiderTaskRunStatus) === "RUNNING" ? "stop" : "run";
  try {
    await request(`${action}/${task.spiderTaskId}`, {
      method: "POST",
    });
    notify(action === "run" ? "任务已开始运行" : "任务已停止", "success");
    await Promise.all([refreshTasks(), loadLogs()]);
  } catch (error) {
    notify(resolveError(error, "切换任务状态失败"), "error");
  }
}

async function deleteTask(task: SpiderTask | null) {
  if (!task?.spiderTaskId || !window.confirm(`确认删除任务 ${task.spiderTaskName || task.spiderTaskId} 吗？`)) {
    return;
  }
  try {
    await request(`delete?spiderTaskId=${encodeURIComponent(String(task.spiderTaskId))}`, {
      method: "DELETE",
    });
    notify("任务已删除", "success");
    await refreshTasks();
  } catch (error) {
    notify(resolveError(error, "删除任务失败"), "error");
  }
}

function focusTaskStudio(task: SpiderTask) {
  selectedTask.value = task;
  studioRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function saveSettings() {
  settings.apiRoot = trim(settings.apiRoot) || props.defaultApiRoot;
  settings.authHeaderName = trim(settings.authHeaderName);
  settings.authHeaderValue = trim(settings.authHeaderValue);
  localStorage.setItem(props.storageKey, JSON.stringify(settings));
  settingsVisible.value = false;
  notify("接口设置已保存", "success");
  void refreshAll();
}

async function checkOutputTableExists() {
  const requestPayload = buildOutputTableRequest(false);
  if (!requestPayload) {
    return;
  }
  try {
    outputTableExists.value = Boolean(
      await request(`output/table/exists?tableName=${encodeURIComponent(requestPayload.tableName)}`, {
        method: "POST",
        body: JSON.stringify({
          dataSourceSettingId: requestPayload.request.dataSourceSettingId,
        }),
      }),
    );
    notify(outputTableExists.value ? "目标表已存在" : "目标表不存在", "info");
  } catch (error) {
    notify(resolveError(error, "检查输出表失败"), "error");
  }
}

async function previewOutputTableSql() {
  const requestPayload = buildOutputTableRequest(true);
  if (!requestPayload) {
    return;
  }
  try {
    sqlPreview.value = String(
      await request(
        `output/table/preview-sql?tableName=${encodeURIComponent(requestPayload.tableName)}&dbType=mysql`,
        {
          method: "POST",
          body: JSON.stringify(requestPayload.request),
        },
      ),
    );
    notify("已生成建表 SQL", "success");
  } catch (error) {
    notify(resolveError(error, "预览 SQL 失败"), "error");
  }
}

async function createOutputTable() {
  const requestPayload = buildOutputTableRequest(true);
  if (!requestPayload) {
    return;
  }
  try {
    await request(
      `output/table/create?tableName=${encodeURIComponent(requestPayload.tableName)}&dbType=mysql`,
      {
        method: "POST",
        body: JSON.stringify(requestPayload.request),
      },
    );
    outputTableExists.value = true;
    notify("输出表已创建", "success");
    await loadOutputTableStructure();
  } catch (error) {
    notify(resolveError(error, "创建输出表失败"), "error");
  }
}

async function loadOutputTableStructure() {
  const requestPayload = buildOutputTableRequest(false);
  if (!requestPayload) {
    return;
  }
  try {
    tableStructure.value = await request(
      `output/table/structure?tableName=${encodeURIComponent(requestPayload.tableName)}`,
      {
        method: "POST",
        body: JSON.stringify({
          dataSourceSettingId: requestPayload.request.dataSourceSettingId,
        }),
      },
    );
    notify("已加载输出表结构", "success");
  } catch (error) {
    notify(resolveError(error, "加载输出表结构失败"), "error");
  }
}

async function syncOutputTableStructure() {
  const requestPayload = buildOutputTableRequest(true);
  if (!requestPayload) {
    return;
  }
  try {
    await request(
      `output/table/sync-structure?tableName=${encodeURIComponent(requestPayload.tableName)}&dbType=mysql`,
      {
        method: "POST",
        body: JSON.stringify(requestPayload.request),
      },
    );
    outputTableExists.value = true;
    notify("输出表结构已同步", "success");
    await loadOutputTableStructure();
  } catch (error) {
    notify(resolveError(error, "同步输出表结构失败"), "error");
  }
}

function buildOutputTableRequest(requireColumns: boolean) {
  const tableName = trim(nodeConfigState.tableName);
  if (!tableName) {
    notify("请先填写输出表名", "info");
    return null;
  }
  const columns = outputColumns.value
    .map((column) => normalizeOutputColumn(column))
    .filter((column) => trim(column.name));
  if (requireColumns && !columns.length) {
    notify("请至少配置一个输出字段", "info");
    return null;
  }
  return {
    tableName,
    request: {
      dataSourceSettingId: trim(nodeConfigState.dataSourceSettingId)
        ? intOr(nodeConfigState.dataSourceSettingId, 0)
        : null,
      tableComment: trim(nodeConfigState.tableComment),
      columns,
    },
  };
}

function addOutputColumn() {
  outputColumns.value.push({
    name: "",
    type: "VARCHAR",
    length: 255,
    scale: null,
    nullable: true,
    defaultValue: "",
    primaryKey: false,
    autoIncrement: false,
    comment: "",
    sourceField: "",
    xpath: "",
  });
}

function removeOutputColumn(index: number) {
  outputColumns.value.splice(index, 1);
}

function openInspectorForParam(param: SpiderSpiParameter) {
  if (!selectedTask.value?.spiderTaskUrl) {
    notify("当前任务还没有目标 URL", "info");
    return;
  }
  inspector.target = {
    kind: "param",
    key: param.name,
    label: param.label || param.name,
    selectorType: resolveParamSelectorType(param),
  };
  inspector.url = selectedTask.value.spiderTaskUrl;
  inspectorVisible.value = true;
  void loadInspector();
}

function openInspectorForColumn(index: number) {
  if (!selectedTask.value?.spiderTaskUrl) {
    notify("当前任务还没有目标 URL", "info");
    return;
  }
  inspector.target = {
    kind: "column",
    key: String(index),
    label: `字段 ${outputColumns.value[index]?.name || index + 1}`,
    selectorType: "XPATH",
  };
  inspector.url = selectedTask.value.spiderTaskUrl;
  inspectorVisible.value = true;
  void loadInspector();
}

async function loadInspector() {
  if (!trim(inspector.url)) {
    notify("请先输入要可视化的页面 URL", "info");
    return;
  }
  loading.preview = true;
  try {
    const [previewPayload, treePayload] = await Promise.all([
      request(`preview?url=${encodeURIComponent(inspector.url)}`),
      request(
        `parse-html?url=${encodeURIComponent(inspector.url)}&maxDepth=${intOr(inspector.maxDepth, 5)}&maxChildren=${intOr(inspector.maxChildren, 25)}`,
      ),
    ]);
    inspector.baseUrl = trim(treePayload?.baseUrl || previewPayload?.baseUrl);
    inspector.rawHtml = trim(treePayload?.rawHtml || previewPayload?.html);
    inspector.previewHtml = injectBaseHref(trim(previewPayload?.html), inspector.baseUrl);
    inspector.tree = (treePayload?.tree as HtmlTreeNode) || null;
    inspector.expanded = buildInitialExpanded(inspector.tree);
    inspector.selectedXpath = "";
    inspector.selectedCssSelector = "";
    inspector.selectedLabel = "";
    inspector.selectedText = "";
    await nextTick();
  } catch (error) {
    inspector.previewHtml = "";
    inspector.tree = null;
    notify(resolveError(error, "加载可视化页面失败"), "error");
  } finally {
    loading.preview = false;
  }
}

function closeInspector() {
  cleanupPreviewDocument();
  inspectorVisible.value = false;
}

function handleInspectorIframeLoad() {
  cleanupPreviewDocument();
  const doc = previewIframe.value?.contentDocument;
  if (!doc) {
    return;
  }
  previewDoc = doc;
  const style = doc.createElement("style");
  style.textContent = `
    .spring-spider-hover {
      outline: 2px solid rgba(18, 163, 111, 0.95) !important;
      outline-offset: 2px !important;
      background: rgba(18, 163, 111, 0.08) !important;
    }
    .spring-spider-selected {
      outline: 3px solid rgba(22, 102, 216, 0.98) !important;
      outline-offset: 2px !important;
      background: rgba(22, 102, 216, 0.12) !important;
    }
  `;
  doc.head.appendChild(style);
  doc.addEventListener("mouseover", handlePreviewMouseOver, true);
  doc.addEventListener("mouseout", handlePreviewMouseOut, true);
  doc.addEventListener("click", handlePreviewClick, true);
}

function cleanupPreviewDocument() {
  if (!previewDoc) {
    return;
  }
  previewDoc.removeEventListener("mouseover", handlePreviewMouseOver, true);
  previewDoc.removeEventListener("mouseout", handlePreviewMouseOut, true);
  previewDoc.removeEventListener("click", handlePreviewClick, true);
  previewDoc = null;
}

function handlePreviewMouseOver(event: Event) {
  const target = event.target as Element | null;
  if (!target || ignorePreviewElement(target)) {
    return;
  }
  previewDoc?.querySelectorAll(".spring-spider-hover").forEach((item) => {
    item.classList.remove("spring-spider-hover");
  });
  target.classList.add("spring-spider-hover");
}

function handlePreviewMouseOut(event: Event) {
  const target = event.target as Element | null;
  if (!target) {
    return;
  }
  target.classList.remove("spring-spider-hover");
}

function handlePreviewClick(event: Event) {
  const target = event.target as Element | null;
  if (!target || ignorePreviewElement(target)) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  selectPreviewElement(target);
}

function ignorePreviewElement(target: Element) {
  const tag = target.tagName.toLowerCase();
  return ["html", "head", "body", "script", "style", "link", "meta"].includes(tag);
}

function selectPreviewElement(target: Element) {
  if (!previewDoc) {
    return;
  }
  previewDoc.querySelectorAll(".spring-spider-selected").forEach((item) => {
    item.classList.remove("spring-spider-selected");
  });
  target.classList.add("spring-spider-selected");
  const xpath = buildElementXpath(target);
  const cssSelector = buildCssSelector(target);
  const matchedNode = findTreeNodeByXpath(inspector.tree, xpath);
  applyInspectorSelection({
    xpath,
    cssSelector,
    label: matchedNode?.displayName || target.tagName.toLowerCase(),
    text: matchedNode?.text || trim(target.textContent),
  });
}

function selectInspectorTreeNode(node: HtmlTreeNode) {
  highlightPreviewElement(node.xpath);
  applyInspectorSelection({
    xpath: node.xpath,
    cssSelector: node.cssSelector || "",
    label: node.displayName || node.tag,
    text: node.text || "",
  });
}

function toggleInspectorNode(node: HtmlTreeNode) {
  if (!node.children?.length) {
    return;
  }
  inspector.expanded[node.xpath] = !inspector.expanded[node.xpath];
}

function highlightPreviewElement(xpath: string) {
  const doc = previewIframe.value?.contentDocument;
  if (!doc || !trim(xpath)) {
    return;
  }
  const element = evaluateXpath(doc, xpath);
  if (!element) {
    return;
  }
  selectPreviewElement(element);
  element.scrollIntoView({ block: "center", inline: "nearest" });
}

function applyInspectorSelection(selection: {
  xpath: string;
  cssSelector: string;
  label: string;
  text: string;
}) {
  inspector.selectedXpath = selection.xpath;
  inspector.selectedCssSelector = selection.cssSelector;
  inspector.selectedLabel = selection.label;
  inspector.selectedText = selection.text;
  if (!inspector.target) {
    return;
  }
  if (inspector.target.kind === "param") {
    nodeConfigState[inspector.target.key] =
      inspector.target.selectorType === "CSS" ? selection.cssSelector : selection.xpath;
  } else {
    const index = intOr(inspector.target.key, -1);
    if (index >= 0 && outputColumns.value[index]) {
      outputColumns.value[index].xpath = selection.xpath;
    }
  }
}

function copyInspectorXpath() {
  if (!inspector.selectedXpath) {
    return;
  }
  void navigator.clipboard.writeText(inspector.selectedXpath);
  notify("XPath 已复制", "success");
}

async function testSelectorParam(param: SpiderSpiParameter) {
  if (!selectedTask.value?.spiderTaskUrl) {
    notify("当前任务没有目标 URL", "info");
    return;
  }
  const selector = trim(nodeConfigState[param.name]);
  if (!selector) {
    notify("请先填写选择器", "info");
    return;
  }
  loading.selectorTest = true;
  try {
    const result = await request("test-selector", {
      method: "POST",
      body: JSON.stringify({
        url: selectedTask.value.spiderTaskUrl,
        html: inspector.rawHtml || undefined,
        selector,
        type: resolveSelectorTypeForParam(param, selector),
      }),
    });
    selectorResults[param.name] = asList(result);
    notify(
      selectorResults[param.name].length
        ? `匹配到 ${selectorResults[param.name].length} 条结果`
        : "未匹配到结果",
      selectorResults[param.name].length ? "success" : "info",
    );
  } catch (error) {
    selectorResults[param.name] = [];
    notify(resolveError(error, "测试选择器失败"), "error");
  } finally {
    loading.selectorTest = false;
  }
}

function resolveSelectorTypeForParam(param: SpiderSpiParameter, selector: string) {
  const hint = upper(
    `${param.name} ${param.label} ${param.description || ""} ${selectedNode.value?.spiName || ""}`,
  );
  if (hint.includes("CSS")) {
    return "CSS";
  }
  if (hint.includes("REGEX")) {
    return "REGEX";
  }
  if (hint.includes("JSON")) {
    return "JSON_PATH";
  }
  if (!selector.startsWith("/") && !selector.startsWith("(") && selector.includes(">")) {
    return "CSS";
  }
  return "XPATH";
}

function resolveParamSelectorType(param: SpiderSpiParameter) {
  return upper(`${param.name} ${param.label} ${param.description || ""}`).includes("CSS")
    ? "CSS"
    : "XPATH";
}

function flattenInspectorTree(root: HtmlTreeNode | null) {
  if (!root) {
    return [] as InspectorTreeRow[];
  }
  const rows: InspectorTreeRow[] = [];
  const visit = (node: HtmlTreeNode, depth: number) => {
    const hasChildren = Boolean(node.children?.length);
    const expanded = hasChildren ? inspector.expanded[node.xpath] !== false : false;
    rows.push({
      node,
      depth,
      expanded,
      hasChildren,
    });
    if (hasChildren && expanded) {
      node.children!.forEach((child) => visit(child, depth + 1));
    }
  };
  visit(root, 0);
  return rows;
}

function buildInitialExpanded(root: HtmlTreeNode | null) {
  const expanded: Record<string, boolean> = {};
  const walk = (node: HtmlTreeNode | null, depth: number) => {
    if (!node) {
      return;
    }
    if (depth <= 1) {
      expanded[node.xpath] = true;
    }
    node.children?.forEach((child) => walk(child, depth + 1));
  };
  walk(root, 0);
  return expanded;
}

function evaluateXpath(doc: Document, xpath: string) {
  try {
    const result = doc.evaluate(xpath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue as Element | null;
  } catch {
    return null;
  }
}

function findTreeNodeByXpath(root: HtmlTreeNode | null, xpath: string): HtmlTreeNode | null {
  if (!root) {
    return null;
  }
  if (root.xpath === xpath) {
    return root;
  }
  for (const child of root.children || []) {
    const matched = findTreeNodeByXpath(child, xpath);
    if (matched) {
      return matched;
    }
  }
  return null;
}

function buildElementXpath(element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && current.nodeType === 1) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (!parent) {
      parts.unshift(`/${tag}`);
      break;
    }
    const siblings = Array.from(parent.children).filter((item) => item.tagName === current?.tagName);
    const index = siblings.indexOf(current) + 1;
    parts.unshift(`/${tag}${siblings.length > 1 ? `[${index}]` : ""}`);
    current = parent;
  }
  return parts.join("");
}

function buildCssSelector(element: Element) {
  const parts: string[] = [];
  let current: Element | null = element;
  let guard = 0;
  while (current && guard++ < 6) {
    let selector = current.tagName.toLowerCase();
    if (current.id) {
      selector += `#${current.id}`;
      parts.unshift(selector);
      break;
    }
    if (current.classList.length) {
      selector += `.${Array.from(current.classList).slice(0, 2).join(".")}`;
    } else if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children).filter((item) => item.tagName === current?.tagName);
      if (siblings.length > 1) {
        selector += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }
    parts.unshift(selector);
    current = current.parentElement;
  }
  return parts.join(" > ");
}

function injectBaseHref(html: string, baseUrl: string) {
  if (!html) {
    return "";
  }
  const baseTag = baseUrl ? `<base href="${escapeHtml(baseUrl)}">` : "";
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }
  return `<html><head>${baseTag}</head><body>${html}</body></html>`;
}

function createTaskForm(): SpiderTask {
  return {
    spiderTaskName: "",
    spiderTaskDesc: "",
    spiderTaskUrl: "",
    spiderTaskUrlPattern: "",
    spiderTaskStatus: 1,
    spiderTaskScheduleType: "NONE",
    spiderTaskCron: "",
    spiderTaskThreadNum: 1,
    spiderTaskSleepTime: 1000,
    spiderTaskTimeout: 30,
    spiderTaskMaxDepth: 0,
    spiderTaskPagePattern: "",
    spiderTaskMaxPages: 0,
    spiderTaskIncrementalMode: "HASH",
    spiderTaskRateLimit: 0,
    spiderTaskPipelineType: "JSON",
    spiderTaskRunStatus: "IDLE",
  };
}

function createEmptyCatalog(): SpiderSpiTypeList {
  return {
    urlSource: [],
    downloader: [],
    processor: [],
    middleware: [],
    dataFilter: [],
    pipeline: [],
    scheduler: [],
    siteConfig: [],
    proxyPool: [],
    uaPool: [],
  };
}

function loadSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(props.storageKey) || "{}");
    return {
      apiRoot: trim(value.apiRoot) || props.defaultApiRoot,
      authHeaderName: trim(value.authHeaderName),
      authHeaderValue: trim(value.authHeaderValue),
    };
  } catch {
    return {
      apiRoot: props.defaultApiRoot,
      authHeaderName: "",
      authHeaderValue: "",
    };
  }
}

async function request(path: string, init?: RequestInit): Promise<any> {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (trim(settings.authHeaderName) && trim(settings.authHeaderValue)) {
    headers.set(trim(settings.authHeaderName), trim(settings.authHeaderValue));
  }
  const response = await fetch(apiUrl(path), {
    credentials: "include",
    ...init,
    headers,
  });
  if (response.status === 401) {
    redirectToLogin();
    throw new Error("请先登录控制台");
  }
  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;
  if (!response.ok) {
    throw new Error(resolveMessage(payload) || `请求失败: ${response.status}`);
  }
  if (payload && typeof payload === "object" && "code" in payload) {
    const code = String((payload as RecordLike).code ?? "");
    if (!["00000", "200", "0"].includes(code)) {
      throw new Error(resolveMessage(payload) || `业务请求失败: ${code}`);
    }
    return "data" in (payload as RecordLike) ? (payload as RecordLike).data : payload;
  }
  if (payload && typeof payload === "object" && (payload as RecordLike).success === false) {
    throw new Error(resolveMessage(payload) || "业务请求失败");
  }
  return payload;
}

function apiUrl(path: string) {
  const root = trim(settings.apiRoot) || props.defaultApiRoot;
  const normalized = root.endsWith("/") ? root : `${root}/`;
  return new URL(path.replace(/^\/+/, ""), new URL(normalized, window.location.href)).toString();
}

function redirectToLogin() {
  const url = new URL("./login.html", window.location.href);
  url.searchParams.set("redirect", window.location.href);
  window.location.replace(url.toString());
}

function notify(message: string, type: Toast["type"]) {
  const id = ++toastSeed;
  toasts.value.push({ id, message, type });
  window.setTimeout(() => {
    toasts.value = toasts.value.filter((item) => item.id !== id);
  }, 3200);
}

function logLevelClass(value: unknown) {
  const level = upper(value);
  if (level === "ERROR") return "spring-failure";
  if (level === "WARN") return "spring-stopped";
  return "spring-success";
}

function runStatusClass(value: unknown) {
  const status = upper(value);
  if (status === "RUNNING") return "spring-running";
  if (status === "ERROR" || status === "STOPPED") return "spring-failure";
  return "";
}

function taskStatusLabel(value: unknown) {
  const matched = TASK_STATUS_OPTIONS.find((item) => String(item.value) === trim(value));
  return matched?.label || "未知";
}

function isBooleanParam(param: SpiderSpiParameter) {
  return upper(param.type) === "BOOLEAN";
}

function isSelectParam(param: SpiderSpiParameter) {
  return upper(param.type) === "SELECT";
}

function isLongParam(param: SpiderSpiParameter) {
  const type = upper(param.type);
  return ["TEXTAREA", "JSON", "URLS"].includes(type);
}

function isSelectorParam(param: SpiderSpiParameter) {
  const hint = upper(`${param.name} ${param.label} ${param.description || ""}`);
  return ["SELECTOR", "XPATH", "CSS", "EXPRESSION", "提取"].some((item) => hint.includes(item));
}

function inputType(param: SpiderSpiParameter) {
  const type = upper(param.type);
  if (type === "PASSWORD") return "password";
  if (type === "NUMBER") return "number";
  return "text";
}

function defaultParamValue(param: SpiderSpiParameter) {
  if (param.defaultValue !== undefined) {
    return cloneValue(param.defaultValue);
  }
  if (isBooleanParam(param)) {
    return false;
  }
  return "";
}

function normalizeParamValue(param: SpiderSpiParameter, value: unknown) {
  const type = upper(param.type);
  if (type === "BOOLEAN") {
    return value === true || String(value) === "true";
  }
  if (type === "NUMBER") {
    return nullableNumber(value);
  }
  if (type === "JSON") {
    const text = trim(value);
    if (!text) {
      return {};
    }
    const parsed = safeJsonParse(text);
    return typeof parsed === "string" ? text : parsed;
  }
  return trim(value);
}

function parseJsonObject(value: unknown) {
  if (!trim(value)) {
    return {};
  }
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function formatDateTime(value?: unknown) {
  const text = trim(value);
  if (!text) {
    return "";
  }
  const parsed = new Date(text.includes("T") ? text : text.replace(" ", "T"));
  return Number.isNaN(parsed.getTime())
    ? text.replace("T", " ")
    : parsed.toLocaleString("zh-CN", { hour12: false });
}

function formatNumber(value: unknown) {
  const parsed = nullableNumber(value);
  return parsed == null ? "0" : parsed.toLocaleString("zh-CN");
}

function clearObject(target: Record<string, any>) {
  Object.keys(target).forEach((key) => {
    delete target[key];
  });
}

function asList<T = any>(value: any): T[] {
  return Array.isArray(value) ? value : [];
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function resolveMessage(payload: any) {
  if (!payload) {
    return "";
  }
  if (typeof payload === "string") {
    return payload;
  }
  return payload.message || payload.msg || payload.error || "";
}

function resolveError(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function trim(value: unknown) {
  return value == null ? "" : String(value).trim();
}

function upper(value: unknown) {
  return trim(value).toUpperCase();
}

function intOr(value: unknown, fallback: number) {
  const parsed = Number.parseInt(trim(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function nullableNumber(value: unknown) {
  const text = trim(value);
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sameTask(left: SpiderTask | null, right: SpiderTask | null) {
  return Boolean(left && right && String(left.spiderTaskId ?? "") === String(right.spiderTaskId ?? ""));
}

function isSelectedTask(task: SpiderTask) {
  return sameTask(task, selectedTask.value);
}

function isEmptyValue(value: unknown) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === "string") {
    return !trim(value);
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  if (typeof value === "object") {
    return Object.keys(value as Record<string, any>).length === 0;
  }
  return false;
}

function cloneValue<T>(value: T): T {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
</script>

<style scoped lang="scss">
.spider-page-shell {
  padding-bottom: 44px;
}

.spider-inline-note {
  margin-top: 12px;
  font-size: 13px;
}

.spider-studio {
  margin-top: 22px;
  border-radius: var(--spring-radius-xl);
  overflow: hidden;
}

.spider-studio-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding: 26px 28px 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.spider-studio-header h2,
.spider-palette-header h3,
.spider-inspector-header h3 {
  margin: 12px 0 6px;
  font-size: 24px;
}

.spider-studio-header p,
.spider-palette-header span,
.spider-inspector-header p,
.spider-section-head span {
  margin: 0;
  color: var(--spring-muted);
}

.spider-studio-eyebrow {
  background: rgba(18, 163, 111, 0.1);
  color: var(--spring-accent);
}

.spider-studio-empty {
  padding: 42px 28px 50px;
}

.spider-validation-list {
  display: grid;
  gap: 10px;
  padding: 0 28px 16px;
}

.spider-validation-item {
  padding: 12px 14px;
  border-radius: var(--spring-radius-md);
  background: rgba(207, 61, 79, 0.12);
  color: var(--spring-danger);
  font-size: 13px;
  font-weight: 700;
}

.spider-studio-body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 380px;
  min-height: 760px;
}

.spider-palette,
.spider-inspector {
  background: rgba(255, 255, 255, 0.64);
}

.spider-palette {
  border-right: 1px solid rgba(15, 23, 42, 0.07);
  padding: 20px 18px 24px;
  overflow: auto;
}

.spider-palette-header {
  margin-bottom: 18px;
}

.spider-palette-header h3 {
  margin-top: 0;
  font-size: 20px;
}

.spider-palette-group + .spider-palette-group {
  margin-top: 18px;
}

.spider-palette-group header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-bottom: 10px;
}

.spider-palette-items {
  display: grid;
  gap: 10px;
}

.spider-palette-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.86);
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.spider-palette-item:hover {
  transform: translateY(-1px);
  border-color: rgba(22, 102, 216, 0.2);
  box-shadow: 0 12px 22px rgba(22, 102, 216, 0.12);
}

.spider-palette-item-name {
  font-weight: 700;
  color: var(--spring-text);
}

.spider-palette-item-desc,
.spider-palette-empty {
  color: var(--spring-muted);
  font-size: 12px;
  line-height: 1.5;
}

.spider-canvas-shell {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spider-canvas-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.84), rgba(255, 255, 255, 0.64)),
    radial-gradient(circle at top left, rgba(22, 102, 216, 0.14), transparent 34%);
}

.spider-canvas-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.spider-canvas {
  position: relative;
  flex: 1;
  overflow: auto;
  background:
    linear-gradient(90deg, rgba(17, 32, 56, 0.05) 1px, transparent 1px),
    linear-gradient(rgba(17, 32, 56, 0.05) 1px, transparent 1px),
    linear-gradient(180deg, rgba(238, 244, 255, 0.92), rgba(243, 246, 251, 0.98));
  background-size: 24px 24px, 24px 24px, auto;
  min-height: 650px;
}

.spider-connections {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.spider-connection-line {
  fill: none;
  stroke: rgba(22, 102, 216, 0.82);
  stroke-width: 3;
  pointer-events: auto;
  cursor: pointer;
  transition: stroke 0.18s ease;
}

.spider-connection-line:hover {
  stroke: rgba(207, 61, 79, 0.92);
}

.spider-node {
  position: absolute;
  width: 232px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 36px rgba(17, 32, 56, 0.12);
  backdrop-filter: blur(12px);
}

.spider-node-active {
  box-shadow:
    0 0 0 2px rgba(22, 102, 216, 0.28),
    0 20px 38px rgba(17, 32, 56, 0.16);
}

.spider-node-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  border-top: 4px solid var(--spring-primary);
  cursor: grab;
}

.spider-node-header strong,
.spider-selector-selection strong {
  display: block;
  font-size: 15px;
}

.spider-node-header small,
.spider-node-body p,
.spider-node-delete,
.spider-columns-header h5,
.spider-section-head h4,
.spider-section-head h5 {
  margin: 0;
}

.spider-node-header small,
.spider-node-body p {
  color: var(--spring-muted);
  line-height: 1.45;
}

.spider-node-delete {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: rgba(207, 61, 79, 0.12);
  color: var(--spring-danger);
  cursor: pointer;
  font-size: 18px;
  line-height: 30px;
}

.spider-node-body {
  padding: 12px 16px;
}

.spider-node-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.spider-node-footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 0 16px 14px;
}

.spider-canvas-empty,
.spider-inspector-empty,
.spider-preview-empty {
  padding: 42px 24px;
}

.spider-inspector {
  border-left: 1px solid rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.spider-inspector-header {
  padding: 22px 22px 12px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.spider-inspector-body {
  padding: 18px 22px 24px;
  overflow: auto;
  display: grid;
  gap: 18px;
}

.spider-inspector-section {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 18px;
  padding: 16px;
  background: rgba(15, 23, 42, 0.03);
}

.spider-section-head,
.spider-columns-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 14px;
}

.spider-selector-tools {
  display: grid;
  gap: 10px;
  margin-top: -4px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(22, 102, 216, 0.06);
}

.spider-selector-result {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.spider-table-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.spider-column-list {
  display: grid;
  gap: 14px;
}

.spider-column-card {
  padding: 14px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
}

.spider-column-actions {
  margin-top: 12px;
}

.spider-inline-switches {
  display: flex;
  gap: 12px;
  align-items: center;
  min-height: 44px;
}

.spider-inline-switches label {
  display: flex;
  gap: 6px;
  align-items: center;
  color: var(--spring-muted);
  font-size: 13px;
}

.spider-structure {
  margin-top: 18px;
}

.spider-structure-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.spider-code-preview {
  margin-top: 14px;
}

.spider-editor-card {
  width: min(980px, 100%);
}

.spider-selector-modal-backdrop {
  z-index: 1100;
}

.spider-selector-modal {
  width: min(1320px, 100%);
}

.spider-selector-toolbar {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) repeat(2, minmax(160px, 0.3fr)) auto;
  gap: 16px;
  padding: 0 24px 20px;
}

.spider-selector-url-field {
  min-width: 0;
}

.spider-selector-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(380px, 0.85fr);
  gap: 18px;
  padding: 0 24px 20px;
}

.spider-selector-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
}

.spider-preview-frame-shell {
  min-height: 520px;
  background: rgba(17, 32, 56, 0.04);
}

.spider-preview-frame {
  width: 100%;
  min-height: 520px;
  border: 0;
  background: #fff;
}

.spider-elements-tree {
  min-height: 520px;
  max-height: 520px;
  overflow: auto;
  padding: 10px 0;
  background:
    linear-gradient(180deg, rgba(249, 250, 252, 0.96), rgba(244, 247, 251, 0.98));
}

.spider-tree-row {
  width: 100%;
  min-height: 38px;
  padding-right: 14px;
  border: 0;
  background: transparent;
  color: var(--spring-text);
  display: flex;
  gap: 8px;
  align-items: center;
  text-align: left;
  cursor: pointer;
}

.spider-tree-row:hover,
.spider-tree-row-active {
  background: rgba(22, 102, 216, 0.08);
}

.spider-tree-toggle {
  width: 18px;
  color: var(--spring-muted);
  flex: 0 0 18px;
}

.spider-tree-tag {
  color: #b13b83;
  font-family: "Consolas", "SFMono-Regular", monospace;
  font-size: 12px;
}

.spider-tree-id {
  color: #1764d5;
  font-size: 12px;
}

.spider-tree-class {
  color: #1d9a6c;
  font-size: 12px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-tree-text {
  color: var(--spring-muted);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-selector-footer {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 0 24px 24px;
}

.spider-selector-selection {
  display: grid;
  gap: 4px;
  min-width: 0;
}

@media (max-width: 1360px) {
  .spider-studio-body {
    grid-template-columns: 1fr;
  }

  .spider-palette,
  .spider-inspector {
    border: 0;
  }

  .spider-canvas {
    min-height: 560px;
  }
}

@media (max-width: 1080px) {
  .spider-selector-toolbar,
  .spider-selector-layout,
  .spider-structure-grid {
    grid-template-columns: 1fr;
  }

  .spider-selector-footer,
  .spider-studio-header,
  .spider-canvas-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
