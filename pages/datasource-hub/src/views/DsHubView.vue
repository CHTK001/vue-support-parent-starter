<template>
  <div class="ds-hub">
    <el-tabs v-model="activeTab">
      <!-- ==================== 概览 ==================== -->
      <el-tab-pane label="概览" name="overview">
        <div class="ov-grid">
          <div class="ov-card">
            <div class="ov-num">{{ overview?.federationTotal ?? "-" }}</div>
            <div class="ov-label">联邦配置（启用 {{ overview?.federationEnabled ?? 0 }}）</div>
          </div>
          <div class="ov-card">
            <div class="ov-num">{{ overview?.shardingTotal ?? "-" }}</div>
            <div class="ov-label">分片规则（启用 {{ overview?.shardingEnabled ?? 0 }}）</div>
          </div>
          <div class="ov-card">
            <div class="ov-num">{{ overview?.activeCalciteMembers ?? "-" }}</div>
            <div class="ov-label">生效联邦成员</div>
          </div>
          <div class="ov-card">
            <div class="ov-num">{{ overview?.activeShardingTables ?? "-" }}</div>
            <div class="ov-label">生效逻辑表</div>
          </div>
        </div>
        <div class="ov-status">
          <div>Calcite 最近刷新：{{ overview?.calciteLastRefreshAt || "尚未刷新" }}　{{ overview?.calciteLastRefreshResult || "" }}</div>
          <div>分片最近刷新：{{ overview?.shardingLastRefreshAt || "尚未刷新" }}　{{ overview?.shardingLastRefreshResult || "" }}</div>
        </div>
        <div class="ov-actions">
          <el-button type="primary" :loading="refreshing === 'calcite'" @click="doRefresh('calcite')">手动刷新联邦</el-button>
          <el-button type="primary" :loading="refreshing === 'sharding'" @click="doRefresh('sharding')">手动刷新分片</el-button>
          <el-button @click="loadAll">重新加载</el-button>
        </div>
      </el-tab-pane>

      <!-- ==================== Calcite 联邦 ==================== -->
      <el-tab-pane label="Calcite 联邦" name="calcite">
        <div class="toolbar">
          <el-button type="primary" @click="openFederationDialog()">新建联邦</el-button>
          <el-button :loading="refreshing === 'calcite'" @click="doRefresh('calcite')">手动刷新</el-button>
        </div>
        <el-table :data="federations" border size="small">
          <el-table-column prop="schemaName" label="Schema 名" min-width="130" />
          <el-table-column prop="defaultSchema" label="默认 Schema" min-width="120" />
          <el-table-column label="成员数" width="80">
            <template #default="{ row }">{{ row.memberList?.length ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                {{ row.enabled === 1 ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="140" show-overflow-tooltip />
          <el-table-column label="更新时间" width="160">
            <template #default="{ row }">{{ fmtTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openFederationDialog(row as DsCalciteFederation)">编辑</el-button>
              <el-button link type="danger" size="small" @click="removeFederation(row as DsCalciteFederation)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="sql-box">
          <div class="sql-title">联邦 SQL 试跑（仅 SELECT / WITH / SHOW / EXPLAIN，最多返回 200 行）</div>
          <el-input v-model="calciteSql" type="textarea" :rows="3"
            placeholder="SELECT * FROM 联邦Schema.物理表名 LIMIT 10" />
          <div class="sql-actions">
            <el-button type="primary" :loading="running === 'calcite'" @click="runCalciteQuery">试跑</el-button>
          </div>
          <QueryResultTable :result="calciteResult" />
        </div>
      </el-tab-pane>

      <!-- ==================== 分库分表 ==================== -->
      <el-tab-pane label="分库分表" name="sharding">
        <div class="toolbar">
          <el-button type="primary" @click="openRuleDialog()">新建分片规则</el-button>
          <el-button :loading="refreshing === 'sharding'" @click="doRefresh('sharding')">手动刷新</el-button>
        </div>
        <el-table :data="rules" border size="small">
          <el-table-column prop="logicTable" label="逻辑表" min-width="130" />
          <el-table-column prop="shardingColumn" label="分片列" min-width="110" />
          <el-table-column label="算法" width="170">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.algorithm }}</el-tag>
              <span v-if="row.algorithm === 'MOD'" class="algo-detail">× {{ row.shardCount }}</span>
              <span v-else class="algo-detail">{{ row.timeUnit }} {{ row.timeLower }}~{{ row.timeUpper }}</span>
            </template>
          </el-table-column>
          <el-table-column label="分库数" width="80">
            <template #default="{ row }">{{ row.dbMemberList?.length ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                {{ row.enabled === 1 ? "启用" : "停用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="120" show-overflow-tooltip />
          <el-table-column label="更新时间" width="160">
            <template #default="{ row }">{{ fmtTime(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openRuleDialog(row as DsShardingRule)">编辑</el-button>
              <el-button link type="danger" size="small" @click="removeRule(row as DsShardingRule)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="sql-box">
          <div class="sql-title">分片 SQL 试跑（SELECT 类，最多返回 200 行）</div>
          <el-input v-model="shardingSql" type="textarea" :rows="3"
            placeholder="SELECT * FROM 逻辑表名 LIMIT 10" />
          <div class="sql-actions">
            <el-button type="primary" :loading="running === 'sharding'" @click="runShardingQuery">试跑</el-button>
          </div>
          <QueryResultTable :result="shardingResult" />
        </div>
      </el-tab-pane>

      <!-- ==================== 物理表管理 ==================== -->
      <el-tab-pane label="物理表管理" name="tables">
        <div class="pt-rule">
          <el-select v-model="ptRuleId" placeholder="选择分片规则" style="width: 320px" @change="loadPhysicalTables">
            <el-option v-for="rule in rules" :key="rule.id" :value="rule.id!"
              :label="`${rule.logicTable}（${rule.algorithm}）`" />
          </el-select>
          <span class="pt-hint">仅开放受限 DDL：按规则幂等补建分片表（CREATE TABLE IF NOT EXISTS）与追加列（已存在即跳过）</span>
        </div>

        <template v-if="ptRule">
          <div class="pt-section">
            <div class="pt-title">已存在物理表（information_schema 前缀匹配）</div>
            <el-table :data="ptRows" border size="small">
              <el-table-column prop="db" label="分库" width="220" />
              <el-table-column label="物理表" min-width="400">
                <template #default="{ row }">
                  <template v-if="row.tables.length">
                    <el-tag v-for="t in row.tables" :key="t" size="small" class="pt-tag">{{ t }}</el-tag>
                  </template>
                  <span v-else class="pt-none">（无）</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="pt-section">
            <div class="pt-title">补建分片表（模板 DDL，表名写逻辑表名，执行时逐分片改写 + IF NOT EXISTS）</div>
            <el-input v-model="createDdl" type="textarea" :rows="5"
              :placeholder="`CREATE TABLE ${ptRule.logicTable} (\n  id BIGINT PRIMARY KEY,\n  ...\n)`" />
            <div class="pt-actions">
              <el-button @click="doPreviewCreate">预览 DDL</el-button>
              <el-button type="primary" @click="doApplyCreate">执行补建</el-button>
              <span class="pt-hint">补建成功后自动刷新分片数据源，使新表纳入路由</span>
            </div>
            <DdlResultTable :rows="createResults" />
          </div>

          <div class="pt-section">
            <div class="pt-title">追加列（ALTER TABLE 逻辑表名 ADD COLUMN ...，已存在同名列自动跳过）</div>
            <el-input v-model="addColumnDdl" type="textarea" :rows="3"
              :placeholder="`ALTER TABLE ${ptRule.logicTable} ADD COLUMN remark VARCHAR(255)`" />
            <div class="pt-actions">
              <el-button @click="doPreviewAddColumn">预览 DDL</el-button>
              <el-button type="primary" @click="doApplyAddColumn">执行追加</el-button>
            </div>
            <DdlResultTable :rows="addColumnResults" />
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 联邦编辑弹窗 ==================== -->
    <el-dialog v-model="fedDialogVisible" :title="fedForm.id ? '编辑联邦' : '新建联邦'" width="920px" append-to-body
      destroy-on-close>
      <el-form label-width="110px" size="default">
        <el-form-item label="Schema 名" required>
          <el-input v-model="fedForm.schemaName" placeholder="联邦对外 schema 名，如 fed_core" style="width: 320px" />
        </el-form-item>
        <el-form-item label="默认 Schema">
          <el-select v-model="fedForm.defaultSchema" clearable placeholder="SQL 未限定 schema 时使用" style="width: 320px">
            <el-option v-for="m in fedMembers" :key="m.schemaName" :value="m.schemaName"
              :label="m.schemaName || '（未命名）'" />
          </el-select>
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="fedEnabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="fedForm.remark" style="width: 480px" />
        </el-form-item>
      </el-form>
      <div class="member-head">
        成员库（从数据源台账选择自动带出连接参数；密码后端不回传，需手填）
        <el-button size="small" type="primary" link @click="addFedMember">+ 添加成员</el-button>
      </div>
      <el-table :data="fedMembers" border size="small">
        <el-table-column label="Schema 名" min-width="120">
          <template #default="{ row }"><el-input v-model="row.schemaName" size="small" placeholder="schema 名" /></template>
        </el-table-column>
        <el-table-column label="台账数据源" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.sourceId" size="small" clearable filterable placeholder="选择台账库"
              @change="(v: unknown) => applyLedgerToFedMember(row as FedMemberRow, v)">
              <el-option v-for="ds in ledger" :key="ds.id" :value="ds.id!" :label="ds.name" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="JDBC URL" min-width="250">
          <template #default="{ row }"><el-input v-model="row.url" size="small" placeholder="jdbc:..." /></template>
        </el-table-column>
        <el-table-column label="用户名" min-width="110">
          <template #default="{ row }"><el-input v-model="row.username" size="small" /></template>
        </el-table-column>
        <el-table-column label="密码" min-width="110">
          <template #default="{ row }"><el-input v-model="row.password" size="small" type="password"
              show-password /></template>
        </el-table-column>
        <el-table-column label="驱动类" min-width="170">
          <template #default="{ row }"><el-input v-model="row.driverClassName" size="small"
              placeholder="留空自动探测" /></template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="fedMembers.splice($index, 1)">删</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="fedDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitFederation">保存并生效</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 分片规则编辑弹窗 ==================== -->
    <el-dialog v-model="ruleDialogVisible" :title="ruleForm.id ? '编辑分片规则' : '新建分片规则'" width="920px"
      append-to-body destroy-on-close>
      <el-form label-width="110px" size="default">
        <el-form-item label="逻辑表名" required>
          <el-input v-model="ruleForm.logicTable" placeholder="同时作为物理表名前缀，如 t_order" style="width: 320px" />
        </el-form-item>
        <el-form-item label="分片列" required>
          <el-input v-model="ruleForm.shardingColumn" placeholder="如 user_id" style="width: 320px" />
        </el-form-item>
        <el-form-item label="分片算法">
          <el-radio-group v-model="ruleForm.algorithm">
            <el-radio-button value="MOD">MOD（取模）</el-radio-button>
            <el-radio-button value="INTERVAL">INTERVAL（时间范围）</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="ruleForm.algorithm === 'MOD'" label="分片数">
          <el-input-number v-model="ruleShardCount" :min="2" :max="1024" />
        </el-form-item>
        <template v-else>
          <el-form-item label="时间粒度">
            <el-select v-model="ruleForm.timeUnit" style="width: 200px" placeholder="选择时间粒度">
              <el-option v-for="u in TIME_UNITS" :key="u" :value="u" :label="u" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间下界">
            <el-date-picker v-model="ruleTimeLower" type="date" value-format="YYYY-MM-DD"
              placeholder="默认 2000-01-01" />
          </el-form-item>
          <el-form-item label="时间上界">
            <el-date-picker v-model="ruleTimeUpper" type="date" value-format="YYYY-MM-DD"
              placeholder="默认 2099-12-31" />
          </el-form-item>
        </template>
        <el-form-item label="启用">
          <el-switch v-model="ruleEnabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="ruleForm.remark" style="width: 480px" />
        </el-form-item>
      </el-form>
      <div class="member-head">
        分库成员（URL 留空 = 引用已注册数据源名；从台账选择自动带出连接参数，密码需手填）
        <el-button size="small" type="primary" link @click="addRuleDb">+ 添加分库</el-button>
      </div>
      <el-table :data="ruleDbs" border size="small">
        <el-table-column label="分库名" min-width="120">
          <template #default="{ row }"><el-input v-model="row.name" size="small" placeholder="如 ds_0" /></template>
        </el-table-column>
        <el-table-column label="台账数据源" min-width="180">
          <template #default="{ row }">
            <el-select v-model="row.sourceId" size="small" clearable filterable placeholder="选择台账库"
              @change="(v: unknown) => applyLedgerToDb(row as RuleDbRow, v)">
              <el-option v-for="ds in ledger" :key="ds.id" :value="ds.id!" :label="ds.name" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="JDBC URL（可空=引用已注册名）" min-width="250">
          <template #default="{ row }"><el-input v-model="row.url" size="small" placeholder="jdbc:... 或留空" /></template>
        </el-table-column>
        <el-table-column label="用户名" min-width="110">
          <template #default="{ row }"><el-input v-model="row.username" size="small" /></template>
        </el-table-column>
        <el-table-column label="密码" min-width="110">
          <template #default="{ row }"><el-input v-model="row.password" size="small" type="password"
              show-password /></template>
        </el-table-column>
        <el-table-column label="驱动类" min-width="170">
          <template #default="{ row }"><el-input v-model="row.driverClassName" size="small"
              placeholder="留空自动探测" /></template>
        </el-table-column>
        <el-table-column label="操作" width="60" fixed="right">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="ruleDbs.splice($index, 1)">删</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitRule">保存并生效</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, type PropType, type VNode } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ElButton, ElDatePicker, ElDialog, ElForm, ElFormItem, ElInput, ElInputNumber, ElOption, ElRadioButton, ElRadioGroup, ElSelect, ElSwitch, ElTabPane, ElTable, ElTableColumn, ElTabs, ElTag } from "element-plus";
