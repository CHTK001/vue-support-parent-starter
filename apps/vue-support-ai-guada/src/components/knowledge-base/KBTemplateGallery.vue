<template>
  <div class="kb-tpl">
    <!-- ===== 顶栏：面包屑 + 标题 + 搜索 ===== -->
    <header class="kb-tpl__bar">
      <div class="kb-tpl__head">
        <div class="kb-tpl__crumb">
          <!-- 返回图标：等同取消，回到知识库首页 -->
          <button class="kb-tpl__back" title="返回" @click="emit('cancel')">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span class="kb-tpl__crumb-link" @click="emit('cancel')">知识库</span>
          <span class="kb-tpl__crumb-sep">/</span>
          <span>新建知识库</span>
        </div>
        <h1 class="kb-tpl__title">从模板创建</h1>
        <p class="kb-tpl__sub">选择预置模板，自动生成实体类型、关系结构与示例文档</p>
      </div>

      <div class="kb-tpl__search">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
        <input v-model="keyword" type="text" placeholder="搜索模板名称、关键词" />
      </div>
    </header>

    <!-- ===== 主体：左卡片网格 + 右详情（唯一滚动容器） ===== -->
    <div class="kb-tpl__body">
      <div class="kb-tpl__left">
        <!-- 分类 chip -->
        <div class="kb-tpl__chips">
          <button
            v-for="c in categories"
            :key="c"
            class="kb-tpl__chip"
            :class="{ on: activeCategory === c }"
            @click="activeCategory = c"
          >{{ c }}</button>
          <span class="kb-tpl__to-blank" @click="emit('cancel')">改为空白创建</span>
        </div>

        <!-- 卡片网格 -->
        <div v-if="filtered.length > 0" class="kb-tpl__grid">
          <article
            v-for="t in filtered"
            :key="t.key"
            class="kb-tpl-card"
            :class="{ on: selected?.key === t.key }"
            @click="select(t)"
          >
            <div class="kb-tpl-card__pic">
              <img v-if="t.cover" :src="t.cover" :alt="t.name" />
              <em v-else>{{ t.name.slice(0, 2) }}</em>
              <span v-if="t.badge" class="kb-tpl-card__badge" :class="'is-' + t.badgeType">{{ t.badge }}</span>
              <span v-if="selected?.key === t.key" class="kb-tpl-card__check">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7" /></svg>
              </span>
            </div>
            <div class="kb-tpl-card__body">
              <b>{{ t.name }}</b>
              <p>{{ t.desc }}</p>
              <div class="kb-tpl-card__foot">
                <span class="kb-tpl-card__count">{{ t.entity }} 实体 · {{ t.relation }} 关系 · {{ t.doc }} 篇文档</span>
                <button class="kb-tpl-card__btn" :class="{ on: selected?.key === t.key }" @click.stop="select(t)">
                  {{ selected?.key === t.key ? '已选模板' : '使用模板' }}
                </button>
              </div>
            </div>
          </article>
        </div>
        <div v-else class="kb-tpl__empty">
          <p>没有匹配「{{ keyword }}」的模板</p>
        </div>
      </div>

      <!-- 右侧详情 -->
      <aside class="kb-tpl__side">
        <template v-if="selected">
          <div class="kb-tpl-detail__pic">
            <img v-if="selected.cover" :src="selected.cover" :alt="selected.name" />
            <em v-else>{{ selected.name.slice(0, 2) }}</em>
          </div>
          <h2 class="kb-tpl-detail__name">{{ selected.name }}</h2>
          <p class="kb-tpl-detail__desc">{{ selected.desc }}</p>

          <div class="kb-tpl-detail__sec">模板包含</div>
          <div class="kb-tpl-detail__cells">
            <div class="kb-tpl-detail__cell"><b>{{ selected.entityTypes.length }}</b><span>类实体</span></div>
            <div class="kb-tpl-detail__cell"><b>{{ selected.relationTypes.length }}</b><span>类关系</span></div>
            <div class="kb-tpl-detail__cell"><b>{{ selected.doc }}</b><span>篇文档</span></div>
          </div>

          <div class="kb-tpl-detail__sec">预置实体类型</div>
          <div class="kb-tpl-detail__tags">
            <span v-for="x in selected.entityTypes" :key="x" class="kb-tpl-detail__tag">{{ x }}</span>
          </div>

          <div class="kb-tpl-detail__sec">预置关系类型</div>
          <div class="kb-tpl-detail__tags">
            <span v-for="x in selected.relationTypes" :key="x" class="kb-tpl-detail__tag">{{ x }}</span>
          </div>

          <p class="kb-tpl-detail__meta">已有 {{ selected.used }} 人使用 · 官方模板</p>

          <div class="kb-tpl-detail__sec">知识库名称</div>
          <input v-model="kbName" type="text" class="kb-tpl-detail__input" placeholder="知识库名称" />

          <div class="kb-tpl-detail__actions">
            <button class="kb-tpl-detail__primary" :disabled="creating" @click="onCreate">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7" /></svg>
              {{ creating ? '创建中…' : '使用此模板创建' }}
            </button>
            <button class="kb-tpl-detail__ghost" @click="previewVisible = true">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" /><circle cx="12" cy="12" r="2.5" /></svg>
              预览效果
            </button>
          </div>
        </template>
        <p v-else class="kb-tpl__side-hint">从左侧选择一个模板，这里会显示它的实体类型、关系结构与示例文档。</p>
      </aside>
    </div>

    <!-- ===== 底部步骤条 ===== -->
    <footer class="kb-tpl__steps">
      <div class="kb-tpl-step is-on"><i><svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4L19 7" /></svg></i><span>选择模板</span></div>
      <span class="kb-tpl-step__line" />
      <div class="kb-tpl-step"><i>2</i><span>填写信息</span></div>
      <span class="kb-tpl-step__line" />
      <div class="kb-tpl-step"><i>3</i><span>创建完成</span></div>
    </footer>

    <!-- 预览效果：展示该模板的预置结构（不进详情页就能看） -->
    <div v-if="previewVisible && selected" class="kb-tpl-preview" @click.self="previewVisible = false">
      <div class="kb-tpl-preview__box">
        <div class="kb-tpl-preview__head">
          <b>预览：{{ selected.name }}</b>
          <button class="kb-tpl-preview__close" @click="previewVisible = false">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div class="kb-tpl-preview__body">
          <div class="kb-tpl-preview__sec">实体类型（{{ selected.entityTypes.length }} 类）</div>
          <div class="kb-tpl-preview__tags">
            <span v-for="x in selected.entityTypes" :key="x">{{ x }}</span>
          </div>
          <div class="kb-tpl-preview__sec">关系类型（{{ selected.relationTypes.length }} 类）</div>
          <div class="kb-tpl-preview__tags">
            <span v-for="x in selected.relationTypes" :key="x">{{ x }}</span>
          </div>
          <div class="kb-tpl-preview__sec">示例文档结构（{{ selected.doc }} 篇）</div>
          <ul class="kb-tpl-preview__docs">
            <li v-for="d in sampleDocs" :key="d">{{ d }}</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="kb-tpl__toast" :class="{ show: toastShown }">{{ toastMsg }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * 从模板创建（照 UI 图实现；koi 变量 + 响应式 + 内部滚动）。
 *
 * <p>六个区块：面包屑标题栏 / 分类 chip 行 / 模板卡网格 / 右侧详情栏（模板包含 + 预置实体与关系类型
 * + 使用人数 + 名称输入 + 双按钮）/ 底部三步进度条 / 轻提示。</p>
 *
 * <p>契约：props {@code creating?}；emits {@code cancel} 与 {@code create(name)} —— 与父页面
 * KnowledgeBasePage 的 {@code @cancel / @create} 绑定保持一致，父页面无需改动。</p>
 */
import { computed, ref, watch } from 'vue'
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
  /** 角标样式（hot 热门 / official 官方 / fresh 新课） */
  badgeType?: string
  /** 卡片描述 */
  desc: string
  /** 预置实体数 */
  entity: number
  /** 预置关系数 */
  relation: number
  /** 示例文档数 */
  doc: number
  /** 预设实体类型 */
  entityTypes: string[]
  /** 预设关系类型 */
  relationTypes: string[]
  /** 使用人数 */
  used: number
}

