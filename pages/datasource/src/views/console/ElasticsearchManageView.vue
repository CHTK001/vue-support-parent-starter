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
    <ReDrawer
      v-model="fieldDrawerVisible"
      :title="fieldDrawerTitle"
      size="680px"
      data-testid="es-field-drawer"
    >
      <div v-loading="fieldDrawerLoading" class="dsm-field-drawer">
        <div v-if="fieldDetail" class="dsm-divider-row">
          <ReTag :type="healthTag(fieldDetail.health)">{{ fieldDetail.health || "—" }}</ReTag>
          <span class="dsm-muted">状态 {{ fieldDetail.status || "—" }}</span>
          <span class="dsm-muted">分片 {{ fieldDetail.shards ?? "—" }} / 副本 {{ fieldDetail.replicas ?? "—" }}</span>
          <span class="dsm-muted">文档 {{ fieldDetail.docs ?? "—" }}</span>
          <span class="dsm-muted">存储 {{ fieldDetail.storeSize || "—" }}</span>
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
      <template #footer>
        <ReButton
          type="primary"
          icon="Edit"
          :disabled="!fieldDetail"
          @click="openFieldManager(fieldDetail?.name)"
        >
          管理字段（增 / 删 / 改）
        </ReButton>
        <ReButton @click="fieldDrawerVisible = false">关闭</ReButton>
      </template>
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
import { computed, onMounted, reactive, ref, watch } from "vue";
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

/** 标签页：索引概览 / 节点列表 / 关系图谱 / 查询检索 */
const tabs = [
  { name: "overview", label: "索引概览", icon: "Collection" },
  { name: "nodes", label: "节点列表", icon: "Monitor" },
  { name: "graph", label: "关系图谱", icon: "Share" },
  { name: "query", label: "查询检索", icon: "Search" },
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

// ---- 查询检索 ----
const queryIndex = ref("");
const queryKeyword = ref("");
const queryLoading = ref(false);
const queryResult = ref<EsQueryResult | null>(null);

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
      return (
        (orig.type || "") !== (f.type || "") ||
        (orig.analyzer || "") !== (f.analyzer || "") ||
        (orig.format || "") !== (f.format || "") ||
        (orig.index !== false) !== (f.index !== false)
      );
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

/* ---- 字段抽屉 ---- */
.dsm-field-drawer {
  display: flex;
  flex-direction: column;
  gap: 10px;
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
</style>
