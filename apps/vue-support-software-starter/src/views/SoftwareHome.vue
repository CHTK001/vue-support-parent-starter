<template>
  <div class="page home-page">
    <div class="page-head">
      <div>
        <h1 class="page-title">功能卡片</h1>
        <p class="page-desc">管理你的软件功能入口</p>
      </div>
      <el-button type="primary" :icon="Plus" size="default" @click="showAddDialog">新增卡片</el-button>
    </div>

    <div v-if="cards.length > 0" class="card-grid">
      <div
        v-for="card in cards"
        :key="card.cardId"
        class="card"
        :style="{ '--accent': cardAccent(card) }"
        @click="openCard(card)"
      >
        <div class="card-top">
          <div class="card-icon">
            <el-icon :size="22"><component :is="resolveIcon(card.icon)" /></el-icon>
          </div>
          <button class="card-del" @click.stop="confirmDelete(card)">
            <el-icon :size="13"><Close /></el-icon>
          </button>
        </div>
        <h3 class="card-title">{{ card.title }}</h3>
        <p class="card-desc">{{ card.description || '暂无描述' }}</p>
      </div>
    </div>

    <el-empty v-else description="暂无卡片，点击右上角新增" class="mt-16" />

    <el-dialog v-model="dialogVisible" title="新增卡片" width="440px" :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="0">
        <el-form-item prop="title">
          <el-input v-model="form.title" placeholder="卡片标题" size="large" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="描述（可选）" />
        </el-form-item>
        <div class="dialog-grid">
          <el-form-item label="图标" label-width="48px">
            <el-select v-model="form.icon" placeholder="图标" class="w-full">
              <el-option v-for="opt in iconOptions" :key="opt.value" :label="opt.label" :value="opt.value">
                <div class="flex items-center gap-2">
                  <el-icon :size="15"><component :is="resolveIcon(opt.value)" /></el-icon>
                  <span>{{ opt.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="排序" label-width="48px">
            <el-input-number v-model="form.sortOrder" :min="0" size="default" class="w-full" controls-position="right" />
          </el-form-item>
        </div>
        <el-form-item>
          <el-input v-model="form.targetUrl" placeholder="目标路径 /software-list 或 https://..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Close, Grid, Link, Setting, Monitor, DataBoard, Aim, Connection, Cpu, Folder, Picture } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { listCards, createCard, deleteCard, type SoftwareCard } from '@/api/software'

const router = useRouter()
const cards = ref<SoftwareCard[]>([])
const dialogVisible = ref(false)

const form = reactive<SoftwareCard>({
  title: '', description: '', icon: 'Grid', cardType: 'internal', targetUrl: '', sortOrder: 0,
})

const rules = { title: [{ required: true, message: '请输入卡片标题', trigger: 'blur' }] }

const iconRegistry: Record<string, any> = { Grid, Link, Setting, Monitor, DataBoard, Aim, Connection, Cpu, Folder, Picture }

const iconOptions = [
  { value: 'Grid', label: '网格' }, { value: 'Link', label: '链接' }, { value: 'Setting', label: '设置' },
  { value: 'Monitor', label: '监控' }, { value: 'DataBoard', label: '数据' }, { value: 'Aim', label: '目标' },
  { value: 'Connection', label: '连接' }, { value: 'Cpu', label: 'CPU' }, { value: 'Folder', label: '文件夹' },
  { value: 'Picture', label: '相册' },
]

function resolveIcon(name?: string): any { return iconRegistry[name || 'Grid'] || Grid }

const accentColors = [
  'rgb(var(--el-color-primary))',
  'rgb(var(--el-color-primary-light-3))',
  'rgb(var(--el-color-primary-light-5))',
  'var(--el-color-primary-light-7)',
]

function cardAccent(card: SoftwareCard): string {
  let hash = 0
  const s = card.title || ''
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash)
  return accentColors[Math.abs(hash) % accentColors.length]
}

async function loadCards() {
  try { cards.value = await listCards() }
  catch { ElMessage.error('加载卡片失败') }
}

function showAddDialog() {
  Object.assign(form, { title: '', description: '', icon: 'Grid', cardType: 'internal', targetUrl: '', sortOrder: 0 })
  dialogVisible.value = true
}

async function submitForm() {
  if (!form.title.trim()) { ElMessage.warning('请输入标题'); return }
  try {
    await createCard({ ...form })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    await loadCards()
  } catch { ElMessage.error('创建失败') }
}

function openCard(card: SoftwareCard) {
  if (card.cardType === 'internal' && card.targetUrl) { router.push(card.targetUrl) }
  else if (card.targetUrl) { window.open(card.targetUrl, '_blank') }
  else { ElMessage.info('未配置目标 URL') }
}

function confirmDelete(card: SoftwareCard) {
  ElMessageBox.confirm(`确定删除 <strong>${card.title}</strong>？`, '', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning', dangerouslyUseHTMLString: true,
  }).then(async () => {
    try { await deleteCard(card.cardId!); ElMessage.success('已删除'); await loadCards() }
    catch { ElMessage.error('删除失败') }
  })
}

onMounted(() => { loadCards() })
</script>

<style scoped>
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 36px;
}

.page-title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.page-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 6px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.card {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
  border-color: transparent;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgb(var(--el-color-primary));
}

.card-del {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  opacity: 0;
  transition: all 0.15s;
}

.card:hover .card-del {
  opacity: 1;
}

.card-del:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.card-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dialog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
