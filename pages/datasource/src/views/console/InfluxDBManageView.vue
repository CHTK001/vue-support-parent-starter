<template>
  <div class="dsm tel-page">
    <!-- 顶部工具栏 -->
    <div class="dsm-toolbar re-surface">
      <div class="dsm-toolbar-left">
        <ReIcon name="DataAnalysis" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">InfluxDB 时序数据库管理</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton layout="square" tip="测试连接" icon="Connection" data-testid="dsm-btn-test" :disabled="!source" @click="testConnection" />
        <ReButton layout="square" tip="刷新" icon="Refresh" data-testid="dsm-btn-refresh" @click="refresh" />
        <ReButton layout="square" type="primary" :tip="isV3 ? 'SQL 查询' : 'Flux 查询'" icon="Search" data-testid="dsm-btn-query" @click="openQuery" />
        <ReButton layout="square" type="primary" :tip="isV3 ? '新建数据库' : '新建 Bucket'" icon="Plus" data-testid="dsm-btn-create" :disabled="!source" :loading="bucketSaving" @click="openCreateBucket" />
        <ReButton layout="square" tip="写入数据" icon="EditPen" data-testid="dsm-btn-write" :disabled="!source" :loading="writeSaving" @click="openWritePoint" />
      </div>
    </div>

    <MiddlewareGap :text="gap" @retry="refresh" />

    <div class="dsm-body">
      <!-- 左侧连接树 -->
      <div class="dsm-sidebar">
        <div class="dsm-tree">
          <div class="dsm-tree-node dsm-tree-root" @click="toggleNode('root')">
            <ReIcon :name="expandedNodes.has('root') ? 'ArrowDown' : 'ArrowRight'" size="12" />
            <ReIcon name="Coin" size="14" class="dsm-tree-icon dsm-influx-icon" />
            <span class="dsm-tree-label">{{ connectionName }}</span>
          </div>

          <div v-if="expandedNodes.has('root')" class="dsm-tree-children">
            <div class="dsm-tree-node" @click="toggleNode('buckets')">
              <ReIcon :name="expandedNodes.has('buckets') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="FolderOpened" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">{{ isV3 ? "数据库 (Databases)" : "存储桶 (Buckets)" }}</span>
              <span class="dsm-tree-count">{{ buckets.length }}</span>
            </div>
            <div v-if="expandedNodes.has('buckets')" class="dsm-tree-children">
              <div
                v-for="bucket in buckets"
                :key="bucket.name"
                class="dsm-tree-node dsm-leaf-node"
                :class="{ active: activeBucket === bucket.name }"
                @click="selectBucket(bucket.name)"
                @contextmenu.prevent="onBucketContextMenu($event, bucket.name)"
              >
                <ReIcon name="Collection" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ bucket.name }}</span>
              </div>
            </div>

            <div class="dsm-tree-node" @click="toggleNode('measurements')">
              <ReIcon :name="expandedNodes.has('measurements') ? 'ArrowDown' : 'ArrowRight'" size="12" />
              <ReIcon name="TrendCharts" size="14" class="dsm-tree-icon" />
              <span class="dsm-tree-label">测量 (Measurements)</span>
              <span class="dsm-tree-count">{{ measurements.length }}</span>
            </div>
            <div v-if="expandedNodes.has('measurements')" class="dsm-tree-children">
              <div
                v-for="m in measurements"
                :key="m.name"
                class="dsm-tree-node dsm-leaf-node"
                @click="selectMeasurement(m.name)"
                @contextmenu.prevent="onMeasurementContextMenu($event, m.name)"
              >
                <ReIcon name="DataLine" size="14" class="dsm-tree-icon" />
                <span class="dsm-tree-label">{{ m.name }}</span>
              </div>
              <div v-if="measurements.length === 0" class="dsm-tree-node dsm-leaf-node">
                <span class="dsm-tree-label">暂无测量</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="dsm-content">
        <!-- 工作区页签（对齐 jdbc dbm-tabs）：总览 + 多个 Flux 查询页签，可多开、切换保留 -->
        <div class="dsm-tabs">
          <div class="dsm-tab" :class="{ active: activeWorkspaceTab === 'overview' }" @click="activeWorkspaceTab = 'overview'">
            <ReIcon name="Collection" size="12" />
            <span class="dsm-tab-title">总览</span>
          </div>
          <div
            v-for="t in queryTabs"
            :key="t.id"
            class="dsm-tab"
            :class="{ active: activeWorkspaceTab === t.id }"
            @click="activeWorkspaceTab = t.id"
          >
            <ReIcon name="Edit" size="12" />
            <span class="dsm-tab-title">{{ t.title }}</span>
            <ReIcon name="Close" size="12" class="dsm-tab-close" @click.stop="closeQueryTab(t.id)" />
          </div>
        </div>
        <!-- 连接信息 -->
        <div v-if="activeWorkspaceTab === 'overview'" class="dsm-info-card">
          <div class="dsm-info-row">
            <span class="dsm-info-label">数据源</span>
            <span class="dsm-info-value">{{ source ? source.name : "未选择" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">连接地址</span>
            <span class="dsm-info-value mono">{{ source ? `${source.host}:${source.port || 8086}` : "—" }}</span>
          </div>
          <div class="dsm-info-row" v-if="!isV3">
            <span class="dsm-info-label">组织 (Org)</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgName || source?.username || "自动探测" }}</span>
          </div>
          <div class="dsm-info-row" v-if="!isV3">
            <span class="dsm-info-label">Org ID</span>
            <span class="dsm-info-value mono">{{ orgInfo.orgId || "—" }}</span>
          </div>
          <div class="dsm-info-row">
            <span class="dsm-info-label">状态</span>
            <div class="dsm-info-status">
              <ReTag :type="gap ? 'danger' : 'success'" >{{ gap ? "读取失败" : "正常" }}</ReTag>
              <span class="dsm-info-sub">服务版本 {{ influxVersion || "未探测" }}</span>
            </div>
          </div>
        </div>

        <!-- 存储桶列表 -->
        <div v-if="activeWorkspaceTab === 'overview'" class="dsm-section">
          <div class="dsm-section-title">{{ isV3 ? "数据库列表" : "存储桶列表" }}</div>
          <ReTable
            :data="buckets"
            :columns="bucketColumns"
            :loading="loading"
            stripe
            border
            :layout-table="{ height: '300px' }"
            :context-menu="bucketTableMenu"
            @context-menu-select="onBucketTableMenuSelect"
          >
            <template #action="{ row }">
              <div class="dsm-row-ops">
                <ReButton icon="EditPen" layout="square" title="编辑保留期" @click="openEditRetention(row)" />
                <ReButton icon="Delete" layout="square" type="danger" title="删除" @click="confirmDeleteBucket(row)" />
              </div>
            </template>
          </ReTable>
        </div>

        <!-- 测量列表 -->
        <div class="dsm-section" v-if="activeWorkspaceTab === 'overview' && activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 测量列表
            <ReButton text @click="loadMeasurements">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
            <span class="dsm-section-hint">点击行按该度量生成{{ isV3 ? " SQL" : " Flux" }}查询</span>
          </div>
          <ReTable
            :data="measurements"
            :columns="measurementColumns"
            :loading="loading"
            stripe
            border
            :layout-table="{ height: '220px' }"
            @row-click="onMeasurementRowClick"
          />
        </div>

        <!-- 最近数据 -->
        <div class="dsm-section" v-if="activeWorkspaceTab === 'overview' && activeBucket">
          <div class="dsm-section-title">
            {{ activeBucket }} - 最近数据
            <ReButton text @click="loadBucketData">
              <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
            </ReButton>
          </div>
          <ReTable
            :data="recentData"
            :columns="dataColumns"
            :loading="dataLoading"
            stripe
            border
            :layout-table="{ height: '250px' }"
          />
        </div>

        <!-- 空状态 -->
        <div v-if="activeWorkspaceTab === 'overview' && !activeBucket && buckets.length === 0" class="dsm-empty">
          <ReIcon name="Collection" size="48" class="dsm-empty-icon" />
          <p>{{ gap ? (isV3 ? "未读取到真实数据库" : "未读取到真实存储桶") : (isV3 ? "暂无数据库，点击「刷新」重新加载" : "暂无存储桶，点击「刷新」重新加载") }}</p>
        </div>

        <!-- Flux 查询页签内容（对齐 jdbc 查询页：方钮工具栏 + 编辑器 + 结果表；多开、切换保留） -->
        <div
          v-for="t in queryTabs"
          v-show="activeWorkspaceTab === t.id"
          :key="t.id"
          class="dsm-query-area"
        >
          <div class="dsm-query-toolbar">
            <ReButton
              layout="square"
              type="primary"
              icon="VideoPlay"
              tip="执行（Ctrl+Enter）"
              data-testid="dsm-btn-exec"
              :loading="t.executing"
              @click="executeQuery(t)"
            />
            <ReButton
              layout="square"
              icon="Delete"
              tip="清空编辑器"
              data-testid="dsm-btn-clear"
              @click="t.flux = ''"
            />
            <span class="dsm-spacer" />
            <span class="dsm-query-hint">{{ isV3 ? "表/列名与 SQL 关键字输入即提示" : "桶/测量名与 Flux 函数输入即提示" }}</span>
          </div>
          <DbSqlEditor
            v-model="t.flux"
            :language="isV3 ? 'sql' : 'flux'"
            :keywords="isV3 ? [] : fluxKeywords"
            :tables="isV3 ? sqlTables : undefined"
            :column-resolver="isV3 ? resolveSqlColumns : undefined"
            data-testid="dsm-flux-editor"
            @execute="executeQuery(t)"
          />
          <div class="dsm-query-result">
            <div class="dsm-query-header">
              查询结果
              <span v-if="t.result.rows.length > 0" class="dsm-query-meta">
                {{ t.result.rows.length }} 行 · {{ t.elapsed }} ms
                <span v-if="t.truncated" class="dsm-query-warn">已截断，服务端共 {{ t.totalRows }} 行，请加 limit 或收窄时间窗</span>
              </span>
            </div>
            <ReTable
              v-if="t.result.columns.length > 0"
              :data="t.result.rows"
              :columns="t.result.columns"
              stripe
              border
              :layout-table="{ height: '360px' }"
            />
            <ReEmpty v-else description="执行查询后显示结果" />
          </div>
        </div>
      </div>
    </div>

    <!-- 新建 / 编辑 Bucket 弹窗 -->
    <ReDialog v-model="bucketDialogVisible" :title="bucketForm.id ? '编辑保留期' : (isV3 ? '新建数据库' : '新建 Bucket')" width="460px">
      <ReForm label-width="110px">
        <ReFormItem :label="isV3 ? '数据库名称' : 'Bucket 名称'" required>
          <ReInput v-model="bucketForm.name" :disabled="!!bucketForm.id" placeholder="如 telemetry" />
        </ReFormItem>
        <ReFormItem label="保留时长(小时)">
          <ReInputNumber v-model="bucketForm.retentionHours" :min="0" :step="24" placeholder="0 = 永久保留" />
          <span class="dsm-form-hint">0 表示永久保留</span>
        </ReFormItem>
        <ReFormItem v-if="!bucketForm.id" label="描述">
          <ReInput v-model="bucketForm.description" type="textarea" :rows="2" placeholder="可选" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="bucketDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="bucketSaving" @click="submitBucket">
          <template #icon><ReIcon name="Check" /></template>确定
        </ReButton>
      </template>
    </ReDialog>

    <!-- 数据浏览弹窗 -->
    <ReDialog v-model="browserVisible" :title="`数据浏览 · ${browserMeasurement}`" width="860px">
      <div class="dsm-browser-bar">
        <ReSelect v-model="browserRange" style="width: 130px" @change="runBrowserQuery">
          <ReOption label="最近 1 小时" value="-1h" />
          <ReOption label="最近 6 小时" value="-6h" />
          <ReOption label="最近 24 小时" value="-24h" />
          <ReOption label="最近 7 天" value="-7d" />
        </ReSelect>
        <ReSelect v-model="browserField" clearable placeholder="按 field 过滤" style="width: 160px" @change="runBrowserQuery">
          <ReOption v-for="f in browserFields" :key="f" :label="f" :value="f" />
        </ReSelect>
        <span class="dsm-browser-meta">{{ browserRows.length }} 行</span>
        <ReButton text @click="runBrowserQuery">
          <template #icon><ReIcon name="Refresh" size="12" /></template>刷新
        </ReButton>
      </div>
      <ReTable
        :data="browserRows"
        :columns="browserColumns"
        :loading="browserLoading"
        stripe
        border
        :layout-table="{ height: '360px' }"
      />
      <template #footer>
        <ReButton @click="browserVisible = false">关闭</ReButton>
      </template>
    </ReDialog>

    <!-- 写入数据弹窗 -->
    <ReDialog v-model="writeVisible" title="写入数据点" width="560px">
      <ReForm label-width="110px">
        <ReFormItem :label="isV3 ? '数据库' : 'Bucket'" required>
          <ReInput v-model="writeForm.bucket" :disabled="!!activeBucket" :placeholder="isV3 ? '数据库名' : 'Bucket 名'" />
        </ReFormItem>
        <ReFormItem label="Measurement" required>
          <ReInput v-model="writeForm.measurement" placeholder="如 cpu" />
        </ReFormItem>
        <ReFormItem label="Tags">
          <ReInput v-model="writeForm.tags" type="textarea" :rows="2" placeholder="key=value 每行一个，如：&#10;host=server01&#10;region=cn" />
        </ReFormItem>
        <ReFormItem label="Fields" required>
          <ReInput v-model="writeForm.fields" type="textarea" :rows="3" placeholder="key=value 每行一个，值自动识别数字/字符串，如：&#10;usage=82.5&#10;unit=percent" />
        </ReFormItem>
        <ReFormItem label="时间戳">
          <ReInput v-model="writeForm.timestamp" placeholder="留空 = 当前时间" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="writeVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="writeSaving" @click="submitWrite">
          <template #icon><ReIcon name="Check" /></template>写入
        </ReButton>
      </template>
    </ReDialog>
    <!-- 桶/测量行右键菜单（第九批统一 zk 模板） -->
    <DsmContextMenu
      v-model:visible="sideMenu.visible"
      :x="sideMenu.x"
      :y="sideMenu.y"
      :items="sideMenuItems"
      @select="onSideMenuSelect"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * InfluxDB 管理页
 *
 * <p>基于「数据源管理」登记的 influxdb 数据源，通过 /ms/monitor/influxdb/** 读取真实 Bucket、
 * 度量与 Flux 查询结果；接口缺失或连接失败时只展示失败原因，不回落任何演示数据。</p>
 * @author CH
 * @since 4.0.0
 */
