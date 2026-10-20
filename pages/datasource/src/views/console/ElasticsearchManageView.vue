<template>
  <div class="dsm tel-page" @keydown="handleKeydown">
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="Coin" :size="18" class="dsm-title-icon dsm-es-icon" />
        <span class="dsm-title">Elasticsearch 搜索引擎管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton
          layout="square"
          tip="集群信息"
          icon="Monitor"
          data-testid="es-btn-cluster"
          :disabled="!source"
          :loading="clusterLoading"
          @click="openCluster"
        />
        <ReButton
          layout="square"
          tip="能力声明"
          icon="Setting"
          data-testid="es-btn-capability"
          :loading="capabilityLoading"
          @click="loadCapability"
        />
        <ReButton
          layout="square"
          tip="测试连接"
          icon="Connection"
          data-testid="es-btn-test"
          :disabled="!source"
          :loading="testing"
          @click="testConnection"
        />
        <ReButton
          layout="square"
          tip="刷新"
          icon="Refresh"
          data-testid="es-btn-refresh"
          :loading="loading"
          @click="refresh"
        />
        <ReButton
          layout="square"
          type="primary"
          tip="新建索引"
          icon="Plus"
          data-testid="es-btn-create"
          :disabled="!source"
          @click="openCreateIndex"
        />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <!-- ES 集群 Red 状态全局告警 -->
    <div v-if="!gap && cluster?.status === 'red'" class="es-red-banner re-surface">
      <ReIcon name="WarningFilled" class="es-red-icon" />
      <span class="es-red-text">
        集群状态为 <strong>RED</strong>，存在未分配分片，索引数据存在丢失风险，请尽快处理！
      </span>
      <ReButton
        layout="square"
        icon="Refresh"
        tip="刷新集群状态"
        size="small"
        :loading="clusterLoading"
        data-testid="es-red-refresh"
        @click="loadCluster"
      />
    </div>

    <div v-if="!gap" class="dsm-body">
      <div class="dsm-content">
        <div class="dsm-info-card re-surface">
          <div class="dsm-info-row">
            <span class="dsm-info-label">数据源</span>
            <span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 9200}` : "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">能力</span>
            <span class="dsm-info-value">{{ capabilityText }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">版本</span>
            <span class="dsm-info-value mono">{{ testResult.version || "未测试" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接详情</span>
            <span class="dsm-info-value">{{ testResult.detail || "未测试" }}</span>
          </div>
        </div>

        <ReTab v-model="activeTab" :tabs="tabs" data-testid="es-tabs">
          <!-- ============ 索引概览（增删改查，类似设计表） ============ -->
          <template #overview>
            <div class="dsm-section">
              <div class="dsm-section-title">
                <span>索引概览（{{ filteredIndices.length }} / {{ indices.length }}）</span>
                <div class="dsm-section-actions">
                  <ReInput
                    v-model="indexFilter"
                    placeholder="过滤索引名"
                    class="dsm-filter"
                    data-testid="es-index-filter"
                  />
                  <ReButton
                    layout="square"
                    :type="unhealthyOnly ? 'warning' : ''"
                    icon="Warning"
                    :tip="unhealthyOnly ? '取消只看异常' : '只看异常索引'"
                    data-testid="es-index-unhealthy"
                    @click="unhealthyOnly = !unhealthyOnly"
                  />
                  <ReButton
                    layout="square"
                    icon="Refresh"
                    tip="刷新索引"
                    data-testid="es-index-refresh"
                    :loading="loading"
                    @click="loadIndices"
                  />
                  <ReButton
                    layout="square"
                    type="primary"
                    icon="Plus"
                    tip="新建索引（设计表）"
                    data-testid="es-index-create"
                    :disabled="!source"
                    @click="openCreateIndex"
                  />
                  <ReButton
                    layout="square"
                    icon="Select"
                    :tip="allSelected ? '取消全选' : '全选'"
                    data-testid="es-index-selectall"
                    @click="selectAllIndices"
                  />
                  <ReButton
                    layout="square"
                    type="danger"
                    icon="Delete"
                    tip="批量删除"
                    data-testid="es-index-batch-delete"
                    :disabled="indexSelection.size === 0"
                    @click="batchDeleteIndices"
                  />
                  <ReButton
                    layout="square"
                    icon="Setting"
                    tip="批量修改副本"
                    data-testid="es-index-batch-replicas"
                    :disabled="indexSelection.size === 0"
                    @click="batchUpdateReplicas"
                  />
                </div>
              </div>
              <ReTable
                :data="paginatedIndices"
                :columns="indexColumns"
                :loading="loading"
                :pagination="false"
                stripe
                border
                height="420px"
                @row-hover="onIndexRowHover"
              >
                <template #col-sel="{ row }">
                  <ElCheckbox
                    :model-value="indexSelection.has((row as EsIndexRow).name)"
                    @change="toggleIndexSelect((row as EsIndexRow).name)"
                  />
                </template>
                <template #col-health="{ row }">
                  <span class="dsm-health-cell">
                    <span
                      class="dsm-health-dot"
                      :class="`is-${healthDotClass((row as EsIndexRow).health)}`"
                    />
                    <ReTag :type="healthTag((row as EsIndexRow).health)">{{ (row as EsIndexRow).health || "—" }}</ReTag>
                  </span>
                </template>
                <template #col-name="{ row }">
                  <span
                    class="dsm-index-name"
                    :title="(row as EsIndexRow).name"
                  >{{ (row as EsIndexRow).name }}</span>
                </template>
                <template #col-actions="{ row }">
                  <span class="dsm-row-actions" @click.stop>
                    <ReButton
                      layout="square"
                      size="small"
                      icon="View"
                      tip="字段"
                      data-testid="es-row-fields"
                      @click="openFieldDrawer(row as EsIndexRow)"
                    />
                    <ReButton
                      layout="square"
                      size="small"
                      type="primary"
                      icon="Edit"
                      tip="管理字段（增 / 删 / 改）"
                      data-testid="es-row-fieldsmgr"
                      @click="openFieldManager((row as EsIndexRow).name)"
                    />
                    <ReButton
                      layout="square"
                      size="small"
                      icon="Download"
                      tip="导出结构"
                      data-testid="es-row-export"
                      @click="openExportDialog((row as EsIndexRow).name)"
                    />
                    <ReButton
                      layout="square"
                      size="small"
                      icon="Document"
                      tip="文档详情"
                      data-testid="es-row-docdetail"
                      @click="openDocDetail(row as EsIndexRow)"
                    />
                    <ReButton
                      layout="square"
                      size="small"
                      type="danger"
                      icon="Delete"
                      tip="删除索引（删表）"
                      data-testid="es-row-delete"
                      @click="removeIndex(row as EsIndexRow)"
                    />
                  </span>
                </template>
              </ReTable>
              <!-- 索引悬浮信息卡 -->
              <Teleport to="body">
                <div
                  v-if="hoveredIndex"
                  class="dsm-index-hover-card"
                  :style="hoverCardStyle"
                  @click.stop
                >
                  <div class="dsm-hover-title">{{ hoveredIndex.name }}</div>
                  <div class="dsm-hover-row"><span class="dsm-hover-label">健康</span><ReTag size="small" :type="healthTag(hoveredIndex.health)">{{ hoveredIndex.health || "—" }}</ReTag></div>
                  <div class="dsm-hover-row"><span class="dsm-hover-label">状态</span><span class="dsm-hover-value">{{ hoveredIndex.status || "—" }}</span></div>
                  <div class="dsm-hover-row"><span class="dsm-hover-label">文档数</span><span class="dsm-hover-value mono">{{ hoveredIndex.docs || "—" }}</span></div>
                  <div class="dsm-hover-row"><span class="dsm-hover-label">存储</span><span class="dsm-hover-value mono">{{ hoveredIndex.storeSize || "—" }}</span></div>
                </div>
              </Teleport>
              <RePagination
                v-model:page="indexPage"
                v-model:page-size="indexPageSize"
                :total="filteredIndices.length"
                layout="sizes,prev,pager,next"
              />
              <ReEmpty v-if="!loading && indices.length === 0" description="暂无索引，试试「新建索引」创建一个" />
            </div>
          </template>

          <!-- ============ 节点列表（异步加载） ============ -->
          <template #nodes>
            <div class="dsm-section">
              <!-- 集群健康趋势图 -->
              <div class="dsm-cluster-chart-wrap">
                <div class="dsm-chart-label">
                  <ReIcon name="TrendCharts" class="dsm-chart-label-icon" />
                  <span>集群健康趋势（最近 {{ clusterChartSnapshots }} 次刷新）</span>
                </div>
                <EsClusterChart ref="clusterChartRef" :cluster="cluster" />
              </div>
              <div class="dsm-section-title">
                <span>节点列表（{{ clusterNodes.length }}）</span>
                <div class="dsm-section-actions">
                  <ReButton
                    layout="square"
                    icon="TrendCharts"
                    tip="分片热力图"
                    data-testid="es-shard-heatmap"
                    :loading="shardHeatmapLoading"
                    @click="openShardHeatmap"
                  />
                  <ReButton
                    layout="square"
                    icon="Refresh"
                    tip="刷新节点"
                    data-testid="es-nodes-refresh"
                    :loading="nodesLoading"
                    @click="loadNodesTab"
                  />
                </div>
              </div>
              <div v-if="nodesLoading" class="dsm-loading-row">
                <ReLoading />
              </div>
              <ReTable
                v-else
                :data="paginatedNodes"
                :columns="nodeColumns"
                :pagination="false"
                stripe
                border
                height="420px"
              >
                <template #col-name="{ row }">
                  <span class="dsm-node-name-cell" @click="openNodeDetail(row as EsClusterNode)">
                    <span class="dsm-node-status-dot" :class="(row as EsNodeRow).statusTone" />
                    <span class="dsm-node-name-text">{{ (row as EsNodeRow).name }}</span>
                  </span>
                </template>
                <template #col-master="{ row }">
                  <ReTag v-if="(row as EsClusterNode).master === '*'" type="warning">master</ReTag>
                  <span v-else class="dsm-muted">—</span>
                </template>
                <template #col-heap="{ row }">
                  <div class="dsm-meter" :title="`堆使用 ${row.heapPercent}%`">
                    <span class="dsm-meter__track">
                      <span
                        class="dsm-meter__fill"
                        :class="(row as EsNodeRow).statusTone === 'is-red' ? 'is-danger' : (row as EsNodeRow).statusTone === 'is-yellow' ? 'is-warn' : ''"
                        :style="{ width: `${row.heapPercent || 0}%` }"
                      />
                    </span>
                    <span class="dsm-meter__text">{{ row.heapPercent || "—" }}%</span>
                  </div>
                </template>
                <template #col-cpu="{ row }">
                  <div class="dsm-meter" title="CPU 使用率">
                    <span class="dsm-meter__track">
                      <span
                        class="dsm-meter__fill"
                        :class="`is-${(row as EsNodeRow).cpuTone}`"
                        :style="{ width: `${(row as EsNodeRow).cpuPct ?? 0}%` }"
                      />
                    </span>
                    <span class="dsm-meter__text">
                      {{ (row as EsNodeRow).cpuPct === null ? "—" : `${(row as EsNodeRow).cpuPct}%` }}
                    </span>
                  </div>
                </template>
              </ReTable>
              <RePagination
                v-if="clusterNodes.length > nodePageSize"
                v-model:page="nodePage"
                v-model:page-size="nodePageSize"
                :total="clusterNodes.length"
                layout="sizes,prev,pager,next"
              />
              <ReEmpty v-if="!nodesLoading && clusterNodes.length === 0" description="暂无节点信息，请检查连接" />
            </div>
          </template>

          <!-- ============ 集群纳管：生成每个节点要贴的 elasticsearch.yml ============ -->
          <template #clusterCfg>
            <div class="dsm-section">
              <div class="dsm-section-title">
                <span>集群纳管（生成各节点 elasticsearch.yml）</span>
                <div class="dsm-section-actions">
                  <ReButton
                    layout="square"
                    icon="Refresh"
                    tip="用当前连接的集群名回填"
                    data-testid="es-cluster-prefill"
                    @click="prefillClusterForm"
                  />
                </div>
              </div>
              <ReAlert
                type="info"
                :closable="false"
                title="ES 组集群是节点级「静态设置」：只能改每台机器的 elasticsearch.yml 再重启，REST 的 _cluster/settings 不接受（ES 会报 not dynamic）。所以这里只生成配置片段，不远程改配置。"
              />

              <div class="dsm-cluster-form">
                <div class="dsm-form-item dsm-form-item--wide">
                  <label>集群名 cluster.name（各节点必须完全一致）</label>
                  <ReInput
                    v-model="clusterForm.clusterName"
                    placeholder="如 my-es-cluster"
                    data-testid="es-cluster-name"
                  />
                </div>
                <label class="dsm-bootstrap">
                  <ReSwitch v-model="clusterForm.bootstrap" data-testid="es-cluster-bootstrap" />
                  <span>首次启动写入 cluster.initial_master_nodes（集群形成后必须删掉这一行再重启）</span>
                </label>
              </div>

              <div class="dsm-field-head">
                <span class="dsm-sub-title">节点（{{ clusterForm.nodes.length }}）</span>
                <ReButton
                  layout="square"
                  icon="Plus"
                  tip="添加节点"
                  data-testid="es-cluster-add-node"
                  @click="addClusterNode"
                />
              </div>
              <div class="dsm-node-grid">
                <div class="dsm-node-grid-head">
                  <span>节点名</span>
                  <span>主机</span>
                  <span>HTTP 端口</span>
                  <span>传输端口</span>
                  <span>角色</span>
                  <span>操作</span>
                </div>
                <div v-for="(n, idx) in clusterForm.nodes" :key="idx" class="dsm-node-grid-row">
                  <ReInput v-model="n.name" placeholder="node-1" :data-testid="`es-cluster-node-name-${idx}`" />
                  <ReInput v-model="n.host" placeholder="10.0.0.11" :data-testid="`es-cluster-node-host-${idx}`" />
                  <ReInputNumber
                    v-model="n.httpPort"
                    :min="1"
                    :max="65535"
                    :data-testid="`es-cluster-node-http-${idx}`"
                  />
                  <ReInputNumber
                    v-model="n.transportPort"
                    :min="1"
                    :max="65535"
                    :data-testid="`es-cluster-node-transport-${idx}`"
                  />
                  <ReSelect
                    v-model="n.roles"
                    multiple
                    collapse-tags
                    :data="ROLE_OPTIONS"
                    :data-testid="`es-cluster-node-roles-${idx}`"
                  />
                  <ReButton
                    layout="square"
                    size="small"
                    type="danger"
                    icon="Delete"
                    tip="删除节点"
                    :data-testid="`es-cluster-node-remove-${idx}`"
                    @click="removeClusterNode(idx)"
                  />
                </div>
                <div v-if="clusterForm.nodes.length === 0" class="dsm-field-empty">
                  还没有节点，点右上角「+」添加；至少两台才能组成集群
                </div>
              </div>

              <div class="dsm-section-actions">
                <ReButton
                  type="primary"
                  icon="MagicStick"
                  data-testid="es-cluster-gen"
                  @click="buildClusterSnippets"
                >
                  生成配置
                </ReButton>
                <ReButton
                  icon="CopyDocument"
                  :disabled="clusterSnippets.length === 0"
                  :tip="clusterSnippets.length === 0 ? '暂无节点配置，请先生成' : '复制全部节点配置'"
                  data-testid="es-cluster-copy-all"
                  @click="copyAllClusterSnippets"
                >
                  复制全部
                </ReButton>
              </div>

              <div v-if="clusterSnippets.length" class="dsm-snippets">
                <div v-for="(s, idx) in clusterSnippets" :key="idx" class="dsm-snippet re-surface">
                  <div class="dsm-snippet-head">
                    <span class="mono">{{ s.title }}</span>
                    <ReButton
                      layout="square"
                      size="small"
                      icon="CopyDocument"
                      tip="复制该节点配置"
                      :data-testid="`es-cluster-copy-${idx}`"
                      @click="copyText(s.yaml, s.title)"
                    />
                  </div>
                  <pre class="dsm-snippet-body" :data-testid="`es-cluster-snippet-${idx}`">{{ s.yaml }}</pre>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 关系图谱 ============ -->
          <template #graph>
            <div class="dsm-section">
              <div class="dsm-section-title">
                <span>关系图谱（集群 → 节点，同 zk 拓扑；橙色为 master，悬浮节点看详情）</span>
                <div class="dsm-section-actions">
                  <ReButton
                    layout="square"
                    icon="Refresh"
                    tip="刷新图谱"
                    data-testid="es-graph-refresh"
                    :loading="graphLoading"
                    @click="loadGraphTab"
                  />
                </div>
              </div>
              <div class="dsm-graph-wrap re-surface">
                <ReRelationGraph
                  :nodes="graphNodes"
                  :edges="graphEdges"
                  layout="radial"
                  height="460px"
                  highlight="adjacent"
                  :minimap="graphNodes.length > 2"
                  :node-size="38"
                  empty-text="未取到集群节点"
                  data-testid="es-graph"
                  @node-hover="onGraphNodeHover"
                />
                <!-- 悬浮详情固定在图区右下角：跟在光标处会与右上角工具栏/节点重叠 -->
                <div v-if="graphHover" class="dsm-graph-detail" data-testid="es-graph-detail">
                  <div class="dsm-graph-tip-title">{{ graphHover.label }}</div>
                  <template v-if="graphHover.kind === 'cluster'">
                    <div class="dsm-graph-tip-row">类型：集群</div>
                    <div class="dsm-graph-tip-row">健康度：{{ graphHover.status || "—" }}</div>
                    <div class="dsm-graph-tip-row">节点数：{{ cluster?.nodes?.length ?? 0 }}</div>
                  </template>
                  <template v-else>
                    <div class="dsm-graph-tip-row">角色：{{ graphHover.master === "*" ? "master" : "node" }}</div>
                    <div class="dsm-graph-tip-row">地址：{{ graphHover.ip || "—" }}</div>
                    <div class="dsm-graph-tip-row">堆使用：{{ graphHover.heapPercent || "—" }} % · CPU {{ graphHover.cpu || "—" }} %</div>
                    <div class="dsm-graph-tip-row">负载：{{ graphHover.load || "—" }} · 版本 {{ graphHover.version || "—" }}</div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 查询检索（DSL 编辑器 + 历史记录） ============ -->
          <template #query>
            <div class="dsm-query-area">
              <!-- 模式切换 + 历史记录 -->
              <div class="dsm-query-toolbar">
                <ReSelect
                  v-model="queryMode"
                  :data="[{ label: '简单模式', value: 'simple' }, { label: 'DSL 模式', value: 'dsl' }]"
                  placeholder="查询模式"
                  class="dsm-query-mode"
                  data-testid="es-query-mode"
                />
                <ReSelect
                  v-if="queryMode === 'simple'"
                  v-model="queryIndex"
                  :data="indexOptions"
                  placeholder="选择索引（可留空走原始表达式）"
                  class="dsm-query-index"
                  data-testid="es-query-index"
                />
                <ReInput
                  v-if="queryMode === 'simple'"
                  v-model="queryKeyword"
                  :placeholder="queryPlaceholder"
                  class="dsm-query-input"
                  data-testid="es-query-keyword"
                  @keyup.enter="runQuery"
                />
                <div v-if="queryMode === 'dsl'" class="dsm-query-dsl-wrap">
                  <EsQueryEditor
                    v-model="queryDslText"
                    :keywords="indexOptions.map(o => o.label)"
                    :placeholder="queryDslPlaceholder"
                    min-height="160px"
                    max-height="280px"
                  />
                </div>
                <ReButton
                  v-if="queryHistory.length > 0"
                  layout="square"
                  icon="Clock"
                  :tip="`历史记录（${queryHistory.length} 条）`"
                  data-testid="es-query-history-toggle"
                  @click="showQueryHistory = !showQueryHistory"
                />
                <ReButton
                  type="primary"
                  icon="Search"
                  :loading="queryLoading"
                  data-testid="es-query-run"
                  @click="runQuery"
                >
                  检索
                </ReButton>
              </div>

              <!-- 历史记录下拉 -->
              <div v-if="showQueryHistory && queryHistory.length > 0" class="dsm-query-history re-surface">
                <div class="dsm-history-header">
                  <span class="dsm-history-title">历史记录</span>
                  <ReButton layout="square" size="small" icon="Delete" tip="清空历史" @click="clearQueryHistory" />
                </div>
                <div class="dsm-history-list">
                  <div
                    v-for="(item, idx) in queryHistory"
                    :key="idx"
                    class="dsm-history-item"
                    @click="restoreFromHistory(item)"
                  >
                    <span class="dsm-history-text mono">{{ item.text.slice(0, 80) }}{{ item.text.length > 80 ? '…' : '' }}</span>
                    <span class="dsm-history-meta">{{ item.mode }} · {{ formatTime(item.time) }}</span>
                  </div>
                </div>
              </div>

              <ReAlert
                v-if="capability?.queryDescription"
                type="info"
                :closable="false"
                :title="capability.queryDescription"
                class="dsm-query-hint"
              />
              <div class="dsm-query-result">
                <div class="dsm-query-header">
                  检索结果
                  <span v-if="queryResult" class="dsm-query-meta">
                    {{ queryResult.rowCount }} 行 · {{ queryResult.executionTimeMs }} ms
                    <span v-if="queryResult.truncated" class="dsm-query-warn">
                      已截断，服务端共 {{ queryResult.totalRows }} 行，请收窄条件
                    </span>
                  </span>
                </div>
                <ReTable
                  v-if="queryResult && queryResult.columns.length > 0"
                  :data="queryResult.rows"
                  :columns="queryColumns"
                  stripe
                  border
                  height="380px"
                />
                <ReEmpty v-else :description="queryEmptyText" />
              </div>
            </div>
          </template>

          <!-- ============ Dev Tools（类 Kibana Console） ============ -->
          <template #devtools>
            <div class="dsm-devtools">
              <!-- 左侧：历史记录 -->
              <aside class="dsm-devtools-history">
                <div class="dsm-devtools-history-head">
                  <span>历史记录</span>
                  <ReButton
                    v-if="devToolHistory.length > 0"
                    size="small"
                    type="danger"
                    icon="Delete"
                    tip="清空历史"
                    layout="square"
                    @click="devToolHistory.splice(0)"
                  />
                </div>
                <div v-if="devToolHistory.length === 0" class="dsm-devtools-history-empty">
                  暂无历史
                </div>
                <div
                  v-for="(h, i) in devToolHistory"
                  :key="i"
                  class="dsm-devtools-history-item"
                  :title="h.dsl"
                  @click="applyDevToolHistory(h)"
                >
                  <span class="dsm-devtools-history-cmd">{{ h.cmd }}</span>
                  <span class="dsm-devtools-history-idx">{{ h.index || "*" }}</span>
                </div>
              </aside>

              <!-- 右侧：编辑器 + 结果 -->
              <div class="dsm-devtools-main">
                <!-- 工具栏 -->
                <div class="dsm-devtools-toolbar">
                  <ReSelect
                    v-model="devToolCmd"
                    :data="devToolCmdOptions"
                    placeholder="命令"
                    class="dsm-devtools-cmd"
                    data-testid="es-devtools-cmd"
                  />
                  <ReSelect
                    v-model="devToolIndex"
                    :data="indexOptions"
                    filterable
                    allow-create
                    placeholder="索引名（* 表示所有）"
                    class="dsm-devtools-idx"
                    data-testid="es-devtools-idx"
                  />
                  <ReButton
                    type="primary"
                    icon="VideoPlay"
                    :loading="devToolLoading"
                    data-testid="es-devtools-run"
                    @click="runDevTool"
                  >
                    运行
                  </ReButton>
                  <ReButton
                    icon="Delete"
                    tip="清空"
                    layout="square"
                    @click="devToolDsl = ''; devToolResult = null; devToolTime = 0"
                  />
                </div>

                <!-- DSL 编辑器（多行 textarea） -->
                <div class="dsm-devtools-editor-wrap">
                  <div class="dsm-devtools-editor-hint">
                    {{ devToolPlaceholder }}
                  </div>
                  <textarea
                    v-model="devToolDsl"
                    class="dsm-devtools-editor"
                    :placeholder="devToolPlaceholder"
                    spellcheck="false"
                    data-testid="es-devtools-dsl"
                    @keydown.tab.prevent="insertTab"
                  />
                </div>

                <!-- 快捷模板 -->
                <div class="dsm-devtools-templates">
                  <span class="dsm-devtools-templates-label">快捷模板：</span>
                  <ReButton
                    v-for="t in devToolTemplates"
                    :key="t.label"
                    size="small"
                    :tip="t.label"
                    layout="square"
                    @click="applyTemplate(t)"
                  >
                    {{ t.label }}
                  </ReButton>
                </div>

                <!-- 结果区 -->
                <div v-if="devToolResult || devToolError" class="dsm-devtools-result">
                  <div class="dsm-devtools-result-head">
                    <span>响应</span>
                    <span class="dsm-devtools-result-meta">
                      {{ devToolTime }} ms
                      <ReButton
                        v-if="devToolResult"
                        size="small"
                        icon="DocumentCopy"
                        tip="复制 JSON"
                        layout="square"
                        @click="copyText(JSON.stringify(devToolResult, null, 2), 'Dev Tools 响应')"
                      />
                      <ReButton
                        v-if="devToolResult"
                        size="small"
                        icon="FullScreen"
                        tip="全屏"
                        layout="square"
                        @click="devToolFullscreen = !devToolFullscreen"
                      />
                    </span>
                  </div>
                  <div v-if="devToolError" class="dsm-devtools-error">
                    {{ devToolError }}
                  </div>
                  <pre v-else class="dsm-devtools-json">{{ JSON.stringify(devToolResult, null, 2) }}</pre>
                </div>
              </div>
          <!-- ============ 别名管理 ============ -->
          <template #aliases>
            <div class="dsm-section">
              <div class="dsm-section-title">
                <span>别名管理（{{ aliases.length }}）</span>
                <div class="dsm-section-actions">
                  <ReButton
                    type="primary"
                    icon="Plus"
                    data-testid="es-alias-add"
                    :disabled="!source"
                    @click="openAddAlias"
                  >
                    添加别名
                  </ReButton>
                  <ReButton
                    layout="square"
                    icon="Refresh"
                    tip="刷新"
                    data-testid="es-alias-refresh"
                    :loading="aliasesLoading"
                    @click="loadAliases"
                  />
                </div>
              </div>

              <!-- 别名列表 -->
              <div v-if="aliasesLoading" class="dsm-loading-row">
                <ReLoading />
              </div>
              <ReTable
                v-else-if="aliases.length"
                :data="aliases"
                :columns="aliasColumns"
                :loading="aliasesLoading"
                stripe
                border
                height="460px"
              >
                <template #col-actions="{ row }">
                  <ReButton
                    layout="square"
                    icon="Delete"
                    type="danger"
                    data-testid="es-alias-del"
                    tip="删除别名"
                    @click="removeAlias(row)"
                  />
                </template>
              </ReTable>
              <ReEmpty v-else description="暂无别名，点「添加别名」创建一个" />
            </div>
          </template>
        </ReTab>
      </div>
    </div>

    <!-- ============ 集群信息 ============ -->
    <ReDialog v-model="clusterVisible" title="Elasticsearch 集群信息" width="1080px">
      <div v-loading="clusterLoading" class="dsm-cluster">
        <div class="dsm-cluster-stats">
          <div class="dsm-stat">
            <span class="dsm-stat-label">集群名</span>
            <span class="dsm-stat-value mono">{{ cluster?.clusterName || "—" }}</span>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">健康度</span>
            <ReTag :type="healthTag(cluster?.status)">{{ cluster?.status || "—" }}</ReTag>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">节点数</span>
            <span class="dsm-stat-value">{{ cluster?.numberOfNodes ?? "—" }}</span>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">数据节点</span>
            <span class="dsm-stat-value">{{ cluster?.numberOfDataNodes ?? "—" }}</span>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">活跃分片</span>
            <span class="dsm-stat-value">{{ cluster?.activeShards ?? "—" }}</span>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">未分配分片</span>
            <span class="dsm-stat-value">{{ cluster?.unassignedShards ?? "—" }}</span>
          </div>
          <div class="dsm-stat">
            <span class="dsm-stat-label">版本</span>
            <span class="dsm-stat-value mono">{{ cluster?.version || "—" }}</span>
          </div>
        </div>

        <div class="dsm-sub-title">节点</div>
        <ReTable
          :data="nodeRows"
          :columns="nodeColumns"
          :loading="clusterLoading"
          :pagination="false"
          stripe
          border
          height="220px"
        >
          <template #col-name="{ row }">
            <span class="dsm-node-name-cell">
              <span class="dsm-node-status-dot" :class="(row as EsNodeRow).statusTone" />
              <span class="dsm-node-name-text">{{ (row as EsNodeRow).name }}</span>
            </span>
          </template>
          <template #col-master="{ row }">
            <ReTag v-if="(row as EsClusterNode).master === '*'" type="warning">master</ReTag>
            <span v-else class="dsm-muted">—</span>
          </template>
          <template #col-cpu="{ row }">
            <div class="dsm-meter" title="CPU 使用率">
              <span class="dsm-meter__track">
                <span
                  class="dsm-meter__fill"
                  :class="`is-${(row as EsNodeRow).cpuTone}`"
                  :style="{ width: `${(row as EsNodeRow).cpuPct ?? 0}%` }"
                />
              </span>
              <span class="dsm-meter__text">
                {{ (row as EsNodeRow).cpuPct === null ? "—" : `${(row as EsNodeRow).cpuPct}%` }}
              </span>
            </div>
          </template>
        </ReTable>

        <div class="dsm-sub-title">分片分配</div>
        <ReTable
          :data="shards"
          :columns="shardColumns"
          :loading="clusterLoading"
          :pagination="false"
          stripe
          border
          height="220px"
        />

        <div class="dsm-sub-title">集群设置（有效值，可改）</div>
        <div class="dsm-setting-edit">
          <ReSelect
            v-model="settingKey"
            :data="settingKeyOptions"
            placeholder="选择设置项（可输入过滤）"
            class="dsm-setting-key"
            data-testid="es-setting-key"
          />
          <ReInput v-model="settingValue" placeholder="新值" class="dsm-setting-value" data-testid="es-setting-value" />
          <ReButton
            type="primary"
            :loading="settingSaving"
            data-testid="es-setting-save"
            @click="saveClusterSetting"
          >
            保存
          </ReButton>
        </div>
        <div v-if="settingKeyStaticReason" class="dsm-setting-block" data-testid="es-setting-static">
          {{ settingKeyStaticReason }}
        </div>
        <ReTable
          :data="filteredSettings"
          :columns="settingColumns"
          :pagination="false"
          stripe
          border
          height="240px"
        />
      </div>
    </ReDialog>

    <!-- ============ 字段抽屉 ============ -->
    <!--
      koi 主题的 ReDrawer 页脚是内置的「确定 / 取消」，不接 #footer 插槽（只有 default 主题接）。
      所以这里用 footer-hidden 关掉内置页脚，把「管理字段」入口放进抽屉体内：
      既避免出现语义不通的「确定 / 取消」，也与全页的方形按钮语言保持一致。
    -->
    <ReDrawer
      v-model="fieldDrawerVisible"
      :title="fieldDrawerTitle"
      size="680px"
      footer-hidden
      data-testid="es-field-drawer"
    >
      <div v-loading="fieldDrawerLoading" class="dsm-field-drawer">
        <div class="dsm-drawer-bar">
          <div v-if="fieldDetail" class="dsm-divider-row">
            <ReTag :type="healthTag(fieldDetail.health)">{{ fieldDetail.health || "—" }}</ReTag>
            <span class="dsm-muted">状态 {{ fieldDetail.status || "—" }}</span>
            <span class="dsm-muted">分片 {{ fieldDetail.shards ?? "—" }} / 副本 {{ fieldDetail.replicas ?? "—" }}</span>
            <span class="dsm-muted">文档 {{ fieldDetail.docs ?? "—" }}</span>
            <span class="dsm-muted">存储 {{ fieldDetail.storeSize || "—" }}</span>
          </div>
          <span v-else class="dsm-muted">加载中…</span>
          <ReButton
            layout="square"
            icon="Edit"
            tip="管理字段（增 / 删 / 改）"
            data-testid="es-drawer-fieldsmgr"
            :disabled="!fieldDetail"
            @click="openFieldManager(fieldDetail?.name)"
          />
        </div>
        <ReTable
          :data="fieldDetail?.fields || []"
          :columns="fieldColumns"
          :loading="fieldDrawerLoading"
          :pagination="false"
          stripe
          border
          height="440px"
        >
          <template #col-index="{ row }">
            <ReTag :type="(row as EsField).index === false ? 'info' : 'success'">
              {{ (row as EsField).index === false ? "否" : "是" }}
            </ReTag>
          </template>
        </ReTable>
      </div>
    </ReDrawer>

    <!-- ============ 新建索引（设计表）/ 字段管理（增 / 删 / 改） ============ -->
    <ReDialog v-model="indexDialogVisible" :title="indexDialogTitle" width="920px">
      <div v-loading="indexDialogLoading" class="dsm-index-form">
        <div class="dsm-form-row">
          <div class="dsm-form-item">
            <label>索引名</label>
            <ReInput
              v-model="indexForm.name"
              :disabled="indexDialogMode === 'fields'"
              placeholder="如 order_2026_10（小写、不含空格）"
              data-testid="es-form-name"
            />
          </div>
          <div class="dsm-form-item">
            <label>主分片</label>
            <ReInputNumber
              v-model="indexForm.shards"
              :min="1"
              :max="1024"
              :disabled="indexDialogMode === 'fields'"
              data-testid="es-form-shards"
            />
          </div>
          <div class="dsm-form-item">
            <label>副本数</label>
            <ReInputNumber
              v-model="indexForm.replicas"
              :min="0"
              :max="64"
              :disabled="indexDialogMode === 'fields'"
              data-testid="es-form-replicas"
            />
          </div>
        </div>

        <!-- 索引设置（只读展示，已加载自 fetchEsIndexDetail） -->
        <div v-if="indexDialogMode === 'fields' && indexSettingsEntries.length" class="dsm-settings-section">
          <div class="dsm-sub-title">索引设置</div>
          <div class="dsm-settings-grid">
            <div v-for="s in indexSettingsEntries" :key="s.key" class="dsm-settings-item">
              <span class="dsm-settings-key mono">{{ s.key }}</span>
              <span class="dsm-settings-val mono">{{ s.value }}</span>
            </div>
          </div>
        </div>

        <div class="dsm-field-head">
          <span class="dsm-sub-title">
            {{ indexDialogMode === "create" ? "字段设计" : "字段管理（增 / 删 / 改）" }}
          </span>
          <ReButton layout="square" icon="Plus" tip="添加字段" data-testid="es-field-add" @click="addFieldRow" />
        </div>

        <div class="dsm-field-grid">
          <div class="dsm-field-grid-head">
            <span>字段名</span>
            <span>类型</span>
            <span>分词器（text）</span>
            <span>建索引</span>
            <span>操作</span>
          </div>
          <div v-for="(field, idx) in indexForm.fields" :key="idx" class="dsm-field-grid-row" :class="{ 'dsm-field-added': isAdded(field.name), 'dsm-field-removed': isRemoved(field.name), 'dsm-field-modified': isModified(field.name) }">
            <div class="dsm-field-name">
              <ReInput v-model="field.name" placeholder="字段名，支持 a.b" :data-testid="`es-field-name-${idx}`" />
            </div>
            <ReSelect v-model="field.type" :data="fieldTypeOptions" :data-testid="`es-field-type-${idx}`" />
            <ReInput
              v-model="field.analyzer"
              :disabled="field.type !== 'text'"
              placeholder="standard"
              :data-testid="`es-field-analyzer-${idx}`"
            />
            <ReSwitch v-model="field.index" :aria-label="field.index === false ? '不建索引' : '建索引'" />
            <ReButton
              layout="square"
              size="small"
              type="danger"
              icon="Delete"
              tip="删除该字段"
              :data-testid="`es-field-remove-${idx}`"
              @click="removeFieldRow(idx)"
            />
          </div>
          <div v-if="indexForm.fields.length === 0" class="dsm-field-empty">暂无字段，点右上角「+」添加</div>
        </div>
        <div class="dsm-form-hint">
          <template v-if="indexDialogMode === 'create'">
            索引名创建后不可改，主分片数创建后不可调整。
          </template>
          <template v-else>
            ES 不能原地删除字段、也不能改已存在字段的类型：<b>只新增</b>走轻量 mapping；
            <b>删除或改动已有字段</b>会触发重建索引（建新索引 → 搬运数据 → 换回同名索引），
            期间原索引短暂不可用，耗时与数据量成正比。
          </template>
        </div>
      </div>
      <template #footer>
        <ReButton @click="indexDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="indexSaving" data-testid="es-form-save" @click="saveIndex">
          {{ indexDialogMode === "create" ? "创建" : "保存并生效" }}
        </ReButton>
      </template>
    </ReDialog>

    <!-- 添加别名弹框 -->
    <ReDialog
      v-model="aliasDialogVisible"
      title="添加别名"
      width="460px"
    >
      <AliasFormDialog
        v-if="aliasDialogVisible"
        :index-options="indices.map(i => ({ label: i.name, value: i.name }))"
        @submit="onAliasDialogSubmit"
        @cancel="aliasDialogVisible = false"
      />
    </ReDialog>

    <!-- 节点详情弹框 -->
    <ReDialog
      v-model="nodeDetailVisible"
      :title="`节点详情 - ${nodeDetailNode?.name || ''}`"
      width="560px"
    >
      <div v-if="nodeDetailNode" class="dsm-node-detail">
        <div class="dsm-node-detail-grid">
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">节点名</span><span class="dsm-node-detail-value mono">{{ nodeDetailNode.name }}</span></div>
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">地址</span><span class="dsm-node-detail-value mono">{{ nodeDetailNode.ip }}</span></div>
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">角色</span><span class="dsm-node-detail-value">{{ nodeDetailNode.roles }}</span></div>
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">Master</span><span class="dsm-node-detail-value"><ReTag v-if="nodeDetailNode.master === '*'" type="warning">master</ReTag><span v-else>—</span></span></div>
          <div class="dsm-node-detail-item">
            <span class="dsm-node-detail-label">堆内存</span>
            <div class="dsm-node-detail-value">
              <div class="dsm-meter" style="max-width: 200px">
                <span class="dsm-meter__track">
                  <span
                    class="dsm-meter__fill"
                    :class="nodeDetailHeapTone"
                    :style="{ width: `${Number(nodeDetailNode.heapPercent) || 0}%` }"
                  />
                </span>
                <span class="dsm-meter__text">{{ nodeDetailNode.heapPercent }}%</span>
              </div>
            </div>
          </div>
          <div class="dsm-node-detail-item">
            <span class="dsm-node-detail-label">CPU</span>
            <div class="dsm-node-detail-value">
              <div class="dsm-meter" style="max-width: 200px">
                <span class="dsm-meter__track">
                  <span
                    class="dsm-meter__fill"
                    :class="`is-${nodeDetailCpuTone}`"
                    :style="{ width: `${Number(nodeDetailNode.cpu) || 0}%` }"
                  />
                </span>
                <span class="dsm-meter__text">{{ nodeDetailNode.cpu || "—" }}%</span>
              </div>
            </div>
          </div>
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">负载</span><span class="dsm-node-detail-value mono">{{ nodeDetailNode.load || "—" }}</span></div>
          <div class="dsm-node-detail-item"><span class="dsm-node-detail-label">版本</span><span class="dsm-node-detail-value mono">{{ nodeDetailNode.version || "—" }}</span></div>
        </div>
      </div>
    </ReDialog>

    <!-- 分片热力图弹框 -->
    <ReDialog
      v-model="shardHeatmapVisible"
      title="分片分配热力图"
      width="900px"
    >
      <div v-if="shardHeatmapLoading" class="dsm-loading-row">
        <ReLoading />
      </div>
      <div v-else-if="Object.keys(shardHeatmapData).length > 0" class="dsm-shard-heatmap">
        <div class="dsm-heatmap-header">
          <span class="dsm-heatmap-label" />
          <span v-for="node in shardHeatmapNodes" :key="node" class="dsm-heatmap-node-label">{{ node }}</span>
        </div>
        <div v-for="idx in shardHeatmapIndices" :key="idx" class="dsm-heatmap-row">
          <span class="dsm-heatmap-index-label mono" :title="idx">{{ idx.length > 16 ? idx.slice(0, 16) + '…' : idx }}</span>
          <span
            v-for="node in shardHeatmapNodes"
            :key="node"
            class="dsm-heatmap-cell"
            :class="getShardCellClass(idx, node)"
            :title="getShardCellTitle(idx, node)"
          >
            {{ getShardCellText(idx, node) }}
          </span>
        </div>
      </div>
      <ReEmpty v-else description="暂无分片数据，请先加载" />
    </ReDialog>

    <!-- 导出索引结构弹框 -->
    <ReDialog
      v-model="exportDialogVisible"
      :title="`导出索引结构 - ${exportIndexName}`"
      width="700px"
    >
      <div class="dsm-export-area">
        <div class="dsm-export-toolbar">
          <ReSelect
            v-model="exportFormat"
            :data="[{ label: 'Mapping JSON', value: 'mapping' }, { label: 'cURL 命令', value: 'curl' }]"
            placeholder="导出格式"
            class="dsm-export-format"
          />
          <ReButton
            layout="square"
            icon="CopyDocument"
            tip="复制"
            data-testid="es-export-copy"
            @click="copyExportContent"
          />
          <ReButton
            layout="square"
            icon="Download"
            tip="下载文件"
            data-testid="es-export-download"
            @click="downloadExport"
          />
        </div>
        <pre class="dsm-export-content">{{ exportContent }}</pre>
      </div>
    </ReDialog>

    <!-- 文档详情弹框 -->
    <ReDialog
      v-model="docDetailVisible"
      :title="`文档详情 - ${docDetailIndex}`"
      width="680px"
    >
      <div v-if="docDetailLoading" class="dsm-loading-row">
        <ReLoading />
      </div>
      <div v-else-if="docDetailData" class="dsm-doc-detail">
        <div v-for="(value, key) in docDetailData" :key="String(key)" class="dsm-doc-row">
          <span class="dsm-doc-key mono">{{ key }}</span>
          <span class="dsm-doc-val mono">{{ formatDocValue(value) }}</span>
        </div>
      </div>
      <div v-else class="dsm-doc-empty">
        <ReEmpty description="未找到文档或文档已被删除" />
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Elasticsearch 管理页
 *
 * <p>只消费两条契约：通用中间件 SPI（能力声明 / 连接测试 / 只读检索）与 ES 专属管理面
 * {@code /ms/monitor/elasticsearch/**}（索引设计表 / 集群配置 / 关系图）。能力包未安装时后端返回
 * 「功能未开放」，页面原样展示原因，不回落任何演示数据。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { ElMessageBox } from "element-plus";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";

import ReDialog from "@repo/ui/re-dialog";
import ReDrawer from "@repo/ui/re-drawer";
import ReEmpty from "@repo/ui/re-empty";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReSwitch from "@repo/ui/re-switch";
import ReTable from "@repo/ui/re-table";
import ReTab from "@repo/ui/re-tab";
import ReTag from "@repo/ui/re-tag";
import RePagination from "@repo/ui/re-pagination";
import ReRelationGraph from "@repo/ui/re-relation-graph";
// 信息提示条（查询检索的用法说明）走 re-kit 聚合入口
import { ReAlert } from "@repo/ui/re-kit";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import AliasFormDialog from "../../components/console/AliasFormDialog.vue";
import EsQueryEditor from "../../components/console/EsQueryEditor.vue";
import EsClusterChart from "../../components/console/charts/EsClusterChart.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  addEsAlias,
  addEsMapping,
  createEsIndex,
  deleteEsAlias,
  deleteEsIndex,
  fetchEsAliases,
  fetchEsCapability,
  fetchEsCluster,
  fetchEsIndexDetail,
  fetchEsIndices,
  fetchEsRawQuery,
  fetchEsShards,
  queryEs,
  rebuildEsIndex,
  testEsConnection,
  updateEsClusterSettings,
  updateEsIndexSettings,
  type EsAliasRow,
  type EsCapability,
  type EsCluster,
  type EsClusterNode,
  type EsField,
  type EsIndexDetail,
  type EsIndexRow,
  type EsQueryResult,
  type EsShard,
} from "../../api/esManageApi";

defineOptions({ name: "ElasticsearchManageView" });

const { datasourceId, source, gap, bind, ready } = useMiddlewareSource();

/** 标签页：索引概览 / 节点列表 / 集群纳管 / 关系图谱 / 查询检索 / Dev Tools / 别名管理 */
const tabs = [
  { name: "overview", label: "索引概览", icon: "Collection" },
  { name: "nodes", label: "节点列表", icon: "Monitor" },
  { name: "clusterCfg", label: "集群纳管", icon: "Connection" },
  { name: "graph", label: "关系图谱", icon: "Share" },
  { name: "query", label: "查询检索", icon: "Search" },
  { name: "devtools", label: "Dev Tools", icon: "Cpu" },
  { name: "aliases", label: "别名管理", icon: "Link" },
];

const activeTab = ref<string>("overview");
const capability = ref<EsCapability | null>(null);
const capabilityLoading = ref(false);
const testing = ref(false);
const loading = ref(false);
const testResult = ref<{ version: string; detail: string }>({ version: "", detail: "" });

// ---- 索引概览 ----
const indices = ref<EsIndexRow[]>([]);
const indexFilter = ref("");
/** 只显示异常索引（health !== green） */
const unhealthyOnly = ref(false);
/** 悬浮索引行时显示的信息卡 */
const hoveredIndex = ref<EsIndexRow | null>(null);
/** 悬浮卡位置（跟随鼠标） */
const hoverCardStyle = ref<Record<string, string>>({});
/** 索引多选集合（存索引名） */
const indexSelection = ref<Set<string>>(new Set());
/** 索引分页状态 */
const indexPage = ref(1);
const indexPageSize = ref(20);
/** 是否全选（所有索引都被选中的计算属性） */
const allSelected = computed(
  () => indices.value.length > 0 && indices.value.every(r => indexSelection.value.has(r.name)),
);

/** 字段 diff 状态映射 */
type FieldDiffStatus = "added" | "removed" | "modified" | "unchanged";

/** 字段 diff 映射表（只在字段管理模式下有效） */
const fieldDiffMap = computed(() => {
  const map = new Map<string, FieldDiffStatus>();
  if (indexDialogMode.value !== "fields") return map;
  const origByName = new Map(originalFields.value.map(f => [f.name, f]));
  const curByName = new Map(indexForm.fields.map(f => [f.name, f]));
  // 标记新增
  indexForm.fields.forEach(f => {
    if (!origByName.has(f.name)) map.set(f.name, "added");
  });
  // 标记删除和修改
  originalFields.value.forEach(orig => {
    const cur = curByName.get(orig.name);
    if (!cur) {
      map.set(orig.name, "removed");
    } else {
      const changed =
        (orig.type || "") !== (cur.type || "") ||
        (orig.analyzer || "") !== (cur.analyzer || "") ||
        (orig.format || "") !== (cur.format || "") ||
        (orig.index !== false) !== (cur.index !== false);
      if (changed) map.set(orig.name, "modified");
      else map.set(orig.name, "unchanged");
    }
  });
  return map;
});

/** 判断字段是否为新增 */
function isAdded(name: string): boolean {
  return fieldDiffMap.value.get(name) === "added";
}

/** 判断字段是否为删除 */
function isRemoved(name: string): boolean {
  return fieldDiffMap.value.get(name) === "removed";
}

/** 判断字段是否被修改 */
function isModified(name: string): boolean {
  return fieldDiffMap.value.get(name) === "modified";
}

/** 悬浮索引行时显示快速信息卡 */
function onIndexRowHover(row: EsIndexRow | null, event?: MouseEvent) {
  hoveredIndex.value = row;
  if (row && event) {
    const x = event.clientX + 16;
    const y = event.clientY + 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    hoverCardStyle.value = {
      left: `${Math.min(x, vw - 240)}px`,
      top: `${Math.min(y, vh - 160)}px`,
    };
  }
}

/** 健康度对应圆点样式类 */
function healthDotClass(health: string | null | undefined): string {
  if (health === "green") return "green";
  if (health === "yellow") return "yellow";
  if (health === "red") return "red";
  return "grey";
}

/** 切换单个索引选中状态 */
function toggleIndexSelect(name: string) {
  if (indexSelection.value.has(name)) {
    indexSelection.value.delete(name);
  } else {
    indexSelection.value.add(name);
  }
  // 触发响应式更新
  indexSelection.value = new Set(indexSelection.value);
}

/** 全选 / 取消全选所有索引 */
function selectAllIndices() {
  if (allSelected.value) {
    indexSelection.value = new Set();
  } else {
    indexSelection.value = new Set(indices.value.map(i => i.name));
  }
}

/** 批量删除选中的索引 */
async function batchDeleteIndices() {
  const names = Array.from(indexSelection.value);
  if (names.length === 0) return;
  try {
    await ElMessageBox.confirm(
      `确认批量删除 ${names.length} 个索引？\n${names.join("\n")}\n\n该操作不可恢复！`,
      "批量删除索引",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  let success = 0;
  let failed = 0;
  for (const name of names) {
    try {
      await deleteEsIndex(name, datasourceId.value);
      success++;
    } catch {
      failed++;
    }
  }
  indexSelection.value = new Set();
  await loadIndices();
  if (failed === 0) message.success(`已删除 ${success} 个索引`);
  else message.warning(`删除完成：成功 ${success} 个，失败 ${failed} 个`);
}

/** 批量修改选中索引的副本数 */
async function batchUpdateReplicas() {
  const names = Array.from(indexSelection.value);
  if (names.length === 0) return;
  try {
    const { value: countStr } = await ElMessageBox.prompt(
      `输入新副本数（0-64）：\n\n将修改 ${names.length} 个索引：\n${names.join("\n")}`,
      "批量修改副本数",
      {
        confirmButtonText: "确认",
        cancelButtonText: "取消",
        inputPlaceholder: "输入副本数，如 1",
      },
    );
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count < 0 || count > 64) {
      message.warning("副本数必须在 0-64 之间");
      return;
    }
    let success = 0;
    let failed = 0;
    for (const name of names) {
      try {
        await updateEsIndexSettings(name, count, datasourceId.value);
        success++;
      } catch {
        failed++;
      }
    }
    indexSelection.value = new Set();
    await loadIndices();
    if (failed === 0) message.success(`副本数已更新为 ${count}`);
    else message.warning(`更新完成：成功 ${success} 个，失败 ${failed} 个`);
  } catch {
    // 用户取消
  }
}

// ---- 节点列表 ----
const cluster = ref<EsCluster | null>(null);
const nodesLoading = ref(false);
/** 节点分页状态 */
const nodePage = ref(1);
const nodePageSize = ref(20);
/** 集群监控图组件 ref */
const clusterChartRef = ref<InstanceType<typeof EsClusterChart> | null>(null);
/** 图表快照计数（响应式更新） */
const clusterChartSnapshots = ref(0);

/** 节点详情弹框 */
const nodeDetailVisible = ref(false);
const nodeDetailNode = ref<EsClusterNode | null>(null);
const nodeDetailCpuTone = computed(() => cpuTone(nodeDetailNode.value?.cpu ?? null));
const nodeDetailHeapTone = computed(() => {
  const heap = Number(nodeDetailNode.value?.heapPercent ?? "0");
  if (heap >= 85) return "is-danger";
  if (heap >= 70) return "is-warn";
  return "";
});
function openNodeDetail(node: EsClusterNode) {
  nodeDetailNode.value = node;
  nodeDetailVisible.value = true;
}

/** 分片热力图 */
const shardHeatmapVisible = ref(false);
const shardHeatmapLoading = ref(false);
type ShardHeatmapCell = { count: number; primary: number; replica: number; state: string };
const shardHeatmapData = ref<Record<string, Record<string, ShardHeatmapCell>>>({});
const shardHeatmapNodes = ref<string[]>([]);
const shardHeatmapIndices = ref<string[]>([]);
async function openShardHeatmap() {
  shardHeatmapVisible.value = true;
  if (Object.keys(shardHeatmapData.value).length > 0) return; // 已有数据
  shardHeatmapLoading.value = true;
  try {
    const data = await fetchEsShards(datasourceId.value);
    const idxMap: Record<string, Record<string, ShardHeatmapCell>> = {};
    const nodeSet = new Set<string>();
    for (const s of data) {
      const nodeKey = s.node || "(未分配)";
      nodeSet.add(nodeKey);
      if (!idxMap[s.index]) idxMap[s.index] = {};
      if (!idxMap[s.index][nodeKey]) idxMap[s.index][nodeKey] = { count: 0, primary: 0, replica: 0, state: "" };
      const cell = idxMap[s.index][nodeKey];
      cell.count++;
      if (s.prirep === "p") cell.primary++;
      else if (s.prirep === "r") cell.replica++;
      if (!cell.state || cell.state === "STARTED") cell.state = s.state;
    }
    shardHeatmapData.value = idxMap;
    shardHeatmapNodes.value = [...nodeSet].sort();
    shardHeatmapIndices.value = Object.keys(idxMap).sort();
  } catch (e) {
    showError(e, "加载分片");
  } finally {
    shardHeatmapLoading.value = false;
  }
}
function getShardCellClass(idx: string, node: string): string {
  const cell = shardHeatmapData.value[idx]?.[node];
  if (!cell) return "dsm-heatmap-cell--empty";
  if (cell.state === "UNASSIGNED") return "dsm-heatmap-cell--danger";
  if (cell.primary > 0) return "dsm-heatmap-cell--primary";
  return "dsm-heatmap-cell--replica";
}
function getShardCellText(idx: string, node: string): string {
  const cell = shardHeatmapData.value[idx]?.[node];
  return cell ? String(cell.count) : "";
}
function getShardCellTitle(idx: string, node: string): string {
  const cell = shardHeatmapData.value[idx]?.[node];
  if (!cell) return `${idx} 在 ${node} 上无分片`;
  return `${idx} @ ${node}：${cell.count} 个（主 ${cell.primary} / 副 ${cell.replica}，状态 ${cell.state}）`;
}

/** 导出索引结构 */
const exportDialogVisible = ref(false);
const exportIndexName = ref("");
const exportFormat = ref<"mapping" | "curl">("mapping");
const exportContent = computed(() => {
  const idx = indices.value.find(i => i.name === exportIndexName.value);
  if (!idx) return "";
  if (exportFormat.value === "curl") {
    return `curl -X PUT "${source.value?.host || "http://localhost:9200"}/${exportIndexName.value}" -H "Content-Type: application/json" -d @mapping.json`;
  }
  // mapping JSON：构造一个最小可用的 mapping
  return JSON.stringify({ mappings: { properties: {} } }, null, 2);
});
async function openExportDialog(indexName: string) {
  exportIndexName.value = indexName;
  exportFormat.value = "mapping";
  exportDialogVisible.value = true;
  // 拉取实际 mapping
  try {
    const detail = await fetchEsIndexDetail(indexName, datasourceId.value);
    const mappingJson = JSON.stringify({ settings: detail.settings, mappings: { properties: detail.fields.reduce((m: Record<string, unknown>, f) => { m[f.name] = { type: f.type || "keyword" }; return m; }, {}) } }, null, 2);
    // 替换 computed 里的值——通过一个临时 ref
    exportRawContent.value = mappingJson;
  } catch {
    exportRawContent.value = JSON.stringify({ mappings: { properties: {} } }, null, 2);
  }
}
const exportRawContent = ref("{}");
const exportContentFinal = computed(() => {
  if (exportFormat.value === "mapping") return exportRawContent.value;
  return `curl -X PUT "${source.value?.host || "http://localhost:9200"}/${exportIndexName.value}" -H "Content-Type: application/json" -d '${exportRawContent.value}'`;
});
function copyExportContent() {
  copyText(exportContentFinal.value, exportFormat.value === "mapping" ? "Mapping JSON" : "cURL");
  message.success("已复制到剪贴板");
}
function downloadExport() {
  const ext = exportFormat.value === "mapping" ? "json" : "sh";
  const blob = new Blob([exportContentFinal.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${exportIndexName.value}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 分页后的节点列表 */
const paginatedNodes = computed(() => {
  const start = (nodePage.value - 1) * nodePageSize.value;
  return nodeRows.value.slice(start, start + nodePageSize.value);
});

// ---- 关系图谱（集群 → 节点拓扑，zk 式）----
const graphLoading = ref(false);

// ---- 集群纳管（生成各节点 elasticsearch.yml；不远程改配置）----
type ClusterNodeForm = {
  name: string;
  host: string;
  httpPort: number;
  transportPort: number;
  roles: string[];
};

const clusterForm = reactive<{ clusterName: string; bootstrap: boolean; nodes: ClusterNodeForm[] }>({
  clusterName: "",
  bootstrap: true,
  nodes: [],
});

const clusterSnippets = ref<{ title: string; yaml: string }[]>([]);

/** 节点角色可选项（ES node.roles 的常用取值） */
const ROLE_OPTIONS = [
  { label: "master（候选主节点）", value: "master" },
  { label: "data（数据节点）", value: "data" },
  { label: "ingest（预处理）", value: "ingest" },
  { label: "ml（机器学习）", value: "ml" },
  { label: "remote_cluster_client（跨集群检索）", value: "remote_cluster_client" },
];

/**
 * 静态设置的 key：ES 的 {@code _cluster/settings} <b>只接受动态设置</b>，
 * 这些写进去会被 ES 以 {@code unknown setting} / {@code not dynamic} 拒掉，
 * 必须在各节点的 elasticsearch.yml 里改并重启。
 */
const STATIC_SETTING_KEYS = ["cluster.name", "cluster.initial_master_nodes"];

/** 静态设置的前缀（node.* 角色/属性、discovery.*、路径、网络、端口等都是节点级静态项） */
const STATIC_SETTING_PREFIXES = [
  "node.",
  "discovery.",
  "path.",
  "bootstrap.",
  "plugin.",
  "network.",
  "http.",
  "transport.",
  "thread_pool.",
  // 常见未列前缀（补全防止误 PUT 导致 ES 拒绝）
  "action.",
  "indices.",
  "search.",
  "repositories.",
  "xpack.",
  "logger.",
];

/**
 * 判断某个集群设置是不是静态设置（不可通过 REST 动态改）。
 *
 * @param key 设置项 key
 * @returns 命中时返回给用户看的原因，否则空串
 */
function staticSettingReason(key: string): string {
  const k = (key || "").trim();
  if (!k) return "";
  const hit = STATIC_SETTING_KEYS.includes(k) || STATIC_SETTING_PREFIXES.some(p => k.startsWith(p));
  if (!hit) return "";
  return `「${k}」是静态设置：_cluster/settings 只接受动态设置（ES 会报 not dynamic / unknown setting），只能写进各节点的 elasticsearch.yml 并重启。要生成配置请切到「集群纳管」页签。`;
}

/** 当前所选设置项若是静态设置，给出拦截原因（模板里就地提示） */
const settingKeyStaticReason = computed(() => staticSettingReason(settingKey.value));

function addClusterNode() {
  clusterForm.nodes.push({
    name: `node-${clusterForm.nodes.length + 1}`,
    host: "",
    httpPort: 9200,
    transportPort: 9300,
    roles: ["master", "data"],
  });
}

function removeClusterNode(idx: number) {
  clusterForm.nodes.splice(idx, 1);
}

/**
 * 按当前表单生成「每个节点一份」的 elasticsearch.yml 片段。
 *
 * <p>各节点只有 node.name / node.roles / 端口不同，cluster.name 与 discovery 种子列表必须一致；
 * 首次引导才需要 cluster.initial_master_nodes，故做成可关的开关并在注释里写明何时该删。</p>
 */
function buildClusterSnippets() {
  const clusterName = clusterForm.clusterName.trim();
  if (!clusterName) {
    message.warning("请先填写集群名 cluster.name");
    return;
  }
  const nodes = clusterForm.nodes;
  if (nodes.length === 0) {
    message.warning("至少添加一个节点");
    return;
  }
  if (nodes.some(n => !n.name.trim() || !n.host.trim())) {
    message.warning("每个节点都要填「节点名」和「主机」");
    return;
  }
  const names = nodes.map(n => n.name.trim());
  if (new Set(names).size !== names.length) {
    message.warning("节点名不能重复（node.name 必须唯一）");
    return;
  }
  const seeds = nodes.map(n => `${n.host.trim()}:${n.transportPort || 9300}`);
  const masters = nodes.filter(n => n.roles.includes("master")).map(n => n.name.trim());
  clusterSnippets.value = nodes.map(n => {
    const lines = [
      `# ===== ${n.name.trim()}（${n.host.trim()}）—— 把该机器的 elasticsearch.yml 改成下面内容后重启 =====`,
      `cluster.name: ${clusterName}`,
      `node.name: ${n.name.trim()}`,
      `node.roles: [ ${n.roles.length > 0 ? n.roles.join(", ") : "data"} ]`,
      "network.host: 0.0.0.0",
      `http.port: ${n.httpPort || 9200}`,
      `transport.port: ${n.transportPort || 9300}`,
      `discovery.seed_hosts: [${seeds.map(s => `"${s}"`).join(", ")}]`,
    ];
    if (clusterForm.bootstrap) {
      lines.push(
        "# 仅首次启动、且该节点数据目录为空时才保留下面这行；集群形成后必须删掉再重启：",
        `cluster.initial_master_nodes: [${masters.map(m => `"${m}"`).join(", ")}]`,
      );
    }
    lines.push(
      "# ES 8 默认开启安全：所有节点要共用同一份证书与口令（xpack.security.*），否则无法组成同一集群",
    );
    return { title: `${n.name.trim()}（${n.host.trim()}）`, yaml: lines.join("\n") };
  });
  message.success(`已生成 ${clusterSnippets.value.length} 个节点的配置片段`);
}

/**
 * 复制文本：优先 Clipboard API，失败（无权限 / 非安全上下文）回落 textarea + execCommand。
 *
 * @param text  要复制的内容
 * @param label 成功提示里显示的来源名
 */
async function copyText(text: string, label: string) {
  let ok = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      ok = true;
    }
  } catch {
    ok = false;
  }
  if (!ok) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand("copy");
      document.body.removeChild(ta);
    } catch {
      ok = false;
    }
  }
  if (ok) message.success(`${label} 已复制`);
  else message.warning("浏览器拒绝访问剪贴板，请手动全选复制");
}