const props = defineProps<{
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
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['人物', '势力', '战役', '地点'],
    relationTypes: ['从属', '敌对', '联姻', '结义'],
    used: 1286,
  },
  {
    key: 'poem', name: '古诗词库', category: '语文学习', cover: coverPoem,
    badge: '官方', badgeType: 'official',
    desc: '预置诗人、朝代、意象等实体与创作、师承、并称等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['诗人', '朝代', '意象', '体裁'],
    relationTypes: ['创作', '师承', '并称', '唱和'],
    used: 934,
  },
  {
    key: 'idiom', name: '成语典故库', category: '语文学习', cover: coverIdiom,
    badge: '热门', badgeType: 'hot',
    desc: '预置成语、出处、人物等实体与出自、比喻、反义等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['成语', '出处', '人物', '寓意'],
    relationTypes: ['出自', '比喻', '近义', '反义'],
    used: 702,
  },
  {
    key: 'question', name: '题库知识库', category: '题库考试', cover: coverQuestion,
    badge: '新课', badgeType: 'fresh',
    desc: '预置知识点、题型、难度等实体与考查、前置、同类等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['知识点', '题型', '难度', '年级'],
    relationTypes: ['考查', '前置', '同类', '易错'],
    used: 1580,
  },
  {
    key: 'insect', name: '昆虫百科', category: '科学百科',
    badge: '官方', badgeType: 'official',
    desc: '预置昆虫、科目、习性等实体与属于、捕食、共生等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['昆虫', '科目', '习性', '分布'],
    relationTypes: ['属于', '捕食', '共生', '天敌'],
    used: 418,
  },
  {
    key: 'hanzi', name: '汉字学习库', category: '语文学习',
    desc: '预置汉字、部首、笔画等实体与包含、形近、音近等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['汉字', '部首', '笔画', '结构'],
    relationTypes: ['包含', '形近', '音近', '同义'],
    used: 655,
  },
  {
    key: 'writing', name: '作文素材库', category: '语文学习',
    badge: '新课', badgeType: 'fresh',
    desc: '预置素材、主题、适用文体等实体与适用于、论证、对比等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['素材', '主题', '文体', '人物'],
    relationTypes: ['适用于', '论证', '对比', '升华'],
    used: 512,
  },
  {
    key: 'quote', name: '名人名言库', category: '德育素养',
    badge: '新课', badgeType: 'fresh',
    desc: '预置名言、作者、主题等实体与出自、阐释、同类等关系',
    entity: 84, relation: 196, doc: 32,
    entityTypes: ['名言', '作者', '主题', '领域'],
    relationTypes: ['出自', '阐释', '同类', '引用'],
    used: 389,
  },
]

