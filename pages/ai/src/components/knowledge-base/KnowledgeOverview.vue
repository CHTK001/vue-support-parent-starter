<template>
  <!-- kb-refactor：知识库编辑部设计层作用域（见 styles/kb-refactor.css） -->
  <div class="kb h-full min-h-0 flex flex-col" data-page="kb-overview">
    <!-- ===== 内容区：唯一滚动容器 ===== -->
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-6 px-6 py-5">
      <!-- ===== 页眉：宋体大标题 + 发丝线 ===== -->
      <header class="kb-masthead">
        <div>
          <h1 class="kb-masthead__title">{{ t('knowledge.page.title') }}</h1>
          <p class="kb-masthead__sub">{{ t('knowledge.page.subtitle') }}</p>
        </div>
        <div class="kb-masthead__actions">
          <ReButton type="primary" :icon="Plus" @click="openModal">
            {{ t('knowledge.page.createKb') }}
          </ReButton>
        </div>
      </header>

      <!-- ===== 统计带：发丝线分隔的报头，不用卡片堆 ===== -->
      <div class="kb-statband">
        <div class="kb-statband__cell">
          <span class="kb-statband__num">{{ loading ? '–' : kbCount }}</span>
          <span class="kb-statband__label">知识库</span>
        </div>
        <div class="kb-statband__cell">
          <span class="kb-statband__num">{{ loading ? '–' : fileCount }}<i>篇</i></span>
          <span class="kb-statband__label">文档总量</span>
        </div>
        <div class="kb-statband__cell">
          <span class="kb-statband__num">{{ loading ? '–' : entityCount }}</span>
          <span class="kb-statband__label">实体节点</span>
        </div>
        <div class="kb-statband__cell">
          <span class="kb-statband__num">{{ loading ? '–' : relationCount }}</span>
          <span class="kb-statband__label">关系连线</span>
        </div>
        <!-- 空库数单独一格：15 个库里 13 个空着时，前四格看不出「哪些其实还没用起来」 -->
        <div v-if="emptyCount > 0" class="kb-statband__cell kb-statband__cell--warn">
          <span class="kb-statband__num">{{ emptyCount }}</span>
          <span class="kb-statband__label">空库（待上传）</span>
        </div>
      </div>

      <div class="kb-grid">
        <!-- ================= 左列：知识库 / 创建引导 / 模板 ================= -->
        <div class="kb-col">
          <!-- 我的知识库：文献条目（编号 + 宋体名 + 元数据 + 状态徽章）。
               loading 且还没有数据时显示骨架行，不提前说「还没有库」 -->
          <section v-if="bases.length > 0 || loading" class="kb-sect">
            <div class="kb-sect__head">
              <span class="kb-sect__no">01</span>
              <h2 class="kb-sect__title">我的知识库</h2>
              <div class="kb-sect__extra">
                <span v-if="bases.length > 0" class="kb-badge kb-badge--mute">{{ bases.length }} 个</span>
                <!-- 原先没有搜索入口，15 个同名库只能靠编号认；这里按名称/描述过滤 -->
                <ReInput v-if="bases.length > 0" v-model="kw" placeholder="按名称过滤" clearable
                  class="kb-sect__search">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </ReInput>
              </div>
            </div>

            <!-- 加载骨架：行形状对齐真实条目（编号/封面/名称/元数据/右侧徽章与操作） -->
            <div v-if="loading && bases.length === 0" class="kb-entries" aria-hidden="true">
              <div v-for="i in 3" :key="i" class="kb-entry">
                <span class="kb-entry__no"><span class="kb-sk" style="width: 26px; height: 12px; display: block" /></span>
                <span class="kb-entry__cover"><span class="kb-sk" style="width: 100%; height: 100%; display: block" /></span>
                <span class="kb-entry__body flex flex-col gap-2 min-w-0">
                  <span class="kb-sk" style="width: 45%" />
                  <span class="kb-sk" style="width: 62%" />
                </span>
                <span class="kb-entry__side">
                  <span class="kb-sk" style="width: 44px" />
                  <span class="kb-sk" style="width: 44px" />
                  <span class="kb-sk" style="width: 26px; height: 26px; border-radius: 8px" />
                  <span class="kb-sk" style="width: 26px; height: 26px; border-radius: 8px" />
                </span>
              </div>
            </div>

            <div v-if="bases.length > 0 && filteredBases.length === 0" class="kb-nohit">
              没有匹配「{{ kw.trim() }}」的知识库，<ReButton type="primary" link @click="kw = ''">清空过滤</ReButton>
            </div>

            <div class="kb-entries">
              <div
                v-for="kb in filteredBases"
                :key="kb.id"
                class="kb-entry"
                :class="{ 'is-empty': kb.fileCount === 0 }"
                role="button"
                tabindex="0"
                :aria-label="`打开知识库 ${kb.name}`"
                @click="emit('open', { id: kb.id })"
                @keydown.enter="emit('open', { id: kb.id })"
                @keydown.space.prevent="emit('open', { id: kb.id })"
              >
                <span class="kb-entry__no">{{ no(filteredBases.indexOf(kb)) }}</span>
                <span class="kb-entry__cover">
                  <img v-if="kb.cover" :src="kb.cover" :alt="kb.name" />
                  <template v-else>{{ initialsOf(kb.name) }}</template>
                </span>
                <span class="kb-entry__body">
                  <span class="kb-entry__name">{{ kb.name }}</span>
                  <span class="kb-entry__meta">
                    <span>{{ kb.fileCount }} 篇文档<i class="dot" />{{ kb.entityCount }} 实体<i class="dot" />{{ kb.relationCount }} 关系</span>
                  </span>
                </span>
                <span class="kb-entry__side">
                  <span class="kb-badge" :class="kb.isPublic ? 'kb-badge--pub' : 'kb-badge--mute'">
                    <i />{{ kb.isPublic ? '公开' : '私有' }}
                  </span>
                  <span class="kb-badge" :class="kb.ready ? 'kb-badge--ok' : 'kb-badge--warn'">
                    <i />{{ kb.ready ? '已就绪' : '待索引' }}
                  </span>
                  <button class="kb-ico" type="button" title="编辑知识库" @click.stop="onEdit(kb)">
                    <el-icon><Edit /></el-icon>
                  </button>
                  <button class="kb-ico kb-ico--danger" type="button" title="删除知识库" @click.stop="onRemove(kb)">
                    <el-icon><Delete /></el-icon>
                  </button>
                </span>
              </div>
            </div>
          </section>

          <!-- 创建引导：插画 + 两个主次 CTA -->
          <section class="kb-sect">
            <div class="kb-sect__head">
              <span class="kb-sect__no">{{ loading || bases.length > 0 ? '02' : '01' }}</span>
              <h2 class="kb-sect__title">
                {{ loading ? '创建知识库' : bases.length > 0 ? '继续创建新的知识库' : '开始创建你的第一个知识库' }}
              </h2>
            </div>

            <div class="kb-create">
              <div class="kb-create__fig">
                <div class="kb-create__art">
                  <img :src="heroIllustration" alt="书本与知识节点" class="w-full h-full object-contain" />
                </div>
                <p class="kb-create__lead">上传文档即可自动提取知识点，生成实体与关系网络</p>
              </div>

              <div class="kb-create__cta">
                <button type="button" class="kb-cta kb-cta--primary" @click="openModal">
                  <span class="kb-cta__ico"><el-icon><UploadFilled /></el-icon></span>
                  <span class="kb-cta__t">
                    <b>空白创建</b>
                    <i>从上传文档开始</i>
                  </span>
                </button>
                <button type="button" class="kb-cta" @click="emit('all-templates')">
                  <span class="kb-cta__ico"><el-icon><Grid /></el-icon></span>
                  <span class="kb-cta__t">
                    <b>从模板创建</b>
                    <i>套用预置结构</i>
                  </span>
                </button>
              </div>
            </div>
          </section>

          <!-- 教育场景模板：编号封面卡 -->
          <section class="kb-sect">
            <div class="kb-sect__head">
              <span class="kb-sect__no">{{ bases.length > 0 ? '03' : '02' }}</span>
              <h2 class="kb-sect__title">教育场景模板</h2>
              <div class="kb-sect__extra">
                <ReButton link type="primary" @click="emit('all-templates')">全部模板</ReButton>
              </div>
            </div>

            <div class="kb-tpls">
              <div
                v-for="(tpl, i) in templates"
                :key="tpl.key"
                class="kb-tpl"
                role="button"
                tabindex="0"
                @click="useTemplate(tpl)"
                @keydown.enter="useTemplate(tpl)"
              >
                <div class="kb-tpl__cover">
                  <span class="kb-tpl__no">{{ no(i) }}</span>
                  <img v-if="tpl.cover" :src="tpl.cover" :alt="tpl.name" class="w-full h-full object-cover" />
                  <el-icon v-else :size="34"><Document /></el-icon>
                </div>
                <div class="kb-tpl__body">
                  <span class="kb-tpl__name">{{ tpl.name }}</span>
                  <div class="kb-tpl__meta">
                    <span>{{ tpl.entity > 0 ? `${tpl.entity} 实体 · ${tpl.relation} 关系` : '预置结构' }}</span>
                    <ReButton size="small" round @click.stop="useTemplate(tpl)">使用模板</ReButton>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- ================= 右列：最近活动时间轴 ================= -->
        <aside class="kb-col">
          <section class="kb-sect">
            <div class="kb-sect__head">
              <span class="kb-sect__no">—</span>
              <h2 class="kb-sect__title">最近活动</h2>
            </div>

            <div v-if="activities.length > 0" class="kb-timeline">
              <div v-for="a in activities" :key="a.key" class="kb-tl">
                <span class="kb-tl__rail"><i class="kb-tl__dot" /></span>
                <span class="kb-tl__body">
                  <span class="kb-tl__title">{{ a.title }}</span>
                  <span class="kb-tl__desc">{{ a.desc }}</span>
                  <span class="kb-tl__time">{{ a.time }}</span>
                </span>
              </div>
            </div>
            <ReEmpty v-else text="暂无活动，创建知识库、上传文档或生成图谱后会出现在这里" />
          </section>
        </aside>
      </div>
    </div>

    <!-- ===== 新建知识库弹框（结构不变，视觉随设计层） ===== -->
    <ReDialog v-model="modalVisible" :title="t('knowledge.page.createTitle')" :width="560" :close-on-click-modal="false">
      <div class="kb flex flex-col gap-4">
        <div>
          <label class="kb-label block mb-1.5">
            {{ t('knowledge.page.kbName') }}<i class="kb-req">*</i>
          </label>
          <ReInput v-model="form.name" :placeholder="t('knowledge.page.kbNamePlaceholder')" maxlength="255" show-word-limit @keyup.enter="submit" />
          <p class="kb-hint">2-20 个字，创建后可在设置中修改</p>
        </div>

        <div>
          <label class="kb-label block mb-1.5">描述</label>
          <ReInput v-model="form.description" type="textarea" :rows="2" resize="none"
            placeholder="简单描述这个知识库的用途，例如收集课文、试卷与知识点" />
        </div>

        <div>
          <label class="kb-label block mb-1.5">可见范围</label>
          <div class="flex flex-col gap-2.5">
            <div
              v-for="s in SCOPES"
              :key="s.label"
              class="kb-visibility"
              :class="{ 'is-public': form.scope === s.label }"
              role="button"
              tabindex="0"
              @click="form.scope = s.label"
              @keydown.enter="form.scope = s.label"
            >
              <el-icon class="kb-visibility__icon"><component :is="s.icon" /></el-icon>
              <span class="kb-visibility__text">
                <span class="kb-visibility__title">{{ s.label }}</span>
                <span class="kb-visibility__hint">{{ s.hint }}</span>
              </span>
              <el-icon v-if="form.scope === s.label" class="kb-visibility__check"><Select /></el-icon>
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
 * 知识库总览（列表页）。
 *
 * <p><b>风格</b>：编辑部阅读风 —— 宋体展示字、等宽编号、发丝线分隔、单一强调色；
 * 视觉全部由 styles/kb-refactor.css 的 .kb-refactor 作用域提供，本组件不写样式。</p>
 *
 * <p><b>布局</b>：内容区是唯一滚动容器（flex-1 + min-h-0 + overflow-y-auto）。</p>
 *
 * <p><b>列表口径</b>：全部知识库平铺为文献条目（原先是「最近 2 个」卡片 + 其余收在
 * 数量气泡的 popover 里）。平铺后「有几个库、每个库什么状态」一眼可读，也少一层点击。</p>
 *
 * <p><b>数据</b>：本组件不发请求，只渲染 props 并上抛事件。</p>
 */
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Edit, Delete, Document, Select, Grid, UploadFilled, Search } from '@element-plus/icons-vue'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReButton from '@/components/ui/ReButton.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'
import heroIllustration from '@/assets/kb/kb-empty-hero.png'