async function copyAllClusterSnippets() {
  if (clusterSnippets.value.length === 0) return;
  await copyText(
    clusterSnippets.value.map(s => s.yaml).join("\n\n"),
    `全部 ${clusterSnippets.value.length} 个节点`,
  );
}

/** 用当前连接的集群名回填（省得手抄），没读到就提示手填 */
async function prefillClusterForm() {
  if (!cluster.value) await loadNodesTab();
  const name = cluster.value?.clusterName || "";
  if (name) {
    clusterForm.clusterName = name;
    message.success(`已回填集群名 ${name}`);
  } else {
    message.warning("没读到集群名，请手动填写");
  }
  if (clusterForm.nodes.length === 0) addClusterNode();
}

// ---- 查询检索 ----
const queryMode = ref<"simple" | "dsl">("simple");
const queryIndex = ref("");
const queryKeyword = ref("");
const queryDslText = ref("");
const queryLoading = ref(false);
const queryResult = ref<EsQueryResult | null>(null);
const showQueryHistory = ref(false);

/** 查询历史（localStorage 持久化，最多 20 条） */
const HISTORY_KEY = "es-query-history";
type QueryHistoryItem = { text: string; mode: string; time: number; index?: string };
function loadHistory(): QueryHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveHistory(list: QueryHistoryItem[]) {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, 20))); } catch {}
}
const queryHistory = ref<QueryHistoryItem[]>(loadHistory());