const keyword = ref('')
const activeCategory = ref('全部模板')
const selected = ref<TemplateItem | null>(templates[0] ?? null)
const kbName = ref(selected.value ? selected.value.name : '')
const toastShown = ref(false)
const toastMsg = ref('')
const previewVisible = ref(false)
let toastTimer: number | undefined

/** 预览里的示例文档结构（按选中模板的实体/关系类型拼出可读的文档骨架） */
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
    `… 共 ${t.doc} 篇示例文档`,
  ]
})

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

/**
 * 选中模板，并把名称输入框预填为模板名（用户可改）。
 * @param t 模板
 */
function select(t: TemplateItem) {
  selected.value = t
  kbName.value = t.name
}

/**
 * 轻提示。
 * @param msg 文本
 */
function showToast(msg: string) {
  toastMsg.value = msg
  toastShown.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastShown.value = false
  }, 2000)
}

/** 用当前模板创建 */
function onCreate() {
  const name = kbName.value.trim()
  if (name.length < 2 || name.length > 20) {
    showToast('名称需 2-20 个字符')
    return
  }
  emit('create', name)
}
</script>

<style scoped>
/* ============================================================================
 * 全部使用 koi 令牌 --rm-*
 * ========================================================================== */
*{margin:0;padding:0;box-sizing:border-box}

