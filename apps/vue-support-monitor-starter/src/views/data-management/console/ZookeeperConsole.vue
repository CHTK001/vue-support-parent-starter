<template>
  <div class="console">
    <div class="left">
      <el-tree
        :data="treeData"
        node-key="path"
        :props="{ label: 'name', children: 'children', isLeaf: 'leaf' }"
        :load="loadChildrenLazy"
        lazy
        @node-click="open"
      >
        <template #default="{ node, data }">
          <IconifyIconOnline :icon="getZkNodeIcon(node, data)" class="mr-6" />
          <span>{{ data.name }}</span>
        </template>
      </el-tree>
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
import { extractArrayFromApi, normalizeTreeNode } from '@/views/data-management/utils/dataTree'
const props = defineProps<{ id: number }>()
const treeData = ref<any[]>([])
const path = ref<string | undefined>(undefined)
const content = ref('')

async function loadRoot() {
  const res = await request({ url: `/system/data/console/${props.id}/root`, method: 'get' })
  const records = extractArrayFromApi(res?.data)
  treeData.value = records.map(normalizeTreeNode)
}
const loadChildrenLazy = async (node: any, resolve: (children: any[]) => void) => {
  if (!node || node.level === 0) { return resolve(treeData.value || []) }
  const data = node.data || {}
  if (data.leaf === true) { return resolve([]) }
  const res = await request({ url: `/system/data/console/${props.id}/children`, method: 'get', params: { parentPath: data.path } })
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode))
}

function getZkNodeIcon(node: any, data: any): string {
  const level = Number(node?.level || 0)
  // ZK 通常全是目录/节点，叶子用file，非叶子用folder，根节点用server
  if (level === 1) return 'ri:server-line'
  return data?.leaf ? 'ri:file-2-line' : 'ri:folder-2-line'
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


