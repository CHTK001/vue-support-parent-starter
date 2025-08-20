<template>
  <div class="toolbar">
    <el-button v-if="showEditor" type="primary" size="small" @click="$emit('execute')" title="执行SQL">
      <IconifyIconOnline :icon="icons.execute" class="mr-1" />
    </el-button>
    <el-button size="small" @click="$emit('reset-tree')" title="刷新表结构">
      <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
    </el-button>
    <el-button v-if="showEditor" size="small" @click="$emit('format')" title="格式化SQL">
      <IconifyIconOnline :icon="formatIcon" class="mr-1" />
    </el-button>
    <el-button size="small" :disabled="!currentPath" @click="$emit('open-structure')">
      <IconifyIconOnline :icon="icons.structure" class="mr-1" />
      结构
    </el-button>
    <el-button-group>
      <el-button size="small" :type="showTableComment ? 'primary' : 'default'" :disabled="!searched" @click="$emit('toggle-table-comment')">表头注释</el-button>
      <el-button size="small" :type="showFieldComments ? 'primary' : 'default'" :disabled="!searched" @click="$emit('toggle-field-comment')">字段注释</el-button>
    </el-button-group>
    <el-button size="small" :disabled="!currentPath || !columnsLength" @click="$emit('toggle-analyze')">
      <IconifyIconOnline :icon="analyzing ? 'ri:close-circle-line' : 'ri:bar-chart-2-line'" class="mr-1" />
      {{ analyzing ? '退出分析' : '分析' }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import IconifyIconOnline from '@/components/IconifyIconOnline.vue';
import { computed } from 'vue';

const props = defineProps({
  showEditor: { type: Boolean, default: true },
  formatIcon: { type: String, default: '' },
  icons: { type: Object, default: () => ({ execute: 'ri:play-circle-line', structure: 'ri:table-2' }) },
  currentPath: { type: String, default: '' },
  searched: { type: Boolean, default: false },
  showTableComment: { type: Boolean, default: false },
  showFieldComments: { type: Boolean, default: false },
  analyzing: { type: Boolean, default: false },
  columnsLength: { type: Number, default: 0 }
});

const emits = defineEmits(['execute','reset-tree','format','open-structure','toggle-table-comment','toggle-field-comment','toggle-analyze']);
</script>

<style scoped>
.toolbar { display:flex; gap:8px; }
</style>
