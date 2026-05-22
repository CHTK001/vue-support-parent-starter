<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="选择模板"
    width="700px"
  >
    <!-- Filter bar -->
    <div class="tb-filter">
      <ElInput v-model="searchText" placeholder="搜索模板..." prefix-icon="Search" clearable size="small" style="width: 200px" />
      <div class="tb-filter__tags">
        <ElTag
          v-for="cat in categories"
          :key="cat"
          :type="selectedCategory === cat ? 'primary' : 'info'"
          size="small"
          effect="plain"
          style="cursor:pointer"
          @click="selectedCategory = selectedCategory === cat ? '' : cat"
        >
          {{ cat }}
        </ElTag>
      </div>
    </div>

    <!-- Preset cards -->
    <div v-if="filteredPresets.length" class="tb-grid">
      <div
        v-for="entry in filteredPresets"
        :key="entry.key"
        class="tb-card"
        @click="selectPreset(entry.key, entry)"
      >
        <div class="tb-card__icon">
          <IconifyIconOnline v-if="entry.softwareIcon" :icon="entry.softwareIcon" width="32" height="32" />
          <IconifyIconOnline v-else icon="ep:box" width="28" height="28" />
        </div>
        <div class="tb-card__info">
          <span class="tb-card__name">{{ entry.softwareName || entry.key }}</span>
          <span class="tb-card__version">{{ entry.softwareVersion || '' }}</span>
          <span v-if="entry.category" class="tb-card__category">{{ entry.category }}</span>
          <span class="tb-card__image">{{ entry.image || '-' }}</span>
        </div>
      </div>
    </div>
    <div v-else class="tb-empty">
      <ElEmpty description="暂无匹配模板" :image-size="48" />
      <p class="tb-empty__hint">可直接输入镜像名手动创建容器</p>
    </div>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElButton, ElDialog, ElEmpty, ElInput, ElTag } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { PRESET_SUGGESTIONS } from "../../api/software";
import type { PresetSuggestion } from "../../api/software";

// Extend PresetSuggestion with display fields used in PRESET_SUGGESTIONS
interface PresetItem extends PresetSuggestion {
  softwareName?: string;
  softwareVersion?: string;
  category?: string;
  softwareIcon?: string;
}

defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [val: boolean];
  selected: [presetKey: string, preset: PresetItem];
}>();

const searchText = ref("");
const selectedCategory = ref("");

// Compute categories dynamically
const presetEntries = computed(() => Object.entries(PRESET_SUGGESTIONS));

const categories = computed(() => {
  const cats = new Set<string>();
  for (const [, item] of presetEntries.value) {
    if ((item as PresetItem).category) cats.add((item as PresetItem).category);
  }
  return Array.from(cats).sort();
});

const filteredPresets = computed(() => {
  const entries = presetEntries.value;
  return entries.filter(([key, item]) => {
    const p = item as PresetItem;
    if (selectedCategory.value && p.category !== selectedCategory.value) return false;
    if (searchText.value) {
      const q = searchText.value.toLowerCase();
      const nameMatch = (p.softwareName || key).toLowerCase().includes(q);
      const imageMatch = (p.image || "").toLowerCase().includes(q);
      if (!nameMatch && !imageMatch) return false;
    }
    return true;
  }).map(([key, item]) => ({ key, ...item as PresetItem }));
});

const selectPreset = (key: string, item: PresetItem) => {
  emit("selected", key, item);
};
</script>

<style scoped>
.tb-filter { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
.tb-filter__tags { display: flex; gap: 4px; flex-wrap: wrap; }
.tb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; max-height: 420px; overflow-y: auto; padding: 4px; }
.tb-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px; border-radius: 8px;
  border: 1px solid var(--el-border-color);
  cursor: pointer; transition: all 0.15s;
}
.tb-card:hover { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.tb-card__icon { flex-shrink: 0; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; }
.tb-card__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.tb-card__name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-card__version { font-size: 11px; color: var(--el-text-color-secondary); }
.tb-card__category { font-size: 10px; color: var(--el-color-primary); }
.tb-card__image { font-size: 11px; color: var(--el-text-color-placeholder); font-family: "Cascadia Code", monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tb-empty { text-align: center; padding: 40px 0; }
.tb-empty__hint { font-size: 12px; color: var(--el-text-color-placeholder); margin-top: 8px; }
</style>