// 卡片视觉统一底座（16px 圆角/透明边框/双层投影，见 packages/ui shared/re-surface.css）
import "@repo/ui/surface";
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { EditPen, CopyDocument, Delete } from "@element-plus/icons-vue";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
import ReForm from "@repo/ui/re-form";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import { ReFormItem, ReOption } from "@repo/ui/re-kit";
import MiddlewareGap from "../../components/console/MiddlewareGap.vue";
import { copyToClipboard } from "../../utils/clipboard";
import DsmContextMenu from "../../components/console/DsmContextMenu.vue";
import DbSqlEditor from "../../components/console/DbSqlEditor.vue";
import { useMiddlewareSource } from "../../utils/middlewareSource";
import { extraText } from "../../utils/externalDatasource";
import {
  fetchInfluxdbBuckets,
  fetchInfluxdbMeasurements,
  testInfluxdbConnection,
  type InfluxdbBucket,
  type InfluxdbMeasurement,
} from "../../api/manageConsoles";
import {
  createInfluxdbBucket,
  deleteInfluxdbBucket,
  fetchInfluxdbOrg,
  updateInfluxdbBucketRetention,
  writeInfluxdbPoints,
  type InfluxdbOrg,
} from "../../api/influxdbNginxApi";

import { useInfluxdbQuery, type Column } from "../../composables/useInfluxdbQuery";

