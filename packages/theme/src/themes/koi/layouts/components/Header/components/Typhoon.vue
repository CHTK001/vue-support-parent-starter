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
      <div class="typhoon-trigger" :title="`${activeList.length} 个活跃台风`">
        <el-badge v-if="activeList.length > 1" :value="activeList.length" :max="99" class="typhoon-badge">
          <svg class="typhoon-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M20.7 12.6C20.7 12.6 21.7 13.5 21.7 14.5C21.7 16 20.2 17.3 17.9 17.9C15.5 18.5 12.4 18.5 9.7 17.5C7 16.5 5.2 15 5.2 13.5C5.2 12.5 6.2 11.6 6.2 11.6C6.2 11.6 5.2 10.7 5.2 9.7C5.2 8.2 6.7 6.9 9 6.3C11.3 5.7 14.4 5.7 17.1 6.7C19.8 7.7 21.7 9.2 21.7 10.7C21.7 11.7 20.7 12.6 20.7 12.6Z" />
            <circle cx="12" cy="12.5" r="3" fill="var(--el-bg-color)" />
          </svg>
        </el-badge>
<svg v-else class="typhoon-icon" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M20.7 12.6C20.7 12.6 21.7 13.5 21.7 14.5C21.7 16 20.2 17.3 17.9 17.9C15.5 18.5 12.4 18.5 9.7 17.5C7 16.5 5.2 15 5.2 13.5C5.2 12.5 6.2 11.6 6.2 11.6C6.2 11.6 5.2 10.7 5.2 9.7C5.2 8.2 6.7 6.9 9 6.3C11.3 5.7 14.4 5.7 17.1 6.7C19.8 7.7 21.7 9.2 21.7 10.7C21.7 11.7 20.7 12.6 20.7 12.6Z" />
          <circle cx="12" cy="12.5" r="3" fill="var(--el-bg-color)" />
        </svg>
        <span v-if="activeList.length === 1" class="typhoon-badge-single">1</span>
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

  <ReDialog v-model="detailVisible" title="台风预报图" :width="800" :footer-hidden="true" :fullscreen="false">
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
import { ref, onMounted, onBeforeUnmount } from "vue";

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

/** 获取活跃台风列表 */
async function fetchActiveList() {
  try {
    const res = await fetch(`${API_BASE}/TyhoonActivity`);
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      activeList.value = data.map((t: any) => ({
        id: t.id ?? t.typhoonId ?? t.code ?? "",
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
    const res = await fetch(`${API_BASE}/TyphoonInfo/${id}`);
    if (res.ok) {
      const data = await res.json();
      detailInfo.value = {
        id: data.id ?? id,
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 36px;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.3s ease, transform 0.3s ease;

  .typhoon-icon {
    color: var(--el-color-primary);
    animation: typhoon-spin 4s linear infinite;
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

.typhoon-badge-single {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  padding: 0 5px;
  border-radius: 8px;
  line-height: 16px;
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