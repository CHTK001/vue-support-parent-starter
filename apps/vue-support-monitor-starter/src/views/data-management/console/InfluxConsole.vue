<template>
  <div class="console system-container modern-bg" :style="gridStyle">
    <!-- 左侧：树 + 搜索 -->
    <div class="left overflow-auto thin-scrollbar" @contextmenu.prevent>
      <el-input
        v-model="keyword"
        placeholder="搜索..."
        size="small"
        clearable
        @change="loadRoot"
      >
        <template #append>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>
      <el-tree
        ref="treeRef"
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
          <IconifyIconOnline :icon="getNodeIcon(node, data)" class="mr-1" />
          <span class="flex justify-between w-full">
            <span>
              <span>{{ data.name }}</span>
            </span>
          </span>
        </template>
      </el-tree>
    </div>

    <!-- 中间：分隔条 -->
    <div class="splitter cursor-col-resize" @mousedown="onDragStart" @dblclick="resetWidth" />

    <!-- 右侧：编辑 + 结果 -->
    <div class="right image-paper">
      <div class="right-header">
        <div class="path" :title="currentPath || '未选择'">
          <IconifyIconOnline icon="ri:route-line" class="mr-1" />
          <span class="ellipsis">{{ currentPath || '未选择' }}</span>
        </div>
        <div class="toolbar">
          <el-button type="primary" size="small" @click="execute">
            <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" /> 执行
          </el-button>
          <el-button size="small" @click="onRefreshTree">
            <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 刷新
          </el-button>
        </div>
      </div>

      <div class="right-body">
        <CodeEditor
          v-model:content="flux"
          :showTool="false"
          :height="'200px'"
          :options="{ mode: 'flux' }"
        />

        <el-table
          border
          v-if="columns.length"
          :data="rows"
          size="small"
          height="580px"
        >
          <el-table-column
            v-for="col in columns"
            :key="col"
            :prop="col"
            :label="col"
            :min-width="120"
          />
        </el-table>
        <div v-else class="empty-tip">无数据</div>
      </div>

      <div class="right-footer el-form-item-msg">
        <span v-if="statusText">{{ statusText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import CodeEditor from '@/components/codeEditor/index.vue'
import { getConsoleRoot, getConsoleChildren, getConsoleNode, executeConsole } from '@/api/data-management/system-data'

const props = defineProps<{ id: number }>()

// 左侧树
const treeData = ref<any[]>([])
const treeRef = ref<any>()
const treeProps = { label: 'name', children: 'children', isLeaf: 'leaf' }
const keyword = ref('')
const currentPath = ref<string | undefined>(undefined)

// 编辑与结果
const flux = ref<string>(`from(bucket: "example")\n  |> range(start: -1h)\n  |> limit(n: 100)`)
const columns = ref<string[]>([])
const rows = ref<any[]>([])
const statusText = ref('')

// 左右布局宽度拖拽
const leftWidth = ref(300)
const gridStyle = computed(() => ({ gridTemplateColumns: `${leftWidth.value}px 6px 1fr` }))
const isDragging = ref(false)
function onDragStart() {
  isDragging.value = true
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', onDragging)
  document.addEventListener('mouseup', onDragEnd)
}
function onDragging(e: MouseEvent) {
  if (!isDragging.value) return
  const min = 240
  const max = 720
  leftWidth.value = Math.max(min, Math.min(max, e.clientX - 48))
}
function onDragEnd() {
  if (!isDragging.value) return
  isDragging.value = false
  document.removeEventListener('mousemove', onDragging)
  document.removeEventListener('mouseup', onDragEnd)
  document.body.style.cursor = ''
}
function resetWidth() {
  leftWidth.value = 300
}

// 通用工具：从后端响应中提取数组
function extractArrayFromApi(payload: any): any[] {
  const d = payload?.data ?? payload?.records ?? payload?.list ?? payload?.items ?? payload
  if (Array.isArray(d)) return d
  if (Array.isArray(d?.records)) return d.records
  return []
}
function normalizeTreeNode(node: any) {
  if (!node) return node
  return {
    name: node.name ?? node.label ?? node.id,
    path: node.path ?? node.id ?? node.name,
    type: node.type,
    properties: node.properties,
    leaf: !!node.leaf,
    children: Array.isArray(node.children) ? node.children.map(normalizeTreeNode) : undefined
  }
}

async function loadRoot() {
  const res = await getConsoleRoot(props.id, keyword.value)
  const records = extractArrayFromApi(res?.data)
  treeData.value = records.map(normalizeTreeNode)
  await nextTick()
}
function onRefreshTree() {
  loadRoot()
}

async function loadChildrenLazy(node: any, resolve: (children: any[]) => void) {
  const parentPath = node?.data?.path
  if (!parentPath) return resolve([])
  try {
    const res = await getConsoleChildren(props.id, parentPath)
    const records = extractArrayFromApi(res?.data).map(normalizeTreeNode)
    resolve(records)
  } catch (e) {
    resolve([])
  }
}

function getNodeIcon(node: any, data: any) {
  const level = Number(node?.level || 0)
  if (level <= 1) return 'ri:database-2-line'    // bucket/库
  if (level === 2) return 'ri:table-2'          // measurement/table
  if (level === 3) return 'ri:braces-line'      // field
  return data?.leaf ? 'ri:file-2-line' : 'ri:folder-2-line'
}

async function handleNodeClick(node: any) {
  currentPath.value = node?.path
  // 简单示例：按节点类型生成示例 flux
  const t = (node?.type || '').toLowerCase()
  if (t.includes('bucket') || t.includes('database')) {
    flux.value = `from(bucket: "${node.name}")\n  |> range(start: -1h)\n  |> limit(n: 100)`
  }
}

async function execute() {
  const start = performance.now()
  const res = await executeConsole(props.id, flux.value, 'influx')
  const data = res?.data?.data || {}
  columns.value = (data?.columns || []) as string[]
  await Promise.resolve()
  rows.value = (data?.rows || []) as any[]
  const ms = Math.round(performance.now() - start)
  statusText.value = `已返回 ${rows.value.length} 行，用时 ${ms} ms, ${res?.data?.errorMessage || ''}`
}
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.console {
  display: grid;
  grid-template-columns: 300px 6px 1fr;
  grid-template-rows: 100%;
  gap: 0;
  height: 100%;
}
.left {
  padding: 8px;
  border-right: 1px solid var(--el-border-color-lighter);
}
.tree {
  margin-top: 8px;
}
.splitter {
  width: 6px;
  background: var(--el-fill-color);
}
.right {
  display: flex;
  flex-direction: column;
  padding: 8px;
}
.right-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
}
.path {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ellipsis {
  max-width: 520px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.right-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty-tip {
  color: var(--el-text-color-secondary);
  padding: 16px;
}
.right-footer {
  margin-top: 6px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