function clearQueryHistory() {
  queryHistory.value = [];
  saveHistory([]);
  showQueryHistory.value = false;
  message.success("历史记录已清空");
}

function restoreFromHistory(item: QueryHistoryItem) {
  if (item.mode === "dsl") {
    queryMode.value = "dsl";
    queryDslText.value = item.text;
  } else {
    queryMode.value = "simple";
    queryKeyword.value = item.text;
    queryIndex.value = item.index || "";
  }
  showQueryHistory.value = false;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

const queryDslPlaceholder = computed(() =>
  "输入 ES Query DSL，例如：\n{\"query\":{\"match\":{\"_all\":\"关键字\"}},\"from\":0,\"size\":20}",
);

function pushHistory(text: string, mode: string, index?: string) {
  if (!text.trim()) return;
  const list = queryHistory.value.filter(h => h.text !== text);
  list.unshift({ text, mode, time: Date.now(), index });
  queryHistory.value = list.slice(0, 20);
  saveHistory(queryHistory.value);
}

// ---- Dev Tools（类 Kibana Console） ----
/** DevTools 命令类型 */
type DevToolCmd = "GET" | "POST" | "PUT" | "DELETE";

interface DevToolHistory {
  cmd: DevToolCmd;
  index: string;
  dsl: string;
}

const devToolCmd = ref<DevToolCmd>("GET");
const devToolIndex = ref("");
const devToolDsl = ref("");
const devToolResult = ref<unknown>(null);
const devToolError = ref("");
const devToolLoading = ref(false);
const devToolTime = ref(0);
const devToolHistory = ref<DevToolHistory[]>([]);
const devToolFullscreen = ref(false);

const devToolCmdOptions = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
] as const;