const { datasourceId, source, gap, bind, fail, ready } = useMiddlewareSource();

/** 侧栏根节点名称：真实数据源名 */
const connectionName = computed(() => (source.value ? source.value.name : "InfluxDB 时序数据库"));

// 树状态
const expandedNodes = ref(new Set(["root", "buckets", "measurements"]));
const activeBucket = ref("");

// 数据
const loading = ref(false);
const dataLoading = ref(false);
const testing = ref(false);
const influxVersion = ref("");
/** 是否 InfluxDB 3.x（v3 为 Rust 重写：SQL/InfluxQL + 数据库模型，已移除 Flux 与组织） */
const isV3 = computed(() => influxVersion.value.startsWith("3"));
const buckets = ref<InfluxdbBucket[]>([]);

/** 桶/测量行右键菜单（第九批统一 zk 模板）：侧栏共用一个菜单实例，按 kind 切换条目 */
const sideMenu = reactive({ visible: false, x: 0, y: 0, kind: "bucket" as "bucket" | "measurement", key: "" });
const sideMenuItems = computed(() =>
  sideMenu.kind === "bucket"
    ? [
        { key: "view", label: isV3.value ? "查看该库数据" : "查看该桶数据", icon: "Collection" },
        { key: "copy", label: isV3.value ? "复制数据库名" : "复制桶名", icon: "Document" },
        { key: "delete", label: isV3.value ? "删除数据库" : "删除 Bucket", icon: "Delete", danger: true, divided: true },
      ]
    : [
        { key: "view", label: "查看该测量", icon: "TrendCharts" },
        { key: "copy", label: "复制名称", icon: "Document" },
      ],
);
/** 存储桶表格行右键（ReTable 内置菜单，图标为组件引用） */
const bucketTableMenu = computed(() => [
  { key: "retention", label: "编辑保留期", icon: EditPen },
  { key: "copy", label: isV3.value ? "复制数据库名" : "复制桶名", icon: CopyDocument },
  { key: "delete", label: isV3.value ? "删除数据库" : "删除 Bucket", icon: Delete, divided: true },
]);
/** 打开侧栏桶行右键菜单 */
function onBucketContextMenu(e: MouseEvent, name: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "bucket", key: name });
}
/** 打开侧栏测量行右键菜单 */
function onMeasurementContextMenu(e: MouseEvent, name: string) {
  Object.assign(sideMenu, { visible: true, x: e.clientX, y: e.clientY, kind: "measurement", key: name });
}
/** 复制文本（菜单动作共用） */
async function copyMenuText(text: string, okMsg: string) {
  if (await copyToClipboard(text)) message.success(okMsg);
  else message.error("复制失败");
}
/** 侧栏菜单分发 */
function onSideMenuSelect(action: string) {
  const name = sideMenu.key;
  if (!name) return;
  if (action === "copy") {
    copyMenuText(name, isV3.value ? "已复制数据库名" : "已复制名称");
    return;
  }
  if (action === "view") {
    if (sideMenu.kind === "bucket") selectBucket(name);
    else selectMeasurement(name);
    return;
  }
  if (action === "delete" && sideMenu.kind === "bucket") {
    const row = buckets.value.find(b => b.name === name);
    if (row) confirmDeleteBucket(row);
  }
}
/** 存储桶表格菜单分发 */
function onBucketTableMenuSelect(item: { key: string }, ctx: { row: Record<string, unknown> }) {
  const row = ctx.row as InfluxdbBucket;
  if (item.key === "retention") openEditRetention(row);
  else if (item.key === "copy") copyMenuText(String(row.name ?? ""), isV3.value ? "已复制数据库名" : "已复制桶名");
  else if (item.key === "delete") confirmDeleteBucket(row);
}
const measurements = ref<InfluxdbMeasurement[]>([]);

