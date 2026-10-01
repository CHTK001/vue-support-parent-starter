<template>
  <div class="h-full min-h-0 flex flex-col">
    <!-- ===== 顶栏：面包屑 + 标题 + 搜索 ===== -->
    <header class="shrink-0 border-b border-[var(--rm-border-light)] px-4 py-3 flex flex-wrap items-end gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 text-xs text-[var(--rm-text-secondary)] mb-1.5">
          <ReButton link :icon="ArrowLeft" title="返回" @click="emit('cancel')" />
          <span class="cursor-pointer text-[var(--rm-primary)] hover:underline" @click="emit('cancel')">知识库</span>
          <span class="text-[var(--rm-text-disabled)]">/</span>
          <span>新建知识库</span>
        </div>
        <h1 class="text-lg font-bold">从模板创建</h1>
        <p class="text-xs text-[var(--rm-text-secondary)] mt-0.5">选择预置模板，自动生成实体类型与关系结构</p>
      </div>

      <el-input v-model="keyword" class="!w-72 max-w-full" clearable placeholder="搜索模板名称、关键词" :prefix-icon="Search" />
    </header>

    <!-- ===== 主体：左卡片网格 + 右详情（唯一滚动容器） ===== -->
    <div class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
      <div class="flex flex-col gap-4 min-w-0">
        <!-- 分类 chip -->
        <div class="flex items-center gap-2 flex-wrap">
          <ReButton
            v-for="c in categories"
            :key="c"
            size="small"
            round
            :type="activeCategory === c ? 'primary' : 'default'"
            @click="activeCategory = c"
          >{{ c }}</ReButton>
          <ReButton link type="primary" class="!ml-auto" @click="emit('cancel')">改为空白创建</ReButton>
        </div>

        <!-- 卡片网格 -->
        <div v-if="filtered.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          <article
            v-for="t in filtered"
            :key="t.key"
            class="re-surface re-surface--dense re-surface--hover !p-0 overflow-hidden flex flex-col cursor-pointer transition"
            :class="selected?.key === t.key ? 'ring-2 ring-[var(--rm-primary)]' : ''"
            @click="select(t)"
          >
            <div class="relative w-full aspect-[400/225] bg-[var(--rm-bg-subtle)] grid place-items-center overflow-hidden">
              <img v-if="t.cover" :src="t.cover" :alt="t.name" class="w-full h-full object-cover" />
              <em v-else class="text-xl font-bold not-italic text-[var(--rm-primary)] tracking-widest">{{ t.name.slice(0, 2) }}</em>
              <ReTag
                v-if="t.badge"
                :type="t.badgeType === 'hot' ? 'warning' : t.badgeType === 'fresh' ? 'success' : 'primary'"
                size="small"
                class="!absolute !top-2 !left-2"
              >{{ t.badge }}</ReTag>
              <span
                v-if="selected?.key === t.key"
                class="absolute top-2 right-2 w-5.5 h-5.5 rounded-full bg-[var(--rm-primary)] grid place-items-center"
              >
                <svg viewBox="0 0 24 24" class="w-3.5 h-3.5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7" /></svg>
              </span>
            </div>
            <div class="flex flex-col gap-2 p-3 flex-1 min-w-0">
              <b class="text-sm font-medium truncate">{{ t.name }}</b>
              <p class="text-xs text-[var(--rm-text-secondary)] leading-relaxed line-clamp-2">{{ t.desc }}</p>
              <div class="flex items-center justify-between gap-2 mt-auto flex-wrap">
                <span class="text-xs text-[var(--rm-text-disabled)]">预置实体 · 关系结构</span>
                <ReButton size="small" round :type="selected?.key === t.key ? 'primary' : 'default'" @click.stop="select(t)">
                  {{ selected?.key === t.key ? '已选模板' : '使用模板' }}
                </ReButton>
              </div>
            </div>
          </article>
        </div>
        <ReEmpty v-else :text="`没有匹配「${keyword}」的模板`" />
      </div>

      <!-- 右侧详情 -->
      <ReCard v-if="selected" :title="selected.name">
        <div class="flex flex-col gap-3">
          <div class="w-full aspect-[400/200] rounded-[var(--rm-radius,10px)] overflow-hidden bg-[var(--rm-bg-subtle)] grid place-items-center">
            <img v-if="selected.cover" :src="selected.cover" :alt="selected.name" class="w-full h-full object-cover" />
            <em v-else class="text-2xl font-bold not-italic text-[var(--rm-primary)] tracking-widest">{{ selected.name.slice(0, 2) }}</em>
          </div>

          <p class="text-xs text-[var(--rm-text-secondary)] leading-relaxed">{{ selected.desc }}</p>

          <div class="grid grid-cols-3 gap-2">
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="text-sm font-bold">{{ selected.entityTypes.length }}</b>
              <span class="text-xs text-[var(--rm-text-secondary)]">类实体</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="text-sm font-bold">{{ selected.relationTypes.length }}</b>
              <span class="text-xs text-[var(--rm-text-secondary)]">类关系</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="text-sm font-bold">{{ selected.entityTypes.length + selected.relationTypes.length }}</b>
              <span class="text-xs text-[var(--rm-text-secondary)]">类预置</span>
            </div>
          </div>

          <div>
            <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">预置实体类型</div>
            <div class="flex flex-wrap gap-1.5">
              <ReTag v-for="x in selected.entityTypes" :key="x" size="small">{{ x }}</ReTag>
            </div>
          </div>

          <div>
            <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">预置关系类型</div>
            <div class="flex flex-wrap gap-1.5">
              <ReTag v-for="x in selected.relationTypes" :key="x" size="small">{{ x }}</ReTag>
            </div>
          </div>

          <p class="text-xs text-[var(--rm-text-disabled)]">官方模板 · 预置结构（示例文档需创建后上传）</p>

          <div>
            <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">知识库名称</div>
            <el-input v-model="kbName" placeholder="知识库名称" @keyup.enter="onCreate" />
          </div>

          <div class="flex gap-2 flex-wrap">
            <ReButton type="primary" class="!flex-1" :loading="creating" @click="onCreate">
              {{ creating ? '创建中…' : '使用此模板创建' }}
            </ReButton>
            <ReButton @click="previewVisible = true">预览效果</ReButton>
          </div>
        </div>
      </ReCard>
      <ReCard v-else>
        <ReEmpty text="从左侧选择一个模板，这里会显示它的实体类型与关系结构" />
      </ReCard>
    </div>

    <!-- ===== 底部步骤条 ===== -->
    <footer class="shrink-0 border-t border-[var(--rm-border-light)] px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
      <div class="flex items-center gap-2 text-sm text-[var(--rm-primary)] font-medium">
        <span class="w-5 h-5 rounded-full bg-[var(--rm-primary)] text-white grid place-items-center">
          <svg viewBox="0 0 24 24" class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7" /></svg>
        </span>
        <span>选择模板</span>
      </div>
      <span class="w-10 h-px bg-[var(--rm-border-light)]" />
      <div class="flex items-center gap-2 text-sm text-[var(--rm-text-secondary)]">
        <span class="w-5 h-5 rounded-full bg-[var(--rm-bg-subtle)] grid place-items-center text-xs font-bold">2</span>
        <span>填写信息</span>
      </div>
      <span class="w-10 h-px bg-[var(--rm-border-light)]" />
      <div class="flex items-center gap-2 text-sm text-[var(--rm-text-secondary)]">
        <span class="w-5 h-5 rounded-full bg-[var(--rm-bg-subtle)] grid place-items-center text-xs font-bold">3</span>
        <span>创建完成</span>
      </div>
    </footer>

    <!-- 预览效果（用 ReDialog，不再手写遮罩） -->
    <ReDialog v-model="previewVisible" :title="selected ? `预览：${selected.name}` : '预览'" :width="560">
      <div v-if="selected" class="flex flex-col gap-3">
        <div>
          <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">实体类型（{{ selected.entityTypes.length }} 类）</div>
          <div class="flex flex-wrap gap-1.5">
            <ReTag v-for="x in selected.entityTypes" :key="x" size="small">{{ x }}</ReTag>
          </div>
        </div>
        <div>
          <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">关系类型（{{ selected.relationTypes.length }} 类）</div>
          <div class="flex flex-wrap gap-1.5">
            <ReTag v-for="x in selected.relationTypes" :key="x" size="small">{{ x }}</ReTag>
          </div>
        </div>
        <div>
          <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">示例文档结构（创建后按此结构上传）</div>
          <ul class="flex flex-col gap-1.5">
            <li v-for="d in sampleDocs" :key="d" class="text-xs text-[var(--rm-text-regular)] px-2.5 py-1.5 rounded-[var(--rm-radius-sm,8px)] bg-[var(--rm-bg-subtle)]">{{ d }}</li>
          </ul>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 从模板创建。
 *
 * <p><b>风格</b>：与系统既有页面一致 —— 布局用 Tailwind 工具类，卡片表面用组件库基线
 * {@code re-surface}，语义组件用应用本地 koi 封装 {@code @/components/re/*}
 * （ReCard / ReTag / ReButton / ReEmpty），弹框用 {@code ReDialog}。不再手写 BEM CSS。</p>
 *
 * <p><b>数据诚实性</b>：模板只提供「名称 + 分类 + 预置实体/关系类型」，因此卡片与详情
 * 只展示这些真实存在的项；不再宣称「N 实体 / N 关系 / N 篇文档 / N 人使用」这类
 * 模板并不携带的数字。示例文档结构是按预置类型拼出的<b>结构示意</b>，非真实文档。</p>
 *
 * <p><b>契约</b>：props {@code creating?}；emits {@code cancel} 与 {@code create(name)}。</p>
 */
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import ReDialog from '@repo/ui/re-dialog'
import ReCard from '@/components/re/ReCard.vue'
import ReTag from '@/components/re/ReTag.vue'
import ReButton from '@/components/re/ReButton.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
import coverSanguo from '@/assets/kb/tpl-sanguo.png'
import coverPoem from '@/assets/kb/tpl-poem.png'
import coverIdiom from '@/assets/kb/tpl-idiom.png'
import coverQuestion from '@/assets/kb/tpl-question.png'

/** 模板条目 */
interface TemplateItem {
  /** 模板标识 */
  key: string
  /** 模板名称 */
  name: string
  /** 所属分类 */
  category: string
  /** 封面图（缺省时渲染首字占位） */
  cover?: string
  /** 角标文字 */
  badge?: string
  /** 角标类型（hot 热门 / official 官方 / fresh 新课） */
  badgeType?: 'hot' | 'official' | 'fresh'
  /** 卡片描述 */
  desc: string
  /** 预设实体类型 */
  entityTypes: string[]
  /** 预设关系类型 */
  relationTypes: string[]
}

defineProps<{
  /** 父页面正在创建（用于禁用按钮） */
  creating?: boolean
}>()

const emit = defineEmits<{
  /** 取消并回到列表 */
  (e: 'cancel'): void
  /** 用该模板名创建知识库 */
  (e: 'create', name: string): void
}>()

/** 分类清单 */
const categories: ReadonlyArray<string> = [
  '全部模板', '文学经典', '语文学习', '题库考试', '科学百科', '历史人文', '德育素养',
]

/** 模板清单（封面为已下载入库的本地资源；未备封面的渲染首字占位） */
const templates: ReadonlyArray<TemplateItem> = [
  {
    key: 'sanguo', name: '三国演义知识图谱', category: '文学经典', cover: coverSanguo,
    badge: '热门', badgeType: 'hot',
    desc: '预置人物、势力、战役三类实体与从属、敌对、联姻等关系',
    entityTypes: ['人物', '势力', '战役', '地点'],
    relationTypes: ['从属', '敌对', '联姻', '结义'],
  },
  {
    key: 'poem', name: '古诗词库', category: '语文学习', cover: coverPoem,
    badge: '官方', badgeType: 'official',
    desc: '预置诗人、朝代、意象等实体与创作、师承、并称等关系',
    entityTypes: ['诗人', '朝代', '意象', '体裁'],
    relationTypes: ['创作', '师承', '并称', '唱和'],
  },
  {
    key: 'idiom', name: '成语典故库', category: '语文学习', cover: coverIdiom,
    badge: '热门', badgeType: 'hot',
    desc: '预置成语、出处、人物等实体与出自、比喻、反义等关系',
    entityTypes: ['成语', '出处', '人物', '寓意'],
    relationTypes: ['出自', '比喻', '近义', '反义'],
  },
  {
    key: 'question', name: '题库知识库', category: '题库考试', cover: coverQuestion,
    badge: '新课', badgeType: 'fresh',
    desc: '预置知识点、题型、难度等实体与考查、前置、同类等关系',
    entityTypes: ['知识点', '题型', '难度', '年级'],
    relationTypes: ['考查', '前置', '同类', '易错'],
  },
  {
    key: 'insect', name: '昆虫百科', category: '科学百科',
    badge: '官方', badgeType: 'official',
    desc: '预置昆虫、科目、习性等实体与属于、捕食、共生等关系',
    entityTypes: ['昆虫', '科目', '习性', '分布'],
    relationTypes: ['属于', '捕食', '共生', '天敌'],
  },
  {
    key: 'hanzi', name: '汉字学习库', category: '语文学习',
    desc: '预置汉字、部首、笔画等实体与包含、形近、音近等关系',
    entityTypes: ['汉字', '部首', '笔画', '结构'],
    relationTypes: ['包含', '形近', '音近', '同义'],
  },
  {
    key: 'writing', name: '作文素材库', category: '语文学习',
    badge: '新课', badgeType: 'fresh',
    desc: '预置素材、主题、适用文体等实体与适用于、论证、对比等关系',
    entityTypes: ['素材', '主题', '文体', '人物'],
    relationTypes: ['适用于', '论证', '对比', '升华'],
  },
  {
    key: 'quote', name: '名人名言库', category: '德育素养',
    badge: '新课', badgeType: 'fresh',
    desc: '预置名言、作者、主题等实体与出自、阐释、同类等关系',
    entityTypes: ['名言', '作者', '主题', '领域'],
    relationTypes: ['出自', '阐释', '同类', '引用'],
  },
]

const keyword = ref('')
const activeCategory = ref('全部模板')
const selected = ref<TemplateItem | null>(templates[0] ?? null)
const kbName = ref(selected.value ? selected.value.name : '')
const previewVisible = ref(false)

/** 分类 + 关键词过滤 */
const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return templates.filter((t) => {
    if (activeCategory.value !== '全部模板' && t.category !== activeCategory.value) {
      return false
    }
    if (!kw) {
      return true
    }
    return t.name.toLowerCase().includes(kw) || t.desc.toLowerCase().includes(kw)
  })
})

