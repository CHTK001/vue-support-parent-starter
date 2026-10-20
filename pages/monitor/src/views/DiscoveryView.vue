<script setup lang="ts">
/**
 * 发现服务 —— 服务发现状态、协议查询与服务实例列表
 * 后端端点：/ms/monitor/discovery（status / protocols / services）
 * 未启用发现服务时降级展示空列表与提示，不报错。
 * @author CH
 * @since 4.0.0
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getDiscoveryStatus, queryDiscoveryInstances, listDiscoveryProtocols,
  type DiscoveryStatus, type DiscoveryInstance,
} from "../api";

/** 发现服务状态 */
const status = ref<DiscoveryStatus | null>(null);
/** 服务实例列表 */
const instances = ref<DiscoveryInstance[]>([]);
/** 实例查询说明文案（未启用 / 查询失败时由后端返回） */
const message = ref("");
/** 可用的发现协议选项 */
const protocolOptions = ref<string[]>([]);
/** 查询条件：协议（可选） */
const queryProtocol = ref("");
/** 查询条件：服务标识 uriSpec（可选） */
const queryUriSpec = ref("");
/** 加载中 */
const loading = ref(false);

/** 下拉选项（首项为空 = 全部） */
const protocolSelectOptions = () => [
  { label: "全部", value: "" },
  ...protocolOptions.value.map(p => ({ label: p, value: p })),
];

/**
 * 加载状态 + 协议列表
 */
async function loadStatus() {
  loading.value = true;
  try {
    [status.value, protocolOptions.value] = await Promise.all([
      getDiscoveryStatus(),
      listDiscoveryProtocols().catch(() => []),
    ]);
  } catch (e: any) {
    ElMessage.error(`加载失败：${e?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

/**
 * 查询服务实例列表
 */
async function loadServices() {
  loading.value = true;
  message.value = "";
  try {
    const result = await queryDiscoveryInstances(
      queryProtocol.value || undefined,
      queryUriSpec.value || undefined,
    );
    instances.value = result?.instances ?? [];
    message.value = result?.message && result.message !== "ok" ? result.message : "";
  } catch (e: any) {
    instances.value = [];
    message.value = `查询失败：${e?.message ?? e}`;
  } finally {
    loading.value = false;
  }
}

/**
 * 刷新状态
 */
function refresh() {
  loadStatus();
  loadServices();
}

onMounted(refresh);
</script>

<template>
  <div class="px disc-page">
    <!-- 状态卡片 -->
    <ReSectionHead description="服务发现能力由可选模块提供，未启用时降级返回空数据">
      <template #title>发现服务</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" :loading="loading" @click="refresh">
          刷新
        </ReButton>
      </template>
    </ReSectionHead>

    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">服务发现状态</span></template>
      <div class="status-row">
        <span :class="['status-badge', status?.enabled ? 'status-on' : 'status-off']">
          {{ status?.enabled ? "已启用" : "未启用" }}
        </span>
        <span v-if="status?.enabled && status.availableProtocols?.length" class="muted">
          支持协议：{{ status.availableProtocols.join("、") }}
        </span>
        <span v-else-if="status" class="muted">暂无启用的发现协议配置</span>
        <span v-if="status" class="muted">运行中发现插件：{{ status.runningDiscoveryFilters }} 个</span>
        <span v-else class="muted">加载中…</span>
      </div>
      <div v-if="!status?.enabled" class="hint">
        服务发现未启用：请在 plugin.discovery 配置中开启并声明协议，然后刷新查看。
      </div>
    </ReCard>

    <!-- 查询 + 实例列表 -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">服务实例列表</span></template>
      <div class="query-bar">
        <ReSelect
          v-model="queryProtocol"
          :options="protocolSelectOptions()"
          placeholder="协议（全部）"

          clearable
          style="width: 180px"
        />
        <ReInput v-model="queryUriSpec" placeholder="服务标识 uriSpec（可选）" clearable style="width: 240px" />
        <ReButton icon="Search" type="primary" :loading="loading" @click="loadServices">查询</ReButton>
        <span class="count">共 {{ instances.length }} 条</span>
      </div>
      <ReEmpty v-if="message" :description="message" :image-size="70" style="padding: 16px 0" />
      <ReEmpty v-else-if="!instances.length" description="暂无服务实例" :image-size="70" style="padding: 16px 0" />
      <ReTable
        v-else
        :data="instances"
        :columns="[
          { prop: 'id', label: 'ID', width: 100 },
          { prop: 'host', label: '主机', width: 150 },
          { prop: 'port', label: '端口', width: 80 },
          { prop: 'protocol', label: '协议', width: 100 },
          { prop: 'weight', label: '权重', width: 80 },
          { prop: 'env', label: '环境', width: 90 },
          { prop: 'uriSpec', label: '服务标识', minWidth: 140, showOverflowTooltip: true },
          { prop: 'metadata', label: '元数据', minWidth: 160, slot: 'metadata', showOverflowTooltip: true },
        ]"
        :loading="loading"

        table-id="discovery-instances"
      >
        <template #col-metadata="{ row }">
          <span class="mono">{{ row.metadata ? JSON.stringify(row.metadata) : "—" }}</span>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.px { display: flex; flex-direction: column; gap: 14px; }
.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.status-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.status-on {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-off {
  background: rgba(148, 163, 184, 0.15);
  color: #94a3b8;
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.hint {
  margin-top: 10px;
  padding: 10px 12px;
  background: rgba(255, 196, 0, 0.08);
  border: 1px solid rgba(255, 196, 0, 0.25);
  border-radius: 8px;
  color: var(--text-secondary, #cbd5e1);
  font-size: 13px;
}
.muted { color: var(--text-muted, #94a3b8); font-size: 12px; }
.mono { font-family: monospace; font-size: 12px; }
.query-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.count { margin-left: auto; font-size: 12px; color: var(--text-muted, #94a3b8); }
</style>