/** 查询能力收口：语句生成 + 执行 + 结果列推导（v2 Flux / v3 SQL 双版本，见 composable 文档） */
const {
  runQuery,
  buildDefaultStatement,
  buildBrowserStatement,
  deriveColumns,
  deriveFieldOptions,
  resolveSqlColumns,
} = useInfluxdbQuery({ datasourceId, isV3, activeBucket, measurements });

/**
 * 连接信息（地址/端口/组织/版本）。
 *
 * <p>由 {@code applyConnectionInfo()} 写入。当前模板不直接读取它，
 * 但保留写入行为以便后续展示，故此处补上声明（此前迁移遗漏导致引用悬空）。</p>
 */
const connectionInfo = { host: "-", port: 0, organization: "-", version: "-" };

/** 连通状态。同上：脚本内写入，模板暂未读取，保留写入行为 */
const connected = ref(false);
const recentData = ref<Record<string, unknown>[]>([]);

// 列定义
const bucketColumns: Column[] = [
  { prop: "name", label: "存储桶名称", minWidth: 180 },
  { prop: "retentionHours", label: "保留时长(h)", width: 120 },
  { prop: "createdAt", label: "创建时间", minWidth: 170 },
  { prop: "action", label: "操作", width: 130, slot: "action", fixed: "right" as const, align: "center" as const },
];
const measurementColumns: Column[] = [
  { prop: "name", label: "度量名称", minWidth: 160 },
  { prop: "fieldCount", label: "字段数", width: 90 },
  { prop: "tagCount", label: "标签数", width: 90 },
  { prop: "lastWriteTime", label: "最后写入", minWidth: 170 },
];
const dataColumns = computed<Column[]>(() => deriveColumns(recentData.value));

