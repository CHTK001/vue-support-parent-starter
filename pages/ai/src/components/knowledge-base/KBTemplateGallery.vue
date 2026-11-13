<template>
  <!-- kb：与 KnowledgeBasePage / KnowledgeOverview 共用一套设计系统作用域，
       此前模板页是唯一漏挂 `.kb` 的知识库页面，字号与行高会跟其它页对不上。 -->
  <div class="kb h-full min-h-0 flex flex-col">
    <!-- ===== 顶栏：面包屑 + 标题 + 搜索 ===== -->
    <header class="shrink-0 border-b border-[var(--rm-border-light)] px-4 py-3 flex flex-wrap items-end gap-4">
      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-bold flex items-center gap-1"><ReSquareButton layout="square" size="small" class="kb-btn" :icon="ArrowLeft" tip="返回" @click="emit('cancel')" />从模板创建</h1>
        <p class="text-xs text-[var(--rm-text-secondary)] mt-0.5">选择预置模板，自动生成文档、实体类型与关系结构</p>
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
              <b class="kb-tpl__name truncate">{{ t.name }}</b>
              <p class="kb-tpl__desc line-clamp-2">{{ t.desc }}</p>
              <div class="flex items-center justify-between gap-2 mt-auto flex-wrap">
                <span v-if="t.dataset" class="kb-tpl__meta">
                  <b>{{ t.dataset.docs.length }}</b> 文档 · <b>{{ t.dataset.entities.length }}</b> 实体
                </span>
                <span v-else class="kb-tpl__meta">预置实体 · 关系结构</span>
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

          <!-- 数据集规模（有完整数据集时展示真实数量） -->
          <div v-if="selected.dataset" class="grid grid-cols-3 gap-2">
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.dataset.docs.length }}</b>
              <span class="kb-tpl__label">文档</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.dataset.entities.length }}</b>
              <span class="kb-tpl__label">实体</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.dataset.relations.length }}</b>
              <span class="kb-tpl__label">关系</span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.entityTypes.length }}</b>
              <span class="kb-tpl__label">类实体</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.relationTypes.length }}</b>
              <span class="kb-tpl__label">类关系</span>
            </div>
            <div class="re-surface re-surface--dense flex flex-col items-center !py-2">
              <b class="kb-tpl__num">{{ selected.entityTypes.length + selected.relationTypes.length }}</b>
              <span class="kb-tpl__label">类预置</span>
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

          <p v-if="selected.dataset" class="text-xs text-[var(--rm-text-success,#22c55e)]">该模板携带完整数据：创建后会把这 {{ selected.dataset.docs.length }} 篇文档、{{ selected.dataset.entities.length }} 个实体、{{ selected.dataset.relations.length }} 条关系全部复制进新知识库。</p>
          <p v-else class="text-xs text-[var(--rm-text-disabled)]">官方模板 · 预置结构（创建后生成骨架文档，示例内容需自行补充）</p>

          <div>
            <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">知识库名称</div>
            <el-input v-model="kbName" placeholder="知识库名称" @keyup.enter="onCreate" />
          </div>

          <div class="flex gap-2 flex-wrap">
            <ReButton type="primary" class="!flex-1" :loading="creating" @click="onCreate">
              {{ creating ? '创建中…' : '使用此模板创建' }}
            </ReButton>
            <ReButton type="default" @click="previewVisible = true">预览效果</ReButton>
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
        <div v-if="selected.dataset">
          <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">包含文档（{{ selected.dataset.docs.length }} 篇）</div>
          <ul class="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
            <li v-for="d in selected.dataset.docs" :key="d.path" class="text-xs text-[var(--rm-text-regular)] px-2.5 py-1.5 rounded-[var(--rm-radius-sm,8px)] bg-[var(--rm-bg-subtle)]">{{ d.path }}</li>
          </ul>
        </div>
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
        <div v-if="!selected.dataset">
          <div class="text-xs text-[var(--rm-text-secondary)] font-medium mb-1.5">示例文档结构（创建后按此结构生成）</div>
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
 * {@code re-surface}，语义组件用应用本地 koi 封装 {@code @/components/ui/*}
 * （ReCard / ReTag / ReButton / ReEmpty），弹框用 {@code ReDialog}。不再手写 BEM CSS。</p>
 *
 * <p><b>数据诚实性</b>：预置类型来自静态清单；对**携带完整数据集**的模板（如三国演义），
 * 展示的是数据集真实条数（文档 / 实体 / 关系），创建后由父页面整体复制进新库。
 * 其余模板只生成骨架文档，不宣称拥有并不存在的数据。</p>
 *
 * <p><b>契约</b>：props {@code creating?}；emits {@code cancel} 与 {@code create(name, dataset)}。
 * 父页面负责建库、写文档、建实体、建关系。</p>
 */
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Search } from '@element-plus/icons-vue'
import ReDialog from '@repo/ui/re-dialog'
import ReCard from '@/components/ui/ReCard.vue'
import ReTag from '@/components/ui/ReTag.vue'
import ReButton from '@/components/ui/ReButton.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'
import ReSquareButton from '@repo/ui/re-button'
import coverSanguo from '@/assets/kb/tpl-sanguo.png'
import coverPoem from '@/assets/kb/tpl-poem.png'
import coverIdiom from '@/assets/kb/tpl-idiom.png'
import coverQuestion from '@/assets/kb/tpl-question.png'
import { SANGUO_DATASET } from '@/data/kb/templates/sanguo'
import type { KbTemplateDataset } from '@/data/kb/templates/types'

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
  /** 完整数据集（有则整体复制入库） */
  dataset?: KbTemplateDataset
}

