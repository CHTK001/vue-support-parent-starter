<template>
  <div class="snippet-manager">
    <el-card class="shadow-sm rounded-xl p-6">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-el-text">命令片段管理</h3>
          <el-button type="primary" @click="handleAdd">新增片段</el-button>
        </div>
      </template>

      <el-table :data="snippets" style="width: 100%">
        <el-table-column prop="name" label="名称" width="150" />
        <el-table-column prop="content" label="命令内容" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button text type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="editId ? '编辑片段' : '新增片段'" width="500px" destroy-on-close>
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Snippet {
  id: number
  name: string
  content: string
  category: string
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
