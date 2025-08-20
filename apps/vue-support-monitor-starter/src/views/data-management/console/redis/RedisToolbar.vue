<template>
  <div class="toolbar">
    <el-button size="small" :disabled="!currentPath" @click="$emit('refresh')">
      <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
    </el-button>
  </div>
</template>

<script setup lang="ts">
import IconifyIconOnline from '@/components/IconifyIconOnline.vue'
const props = defineProps({ currentPath: { type: String, default: '' } })
const emits = defineEmits(['refresh'])
</script>

<style scoped>
.toolbar { display:flex; gap:8px }
</style>
