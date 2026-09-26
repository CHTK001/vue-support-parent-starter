<script setup lang="ts">
/**
 * 数据源中心（@pages/datasource）
 *
 * 卡片方式展示并维护数据源台账，支持 JDBC/Redis/InfluxDB/Neo4j/Nacos/ZooKeeper/Nginx：
 * 列表 + 新增/编辑/删除 + 连通性测试 + 按类型跳转对应管理页。
 * 数据来源：后端 spring-support-datasource-hub-starter 的 /ms/datasource/*。
 *
 * 视觉：koi 变量（--el-* / --metric-*），页头 + KPI 卡 + 数据源卡 + 新增占位卡。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  fetchDataSources,
  createDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  fetchDataSourceTypes,
  fetchDatasourceTables,
  fetchDatasourceColumns,
  type CollectColumn,
  type DataSourceInfo,
} from "../api";
import type { ReTableColumn } from "@repo/ui/re-table";

const router = useRouter();

const list = ref<DataSourceInfo[]>([]);
const loading = ref(false);
const types = ref<string[]>([]);

// 新增/编辑弹窗
const dialogVisible = ref(false);
const editing = ref<DataSourceInfo | null>(null);
const form = ref<Partial<DataSourceInfo>>({});
const saving = ref(false);

// 测试连接
const testing = ref<number | null>(null);

/** 数据源类型图标和语义色（统一走 koi 变量） */
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  jdbc: { icon: "Coin", color: "var(--metric-cpu, var(--el-color-primary))", label: "JDBC 数据库" },
  redis: { icon: "Coin", color: "var(--metric-redis, var(--el-color-danger))", label: "Redis" },
  influxdb: { icon: "Coin", color: "var(--el-color-success)", label: "InfluxDB" },
  neo4j: { icon: "Coin", color: "var(--metric-mem, var(--el-color-primary))", label: "Neo4j 图数据库" },
  nacos: { icon: "Coin", color: "var(--metric-disk, var(--el-color-warning))", label: "Nacos 配置中心" },
  zookeeper: { icon: "Coin", color: "var(--el-color-warning)", label: "ZooKeeper" },
  nginx: { icon: "Connection", color: "var(--metric-net, var(--el-color-info))", label: "Nginx" },
};

const typeMeta = (type: string) => TYPE_META[type] || { icon: "Coin", color: "var(--el-text-color-placeholder)", label: type };