/** 切换分类后若当前选中不在结果里，自动选中第一个，避免右侧空着 */
watch(filtered, (list) => {
  if (list.length === 0) {
    return
  }
  if (!selected.value || !list.some((t) => t.key === selected.value?.key)) {
    select(list[0])
  }
})

/** 预览里的示例文档结构示意（按预置实体/关系类型拼出可读骨架，非真实文档） */
const sampleDocs = computed(() => {
  const t = selected.value
  if (!t) {
    return []
  }
  const [a, b] = t.entityTypes
  const [r1] = t.relationTypes
  return [
    `01-${t.name}-概述.md`,
    `02-${a ?? '实体'}-名录.md`,
    `03-${a ?? '实体'}-${r1 ?? '关系'}-${b ?? '明细'}.md`,
    `04-${b ?? '实体'}-属性明细.md`,
    `05-${t.name}-常见问答.md`,
  ]
})

/**
 * 选中模板，并把名称输入框预填为模板名（用户可改）。
 * @param t 模板
 */
function select(t: TemplateItem) {
  selected.value = t
  kbName.value = t.name
}

/** 用当前模板创建 */
function onCreate() {
  const name = kbName.value.trim()
  if (name.length < 2 || name.length > 20) {
    return
  }
  emit('create', name)
}
</script>