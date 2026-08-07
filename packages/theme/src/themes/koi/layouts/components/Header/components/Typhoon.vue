<template>
  <el-popover
    placement="bottom-end"
    :width="280"
    trigger="hover"
    :offset="10"
    popper-class="koi-typhoon-popover"
    :show-arrow="false"
  >
    <template #reference>
      <div v-if="activeList.length" class="typhoon-trigger" :title="`${activeList.length} 个活跃台风`">
        <span class="typhoon-icon-wrap">
          <svg class="typhoon-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a7 7 0 0 1 0 14a5 5 0 0 0 0-10a3 3 0 0 1 0 6" fill="currentColor" stroke="none"/>
            <path d="M12 3a7 7 0 0 0 0 14a5 5 0 0 1 0-10a3 3 0 0 0 0 6" fill="currentColor" stroke="none" opacity="0.5"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
          </svg>
        </span>
        <el-badge v-if="activeList.length > 1" :value="activeList.length" :max="99" class="typhoon-badge" />
      </div>
    </template>

    <div class="typhoon-panel">
      <div v-if="activeList.length" class="typhoon-list">
        <div
          v-for="t in activeList"
          :key="t.id"
          class="typhoon-item"
          @click="openDetail(t.id)"
        >
          <div class="typhoon-item__name">{{ t.name || t.id }}</div>
          <div class="typhoon-item__info">
            <span v-if="t.strong">强度：{{ t.strong }}</span>
            <span>查看详情 →</span>
          </div>
        </div>
      </div>
      <div v-else class="typhoon-empty">
        <span>当前无活跃台风</span>
      </div>
    </div>
  </el-popover>

  <ReDialog v-model="detailVisible" title="台风预报图" :width="800" :footer-hidden="true" :fullscreen="false" destroy-on-close>
    <div v-loading="detailLoading" class="typhoon-detail">
      <div class="typhoon-detail__header">
        <span class="typhoon-detail__name">{{ detailInfo.name || detailInfo.id }}</span>
        <span class="typhoon-detail__info">{{ detailInfo.strong }}</span>
      </div>
      <div v-if="detailInfo.imageUrl" class="typhoon-detail__image">
        <img :src="detailInfo.imageUrl" :alt="detailInfo.name" />
      </div>
      <div v-else class="typhoon-detail__empty">暂无预报图</div>
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted, onBeforeUnmount } from "vue";

const ReDialog = defineAsyncComponent(() => import("@repo/ui/re-dialog").then((m) => m.default()));

const API_BASE = "https://typhoon.slt.zj.gov.cn/Api";

interface TyphoonItem {
  id: string;
  name?: string;
  strong?: string;
  imageUrl?: string;
}

const activeList = ref<TyphoonItem[]>([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailInfo = ref<TyphoonItem>({ id: "" });
let worker: Worker | null = null;
let fetchTimer: ReturnType<typeof setInterval> | null = null;

/** 接口返回 GBK 编码，需按 GBK 解码后解析 JSON */
async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("gbk").decode(buf);
  return JSON.parse(text);
}

/** 获取活跃台风列表 */
async function fetchActiveList() {
  try {
    const data = await fetchJson(`${API_BASE}/TyhoonActivity`);
    if (Array.isArray(data)) {
      activeList.value = data.map((t: any) => ({
        id: t.tfid ?? t.id ?? t.typhoonId ?? t.code ?? "",
        name: t.name ?? t.typhoonName ?? "",
        strong: t.strong ?? t.level ?? "",
      })).filter((t: TyphoonItem) => t.id);
    }
  } catch { /* ignore */ }
}

/** 打开台风详情 */
async function openDetail(id: string) {
  detailVisible.value = true;
  detailLoading.value = true;
  try {
    const data = await fetchJson(`${API_BASE}/TyphoonInfo/${id}`);
    if (data) {
      detailInfo.value = {
        id: data.tfid ?? data.id ?? id,
        name: data.name ?? data.typhoonName ?? "",
        strong: data.strong ?? data.level ?? "",
        imageUrl: data.imageUrl ?? data.forecastImage ?? "",
      };
    }
  } catch { /* ignore */ }
  detailLoading.value = false;
}

/** 启动 Worker 定时轮询 */
function startWorker() {
  if (worker) return;
  worker = new Worker(new URL("./typhoon.worker.ts", import.meta.url));
  worker.onmessage = () => {
    fetchActiveList();
  };
  worker.postMessage({ type: "start", interval: 3600000 });
}

function stopWorker() {
  if (worker) { worker.terminate(); worker = null; }
}

onMounted(() => {
  fetchActiveList();
  startWorker();
});

onBeforeUnmount(() => {
  stopWorker();
});
</script>

<style lang="scss" scoped>
.typhoon-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.3s ease;

  .typhoon-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .typhoon-icon {
    color: #4fc3f7;
    filter: drop-shadow(0 0 4px rgba(79, 195, 247, 0.6));
    animation: typhoon-spin 4s linear infinite;
  }

  :deep(.el-badge__content) {
    background: var(--el-color-danger);
    border: 2px solid var(--el-bg-color);
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }
}

@keyframes typhoon-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.typhoon-panel {
  padding: 12px;
  min-width: 0;
}

.typhoon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.typhoon-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--el-fill-color-light);
  }

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  &__info {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.typhoon-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.typhoon-detail {
  min-height: 200px;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__name {
    font-size: 18px;
    font-weight: 700;
  }

  &__info {
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__image {
    img {
      width: 100%;
      height: auto;
      border-radius: 8px;
    }
  }

  &__empty {
    text-align: center;
    padding: 40px 0;
    color: var(--el-text-color-secondary);
  }
}
</style>

<style lang="scss">
.koi-typhoon-popover {
  padding: 0 !important;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter) !important;
  border-radius: 14px !important;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18) !important;
}
</style>