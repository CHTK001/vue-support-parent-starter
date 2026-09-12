<script setup lang="ts">
/**
 * 数据源管理 —— 卡片方式显示数据源，支持增删查改
 * 支持类型：jdbc / redis / influxdb / neo4j / nacos / zookeeper
 * 数据来源：/ms/monitor/datasource/*
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
  type DataSourceInfo,
} from "../monitorApi";

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

/** 数据源类型图标和颜色 */
const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  jdbc: { icon: "Coin", color: "#38bdf8", label: "JDBC 数据库" },
  redis: { icon: "Coin", color: "#f87171", label: "Redis" },
  influxdb: { icon: "Coin", color: "#34d399", label: "InfluxDB" },
  neo4j: { icon: "Coin", color: "#a78bfa", label: "Neo4j 图数据库" },
  nacos: { icon: "Coin", color: "#fbbf24", label: "Nacos 配置中心" },
  zookeeper: { icon: "Coin", color: "#fb923c", label: "ZooKeeper" },
};

const typeMeta = (type: string) => TYPE_META[type] || { icon: "Coin", color: "#94a3b8", label: type };

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
    await deleteDataSource(item.id);
    ElMessage.success("删除成功");
    await load();
  } catch (e) {
    ElMessage.error(`删除失败: ${String((e as Error)?.message ?? e)}`);
  }
};

/** 测试连接 */
const test = async (item: DataSourceInfo) => {
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

/** 类型跳转映射 */
const TYPE_ROUTE_MAP: Record<string, string> = {
  jdbc: "/db-manager",
  redis: "/redis",
  influxdb: "/influxdb",
  neo4j: "/neo4j",
  nacos: "/nacos",
  zookeeper: "/zookeeper",
};

/** 打开对应类型的管理页面 */
const openManager = (item: DataSourceInfo) => {
  const route = TYPE_ROUTE_MAP[item.type];
  if (route) {
    // 传递数据源 ID，目标页面可读取
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
    neo4j: 7687,
    nacos: 8848,
    zookeeper: 2181,
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

onMounted(load);
</script>

<template>
  <div class="ds tel-page">
    <ReSectionHead description="数据源管理 · 支持 JDBC/Redis/InfluxDB/Neo4j/Nacos/ZooKeeper · 卡片方式显示" :loading="loading">
      <template #title>数据源管理</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="load">刷新</ReButton>
        <ReButton icon="Plus" type="primary" :show-text="true" size="small" @click="openCreate">新增数据源</ReButton>
      </template>
    </ReSectionHead>

    <!-- 统计 -->
    <section class="kpi-row cols-4">
      <ReStatCard title="数据源总数" icon="Coin" icon-color="var(--metric-cpu)" :value="stats.total" />
      <ReStatCard
        v-for="s in stats.byType.slice(0, 3)"
        :key="s.type"
        :title="typeMeta(s.type).label"
        icon="Coin"
        :icon-color="typeMeta(s.type).color"
        :value="s.count"
      />
    </section>

    <!-- 数据源卡片列表 -->
    <ReEmpty v-if="!loading && list.length === 0" description="暂无数据源，点击右上角「新增数据源」创建" :image-size="80" style="padding: 48px 0" />

    <div v-else class="ds-grid">
      <div v-for="item in list" :key="item.id" class="ds-card">
        <div class="ds-card-head">
          <div class="ds-icon" :style="{ background: typeMeta(item.type).color + '20', color: typeMeta(item.type).color }">
            <el-icon><Coin /></el-icon>
          </div>
          <div class="ds-title">
            <div class="ds-name">{{ item.name }}</div>
            <div class="ds-type">{{ typeMeta(item.type).label }}</div>
          </div>
          <ReTag :type="item.type === 'jdbc' ? 'primary' : 'success'" size="small">{{ item.type.toUpperCase() }}</ReTag>
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
          <ReButton icon="Connection" size="small" text :loading="testing === item.id" @click="test(item)">测试连接</ReButton>
          <ReButton icon="View" size="small" text type="primary" @click="openManager(item)">打开管理</ReButton>
          <ReButton icon="Edit" size="small" text @click="openEdit(item)">编辑</ReButton>
          <ReButton icon="Delete" size="small" text type="danger" @click="remove(item)">删除</ReButton>
        </div>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <ReDialog v-model="dialogVisible" :title="editing ? '编辑数据源' : '新增数据源'" width="600px">
      <ReForm label-width="100px">
        <ReFormItem label="名称" required>
          <ReInput v-model="form.name" placeholder="例如：生产 MySQL" />
        </ReFormItem>
        <ReFormItem label="类型" required>
          <ReSelect v-model="form.type" :options="types.map(t => ({ label: typeMeta(t).label, value: t }))" @change="onTypeChange" />
        </ReFormItem>
        <ReFormItem label="主机地址">
          <ReInput v-model="form.host" placeholder="127.0.0.1" />
        </ReFormItem>
        <ReFormItem label="端口">
          <ReInputNumber v-model="form.port" :min="1" :max="65535" style="width: 100%" />
        </ReFormItem>
        <ReFormItem label="用户名">
          <ReInput v-model="form.username" placeholder="数据库用户名" />
        </ReFormItem>
        <ReFormItem label="密码">
          <ReInput v-model="form.password" type="password" show-password placeholder="数据库密码" />
        </ReFormItem>
        <ReFormItem label="数据库/库名">
          <ReInput v-model="form.database" placeholder="数据库名 / Redis DB 编号" />
        </ReFormItem>
        <ReFormItem label="备注">
          <ReInput v-model="form.remark" placeholder="可选备注信息" />
        </ReFormItem>
      </ReForm>
      <template #footer>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="save">保存</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.mono { font-family: monospace; font-size: 12px; }

/* 数据源卡片网格 */
.ds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

/* 数据源卡片 */
.ds-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
}
.ds-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-2);
  transform: translateY(-2px);
}

/* 卡片头部 */
.ds-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}
.ds-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.ds-title { flex: 1; }
.ds-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.ds-type {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 卡片内容 */
.ds-body {
  margin-bottom: 14px;
}
.ds-row {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 13px;
}
.ds-label {
  width: 60px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.ds-value {
  flex: 1;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片底部操作 */
.ds-foot {
  display: flex;
  gap: 4px;
  padding-top: 10px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}
</style>
