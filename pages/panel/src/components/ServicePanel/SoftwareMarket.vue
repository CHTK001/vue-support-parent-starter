<template>
  <div class="software-market">
    <!-- Category filter tabs -->
    <div class="market-categories">
      <ElRadioGroup v-model="activeCategory" @change="handleCategoryChange">
        <ElRadioButton value="">全部</ElRadioButton>
        <ElRadioButton
          v-for="cat in categories"
          :key="cat"
          :value="cat"
        >
          {{ categoryLabel(cat) }}
        </ElRadioButton>
      </ElRadioGroup>
    </div>

    <!-- Search -->
    <div class="market-toolbar">
      <ElInput
        v-model="searchQuery"
        placeholder="搜索软件预设..."
        clearable
        style="width: 280px"
      />
      <span class="market-count">共 {{ filteredPresets.length }} 个软件</span>
    </div>

    <!-- States -->
    <div v-if="loading" class="market-loading">
      <ElSkeleton :rows="4" animated />
    </div>

    <div v-else-if="error" class="market-error">
      <ElAlert :title="error" type="error" show-icon>
        <template #footer>
          <ElButton size="small" @click="$emit('refresh')">重新加载</ElButton>
        </template>
      </ElAlert>
    </div>

    <div v-else-if="filteredPresets.length === 0" class="market-empty">
      <ElEmpty :description="searchQuery ? '没有匹配的软件预设' : '暂无可用软件预设'">
        <ElButton v-if="!searchQuery" type="primary" @click="$emit('manage')">
          去添加预设
        </ElButton>
      </ElEmpty>
    </div>

    <!-- Preset cards -->
    <div v-else class="market-grid">
      <div
        v-for="preset in filteredPresets"
        :key="preset.sysProjectContainerSoftwarePresetId"
        class="preset-card"
        @click="handleSelect(preset)"
      >
        <div class="preset-card-icon">
          <IconifyIconOnline
            :icon="preset.softwareIcon || 'ep:monitor'"
            :style="{ fontSize: '32px', color: 'var(--el-color-primary)' }"
          />
        </div>
        <div class="preset-card-info">
          <div class="preset-card-name">{{ preset.softwareName || '未知' }}</div>
          <div class="preset-card-meta">
            <ElTag size="small" type="info">{{ categoryLabel(preset.softwareCategory) }}</ElTag>
            <span class="preset-card-version">v{{ preset.softwareVersion || '-' }}</span>
          </div>
          <div class="preset-card-mode-tags">
            <ElTag
              :type="supportsSystem(preset) ? 'success' : 'info'"
              size="small"
            >
              SYSTEM
            </ElTag>
            <ElTag
              :type="supportsDocker(preset) ? 'warning' : 'info'"
              size="small"
            >
              {{ dockerSupported(preset) ? "DOCKER" : "SYSTEM-only" }}
            </ElTag>
            <ElTag
              v-if="dockerSupported(preset) && dockerScriptMode(preset) === 'dockerfile'"
              size="small"
              effect="plain"
            >
              Dockerfile
            </ElTag>
          </div>
        </div>
        <div class="preset-card-actions">
          <ElButton size="small" type="primary" @click.stop="handleInstall(preset)">
            <IconifyIconOnline icon="ep:download" style="margin-right: 4px" />
            安装
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElAlert, ElButton, ElEmpty, ElInput, ElRadioButton, ElRadioGroup, ElSkeleton, ElTag } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  getCategoryLabel,
  hasCompletePresetMode,
  getPresetSupportedModes,
  parseSoftwarePresetRemark,
  type SoftwarePreset,
} from "../../api/software";

const props = defineProps<{
  presets: SoftwarePreset[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  install: [preset: SoftwarePreset];
  refresh: [];
  manage: [];
  select: [preset: SoftwarePreset];
}>();

const activeCategory = ref("");
const searchQuery = ref("");

const categories = computed(() => {
  const cats = new Set(props.presets.map((p) => p.softwareCategory).filter(Boolean));
  return Array.from(cats).sort();
});

const categoryLabel = (cat?: string): string => {
  return getCategoryLabel(cat);
};

const filteredPresets = computed(() => {
  let list = props.presets;
  if (activeCategory.value) {
    list = list.filter((p) => p.softwareCategory === activeCategory.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.softwareName?.toLowerCase().includes(q) ||
        p.softwareCode?.toLowerCase().includes(q),
    );
  }
  return list;
});

const handleCategoryChange = () => {
  // Reactive, no explicit action needed
};

const handleSelect = (preset: SoftwarePreset) => {
  emit("select", preset);
};

const handleInstall = (preset: SoftwarePreset) => {
  emit("install", preset);
};

const supportsSystem = (preset: SoftwarePreset) =>
  hasCompletePresetMode(preset, "SYSTEM");

const supportsDocker = (preset: SoftwarePreset) =>
  hasCompletePresetMode(preset, "DOCKER");

const dockerSupported = (preset: SoftwarePreset) =>
  getPresetSupportedModes(preset).includes("DOCKER");

const dockerScriptMode = (preset: SoftwarePreset) =>
  parseSoftwarePresetRemark(preset.presetRemark).dockerDefaults?.scriptMode || "script";
</script>

<style scoped>
.software-market {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.market-categories {
  margin-bottom: 4px;
}
.market-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.market-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.market-loading {
  padding: 20px;
}
.market-error {
  padding: 12px 0;
}
.market-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}
.preset-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}
.preset-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}
.preset-card-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}
.preset-card-info {
  flex: 1;
  min-width: 0;
}
.preset-card-name {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.4;
}
.preset-card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}
.preset-card-version {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.preset-card-mode-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}
.preset-card-actions {
  flex-shrink: 0;
}
</style>