.kb-tpl{
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  background:var(--rm-bg);
  color:var(--rm-text);
  font-size:14px;
  position:relative;
}

/* ===== 顶栏 ===== */
.kb-tpl__bar{
  flex-shrink:0;
  background:var(--rm-bg-overlay);
  border-bottom:1px solid var(--rm-border-light);
  padding:16px 24px;
  display:flex;
  align-items:flex-end;
  gap:20px;
  flex-wrap:wrap;
}
.kb-tpl__head{min-width:0;flex:1}
.kb-tpl__crumb{display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--rm-text-secondary);margin-bottom:6px}
.kb-tpl__crumb-link{color:var(--rm-primary);cursor:pointer}
.kb-tpl__crumb-link:hover{text-decoration:underline}
.kb-tpl__crumb-sep{color:var(--rm-text-disabled)}
.kb-tpl__title{font-size:22px;font-weight:800;letter-spacing:.5px}
.kb-tpl__sub{color:var(--rm-text-secondary);font-size:13px;margin-top:4px}
.kb-tpl__search{
  display:flex;align-items:center;gap:8px;
  background:var(--rm-bg-subtle);
  border:1px solid var(--rm-border-light);
  border-radius:22px;padding:9px 16px;
  width:320px;max-width:100%;flex-shrink:0;
  transition:var(--rm-transition, .2s);
}
.kb-tpl__search:focus-within{border-color:var(--rm-primary);background:var(--rm-bg-overlay)}
.kb-tpl__search svg{width:16px;height:16px;stroke:var(--rm-text-disabled);flex-shrink:0}
.kb-tpl__search input{border:none;background:none;flex:1;min-width:0;font-size:13.5px;color:var(--rm-text);outline:none;font-family:inherit}
.kb-tpl__search input::placeholder{color:var(--rm-text-disabled)}

/* ===== 主体：唯一滚动容器 ===== */
.kb-tpl__body{
  flex:1;
  min-height:0;
  overflow-y:auto;
  overflow-x:hidden;
  padding:20px 24px 24px;
  display:grid;
  grid-template-columns:minmax(0,1fr) 340px;
  gap:20px;
  align-items:start;
  scrollbar-width:thin;
}
.kb-tpl__left{min-width:0;display:flex;flex-direction:column;gap:16px}