const devToolPlaceholder = computed(() => {
  const cmd = devToolCmd.value;
  const idx = devToolIndex.value || "<index>";
  const examples: Record<DevToolCmd, string> = {
    GET: `GET ${idx}/_search\n{\n  "query": { "match_all": {} }\n}`,
    POST: `POST ${idx}/_doc\n{\n  "field": "value"\n}`,
    PUT: `PUT ${idx}/_settings\n{\n  "index": { "number_of_replicas": 1 }\n}`,
    DELETE: `DELETE ${idx}/_doc/<_id>`,
  };
  return examples[cmd];
});

/** 快捷模板 */
const devToolTemplates = [
  { label: "match_all", cmd: "GET", dsl: '{\n  "query": { "match_all": {} }\n}' },
  { label: "term 查询", cmd: "GET", dsl: '{\n  "query": { "term": { "<field>": "<value>" } }\n}' },
  { label: "multi_match", cmd: "GET", dsl: '{\n  "query": { "multi_match": { "query": "", "fields": [] } }\n}' },
  { label: "bool-must", cmd: "GET", dsl: '{\n  "query": { "bool": { "must": [] } }\n}' },
  { label: "aggs-sum", cmd: "GET", dsl: '{\n  "aggs": { "my_sum": { "sum": { "field": "<field>" } } }\n}' },
  { label: "aggs-date_histogram", cmd: "GET", dsl: '{\n  "aggs": { "over_time": { "date_histogram": { "field": "@timestamp", "calendar_interval": "day" } } }\n}' },
  { label: "scroll", cmd: "GET", dsl: '{\n  "query": { "match_all": {} },\n  "sort": ["_doc"]\n}' },
  { label: "bulk", cmd: "POST", dsl: '{ "index": { "_index": "", "_id": "" } }\n{ "field": "value" }' },
];

