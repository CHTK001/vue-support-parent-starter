<template>
  <div v-loading="loading" class="sdk-wrap">
    <div v-if="sdks.length" class="sdk-list">
      <div v-for="sdk in sdks" :key="sdk.version + sdk.installPath" class="sdk-card" :class="{ cur: sdk.active }">
        <div class="sdk-left">
          <div class="sdk-avatar" :class="'a-' + type">{{ initials(sdk.name) }}</div>
          <div class="sdk-meta">
            <div class="sdk-name">{{ sdk.name }}</div>
            <div class="sdk-path">{{ sdk.installPath }}</div>
          </div>
        </div>
        <div class="sdk-right">
          <span v-if="sdk.active" class="sdk-cur">当前</span>
          <span v-else class="sdk-ver">{{ sdk.version }}</span>
          <button v-if="!sdk.active" class="sdk-switch" @click="$emit('switch', sdk)">切换</button>
        </div>
      </div>
    </div>
    <el-empty v-else description="未检测到 SDK" :image-size="40" class="mt-8" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ sdks: any[]; type: string; loading?: boolean }>()
defineEmits<{ switch: [sdk: any] }>()
function initials(name: string): string { return name.substring(0, 2).toUpperCase() }
</script>

<style scoped>
.sdk-list { display: flex; flex-direction: column; gap: 8px; }

.sdk-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  transition: all 0.15s;
}

.sdk-card:hover { border-color: var(--el-color-primary-light-7); }
.sdk-card.cur { border-color: rgb(var(--el-color-primary)); background: var(--el-color-primary-light-9); }

.sdk-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

.sdk-avatar {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-weight: 700; font-size: 12px; flex-shrink: 0;
}

.a-java { background: #d97706; }
.a-python { background: #2563eb; }
.a-node { background: #059669; }
.a-go { background: #00add8; }
.a-rust { background: #de4a3b; }
.a-dotnet { background: #512bd4; }
.a-dart { background: #0175c2; }
.a-ruby { background: #cc342d; }
.a-php { background: #777bb4; }

.sdk-meta { min-width: 0; }
.sdk-name { font-size: 14px; font-weight: 600; }
.sdk-path { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px; }

.sdk-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.sdk-cur { font-size: 12px; padding: 2px 10px; border-radius: 100px; background: rgb(var(--el-color-primary)); color: #fff; font-weight: 500; }
.sdk-ver { font-size: 13px; color: var(--el-text-color-secondary); }

.sdk-switch {
  padding: 5px 14px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 7px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  color: var(--el-text-color-primary);
  transition: all 0.12s;
}

.sdk-switch:hover {
  border-color: rgb(var(--el-color-primary));
  color: rgb(var(--el-color-primary));
  background: var(--el-color-primary-light-9);
}
</style>
