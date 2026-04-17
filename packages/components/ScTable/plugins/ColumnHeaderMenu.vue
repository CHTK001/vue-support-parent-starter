<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="col-header-menu"
      :style="{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <!-- 排序 -->
      <button type="button" class="col-header-menu__item" @click="handleSortAsc" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><SortUp /></ElIcon>
        <span>升序排序</span>
      </button>
      <button type="button" class="col-header-menu__item" @click="handleSortDesc" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><SortDown /></ElIcon>
        <span>降序排序</span>
      </button>

      <div class="col-header-menu__divider" />

      <!-- 列宽自适应 -->
      <button type="button" class="col-header-menu__item" @click="handleFitWidth" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><Rank /></ElIcon>
        <span>列宽自适应内容</span>
      </button>

      <div class="col-header-menu__divider" />

      <!-- 筛选此列 -->
      <button type="button" class="col-header-menu__item" @click="handleFilterColumn" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><Filter /></ElIcon>
        <span>筛选此列</span>
      </button>

      <!-- 清空筛选 -->
      <button
        type="button"
        class="col-header-menu__item"
        :class="{ 'is-disabled': !hasFilters }"
        :disabled="!hasFilters"
        @click="handleClearFilters"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon"><CircleClose /></ElIcon>
        <span>清空筛选条件</span>
      </button>

      <div class="col-header-menu__divider" />

      <!-- 固定列 -->
      <button type="button" class="col-header-menu__item col-header-menu__item--has-sub" @click="toggleFreezePanel" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><Lock /></ElIcon>
        <span>固定列</span>
        <ElIcon class="col-header-menu__arrow"><ArrowRight /></ElIcon>
      </button>

      <!-- 固定列子面板 -->
      <div v-if="showFreezePanel && allColumns.length" class="col-header-menu__sub-panel">
        <div class="col-header-menu__sub-title">勾选后固定到左侧</div>
        <div
          v-for="col in allColumns"
          :key="col"
          class="col-header-menu__sub-item"
          @click.stop="toggleFreezeColumn(col)"
          @mousedown.prevent
        >
          <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
            <Check v-if="frozenColumns.includes(col)" />
            <span v-else class="col-header-menu__empty-check" />
          </ElIcon>
          <span>{{ col }}</span>
        </div>
      </div>

      <div class="col-header-menu__divider" />

      <!-- 表头注释模式 -->
      <div class="col-header-menu__group-label">表头注释</div>
      <div class="col-header-menu__radio-row">
        <button
          v-for="opt in commentModeOptions"
          :key="opt.value"
          type="button"
          class="col-header-menu__radio"
          :class="{ 'is-active': tableCommentMode === opt.value }"
          @click="emit('change-table-comment-mode', opt.value)"
          @mousedown.prevent
        >{{ opt.label }}</button>
      </div>

      <!-- 数据注释模式 -->
      <div class="col-header-menu__group-label">数据注释</div>
      <div class="col-header-menu__radio-row">
        <button
          v-for="opt in commentModeOptions"
          :key="opt.value"
          type="button"
          class="col-header-menu__radio"
          :class="{ 'is-active': dataCommentMode === opt.value }"
          @click="emit('change-data-comment-mode', opt.value)"
          @mousedown.prevent
        >{{ opt.label }}</button>
      </div>

      <div class="col-header-menu__divider" />

      <!-- 显示字段类型 -->
      <button
        type="button"
        class="col-header-menu__item col-header-menu__item--toggle"
        :class="{ 'is-active': showColumnType }"
        @click="handleToggleType"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
          <Check v-if="showColumnType" />
          <span v-else class="col-header-menu__empty-check" />
        </ElIcon>
        <span>显示字段类型</span>
      </button>

      <!-- 显示字段注释 -->
      <button
        type="button"
        class="col-header-menu__item col-header-menu__item--toggle"
        :class="{ 'is-active': showColumnComment }"
        @click="handleToggleComment"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
          <Check v-if="showColumnComment" />
          <span v-else class="col-header-menu__empty-check" />
        </ElIcon>
        <span>显示字段注释（表头）</span>
      </button>

      <!-- 显示数据注释 -->
      <button
        type="button"
        class="col-header-menu__item col-header-menu__item--toggle"
        :class="{ 'is-active': showDataComment }"
        @click="handleToggleDataComment"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
          <Check v-if="showDataComment" />
          <span v-else class="col-header-menu__empty-check" />
        </ElIcon>
        <span>显示数据注释（单元格）</span>
      </button>

      <div class="col-header-menu__divider" />

      <!-- 显示序列 -->
      <button
        type="button"
        class="col-header-menu__item col-header-menu__item--toggle"
        :class="{ 'is-active': showSequence }"
        @click="emit('toggle-sequence')"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
          <Check v-if="showSequence" />
          <span v-else class="col-header-menu__empty-check" />
        </ElIcon>
        <span>显示序列号</span>
      </button>

      <!-- 查总量 -->
      <button
        type="button"
        class="col-header-menu__item col-header-menu__item--toggle"
        :class="{ 'is-active': loadTotal }"
        @click="emit('toggle-load-total')"
        @mousedown.prevent
      >
        <ElIcon class="col-header-menu__icon col-header-menu__icon--check">
          <Check v-if="loadTotal" />
          <span v-else class="col-header-menu__empty-check" />
        </ElIcon>
        <span>查询总行数</span>
      </button>

      <div class="col-header-menu__divider" />

      <!-- 数据模式 -->
      <div class="col-header-menu__group-label">数据模式</div>
      <div class="col-header-menu__radio-row">
        <button
          v-for="opt in paginationModeOptions"
          :key="opt.value"
          type="button"
          class="col-header-menu__radio"
          :class="{ 'is-active': paginationMode === opt.value }"
          @click="emit('change-pagination-mode', opt.value)"
          @mousedown.prevent
        >{{ opt.label }}</button>
      </div>

      <div class="col-header-menu__divider" />

      <!-- 编辑注解 -->
      <button type="button" class="col-header-menu__item" @click="handleEditAnnotation" @mousedown.prevent>
        <ElIcon class="col-header-menu__icon"><EditPen /></ElIcon>
        <span>编辑注解</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import { ElIcon } from 'element-plus'