async function runDevTool() {
  const dsl = devToolDsl.value.trim();
  if (!dsl) {
    message.warning("请输入 DSL 语句");
    return;
  }
  const cmd = devToolCmd.value;
  const idx = devToolIndex.value;
  devToolLoading.value = true;
  devToolResult.value = null;
  devToolError.value = "";
  const t0 = Date.now();
  try {
    const res = await fetchEsRawQuery(cmd, idx || "_search", dsl, datasourceId.value ?? 0);
    // 优先按 JSON 解析，失败（纯文本错误 / 非 JSON 响应）直接显示原始正文
    try {
      devToolResult.value = JSON.parse(res);
    } catch {
      devToolResult.value = res;
    }
    devToolTime.value = Date.now() - t0;
    // 记录历史（最多 50 条，去重）
    const entry: DevToolHistory = { cmd, index: idx, dsl };
    const prev = devToolHistory.value.findIndex(h => h.dsl === dsl);
    if (prev >= 0) devToolHistory.value.splice(prev, 1);
    devToolHistory.value.unshift(entry);
    if (devToolHistory.value.length > 50) devToolHistory.value.pop();
  } catch (e: unknown) {
    devToolError.value = e instanceof Error ? e.message : String(e);
    devToolTime.value = Date.now() - t0;
  } finally {
    devToolLoading.value = false;
  }
}

function applyDevToolHistory(h: DevToolHistory) {
  devToolCmd.value = h.cmd;
  devToolIndex.value = h.index;
  devToolDsl.value = h.dsl;
}

function applyTemplate(t: (typeof devToolTemplates)[number]) {
  devToolCmd.value = t.cmd as DevToolCmd;
  devToolDsl.value = t.dsl;
}

function insertTab(e: KeyboardEvent) {
  const el = e.target as HTMLTextAreaElement;
  const s = el.selectionStart;
  const e2 = el.selectionEnd;
  devToolDsl.value = devToolDsl.value.slice(0, s) + "  " + devToolDsl.value.slice(e2);
  nextTick(() => {
    el.selectionStart = el.selectionEnd = s + 2;
  });
}

// ---- 集群信息 ----
const clusterVisible = ref(false);
const clusterLoading = ref(false);
const shards = ref<EsShard[]>([]);
const settingKey = ref("");
const settingValue = ref("");
const settingSaving = ref(false);

// ---- 字段抽屉 ----
const fieldDrawerVisible = ref(false);
const fieldDrawerLoading = ref(false);
const fieldDetail = ref<EsIndexDetail | null>(null);

// ---- 建索引 / 字段管理（增 / 删 / 改）----
const indexDialogVisible = ref(false);
const indexDialogMode = ref<"create" | "fields">("create");
const indexSaving = ref(false);
/** 字段管理模式下，进入弹窗时从 mapping 快照下来的原始字段；保存时据此 diff 判定走哪条路 */
const originalFields = ref<EsField[]>([]);
/** 字段管理模式打开时的加载态（要先拉一次现有字段） */
const indexDialogLoading = ref(false);

/** 索引详情中的 settings（打开索引对话框时从 fetchEsIndexDetail 拿到） */
const indexSettings = ref<Record<string, unknown>>({});
const indexForm = reactive<{ name: string; shards: number; replicas: number; fields: EsField[] }>({
  name: "",
  shards: 1,
  replicas: 0,
  fields: [],
});

const FIELD_TYPES = [
  "keyword",
  "text",
  "long",
  "integer",
  "short",
  "byte",
  "double",
  "float",
  "date",
  "boolean",
  "object",
  "nested",
  "ip",
  "geo_point",
];
const fieldTypeOptions = FIELD_TYPES.map(t => ({ label: t, value: t }));

const capabilityText = computed(() => {
  const c = capability.value;
  if (!c) return "未加载";
  const parts: string[] = [];
  if (c.topNodeSupported) parts.push("索引浏览");
  if (c.childNodeSupported) parts.push("字段浏览");
  if (c.querySupported) parts.push("只读检索");
  if (c.documentSupported) parts.push("文档详情");
  return parts.join(" / ") || "未声明";
});

const indexColumns = [
  { prop: "_sel", label: "", width: 40, slot: "col-sel" },
  { prop: "name", label: "索引名", minWidth: 220, slot: "col-name" },
  { prop: "health", label: "健康度", width: 120, slot: "col-health" },
  { prop: "status", label: "状态", width: 100 },
  { prop: "docs", label: "文档数", width: 120, sortable: true },
  { prop: "storeSize", label: "存储", width: 120, sortable: true },
  { prop: "actions", label: "操作", width: 190, fixed: "right" as const, slot: "col-actions" },
];

const nodeColumns = [
  { prop: "name", label: "节点名", minWidth: 180, slot: "col-name" },
  { prop: "ip", label: "地址", minWidth: 150 },
  { prop: "roles", label: "角色", minWidth: 140 },
  { prop: "master", label: "Master", width: 100, slot: "col-master" },
  { prop: "heapPercent", label: "堆使用", width: 110, slot: "col-heap" },
  { prop: "cpu", label: "CPU", width: 150, slot: "col-cpu" },
  { prop: "load", label: "负载", width: 90 },
  { prop: "version", label: "版本", width: 100 },
];

const shardColumns = [
  { prop: "index", label: "索引", minWidth: 180 },
  { prop: "shard", label: "分片", width: 80 },
  { prop: "prirep", label: "主/副", width: 80 },
  { prop: "state", label: "状态", width: 120 },
  { prop: "docs", label: "文档数", width: 100 },
  { prop: "store", label: "存储", width: 100 },
  { prop: "node", label: "节点", minWidth: 160 },
];

const fieldColumns = [
  { prop: "name", label: "字段名", minWidth: 180 },
  { prop: "type", label: "类型", width: 110 },
  { prop: "analyzer", label: "分词器", minWidth: 120 },
  { prop: "format", label: "日期格式", minWidth: 120 },
  { prop: "index", label: "建索引", width: 90, slot: "col-index" },
];

const settingColumns = [
  { prop: "key", label: "设置项", minWidth: 320 },
  { prop: "value", label: "有效值", minWidth: 240 },
];

const filteredIndices = computed(() => {
  const kw = indexFilter.value.trim().toLowerCase();
  let list = indices.value;
  if (kw) list = list.filter(i => String(i.name || "").toLowerCase().includes(kw));
  if (unhealthyOnly.value) list = list.filter(i => i.health && i.health !== "green");
  return list;
});

/** 分页后的索引列表 */
const paginatedIndices = computed(() => {
  const start = (indexPage.value - 1) * indexPageSize.value;
  return filteredIndices.value.slice(start, start + indexPageSize.value);
});

const clusterNodes = computed<EsClusterNode[]>(() => cluster.value?.nodes || []);

/**
 * 节点表行：在原行上补齐 CPU 进度条需要的数值与色带。
 *
 * <p>后端 CPU 取自 ES {@code _cat/nodes} 的 cpu 列，是「整数百分比字符串」
 * （"3" 即 3%），不是分数，故按 0-100 直接当百分比用。</p>
 */
type EsNodeRow = EsClusterNode & { cpuPct: number | null; cpuTone: EsCpuTone; statusTone: string };

const nodeRows = computed<EsNodeRow[]>(() =>
  clusterNodes.value.map(node => {
    const heap = Number(node.heapPercent);
    let statusTone = "is-grey";
    if (!isNaN(heap)) {
      if (heap >= 85) statusTone = "is-red";
      else if (heap >= 70) statusTone = "is-yellow";
      else statusTone = "is-green";
    }
    return {
      ...node,
      cpuPct: cpuPercent(node.cpu),
      cpuTone: cpuTone(node.cpu),
      statusTone,
    };
  }),
);

const indexOptions = computed(() => indices.value.map(i => ({ label: i.name, value: i.name })));

const queryPlaceholder = computed(
  () =>
    capability.value?.queryHint ||
    "输入检索：留空索引则按原始表达式，如 search <index> <查询>",
);

const queryColumns = computed(() =>
  (queryResult.value?.columns || []).map(c => ({ prop: c, label: c, minWidth: 140 })),
);

/** 从 fetchEsIndexDetail 拿到的 settings，转换为可展示的 key-value 列表（最多 20 条） */
const indexSettingsEntries = computed(() =>
  Object.entries(indexSettings.value).map(([k, v]) => ({ key: k, value: String(v) })).slice(0, 20),
);

const queryEmptyText = computed(() =>
  queryResult.value?.message ? `检索未返回数据：${queryResult.value.message}` : "执行检索后显示结果",
);

/** 别名管理状态 */
const aliases = ref<EsAliasRow[]>([]);
const aliasesLoading = ref(false);

/** 文档详情状态 */
const docDetailVisible = ref(false);
const docDetailLoading = ref(false);
const docDetailData = ref<Record<string, unknown> | null>(null);
const docDetailIndex = ref("");

/** 添加别名弹框 */
const aliasDialogVisible = ref(false);
const aliasDialogIndex = ref("");

/** 别名表格列 */
const aliasColumns = [
  { prop: "alias", label: "别名", minWidth: 160 },
  { prop: "index", label: "指向索引", minWidth: 180 },
  { prop: "filter", label: "过滤条件", minWidth: 200 },
  { prop: "searchRouting", label: "搜索路由", width: 110 },
  { prop: "indexRouting", label: "写入路由", width: 110 },
  { prop: "actions", label: "操作", width: 80, fixed: "right" as const, slot: "col-actions" },
];

const fieldDrawerTitle = computed(() => `索引字段 - ${fieldDetail.value?.name || ""}`);

const indexDialogTitle = computed(() =>
  indexDialogMode.value === "create"
    ? "新建索引（设计表）"
    : `字段管理（增 / 删 / 改）- ${indexForm.name}`,
);

