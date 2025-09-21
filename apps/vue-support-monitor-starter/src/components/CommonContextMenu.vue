<template>
  <div v-if="visible" class="context-menu" :style="{ left: x + 'px', top: y + 'px' }" @click.stop>
    <ul class="menu-list">
      <li
        v-for="item in items"
        :key="item.key"
        class="menu-item"
        :class="{ disabled: item.disabled }"
        @click="handleClick(item)"
      >
        <span class="icon" v-if="item.icon">
          <IconifyIconOnline :icon="item.icon" />
        </span>
        <span class="label">{{ item.label }}</span>
      </li>
    </ul>
  </div>
  <Teleport to="body">
    <div v-if="visible" class="context-menu-mask" @click="emit('close')" />
  </Teleport>
  
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'

export interface MenuItem {
  key: string
  label: string
  icon?: string
  disabled?: boolean
}

const props = defineProps<{
  visible: boolean
  x: number
  y: number
  items: MenuItem[]
}>()

const emit = defineEmits<{
  (e: 'select', key: string): void
  (e: 'close'): void
}>()

function handleClick(item: MenuItem) {
  if (item.disabled) return
  emit('select', item.key)
  emit('close')
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 3000;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  min-width: 180px;
  padding: 6px;
}
.menu-list { list-style: none; margin: 0; padding: 0; }
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.menu-item:hover { background: var(--el-fill-color-light); }
.menu-item.disabled { color: var(--el-text-color-disabled); cursor: not-allowed; }
.icon { display: inline-flex; width: 16px; height: 16px; }
.label { flex: 1; }
.context-menu-mask { position: fixed; inset: 0; z-index: 2999; }
</style>