import { ArrowRight, Check, CircleClose, EditPen, Filter, Lock, Rank, SortDown, SortUp } from '@element-plus/icons-vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  column: { type: Object, default: null },
  columnMeta: { type: Object, default: null },
  showColumnType: { type: Boolean, default: false },
  showColumnComment: { type: Boolean, default: false },
  showDataComment: { type: Boolean, default: false },
  tableId: { type: String, default: '' },
  allColumns: { type: Array, default: () => [] },
  frozenColumns: { type: Array, default: () => [] },
  hasFilters: { type: Boolean, default: false },
  // 表格级别设置
  tableCommentMode: { type: String, default: 'native' },
  dataCommentMode: { type: String, default: 'native' },
  showSequence: { type: Boolean, default: true },
  loadTotal: { type: Boolean, default: false },
  paginationMode: { type: String, default: 'pagination' },
})

const emit = defineEmits([
  'close',
  'sort-asc',
  'sort-desc',
  'fit-width',
  'toggle-type',
  'toggle-comment',
  'toggle-data-comment',
  'edit-annotation',
  'filter-column',
  'clear-filters',
  'toggle-freeze-column',
  'change-table-comment-mode',
  'change-data-comment-mode',
  'toggle-sequence',
  'toggle-load-total',
  'change-pagination-mode',
])

const commentModeOptions = [
  { label: '原生', value: 'native' },
  { label: '注释', value: 'comment' },
  { label: '混合', value: 'mixed' },
]

const paginationModeOptions = [
  { label: '分页', value: 'pagination' },
  { label: '全部', value: 'full' },
]

const menuRef = ref(null)
const showFreezePanel = ref(false)

const adjustedPosition = computed(() => {
  const { x, y } = props.position
  if (!props.visible) return { x, y }
  const menuWidth = 220
  const menuHeight = 560
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    x: x + menuWidth > vw ? Math.max(0, vw - menuWidth - 8) : x,
    y: y + menuHeight > vh ? Math.max(0, vh - menuHeight - 8) : y,
  }
})

const handleDocumentMousedown = (e) => {
  if (!props.visible) return
  if (menuRef.value && menuRef.value.contains(e.target)) return
  emit('close')
  showFreezePanel.value = false
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => document.addEventListener('mousedown', handleDocumentMousedown))
  } else {
    document.removeEventListener('mousedown', handleDocumentMousedown)
    showFreezePanel.value = false
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown)
})