/** 设置项键列表，供集群信息里选择后编辑 */
const settingKeyOptions = computed(() => {
  const settings = cluster.value?.settings || {};
  return Object.keys(settings).map(k => ({ label: k, value: k }));
});

/** 集群设置表格：只展示前若干项，避免 781 项一次性渲染卡顿 */
const filteredSettings = computed(() => {
  const settings = cluster.value?.settings || {};
  return Object.entries(settings)
    .slice(0, 200)
    .map(([key, value]) => ({ key, value: String(value) }));
});

// ---- 关系图：集群 → 节点（zk 集群拓扑同款；索引/字段是表内细节，不进图）----
const graphNodes = computed(() => {
  const info = cluster.value;
  if (!info) return [];
  const center = {
    id: "cluster",
    label: info.clusterName || "集群",
    type: "circle" as const,
    size: 58,
    group: "cluster",
    data: { kind: "cluster", status: info.status },
    style: { fill: "#409eff", stroke: "#409eff", labelText: info.clusterName || "集群" },
  };
  const rings = (info.nodes || []).map(n => ({
    id: `node:${n.name}`,
    label: n.name,
    type: "circle" as const,
    size: 44,
    group: n.master === "*" ? "master" : "node",
    data: { kind: "node", ...n },
    style: {
      fill: n.master === "*" ? "#e6a23c" : "#00bfb3",
      stroke: n.master === "*" ? "#e6a23c" : "#00bfb3",
      labelText: n.name,
    },
  }));
  return [center, ...rings];
});

const graphEdges = computed(() =>
  (cluster.value?.nodes || []).map(n => ({
    id: `cluster->node:${n.name}`,
    source: "cluster",
    target: `node:${n.name}`,
    label: n.master === "*" ? "master" : "node",
    animated: n.master === "*",
    style: { stroke: n.master === "*" ? "#e6a23c" : "#00bfb3", endArrow: true },
  })),
);

/** 悬浮中的节点（详情固定渲染在图区右下角，避免与右上角工具栏/节点重叠） */
type GraphHover = {
  label?: string;
  kind?: string;
  status?: string;
  master?: string;
  ip?: string;
  heapPercent?: string;
  cpu?: string;
  load?: string;
  version?: string;
};

const graphHover = ref<GraphHover | null>(null);

function onGraphNodeHover(node: { label?: string; data?: GraphHover } | null) {
  graphHover.value = node ? { label: node.label, ...(node.data || {}) } : null;
}

function healthTag(health?: string | null): "success" | "warning" | "danger" | "info" {
  if (health === "green") return "success";
  if (health === "yellow") return "warning";
  if (health === "red") return "danger";
  return "info";
}

/** 节点 CPU 进度条色带（阈值与监控台其它页面同口径） */
type EsCpuTone = "ok" | "warn" | "danger";

/**
 * 解析节点 CPU 为 0-100 的百分比。
 *
 * <p>后端给的是 {@code _cat/nodes} 的 cpu 列（整数百分比字符串，如 "3" 表示 3%），
 * 空值 / 非数字（如 "-"）返回 null —— 由调用方显示「—」，不编造 0%。</p>
 *
 * @param value CPU 原值
 * @returns 0-100 的百分比，或 null
 */
function cpuPercent(value: string | null | undefined): number | null {
  if (value == null || String(value).trim() === "") return null;
  const n = Number(String(value).replace("%", "").trim());
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, n));
}

/**
 * CPU 进度条色带：&lt;60 正常 / 60-84 偏高 / ≥85 危险。
 *
 * @param value CPU 原值
 * @returns 色带标识
 */
function cpuTone(value: string | null | undefined): EsCpuTone {
  const pct = cpuPercent(value);
  if (pct === null) return "ok";
  if (pct >= 85) return "danger";
  if (pct >= 60) return "warn";
  return "ok";
}

function showError(error: unknown, api: string) {
  const msg = String((error as Error)?.message ?? error ?? "");
  if (/功能未开放/.test(msg)) {
    gap.value = msg;
    return;
  }
  if (/status code 404|No static resource|no handler|资源不存在/i.test(msg)) {
    gap.value = `后端未提供 ${api}（HTTP 404），本页无真实数据可显示`;
    return;
  }
  gap.value = `调用 ${api} 失败：${msg || "未知错误"}`;
}

// ---- 能力 / 连接 ----
async function loadCapability() {
  capabilityLoading.value = true;
  try {
    capability.value = await fetchEsCapability();
    if (source.value && !gap.value) ready();
  } catch (e) {
    showError(e, "/ms/monitor/middleware/capability");
  } finally {
    capabilityLoading.value = false;
  }
}

async function testConnection() {
  if (!datasourceId.value) return;
  testing.value = true;
  try {
    const res = await testEsConnection(datasourceId.value);
    testResult.value = { version: res.version, detail: res.detail };
    if (res.connected) {
      message.success(`Elasticsearch 连接正常${res.detail ? `：${res.detail}` : ""}`);
    } else {
      message.error(`Elasticsearch 连接失败：${res.message}`);
    }
  } catch (e) {
    showError(e, "/ms/monitor/middleware/test");
  } finally {
    testing.value = false;
  }
}

// ---- 索引概览 ----
async function loadIndices() {
  if (!datasourceId.value) return;
  loading.value = true;
  try {
    indices.value = (await fetchEsIndices(datasourceId.value)) || [];
    if (source.value && !gap.value) ready();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/indices");
  } finally {
    loading.value = false;
  }
}

async function removeIndex(row: EsIndexRow) {
  try {
    await ElMessageBox.confirm(`确认删除索引「${row.name}」？该操作不可恢复`, "删除索引", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteEsIndex(row.name, datasourceId.value);
    message.success(`索引 ${row.name} 已删除`);
    await loadIndices();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/index");
  }
}

// ---- 字段抽屉 ----
async function openFieldDrawer(row: EsIndexRow) {
  fieldDrawerVisible.value = true;
  fieldDrawerLoading.value = true;
  fieldDetail.value = null;
  try {
    fieldDetail.value = await fetchEsIndexDetail(row.name, datasourceId.value);
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/index");
    fieldDrawerVisible.value = false;
  } finally {
    fieldDrawerLoading.value = false;
  }
}

// ---- 建索引 / 追加字段 ----
function addFieldRow() {
  indexForm.fields.push({ name: "", type: "keyword", analyzer: "", format: "", index: true });
}

function removeFieldRow(idx: number) {
  indexForm.fields.splice(idx, 1);
}

function openCreateIndex() {
  indexDialogMode.value = "create";
  indexForm.name = "";
  indexForm.shards = 1;
  indexForm.replicas = 0;
  indexForm.fields = [];
  indexSettings.value = {};
  addFieldRow();
  indexDialogVisible.value = true;
}

/** 该字段是否已存在于当前索引的 mapping（用于行内标记，并决定保存走哪条路） */
function isOriginalField(name: string): boolean {
  if (!name) return false;
  return originalFields.value.some(f => f.name === name);
}

/** 判断两个 EsField 是否有实质性差异（任意一项不同都视为改动，需重建索引） */
function fieldChanged(orig: EsField, cur: EsField): boolean {
  const ov = (v?: unknown) => (v == null ? "" : String(v));
  return (
    ov(orig.type) !== ov(cur.type) ||
    ov(orig.analyzer) !== ov(cur.analyzer) ||
    ov(orig.format) !== ov(cur.format) ||
    (orig.index !== false) !== (cur.index !== false) ||
    ov(orig.copyTo) !== ov(cur.copyTo) ||
    ov(orig.normalizer) !== ov(cur.normalizer) ||
    (orig.docValues ?? true) !== (cur.docValues ?? true) ||
    (orig.sparse ?? false) !== (cur.sparse ?? false) ||
    (orig.dimension) !== (cur.dimension) ||
    (orig.eagerGlobalOrdinals ?? false) !== (cur.eagerGlobalOrdinals ?? false) ||
    ov(orig.script) !== ov(cur.script) ||
    ov(orig.similarity) !== ov(cur.similarity) ||
    ov(orig.termVector) !== ov(cur.termVector) ||
    (orig.ignoreAbove ?? 2147483647) !== (cur.ignoreAbove ?? 2147483647)
    // multi-fields(fields) 暂不在此比较，其变动需手动触发重建
  );
}

/**
 * 打开字段管理：先加载索引现有字段，再在其基础上增 / 删 / 改
 *
 * <p>ES 不能原地删字段，也不能改已存在字段的类型；保存时按 diff 自动分流：
 * 仅新增走 {@link addEsMapping}，含删除 / 改动走 {@link rebuildEsIndex}。</p>
 */
async function openFieldManager(name?: string) {
  if (!name || !datasourceId.value) return;
  fieldDrawerVisible.value = false;
  indexDialogMode.value = "fields";
  indexForm.name = name;
  indexForm.shards = 1;
  indexForm.replicas = 0;
  indexForm.fields = [];
  originalFields.value = [];
  indexDialogVisible.value = true;
  indexDialogLoading.value = true;
  try {
    const detail = await fetchEsIndexDetail(name, datasourceId.value);
    originalFields.value = (detail.fields ?? []).map(f => ({ ...f }));
    indexForm.fields = (detail.fields ?? []).map(f => ({ ...f }));
    indexForm.shards = detail.shards ?? 1;
    indexForm.replicas = detail.replicas ?? 0;
    indexSettings.value = detail.settings ?? {};
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/index");
    indexDialogVisible.value = false;
  } finally {
    indexDialogLoading.value = false;
  }
}

async function saveIndex() {
  const name = indexForm.name.trim();
  if (!name) {
    message.warning("请输入索引名");
    return;
  }
  // 索引名格式校验：ES 规范：全小写，可含字母/数字/下划线/连字符，首字符必须是字母或下划线
  if (!/^[a-z_][a-z0-9_-]{0,254}$/.test(name)) {
    message.warning(
      "索引名不合法。规则：全小写、首字符为字母或下划线、可含字母/数字/下划线/连字符、最长 255 字符",
    );
    return;
  }
  const fields = indexForm.fields.filter(f => f.name.trim());
  if (fields.length === 0) {
    message.warning("至少填写一个字段");
    return;
  }
  // 字段名格式校验：字母或下划线开头，可含字母/数字/下划线
  const invalidField = fields.find(f => !/^[a-zA-Z_][a-zA-Z0-9_]{0,254}$/.test(f.name.trim()));
  if (invalidField) {
    message.warning(
      `字段名「${invalidField.name}」不合法。规则：首字符为字母或下划线，可含字母/数字/下划线，最长 255 字符`,
    );
    return;
  }

  // 字段管理模式：先对「现有字段 vs 本次字段」做 diff，判定走 mapping 还是重建索引
  let target: "create" | "mapping" | "rebuild" = "create";
  if (indexDialogMode.value !== "create") {
    const origByName = new Map(originalFields.value.map(f => [f.name, f]));
    const curByName = new Map(fields.map(f => [f.name, f]));
    const added = fields.filter(f => !origByName.has(f.name));
    const removed = originalFields.value.filter(f => !curByName.has(f.name));
    const modified = fields.filter(f => {
      const orig = origByName.get(f.name);
      if (!orig) return false;
      return fieldChanged(orig, f);
    });
    if (removed.length > 0 || modified.length > 0) {
      target = "rebuild";
      try {
        await ElMessageBox.confirm(
          `索引「${name}」：将删除 ${removed.length} 个字段、改动 ${modified.length} 个字段。` +
            `ES 无法原地删除字段或修改已存在字段的类型，底层执行三步：` +
            `(1) 建临时索引 → (2) 复制数据到临时索引 → (3) 删除原索引并重建同名。` +
            `操作耗时与数据量成正比，过程中原索引短暂不可用。确定继续？`,
          "需要重建索引",
          { type: "warning", confirmButtonText: "重建并生效（约数秒~数分钟）", cancelButtonText: "再想想" },
        );
      } catch {
        return; // 用户放弃重建
      }
    } else if (added.length > 0) {
      target = "mapping";
    } else {
      message.info("字段没有变化");
      return;
    }
  }

  indexSaving.value = true;
  try {
    if (target === "create") {
      await createEsIndex({
        name,
        shards: indexForm.shards,
        replicas: indexForm.replicas,
        fields,
        datasourceId: datasourceId.value,
      });
      message.success(`索引 ${name} 创建成功`);
    } else if (target === "mapping") {
      await addEsMapping({ index: name, fields, datasourceId: datasourceId.value });
      message.success(`索引 ${name} 追加字段成功`);
    } else {
      await rebuildEsIndex({
        name,
        shards: indexForm.shards,
        replicas: indexForm.replicas,
        fields,
        datasourceId: datasourceId.value,
      });
      message.success(`索引 ${name} 已按新 mapping 重建完成`);
    }
    indexDialogVisible.value = false;
    originalFields.value = [];
    indexSettings.value = {};
    await loadIndices();
    if (fieldDrawerVisible.value && fieldDetail.value?.name === name) {
      fieldDetail.value = await fetchEsIndexDetail(name, datasourceId.value);
    }
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/index");
  } finally {
    indexSaving.value = false;
  }
}

// ---- 刷新集群状态（Red 告警条 / 工具栏按钮复用） ----
async function loadCluster() {
  if (!datasourceId.value) return;
  clusterLoading.value = true;
  try {
    cluster.value = await fetchEsCluster(datasourceId.value);
    clusterChartRef.value?.snapshot();
    clusterChartSnapshots.value = clusterChartRef.value?.snapshotCount ?? 0;
  } catch (e) {
    showError(e, "加载集群信息");
  } finally {
    clusterLoading.value = false;
  }
}

/** 通用集群加载：只在未缓存时请求，tabs 共用一份缓存 */
async function loadClusterIfNeeded(): Promise<void> {
  if (!datasourceId.value || cluster.value) return;
  cluster.value = await fetchEsCluster(datasourceId.value);
}

// ---- 节点列表 ----
async function loadNodesTab() {
  if (!datasourceId.value) return;
  nodesLoading.value = true;
  try {
    await loadClusterIfNeeded();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/cluster");
  } finally {
    nodesLoading.value = false;
  }
}

// ---- 关系图谱（复用集群节点数据，画集群 → 节点拓扑）----
async function loadGraphTab() {
  if (!datasourceId.value) return;
  graphLoading.value = true;
  try {
    await loadClusterIfNeeded();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/cluster");
  } finally {
    graphLoading.value = false;
  }
}

// ---- 查询检索 ----
async function runQuery() {
  if (queryMode.value === "dsl") {
    const text = queryDslText.value.trim();
    if (!text) { message.warning("请输入 DSL 语句"); return; }
    if (!datasourceId.value) return;
    queryLoading.value = true;
    try {
      const res = await queryEs(text, datasourceId.value);
      queryResult.value = res;
      if (res.message) message.error(res.message);
      pushHistory(text, "dsl");
    } catch (e) {
      showError(e, "/ms/monitor/middleware/query");
    } finally {
      queryLoading.value = false;
    }
  } else {
    const index = queryIndex.value;
    const keyword = queryKeyword.value.trim();
    const expression = index ? `search ${index} ${keyword}`.trim() : keyword;
    if (!expression) { message.warning("请输入检索内容"); return; }
    if (!datasourceId.value) return;
    queryLoading.value = true;
    try {
      const res = await queryEs(expression, datasourceId.value);
      queryResult.value = res;
      if (res.message) message.error(res.message);
      pushHistory(expression, "simple", index);
    } catch (e) {
      showError(e, "/ms/monitor/middleware/query");
    } finally {
      queryLoading.value = false;
    }
  }
}

// ---- 别名管理 ----
async function loadAliases() {
  if (!datasourceId.value) return;
  aliasesLoading.value = true;
  try {
    aliases.value = await fetchEsAliases(datasourceId.value);
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/aliases");
  } finally {
    aliasesLoading.value = false;
  }
}

async function openAddAlias() {
  if (indices.value.length === 0) {
    message.warning("请先选择一个已有索引");
    return;
  }
  aliasDialogIndex.value = indices.value[0].name;
  aliasDialogVisible.value = true;
}

async function onAliasDialogSubmit(alias: string, index: string) {
  aliasDialogVisible.value = false;
  try {
    await addEsAlias({ alias, index, datasourceId: datasourceId.value });
    message.success("别名添加成功");
    await loadAliases();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/alias");
  }
}

async function removeAlias(row: EsAliasRow) {
  try {
    await ElMessageBox.confirm(
      `确定删除别名「${row.alias}」指向「${row.index}」吗？删除别名不影响索引本身。`,
      "删除别名",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  try {
    await deleteEsAlias(row.alias, datasourceId.value);
    message.success("别名已删除");
    await loadAliases();
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/alias");
  }
}

// ---- 文档详情 ----
async function openDocDetail(row: EsIndexRow) {
  docDetailIndex.value = row.name;
  docDetailData.value = null;
  docDetailVisible.value = true;
  docDetailLoading.value = true;
  try {
    // 先让用户输入文档 ID
    const { value: docId } = await ElMessageBox.prompt(
      `请输入「${row.name}」的文档 ID（_id）`,
      "文档详情",
      {
        confirmButtonText: "查询",
        cancelButtonText: "取消",
        inputPlaceholder: "输入文档 ID",
      },
    );
    if (!docId?.trim()) return;
    const res = await queryEs(`get ${row.name} ${docId.trim()}`, datasourceId.value);
    if (res.rows && res.rows.length > 0) {
      docDetailData.value = res.rows[0];
    } else {
      docDetailData.value = null;
      message.warning("文档不存在");
    }
  } catch {
    // 用户取消或错误
  } finally {
    docDetailLoading.value = false;
  }
}

/** 格式化文档字段值为显示字符串 */
function formatDocValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** 键盘快捷键处理 */
function handleKeydown(e: KeyboardEvent) {
  const ctrl = e.ctrlKey || e.metaKey;
  // Ctrl+R 全局刷新
  if (ctrl && e.key === "r") {
    e.preventDefault();
    refresh();
    return;
  }
  // Ctrl+N 或 Ctrl+Enter 在索引对话框打开时：触发保存
  if (indexDialogVisible.value) {
    if ((ctrl && e.key === "n") || (ctrl && e.key === "Enter")) {
      e.preventDefault();
      saveIndex();
      return;
    }
    // Escape 关闭索引对话框
    if (e.key === "Escape") {
      indexDialogVisible.value = false;
      return;
    }
  }
  // Escape 关闭其他对话框
  if (e.key === "Escape") {
    if (clusterVisible.value) clusterVisible.value = false;
    if (fieldDrawerVisible.value) fieldDrawerVisible.value = false;
    if (aliasDialogVisible.value) aliasDialogVisible.value = false;
    if (docDetailVisible.value) docDetailVisible.value = false;
  }
}

// ---- 集群信息 ----
async function openCluster() {
  clusterVisible.value = true;
  clusterLoading.value = true;
  try {
    const [info, shardRows] = await Promise.all([
      fetchEsCluster(datasourceId.value),
      fetchEsShards(datasourceId.value),
    ]);
    cluster.value = info;
    shards.value = shardRows || [];
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/cluster");
  } finally {
    clusterLoading.value = false;
  }
}

async function saveClusterSetting() {
  const key = settingKey.value.trim();
  if (!key) {
    message.warning("请选择要修改的设置项");
    return;
  }
  // 静态设置拦在这里：发出去只会被 ES 拒（not dynamic / unknown setting），
  // 与其让用户对着英文报错猜，不如直接告诉他该去改 elasticsearch.yml。
  const blocked = staticSettingReason(key);
  if (blocked) {
    message.warning(blocked);
    return;
  }
  settingSaving.value = true;
  try {
    cluster.value = await updateEsClusterSettings({
      datasourceId: datasourceId.value,
      persistent: { [key]: settingValue.value },
    });
    message.success(`集群设置 ${key} 已更新`);
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/cluster/settings");
  } finally {
    settingSaving.value = false;
  }
}

// ---- 刷新 / 惰性加载 ----
async function refresh() {
  await loadCapability();
  if (!datasourceId.value) return;
  if (activeTab.value === "overview") await loadIndices();
  else if (activeTab.value === "nodes") await loadNodesTab();
  else if (activeTab.value === "graph") await loadGraphTab();
}

watch(
  () => indexFilter.value,
  () => {
    indexPage.value = 1;
  },
);

watch(activeTab, async tab => {
  if (!datasourceId.value) return;
  if (tab === "nodes" && !cluster.value) await loadNodesTab();
  if (tab === "graph" && !cluster.value) await loadGraphTab();
  if (tab === "overview" && indices.value.length === 0) await loadIndices();
  if (tab === "clusterCfg") {
    // 集群名优先用当前连接的集群回填，省得手抄（读不到就留空让用户自己填）
    if (!clusterForm.clusterName) {
      await loadClusterIfNeeded();
      clusterForm.clusterName = cluster.value?.clusterName || "";
    }
    if (clusterForm.nodes.length === 0) addClusterNode();
  }
  if (tab === "aliases") await loadAliases();
});

onMounted(async () => {
  await bind("elasticsearch");
  await loadCapability();
  if (datasourceId.value) {
    await loadIndices();
  }
});
</script>

<style scoped lang="scss">
.dsm {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--bg-fill);
}

.dsm-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.dsm-toolbar-left,
.dsm-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.es-red-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 12px;
  padding: 10px 16px;
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 40%, transparent);
  border-radius: var(--re-surface-radius, 16px);
}
.es-red-icon { color: var(--el-color-danger); flex-shrink: 0; font-size: 18px; }
.es-red-text { flex: 1; font-size: 13px; color: var(--el-color-danger); }

