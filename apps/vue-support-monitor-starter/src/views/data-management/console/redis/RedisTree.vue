<template>
  <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
    <el-input
      v-model="keywordLocal"
      placeholder="搜索..."
      size="small"
      clearable
      @change="$emit('search', keywordLocal)"
    >
      <template #append>
        <IconifyIconOnline icon="ri:search-line" />
      </template>
    </el-input>

    <el-tree
      class="tree"
      :data="treeData"
      :props="treeProps"
      :load="loadChildrenLazy"
      lazy
      node-key="path"
      :expand-on-click-node="false"
      @node-click="$emit('node-click', $event)"
      @node-contextmenu="$emit('node-contextmenu', $event)"
    >
      <template #default="{ node, data }">
        <IconifyIconOnline :icon="getRedisNodeIcon(node, data)" class="mr-1" />
        <span class="flex justify-between w-full">
          <span>{{ data.name }}</span>
          <span v-if="data.type" class="el-form-item-msg ml-2 mt-[3px]">{{ data.type }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import IconifyIconOnline from '@/components/IconifyIconOnline.vue'

const props = defineProps({
  treeData: { type: Array, default: () => [] },
  treeProps: { type: Object, default: () => ({ label: 'name', children: 'children', isLeaf: 'leaf' }) },
  loadChildrenLazy: { type: Function, default: () => {} },
  keyword: { type: String, default: '' }
})

const emits = defineEmits(['node-click', 'node-contextmenu', 'search'])

const keywordLocal = ref(props.keyword || '')
watch(() => props.keyword, v => (keywordLocal.value = v || ''))

function getRedisNodeIcon(node: any, data: any) {
  const type = (data?.type || '').toString().toLowerCase()
  if (type.includes('db')) return 'ri:database-2-line'
  if (type.includes('key')) return 'ri:key-2-line'
  const level = Number(node?.level || 0)
  if (level <= 1) return 'ri:database-2-line'
  return data?.leaf ? 'ri:file-2-line' : 'ri:folder-2-line'
}
</script>

<style scoped>
.tree { margin-top: 8px; }
</style>
