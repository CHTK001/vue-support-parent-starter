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

    <!-- Preset icon grid -->
    <div v-else class="market-grid">
      <div
        v-for="preset in filteredPresets"
        :key="preset.sysProjectContainerSoftwarePresetId"
        class="market-icon"
        :style="{ '--i': filteredPresets.indexOf(preset) }"
        @click="handleInstall(preset)"
      >
        <div class="market-icon-badge" v-if="preset.softwareCategory" :class="'mb-' + preset.softwareCategory">
          {{ categoryLabel(preset.softwareCategory).charAt(0) }}
        </div>
        <div class="market-icon-box">
          <SoftwareIcon
            :icon="preset.softwareIcon"
            class="market-icon-svg"
            fallback="ep:monitor"
          />
          <ElTooltip content="快速安装（使用默认配置）" placement="top">
            <div class="market-icon-quick" @click.stop="handleQuickInstall(preset)">
              <IconifyIconOnline icon="ep:lightning" />
            </div>
          </ElTooltip>
        </div>
        <div class="market-icon-label">
          <span class="market-icon-name">{{ preset.softwareName || '未知' }}</span>
          <span class="market-icon-version">v{{ preset.softwareVersion || '-' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { ElAlert, ElButton, ElEmpty, ElInput, ElRadioButton, ElRadioGroup, ElSkeleton, ElTag, ElTooltip } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import {
  getCategoryLabel,
  type SoftwarePreset,
} from "../../api/software";

const props = defineProps<{
  presets: SoftwarePreset[];
  loading: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  install: [preset: SoftwarePreset];
  "quick-install": [preset: SoftwarePreset];
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

const handleInstall = (preset: SoftwarePreset) => {
  emit("install", preset);
};

const handleQuickInstall = (preset: SoftwarePreset) => {
  emit("quick-install", preset);
};
</script>

<style scoped>
.software-market {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ─── Category filter: pill-style radio buttons ─── */

.market-categories {
  margin-bottom: 4px;
}
.market-categories :deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.market-categories :deep(.el-radio-button__inner) {
  border: none;
  border-radius: 20px !important;
  padding: 5px 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--dt-hover-bg);
  color: var(--el-text-color-secondary);
  box-shadow: none !important;
  transition: all var(--dt-transition-fast);
}
.market-categories :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}
.market-categories :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 20px !important;
  border: none;
}
.market-categories :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 20px !important;
}

/* ─── Toolbar ─── */

.market-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.market-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
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

/* ─── Preset Icon Grid ─── */

.market-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
  padding: 4px;
}

/* ─── Market Icon (logo-only) ─── */

.market-icon {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px 10px;
  border-radius: var(--dt-radius-lg);
  cursor: pointer;
  transition: all var(--dt-transition-spring);
  animation: mIconIn 0.35s var(--dt-ease-out) both;
  animation-delay: calc(var(--i, 0) * 0.03s);
  user-select: none;
}
.market-icon:hover {
  background: var(--dt-glass-bg-light);
  backdrop-filter: var(--dt-glass-blur-light);
  transform: translateY(-3px);
}
html.dark .market-icon:hover {
  background: var(--dt-glass-bg-dark);
}
.market-icon:active {
  transform: translateY(-1px) scale(0.96);
}

.market-icon-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 8px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  opacity: 0;
  transition: opacity var(--dt-transition-fast);
  pointer-events: none;
}
.market-icon:hover .market-icon-badge {
  opacity: 1;
}
.mb-database { background: #409eff; }
.mb-middleware { background: #b37feb; }
.mb-language { background: #67c23a; }
.mb-devops { background: #f56c6c; }
.mb-remote { background: #e6a23c; }
.mb-webserver { background: #36cfc9; }

.market-icon-box {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--dt-radius-lg);
  background: var(--dt-hover-bg);
  color: var(--el-color-primary);
  font-size: 28px;
  transition: all var(--dt-transition-normal);
  position: relative;
  overflow: hidden;
}
.market-icon:hover .market-icon-box {
  background: var(--el-color-primary-light-9);
  transform: scale(1.08);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.market-icon-svg {
  transition: transform var(--dt-transition-normal);
}
.market-icon:hover .market-icon-svg {
  transform: scale(1.12);
}

/* ─── Quick install button overlay ─── */

.market-icon-quick {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-warning);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.6);
  transition: all 0.2s ease;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(230, 162, 60, 0.4);
  z-index: 2;
}
.market-icon:hover .market-icon-quick {
  opacity: 1;
  transform: scale(1);
}
.market-icon-quick:hover {
  transform: scale(1.2) !important;
  background: #f59e0b;
}

.market-icon-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.market-icon-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-align: center;
  line-height: 1.3;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.market-icon-version {
  font-size: 10px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@keyframes mIconIn {
  from { opacity: 0; transform: translateY(12px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}


</style>