const handleSortAsc = () => { emit('sort-asc', { prop: props.column?.prop }); emit('close') }
const handleSortDesc = () => { emit('sort-desc', { prop: props.column?.prop }); emit('close') }
const handleFitWidth = () => { emit('fit-width', { prop: props.column?.prop }); emit('close') }
const handleToggleType = () => { emit('toggle-type') }
const handleToggleComment = () => { emit('toggle-comment') }
const handleToggleDataComment = () => { emit('toggle-data-comment') }
const handleEditAnnotation = () => {
  emit('edit-annotation', { prop: props.column?.prop, currentComment: props.columnMeta?.comment || '' })
  emit('close')
}
const handleFilterColumn = () => {
  emit('filter-column', { prop: props.column?.prop })
  emit('close')
}
const handleClearFilters = () => {
  if (!props.hasFilters) return
  emit('clear-filters')
  emit('close')
}
const toggleFreezePanel = () => {
  showFreezePanel.value = !showFreezePanel.value
}
const toggleFreezeColumn = (col) => {
  emit('toggle-freeze-column', { col })
}
</script>

<style scoped>
.col-header-menu {
  position: fixed;
  z-index: 9999;
  display: grid;
  gap: 1px;
  min-width: 200px;
  padding: 4px;
  border: 1px solid rgba(112, 136, 151, 0.18);
  border-radius: 10px;
  background: rgba(250, 252, 255, 0.98);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(12px);
  animation: colMenuFadeIn 0.12s ease-out;
}

@keyframes colMenuFadeIn {
  from { opacity: 0; transform: translateY(-3px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.col-header-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #173246;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s;
}

.col-header-menu__item:hover:not(.is-disabled) {
  background: rgba(37, 99, 235, 0.08);
}

.col-header-menu__item.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.col-header-menu__item--toggle.is-active {
  color: var(--el-color-primary, #409eff);
}

.col-header-menu__item--has-sub {
  justify-content: space-between;
}

.col-header-menu__icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 16px;
  color: #5a7080;
}

.col-header-menu__icon--check { color: inherit; }

.col-header-menu__item--toggle.is-active .col-header-menu__icon {
  color: var(--el-color-primary, #409eff);
}

.col-header-menu__arrow {
  font-size: 12px;
  color: #8a9aaa;
  margin-left: auto;
}

.col-header-menu__empty-check {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1.5px solid #b0bec5;
  border-radius: 3px;
}

.col-header-menu__divider {
  height: 1px;
  margin: 3px 2px;
  background: rgba(112, 136, 151, 0.16);
}

/* 分组标签 */
.col-header-menu__group-label {
  padding: 4px 9px 2px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: #8a9aaa;
  text-transform: uppercase;
}

/* 单选行 */
.col-header-menu__radio-row {
  display: flex;
  gap: 3px;
  padding: 2px 6px 4px;
}

.col-header-menu__radio {
  flex: 1;
  padding: 4px 6px;
  border: 1px solid rgba(112, 136, 151, 0.2);
  border-radius: 6px;
  background: transparent;
  color: #5a7080;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.1s;
  text-align: center;
}

.col-header-menu__radio:hover {
  background: rgba(37, 99, 235, 0.06);
  border-color: rgba(37, 99, 235, 0.2);
}

.col-header-menu__radio.is-active {
  background: rgba(37, 99, 235, 0.1);
  border-color: rgba(37, 99, 235, 0.35);
  color: var(--el-color-primary, #409eff);
  font-weight: 500;
}

/* 固定列子面板 */
.col-header-menu__sub-panel {
  margin: 2px 4px;
  padding: 4px;
  border: 1px solid rgba(112, 136, 151, 0.14);
  border-radius: 7px;
  background: rgba(245, 248, 252, 0.9);
  max-height: 180px;
  overflow-y: auto;
}

.col-header-menu__sub-title {
  font-size: 11px;
  color: #8a9aaa;
  padding: 2px 6px 4px;
}

.col-header-menu__sub-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 6px;
  border-radius: 5px;
  font-size: 12px;
  color: #173246;
  cursor: pointer;
  transition: background 0.1s;
}

.col-header-menu__sub-item:hover {
  background: rgba(37, 99, 235, 0.08);
}
</style>
