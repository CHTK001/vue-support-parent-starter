<template>
  <div 
    v-show="visible" 
    class="common-context-menu" 
    :style="{ left: x + 'px', top: y + 'px' }"
    @contextmenu.prevent
  >
    <template v-for="item in items" :key="item.key">
      <div v-if="item.divider" class="menu-divider" />
      <div 
        v-else
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
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

export interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
  divider?: boolean
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

<style scoped lang="scss">
.common-context-menu {
  position: fixed;
  z-index: 9999;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 8px;
  min-width: 180px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  color: #334155;
  border-radius: 8px;
  transition: all 0.15s ease;
  margin: 2px 0;
}

.menu-item:hover:not(.disabled) {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  color: #2563eb;
}

.menu-item:active:not(.disabled) {
  transform: scale(0.98);
}

.menu-item.disabled {
  color: #94a3b8;
  cursor: not-allowed;
}

.menu-item-icon {
  margin-right: 10px;
  font-size: 16px;
  opacity: 0.8;
}

.menu-item:hover:not(.disabled) .menu-item-icon {
  opacity: 1;
}

.menu-item-label {
  flex: 1;
  font-weight: 500;
}

.menu-divider {
  height: 1px;
  margin: 8px 4px;
  background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
}
</style>