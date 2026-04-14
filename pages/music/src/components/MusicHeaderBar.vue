<template>
  <section class="header-card">
    <div class="header-copy">
      <p class="header-kicker">{{ activeSourceLabel }}</p>
      <h2>{{ title }}</h2>
      <p>{{ description }}</p>
    </div>
  </section>

  <div class="floating-tools">
    <button class="settings-btn" type="button" aria-label="系统设置" @click="emit('open-settings')">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 8.6a3.4 3.4 0 1 1 0 6.8 3.4 3.4 0 0 1 0-6.8Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.7"
        />
        <path
          d="M19.4 13.5a1.5 1.5 0 0 0 .3 1.64l.05.05a1.82 1.82 0 0 1-2.57 2.57l-.05-.05a1.5 1.5 0 0 0-1.64-.3 1.5 1.5 0 0 0-.9 1.37V19a1.82 1.82 0 0 1-3.64 0v-.08a1.5 1.5 0 0 0-.97-1.39 1.5 1.5 0 0 0-1.64.3l-.05.05a1.82 1.82 0 1 1-2.57-2.57l.05-.05a1.5 1.5 0 0 0 .3-1.64 1.5 1.5 0 0 0-1.37-.9H5a1.82 1.82 0 0 1 0-3.64h.08a1.5 1.5 0 0 0 1.39-.97 1.5 1.5 0 0 0-.3-1.64l-.05-.05a1.82 1.82 0 1 1 2.57-2.57l.05.05a1.5 1.5 0 0 0 1.64.3h.12A1.5 1.5 0 0 0 11.88 5V5a1.82 1.82 0 0 1 3.64 0v.08a1.5 1.5 0 0 0 .97 1.39 1.5 1.5 0 0 0 1.64-.3l.05-.05a1.82 1.82 0 0 1 2.57 2.57l-.05.05a1.5 1.5 0 0 0-.3 1.64v.12A1.5 1.5 0 0 0 19 11.88H19a1.82 1.82 0 0 1 0 3.64h-.08a1.5 1.5 0 0 0-1.39.97Z"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.3"
        />
      </svg>
    </button>

    <div class="search-shell" :class="{ expanded: isSearchExpanded }">
      <button class="search-toggle" type="button" aria-label="展开搜索" @click="handleSearchToggle">
        <el-icon><Search /></el-icon>
      </button>
      <input
        ref="searchInputRef"
        class="search-input"
        :value="searchKeyword"
        type="text"
        placeholder="搜索歌曲、歌手、专辑"
        @input="handleInput"
        @blur="handleInputBlur"
      />
      <button
        v-if="isSearchExpanded"
        class="search-run"
        type="button"
        :disabled="loading"
        @click="emit('search')"
      >
        {{ loading ? "..." : "搜索" }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from "@element-plus/icons-vue";
import { ElIcon } from "element-plus";
import { nextTick, ref } from "vue";

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
  (e: "open-settings"): void;
}>();

const searchInputRef = ref<HTMLInputElement>();
const isSearchExpanded = ref(false);

async function handleSearchToggle() {
  if (!isSearchExpanded.value) {
    isSearchExpanded.value = true;
    await nextTick();
    searchInputRef.value?.focus();
    return;
  }
  emit("search");
}

function handleInputBlur() {
  if (!searchInputRef.value?.value.trim()) {
    isSearchExpanded.value = false;
  }
}

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement;
  emit("update:searchKeyword", target.value);
}
</script>

<style scoped lang="scss">
.header-card {
  display: block;
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
  color: var(--music-text);
  text-shadow: 0 6px 20px rgba(15, 6, 8, 0.26);
}

.header-copy p:last-child {
  margin: 12px 0 0;
  color: var(--music-muted);
  line-height: 1.7;
}

.floating-tools {
  position: fixed;
  top: 18px;
  right: 24px;
  z-index: 3300;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.search-shell {
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 22px;
  display: inline-flex;
  align-items: center;
  gap: 0;
  width: 46px;
  height: 46px;
  overflow: hidden;
  background: rgba(29, 12, 14, 0.52);
  backdrop-filter: blur(14px);
  transition: width 220ms ease;
}

.search-shell.expanded {
  width: 360px;
}

.settings-btn {
  width: 46px;
  height: 46px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  color: var(--music-text);
  cursor: pointer;
  padding: 0;
}

.settings-btn svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.search-toggle,
.search-run {
  border: 0;
  background: transparent;
  color: var(--music-text);
  cursor: pointer;
}

.search-toggle {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.search-input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--music-text);
  font-size: 14px;
  min-width: 0;
}

.search-input::placeholder {
  color: var(--music-muted);
}

.search-run {
  width: 62px;
  height: 46px;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}

@media (max-width: 960px) {
  .floating-tools {
    top: 12px;
    right: 12px;
  }

  .search-shell.expanded {
    width: min(82vw, 320px);
  }
}
</style>
