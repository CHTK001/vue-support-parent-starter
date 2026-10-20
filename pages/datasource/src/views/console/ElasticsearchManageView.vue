<template>
  <div class="dsm tel-page">
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
                </div>
              </div>
              <ReTable
                :data="filteredIndices"
                :columns="indexColumns"
                :loading="loading"
                :pagination="false"
                stripe
                border
                height="420px"
              >
                <template #col-health="{ row }">
                  <ReTag :type="healthTag((row as EsIndexRow).health)">{{ (row as EsIndexRow).health || "—" }}</ReTag>
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
                      type="danger"
                      icon="Delete"
                      tip="删除索引（删表）"
                      data-testid="es-row-delete"
                      @click="removeIndex(row as EsIndexRow)"
                    />
                  </span>
                </template>
              </ReTable>
              <ReEmpty v-if="!loading && indices.length === 0" description="未读取到索引，可点右上角「新建索引」创建" />
            </div>
          </template>

          <!-- ============ 节点列表（异步加载） ============ -->
          <template #nodes>
            <div class="dsm-section">
              <div class="dsm-section-title">
                <span>节点列表（{{ clusterNodes.length }}）</span>
                <div class="dsm-section-actions">
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
              <ReTable
                :data="nodeRows"
                :columns="nodeColumns"
                :loading="nodesLoading"
                :pagination="false"
                stripe
                border
                height="420px"
              >
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
              <ReEmpty v-if="!nodesLoading && clusterNodes.length === 0" description="未读取到节点，点「节点列表」右侧刷新重试" />
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

          <!-- ============ 查询检索（类 JDBC 结果集） ============ -->
          <template #query>
            <div class="dsm-query-area">
              <div class="dsm-query-toolbar">
                <ReSelect
                  v-model="queryIndex"
                  :data="indexOptions"
                  placeholder="选择索引（可留空走原始表达式）"
                  class="dsm-query-index"
                  data-testid="es-query-index"
                />
                <ReInput
                  v-model="queryKeyword"
                  :placeholder="queryPlaceholder"
                  class="dsm-query-input"
                  data-testid="es-query-keyword"
                  @keyup.enter="runQuery"
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
          <div v-for="(field, idx) in indexForm.fields" :key="idx" class="dsm-field-grid-row">
            <div class="dsm-field-name">
              <ReInput v-model="field.name" placeholder="字段名，支持 a.b" :data-testid="`es-field-name-${idx}`" />
              <ReTag v-if="isOriginalField(field.name)" type="info">已有</ReTag>
              <ReTag v-else type="success">新增</ReTag>
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
import ReRelationGraph from "@repo/ui/re-relation-graph";
// 信息提示条（查询检索的用法说明）走 re-kit 聚合入口
import { ReAlert } from "@repo/ui/re-kit";
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import {
  addEsMapping,
  createEsIndex,
  deleteEsIndex,
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

/** 标签页：索引概览 / 节点列表 / 集群纳管 / 关系图谱 / 查询检索 / Dev Tools */
const tabs = [
  { name: "overview", label: "索引概览", icon: "Collection" },
  { name: "nodes", label: "节点列表", icon: "Monitor" },
  { name: "clusterCfg", label: "集群纳管", icon: "Connection" },
  { name: "graph", label: "关系图谱", icon: "Share" },
  { name: "query", label: "查询检索", icon: "Search" },
  { name: "devtools", label: "Dev Tools", icon: "Cpu" },
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

// ---- 节点列表 ----
const cluster = ref<EsCluster | null>(null);
const nodesLoading = ref(false);

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
const queryIndex = ref("");
const queryKeyword = ref("");
const queryLoading = ref(false);
const queryResult = ref<EsQueryResult | null>(null);

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

const devToolCmdOptions: Array<{ label: string; value: string }> = [
  { label: "GET", value: "GET" },
  { label: "POST", value: "POST" },
  { label: "PUT", value: "PUT" },
  { label: "DELETE", value: "DELETE" },
];

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
  { prop: "name", label: "索引名", minWidth: 220 },
  { prop: "health", label: "健康度", width: 110, slot: "col-health" },
  { prop: "status", label: "状态", width: 100 },
  { prop: "docs", label: "文档数", width: 110 },
  { prop: "storeSize", label: "存储", width: 110 },
  { prop: "actions", label: "操作", width: 150, fixed: "right" as const, slot: "col-actions" },
];

const nodeColumns = [
  { prop: "name", label: "节点名", minWidth: 180 },
  { prop: "ip", label: "地址", minWidth: 150 },
  { prop: "roles", label: "角色", minWidth: 140 },
  { prop: "master", label: "Master", width: 100, slot: "col-master" },
  { prop: "heapPercent", label: "堆使用", width: 90 },
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
  return kw ? indices.value.filter(i => String(i.name || "").toLowerCase().includes(kw)) : indices.value;
});