/** 最近活动条目 */
interface ActivityItem {
  key: string
  title: string
  desc: string
  time: string
  ts: number
}

/** 教育场景模板条目 */
interface TemplateItem {
  key: string
  name: string
  cover: string
  entity: number
  relation: number
}

/** 列表条目 */
interface BaseItem {
  id: string
  name: string
  description: string | null
  cover?: string
  fileCount: number
  entityCount: number
  relationCount: number
  ready: boolean
  isPublic: boolean
}

const props = defineProps<{
  kbCount: number
  fileCount: number
  entityCount: number
  relationCount: number
  activities: ActivityItem[]
  templates: TemplateItem[]
  bases: BaseItem[]
  /** 总览数据是否在拉取：加载中统计格显示「–」、条目区显示骨架，不提前说「第一个知识库」 */
  loading?: boolean
}>()

/**
 * 列表过滤词。
 *
 * <p>同名知识库（验收数据里 6 个都叫「AI 验收知识库」）靠编号认人很吃力，
 * 这里按名称与描述过滤；不新增任何请求，只在已有 props 上筛。</p>
 */
const kw = ref('')

/** 当前过滤词筛选后的条目（过滤词为空时原样返回） */
const filteredBases = computed(() => {
  const q = kw.value.trim().toLowerCase()
  if (!q) return props.bases
  return props.bases.filter((kb) =>
    String(kb.name || '').toLowerCase().includes(q)
    || String(kb.description || '').toLowerCase().includes(q))
})

