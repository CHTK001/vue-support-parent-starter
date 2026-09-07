<template>
  <div class="snippet-manager fade-in">
    <ReCard class="shadow-sm rounded-xl" :radius="12" :padding="16">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="snippet-title">命令片段管理</h3>
          <ReButton show-text icon="Plus" type="primary" @click="handleAdd">新增片段</ReButton>
        </div>
      </template>

      <ReTable :data="snippets" style="width: 100%" :pagination="false" :toolbar="false">
        <ReTableColumn prop="name" label="名称" width="150" />
        <ReTableColumn prop="content" label="命令内容" />
        <ReTableColumn prop="category" label="分类" width="100" />
        <ReTableColumn label="操作" width="150">
          <template #default="{ row }">
            <ReButton link type="primary" @click="handleEdit(row)">编辑</ReButton>
            <ReButton link type="danger" @click="handleDelete(row.id)">删除</ReButton>
          </template>
        </ReTableColumn>
      </ReTable>
    </ReCard>

    <ReDialog v-model="showDialog" :title="editId ? '编辑片段' : '新增片段'" width="500" :height="360" confirm-text="保存" cancel-text="取消" @confirm="handleSubmit" @cancel="showDialog = false">
      <ReForm :model="form" label-position="top">
        <ReFormItem label="名称">
          <ReInput v-model="form.name" placeholder="例如：重启服务" />
        </ReFormItem>
        <ReFormItem label="命令内容">
          <ReInput v-model="form.content" type="textarea" :rows="4" placeholder="输入命令内容" />
        </ReFormItem>
        <ReFormItem label="分类">
          <ReSelect v-model="form.category" placeholder="选择分类" style="width: 100%"
            :data="[{ label: '系统', value: 'system' }, { label: '数据库', value: 'database' }, { label: '应用', value: 'application' }, { label: '其他', value: 'other' }]" />
        </ReFormItem>
      </ReForm>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

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
.snippet-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.snippet-manager .re-card {
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-card);
}
</style>