/** 加载数据源列表 */
const load = async () => {
  loading.value = true;
  try {
    const [data, typeList] = await Promise.all([fetchDataSources(), fetchDataSourceTypes()]);
    list.value = data ?? [];
    types.value = typeList ?? ["jdbc", "redis", "influxdb", "neo4j", "nacos", "zookeeper"];
  } catch (e) {
    ElMessage.error(`加载失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
};

/** 打开新增弹窗 */
const openCreate = () => {
  editing.value = null;
  form.value = { type: "jdbc", name: "", host: "127.0.0.1", port: 3306, username: "", password: "", database: "", remark: "" };
  dialogVisible.value = true;
};

/** 打开编辑弹窗 */
const openEdit = (item: DataSourceInfo) => {
  editing.value = item;
  form.value = { ...item };
  dialogVisible.value = true;
};

/** 保存 */
const save = async () => {
  if (!form.value.name?.trim()) {
    ElMessage.warning("请输入数据源名称");
    return;
  }
  if (!form.value.type) {
    ElMessage.warning("请选择数据源类型");
    return;
  }
  saving.value = true;
  try {
    if (editing.value) {
      // id 声明为可选（新建时无 id），但更新必须落到某条既有记录
      if (editing.value.id == null) {
        ElMessage.warning("数据源缺少 ID，无法更新");
        return;
      }
      await updateDataSource(editing.value.id, form.value);
      ElMessage.success("更新成功");
    } else {
      await createDataSource(form.value);
      ElMessage.success("创建成功");
    }
    dialogVisible.value = false;
    await load();
  } catch (e) {
    ElMessage.error(`保存失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
};

/** 删除 */
const remove = async (item: DataSourceInfo) => {
  try {
    await ElMessageBox.confirm(`确定删除数据源 "${item.name}" 吗？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    if (item.id == null) {
      ElMessage.warning("数据源缺少 ID，无法删除");
      return;
    }
    await deleteDataSource(item.id);
    ElMessage.success("删除成功");
    await load();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 卡片「更多」命令分发（收敛次要操作：浏览表结构 / 编辑 / 删除） */
const runCardCommand = (cmd: string, item: DataSourceInfo) => {
  if (cmd === "schema") {
    void openSchema(item);
    return;
  }
  if (cmd === "edit") {
    openEdit(item);
    return;
  }
  if (cmd === "delete") {
    void remove(item);
  }
};

// ------------------------------ 表结构浏览 ------------------------------
// 采集侧元数据接口（hub 只管"连得上"，表的清单/列结构由采集平台提供）：
// 入库节点要按真实列配字段映射，这里给同一个能力一个可见入口。

const schemaVisible = ref(false);
const schemaLoading = ref(false);
const schemaError = ref<string | null>(null);
const schemaSourceId = ref<number | null>(null);
const schemaSourceName = ref("");
const schemaTables = ref<string[]>([]);
const schemaTable = ref<string | null>(null);
const schemaColumns = ref<CollectColumn[]>([]);

/** 打开某数据源的表结构浏览 */
const openSchema = async (item: DataSourceInfo) => {
  if (item.id == null) {
    ElMessage.warning("数据源缺少 ID，无法浏览表结构");
    return;
  }
  schemaSourceId.value = item.id;
  schemaSourceName.value = item.name;
  schemaTable.value = null;
  schemaColumns.value = [];
  schemaVisible.value = true;
  await refreshSchemaTables();
};

/** 拉当前表的列元数据 */
const refreshSchemaColumns = async () => {
  if (schemaSourceId.value == null || !schemaTable.value) {
    schemaColumns.value = [];
    return;
  }
  schemaLoading.value = true;
  schemaError.value = null;
  try {
    schemaColumns.value = (await fetchDatasourceColumns(schemaSourceId.value, schemaTable.value)) ?? [];
  } catch (error) {
    schemaColumns.value = [];
    schemaError.value = error instanceof Error ? error.message : String(error);
  } finally {
    schemaLoading.value = false;
  }
};

/** 拉表清单；首次自动选中第一张表并带出列 */
const refreshSchemaTables = async () => {
  if (schemaSourceId.value == null) {
    return;
  }
  schemaLoading.value = true;
  schemaError.value = null;
  try {
    const tables = (await fetchDatasourceTables(schemaSourceId.value)) ?? [];
    schemaTables.value = tables;
    if (!schemaTable.value && tables.length) {
      schemaTable.value = tables[0];
      await refreshSchemaColumns();
    } else if (!tables.length) {
      schemaColumns.value = [];
    }
  } catch (error) {
    schemaTables.value = [];
    schemaError.value = error instanceof Error ? error.message : String(error);
  } finally {
    schemaLoading.value = false;
  }
};

/** 列元数据表格列定义 */
const schemaColumnDefs = computed<ReTableColumn[]>(() => [
  { prop: "position", label: "#", width: 60, align: "center" },
  { prop: "name", label: "列名", minWidth: 160 },
  { prop: "typeName", label: "类型", width: 140 },
  { prop: "size", label: "长度", width: 80, align: "center" },
  { prop: "nullable", label: "可空", width: 90, slot: "nullable", align: "center" },
  { prop: "primaryKey", label: "主键", width: 80, slot: "primaryKey", align: "center" },
]);

/** 测试连接 */
const test = async (item: DataSourceInfo) => {
  if (item.id == null) {
    ElMessage.warning("数据源缺少 ID，无法测试");
    return;
  }
  testing.value = item.id;
  try {
    const result = await testDataSource(item.id);
    if (result?.success) {
      ElMessage.success(result.message || "连接成功");
    } else {
      ElMessage.error(result?.message || "连接失败");
    }
  } catch (e) {
    ElMessage.error(`测试失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    testing.value = null;
  }
};

/** 类型跳转映射（宿主应用按自身路由覆盖者优先） */
const TYPE_ROUTE_MAP: Record<string, string> = {
  jdbc: "/db-manager",
  redis: "/redis",
  influxdb: "/influxdb",
  neo4j: "/neo4j",
  nacos: "/nacos",
  zookeeper: "/zookeeper",
  nginx: "/nginx",
};

/** 打开对应类型的管理页面 */
const openManager = (item: DataSourceInfo) => {
  const route = TYPE_ROUTE_MAP[item.type];
  if (route) {
    router.push({ path: route, query: { datasourceId: item.id } });
  } else {
    ElMessage.warning(`类型 ${item.type} 的管理页面开发中`);
  }
};

/** 根据类型显示默认端口 */
const defaultPort = (type: string): number => {
  const ports: Record<string, number> = {
    jdbc: 3306,
    redis: 6379,
    influxdb: 8086,
    neo4j: 7474,
    nacos: 8848,
    zookeeper: 2181,
    nginx: 80,
  };
  return ports[type] ?? 3306;
};

/** 类型变化时更新默认端口 */
const onTypeChange = (type: string) => {
  if (!editing.value) {
    form.value.port = defaultPort(type);
  }
};

const stats = computed(() => ({
  total: list.value.length,
  byType: types.value.map(t => ({
    type: t,
    count: list.value.filter(d => d.type === t).length,
  })),
}));

/** KPI 卡：数据源总数 + 前 3 个类型 */
const kpis = computed(() => {
  const total = {
    key: "total",
    label: "数据源总数",
    value: stats.value.total,
    icon: "DataBoard",
    color: "var(--brand-500, var(--el-color-primary))",
  };
  const byType = stats.value.byType.slice(0, 3).map(t => ({
    key: t.type,
    label: typeMeta(t.type).label,
    value: t.count,
    icon: typeMeta(t.type).icon,
    color: typeMeta(t.type).color,
  }));
  return [total, ...byType];
});

onMounted(load);
</script>

<template>
  <div class="ds">
    <!-- 页头 -->
    <div class="page-header ds-head">
      <div>
        <h1 class="page-title">数据源中心</h1>
        <p class="page-desc">统一登记被监控 / 被采集的数据源 · 支持 JDBC / Redis / InfluxDB / Neo4j / Nacos / ZooKeeper / Nginx</p>
      </div>
      <div class="page-actions">
        <ReButton icon="RefreshRight" :show-text="true" size="large" class="ds-pill" :loading="loading" @click="load">刷新</ReButton>
        <ReButton icon="Plus" :show-text="true" type="primary" size="large" class="ds-pill" @click="openCreate">新增数据源</ReButton>
      </div>
    </div>

    <!-- KPI -->
    <section class="ds-kpis">
      <div v-for="k in kpis" :key="k.key" class="ds-kpi">
        <span class="ds-kpi__tile" :style="{ '--tile': k.color }"><ReIcon :name="k.icon" :size="24" /></span>
        <div class="ds-kpi__body">
          <div class="ds-kpi__label">{{ k.label }}</div>
          <div class="ds-kpi__value">{{ k.value }}</div>
        </div>
      </div>
    </section>

    <!-- 数据源卡片列表 -->
    <ReEmpty v-if="!loading && list.length === 0" description="暂无数据源，点击右上角「新增数据源」创建" :image-size="80" style="padding: 48px 0" />

    <div v-else class="ds-grid">
      <div v-for="item in list" :key="item.id" class="ds-card">
        <div class="ds-card-head">
          <span class="ds-icon" :style="{ '--tile': typeMeta(item.type).color }">
            <ReIcon :name="typeMeta(item.type).icon" :size="30" />
          </span>
          <div class="ds-title">
            <div class="ds-title-row">
              <b class="ds-name">{{ item.name }}</b>
              <span class="ds-type-chip" :style="{ '--tile': typeMeta(item.type).color }">{{ item.type.toUpperCase() }}</span>
            </div>
            <div class="ds-type">{{ typeMeta(item.type).label }}</div>
          </div>
        </div>
        <div class="ds-body">
          <div class="ds-row">
            <span class="ds-label">地址</span>
            <span class="ds-value mono">{{ item.host }}:{{ item.port }}</span>
          </div>
          <div v-if="item.database" class="ds-row">
            <span class="ds-label">数据库</span>
            <span class="ds-value mono">{{ item.database }}</span>
          </div>
          <div v-if="item.username" class="ds-row">
            <span class="ds-label">用户</span>
            <span class="ds-value">{{ item.username }}</span>
          </div>
          <div v-if="item.remark" class="ds-row">
            <span class="ds-label">备注</span>
            <span class="ds-value">{{ item.remark }}</span>
          </div>
        </div>
        <div class="ds-foot">
          <ReButton icon="Connection" :show-text="true" class="ds-pill" :loading="testing === item.id" @click="test(item)">测试连接</ReButton>
          <ReButton icon="View" :show-text="true" type="primary" class="ds-pill" @click="openManager(item)">打开管理</ReButton>
          <span class="ds-foot-spacer" />
          <ElDropdown trigger="click" placement="bottom-end" @command="(cmd: string | number | object) => runCardCommand(cmd as string, item)">
            <ReButton icon="MoreFilled" :show-text="true" class="ds-pill">更多</ReButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem v-if="item.type === 'jdbc'" command="schema"><ReIcon name="Grid" />浏览表结构</ElDropdownItem>
                <ElDropdownItem command="edit" :divided="item.type === 'jdbc'"><ReIcon name="EditPen" />编辑数据源</ElDropdownItem>
                <ElDropdownItem command="delete" divided style="color:var(--el-color-danger,#f56c6c)"><ReIcon name="Delete" />删除数据源</ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
      </div>

      <!-- 新增占位卡 -->
      <button type="button" class="ds-card ds-card--add" @click="openCreate">
        <ReIcon name="Plus" :size="26" />
        <span>新增数据源</span>
      </button>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑数据源' : '新增数据源'" width="560px">
      <div class="ds-dialog-body">
        <ReForm label-position="top" class="ds-form">
          <ReFormItem label="名称" required class="is-full">
            <ReInput v-model="form.name" placeholder="例如：生产 MySQL" />
          </ReFormItem>
          <ReFormItem label="类型" required>
            <ReSelect v-model="form.type" :options="types.map(t => ({ label: typeMeta(t).label, value: t }))" @change="onTypeChange" />
          </ReFormItem>
          <ReFormItem label="主机地址">
            <ReInput v-model="form.host" placeholder="127.0.0.1" />
          </ReFormItem>
          <ReFormItem :label="form.type === 'neo4j' ? '端口 (HTTP)' : '端口'">
            <ReInputNumber v-model="form.port" :min="1" :max="65535" style="width: 100%" />
          </ReFormItem>
          <ReFormItem label="用户名">
            <ReInput v-model="form.username" placeholder="数据库用户名" />
          </ReFormItem>
          <ReFormItem label="密码">
            <ReInput v-model="form.password" type="password" show-password placeholder="数据库密码" />
          </ReFormItem>
          <ReFormItem :label="form.type === 'neo4j' ? '图数据库名' : '数据库/库名'">
            <ReInput
              v-model="form.database"
              :placeholder="form.type === 'neo4j' ? '留空按 neo4j；填完整 http(s):// 地址时按反向代理前缀处理' : '数据库名 / Redis DB 编号'"
            />
          </ReFormItem>
          <ReFormItem label="备注" class="is-full">
            <ReInput v-model="form.remark" placeholder="可选备注信息" />
          </ReFormItem>
        </ReForm>
      </div>
      <template #footer>
        <ReButton class="ds-pill" @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" class="ds-pill" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 表结构浏览：入库节点按这里的真实列配字段映射 -->
    <ReDialog v-model="schemaVisible" :title="`${schemaSourceName} · 表结构`" width="820px">
      <div class="ds-schema">
        <div class="ds-schema__bar">
          <span class="ds-schema__label">表</span>
          <ReSelect
            v-model="schemaTable"
            filterable
            size="small"
            class="ds-schema__select"
            placeholder="选择表"
            :options="schemaTables.map(name => ({ label: name, value: name }))"
            @update:model-value="() => refreshSchemaColumns()"
          />
          <ReButton size="small" class="ds-pill" icon="RefreshRight" :show-text="true" :loading="schemaLoading" @click="refreshSchemaTables">刷新</ReButton>
          <span class="ds-schema__count">共 {{ schemaTables.length }} 张表</span>
        </div>

        <p v-if="schemaError" class="ds-schema__error">{{ schemaError }}</p>

        <ReTable
          v-else
          :columns="schemaColumnDefs"
          :data="schemaColumns"
          :loading="schemaLoading"
          row-key="name"
          empty-text="选择一张表查看列结构"
        >
          <template #nullable="{ row }">
            <ReTag size="small" effect="plain" :type="row.nullable ? 'info' : 'warning'">
              {{ row.nullable ? "可空" : "NOT NULL" }}
            </ReTag>
          </template>
          <template #primaryKey="{ row }">
            <ReTag v-if="row.primaryKey" size="small" effect="plain" type="danger">主键</ReTag>
          </template>
        </ReTable>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ============================================================
   数据源中心（独立页面包）—— 全部使用 koi 变量
   ============================================================ */
.ds {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 4px 24px;
}
.mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}

/* 页头 */
.ds-head { align-items: flex-start; margin-bottom: 22px; }
.ds .page-title {
  margin: 0;
  font-size: clamp(26px, 2.3vw, 34px);
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
}
.ds .page-desc { margin-top: 8px; font-size: 14px; color: var(--el-text-color-secondary); }
.ds-pill { border-radius: var(--el-radius-full, 9999px) !important; }

/* KPI */
.ds-kpis {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 22px;
}
@media (max-width: 1100px) {
  .ds-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .ds-kpis { grid-template-columns: 1fr; }
}
.ds-kpi {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 22px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}
.ds-kpi__tile {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  flex: none;
  --tile: var(--el-color-primary);
  border-radius: var(--el-border-radius-circle, 50%);
  color: var(--el-color-white, #fff);
  background: linear-gradient(135deg, color-mix(in srgb, var(--tile) 62%, var(--el-bg-color)), var(--tile));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--tile) 28%, transparent);
}
.ds-kpi__label { font-size: 14px; font-weight: 500; color: var(--el-text-color-regular); }
.ds-kpi__value {
  margin-top: 2px;
  font-size: 30px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

/* 数据源卡片 */
.ds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 16px;
}
.ds-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}
.ds-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow, var(--shadow-2));
  border-color: var(--el-border-color);
}
.ds-card-head { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.ds-icon {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  flex: none;
  --tile: var(--el-color-primary);
  color: var(--el-color-white, #fff);
  border-radius: var(--el-radius-lg, 12px);
  background: linear-gradient(135deg, color-mix(in srgb, var(--tile) 62%, var(--el-bg-color)), var(--tile));
  box-shadow: 0 8px 18px color-mix(in srgb, var(--tile) 28%, transparent);
}
.ds-title { flex: 1; min-width: 0; }
.ds-title-row { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ds-name {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-type-chip {
  flex: none;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  --tile: var(--el-color-primary);
  color: var(--tile);
  background: color-mix(in srgb, var(--tile) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--tile) 42%, transparent);
  border-radius: var(--el-radius-full, 9999px);
}
.ds-type { margin-top: 4px; font-size: 13px; color: var(--el-text-color-secondary); }
.ds-body { flex: 1; margin-bottom: 16px; }
.ds-row { display: flex; align-items: center; gap: 10px; padding: 4px 0; font-size: 13.5px; }
.ds-label { width: 48px; flex: none; color: var(--el-text-color-placeholder); }
.ds-value {
  flex: 1;
  min-width: 0;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-foot {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.ds-foot-spacer { flex: 1; }

/* 新增占位卡 */
.ds-card--add {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  min-height: 220px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px dashed var(--el-border-color);
  box-shadow: none;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.ds-card--add:hover {
  transform: none;
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, transparent);
  background: var(--el-color-primary-light-9);
  box-shadow: none;
}

/* 弹窗表单 */
.ds-dialog-body { padding: 16px 20px 4px; }
.ds-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 18px;
}
.ds-form :deep(.el-form-item) { margin-bottom: 16px; }
.ds-form :deep(.is-full) { grid-column: 1 / -1; }
.ds-form :deep(.el-form-item__label) {
  width: auto !important;
  height: auto;
  margin-bottom: 6px;
  padding: 0;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-regular);
}
  .ds-form :deep(.el-form-item__content) { margin-left: 0 !important; }
  @media (max-width: 640px) {
    .ds-form { grid-template-columns: 1fr; }
  }

  /* ---------------- 表结构浏览 ---------------- */
  .ds-schema { display: flex; flex-direction: column; gap: 10px; }
  .ds-schema__bar { display: flex; align-items: center; gap: 8px; }
  .ds-schema__label { font-size: 13px; color: var(--el-text-color-regular); flex: 0 0 auto; }
  .ds-schema__select { flex: 0 0 300px; }
  .ds-schema__count { margin-left: auto; font-size: 12px; color: var(--el-text-color-secondary); }
  .ds-schema__error {
    margin: 0;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }
  </style>