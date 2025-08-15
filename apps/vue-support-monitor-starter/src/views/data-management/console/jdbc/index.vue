<template>
  <div class="console">
    <div class="left">
      <el-input v-model="keyword" placeholder="搜索..." size="small" clearable @change="loadRoot" />
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="path"
        :default-expanded-keys="expandedKeys"
        @node-click="handleNodeClick"
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
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CodeEditor from '@/components/codeEditor/index.vue'
import request from '@/api/config'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = Number(route.query.id)

const treeData = ref<any[]>([])
const treeProps = { label: 'name', children: 'children' }
const keyword = ref('')
const currentPath = ref<string | undefined>(undefined)
const expandedKeys = ref<string[]>([])

const sql = ref('select 1')
const columns = ref<string[]>([])
const rows = ref<any[]>([])

async function loadRoot() {
  const res = await request({ url: `/system/data/console/${id}/root`, method: 'get', params: { keyword: keyword.value } })
  treeData.value = res?.data?.records || []
  expandedKeys.value = treeData.value.slice(0, 3).map((n: any) => n.path)
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path
  const res = await request({ url: `/system/data/console/${id}/children`, method: 'get', params: { parentPath: currentPath.value } })
  node.children = res?.data?.records || []
}

async function execute() {
  const res = await request({ url: `/system/data/console/${id}/execute`, method: 'post', params: { type: 'sql' }, data: sql.value })
  const data = res?.data
  columns.value = data?.columns || []
  rows.value = data?.rows || []
}

function formatSql() {
  // TODO: SQL 格式化
}

onMounted(loadRoot)
</script>
<style scoped>
.console { display:grid; grid-template-columns: 300px 1fr; gap:12px; height: calc(100vh - 180px) }
.left { border:1px solid var(--el-border-color-lighter); border-radius:8px; padding:8px; display:flex; flex-direction:column }
.tree { margin-top:8px; overflow:auto }
.right { border:1px solid var(--el-border-color-lighter); border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:8px }
.editor-bar { display:flex; gap:8px }
.result { flex:1; overflow:auto }
</style>

