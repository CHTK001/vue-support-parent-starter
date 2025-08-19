<template>
  <div class="console" :style="gridStyle">
    <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
      <el-input v-model="keyword" placeholder="搜索..." size="small" clearable @change="loadRoot">
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
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <IconifyIconOnline :icon="getInfluxNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full">
            <span>{{ data.name }}</span>
            <span class="el-form-item-msg ml-2 mt-[3px]">{{ data.properties?.comment }}</span>
          </span>
        </template>
      </el-tree>
    </div>

    <div class="splitter cursor-col-resize" @mousedown="onDragStart" @dblclick="resetWidth" />

    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || '未选择' }}</span>
        </div>
        <div class="toolbar">
          <el-button type="primary" size="small" @click="execute">执行</el-button>
          <el-button size="small" @click="formatFlux">格式化</el-button>
        </div>
      </div>

      <div class="right-body">
        <CodeEditor v-model:content="flux" :showTool="false" :height="'200px'" :options="{ mode: 'sql' }" />
        <el-table border v-if="columns.length" :data="rows" size="small" height="580px">
          <el-table-column v-for="col in columns" :key="col" :prop="col" :label="col" :min-width="120" />
        </el-table>
        <el-empty v-else description="无结果" />
      </div>
      <div class="right-status"><span v-if="statusText">{{ statusText }}</span></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import CodeEditor from '@/components/codeEditor/index.vue'
import { extractArrayFromApi, normalizeTreeNode } from '@/views/data-management/utils/dataTree'
import { getConsoleRoot, getConsoleChildren, getConsoleNode, executeConsole } from '@/api/system-data'

const props = defineProps<{ id: number }>()

const treeData = ref<any[]>([])
const treeProps = { label: 'name', children: 'children', isLeaf: 'leaf' }
const keyword = ref('')
const currentPath = ref<string | undefined>(undefined)

const flux = ref<string>('from(bucket: "example")\n  |> range(start: -1h)\n  |> filter(fn: (r) => r._measurement == "cpu" )\n  |> limit(n: 100)')
const columns = ref<string[]>([])
const rows = ref<any[]>([])
const statusText = ref('')

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value)
  const records = extractArrayFromApi(res?.data)
  treeData.value = records.map(normalizeTreeNode)
}

const loadChildrenLazy = async (node: any, resolve: (children: any[]) => void) => {
  if (!node || node.level === 0) return resolve(treeData.value || [])
  const data = node.data || {}
  if (data.leaf === true) return resolve([])
  const res = await getConsoleChildren(props.id, data.path)
  resolve(extractArrayFromApi(res?.data).map(normalizeTreeNode))
}

function getInfluxNodeIcon(node: any, data: any): string {
  const type = (data?.type || '').toLowerCase()
  if (type.includes('org')) return 'ri:community-line'
  if (type.includes('bucket')) return 'ri:archive-2-line'
  if (type.includes('measurement')) return 'ri:bookmark-3-line'
  return data?.leaf ? 'ri:file-2-line' : 'ri:folder-2-line'
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path
  // 可根据节点类型生成示例 flux
  const t = (node?.type || '').toLowerCase()
  if (t.includes('bucket')) {
    flux.value = `from(bucket: "${node.name}")\n  |> range(start: -1h)\n  |> limit(n: 100)`
  }
}

async function execute() {
  const start = performance.now()
  const res = await executeConsole(props.id, flux.value, 'influx')
  const data = res?.data?.data || {}
  columns.value = data?.columns || []
  await Promise.resolve()
  rows.value = data?.rows || []
  const ms = Math.round(performance.now() - start)
  statusText.value = `已返回 ${rows.value.length} 行，用时 ${ms} ms, ${res?.data?.errorMessage || ''}`
}

function formatFlux() {
  const src = flux.value || ''
  if (!src.trim()) return
  // 简单格式化（占位，后续可接入专业格式化器）
  try {
    let s = src.replace(/\r\n/g, '\n')
    s = s.replace(/\|>\s*/g, '|> ')
    s = s.replace(/\s+/g, ' ')
    s = s.replace(/\s*\|>\s*/g, ' \n  |> ')
    flux.value = s
    statusText.value = '已格式化 Flux'
  } catch (_) {
    statusText.value = '格式化失败'
  }
}

// 左右拖拽
const leftWidth = ref(300)
const isDragging = ref(false)
const gridStyle = computed(() => ({ gridTemplateColumns: `${leftWidth.value}px 6px 1fr` }))
let startX = 0, startW = 300
function onDragStart(e: MouseEvent) {
  isDragging.value = true
  startX = e.clientX
  startW = leftWidth.value
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', onDragEnd)
  document.body.style.cursor = 'col-resize'
}
function onDragging(e: MouseEvent) {
  if (!isDragging.value) return
  const dx = e.clientX - startX
  leftWidth.value = Math.min(800, Math.max(220, startW + dx))
}
function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', onDragEnd)
  document.body.style.cursor = ''
}
function resetWidth() { leftWidth.value = 300 }

onBeforeUnmount(() => onDragEnd())

onMounted(loadRoot)
</script>
<style scoped lang="scss">
.console { display: grid; grid-template-columns: 300px 1fr; height: calc(100vh - 16px); overflow: hidden; }
.left { border: 1px solid #eee; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; }
.tree { margin-top: 8px; flex: 1; overflow: auto; }
.right { border: 1px solid #eee; border-radius: 8px; display: flex; flex-direction: column; overflow: hidden; }
.right-header { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; border-bottom: 1px solid #eee; background: var(--el-fill-color-lighter); }
.right-header .path { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); }
.ellipsis { max-width: 520px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.splitter { width: 6px; cursor: col-resize; background: var(--el-border-color-lighter); border-left: 1px solid var(--el-border-color-lighter); border-right: 1px solid var(--el-border-color-lighter); }
.splitter:hover { background: var(--el-border-color); }
.right-body { padding: 8px; display: flex; flex: 1; flex-direction: column; gap: 8px; overflow: hidden; }
.image-paper { background:
  linear-gradient(transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 / 100% 40px,
  linear-gradient(90deg, transparent 39px, rgba(0, 0, 0, 0.035) 40px) 0 0 / 40px 100%,
  linear-gradient(#fff, #fff); }
.right-status { height: 28px; border-top: 1px solid #eee; display: flex; align-items: center; padding: 0 8px; color: var(--el-text-color-secondary); }
</style>