.dsm-es-icon {
  color: #00bfb3;
}

.dsm-body {
  display: flex;
  flex: 1;
  gap: 6px;
  overflow: hidden;
}

.dsm-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  overflow: auto;
}

.dsm-info-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px 20px;
  padding: 14px 16px;
}

.dsm-info-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsm-info-label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-info-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--text-primary);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.dsm-muted {
  color: var(--text-tertiary);
  font-size: 12px;
}

.dsm-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsm-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-section-actions {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dsm-row-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dsm-filter {
  width: 200px;
}

.dsm-sub-title {
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

/* ---- 节点 CPU 进度条（集群信息 / 节点列表两个表共用） ---- */
.dsm-meter {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.dsm-meter__track {
  position: relative;
  flex: 1;
  min-width: 48px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--el-fill-color, #ebeef5);
}

.dsm-meter__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--status-success, var(--el-color-success));
  transition: width 0.3s ease;
}

.dsm-meter__fill.is-warn {
  background: var(--status-warning, var(--el-color-warning));
}

.dsm-meter__fill.is-danger {
  background: var(--status-danger, var(--el-color-danger));
}

.dsm-meter__text {
  flex: none;
  min-width: 34px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
  text-align: right;
}

/* ---- 关系图 ---- */
.dsm-graph-wrap {
  position: relative;
  padding: 8px;
}

/* 悬浮详情：固定右下角，避免与图区右上角的工具栏/节点重叠 */
.dsm-graph-detail {
  position: absolute;
  right: 12px;
  bottom: 12px;
  min-width: 160px;
  max-width: 280px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--el-bg-color-overlay, #fff);
  box-shadow: 0 4px 16px rgb(0 0 0 / 12%);
  pointer-events: none;
}

.dsm-graph-tip-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.dsm-graph-tip-row {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ---- 集群信息 ---- */
.dsm-cluster-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px 16px;
  padding-bottom: 4px;
}

.dsm-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsm-stat-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-stat-value {
  font-size: 14px;
  color: var(--text-primary);
}

.dsm-setting-edit {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.dsm-setting-key {
  flex: 1;
  min-width: 0;
  max-width: 420px;
}

.dsm-setting-value {
  flex: 1;
  min-width: 0;
  max-width: 260px;
}

/* 静态设置就地拦截提示（只能改 elasticsearch.yml 的那类 key） */
.dsm-setting-block {
  margin: -2px 0 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-color-warning-light-5, var(--status-warning));
  border-radius: 8px;
  background: color-mix(in srgb, var(--status-warning) 10%, transparent);
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

/* ---- 集群纳管（生成各节点 elasticsearch.yml） ---- */
.dsm-cluster-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.dsm-form-item--wide {
  max-width: 560px;
}

.dsm-bootstrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
  cursor: pointer;
}

.dsm-node-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.dsm-node-grid-head,
.dsm-node-grid-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.7fr 0.7fr 1.6fr 0.5fr;
  gap: 8px;
  align-items: center;
}

.dsm-node-grid-head {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-snippets {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dsm-snippet {
  padding: 10px 12px;
}

.dsm-snippet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dsm-snippet-body {
  margin: 0;
  padding: 10px;
  max-height: 260px;
  overflow: auto;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  background: var(--el-fill-color-light, #f5f7fa);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.7;
  white-space: pre;
  color: var(--text-primary);
}

/* ---- 字段抽屉 ---- */
.dsm-field-drawer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 抽屉顶部条：左侧索引概况，右侧「管理字段」方形按钮 */
.dsm-drawer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.dsm-divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---- 索引表单 ---- */
.dsm-index-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dsm-form-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.dsm-form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  flex: 1;
}

.dsm-form-item label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 索引设置展示（对话框内，只读） */
.dsm-settings-section {
  margin-bottom: 12px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 50%, transparent);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}
.dsm-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px 16px;
  max-height: 180px;
  overflow-y: auto;
}
.dsm-settings-item {
  display: flex;
  gap: 6px;
  font-size: 12px;
  line-height: 1.6;
  align-items: baseline;
}
.dsm-settings-key {
  color: var(--el-color-info);
  flex-shrink: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsm-settings-key::after { content: ":"; margin-right: 4px; }
.dsm-settings-val {
  color: var(--text-primary);
  word-break: break-all;
  font-size: 12px;
}

.dsm-field-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px;
  max-height: 46vh;
  overflow-y: auto;
}

/* 字段多时表头吸顶，滚动中仍能看到列名 */
.dsm-field-grid-head {
  position: sticky;
  top: -8px;
  z-index: 1;
  background: var(--bg-container);
  padding: 6px 0;
}

.dsm-field-grid-head,
.dsm-field-grid-row {
  display: grid;
  grid-template-columns: 1.9fr 1fr 1.1fr 0.7fr 0.6fr;
  gap: 8px;
  align-items: center;
}

.dsm-field-grid-head {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 字段名 + 「已有 / 新增」来源标记 */
.dsm-field-name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dsm-field-name > :first-child {
  flex: 1;
  min-width: 0;
}

.dsm-field-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-form-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.6;
}

/* ---- 字段 Diff 高亮 ---- */
.dsm-field-added {
  border-left: 3px solid var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 6%, transparent);
}

.dsm-field-removed {
  border-left: 3px solid var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 6%, transparent);
  opacity: 0.7;
}

.dsm-field-removed .dsm-field-name input {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.dsm-field-modified {
  border-left: 3px solid var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 6%, transparent);
}

/* ---- 查询区域 ---- */
.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dsm-query-toolbar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-wrap: wrap;
}

.dsm-query-mode {
  width: 120px;
  flex: none;
}

.dsm-query-index {
  width: 240px;
  flex: none;
}

.dsm-query-input {
  flex: 1;
  max-width: 760px;
}

.dsm-query-dsl-wrap {
  flex: 1;
  min-width: 0;
}

/* ---- 查询历史记录 ---- */
.dsm-query-history.re-surface {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  box-shadow: var(--es-card-glow);
  max-height: 220px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.dsm-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, var(--border-color, #e4e7ed));
}
.dsm-history-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.dsm-history-list {
  overflow-y: auto;
  flex: 1;
}
.dsm-history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}
.dsm-history-item:last-child { border-bottom: none; }
.dsm-history-item:hover {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
}
.dsm-history-text {
  font-size: 11px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dsm-history-meta {
  font-size: 10px;
  color: var(--text-tertiary);
}

/* ---- 集群监控图表区域 ---- */
.dsm-cluster-chart-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}
.dsm-chart-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.dsm-chart-label-icon {
  color: var(--el-color-primary);
  filter: drop-shadow(0 0 4px var(--el-color-primary));
}

/* ---- 节点详情弹框 ---- */
.dsm-node-detail {
  padding: 4px 0;
}
.dsm-node-detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
}
.dsm-node-detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsm-node-detail-label {
  font-size: 11px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}
.dsm-node-detail-value {
  font-size: 13px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
}
.dsm-node-detail-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* ---- 分片热力图 ---- */
.dsm-shard-heatmap {
  overflow: auto;
  max-height: 480px;
}
.dsm-heatmap-header,
.dsm-heatmap-row {
  display: flex;
  align-items: center;
  gap: 2px;
}
.dsm-heatmap-label {
  flex: 0 0 140px;
  font-size: 11px;
}
.dsm-heatmap-node-label {
  flex: 0 0 60px;
  font-size: 10px;
  color: var(--text-tertiary);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsm-heatmap-index-label {
  flex: 0 0 140px;
  font-size: 11px;
  color: var(--text-primary);
  padding: 4px 4px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsm-heatmap-cell {
  flex: 0 0 60px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 700;
  border-radius: 4px;
  cursor: default;
  transition: opacity 0.15s;
}
.dsm-heatmap-cell:hover { opacity: 0.75; }
.dsm-heatmap-cell--empty  { background: transparent; color: var(--text-tertiary); }
.dsm-heatmap-cell--primary { background: color-mix(in srgb, var(--el-color-success) 20%, transparent); color: var(--el-color-success); box-shadow: inset 0 0 8px color-mix(in srgb, var(--el-color-success) 10%, transparent); }
.dsm-heatmap-cell--replica { background: color-mix(in srgb, var(--el-color-primary) 15%, transparent); color: var(--el-color-primary); }
.dsm-heatmap-cell--danger  { background: color-mix(in srgb, var(--el-color-danger) 20%, transparent); color: var(--el-color-danger); box-shadow: inset 0 0 8px color-mix(in srgb, var(--el-color-danger) 15%, transparent); animation: es-dot-pulse-red 1s ease-in-out infinite; }

/* ---- 导出弹框 ---- */
.dsm-export-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dsm-export-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dsm-export-format {
  width: 140px;
}
.dsm-export-content {
  padding: 12px 14px;
  max-height: 400px;
  overflow: auto;
  background: color-mix(in srgb, var(--el-fill-color-light) 50%, color-mix(in srgb, var(--el-color-primary) 3%, transparent));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius-sm);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  color: color-mix(in srgb, var(--el-color-primary) 70%, var(--text-primary));
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.7;
}

/* ---- 节点名单元格（可点击） ---- */
.dsm-node-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.dsm-node-name-cell:hover .dsm-node-name-text {
  color: var(--el-color-primary);
  text-decoration: underline;
}
.dsm-node-name-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--el-color-primary) 85%, var(--text-primary));
  transition: color 0.15s;
}
.dsm-node-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}

.dsm-query-hint {
  margin: 0;
}