/* 分类 chip */
.kb-tpl__chips{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.kb-tpl__chip{
  border:1px solid var(--rm-border);
  background:var(--rm-bg-overlay);
  color:var(--rm-text-secondary);
  font-size:13px;padding:7px 16px;border-radius:18px;
  cursor:pointer;font-family:inherit;white-space:nowrap;
  transition:var(--rm-transition, .15s);
}
.kb-tpl__chip:hover{border-color:var(--rm-primary);color:var(--rm-primary)}
.kb-tpl__chip.on{background:var(--rm-primary);border-color:var(--rm-primary);color:var(--rm-text-white);font-weight:600}
.kb-tpl__to-blank{margin-left:auto;color:var(--rm-primary);font-size:13px;cursor:pointer;flex-shrink:0}
.kb-tpl__to-blank:hover{text-decoration:underline}

/* 卡片网格 */
.kb-tpl__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.kb-tpl-card{
  border:1px solid var(--rm-border-light);
  border-radius:var(--rm-radius-lg, 12px);
  background:var(--rm-bg-overlay);
  overflow:hidden;cursor:pointer;
  display:flex;flex-direction:column;min-width:0;
  transition:var(--rm-transition, .18s);
}
.kb-tpl-card:hover{border-color:var(--rm-primary)}
.kb-tpl-card.on{border-color:var(--rm-primary);box-shadow:0 0 0 1px var(--rm-primary) inset}
.kb-tpl-card__pic{
  position:relative;width:100%;aspect-ratio:400/225;
  background:var(--rm-bg-subtle);
  display:flex;align-items:center;justify-content:center;overflow:hidden;
}
.kb-tpl-card__pic img{width:100%;height:100%;object-fit:cover;display:block}
.kb-tpl-card__pic em{font-size:26px;font-weight:800;color:var(--rm-primary);font-style:normal;letter-spacing:2px}
.kb-tpl-card__badge{
  position:absolute;top:8px;left:8px;
  font-size:11.5px;padding:2px 9px;border-radius:10px;
  color:var(--rm-text-white);font-weight:600;
}
.kb-tpl-card__badge.is-hot{background:var(--rm-warning)}
.kb-tpl-card__badge.is-official{background:var(--rm-primary)}
.kb-tpl-card__badge.is-fresh{background:var(--rm-success)}
.kb-tpl-card__check{
  position:absolute;top:8px;right:8px;
  width:22px;height:22px;border-radius:50%;
  background:var(--rm-primary);
  display:flex;align-items:center;justify-content:center;
}
.kb-tpl-card__check svg{width:13px;height:13px;stroke:var(--rm-text-white);fill:none}
.kb-tpl-card__body{padding:12px 13px 13px;display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.kb-tpl-card__body b{font-size:14px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kb-tpl-card__body p{font-size:12.5px;color:var(--rm-text-secondary);line-height:1.6;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.kb-tpl-card__foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;flex-wrap:wrap}
.kb-tpl-card__count{font-size:11.5px;color:var(--rm-text-disabled)}
.kb-tpl-card__btn{
  border:1px solid var(--rm-primary-light-9);
  background:none;color:var(--rm-primary);
  font-size:12.5px;padding:5px 13px;border-radius:15px;
  cursor:pointer;font-family:inherit;white-space:nowrap;
  transition:var(--rm-transition, .15s);
}
.kb-tpl-card__btn:hover{background:var(--rm-primary);color:var(--rm-text-white)}
.kb-tpl-card__btn.on{background:var(--rm-primary);color:var(--rm-text-white);border-color:var(--rm-primary)}
.kb-tpl__empty{padding:40px 0;text-align:center;color:var(--rm-text-disabled);font-size:13.5px}

/* ===== 右侧详情 ===== */
.kb-tpl__side{
  position:sticky;top:0;
  background:var(--rm-bg-overlay);
  border:1px solid var(--rm-border-light);
  border-radius:var(--rm-radius-lg, 12px);
  padding:16px 16px 18px;
  min-width:0;
  display:flex;flex-direction:column;gap:8px;
}
.kb-tpl__side-hint{color:var(--rm-text-disabled);font-size:13px;line-height:1.8;padding:12px 0}
.kb-tpl-detail__pic{
  width:100%;aspect-ratio:400/200;border-radius:var(--rm-radius, 10px);
  overflow:hidden;background:var(--rm-bg-subtle);
  display:flex;align-items:center;justify-content:center;margin-bottom:4px;
}
.kb-tpl-detail__pic img{width:100%;height:100%;object-fit:cover;display:block}
.kb-tpl-detail__pic em{font-size:28px;font-weight:800;color:var(--rm-primary);font-style:normal;letter-spacing:2px}
.kb-tpl-detail__name{font-size:16.5px;font-weight:800}
.kb-tpl-detail__desc{font-size:12.5px;color:var(--rm-text-secondary);line-height:1.7}
.kb-tpl-detail__sec{font-size:12.5px;color:var(--rm-text-secondary);margin-top:6px;font-weight:500}
.kb-tpl-detail__cells{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.kb-tpl-detail__cell{
  border:1px solid var(--rm-border-light);border-radius:var(--rm-radius, 10px);
  padding:9px 4px;display:flex;flex-direction:column;align-items:center;gap:2px;
}
.kb-tpl-detail__cell b{font-size:14px;font-weight:800}
.kb-tpl-detail__cell span{font-size:11.5px;color:var(--rm-text-secondary)}
.kb-tpl-detail__tags{display:flex;gap:7px;flex-wrap:wrap}
.kb-tpl-detail__tag{
  font-size:11.5px;padding:3px 10px;border-radius:12px;
  background:var(--rm-bg-subtle);color:var(--rm-text-regular);
  border:1px solid var(--rm-border-light);
}
.kb-tpl-detail__meta{font-size:12px;color:var(--rm-text-disabled);margin-top:6px}
.kb-tpl-detail__input{
  width:100%;border:1px solid var(--rm-border);border-radius:var(--rm-radius, 10px);
  padding:9px 12px;font-size:13.5px;color:var(--rm-text);
  background:var(--rm-bg-overlay);outline:none;font-family:inherit;
  transition:var(--rm-transition, .15s);
}
.kb-tpl-detail__input:focus{border-color:var(--rm-primary)}
.kb-tpl-detail__actions{display:flex;gap:9px;flex-wrap:wrap;margin-top:6px}
.kb-tpl-detail__primary{
  flex:1;min-width:130px;
  background:var(--rm-primary);color:var(--rm-text-white);
  border:none;border-radius:20px;padding:10px 16px;
  font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  transition:var(--rm-transition, .15s);
}
.kb-tpl-detail__primary:hover{background:var(--rm-primary-hover)}
.kb-tpl-detail__primary:disabled{opacity:.6;cursor:not-allowed}
.kb-tpl-detail__primary svg{width:15px;height:15px;stroke:currentColor;fill:none}
.kb-tpl-detail__ghost{
  border:1px solid var(--rm-border);background:var(--rm-bg-overlay);
  color:var(--rm-text-regular);border-radius:20px;padding:10px 14px;
  font-size:13.5px;cursor:pointer;font-family:inherit;
  display:inline-flex;align-items:center;justify-content:center;gap:6px;
  transition:var(--rm-transition, .15s);
}
.kb-tpl-detail__ghost:hover{border-color:var(--rm-primary);color:var(--rm-primary)}
.kb-tpl-detail__ghost svg{width:15px;height:15px;stroke:currentColor;fill:none}

/* ===== 底部步骤条 ===== */
.kb-tpl__steps{
  flex-shrink:0;
  border-top:1px solid var(--rm-border-light);
  background:var(--rm-bg-overlay);
  padding:12px 24px;
  display:flex;align-items:center;justify-content:center;gap:12px;
  flex-wrap:wrap;
}
.kb-tpl-step{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--rm-text-secondary)}
.kb-tpl-step i{
  width:20px;height:20px;border-radius:50%;
  background:var(--rm-bg-subtle);color:var(--rm-text-secondary);
  display:flex;align-items:center;justify-content:center;
  font-size:11.5px;font-weight:700;font-style:normal;flex-shrink:0;
}
.kb-tpl-step i svg{width:12px;height:12px;stroke:currentColor;fill:none}
.kb-tpl-step.is-on{color:var(--rm-primary);font-weight:600}
.kb-tpl-step.is-on i{background:var(--rm-primary);color:var(--rm-text-white)}
.kb-tpl-step__line{width:56px;height:1px;background:var(--rm-border-light);flex-shrink:0}

/* 返回图标 */
.kb-tpl__back{
  width:22px;height:22px;border-radius:50%;
  border:1px solid var(--rm-border-light);
  background:var(--rm-bg-overlay);
  display:inline-flex;align-items:center;justify-content:center;
  cursor:pointer;padding:0;
  transition:var(--rm-transition, .15s);
}
.kb-tpl__back:hover{border-color:var(--rm-primary);color:var(--rm-primary)}
.kb-tpl__back svg{width:14px;height:14px;stroke:currentColor;fill:none}

/* ===== 预览效果 ===== */
.kb-tpl-preview{
  position:absolute;inset:0;z-index:30;
  background:color-mix(in srgb, var(--rm-text) 42%, transparent);
  display:flex;align-items:center;justify-content:center;padding:24px;
}
.kb-tpl-preview__box{
  width:560px;max-width:100%;max-height:85%;
  background:var(--rm-bg-overlay);
  border-radius:var(--rm-radius-lg, 12px);
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:var(--rm-shadow-lg, 0 8px 24px rgba(0,0,0,.16));
}
.kb-tpl-preview__head{
  display:flex;align-items:center;justify-content:space-between;gap:12px;
  padding:16px 18px;border-bottom:1px solid var(--rm-border-light);
}
.kb-tpl-preview__head b{font-size:15px;font-weight:800}
.kb-tpl-preview__close{
  width:28px;height:28px;border-radius:50%;border:none;background:none;
  display:flex;align-items:center;justify-content:center;
  color:var(--rm-text-secondary);cursor:pointer;flex-shrink:0;
}
.kb-tpl-preview__close:hover{background:var(--rm-bg-subtle);color:var(--rm-text)}
.kb-tpl-preview__close svg{width:16px;height:16px;stroke:currentColor;fill:none}
.kb-tpl-preview__body{padding:16px 18px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.kb-tpl-preview__sec{font-size:12.5px;color:var(--rm-text-secondary);font-weight:500;margin-top:6px}
.kb-tpl-preview__tags{display:flex;gap:7px;flex-wrap:wrap}
.kb-tpl-preview__tags span{
  font-size:11.5px;padding:3px 10px;border-radius:12px;
  background:var(--rm-bg-subtle);color:var(--rm-text-regular);
  border:1px solid var(--rm-border-light);
}
.kb-tpl-preview__docs{list-style:none;display:flex;flex-direction:column;gap:5px}
.kb-tpl-preview__docs li{
  font-size:12.5px;color:var(--rm-text-regular);
  padding:6px 10px;border-radius:var(--rm-radius-sm, 8px);background:var(--rm-bg-subtle);
}

/* ===== 轻提示 ===== */
.kb-tpl__toast{
  position:absolute;top:16px;left:50%;
  transform:translateX(-50%) translateY(-60px);
  background:var(--rm-text);color:var(--rm-bg-overlay);
  padding:9px 18px;border-radius:20px;font-size:13px;
  box-shadow:var(--rm-shadow-lg, 0 8px 24px rgba(0,0,0,.16));
  transition:var(--rm-transition, .3s);pointer-events:none;z-index:20;
}
.kb-tpl__toast.show{transform:translateX(-50%) translateY(0)}

/* ============================================================================
 * 响应式：>=1600 / 1280 / 1024 / 768 / 480
 * ========================================================================== */
@media (max-width:1600px){
  .kb-tpl__grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .kb-tpl__body{grid-template-columns:minmax(0,1fr) 320px}
}
@media (max-width:1280px){
  .kb-tpl__body{grid-template-columns:minmax(0,1fr)}
  .kb-tpl__side{position:static}
  .kb-tpl__grid{grid-template-columns:repeat(3,minmax(0,1fr))}
}
@media (max-width:1024px){
  .kb-tpl__bar{padding:14px 18px;gap:14px}
  .kb-tpl__search{width:100%}
  .kb-tpl__body{padding:16px 18px 20px}
  .kb-tpl__grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .kb-tpl__steps{padding:10px 18px}
}
@media (max-width:768px){
  .kb-tpl__title{font-size:19px}
  .kb-tpl__grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .kb-tpl__to-blank{margin-left:0}
  .kb-tpl-step__line{width:32px}
}
@media (max-width:480px){
  .kb-tpl__bar{padding:12px 14px}
  .kb-tpl__sub{display:none}
  .kb-tpl__body{padding:12px 14px 16px;gap:14px}
  .kb-tpl__grid{grid-template-columns:minmax(0,1fr)}
  .kb-tpl__chips{gap:7px}
  .kb-tpl__chip{padding:6px 12px;font-size:12.5px}
  .kb-tpl-step span{display:none}
}
</style>
