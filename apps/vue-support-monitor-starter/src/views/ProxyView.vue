<script setup lang="ts">
/**
 * 代理管理 —— 对接 datasearch-starter 的免费代理获取能力
 * GET  /api/account/proxy        当前代理配置
 * POST /api/account/proxy        设置代理 { proxy }
 * POST /api/account/proxy/test   测试连通性 { url? }
 * GET  /api/account/proxy/free   获取免费代理列表
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";

const BASE = "/api/account/proxy";

interface ProxyStatus {
  enabled: boolean;
  proxy: string;
  host: string | null;
  port: number;
}

const status = ref<ProxyStatus>({ enabled: false, proxy: "", host: null, port: 0 });
const proxyInput = ref("");
const freeList = ref<string[]>([]);
const loading = ref(false);
const fetching = ref(false);
const testing = ref(false);
const testResult = ref<{ status: number; reachable: boolean; url: string } | null>(null);

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

async function loadStatus(): Promise<void> {
  try {
    status.value = await api<ProxyStatus>("");
  } catch { /* 后端不可用时保留当前值 */ }
}

async function setProxy(): Promise<void> {
  const val = proxyInput.value.trim();
  if (!val) return;
  loading.value = true;
  try {
    await api("", { method: "POST", body: JSON.stringify({ proxy: val }) });
    ElMessage.success("代理已设置");
    proxyInput.value = "";
    await loadStatus();
  } catch (e) {
    ElMessage.error(`设置失败: ${e}`);
  } finally {
    loading.value = false;
  }
}

async function clearProxy(): Promise<void> {
  loading.value = true;
  try {
    await api("", { method: "POST", body: JSON.stringify({ proxy: "" }) });
    ElMessage.success("代理已清除");
    await loadStatus();
  } catch (e) {
    ElMessage.error(`清除失败: ${e}`);
  } finally {
    loading.value = false;
  }
}

async function testProxy(): Promise<void> {
  testing.value = true;
  testResult.value = null;
  try {
    testResult.value = await api<{ status: number; reachable: boolean; url: string }>("/test", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch (e) {
    ElMessage.error(`测试失败: ${e}`);
  } finally {
    testing.value = false;
  }
}

async function fetchFree(): Promise<void> {
  fetching.value = true;
  try {
    const list = await api<string[]>("/free");
    freeList.value = Array.isArray(list) ? list : [];
    if (!freeList.value.length) ElMessage.warning("暂未获取到免费代理（外部代理源可能超时）");
    else ElMessage.success(`获取到 ${freeList.value.length} 个免费代理`);
  } catch (e) {
    ElMessage.error(`获取失败: ${e}`);
  } finally {
    fetching.value = false;
  }
}

async function useProxy(item: string): Promise<void> {
  proxyInput.value = item;
  loading.value = true;
  try {
    await api("", { method: "POST", body: JSON.stringify({ proxy: item }) });
    ElMessage.success(`已启用代理 ${item}`);
    await loadStatus();
  } catch (e) {
    ElMessage.error(`启用失败: ${e}`);
  } finally {
    loading.value = false;
  }
}

onMounted(loadStatus);
</script>

<template>
  <div class="px">
    <ReSectionHead description="基于 datasearch-starter 的免费代理获取与连通性测试">
      <template #title>代理管理</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="fetching" @click="fetchFree">获取免费代理</ReButton>
      </template>
    </ReSectionHead>

    <!-- 当前代理状态 -->
    <ReCard :radius="12" shadow="never" style="margin-bottom: 14px">
      <template #header><span class="card-h">当前代理</span></template>
      <div class="status-grid">
        <div class="cell">
          <div class="k">启用状态</div>
          <div class="v">
            <ReTag :type="status.enabled ? 'success' : 'info'" effect="plain">{{ status.enabled ? "已启用" : "未启用" }}</ReTag>
          </div>
        </div>
        <div class="cell">
          <div class="k">代理地址</div>
          <div class="v mono">{{ status.proxy || "—" }}</div>
        </div>
        <div class="cell">
          <div class="k">Host</div>
          <div class="v mono">{{ status.host || "—" }}</div>
        </div>
        <div class="cell">
          <div class="k">Port</div>
          <div class="v mono">{{ status.port || "—" }}</div>
        </div>
      </div>
    </ReCard>

    <!-- 设置代理 -->
    <ReCard :radius="12" shadow="never" style="margin-bottom: 14px">
      <template #header><span class="card-h">设置代理</span></template>
      <div class="set-row">
        <ReInput v-model="proxyInput" placeholder="如 http://127.0.0.1:7897 或 host:port" clearable size="default" style="flex: 1" />
        <ReButton type="primary" :loading="loading" icon="Connection" :show-text="true" @click="setProxy">设置</ReButton>
        <ReButton v-if="status.enabled" type="danger" plain :loading="loading" icon="Delete" :show-text="true" @click="clearProxy">清除</ReButton>
        <ReButton :loading="testing" icon="Aim" :show-text="true" @click="testProxy">测试连通</ReButton>
      </div>
      <div v-if="testResult" class="test-result">
        <ReTag :type="testResult.reachable ? 'success' : 'danger'" effect="plain">
          {{ testResult.reachable ? "可达" : "不可达" }} · HTTP {{ testResult.status }}
        </ReTag>
        <span class="muted">目标：{{ testResult.url }}</span>
      </div>
    </ReCard>

    <!-- 免费代理列表 -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">免费代理（datasearch-starter）</span></template>
      <ReEmpty v-if="!freeList.length" description="点击右上角「获取免费代理」拉取代理源" :image-size="80" style="padding: 24px 0">
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="fetching" @click="fetchFree">获取免费代理</ReButton>
      </ReEmpty>
      <ReTable
        v-else
        :data="freeList.map((p, i) => ({ id: i, proxy: p }))"
        :columns="[
          { prop: 'proxy', label: '代理地址', minWidth: 220, slot: 'proxy' },
          { prop: 'action', label: '操作', width: 120, slot: 'action' },
        ]"
        size="small"
        table-id="proxy-list"
      >
        <template #col-proxy="{ row }"><span class="mono">{{ row.proxy }}</span></template>
        <template #col-action="{ row }">
          <ReButton icon="Connection" :show-text="true" size="small" type="primary" plain :loading="loading" @click="useProxy(row.proxy)">使用</ReButton>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.px { display: flex; flex-direction: column; gap: 14px; }
.status-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.cell {
  padding: 12px 14px;
  background: var(--bg-fill);
  border-radius: 8px;
  .k { font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px; }
  .v { font-size: 14px; font-weight: 600; }
}
.mono { font-family: monospace; font-size: 12px; }
.muted { color: var(--text-tertiary); font-size: 12px; margin-left: 8px; }
.set-row { display: flex; gap: 10px; align-items: center; }
.test-result { margin-top: 12px; display: flex; align-items: center; }
</style>