.dsm-query-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dsm-query-header {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 24px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-query-meta {
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-query-warn {
  color: var(--status-warning);
}

/* ---- Dev Tools ---- */
.dsm-devtools {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 520px;
}

.dsm-devtools-history {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  padding-right: 10px;
  overflow-y: auto;
}

.dsm-devtools-history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}

.dsm-devtools-history-empty {
  font-size: 12px;
  color: var(--text-quaternary);
  text-align: center;
  padding: 20px 0;
}

.dsm-devtools-history-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background 0.15s;

  &:hover {
    background: var(--bg-active);
  }
}

.dsm-devtools-history-cmd {
  font-size: 11px;
  font-family: monospace;
  color: var(--status-info);
}

.dsm-devtools-history-idx {
  font-size: 11px;
  color: var(--text-quaternary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsm-devtools-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.dsm-devtools-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dsm-devtools-cmd {
  width: 90px;
}

.dsm-devtools-idx {
  flex: 1;
  min-width: 160px;
}

.dsm-devtools-editor-wrap {
  position: relative;
  flex: 1;
  min-height: 180px;
}

.dsm-devtools-editor-hint {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  font-size: 11px;
  color: var(--text-quaternary);
  padding: 4px 8px;
  pointer-events: none;
  z-index: 1;
}

.dsm-devtools-editor {
  width: 100%;
  height: 100%;
  min-height: 180px;
  padding: 28px 10px 10px;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  resize: vertical;
  outline: none;
  tab-size: 2;

  &:focus {
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-quaternary);
    font-family: sans-serif;
    font-size: 12px;
  }
}

.dsm-devtools-templates {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.dsm-devtools-templates-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.dsm-devtools-result {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.dsm-devtools-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
}

.dsm-devtools-result-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-quaternary);
  font-size: 11px;
}

.dsm-devtools-error {
  padding: 12px;
  font-size: 13px;
  color: var(--status-danger);
  font-family: monospace;
}

.dsm-devtools-json {
  margin: 0;
  padding: 12px;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  overflow: auto;
  max-height: 320px;
  background: var(--bg-base);
  white-space: pre-wrap;
  word-break: break-all;
}
/* ---- 文档详情 ---- */
.dsm-loading-row {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 120px;
}

.dsm-doc-detail {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 480px;
  overflow-y: auto;
}

.dsm-doc-row {
  display: flex;
  gap: 12px;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.6;
  align-items: baseline;
}

.dsm-doc-row:nth-child(odd) {
  background: color-mix(in srgb, var(--el-fill-color-light) 50%, transparent);
}

.dsm-doc-key {
  flex: 0 0 160px;
  color: var(--el-color-info);
  word-break: break-all;
}

.dsm-doc-val {
  flex: 1;
  color: var(--text-primary);
  word-break: break-all;
}

/* ============================================================
   ES 管理页 · 科技化增强（Cyberpunk Terminal 风格）
   ============================================================ */

/* ---- 科技风格 CSS 变量扩展 ---- */
.dsm {
  /* 背景：深色网格纹理（data URI = 20px 点阵） */
  --es-grid-color: color-mix(in srgb, var(--el-color-primary) 4%, transparent);
  --es-glow-primary: color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  --es-glow-success: color-mix(in srgb, var(--el-color-success) 40%, transparent);
  --es-glow-warning: color-mix(in srgb, var(--el-color-warning) 40%, transparent);
  --es-glow-danger:  color-mix(in srgb, var(--el-color-danger)  50%, transparent);
  --es-card-glow: 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
                  0 4px 20px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  --es-radius: 14px;
  --es-radius-sm: 8px;
  background:
    radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--el-color-primary) 3%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--el-color-success)  3%, transparent) 0%, transparent 50%),
    var(--bg-fill);
}

/* ---- 工具栏毛玻璃 + 发光底边 ---- */
.dsm-toolbar.re-surface {
  position: relative;
  background: color-mix(in srgb, var(--el-bg-color) 82%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 15%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  box-shadow:
    var(--es-card-glow),
    0 2px 12px rgb(0 0 0 / 6%);
}
.dsm-toolbar.re-surface::after {
  content: "";
  position: absolute;
  bottom: 0; left: 16px; right: 16px;
  height: 1px;
  background: linear-gradient(90deg,
    transparent,
    var(--es-glow-primary) 30%,
    var(--el-color-primary) 50%,
    var(--es-glow-primary) 70%,
    transparent
  );
  border-radius: 999px;
}

/* ---- 标题图标发光 ---- */
.dsm-es-icon {
  filter: drop-shadow(0 0 6px var(--el-color-primary));
  animation: es-icon-pulse 3s ease-in-out infinite;
}
@keyframes es-icon-pulse {
  0%, 100% { filter: drop-shadow(0 0 4px var(--el-color-primary)); }
  50%       { filter: drop-shadow(0 0 10px var(--el-color-primary)); }
}

/* ---- 集群 Red 告警Banner 科技增强 ---- */
.es-red-banner.re-surface {
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-danger) 50%, transparent);
  border-radius: var(--es-radius);
  box-shadow: 0 0 16px var(--es-glow-danger), inset 0 0 12px color-mix(in srgb, var(--el-color-danger) 5%, transparent);
  animation: es-red-pulse 2s ease-in-out infinite;
}
.es-red-icon {
  animation: es-red-blink 1s step-start infinite;
}
@keyframes es-red-pulse {
  0%, 100% { box-shadow: 0 0 16px var(--es-glow-danger); }
  50%       { box-shadow: 0 0 28px var(--es-glow-danger), 0 0 48px color-mix(in srgb, var(--el-color-danger) 20%, transparent); }
}
@keyframes es-red-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* ---- 信息卡科技化 ---- */
.dsm-info-card.re-surface {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  background: color-mix(in srgb, var(--el-bg-color) 70%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--es-card-glow);
}

.dsm-info-label {
  color: color-mix(in srgb, var(--el-color-primary) 70%, var(--text-tertiary));
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.dsm-info-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 500;
  color: color-mix(in srgb, var(--el-color-primary) 90%, var(--text-primary));
}

/* ---- 集群统计数字 ---- */
.dsm-cluster-stats {
  padding: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 40%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
}
.dsm-stat-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--el-color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.dsm-stat-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  font-weight: 600;
}

/* ---- 进度条科技增强 ---- */
.dsm-meter__track {
  height: 6px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-fill-color, #ebeef5));
  border-radius: 999px;
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 10%);
}
.dsm-meter__fill {
  background: linear-gradient(90deg,
    var(--el-color-success) 0%,
    color-mix(in srgb, var(--el-color-success) 80%, var(--el-color-primary)) 100%
  );
  box-shadow: 0 0 8px var(--es-glow-success);
  border-radius: inherit;
}
.dsm-meter__fill.is-warn {
  background: linear-gradient(90deg, var(--el-color-warning), color-mix(in srgb, var(--el-color-warning) 70%, #f56c6c) 100%);
  box-shadow: 0 0 8px var(--es-glow-warning);
}
.dsm-meter__fill.is-danger {
  background: linear-gradient(90deg, var(--el-color-danger), color-mix(in srgb, var(--el-color-danger) 60%, #f56c6c) 100%);
  box-shadow: 0 0 10px var(--es-glow-danger);
  animation: meter-danger-glow 1.5s ease-in-out infinite;
}
@keyframes meter-danger-glow {
  0%, 100% { box-shadow: 0 0 8px var(--es-glow-danger); }
  50%       { box-shadow: 0 0 18px var(--es-glow-danger), 0 0 32px color-mix(in srgb, var(--el-color-danger) 30%, transparent); }
}
.dsm-meter__text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
}

/* ---- 节点列表网格科技增强 ---- */
.dsm-node-grid-head {
  color: var(--text-tertiary);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  padding: 0 8px;
}
.dsm-node-grid-row {
  padding: 10px 8px;
  border-radius: var(--es-radius-sm);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}
.dsm-node-grid-row:hover {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent);
  border-color: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

/* ---- 拓扑图科技增强 ---- */
.dsm-graph-wrap {
  position: relative;
  padding: 12px;
  border-radius: var(--es-radius);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--border-color, #e4e7ed));
  background:
    linear-gradient(rgba(var(--el-color-primary-rgb, 0, 191, 179), 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(var(--el-color-primary-rgb, 0, 191, 179), 0.03) 1px, transparent 1px),
    var(--el-bg-color, #fff);
  background-size: 24px 24px, 24px 24px, auto;
  box-shadow: inset 0 0 40px color-mix(in srgb, var(--el-color-primary) 3%, transparent);
}

/* ---- 集群统计 ---- */
.dsm-cluster-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px 16px;
  padding-bottom: 4px;
}

/* ---- 集群信息（抽屉内）---- */
.dsm-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ---- 节点状态指示灯 ---- */
.dsm-node-name-cell {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.dsm-node-name-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--el-color-primary) 85%, var(--text-primary));
}
.dsm-node-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 6px currentColor;
}
.dsm-node-status-dot.is-green  { background: var(--el-color-success); color: var(--el-color-success); animation: status-pulse-green 2s ease-in-out infinite; }
.dsm-node-status-dot.is-yellow { background: var(--el-color-warning); color: var(--el-color-warning); animation: status-pulse-yellow 1.5s ease-in-out infinite; }
.dsm-node-status-dot.is-red    { background: var(--el-color-danger);  color: var(--el-color-danger);  animation: status-pulse-red 0.8s ease-in-out infinite; }
.dsm-node-status-dot.is-grey   { background: var(--el-color-info);    color: var(--el-color-info); }

@keyframes status-pulse-green {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-success); }
  50%       { box-shadow: 0 0 12px var(--el-color-success), 0 0 20px color-mix(in srgb, var(--el-color-success) 40%, transparent); }
}
@keyframes status-pulse-yellow {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-warning); }
  50%       { box-shadow: 0 0 10px var(--el-color-warning), 0 0 18px color-mix(in srgb, var(--el-color-warning) 40%, transparent); }
}
@keyframes status-pulse-red {
  0%, 100% { box-shadow: 0 0 6px var(--el-color-danger); }
  50%       { box-shadow: 0 0 14px var(--el-color-danger), 0 0 24px color-mix(in srgb, var(--el-color-danger) 50%, transparent); }
}

/* ---- 字段 Diff 科技增强 ---- */
.dsm-field-added {
  border-left: 3px solid var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 8%, transparent);
  box-shadow: inset 0 0 20px color-mix(in srgb, var(--el-color-success) 4%, transparent);
  border-radius: 0 var(--es-radius-sm) var(--es-radius-sm) 0;
}
.dsm-field-removed {
  border-left: 3px solid var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, transparent);
  box-shadow: inset 0 0 20px color-mix(in srgb, var(--el-color-danger) 4%, transparent);
  opacity: 0.85;
  border-radius: 0 var(--es-radius-sm) var(--es-radius-sm) 0;
}
.dsm-field-modified {
  border-left: 3px solid var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 8%, transparent);
  box-shadow: inset 0 0 20px color-mix(in srgb, var(--el-color-warning) 4%, transparent);
  border-radius: 0 var(--es-radius-sm) var(--es-radius-sm) 0;
}

/* ---- 代码片段科技增强 ---- */
.dsm-snippet.re-surface {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  background: color-mix(in srgb, var(--el-bg-color) 60%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: var(--es-card-glow);
}
.dsm-snippet-body {
  background: color-mix(in srgb, var(--el-fill-color-deep) 50%, color-mix(in srgb, var(--el-color-primary) 3%, transparent));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 8%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius-sm);
  color: color-mix(in srgb, var(--el-color-primary) 60%, var(--text-primary));
}

/* ---- 索引列表区域 ---- */
.dsm-index-section.re-surface {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  box-shadow: var(--es-card-glow);
}

/* ---- 设置区域科技增强 ---- */
.dsm-setting-block {
  background: color-mix(in srgb, var(--status-warning) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--status-warning) 35%, transparent);
  border-radius: var(--es-radius-sm);
  box-shadow: 0 0 12px color-mix(in srgb, var(--status-warning) 15%, transparent);
}

/* ---- 字段网格标题行 ---- */
.dsm-field-grid-head {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 600;
  color: var(--text-tertiary);
  padding: 0 4px;
}

/* ---- Tab 标签页增强 ---- */
:deep(.re-tabs__header) {
  border-bottom: 2px solid color-mix(in srgb, var(--el-color-primary) 8%, var(--border-color, #e4e7ed));
}
:deep(.re-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 700;
}
:deep(.re-tabs__active-bar) {
  background: linear-gradient(90deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 60%, var(--el-color-success)));
  box-shadow: 0 0 10px var(--es-glow-primary);
}

/* ---- 文档详情增强 ---- */
.dsm-doc-row {
  border-radius: var(--es-radius-sm);
  transition: background 0.15s;
}
.dsm-doc-row:hover {
  background: color-mix(in srgb, var(--el-color-primary) 5%, transparent) !important;
}
.dsm-doc-key {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  color: var(--el-color-primary);
  opacity: 0.7;
}

/* ---- 空状态增强 ---- */
.dsm-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--text-tertiary);
}
.dsm-empty-icon {
  font-size: 40px;
  opacity: 0.3;
  filter: drop-shadow(0 0 8px var(--el-color-primary));
}
.dsm-empty-text {
  font-size: 13px;
  opacity: 0.6;
}

/* ---- 健康度圆点（脉冲灯）---- */
.dsm-health-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dsm-health-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 5px currentColor;
}
.dsm-health-dot.is-green  { background: var(--el-color-success); color: var(--el-color-success); animation: es-dot-pulse-green 2s ease-in-out infinite; }
.dsm-health-dot.is-yellow { background: var(--el-color-warning); color: var(--el-color-warning); animation: es-dot-pulse-yellow 1.5s ease-in-out infinite; }
.dsm-health-dot.is-red    { background: var(--el-color-danger);  color: var(--el-color-danger);  animation: es-dot-pulse-red 1s ease-in-out infinite; }
.dsm-health-dot.is-grey   { background: var(--el-color-info);    color: var(--el-color-info); }

@keyframes es-dot-pulse-green {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-success); }
  50%       { box-shadow: 0 0 10px var(--el-color-success), 0 0 18px color-mix(in srgb, var(--el-color-success) 40%, transparent); }
}
@keyframes es-dot-pulse-yellow {
  0%, 100% { box-shadow: 0 0 4px var(--el-color-warning); }
  50%       { box-shadow: 0 0 9px var(--el-color-warning), 0 0 16px color-mix(in srgb, var(--el-color-warning) 40%, transparent); }
}
@keyframes es-dot-pulse-red {
  0%, 100% { box-shadow: 0 0 6px var(--el-color-danger); }
  50%       { box-shadow: 0 0 12px var(--el-color-danger), 0 0 22px color-mix(in srgb, var(--el-color-danger) 50%, transparent); }
}

/* ---- 索引名单元格 ---- */
.dsm-index-name {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: color-mix(in srgb, var(--el-color-primary) 85%, var(--text-primary));
  cursor: default;
}

/* ---- 索引悬浮信息卡 ---- */
.dsm-index-hover-card {
  position: fixed;
  z-index: 99999;
  min-width: 200px;
  padding: 12px 14px;
  background: var(--el-bg-color-overlay, #fff);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--border-color, #e4e7ed));
  border-radius: var(--es-radius);
  box-shadow:
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 10%, transparent),
    0 8px 32px rgb(0 0 0 / 14%);
  pointer-events: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.dsm-hover-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-primary);
  margin-bottom: 8px;
  word-break: break-all;
}
.dsm-hover-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.dsm-hover-label {
  font-size: 11px;
  color: var(--text-tertiary);
  min-width: 40px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.dsm-hover-value {
  font-size: 12px;
  color: var(--text-primary);
}
.dsm-hover-value.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

/* ============================================================
   End ES 科技化增强
   ============================================================ */
</style>
