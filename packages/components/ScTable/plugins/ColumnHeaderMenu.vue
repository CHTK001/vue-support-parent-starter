<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="sc-column-header-menu"
      :style="{ top: `${adjustedPosition.y}px`, left: `${adjustedPosition.x}px` }"
      @click.stop
      @contextmenu.prevent
    >
      <ul class="sc-column-header-menu__list">
        <!-- 排序 -->
        <li class="sc-column-header-menu__item" @click="handleSortAsc" @mousedown.prevent>
          <span class="sc-column-header-menu__icon">↑</span>
          <span class="sc-column-header-menu__title">升序排序</span>
        </li>
        <li class="sc-column-header-menu__item" @click="handleSortDesc" @mousedown.prevent>
          <span class="sc-column-header-menu__icon">↓</span>
          <span class="sc-column-header-menu__title">降序排序</span>
        </li>

        <li class="sc-column-header-menu__divider"></li>

        <!-- 列宽自适应 -->
        <li class="sc-column-header-menu__item" @click="handleFitWidth" @mousedown.prevent>
          <span class="sc-column-header-menu__icon">↔</span>
          <span class="sc-column-header-menu__title">列宽自适应内容</span>
        </li>

        <li class="sc-column-header-menu__divider"></li>

        <!-- 显示字段类型 -->
        <li class="sc-column-header-menu__item" @click="handleToggleType" @mousedown.prevent>
          <span class="sc-column-header-menu__check">{{ showColumnType ? '☑' : '☐' }}</span>
          <span class="sc-column-header-menu__title">显示字段类型</span>
          <span v-if="columnMeta?.type" class="sc-column-header-menu__hint">{{ columnMeta.type }}</span>
        </li>

        <!-- 显示字段注释 -->
        <li class="sc-column-header-menu__item" @click="handleToggleComment" @mousedown.prevent>
          <span class="sc-column-header-menu__check">{{ showColumnComment ? '☑' : '☐' }}</span>
          <span class="sc-column-header-menu__title">显示字段注释</span>
          <span v-if="columnMeta?.comment" class="sc-column-header-menu__hint">{{ columnMeta.comment }}</span>
        </li>

        <!-- 显示数据注释 -->
        <li class="sc-column-header-menu__item" @click="handleToggleDataComment" @mousedown.prevent>
          <span class="sc-column-header-menu__check">{{ showDataComment ? '☑' : '☐' }}</span>
          <span class="sc-column-header-menu__title">显示数据注释</span>
        </li>

        <li class="sc-column-header-menu__divider"></li>

        <!-- 编辑注解 -->
        <li class="sc-column-header-menu__item" @click="handleEditAnnotation" @mousedown.prevent>
          <span class="sc-column-header-menu__icon">✏</span>
          <span class="sc-column-header-menu__title">编辑注解</span>
        </li>
      </ul>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  column: { type: Object, default: null },
  columnMeta: { type: Object, default: null },
  showColumnType: { type: Boolean, default: false },
  showColumnComment: { type: Boolean, default: false },
  showDataComment: { type: Boolean, default: false },
  tableId: { type: String, default: '' },
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
])

const menuRef = ref(null)

// 边界检测，防止菜单超出视口
const adjustedPosition = computed(() => {
  const { x, y } = props.position
  if (!props.visible) return { x, y }

  const menuWidth = 220
  const menuHeight = 280
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
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      document.addEventListener('mousedown', handleDocumentMousedown)
    })
  } else {
    document.removeEventListener('mousedown', handleDocumentMousedown)
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleDocumentMousedown)
})

const handleSortAsc = () => {
  emit('sort-asc', { prop: props.column?.prop })
  emit('close')
}

const handleSortDesc = () => {
  emit('sort-desc', { prop: props.column?.prop })
  emit('close')
}

const handleFitWidth = () => {
  emit('fit-width', { prop: props.column?.prop })
  emit('close')
}

const handleToggleType = () => {
  emit('toggle-type')
}

const handleToggleComment = () => {
  emit('toggle-comment')
}

const handleToggleDataComment = () => {
  emit('toggle-data-comment')
}

const handleEditAnnotation = () => {
  emit('edit-annotation', {
    prop: props.column?.prop,
    currentComment: props.columnMeta?.comment || '',
  })
  emit('close')
}
</script>

<style scoped>
.sc-column-header-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  border-radius: 10px;
  box-shadow: var(--stitch-lay-shadow-lg);
  background-color: var(--stitch-lay-bg-overlay);
  padding: 5px 0;
  font-size: 13px;
  animation: fadeIn 0.15s ease-out;
  backdrop-filter: blur(20px);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.sc-column-header-menu__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sc-column-header-menu__item {
  display: flex;
  align-items: center;
  padding: 5px 14px;
  cursor: pointer;
  white-space: nowrap;
  color: var(--stitch-lay-text-normal);
  transition: all 0.15s;
  gap: 6px;
}

.sc-column-header-menu__item:hover {
  background-color: var(--stitch-lay-bg-hover);
  color: var(--stitch-lay-primary);
}

.sc-column-header-menu__icon,
.sc-column-header-menu__check {
  width: 18px;
  text-align: center;
  flex-shrink: 0;
  font-size: 14px;
}

.sc-column-header-menu__title {
  flex: 1;
}

.sc-column-header-menu__hint {
  font-size: 11px;
  color: var(--stitch-lay-text-secondary);
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-column-header-menu__divider {
  height: 1px;
  margin: 4px 0;
  background-color: var(--stitch-lay-border);
}
</style>