// Flux 查询（工作区页签：jdbc「查询 N」式，可多开、各自保留编辑器与结果）
interface QueryTab {
  id: string;
  title: string;
  flux: string;
  executing: boolean;
  elapsed: number;
  truncated: boolean;
  totalRows: number;
  result: { columns: Column[]; rows: Record<string, unknown>[] };
}
const queryTabs = ref<QueryTab[]>([]);
const activeWorkspaceTab = ref<string>("overview");
let queryTabSeq = 0;
/** Flux 补全候选：桶名 + 已加载的测量名（输入即提示，随数据异步刷新） */
const fluxKeywords = computed(() => [
  ...buckets.value.map(b => b.name),
  ...measurements.value.map(m => m.name),
]);
/** v3 SQL 编辑器的表候选：度量即 SQL 表 */
const sqlTables = computed(() => measurements.value.map(m => m.name));

// Org 信息
const orgInfo = ref<InfluxdbOrg>({ orgId: "", orgName: "" });

// Bucket 新建/编辑
const bucketDialogVisible = ref(false);
const bucketSaving = ref(false);
const bucketForm = ref<{ id: string; name: string; retentionHours: number; description: string }>({
  id: "",
  name: "",
  retentionHours: 0,
  description: "",
});

// 数据浏览
const browserVisible = ref(false);
const browserLoading = ref(false);
const browserMeasurement = ref("");
const browserRange = ref("-1h");
const browserField = ref("");
const browserFields = ref<string[]>([]);
const browserRows = ref<Record<string, unknown>[]>([]);
const browserColumns = ref<Column[]>([]);

// 写入数据点
const writeVisible = ref(false);
const writeSaving = ref(false);
const writeForm = ref({
  bucket: "",
  measurement: "",
  tags: "",
  fields: "",
  timestamp: "",
});

/**
 * 收集结果行的全部列（按首次出现顺序）
 * @param rows 结果行
 * @returns 列名数组
 */
