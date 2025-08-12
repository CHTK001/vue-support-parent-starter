<template>
  <div class="console">
    <div class="left">
      <el-tree :data="treeData" node-key="path" :props="{ label: 'name', children: 'children' }" @node-click="open" />
    </div>
    <div class="right">
      <div class="path">{{ path || '未选择' }}</div>
      <el-input v-model="content" type="textarea" :rows="16" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/api/config'
const props = defineProps<{ id: number }>()
const treeData = ref<any[]>([])
const path = ref<string | undefined>(undefined)
const content = ref('')
async function loadRoot() {
  const res = await request({ url: `/system/data/console/${props.id}/root`, method: 'get' })
  treeData.value = res?.data?.records || []
}
async function open(node: any) {
  path.value = node?.path
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: 'get', params: { nodePath: path.value } })
  content.value = res?.data?.data || ''
}
onMounted(loadRoot)
</script>
<style scoped>
.console { display:grid; grid-template-columns: 300px 1fr; gap:12px; height: calc(100vh - 180px) }
.left { border:1px solid #eee; border-radius:8px; padding:8px; display:flex; flex-direction:column }
.right { border:1px solid #eee; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:8px }
.path { color:#64748b }
</style>