import { fetchDataSources, type DataSourceInfo } from "@pages/datasource/src/api";
import {
  applyAddColumn, applyCreate, deleteFederation, deleteShardingRule, fetchOverview, listFederations,
  listPhysicalTables, listShardingRules, previewAddColumn, previewCreate, queryFederation, querySharding,
  refreshFederations, refreshSharding, saveFederation, saveShardingRule,
  type DdlStepResult, type DsCalciteFederation, type DsQueryResult, type DsRuntimeOverview,
  type DsShardingRule, type FederationMember, type ShardingDbMember,
} from "../api/dsHubApi";

defineOptions({ name: "DsHubView" });

const TIME_UNITS = ["YEAR", "QUARTER", "MONTH", "WEEK", "DAY", "HOUR"] as const;

// ==================== 全局状态 ====================
const activeTab = ref("overview");
const overview = ref<DsRuntimeOverview | null>(null);
const federations = ref<DsCalciteFederation[]>([]);
const rules = ref<DsShardingRule[]>([]);
const saving = ref(false);
const refreshing = ref<"" | "calcite" | "sharding">("");
const running = ref<"" | "calcite" | "sharding">("");

// 台账（惰性加载）
const ledger = ref<DataSourceInfo[]>([]);
let ledgerLoaded = false;
async function ensureLedger(): Promise<DataSourceInfo[]> {
  if (!ledgerLoaded) {
    ledger.value = await fetchDataSources();
    ledgerLoaded = true;
  }
  return ledger.value;
}

