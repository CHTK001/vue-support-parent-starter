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
                    class="flex flex-col gap-0.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-[var(--rm-bg-subtle)]"
                    @click="emit('open', { id: kb.id })"
                  >
                    <span class="text-sm font-medium truncate">{{ kb.name }}</span>
                    <span class="text-xs text-[var(--rm-text-disabled)]">
                      {{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}
                    </span>
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
                <span class="min-w-0 flex flex-col">
                  <span class="text-sm font-medium truncate">{{ kb.name }}</span>
                  <span class="text-xs text-[var(--rm-text-disabled)]">
                    {{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}
                  </span>
                </span>
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
              <ReButton size="large" class="!h-auto !py-4 !justify-start" @click="emit('all-templates')">
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
                    <span class="text-xs text-[var(--rm-text-disabled)]">预置实体 · 关系结构</span>
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
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">图标</label>
            <div class="flex flex-wrap gap-2">
              <ReButton
                v-for="(ic, i) in ICONS" :key="i"
                :type="form.icon === i ? 'primary' : 'default'"
                class="!w-9 !h-9 !p-0"
                @click="form.icon = i"
              >
                <svg viewBox="0 0 24 24" class="w-[18px] h-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="ic" />
              </ReButton>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">主题色</label>
            <div class="flex flex-wrap gap-2.5">
              <button
                v-for="c in COLOR_CHOICES" :key="c"
                type="button"
                class="w-6 h-6 rounded-full relative border-0 cursor-pointer"
                :style="{ background: c, color: c }"
                :class="form.color === c ? 'ring-2 ring-offset-2 ring-current' : ''"
                @click="form.color = c"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">可见范围</label>
            <div class="grid grid-cols-3 gap-2.5">
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

          <div>
            <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">高级配置（默认开启）</label>
            <div class="flex flex-col gap-3">
              <div v-for="sw in SWITCHES" :key="sw.key" class="flex items-center gap-3">
                <svg viewBox="0 0 24 24" class="w-[18px] h-[18px] shrink-0 text-[var(--rm-text-secondary)]" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="sw.icon" />
                <span class="flex-1 text-sm">{{ sw.label }}</span>
                <el-switch v-model="form.toggles[sw.key]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ cancel }">
        <div class="flex items-center justify-between gap-3 flex-wrap w-full">
          <ReButton link type="primary" @click="onToTemplate">需要预置结构？从模板创建</ReButton>
          <div class="flex gap-2.5">
            <ReButton @click="cancel">取消</ReButton>
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
import { Collection, Document, Location, Share } from '@element-plus/icons-vue'
import ReCard from '@/components/re/ReCard.vue'
import ReTag from '@/components/re/ReTag.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
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

/** 弹框里的 8 个图标（内联 SVG，保持原稿图形） */
const ICONS = [
  '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/>',
  '<path d="M22 9 12 4 2 9l10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v5"/>',
  '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  '<path d="M18 14.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13l3.5-2 3 2 3-2"/><path d="M9 8h5M9 11h3"/>',
  '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  '<path d="m12 3 2.6 5.6L20 9.4l-4 4 1 6-5-2.8L7 19.4l1-6-4-4 5.4-.8z"/>',
  '<path d="M12 14c-3 0-6-2-6-5.5C6 5.5 8.5 3 12 3s6 2.5 6 5.5c0 3.5-3 5.5-6 5.5z"/><path d="M9 14c-1 3-1.5 6-3 7 3-.3 5-1.5 6-3 1 1.5 3 2.7 6 3-1.5-1-2-4-3-7"/>',
]

/** 主题色候选（用户可选颜色，属数据） */
const COLOR_CHOICES = ['#12b8c8', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#64748b']

/** 可见范围（原稿三项） */
const SCOPES = [
  { label: '私有', hint: '仅自己可见', icon: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' },
  { label: '团队', hint: '成员可见', icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20a6 6 0 0 0-4-5.6"/>' },
  { label: '公开', hint: '所有人可见', icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 0 0-18"/>' },
]

/** 高级配置三项（后端暂无对应列，仅本地选择项） */
const SWITCHES = [
  { key: 'extract', label: '上传文档后自动提取知识点', icon: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>' },
  { key: 'graph', label: '自动生成知识图谱', icon: '<circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 10.8 16 7.2M8 13.2l8 3.8"/>' },
  { key: 'qa', label: '接入 AI 问答', icon: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12z"/><path d="M9.5 10.5h5M9.5 13.5h3"/>' },
]

/** 最近使用的 2 个知识库（按文档数降序，稳定可预期） */
const recentBases = computed(() =>
  [...props.bases].sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name)).slice(0, 2),
)

const modalVisible = ref(false)
const form = reactive({
  name: '',
  description: '',
  icon: 0,
  color: COLOR_CHOICES[0],
  scope: '团队',
  toggles: { extract: true, graph: true, qa: true } as Record<string, boolean>,
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
  form.icon = 0
  form.color = COLOR_CHOICES[0]
  form.scope = '团队'
  form.toggles.extract = true
  form.toggles.graph = true
  form.toggles.qa = true
  modalVisible.value = true
}

/**
 * 使用模板：直接把该模板名作为知识库名提交创建（一次点击即建库），
 * 不再只跳模板页 —— 模板本身目前只提供「名称 + 预置结构说明」，
 * 真实示例文档/实体/关系需要后端模板接口支持（见交付说明 §4）。
 * @param t 被选中的模板
 */
function useTemplate(t: TemplateItem) {
  emit('create', { name: t.name, description: `${t.name}（由模板创建）`, isPublic: false })
}

/** 底栏跳模板 */
function onToTemplate() {
  modalVisible.value = false
  emit('all-templates')
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
</script>