function columnsOf(rows: Record<string, unknown>[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}

/**
 * 保留时长格式化
 * @param hours 保留小时数，0 或负数表示永久
 * @returns 可读文本
 */
function formatRetention(hours: number): string {
  if (!hours || hours <= 0) return "永久";
  if (hours % 24 === 0) return `${hours / 24}d`;
  if (hours % 60 === 0) return `${hours / 60}h`;
  return `${hours}h`;
}

/**
 * ISO 时间转为本地可读时间
 * @param value ISO 时间文本
 * @returns 本地时间文本
 */
function formatTime(value: unknown): string {
  const text = String(value ?? "");
  if (!text) return "-";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? text : date.toLocaleString();
}

/**
 * 回填连接信息（地址、组织）
 */
function applyConnectionInfo() {
  const info = source.value;
  connectionInfo.host = info?.host ?? "-";
  connectionInfo.port = info?.port ?? 0;
  connectionInfo.organization = extraText(info, ["organization", "org"], info?.database ?? "-");
}

/**
 * 展开/收起侧栏树节点
 * @param key 节点键
 */
function toggleNode(key: string) {
  if (expandedNodes.value.has(key)) {
    expandedNodes.value.delete(key);
  } else {
    expandedNodes.value.add(key);
  }
}

/**
 * 选中 Bucket 后加载度量与最近数据
 * @param name Bucket 名
 */
async function selectBucket(name: string) {
  activeBucket.value = name;
  await loadMeasurements();
  loadBucketData();
}

/**
 * 选中度量，按该度量新建一个查询页签并激活
 * @param name 度量名
 */
function selectMeasurement(name: string) {
  openQueryTab(
    isV3.value
      ? `SELECT * FROM "${name.replace(/"/g, '""')}" ORDER BY time DESC LIMIT 50`
      : `from(bucket: "${activeBucket.value}")\n  |> range(start: -1h)\n` +
        `  |> filter(fn: (r) => r._measurement == "${name}")\n  |> limit(n: 50)`
  );
}

/**
 * 加载当前 Bucket 下的度量列表
 */
async function loadMeasurements() {
  try {
    measurements.value = (await fetchInfluxdbMeasurements(datasourceId.value, activeBucket.value)) || [];
    ready();
  } catch (e) {
    measurements.value = [];
    fail(e, "/ms/monitor/influxdb/measurements");
  }
}

/**
 * 点击度量行打开数据浏览弹窗（时间范围 + 表格 + field 过滤）
 * @param row 度量行
 */
function onMeasurementRowClick(row: Record<string, unknown>) {
  const name = String(row?.name ?? "");
  if (name) {
    openBrowser(name);
  }
}

/**
 * 探测当前数据源的 InfluxDB 连通性并显示版本
 */
async function testConnection() {
  testing.value = true;
  try {
    const result = await testInfluxdbConnection({ datasourceId: datasourceId.value });
    if (result?.connected) {
      influxVersion.value = result.version || "";
      ready();
      message.success(result.version ? `连接成功 · InfluxDB ${result.version}` : "连接成功");
    } else {
      message.error(result?.message || "连接失败");
    }
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/test");
  } finally {
    testing.value = false;
  }
}

/**
 * 刷新 Bucket 列表，并在已选中 Bucket 时级联刷新度量
 */
async function refresh() {
  if (!source.value) {
    await bind("influxdb");
    if (!source.value) return;
  }
  loading.value = true;
  try {
    buckets.value = (await fetchInfluxdbBuckets(datasourceId.value)) || [];
    ready();
    await loadOrg();
    if (buckets.value.length > 0 && !buckets.value.some(b => b.name === activeBucket.value)) {
      selectBucket(buckets.value[0].name);
    } else if (activeBucket.value && buckets.value.some(b => b.name === activeBucket.value)) {
      // 已选中的库仍在列表中：同样级联刷新度量与最近数据（与函数文档一致）
      await loadMeasurements();
      loadBucketData();
    }
  } catch (e) {
    buckets.value = [];
    fail(e, "/ms/monitor/influxdb/buckets");
  } finally {
    loading.value = false;
  }
}

/**
 * 读取当前库的最近数据（v2 用 Flux，v3 用 SQL 取第一个度量的最近数据）
 */
async function loadBucketData() {
  if (!activeBucket.value) {
    recentData.value = [];
    return;
  }
  dataLoading.value = true;
  try {
    const statement = buildDefaultStatement();
    if (!statement) {
      // v3 且当前库尚无度量：无数据可取
      recentData.value = [];
      return;
    }
    const { rows } = await runQuery(statement);
    recentData.value = rows;
    ready();
  } catch (e) {
    recentData.value = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    dataLoading.value = false;
  }
}

/**
 * 新建一个查询页签并激活（jdbc「查询 N」式，可多开）
 * @param flux 预填语句，缺省按当前库生成
 * @returns 新页签
 */
function openQueryTab(flux?: string): QueryTab {
  const seq = ++queryTabSeq;
  const tab: QueryTab = {
    id: `q${seq}`,
    title: `查询 ${seq}`,
    flux: flux ?? buildDefaultStatement(),
    executing: false,
    elapsed: 0,
    truncated: false,
    totalRows: 0,
    result: { columns: [], rows: [] },
  };
  queryTabs.value.push(tab);
  activeWorkspaceTab.value = tab.id;
  return tab;
}

/**
 * 关闭查询页签；关的是当前页签时回退到相邻页签或总览
 * @param id 页签 ID
 */
function closeQueryTab(id: string) {
  const idx = queryTabs.value.findIndex(t => t.id === id);
  if (idx < 0) return;
  queryTabs.value.splice(idx, 1);
  if (activeWorkspaceTab.value === id) {
    const next = queryTabs.value[idx] || queryTabs.value[idx - 1];
    activeWorkspaceTab.value = next ? next.id : "overview";
  }
}

/**
 * 工具栏「Flux 查询」：新建一个查询页签
 */
function openQuery() {
  openQueryTab();
}

/**
 * 执行指定页签里的查询
 * @param tab 查询页签
 */
async function executeQuery(tab: QueryTab) {
  if (!tab.flux.trim()) {
    message.warning(isV3.value ? "请输入 SQL 查询语句" : "请输入 Flux 查询语句");
    return;
  }
  tab.executing = true;
  try {
    const res = await runQuery(tab.flux);
    tab.elapsed = res.elapsed;
    tab.truncated = res.truncated;
    tab.totalRows = res.totalRows;
    tab.result = { columns: deriveColumns(res.rows), rows: res.rows };
    ready();
  } catch (e) {
    tab.result = { columns: [], rows: [] };
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    tab.executing = false;
  }
}

/**
 * 加载当前数据源 Org 信息（v3 已移除组织概念，无需请求）
 */
async function loadOrg() {
  if (!datasourceId.value || isV3.value) return;
  try {
    orgInfo.value = (await fetchInfluxdbOrg(datasourceId.value)) || { orgId: "", orgName: "" };
  } catch {
    // Org 信息读取失败不阻断主流程
  }
}

/**
 * 打开新建 Bucket 弹窗
 */
function openCreateBucket() {
  bucketForm.value = { id: "", name: "", retentionHours: 0, description: "" };
  bucketDialogVisible.value = true;
}

/**
 * 打开编辑保留期弹窗
 * @param row Bucket 行
 */
function openEditRetention(row: InfluxdbBucket) {
  bucketForm.value = {
    id: row.id,
    name: row.name,
    retentionHours: row.retentionHours ?? 0,
    description: "",
  };
  bucketDialogVisible.value = true;
}

/**
 * 提交新建或编辑保留期
 */
async function submitBucket() {
  if (!bucketForm.value.name.trim()) {
    message.warning("请输入 Bucket 名称");
    return;
  }
  bucketSaving.value = true;
  try {
    if (bucketForm.value.id) {
      await updateInfluxdbBucketRetention(bucketForm.value.id, bucketForm.value.retentionHours, datasourceId.value);
      message.success("保留期已更新");
    } else {
      await createInfluxdbBucket({
        datasourceId: datasourceId.value,
        name: bucketForm.value.name.trim(),
        retentionHours: bucketForm.value.retentionHours,
        description: bucketForm.value.description,
      });
      message.success("Bucket 创建成功");
    }
    bucketDialogVisible.value = false;
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  } finally {
    bucketSaving.value = false;
  }
}

/**
 * 删除 Bucket / 数据库（二次确认）
 * @param row Bucket 行
 */
async function confirmDeleteBucket(row: InfluxdbBucket) {
  try {
    await ElMessageBox.confirm(
      isV3.value
        ? `确认删除数据库「${row.name}」？该操作会删除库内全部数据，不可恢复。`
        : `确认删除 Bucket「${row.name}」？该操作会删除桶内全部数据，不可恢复。`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" }
    );
  } catch {
    return;
  }
  try {
    await deleteInfluxdbBucket(row.id, datasourceId.value);
    message.success(isV3.value ? "数据库已删除" : "Bucket 已删除");
    if (activeBucket.value === row.name) activeBucket.value = "";
    await refresh();
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/bucket");
  }
}

/**
 * 打开数据浏览弹窗
 * @param measurement 度量名
 */
function openBrowser(measurement: string) {
  browserMeasurement.value = measurement;
  browserRange.value = "-1h";
  browserField.value = "";
  browserFields.value = [];
  browserRows.value = [];
  browserColumns.value = [];
  browserVisible.value = true;
  runBrowserQuery();
}

/**
 * 执行数据浏览查询（v2 走 Flux，v3 走 SQL）
 */
async function runBrowserQuery() {
  if (!activeBucket.value || !browserMeasurement.value) return;
  browserLoading.value = true;
  try {
    const statement = buildBrowserStatement(
      browserMeasurement.value,
      browserRange.value,
      browserField.value || undefined,
    );
    const { rows } = await runQuery(statement);
    browserRows.value = rows;
    browserColumns.value = deriveColumns(rows);
    browserFields.value = deriveFieldOptions(rows);
    ready();
  } catch (e) {
    browserRows.value = [];
    browserColumns.value = [];
    fail(e, "/ms/monitor/influxdb/query");
  } finally {
    browserLoading.value = false;
  }
}

/**
 * 打开写入数据点弹窗
 */
function openWritePoint() {
  writeForm.value = {
    bucket: activeBucket.value,
    measurement: browserMeasurement.value || "",
    tags: "",
    fields: "",
    timestamp: "",
  };
  writeVisible.value = true;
}

/**
 * 把多行 key=value 文本解析成有序字符串
 * @param text 多行文本
 * @param escapeValue 是否对值做 line protocol 转义
 * @returns 拼接好的 key=value 段
 */
function parseKv(text: string, escapeValue: boolean): string {
  const parts: string[] = [];
  for (const line of (text || "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const k = trimmed.slice(0, idx).trim();
    let v = trimmed.slice(idx + 1).trim();
    if (!k) continue;
    // 去掉值两侧引号
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    // line protocol 中 tag key/value 和 field key 不能有逗号空格
    const safeKey = k.replace(/,/g, "\\,").replace(/ /g, "\\ ");
    if (escapeValue) {
      // field 值：数字直接写，字符串加引号
      if (/^-?\d+(\.\d+)?$/.test(v)) {
        parts.push(`${safeKey}=${v}`);
      } else {
        parts.push(`${safeKey}="${v.replace(/"/g, '\\"')}"`);
      }
    } else {
      parts.push(`${safeKey}=${v.replace(/,/g, "\\,").replace(/ /g, "\\ ")}`);
    }
  }
  return parts.join(",");
}

/**
 * 提交写入数据点
 */
async function submitWrite() {
  if (!writeForm.value.bucket.trim()) {
    message.warning("请选择 Bucket");
    return;
  }
  if (!writeForm.value.measurement.trim()) {
    message.warning("请输入 Measurement");
    return;
  }
  if (!writeForm.value.fields.trim()) {
    message.warning("请至少填写一个 Field");
    return;
  }
  // measurement 转义
  const measurement = writeForm.value.measurement.trim().replace(/,/g, "\\,").replace(/ /g, "\\ ");
  const tags = parseKv(writeForm.value.tags, false);
  const fields = parseKv(writeForm.value.fields, true);
  if (!fields) {
    message.warning("Field 格式无效，应为 key=value");
    return;
  }
  let line = measurement;
  if (tags) line += "," + tags;
  line += " " + fields;
  if (writeForm.value.timestamp.trim()) {
    line += " " + writeForm.value.timestamp.trim();
  }
  writeSaving.value = true;
  try {
    await writeInfluxdbPoints({
      datasourceId: datasourceId.value,
      bucket: writeForm.value.bucket.trim(),
      precision: "ns",
      lines: line,
    });
    message.success("写入成功");
    writeVisible.value = false;
    // 写入后级联刷新度量与最近数据：新写入的测量要立刻出现在测量列表里
    if (activeBucket.value) await selectBucket(activeBucket.value);
  } catch (e) {
    fail(e, "/ms/monitor/influxdb/write");
  } finally {
    writeSaving.value = false;
  }
}

onMounted(async () => {
  await bind("influxdb");
  if (source.value) {
    await refresh();
  }
});

// 数据源变化（含首次进入）时整体刷新
//
// 触发源只能是 datasourceId，绝不能带上 gap：refresh() 内部的失败路径会调 fail()
// 改写 gap（每条文案还各带端点名：org 404 / measurements 403 / query 403 互不相同），
// 而 gap 一旦在监听源里，就等于让 refresh 自己触发下一次 refresh——一次 refresh
// 改 3~4 次 gap → 触发 3~4 次 refresh → 指数放大。实测该页在远端为 v1.11.8
// （Flux 403 + /api/v2/orgs 404）时 15 秒打了 1148 个请求（约 76 请求/秒），
// 页面主线程响应从 1ms 劣化到 548ms，浏览器被压崩、后端 OOM 死亡都是这一条引起的。
// 缺数据源的提示改为回调里直接读 gap.value：展示需要它，但不让它当触发器。
watch(
  datasourceId,
  async (id) => {
    applyConnectionInfo();
    if (!id) {
      buckets.value = [];
      measurements.value = [];
      recentData.value = [];
      activeBucket.value = "";
      connected.value = false;
      connectionInfo.version = "-";
      if (gap.value) message.warning(gap.value);
      return;
    }
    await refresh();
  },
  { immediate: true }
);

// 数据源信息变更时刷新连接信息展示
watch(source, applyConnectionInfo);
</script>

<style scoped>
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
  margin-bottom: 16px;
}

.dsm-toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dsm-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.dsm-title-icon {
  color: #34d399;
}

.dsm-toolbar-right {
  display: flex;
  gap: 8px;
}

.dsm-body {
  display: flex;
  flex: 1;
  gap: 16px;
  overflow: hidden;
}

.dsm-sidebar {
  width: 260px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow-y: auto;
  flex-shrink: 0;
}

.dsm-tree {
  padding: 8px 0;
}

.dsm-tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.15s;
}

