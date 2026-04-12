<template>
  <section class="header-card">
    <div class="header-copy">
      <p class="header-kicker">{{ activeSourceLabel }}</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>

    <div class="header-search">
      <el-input
        :model-value="searchKeyword"
        placeholder="搜索歌曲、歌手、专辑"
        size="large"
        clearable
        @update:model-value="emit('update:searchKeyword', $event)"
        @keyup.enter="emit('search')"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button :loading="loading" class="search-btn" type="primary" size="large" @click="emit('search')">
        搜索
      </el-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";

defineProps<{
  title: string;
  description: string;
  activeSourceLabel: string;
  searchKeyword: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: "update:searchKeyword", value: string): void;
  (e: "search"): void;
}>();
</script>

<style scoped lang="scss">
.header-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 420px);
  gap: 18px;
  border: 1px solid var(--music-stroke);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(241, 187, 103, 0.18), transparent 34%),
    rgba(72, 32, 29, 0.78);
  box-shadow: var(--music-shadow);
  padding: 22px;
  backdrop-filter: blur(18px);
}

.header-kicker {
  margin: 0 0 8px;
  color: var(--music-subtle);
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
}

.header-copy h2 {
  margin: 0;
  font-size: 42px;
}

.header-copy p:last-child {
  margin: 12px 0 0;
  color: var(--music-muted);
  line-height: 1.7;
}

.header-search {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 12px;
  align-self: center;
}

.search-btn {
  width: 100%;
}

@media (max-width: 960px) {
  .header-card,
  .header-search {
    grid-template-columns: 1fr;
  }

  .header-copy h2 {
    font-size: 34px;
  }
}
</style>
