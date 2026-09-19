<script setup lang="ts">
/**
 * 代理管理 —— 免费代理（业务）
 * 后台代理表 ms_proxy（每次获取免费代理时清空重录——自研抓取 databay 源）；
 * 页面免费代理从数据表读取（/ms/server/proxy/list——快）；
 * 获取免费代理走 /ms/server/proxy/free（抓取→清空→录入——较慢）。
 *
 * 说明：已移除「当前代理」卡片——当前代理 = 代理表第一条（host:port），
 * 由系统自动管理、无业务消费方（代理仅用于抓取/刷新），页面展示无操作价值；
 * 后端 /ms/server/proxy/current 端点保留（供其他业务方调用）。
 * @author CH
 * @since 4.0.0
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { http, unwrapResult } from "@repo/utils";

const BASE = "/ms/server/proxy";

interface FreeProxy {
  host: string;
  port: number;
  protocol?: string | null;
  source?: string | null;
}

const freeList = ref<FreeProxy[]>([]);
const fetching = ref(false);
const checking = ref(false);

async function api<T>(path: string): Promise<T> {
  const res = await http().get(BASE + path);
  return unwrapResult<T>(res);
}

async function loadList(): Promise<void> {
  try {
    freeList.value = (await api<FreeProxy[]>("/list")) ?? [];
  } catch { /* 后端不可用时保留 */ }
}

/** 获取免费代理（后端抓取→清空表→录入——较慢——加载等待动画） */
async function fetchFree(): Promise<void> {
  fetching.value = true;
  try {
    const res = await http().get(BASE + "/free", { timeout: 120000 });
    const list = unwrapResult<FreeProxy[]>(res);
    freeList.value = list ?? [];
    if (!freeList.value.length) ElMessage.warning("暂未获取到免费代理（外部代理源可能超时）");
    else ElMessage.success(`获取到 ${freeList.value.length} 个免费代理（已录入代理表）`);
  } catch (e) {
    ElMessage.error(`获取失败: ${e}`);
  } finally {
    fetching.value = false;
  }
}

/** 批量检测 */
async function checkAll(): Promise<void> {
  checking.value = true;
  try {
    await api("/check");
    ElMessage.success("批量检测已开始");
    // 5秒后刷新列表
    setTimeout(loadList, 5000);
  } catch (e) {
    ElMessage.error(`批量检测失败: ${e}`);
  } finally {
    checking.value = false;
  }
}

/** 检测单个 */
async function checkOne(id: number): Promise<void> {
  try {
    await api(`/check/${id}`);
    ElMessage.success("检测完成");
    loadList();
  } catch (e) {
    ElMessage.error(`检测失败: ${e}`);
  }
}

onMounted(loadList);
</script>

<template>
  <div class="px tel-page">
    <ReSectionHead description="免费代理获取 · 后台代理表每次获取清空重录 · 页面从数据表读取">
      <template #title>代理管理</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" type="primary" :loading="fetching" @click="fetchFree">
          {{ fetching ? "获取中…" : "获取免费代理" }}
        </ReButton>
        <ReButton icon="Connection" :show-text="true" size="small" :loading="checking" @click="checkAll">
          {{ checking ? "检测中…" : "批量检测" }}
        </ReButton>
      </template>
    </ReSectionHead>

    <!-- 免费代理列表（从数据表读取——快） -->
    <ReCard :radius="12" shadow="never" :bordered="false">
      <div v-if="fetching" class="fetching">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在获取免费代理…（抓取外部源较慢，请稍候）</span>
      </div>
      <ReEmpty v-else-if="!freeList.length" description="点击右上角「获取免费代理」拉取代理源" :image-size="80" style="padding: 24px 0" />
      <el-scrollbar v-else height="calc(100vh - 180px)">
        <ReTable
          :data="freeList.map((p, i) => ({ id: i, host: p.host, port: p.port, protocol: p.protocol || 'Http', source: p.source || 'databay' }))"
          :columns="[
            { prop: 'addr', label: '代理地址', minWidth: 220, slot: 'addr' },
            { prop: 'protocol', label: '协议', width: 110 },
            { prop: 'source', label: '来源', width: 120 },
            { prop: 'delay', label: '延迟', width: 100, slot: 'delay' },
            { prop: 'reachable', label: '状态', width: 100, slot: 'reachable' },
            { prop: 'actions', label: '操作', width: 100, slot: 'actions' },
          ]"
          size="small"
          :border="false"
          :stripe="false"
          table-id="proxy-list"
          class="proxy-table"
        >
          <template #col-addr="{ row }"><span class="mono">{{ row.host }}:{{ row.port }}</span></template>
          <template #col-delay="{ row }">
            <span v-if="row.delay != null" :class="row.delay < 1000 ? 'delay-good' : row.delay < 3000 ? 'delay-warn' : 'delay-bad'">
              {{ row.delay }}ms
            </span>
            <span v-else class="text-secondary">-</span>
          </template>
          <template #col-reachable="{ row }">
            <el-tag v-if="row.reachable != null" :type="row.reachable ? 'success' : 'danger'" size="small">
              {{ row.reachable ? '可达' : '不可达' }}
            </el-tag>
            <span v-else class="text-secondary">未检测</span>
          </template>
          <template #col-actions="{ row }">
            <ReButton icon="Connection" layout="square" size="small" title="检测" @click="checkOne(row.id)" />
          </template>
        </ReTable>
      </el-scrollbar>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.px { display: flex; flex-direction: column; gap: 14px; }
.mono { font-family: monospace; font-size: 12px; }
.fetching {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--text-secondary);
  font-size: 13px;
}
.delay-good { color: #67c23a; }
.delay-warn { color: #e6a23c; }
.delay-bad { color: #f56c6c; }
.text-secondary { color: var(--text-secondary); }

:deep(.el-table__body tr:hover > td.el-table__cell) {
  background: transparent !important;
  border-right: none !important;
  border-left: none !important;
}
:deep(.el-table__body tr:hover) {
  background: transparent !important;
}


</style>