const clusterNodes = computed<EsClusterNode[]>(() => cluster.value?.nodes || []);

/**
 * 节点表行：在原行上补齐 CPU 进度条需要的数值与色带。
 *
 * <p>后端 CPU 取自 ES {@code _cat/nodes} 的 cpu 列，是「整数百分比字符串」
 * （"3" 即 3%），不是分数，故按 0-100 直接当百分比用。</p>
 */
type EsNodeRow = EsClusterNode & { cpuPct: number | null; cpuTone: EsCpuTone };

const nodeRows = computed<EsNodeRow[]>(() =>
  clusterNodes.value.map(node => ({
    ...node,
    cpuPct: cpuPercent(node.cpu),
    cpuTone: cpuTone(node.cpu),
  })),
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

const queryEmptyText = computed(() =>
  queryResult.value?.message ? `检索未返回数据：${queryResult.value.message}` : "执行检索后显示结果",
);

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
  const fields = indexForm.fields.filter(f => f.name.trim());
  if (fields.length === 0) {
    message.warning("至少填写一个字段");
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
            `ES 无法原地删除字段或修改已存在字段的类型，必须重建索引` +
            `（建临时索引 → 搬运数据 → 换回同名索引），重建期间原索引短暂不可用，` +
            `耗时与数据量成正比。确定继续？`,
          "需要重建索引",
          { type: "warning", confirmButtonText: "重建并生效", cancelButtonText: "再想想" },
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

// ---- 节点列表 ----
async function loadNodesTab() {
  if (!datasourceId.value) return;
  nodesLoading.value = true;
  try {
    cluster.value = await fetchEsCluster(datasourceId.value);
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
    cluster.value = await fetchEsCluster(datasourceId.value);
  } catch (e) {
    showError(e, "/ms/monitor/elasticsearch/cluster");
  } finally {
    graphLoading.value = false;
  }
}

// ---- 查询检索 ----
async function runQuery() {
  const index = queryIndex.value;
  const keyword = queryKeyword.value.trim();
  const expression = index ? `search ${index} ${keyword}`.trim() : keyword;
  if (!expression) {
    message.warning("请输入检索内容");
    return;
  }
  if (!datasourceId.value) return;
  queryLoading.value = true;
  try {
    const res = await queryEs(expression, datasourceId.value);
    queryResult.value = res;
    if (res.message) message.error(res.message);
  } catch (e) {
    showError(e, "/ms/monitor/middleware/query");
  } finally {
    queryLoading.value = false;
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

watch(activeTab, async tab => {
  if (!datasourceId.value) return;
  if (tab === "nodes" && !cluster.value) await loadNodesTab();
  if (tab === "graph" && !cluster.value) await loadGraphTab();
  if (tab === "overview" && indices.value.length === 0) await loadIndices();
  if (tab === "clusterCfg") {
    // 集群名优先用当前连接的集群回填，省得手抄（读不到就留空让用户自己填）
    if (!clusterForm.clusterName) {
      if (!cluster.value) await loadNodesTab();
      clusterForm.clusterName = cluster.value?.clusterName || "";
    }
    if (clusterForm.nodes.length === 0) addClusterNode();
  }
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

/* ---- 查询检索 ---- */
.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dsm-query-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-query-index {
  width: 240px;
  flex: none;
}

.dsm-query-input {
  flex: 1;
  max-width: 760px;
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
</style>
