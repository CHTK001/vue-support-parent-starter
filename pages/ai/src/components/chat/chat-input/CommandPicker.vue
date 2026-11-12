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
        <div class="item-icon" :class="`item-icon--${iconKind(item)}`">
          <svg class="item-glyph" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="iconPath(iconKind(item))" />
          </svg>
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
    <div v-if="!loading && filteredCommands.length === 0" class="picker-empty">
      {{ t('chat.input.noMatchCommand') }}
    </div>
    <div v-else-if="loading && filteredCommands.length === 0" class="picker-empty">
      {{ t('chat.input.menuLoading') }}
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
import { Search24Regular } from '@vicons/fluent';
import { COMMAND_ICON_PATHS, resolveCommandIconKind, type CommandIconKind } from './commandIcons';

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  items: any[];
  query: string;
  selectedIndex: number;
  trigger: 'slash' | 'mention';
  /** 候选集还在加载：空列表时显示「加载中」而不是「未找到」 */
  loading?: boolean;
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

/**
 * 指令栏条目图标：按「这条指令会打开什么」分类，而不是所有行共用同一个九宫格。
 *
 * 用户报障「输入库的图标显示还是不对」：原实现每一行都渲染 Apps20Regular，
 * 底色由 item.name 哈希到 8 个写死的 hex（换肤后是一排不跟随主题的彩色块）。
 * 这里改成语义图标 + --el-* 主题色，附件 / 知识库 / 技能 / 模型 / 会话动作
 * 一眼能分开；映射表与 + 弹层共用（见 commandIcons.ts）。
 */
const iconKind = resolveCommandIconKind;

function iconPath(kind: CommandIconKind): string {
  return COMMAND_ICON_PATHS[kind];
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
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*。refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时自动跟随；原先成套的 .dark 硬编码色已被令牌吞掉，
      .dark 规则保留仅为可读性与后续按主题微调。
   2. 阴影取舍：技能弹层是浮在输入框上方的 popover，「浮起」是功能必需的，
      故保留 --el-box-shadow 系列；弹层内部的列表项 / 标签不加投影。
   3. 圆角、过渡时长统一取 --el-radius-* / --el-transition-duration 令牌。
   ============================================================================ */

.command-picker {
  position: absolute;
  bottom: calc(100% + 12px);
  left: 0;
  right: 0;
  z-index: 1000;
  /* 原值 16px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  /* 弹层用 overlay 底色令牌（--el-bg-color 是页面底色，层级不对） */
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  /* 浮起反馈：popover 必须与下层输入区拉开距离，原值 0 -8px 32px rgba(0,0,0,.08) */
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .command-picker {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow);
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
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
  /* 原值 10px，最近的档位是 lg 12px */
  border-radius: var(--el-radius-lg, 12px);
}

/* 键盘焦点环：列表项是 div + @click，键盘可达性靠 ChatInput 的上下键
   （moveUp / moveDown）+ .active 态；这里补上可见焦点环，双通道不冲突 */
.picker-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.picker-item:hover,
.picker-item.active {
  background: var(--el-fill-color-light);
}

.dark .picker-item:hover,
.dark .picker-item.active {
  background: var(--el-fill-color);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  flex-shrink: 0;
  margin-top: 2px;
  /* 图标与底色同源：默认主色，按类型覆盖。全部走 --el-* 令牌，换肤自动跟随 */
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.item-glyph {
  width: 16px;
  height: 16px;
}

.item-icon--image { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.item-icon--knowledge { color: var(--el-color-warning); background: var(--el-color-warning-light-9); }
.item-icon--model { color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.item-icon--skill { color: var(--el-color-info); background: var(--el-color-info-light-9); }
.item-icon--session { color: var(--el-color-success); background: var(--el-color-success-light-9); }
.item-icon--compress { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

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
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
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
  border-top: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-page);
}

.dark .picker-search {
  border-top-color: var(--el-border-color);
  background: var(--el-bg-color-page);
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

/* 输入框有 outline: none，必须补可见焦点指示，否则键盘用户看不出焦点在哪 */
.search-input:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
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
  /* 原值 3px，恰为 6px 滚动条宽的一半即胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
}

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .picker-item {
    transition: none;
  }
}
</style>