.dsm-tree-node:hover {
  background: var(--bg-hover);
}

.dsm-tree-node.active {
  background: var(--brand-50);
  color: var(--brand-600);
}

.dsm-tree-root {
  font-weight: 600;
}

.dsm-tree-children {
  padding-left: 16px;
}

.dsm-tree-icon {
  flex-shrink: 0;
}

.dsm-influx-icon {
  color: #34d399;
}

.dsm-tree-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-primary);
}

.dsm-tree-count {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-fill);
  padding: 1px 6px;
  border-radius: 10px;
}

/* 工作区页签（jdbc dbm-tabs 式）：总览 + Flux 查询 */
.dsm-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border-subtle); flex-shrink: 0; }

.dsm-tab { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-tertiary); border-bottom: 2px solid transparent; transition: all 0.15s; user-select: none; }

.dsm-tab:hover { color: var(--text-primary); }

.dsm-tab.active { color: var(--brand-600); border-bottom-color: var(--brand-500); font-weight: 600; }

.dsm-tab-title { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.dsm-tab-close { opacity: 0.5; transition: opacity 0.15s ease; }

.dsm-tab-close:hover { opacity: 1; color: var(--el-color-danger); }

.dsm-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.dsm-info-card {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
}

.dsm-info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dsm-info-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-info-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.dsm-info-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-info-sub {
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-section-hint {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-query-warn {
  margin-left: 8px;
  color: var(--el-color-warning, #e6a23c);
}

.dsm-section {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
  flex-shrink: 0;
}

.dsm-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-tertiary);
}

.dsm-empty-icon {
  opacity: 0.3;
}

.dsm-query-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* 查询工具栏：对齐 jdbc 查询页（方钮 + 弹性占位 + 提示文案） */
.dsm-query-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dsm-spacer {
  flex: 1;
}

.dsm-query-hint {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary));
}

.dsm-query-editor {
  width: 100%;
  padding: 12px;
  font-family: "JetBrains Mono", "Consolas", monospace;
  font-size: 13px;
  border: 1px solid var(--border-default);
  border-radius: 6px;
  background: var(--bg-elevated);
  color: var(--text-primary);
  resize: vertical;
  outline: none;
}

.dsm-query-editor:focus {
  border-color: var(--brand-400);
  box-shadow: var(--focus-ring);
}

.dsm-query-result {
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  overflow: hidden;
}

.dsm-query-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--bg-fill);
  border-bottom: 1px solid var(--border-subtle);
}

.dsm-query-meta {
  font-size: 12px;
  font-weight: 400;
  color: var(--text-tertiary);
}

.dsm-row-ops {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.dsm-form-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.dsm-browser-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.dsm-browser-meta {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
