<template>
  <div v-if="storage" class="monitor-item storage-item">
    <div class="item-content">
      <span class="value">{{ storage.used }}</span>
      <span class="label">存储</span>
    </div>
    <div v-if="mode === 'detailed'" class="mini-bar-gauge">
      <div class="gauge-fill" :style="{ width: `${Math.min((storage.usedBytes / storage.quotaBytes) * 100, 100)}%` }"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  mode: { type: String, required: true }
});

interface StorageInfo {
  used: string;
  quotaBytes: number;
  usedBytes: number;
}

const storage = ref<StorageInfo | null>(null);
let intervalId: number | null = null;

const updateStorage = () => {
  try {
    // 计算 localStorage 和 sessionStorage 的使用量
    let totalUsed = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalUsed += localStorage[key].length + key.length;
      }
    }
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        totalUsed += sessionStorage[key].length + key.length;
      }
    }

    // 尝试获取配额（仅 Chrome/Edge 支持）
    if ((navigator as any).storage && (navigator as any).storage.estimate) {
      (navigator as any).storage.estimate().then((estimate: any) => {
        const quota = estimate.quota || 5 * 1024 * 1024 * 1024; // 默认 5GB
        storage.value = {
          used: (totalUsed / 1024 / 1024).toFixed(2),
          quotaBytes: quota,
          usedBytes: totalUsed
        };
      });
    } else {
      // 不支持配额 API，使用估算值
      storage.value = {
        used: (totalUsed / 1024 / 1024).toFixed(2),
        quotaBytes: 5 * 1024 * 1024 * 1024,
        usedBytes: totalUsed
      };
    }
  } catch (error) {
    storage.value = null;
  }
};

onMounted(() => {
  updateStorage();
  intervalId = window.setInterval(updateStorage, 5000);
});

onBeforeUnmount(() => {
  if (intervalId !== null) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.monitor-item {
  display: flex;
  flex-direction: column;
  color: #fff;
  font-family: monospace;
  transition: all 0.3s ease;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 1.2;
  padding: 2px 0;
}

.value {
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.label {
  font-size: 10px;
  opacity: 0.8;
  margin-left: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

.mini-bar-gauge {
  height: 3px;
  background: rgba(255,255,255,0.2);
  margin-top: 4px;
  border-radius: 2px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  background: #ccc;
  transition: width 0.3s;
}
</style>