// ==================== 工具 ====================
function fmtTime(epoch?: number | null): string {
  if (!epoch) return "-";
  const d = new Date(epoch);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** SQL 试跑结果表：rows 是数组的数组，按列下标转成行对象渲染 */
const QueryResultTable = defineComponent({
  props: { result: { type: Object as PropType<DsQueryResult | null>, default: null } },
  setup(props) {
    const rows = computed(() =>
      (props.result?.rows ?? []).map((r) =>
        Object.fromEntries(r.map((v, i) => [String(i), v] as [string, unknown])),
      ),
    );
    const fmt = (v: unknown): string => (v === null || v === undefined ? "NULL" : String(v));
    return () => {
      if (!props.result) return null as unknown as VNode;
      return h("div", { class: "qr" }, [
        h(ElTable, { data: rows.value, border: true, size: "small", maxHeight: 360 }, {
          default: () => props.result!.columns.map((c, i) =>
            h(ElTableColumn, { key: i, label: c, prop: String(i), minWidth: 120 }, {
              default: ({ row }: { row: Record<string, unknown> }) => fmt(row[String(i)]),
            }),
          ),
        }),
        h("div", { class: "sql-meta" },
          `${props.result.rowCount} 行${props.result.truncated ? "（已截断，仅显示前 200 行）" : ""} · ${props.result.elapsedMs}ms`),
      ]);
    };
  },
});

/** DDL 执行/预览结果表 */
const DdlResultTable = defineComponent({
  props: { rows: { type: Array as PropType<DdlStepResult[]>, default: () => [] } },
  setup(props) {
    return () => {
      if (!props.rows.length) return null as unknown as VNode;
      return h(ElTable, { data: props.rows, border: true, size: "small", class: "ddl-result" }, {
        default: () => [
          h(ElTableColumn, { prop: "db", label: "分库", minWidth: 160 }),
          h(ElTableColumn, { prop: "table", label: "物理表", minWidth: 160 }),
          h(ElTableColumn, { label: "结果", width: 110 }, {
            default: ({ row }: { row: DdlStepResult }) => {
              if (row.skipped) return h(ElTag, { size: "small", type: "warning" }, () => "跳过");
              if (row.success === true) return h(ElTag, { size: "small", type: "success" }, () => "成功");
              if (row.success === false) return h(ElTag, { size: "small", type: "danger" }, () => "失败");
              return h(ElTag, { size: "small", type: "info" }, () => "待执行");
            },
          }),
          h(ElTableColumn, { prop: "message", label: "说明", minWidth: 160, showOverflowTooltip: true }),
          h(ElTableColumn, { prop: "sql", label: "SQL", minWidth: 260, showOverflowTooltip: true }),
        ],
      });
    };
  },
});

// ==================== 加载 ====================
async function loadOverview() {
  try {
    overview.value = await fetchOverview();
  } catch (e) {
    ElMessage.error(`加载概览失败：${errMsg(e)}`);
  }
}

async function loadFederations() {
  try {
    federations.value = await listFederations();
  } catch (e) {
    ElMessage.error(`加载联邦配置失败：${errMsg(e)}`);
  }
}

async function loadRules() {
  try {
    rules.value = await listShardingRules();
  } catch (e) {
    ElMessage.error(`加载分片规则失败：${errMsg(e)}`);
  }
}

async function loadAll() {
  await Promise.all([loadOverview(), loadFederations(), loadRules()]);
}

onMounted(loadAll);

async function doRefresh(kind: "calcite" | "sharding") {
  refreshing.value = kind;
  try {
    const res = kind === "calcite" ? await refreshFederations() : await refreshSharding();
    ElMessage.success(`刷新完成：${res.message || "OK"}`);
    await loadAll();
  } catch (e) {
    ElMessage.error(`刷新失败：${errMsg(e)}`);
  } finally {
    refreshing.value = "";
  }
}

// ==================== Calcite 联邦编辑 ====================
const fedDialogVisible = ref(false);
const fedEnabled = ref(true);
const fedForm = reactive<DsCalciteFederation>({ schemaName: "", defaultSchema: "", enabled: 1, remark: "" });
interface FedMemberRow extends FederationMember {
  sourceId?: number | null;
}
const fedMembers = ref<FedMemberRow[]>([]);

function openFederationDialog(row?: DsCalciteFederation) {
  ensureLedger().catch(() => undefined);
  fedForm.id = row?.id;
  fedForm.schemaName = row?.schemaName ?? "";
  fedForm.defaultSchema = row?.defaultSchema ?? "";
  fedForm.remark = row?.remark ?? "";
  fedEnabled.value = row?.enabled !== 0;
  fedMembers.value = (row?.memberList ?? []).map((m) => ({ ...m, sourceId: null }));
  fedDialogVisible.value = true;
}

function addFedMember() {
  fedMembers.value.push({ schemaName: "", url: "", username: "", password: "", driverClassName: "", sourceId: null });
}

/** 台账行 → 联邦成员连接参数（密码后端不回传，保留手填） */
function applyLedgerToFedMember(row: FedMemberRow, value: unknown) {
  const ds = ledger.value.find((d) => d.id === Number(value));
  if (!ds) return;
  row.url = ds.jdbcUrl || ds.database || "";
  row.username = ds.username ?? "";
  row.driverClassName = ds.driverClassName ?? "";
}

async function submitFederation() {
  if (!fedForm.schemaName?.trim()) {
    ElMessage.warning("请填写联邦 Schema 名");
    return;
  }
  const members = fedMembers.value.filter((m) => m.schemaName?.trim() || m.url?.trim());
  if (!members.length) {
    ElMessage.warning("请至少添加一个联邦成员");
    return;
  }
  for (const m of members) {
    if (!m.schemaName?.trim() || !m.url?.trim()) {
      ElMessage.warning("每个成员都需要 Schema 名与 JDBC URL");
      return;
    }
  }
  saving.value = true;
  try {
    await saveFederation({
      ...fedForm,
      enabled: fedEnabled.value ? 1 : 0,
      memberList: members.map((m) => ({
        schemaName: m.schemaName.trim(),
        url: m.url.trim(),
        username: m.username || null,
        password: m.password || null,
        driverClassName: m.driverClassName || null,
      })),
    });
    ElMessage.success("联邦已保存并即时生效");
    fedDialogVisible.value = false;
    await loadAll();
  } catch (e) {
    ElMessage.error(`保存失败：${errMsg(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeFederation(row: DsCalciteFederation) {
  try {
    await ElMessageBox.confirm(`确认删除联邦「${row.schemaName}」？删除后立即生效且不可恢复。`, "删除联邦", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return; // 用户取消
  }
  try {
    await deleteFederation(row.id!);
    ElMessage.success("联邦已删除并即时生效");
    await loadAll();
  } catch (e) {
    ElMessage.error(`删除失败：${errMsg(e)}`);
  }
}

// ==================== 分片规则编辑 ====================
const ruleDialogVisible = ref(false);
const ruleEnabled = ref(true);
const ruleShardCount = ref(16);
const ruleTimeLower = ref<string>("");
const ruleTimeUpper = ref<string>("");
const ruleForm = reactive<DsShardingRule>({
  logicTable: "", shardingColumn: "", algorithm: "MOD", shardCount: 16,
  timeUnit: "MONTH", timeLower: "", timeUpper: "", enabled: 1, remark: "",
});
interface RuleDbRow extends ShardingDbMember {
  sourceId?: number | null;
}
const ruleDbs = ref<RuleDbRow[]>([]);

function openRuleDialog(row?: DsShardingRule) {
  ensureLedger().catch(() => undefined);
  ruleForm.id = row?.id;
  ruleForm.logicTable = row?.logicTable ?? "";
  ruleForm.shardingColumn = row?.shardingColumn ?? "";
  ruleForm.algorithm = row?.algorithm ?? "MOD";
  ruleForm.timeUnit = row?.timeUnit ?? "MONTH";
  ruleForm.remark = row?.remark ?? "";
  ruleShardCount.value = row?.shardCount ?? 16;
  ruleTimeLower.value = row?.timeLower ?? "";
  ruleTimeUpper.value = row?.timeUpper ?? "";
  ruleEnabled.value = row?.enabled !== 0;
  ruleDbs.value = (row?.dbMemberList ?? []).map((m) => ({ ...m, sourceId: null }));
  ruleDialogVisible.value = true;
}

function addRuleDb() {
  ruleDbs.value.push({ name: "", url: "", username: "", password: "", driverClassName: "", sourceId: null });
}

function applyLedgerToDb(row: RuleDbRow, value: unknown) {
  const ds = ledger.value.find((d) => d.id === Number(value));
  if (!ds) return;
  row.url = ds.jdbcUrl || ds.database || "";
  row.username = ds.username ?? "";
  row.driverClassName = ds.driverClassName ?? "";
}

async function submitRule() {
  if (!ruleForm.logicTable?.trim() || !ruleForm.shardingColumn?.trim()) {
    ElMessage.warning("请填写逻辑表名与分片列");
    return;
  }
  const dbs = ruleDbs.value.filter((m) => m.name?.trim());
  if (!dbs.length) {
    ElMessage.warning("请至少添加一个分库成员");
    return;
  }
  for (const m of dbs) {
    if (!m.name.trim()) {
      ElMessage.warning("分库名不能为空");
      return;
    }
  }
  saving.value = true;
  try {
    await saveShardingRule({
      ...ruleForm,
      shardCount: ruleForm.algorithm === "MOD" ? ruleShardCount.value : undefined,
      timeUnit: ruleForm.algorithm === "INTERVAL" ? ruleForm.timeUnit : undefined,
      timeLower: ruleForm.algorithm === "INTERVAL" ? ruleTimeLower.value || null : undefined,
      timeUpper: ruleForm.algorithm === "INTERVAL" ? ruleTimeUpper.value || null : undefined,
      enabled: ruleEnabled.value ? 1 : 0,
      dbMemberList: dbs.map((m) => ({
        name: m.name.trim(),
        url: m.url?.trim() || null,
        username: m.username || null,
        password: m.password || null,
        driverClassName: m.driverClassName || null,
      })),
    });
    ElMessage.success("分片规则已保存并即时生效");
    ruleDialogVisible.value = false;
    await loadAll();
  } catch (e) {
    ElMessage.error(`保存失败：${errMsg(e)}`);
  } finally {
    saving.value = false;
  }
}

async function removeRule(row: DsShardingRule) {
  try {
    await ElMessageBox.confirm(`确认删除分片规则「${row.logicTable}」？删除后立即生效且不可恢复。`, "删除分片规则", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch {
    return; // 用户取消
  }
  try {
    await deleteShardingRule(row.id!);
    ElMessage.success("分片规则已删除并即时生效");
    if (ptRuleId.value === row.id) {
      ptRuleId.value = null;
    }
    await loadAll();
  } catch (e) {
    ElMessage.error(`删除失败：${errMsg(e)}`);
  }
}

// ==================== SQL 试跑 ====================
const calciteSql = ref("");
const shardingSql = ref("");
const calciteResult = ref<DsQueryResult | null>(null);
const shardingResult = ref<DsQueryResult | null>(null);

async function runCalciteQuery() {
  if (!calciteSql.value.trim()) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  running.value = "calcite";
  try {
    calciteResult.value = await queryFederation(calciteSql.value.trim());
  } catch (e) {
    calciteResult.value = null;
    ElMessage.error(`试跑失败：${errMsg(e)}`);
  } finally {
    running.value = "";
  }
}

async function runShardingQuery() {
  if (!shardingSql.value.trim()) {
    ElMessage.warning("请输入 SQL");
    return;
  }
  running.value = "sharding";
  try {
    shardingResult.value = await querySharding(shardingSql.value.trim());
  } catch (e) {
    shardingResult.value = null;
    ElMessage.error(`试跑失败：${errMsg(e)}`);
  } finally {
    running.value = "";
  }
}

// ==================== 物理表管理 ====================
const ptRuleId = ref<number | null>(null);
const ptTables = ref<Record<string, string[]>>({});
const createDdl = ref("");
const addColumnDdl = ref("");
const createResults = ref<DdlStepResult[]>([]);
const addColumnResults = ref<DdlStepResult[]>([]);

const ptRule = computed(() => rules.value.find((r) => r.id === ptRuleId.value) ?? null);
const ptRows = computed(() =>
  Object.entries(ptTables.value).map(([db, tables]) => ({ db, tables })),
);

async function loadPhysicalTables() {
  createResults.value = [];
  addColumnResults.value = [];
  if (!ptRuleId.value) {
    ptTables.value = {};
    return;
  }
  try {
    ptTables.value = await listPhysicalTables(ptRuleId.value);
  } catch (e) {
    ptTables.value = {};
    ElMessage.error(`加载物理表失败：${errMsg(e)}`);
  }
}

async function doPreviewCreate() {
  if (!ptRuleId.value) return;
  try {
    createResults.value = await previewCreate(ptRuleId.value, createDdl.value.trim());
  } catch (e) {
    ElMessage.error(`预览失败：${errMsg(e)}`);
  }
}

async function doApplyCreate() {
  if (!ptRuleId.value) return;
  try {
    await ElMessageBox.confirm("确认执行补建？将对每个分片执行幂等 CREATE TABLE IF NOT EXISTS。", "执行补建", {
      type: "warning", confirmButtonText: "执行", cancelButtonText: "取消",
    });
  } catch {
    return; // 用户取消
  }
  try {
    createResults.value = await applyCreate(ptRuleId.value, createDdl.value.trim());
    const failed = createResults.value.filter((r) => r.success === false).length;
    if (failed) {
      ElMessage.warning(`补建完成，${failed} 个分库执行失败，详见结果表`);
    } else {
      ElMessage.success("补建完成，正在刷新分片数据源使新表纳入路由");
    }
    // 新物理表必须 refresh 重新 convert 才会纳入路由
    try {
      await refreshSharding();
    } catch {
      /* 刷新失败不掩盖补建结果 */
    }
    await Promise.all([loadPhysicalTables(), loadAll()]);
  } catch (e) {
    ElMessage.error(`补建失败：${errMsg(e)}`);
  }
}

async function doPreviewAddColumn() {
  if (!ptRuleId.value) return;
  try {
    addColumnResults.value = await previewAddColumn(ptRuleId.value, addColumnDdl.value.trim());
  } catch (e) {
    ElMessage.error(`预览失败：${errMsg(e)}`);
  }
}

async function doApplyAddColumn() {
  if (!ptRuleId.value) return;
  try {
    await ElMessageBox.confirm("确认执行追加列？已存在同名列的分库将自动跳过。", "执行追加列", {
      type: "warning", confirmButtonText: "执行", cancelButtonText: "取消",
    });
  } catch {
    return; // 用户取消
  }
  try {
    addColumnResults.value = await applyAddColumn(ptRuleId.value, addColumnDdl.value.trim());
    const skipped = addColumnResults.value.filter((r) => r.skipped).length;
    const failed = addColumnResults.value.filter((r) => r.success === false).length;
    if (failed) {
      ElMessage.warning(`追加完成，${failed} 个分库执行失败，详见结果表`);
    } else if (skipped) {
      ElMessage.success(`追加完成（${skipped} 个分库列已存在，自动跳过）`);
    } else {
      ElMessage.success("追加完成");
    }
    await loadPhysicalTables();
  } catch (e) {
    ElMessage.error(`追加失败：${errMsg(e)}`);
  }
}
</script>

<style scoped>
.ds-hub {
  padding: 12px 16px;
}

.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.ov-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.ov-card {
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
}

.ov-num {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.2;
}

.ov-label {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.ov-status {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.9;
  margin-bottom: 12px;
}

.ov-actions {
  display: flex;
  gap: 8px;
}

.sql-box {
  margin-top: 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 12px;
}

.sql-title {
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 13px;
}

.sql-actions {
  margin: 8px 0;
}

.sql-meta {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.member-head {
  font-size: 13px;
  font-weight: 600;
  margin: 4px 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.algo-detail {
  margin-left: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.pt-rule {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pt-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.pt-section {
  margin-top: 16px;
}

.pt-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 8px;
}

.pt-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.pt-tag {
  margin: 0 6px 6px 0;
}

.pt-none {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.ddl-result) {
  margin-top: 4px;
}
</style>