/** 空库（一篇文档都没有）：统计带与条目样式都用它 */
const emptyCount = computed(() => props.bases.filter((kb) => kb.fileCount === 0).length)

const emit = defineEmits<{
  (e: 'create', p: { name: string; description: string; isPublic: boolean }): void
  (e: 'help'): void
  (e: 'all-templates'): void
  (e: 'search', kw: string): void
  (e: 'open', kb: { id: string }): void
  (e: 'update', p: { id: string; name: string; description: string; isPublic: boolean }): void
  (e: 'remove', kb: { id: string }): void
}>()

const { t } = useI18n()

/** 可见范围：仅私有 / 公开（后端只有 is_public 一列，无「团队」语义） */
const SCOPES = [
  { label: '私有', hint: '仅自己可见', icon: Select },
  { label: '公开', hint: '所有人可见', icon: Grid },
]

/**
 * 编号徽标：01 / 02 …（编辑部设计语言的「目录编号」）。
 *
 * @param i 零基序号
 * @returns 两位编号字符串
 */
function no(i: number): string {
  return String(i + 1).padStart(2, '0')
}

/**
 * 取名称首字做占位封面。
 *
 * @param name 知识库名称
 * @returns 首字（最多两个字符）
 */
function initialsOf(name: string): string {
  const s = String(name || '').trim()
  return s ? s.slice(0, 2) : '知'
}

