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
    const list = await api<FreeProxy[]>("/free");
    freeList.value = list ?? [];
    if (!freeList.value.length) ElMessage.warning("暂未获取到免费代理（外部代理源可能超时）");
    else ElMessage.success(`获取到 ${freeList.value.length} 个免费代理（已录入代理表）`);
  } catch (e) {
    ElMessage.error(`获取失败: ${e}`);
  } finally {
    fetching.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="px tel-page">
    <ReSectionHead description="免费代理获取 · 后台代理表每次获取清空重录 · 页面从数据表读取">
      <template #title>代理管理</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="fetching" @click="fetchFree">
          {{ fetching ? "获取中…" : "获取免费代理" }}
        </ReButton>
      </template>
    </ReSectionHead>

    <!-- 免费代理列表（从数据表读取——快） -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">免费代理（数据表）</span></template>
      <div v-if="fetching" class="fetching">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>正在获取免费代理…（抓取外部源较慢，请稍候）</span>
      </div>
      <ReEmpty v-else-if="!freeList.length" description="点击右上角「获取免费代理」拉取代理源" :image-size="80" style="padding: 24px 0" />
      <ReTable
        v-else
        :data="freeList.map((p, i) => ({ id: i, host: p.host, port: p.port, protocol: p.protocol || 'Http', source: p.source || 'databay' }))"
        :columns="[
          { prop: 'addr', label: '代理地址', minWidth: 220, slot: 'addr' },
          { prop: 'protocol', label: '协议', width: 110 },
          { prop: 'source', label: '来源', width: 120 },
        ]"
        size="small"
        table-id="proxy-list"
      >
        <template #col-addr="{ row }"><span class="mono">{{ row.host }}:{{ row.port }}</span></template>
      </ReTable>
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
</style>