defineProps<{
  /** 父页面正在创建（用于禁用按钮） */
  creating?: boolean
}>()

const emit = defineEmits<{
  /** 取消并回到列表 */
  (e: 'cancel'): void
  /** 用该模板创建知识库，并携带完整数据集（文档 + 实体 + 关系） */
  (e: 'create', name: string, dataset: KbTemplateDataset): void
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
    dataset: SANGUO_DATASET,
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
const creating = ref(false)

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

/**
 * 用当前模板创建。
 *
 * <p>携带完整数据集：建库成功后由父页面写文档、建实体、建关系。
 * 无数据集的模板回退为「按预置类型生成骨架文档」。</p>
 */
function onCreate() {
  const name = kbName.value.trim()
  if (name.length < 2 || name.length > 20) {
    return
  }
  const t = selected.value
  if (!t) {
    return
  }
  const dataset: KbTemplateDataset = t.dataset ?? {
    docs: buildTemplateDocs(t),
    entities: [],
    relations: [],
  }
  emit('create', name, dataset)
}

/**
 * 按模板的预置类型生成骨架文档内容（无数据集的模板使用）。
 *
 * @param t 模板
 * @returns 文档列表（path + content）
 */
function buildTemplateDocs(t: TemplateItem): Array<{ path: string; content: string }> {
  const [a, b] = t.entityTypes
  const [r1, r2] = t.relationTypes
  const header = `# ${t.name}\n\n> 由模板「${t.name}」自动生成，请按下方结构补充真实内容。\n\n`
  const types = `## 预置类型\n\n- 实体类型：${t.entityTypes.join('、')}\n- 关系类型：${t.relationTypes.join('、')}\n\n`

  return [
    {
      path: `01-${t.name}-概述.md`,
      content: header + `本知识库用于沉淀《${t.name}》相关资料。\n\n` + types +
        `## 使用方式\n\n1. 先在本文件写清范围与术语口径；\n2. 再按后续目录逐类补充条目；\n3. 上传后系统会自动切分并建立索引。\n`,
    },
    {
      path: `02-${a ?? '实体'}-名录.md`,
      content: header + `## ${a ?? '实体'}名录\n\n| 名称 | 类型 | 说明 |\n| --- | --- | --- |\n| （示例，请替换） | ${a ?? '实体'} | 简要说明 |\n\n` +
        `> 每行一条${a ?? '实体'}；说明保持一句话以内，便于检索命中。\n`,
    },
    {
      path: `03-${a ?? '实体'}-${r1 ?? '关系'}-${b ?? '明细'}.md`,
      content: header + `## ${r1 ?? '关系'}关系\n\n| ${a ?? '主体'} | 关系 | ${b ?? '客体'} | 说明 |\n| --- | --- | --- | --- |\n| （示例） | ${r1 ?? '关系'} | （示例） |  |\n\n` +
        `> 关系词固定使用：${t.relationTypes.join('、')}。\n`,
    },
    {
      path: `04-${b ?? '实体'}-属性明细.md`,
      content: header + `## ${b ?? '实体'}属性明细\n\n| 名称 | 属性 | 取值 | 备注 |\n| --- | --- | --- | --- |\n| （示例） | （属性） | （取值） |  |\n\n` +
        `> 属性名统一用中文短词（如：朝代、体裁、出处），避免同义异名。\n`,
    },
    {
      path: `05-${t.name}-常见问答.md`,
      content: header + `## 常见问答\n\n### Q1. （问题）\n\n（回答，尽量给出依据来源）\n\n` +
        `### Q2. （问题）\n\n（回答）\n\n> 问答对同样会进入检索，问题句尽量贴近用户真实提问方式${r2 ? `；可用关系「${r2}」串联相关内容` : ''}。\n`,
    },
  ]
}
</script>

<style scoped>
/* 模板卡与右侧读数：名称/描述比列表页小一号，所有数字统一等宽 */
.kb-tpl__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--rm-text);
}

.kb-tpl__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--rm-text-secondary);
}

.kb-tpl__meta {
  font-size: 11px;
  color: var(--rm-text-disabled);
}

.kb-tpl__meta b {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-weight: 600;
  color: var(--rm-text-secondary);
  font-variant-numeric: tabular-nums;
}

.kb-tpl__num {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--rm-text);
  font-variant-numeric: tabular-nums;
}

.kb-tpl__label {
  font-size: 10.5px;
  letter-spacing: 0.02em;
  color: var(--rm-text-secondary);
}
</style>