const modalVisible = ref(false)
const form = reactive({
  name: '',
  description: '',
  scope: '私有',
})

/** 打开新建弹框并重置表单 */
function openModal() {
  form.name = ''
  form.description = ''
  form.scope = '私有'
  modalVisible.value = true
}

/**
 * 使用模板：跳到「从模板创建」页。
 *
 * <p>模板携带完整数据集（文档 / 实体 / 关系），必须走模板页的建库流程才能整体复制。</p>
 *
 * @param tpl 被选中的模板
 */
function useTemplate(tpl: TemplateItem) {
  void tpl
  emit('all-templates')
}

/** 弹框内跳转模板 */
function onToTemplate() {
  modalVisible.value = false
  emit('all-templates')
}

/**
 * 编辑知识库：上抛 update（由页面复用既有编辑流程）。
 *
 * @param kb 目标知识库
 */
function onEdit(kb: BaseItem) {
  emit('update', {
    id: kb.id,
    name: kb.name,
    description: kb.description ?? '',
    isPublic: kb.isPublic,
  })
}

/**
 * 删除知识库：上抛 remove。
 *
 * @param kb 目标知识库
 */
function onRemove(kb: BaseItem) {
  emit('remove', { id: kb.id })
}

/** 提交新建（2-20 字名校验，不合法直接静默返回，保持原行为） */
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
 * <p>父页面 KnowledgeBasePage.handleTemplateCreate 调 overviewRef.openCreate(name)。</p>
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