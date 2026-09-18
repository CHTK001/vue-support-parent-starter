<script setup lang="ts">
/**
 * 缓存管理页面
 *
 * 展示固定 6 项缓存（角色/字典/部门/设置/菜单/用户），
 * 支持单个刷新与一键刷新全部。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import { listCache, refreshCache, refreshAllCache } from "../api/systemApi";
import type { SysCacheInfo } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const list = ref<SysCacheInfo[]>([]);
const loading = ref(false);
const refreshing = ref<string>("");

async function loadList() {
  loading.value = true;
  try {
    const res = await listCache();
    list.value = (res?.data ?? []) as SysCacheInfo[];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "缓存列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 刷新单个缓存 */
async function handleRefresh(row: Record<string, unknown>) {
  const cache = row as unknown as SysCacheInfo;
  refreshing.value = cache.cacheName;
  try {
    await refreshCache(cache.cacheName);
    ElMessage.success("缓存已刷新");
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "刷新失败");
  } finally {
    refreshing.value = "";
  }
}

/** 刷新全部缓存 */
async function handleRefreshAll() {
  try {
    await ElMessageBox.confirm("确认刷新全部缓存？", "提示", {
      type: "warning",
      confirmButtonText: "确定刷新",
    });
  } catch {
    return;
  }
  try {
    await refreshAllCache();
    ElMessage.success("缓存已刷新");
    loadList();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "刷新失败");
  }
}

const columns: ReTableColumn[] = [
  { prop: "cacheName", label: "缓存名称", minWidth: 160 },
  { prop: "cacheKey", label: "缓存Key", minWidth: 200, showOverflowTooltip: true },
  { prop: "description", label: "描述", minWidth: 240, showOverflowTooltip: true },
  { prop: "keyCount", label: "Key数量", width: 110, align: "center" },
  { prop: "action", label: "操作", width: 140, slot: "action", fixed: "right" },
];

onMounted(() => {
  loadList();
});
</script>

<template>
  <div class="system-page">
      <div class="cache-toolbar">
        <ReButton layout="modern" type="primary" icon="Refresh" :loading="loading" @click="loadList">刷新</ReButton>
        <ReButton layout="modern" type="danger" icon="Refresh" v-admin @click="handleRefreshAll">刷新全部缓存</ReButton>
      </div>

      <ReTable
        :data="list"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        row-key="cacheName"
      >
        <template #action="{ row }">
          <ReButton
            layout="square"
            type="warning"
            icon="Refresh"
            v-admin
            :loading="refreshing === row.cacheName"
            @click="handleRefresh(row)"
          >
            刷新
          </ReButton>
        </template>
      </ReTable>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.cache-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding-bottom: 12px;
}
</style>
