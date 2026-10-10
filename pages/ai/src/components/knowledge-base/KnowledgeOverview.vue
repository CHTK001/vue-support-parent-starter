<template>
  <div class="h-full min-h-0 flex flex-col">
    <!-- ===== 内容区：唯一滚动容器（Tailwind 布局，表面用 re-surface 基线） ===== -->
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 flex flex-col gap-4">
      <!-- 统计卡 -->
      <section class="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <ReStatCard :value="kbCount" desc="知识库" :icon="Collection" />
        <ReStatCard :value="fileCount" desc="文档总量" :icon="Document" />
        <ReStatCard :value="entityCount" desc="实体节点" :icon="Location" />
        <ReStatCard :value="relationCount" desc="关系连线" :icon="Share" />
      </section>

      <section class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <div class="flex flex-col gap-4 min-w-0">
          <!-- ===== 我的知识库（有库时显示；数量徽章可点开列库） ===== -->
          <ReCard v-if="bases.length > 0" title="我的知识库">
            <template #extra>
              <el-popover placement="bottom-end" :width="300" trigger="click">
                <template #reference>
                  <ReTag type="primary" round class="cursor-pointer">{{ bases.length }}</ReTag>
                </template>
                <div class="flex flex-col gap-1 max-h-80 overflow-y-auto">
                  <div
                    v-for="kb in bases"
                    :key="kb.id"
                    class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--rm-bg-subtle)]"
                  >
                    <button
                      type="button"
                      class="min-w-0 flex-1 text-left cursor-pointer"
                      :aria-label="`打开知识库 ${kb.name}`"
                      @click="emit('open', { id: kb.id })"
                    >
                      <span class="block text-sm font-medium truncate">{{ kb.name }}</span>
                      <span class="block text-xs text-[var(--rm-text-disabled)]">
                        {{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}
                      </span>
                    </button>
                    <div class="flex shrink-0 items-center">
                      <ReSquareButton layout="square" size="small" :icon="Edit" tip="编辑知识库" @click.stop="onEdit(kb)" />
                      <ReSquareButton layout="square" size="small" type="danger" :icon="Delete" tip="删除知识库" @click.stop="onRemove(kb)" />
                    </div>
                  </div>
                </div>
              </el-popover>
            </template>

            <!-- 最近使用 2 个 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                v-for="kb in recentBases"
                :key="kb.id"
                class="re-surface re-surface--dense flex items-center gap-3 cursor-pointer"
                @click="emit('open', { id: kb.id })"
              >
                <span class="w-9 h-9 shrink-0 rounded-lg bg-[var(--rm-primary-light-9)] text-[var(--rm-primary)] grid place-items-center text-sm font-bold overflow-hidden">
                  <img v-if="kb.cover" :src="kb.cover" :alt="kb.name" class="w-full h-full object-cover" />
                  <template v-else>{{ initialsOf(kb.name) }}</template>
                </span>
                <span class="min-w-0 flex-1 flex flex-col">
                  <span class="text-sm font-medium truncate">{{ kb.name }}</span>
                  <span class="text-xs text-[var(--rm-text-disabled)]">
                    {{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}
                  </span>
                </span>
                <div class="flex shrink-0 items-center" @click.stop>
                  <ReSquareButton layout="square" size="small" :icon="Edit" tip="编辑知识库" @click="onEdit(kb)" />
                  <ReSquareButton layout="square" size="small" type="danger" :icon="Delete" tip="删除知识库" @click="onRemove(kb)" />
                </div>
              </div>
            </div>
          </ReCard>

          <!-- ===== 创建引导 ===== -->
          <ReCard :title="bases.length > 0 ? '继续创建新的知识库' : '开始创建你的第一个知识库'">
            <div class="flex flex-col items-center text-center pb-2">
              <img :src="heroIllustration" alt="书本与知识节点" class="w-full max-w-[280px]" />
              <p class="mt-3 text-sm text-[var(--rm-text-secondary)]">
                上传文档即可自动提取知识点，生成实体与关系网络
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
              <ReButton type="primary" size="large" class="!h-auto !py-4 !justify-start" @click="openModal">
                <span class="flex items-center gap-3 text-left">
                  <svg viewBox="0 0 24 24" class="w-7 h-7 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A4 4 0 0 0 7 17h10" /><path d="M12 11v5m-2.5-2.5L12 16l2.5-2.5" /></svg>
                  <span class="flex flex-col leading-tight">
                    <b class="text-base font-bold">空白创建</b>
                    <i class="text-xs opacity-85 not-italic">从上传文档开始</i>
                  </span>
                </span>
              </ReButton>
              <ReButton type="default" size="large" class="!h-auto !py-4 !justify-start" @click="emit('all-templates')">
                <span class="flex items-center gap-3 text-left">
                  <svg viewBox="0 0 24 24" class="w-7 h-7 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>
                  <span class="flex flex-col leading-tight">
                    <b class="text-base font-bold">从模板创建</b>
                    <i class="text-xs opacity-85 not-italic">套用预置结构</i>
                  </span>
                </span>
              </ReButton>
            </div>

            <div class="flex items-center justify-between mb-3">
              <b class="text-sm font-bold">教育场景模板</b>
              <ReButton link type="primary" @click="emit('all-templates')">全部模板</ReButton>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div
                v-for="t in templates"
                :key="t.key"
                class="re-surface re-surface--dense !p-0 overflow-hidden flex flex-col"
              >
                <img :src="t.cover" :alt="t.name" class="w-full aspect-[400/225] object-cover" />
                <div class="flex flex-col gap-2 p-3 flex-1">
                  <b class="text-sm font-medium truncate">{{ t.name }}</b>
                  <div class="flex items-center justify-between gap-2 mt-auto flex-wrap">
                    <span class="text-xs text-[var(--rm-text-disabled)]">
                      {{ t.entity > 0 ? `${t.entity} 实体 · ${t.relation} 关系` : '预置结构' }}
                    </span>
                    <ReButton size="small" round @click="useTemplate(t)">使用模板</ReButton>
                  </div>
                </div>
              </div>
            </div>
          </ReCard>
        </div>

        <!-- ===== 最近活动 ===== -->
        <ReCard title="最近活动">
          <div v-if="activities.length > 0" class="flex flex-col gap-3">
            <div
              v-for="a in activities"
              :key="a.key"
              class="flex flex-col gap-0.5 pb-3 border-b border-[var(--rm-border-light)] last:border-b-0 last:pb-0 min-w-0"
            >
              <b class="text-sm font-medium truncate">{{ a.title }}</b>
              <span class="text-xs text-[var(--rm-text-secondary)]">{{ a.desc }}</span>
              <em class="text-xs text-[var(--rm-text-disabled)] not-italic">{{ a.time }}</em>
            </div>
          </div>
          <ReEmpty v-else text="暂无活动，创建知识库、上传文档或生成图谱后会出现在这里" />
        </ReCard>
      </section>
    </div>

    <!-- ===== 新建知识库弹框（ReDialog 外壳，默认布局托管内边距） ===== -->
    <ReDialog v-model="modalVisible" title="新建知识库" :width="560" :close-on-click-modal="false">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">
              知识库名称<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i>
            </label>
            <el-input v-model="form.name" placeholder="例如：三年级语文上册" @keyup.enter="submit" />
            <div class="text-xs text-[var(--rm-text-disabled)] mt-1.5">2-20 个字，创建后可在设置中修改</div>
          </div>

          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">描述</label>
            <el-input v-model="form.description" type="textarea" :rows="2"
              placeholder="简单描述这个知识库的用途，例如收集课文、试卷与知识点" resize="none" />
          </div>

          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">可见范围</label>
            <div class="grid grid-cols-2 gap-2.5">
              <button
                v-for="s in SCOPES" :key="s.label"
                type="button"
                class="flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-[var(--rm-radius,10px)] text-xs leading-relaxed cursor-pointer transition"
                :class="form.scope === s.label
                  ? 'border border-[var(--rm-primary)] text-[var(--rm-primary)] bg-[var(--rm-primary-light-9)]'
                  : 'border border-[var(--rm-border)] text-[var(--rm-text-secondary)] bg-transparent'"
                @click="form.scope = s.label"
              >
                <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="s.icon" />
                {{ s.label }}<br>{{ s.hint }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ cancel }">
        <div class="flex items-center justify-between gap-3 flex-wrap w-full">
          <ReButton link type="primary" @click="onToTemplate">需要预置结构？从模板创建</ReButton>
          <div class="flex gap-2.5">
            <ReButton type="default" @click="cancel">取消</ReButton>
            <ReButton type="primary" @click="submit">创建知识库</ReButton>
          </div>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识库总览。
 *
 * <p><b>风格对齐</b>：不再手写 BEM CSS，全部沿用系统既有写法 ——
 * 布局用 Tailwind 工具类，卡片表面用组件库基线 {@code re-surface}（16px 圆角 / 无边框 /
 * 双层柔光），语义组件用应用本地 koi 封装 {@code @/components/re/*}（ReCard / ReTag /
 * ReButton），统计卡用 {@code ReStatCard}，弹框用 {@code ReDialog}。</p>
 *
 * <p><b>布局</b>：.content 是唯一滚动容器（flex-1 + min-h-0 + overflow-y-auto）。</p>
 *
 * <p><b>数据</b>：本组件不发请求，只渲染 props 并上抛事件。</p>
 */
import { computed, reactive, ref } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
import ReStatCard from '@repo/ui/re-stat-card'
import { Collection, Document, Location, Share, Edit, Delete } from '@element-plus/icons-vue'
import ReCard from '@/components/re/ReCard.vue'
import ReTag from '@/components/re/ReTag.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
import ReSquareButton from '@repo/ui/re-button'
import heroIllustration from '@/assets/kb/kb-empty-hero.png'

/** 最近活动条目 */
interface ActivityItem {
  /** 稳定 key */
  key: string
  /** 活动主体 */
  title: string
  /** 活动描述 */
  desc: string
  /** 相对时间文本 */
  time: string
  /** 事件时间戳，用于排序 */
  ts: number
}

/** 教育场景模板条目 */
interface TemplateItem {
  /** 模板标识 */
  key: string
  /** 模板名称 */
  name: string
  /** 封面图地址 */
  cover: string
  /** 预置实体数 */
  entity: number
  /** 预置关系数 */
  relation: number
}

/** 列表条目 */
interface BaseItem {
  /** 知识库 ID */
  id: string
  /** 名称 */
  name: string
  /** 描述，可为空 */
  description: string | null
  /** 封面图地址 */
  cover?: string
  /** 文档数 */
  fileCount: number
  /** 实体数 */
  entityCount: number
  /** 关系数 */
  relationCount: number
  /** 是否已索引 */
  ready: boolean
  /** 是否公开（用于编辑弹框回填） */
  isPublic: boolean
}

const props = defineProps<{
  /** 知识库总数 */
  kbCount: number
  /** 文档总数 */
  fileCount: number
  /** 实体总数 */
  entityCount: number
  /** 关系总数 */
  relationCount: number
  /** 最近活动 */
  activities: ActivityItem[]
  /** 教育场景模板 */
  templates: TemplateItem[]
  /** 知识库列表 */
  bases: BaseItem[]
}>()

const emit = defineEmits<{
  /** 创建提交 */
  (e: 'create', p: { name: string; description: string; isPublic: boolean }): void
  /** 帮助文档 */
  (e: 'help'): void
  /** 模板相关入口 */
  (e: 'all-templates'): void
  /** 搜索 */
  (e: 'search', kw: string): void
  /** 进入详情 */
  (e: 'open', kb: { id: string }): void
  /** 编辑 */
  (e: 'update', p: { id: string; name: string; description: string; isPublic: boolean }): void
  /** 删除 */
  (e: 'remove', kb: { id: string }): void
}>()

/** 可见范围：仅私有 / 公开（后端只有 is_public 一列，无「团队」语义） */
const SCOPES = [
  { label: '私有', hint: '仅自己可见', icon: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' },
  { label: '公开', hint: '所有人可见', icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 0 0-18"/>' },
]

/** 最近使用的 2 个知识库（按文档数降序，稳定可预期） */
const recentBases = computed(() =>
  [...props.bases].sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name)).slice(0, 2),
)

const modalVisible = ref(false)
const form = reactive({
  name: '',
  description: '',
  scope: '私有',
})

/**
 * 取名称首字做占位封面。
 * @param name 知识库名称
 * @returns 首字（最多两个字符）
 */
function initialsOf(name: string): string {
  const s = String(name || '').trim()
  return s ? s.slice(0, 2) : '知'
}

/** 打开新建弹框并重置表单 */
function openModal() {
  form.name = ''
  form.description = ''
  form.scope = '私有'
  modalVisible.value = true
}

/**
 * 使用模板：跳到「从模板创建」页并选中该模板。
 *
 * <p>不再直接建库 —— 模板现在携带完整数据集（文档 / 实体 / 关系），
 * 必须走模板页的建库流程才能把数据整体复制进新库。</p>
 * @param t 被选中的模板
 */
function useTemplate(t: TemplateItem) {
  void t
  emit('all-templates')
}

/** 底栏跳模板 */
function onToTemplate() {
  modalVisible.value = false
  emit('all-templates')
}

/** 编辑当前知识库：上抛 update（由页面复用既有编辑流程） */
function onEdit(kb: BaseItem) {
  emit('update', {
    id: kb.id,
    name: kb.name,
    description: kb.description ?? '',
    isPublic: kb.isPublic,
  })
}

/** 删除当前知识库：上抛 remove */
function onRemove(kb: BaseItem) {
  emit('remove', { id: kb.id })
}

/** 提交新建 */
function submit() {
  const name = form.name.trim()
  if (name.length < 2 || name.length > 20) {
    return
  }
  emit('create', {
    name,
    description: form.description.trim(),
    isPublic: form.scope === '公开',
  })
  modalVisible.value = false
}

/**
 * 供父页面（模板页「使用此模板创建」）打开本弹框并预填名称。
 *
 * <p>父页面 {@code KnowledgeBasePage.handleTemplateCreate} 调
 * {@code overviewRef.openCreate(name)}；此前本组件没有 expose 它，
 * 父页面每次都走 fallback 打开旧的 {@code .kb-dialog}，表现为「模板页弹出的仍是旧弹框」。</p>
 *
 * @param name 预填的知识库名称（可省略）
 */
function openCreate(name?: string) {
  openModal()
  if (name) {
    form.name = name
  }
}

defineExpose({ openCreate })
</script>