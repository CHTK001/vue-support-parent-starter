<template>
  <div class="snippet-manager">
    <el-card class="shadow-sm rounded-xl p-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-el-text">命令片段管理</h3>
          <el-button type="primary" @click="handleAdd">新增片段</el-button>
        </div>
      </template>

      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM；
           pagination/toolbar 关闭，不新增页码控件与工具栏按钮；
           style="width: 100%" 原样保留；原表未写 border → settings.border=false 抑制默认边框；
           原表无 height/maxHeight → layout-table.minHeight=0：抑制 ReTable 缺省开启的
           fill（表头固定内滚）与空态 440px min-height，保持「内容多高表多高 + 整页滚动」。 -->
      <ReTable
        :data="snippets"
        :columns="snippetColumns"
        engine="element"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
        style="width: 100%"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
      >
        <template #col-actions="{ row }">
          <el-button text type="primary" @click="handleEdit(snippetOf(row))">编辑</el-button>
          <el-button text type="danger" @click="handleDelete(snippetOf(row).id)">删除</el-button>
        </template>
      </ReTable>
    </el-card>

    <ReDialog v-model="showDialog" :title="editId ? '编辑片段' : '新增片段'" width="500px" destroy-on-close>
      <el-form :model="form" label-position="top">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="例如：重启服务" />
        </el-form-item>
        <el-form-item label="命令内容">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="输入命令内容" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" placeholder="选择分类" style="width: 100%">
            <el-option label="系统" value="system" />
            <el-option label="数据库" value="database" />
            <el-option label="应用" value="application" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


import ReDialog from "@repo/ui/re-dialog";
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'

interface Snippet {
  id: number
  name: string
  content: string
  category: string
}

/**
 * 列配置：原模板 4 个 el-table-column 收敛到数组。
 * 标题是静态文案（无 t()），普通常量即可。
 * 「操作」列原本就没有 prop（纯模板列），按规格造合成 prop actions。
 */
const snippetColumns: ReTableColumn[] = [
  { prop: 'name', label: '名称', width: 150 },
  { prop: 'content', label: '命令内容' },
  { prop: 'category', label: '分类', width: 100 },
  { prop: 'actions', label: '操作', width: 150, slot: 'actions' },
]

/**
 * ReTable 列插槽的 row 是宽类型（字段为 unknown），直接传给
 * {@link handleEdit}（参数 Snippet）或读 {@code row.id}（喂给 {@link handleDelete} 的 number 参数）会 TS2345。
 * 这里统一收窄回 {@link Snippet}，模板里不再散落断言。
 */
function snippetOf(row: Record<string, unknown>): Snippet {
  return row as unknown as Snippet
}

const snippets = ref<Snippet[]>([
  { id: 1, name: '重启Nginx', content: 'sudo systemctl restart nginx', category: 'system' },
  { id: 2, name: '查看日志', content: 'tail -f /var/log/nginx/error.log', category: 'system' },
])

const showDialog = ref(false)
const editId = ref<number | null>(null)
const form = ref({ name: '', content: '', category: 'system' })

const handleAdd = () => {
  editId.value = null
  form.value = { name: '', content: '', category: 'system' }
  showDialog.value = true
}

const handleEdit = (row: Snippet) => {
  editId.value = row.id
  form.value = { ...row }
  showDialog.value = true
}

const handleDelete = (id: number) => {
  snippets.value = snippets.value.filter(s => s.id !== id)
}

const handleSubmit = () => {
  if (editId.value) {
    const idx = snippets.value.findIndex(s => s.id === editId.value)
    if (idx >= 0) snippets.value[idx] = { ...form.value, id: editId.value }
  } else {
    snippets.value.push({ ...form.value, id: Date.now() })
  }
  showDialog.value = false
}
</script>

<style scoped>
.snippet-manager {
  padding: 20px;
}
</style>
