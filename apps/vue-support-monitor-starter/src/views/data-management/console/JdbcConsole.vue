<template>
  <div class="console">
    <div class="left" @contextmenu.prevent>
      <el-input v-model="keyword" placeholder="搜索..." size="small" clearable @change="loadRoot" />
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="path"
        @node-click="handleNodeClick"
        @node-contextmenu="handleNodeContextMenu"
        class="tree"
      />
    </div>
    <div class="right">
      <div class="editor-bar">
        <el-button type="primary" size="small" @click="execute">执行</el-button>
        <el-button size="small" @click="formatSql">格式化</el-button>
      </div>
      <CodeEditor v-model:content="sql" :showTool="false" :height="'260px'" :options="{ mode: 'sql' }" />
      <div class="result">
        <el-table v-if="rows.length" :data="rows" size="small" height="260">
          <el-table-column v-for="col in columns" :key="col" :prop="col" :label="col" :min-width="120" />
        </el-table>
        <el-empty v-else description="无结果" />
      </div>
    </div>
    <CommonContextMenu
      :visible="menuVisible"
      :x="menuX"
      :y="menuY"
      :items="menuItems"
      @select="onMenuSelect"
      @close="menuVisible = false"
    />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CodeEditor from '@/components/codeEditor/index.vue'
import request from '@/api/config'
import CommonContextMenu, { type MenuItem } from '@/components/CommonContextMenu.vue'
import { getConsoleConfig } from '@/api/system-data'

const props = defineProps<{ id: number }>()

const treeData = ref<any[]>([])
const treeProps = { label: 'name', children: 'children' }
const keyword = ref('')
const currentPath = ref<string | undefined>(undefined)

const sql = ref('select 1')
const columns = ref<string[]>([])
const rows = ref<any[]>([])

// console config
const consoleConfig = ref<{ jdbc?: { viewTableStructure?: boolean; copyTableName?: boolean; copyCreateTable?: boolean } }>({})

async function loadConsoleConfig() {
  if (!props.id) return
  const res = await getConsoleConfig(props.id)
  const text = res?.data as string | undefined
  if (text) {
    try {
      consoleConfig.value = JSON.parse(text) || {}
    } catch (_) {
      consoleConfig.value = {}
    }
  }
}

async function loadRoot() {
  const res = await request({ url: `/system/data/console/${props.id}/root`, method: 'get', params: { keyword: keyword.value } })
  treeData.value = res?.data?.records || []
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path
  const res = await request({ url: `/system/data/console/${props.id}/children`, method: 'get', params: { parentPath: currentPath.value } })
  node.children = res?.data?.records || []
}

async function execute() {
  const res = await request({ url: `/system/data/console/${props.id}/execute`, method: 'post', params: { type: 'sql' }, data: sql.value })
  const data = res?.data
  columns.value = data?.columns || []
  rows.value = data?.rows || []
}

function formatSql() {
  // 预留：格式化
}

// context menu state
const menuVisible = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const contextNode = ref<any | null>(null)

function buildMenuItems(): MenuItem[] {
  const allow = (p?: boolean) => Boolean(p)
  const items: MenuItem[] = []
  if (allow(consoleConfig.value.jdbc?.viewTableStructure)) items.push({ key: 'view-structure', label: '查看表结构', icon: 'ri:table-2' })
  if (allow(consoleConfig.value.jdbc?.copyTableName)) items.push({ key: 'copy-table-name', label: '复制表名', icon: 'ri:file-copy-line' })
  if (allow(consoleConfig.value.jdbc?.copyCreateTable)) items.push({ key: 'copy-create-sql', label: '复制建表语句', icon: 'ri:article-line' })
  return items
}

const menuItems = ref<MenuItem[]>([])

function handleNodeContextMenu(event: MouseEvent, data: any) {
  contextNode.value = data
  menuItems.value = buildMenuItems()
  menuX.value = event.clientX
  menuY.value = event.clientY
  menuVisible.value = true
  const hide = () => { menuVisible.value = false; document.removeEventListener('click', hide) }
  document.addEventListener('click', hide)
}

async function onMenuSelect(key: string) {
  if (!contextNode.value) return
  switch (key) {
    case 'view-structure':
      await viewTableStructure(contextNode.value)
      break
    case 'copy-table-name':
      await copyTableName(contextNode.value)
      break
    case 'copy-create-sql':
      await copyCreateSql(contextNode.value)
      break
  }
}

async function viewTableStructure(node: any) {
  if (!node?.path) return
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: 'get', params: { nodePath: node.path, action: 'structure' } })
  const detail = res?.data?.data || ''
  // 简单展示：放到 editor 中
  sql.value = typeof detail === 'string' ? detail : JSON.stringify(detail, null, 2)
}

async function copyTableName(node: any) {
  const name = node?.name || ''
  if (!name) return
  await navigator.clipboard.writeText(name)
}

async function copyCreateSql(node: any) {
  if (!node?.path) return
  const res = await request({ url: `/system/data/console/${props.id}/node`, method: 'get', params: { nodePath: node.path, action: 'ddl' } })
  const ddl = res?.data?.data || ''
  await navigator.clipboard.writeText(typeof ddl === 'string' ? ddl : JSON.stringify(ddl))
}

onMounted(async () => {
  await Promise.all([loadConsoleConfig(), loadRoot()])
})
</script>
<style scoped>
.console { display:grid; grid-template-columns: 300px 1fr; gap:12px; height: calc(100vh - 180px) }
.left { border:1px solid #eee; border-radius:8px; padding:8px; display:flex; flex-direction:column }
.tree { margin-top:8px; overflow:auto }
.right { border:1px solid #eee; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:8px }
.editor-bar { display:flex; gap:8px }
.result { flex:1; overflow:auto }
</style>


