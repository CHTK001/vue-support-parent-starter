<template>
  <div
    v-if="visible"
    ref="pickerRef"
    class="command-picker"
  >
    <!-- 技能列表 -->
    <div class="picker-list">
      <div
        v-for="(item, index) in filteredCommands"
        :key="item.name + index"
        class="picker-item"
        :class="{ active: index === selectedIndex }"
        @click="handleSelect(item)"
        @mouseenter="handleMouseEnter(index)"
      >
        <div class="item-icon" :style="{ backgroundColor: getSkillColor(item) }">
          <el-icon size="14" color="#fff">
            <Apps20Regular />
          </el-icon>
        </div>
        <div class="item-content">
          <div class="item-name-row">
            <span class="item-name">{{ item.label || item.name }}</span>
            <span class="item-tag" v-if="item.providerId">本地</span>
          </div>
          <div class="item-desc">{{ item.description || '' }}</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredCommands.length === 0" class="picker-empty">
      暂无技能
    </div>

    <!-- 底部搜索框 -->
    <div class="picker-search">
      <el-icon size="14" class="search-icon">
        <Search24Regular />
      </el-icon>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="搜索技能..."
        class="search-input"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { Apps20Regular, Search24Regular } from '@vicons/fluent';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  items: any[];
  query: string;
  selectedIndex: number;
  trigger: 'slash' | 'mention';
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  'update:selected-index': [value: number];
  select: [item: any];
  close: [];
}>();

const pickerRef = ref<HTMLElement | null>(null);
const localSelectedIndex = ref(0);
const searchQuery = ref('');

// 技能颜色映射
const skillColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
];

function getSkillColor(item: any): string {
  const name = item.name || item.label || '';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % skillColors.length;
  return skillColors[index];
}

// 同步外部 selectedIndex → 内部
watch(() => props.selectedIndex, (val) => {
  localSelectedIndex.value = val;
}, { immediate: true });

// 同步内部 → 外部
watch(localSelectedIndex, (val) => {
  emit('update:selected-index', val);
});

// 弹窗打开 / query 变化时重置选中
watch(() => props.visible, (val) => {
  if (val) localSelectedIndex.value = 0;
});
watch(() => props.query, () => {
  localSelectedIndex.value = 0;
});

// 选中项改变时滚动到可见区
watch(localSelectedIndex, () => {
  scrollToSelectedItem();
});

const filteredCommands = computed(() => {
  const q = searchQuery.value || props.query;
  if (!q) return props.items;
  const lower = q.toLowerCase();
  return props.items.filter((s: any) => {
    const name = s.name || '';
    const desc = s.description || '';
    return name.toLowerCase().includes(lower) || desc.toLowerCase().includes(lower);
  });
});

const scrollToSelectedItem = () => {
  nextTick(() => {
    const listEl = pickerRef.value?.querySelector('.command-picker-list');
    const items = pickerRef.value?.querySelectorAll('.command-picker-item');
    if (!listEl || !items) return;
    const selectedEl = items[localSelectedIndex.value] as HTMLElement | undefined;
    if (!selectedEl) return;

    const listRect = listEl.getBoundingClientRect();
    const selectedRect = selectedEl.getBoundingClientRect();

    if (selectedRect.top < listRect.top) {
      listEl.scrollTop -= listRect.top - selectedRect.top;
    } else if (selectedRect.bottom > listRect.bottom) {
      listEl.scrollTop += selectedRect.bottom - listRect.bottom;
    }
  });
};

const handleSelect = (item: any) => {
  emit('select', item);
};

const handleMouseEnter = (index: number) => {
  localSelectedIndex.value = index;
};

const moveDown = () => {
  if (filteredCommands.value.length === 0) return;
  localSelectedIndex.value = (localSelectedIndex.value + 1) % filteredCommands.value.length;
};

const moveUp = () => {
  if (filteredCommands.value.length === 0) return;
  localSelectedIndex.value = (localSelectedIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length;
};

const confirmSelection = () => {
  const item = filteredCommands.value[localSelectedIndex.value];
  if (item) {
    emit('select', item);
  }
};

const close = () => {
  emit('close');
};

defineExpose({
  moveDown,
  moveUp,
  confirmSelection,
  close,
});
</script>

<style scoped>
.command-picker {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  right: 0;
  z-index: 1000;
  border-radius: 16px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color, #e4e7ed);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .command-picker {
  background: #2d2d2d;
  border-color: #3c3c3c;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
}

/* 技能列表 */
.picker-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.picker-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-radius: 10px;
}

.picker-item:hover,
.picker-item.active {
  background: var(--el-fill-color-light, #f5f7fa);
}

.dark .picker-item:hover,
.dark .picker-item.active {
  background: #3c3c3c;
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  flex-shrink: 0;
  margin-top: 2px;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.item-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.picker-empty {
  padding: 40px 20px;
  text-align: center;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

/* 底部搜索框 */
.picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light, #e4e7ed);
  background: var(--el-bg-color-page, #fafafa);
}

.dark .picker-search {
  border-top-color: #3c3c3c;
  background: #262626;
}

.search-icon {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.search-input::placeholder {
  color: var(--el-text-color-placeholder);
}

/* 滚动条 */
.picker-list::-webkit-scrollbar {
  width: 6px;
}

.picker-list::-webkit-scrollbar-track {
  background: transparent;
}

.picker-list::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}
</style>
