<template>
  <div 
    v-show="visible" 
    class="common-context-menu" 
    :style="{ left: x + 'px', top: y + 'px' }"
    @contextmenu.prevent
  >
    <div 
      v-for="item in items" 
      :key="item.key"
      class="menu-item"
      :class="{ disabled: item.disabled }"
      @click="handleClick(item)"
    >
      <IconifyIconOnline 
        v-if="item.icon" 
        :icon="item.icon" 
        class="menu-item-icon"
      />
      <span class="menu-item-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
}

interface Props {
  items?: MenuItem[]
  visible?: boolean
  x?: number
  y?: number
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  visible: false,
  x: 0,
  y: 0
})

const emit = defineEmits<{
  (e: 'select', key: string): void
  (e: 'close'): void
}>()

function handleClick(item: MenuItem) {
  if (item.disabled) return
  emit('select', item.key)
  emit('close')
}

function handleClickOutside(event: MouseEvent) {
  const element = document.querySelector('.common-context-menu')
  if (element && !element.contains(event.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.common-context-menu {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 6px 0;
  min-width: 160px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  color: #606266;
}

.menu-item:hover:not(.disabled) {
  background-color: #f5f7fa;
  color: #409eff;
}

.menu-item.disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.menu-item-icon {
  margin-right: 8px;
  font-size: 16px;
}

.menu-item-label {
  flex: 1;
}
</style>