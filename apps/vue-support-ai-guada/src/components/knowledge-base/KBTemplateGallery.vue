<template>
  <div class="kb-tpl-page">
    <!-- 面包屑 + 标题行 -->
    <div class="kb-tpl-page__head">
      <div class="kb-tpl-page__title">
        <div class="kb-tpl-page__crumb">
          <el-button link class="kb-tpl-page__back" @click="$emit('cancel')">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <span>知识库</span>
          <span class="kb-tpl-page__sep">/</span>
          <span>新建知识库</span>
        </div>
        <div class="kb-tpl-page__lead">
          <h1>从模板创建</h1>
          <p>选择预置模板，自动生成实体类型、关系结构与示例文档</p>
        </div>
      </div>
      <el-input v-model="keyword" class="kb-tpl-page__search" clearable placeholder="搜索模板名称、关键词">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
    </div>

    <!-- 分类行 -->
    <div class="kb-tpl-page__cats">
      <button
        v-for="c in categories"
        :key="c"
        type="button"
        class="kb-tpl-cat"
        :class="{ 'is-active': c === activeCategory }"
        @click="activeCategory = c"
      >{{ c }}</button>
      <a class="kb-tpl-page__blank" href="javascript:void(0)" @click="$emit('cancel')">改为空白创建</a>
    </div>

    <!-- 主体：左网格 + 右详情 -->
    <div class="kb-tpl-page__body">
      <div class="kb-tpl-page__grid">
        <article
          v-for="tpl in filtered"
          :key="tpl.key"
          class="kb-tpl-card"
          :class="{ 'is-selected': tpl.key === selectedKey }"
          @click="selectedKey = tpl.key"
        >
          <div class="kb-tpl-card__cover" :class="'kb-tpl-card__cover--' + tpl.key">
            <span class="kb-tpl-card__cover-text">{{ tpl.name }}</span>
            <span v-if="tpl.badge" class="kb-tpl-card__badge" :class="'kb-tpl-card__badge--' + tpl.badge">{{ tpl.badge }}</span>
            <el-icon v-if="tpl.key === selectedKey" class="kb-tpl-card__check"><CircleCheckFilled /></el-icon>
          </div>

          <div class="kb-tpl-card__body">
            <h3 class="kb-tpl-card__name truncate">{{ tpl.name }}</h3>
            <p class="kb-tpl-card__desc line-clamp-2">{{ tpl.description }}</p>
            <p class="kb-tpl-card__meta">{{ tpl.structure }}</p>

            <div class="kb-tpl-card__actions">
              <el-button
                size="small"
                class="kb-tpl-card__use"
                :type="tpl.key === selectedKey ? 'primary' : 'default'"
                @click.stop="selectedKey = tpl.key"
              >{{ tpl.key === selectedKey ? '已选模板' : '使用模板' }}</el-button>
              <el-button size="small" class="kb-tpl-card__preview" @click.stop="selectedKey = tpl.key">使用模板</el-button>
            </div>
          </div>
        </article>
      </div>

      <!-- 右：模板详情 -->
      <aside v-if="current" class="kb-tpl-detail re-surface">
        <div class="kb-tpl-detail__cover" :class="'kb-tpl-card__cover--' + current.key">
          <span class="kb-tpl-card__cover-text">{{ current.name }}</span>
        </div>

        <h2 class="kb-tpl-detail__name">{{ current.name }}</h2>
        <p class="kb-tpl-detail__desc">{{ current.detail }}</p>

        <h4 class="kb-tpl-detail__section">模板包含</h4>
        <div class="kb-tpl-detail__stats">
          <div class="kb-tpl-detail__stat"><b>{{ current.entityKinds.length }}</b><span>类实体</span></div>
          <div class="kb-tpl-detail__stat"><b>{{ current.relationKinds.length }}</b><span>类关系</span></div>
          <div class="kb-tpl-detail__stat"><b>{{ current.sampleDocs }}</b><span>篇文档</span></div>
        </div>

        <h4 class="kb-tpl-detail__section">预置实体类型</h4>
        <div class="kb-tpl-detail__tags">
          <span v-for="t in current.entityKinds" :key="t" class="kb-tpl-detail__tag">{{ t }}</span>
        </div>

        <h4 class="kb-tpl-detail__section">预置关系类型</h4>
        <div class="kb-tpl-detail__tags">
          <span v-for="t in current.relationKinds" :key="t" class="kb-tpl-detail__tag">{{ t }}</span>
        </div>

        <p class="kb-tpl-detail__note">{{ current.note }}</p>

        <label class="kb-tpl-detail__label">知识库名称</label>
        <el-input v-model="kbName" class="kb-tpl-detail__input" />

        <div class="kb-tpl-detail__actions">
          <el-button type="primary" class="kb-tpl-detail__create" @click="handleCreate">
            <template #icon><CircleCheckFilled /></template>
            使用此模板创建
          </el-button>
          <el-button class="kb-tpl-detail__preview">
            <template #icon><View /></template>
            预览效果
          </el-button>
        </div>
      </aside>
    </div>

    <!-- 步骤条 -->
    <div class="kb-tpl-steps">
      <div class="kb-tpl-step is-done"><i>1</i><span>选择模板</span></div>
      <div class="kb-tpl-step__line" />
      <div class="kb-tpl-step"><i>2</i><span>填写信息</span></div>
      <div class="kb-tpl-step__line" />
      <div class="kb-tpl-step"><i>3</i><span>创建完成</span></div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 从模板创建知识库。
 *
 * <p><b>数据说明（重要）：</b>后端目前<b>没有知识库模板接口</b>
 * （{@code sys_ai_template} 只服务 Agent，知识库侧无模板 API），
 * 因此本页的模板清单、预置实体/关系类型、示例文档数均为<b>前端静态清单</b>，
 * 用于把交互流程与版式落地。设计图上每张卡的「84 实体 · 196 关系 · 32 篇文档」
 * 是示意图填充值，这里不照抄（没有数据支撑），改标为「预置结构」。
 * 后端出模板接口后，把 {@code templates} 换成接口数据即可，模板无需重构。</p>
 *
 * <p><b>封面说明：</b>设计图用的是插画素材，仓库里没有对应资源，
 * 因此封面统一用主色渐变色块 + 名称，不引入外部图片。</p>
 *
 * <p>颜色与圆角全部走 Element / koi 变量。</p>
 */
import { computed, ref, watch } from 'vue'
import { ArrowLeft, Search, CircleCheckFilled, View } from '@element-plus/icons-vue'

interface TemplateItem {
  key: string
  name: string
  category: string
  badge?: string
  description: string
  detail: string
  structure: string
  entityKinds: string[]
  relationKinds: string[]
  sampleDocs: number
  note: string
}

const props = defineProps<{
  /** 创建成功时把名字回传给父组件；父组件负责真正的建库请求 */
  creating?: boolean
}>()

const emit = defineEmits<{
  /** 取消，回到列表 */
  (e: 'cancel'): void
  /** 用该模板名创建知识库 */
  (e: 'create', name: string): void
}>()

const categories: ReadonlyArray<string> = [
  '全部模板', '文学经典', '语文学习', '题库考试', '科学百科', '历史人文', '德育素养',
]

/** 静态模板清单（后端无接口，见文件头说明） */
const templates: ReadonlyArray<TemplateItem> = [
  {
    key: 'sanguo',
    name: '三国演义知识图谱',
    category: '文学经典',
    badge: '热门',
    description: '预置人物、势力、战役生成实体与从属、敌对、联姻等关系',
    detail: '预置人物、势力、战役三类实体与从属、敌对、联姻等关系，含示例文档',
    structure: '预置：人物 · 势力 · 战役',
    entityKinds: ['人物', '势力', '战役', '地点'],
    relationKinds: ['从属', '敌对', '联姻', '结义'],
    sampleDocs: 6,
    note: '本模板对应的示例知识库已在本环境创建，可直接查看效果',
  },
  {
    key: 'poem',
    name: '古诗词库',
    category: '文学经典',
    badge: '官方',
    description: '预置朝代、作者、名句三类实体与创作、收录等关系',
    detail: '按朝代与作者组织诗词，支持名句检索与出处溯源',
    structure: '预置：朝代 · 作者 · 名句',
    entityKinds: ['朝代', '作者', '诗题', '名句'],
    relationKinds: ['创作', '收录', '化用'],
    sampleDocs: 5,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'idiom',
    name: '成语典故库',
    category: '语文学习',
    badge: '热门',
    description: '预置成语、释义、出处实体与近义、反义、典故关系',
    detail: '成语释义与典故出处成网，便于按语义检索与关联学习',
    structure: '预置：成语 · 释义 · 出处',
    entityKinds: ['成语', '释义', '出处', '人物'],
    relationKinds: ['近义', '反义', '典故', '出自'],
    sampleDocs: 4,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'question',
    name: '题库知识库',
    category: '题库考试',
    badge: '新课',
    description: '预置考点、题型、难度实体与考查、包含关系',
    detail: '按考点与题型组织题目，支持按难度与考点检索',
    structure: '预置：考点 · 题型 · 难度',
    entityKinds: ['考点', '题型', '难度', '知识点'],
    relationKinds: ['考查', '包含', '前置'],
    sampleDocs: 8,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'insect',
    name: '昆虫百科',
    category: '科学百科',
    badge: '官方',
    description: '预置目、科、种实体与分类、食性、分布关系',
    detail: '按生物分类学组织昆虫条目，支持按目科与食性检索',
    structure: '预置：目 · 科 · 种',
    entityKinds: ['目', '科', '种', '习性'],
    relationKinds: ['分类', '食性', '分布'],
    sampleDocs: 6,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'hanzi',
    name: '汉字学习库',
    category: '语文学习',
    badge: '官方',
    description: '预置部首、笔画、字义实体与组成、形近关系',
    detail: '按部首与笔画组织汉字，支持形近字与同音字关联',
    structure: '预置：部首 · 笔画 · 字义',
    entityKinds: ['部首', '笔画', '字义', '结构'],
    relationKinds: ['组成', '形近', '同音'],
    sampleDocs: 5,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'essay',
    name: '作文素材库',
    category: '语文学习',
    badge: '新课',
    description: '预置主题、素材、适用文体实体与支撑、适配关系',
    detail: '按主题聚合素材，标注适用文体与立意方向',
    structure: '预置：主题 · 素材 · 文体',
    entityKinds: ['主题', '素材', '文体', '立意'],
    relationKinds: ['支撑', '适配', '同类'],
    sampleDocs: 6,
    note: '静态清单，后端暂无模板接口',
  },
  {
    key: 'quote',
    name: '名人名言库',
    category: '德育素养',
    badge: '新课',
    description: '预置人物、名言、主题实体与出自、论述关系',
    detail: '按人物与主题组织名言，支持场景化引用',
    structure: '预置：人物 · 名言 · 主题',
    entityKinds: ['人物', '名言', '主题', '出处'],
    relationKinds: ['出自', '论述', '同类'],
    sampleDocs: 4,
    note: '静态清单，后端暂无模板接口',
  },
]

const keyword = ref('')
const activeCategory = ref('全部模板')
const selectedKey = ref('sanguo')

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return templates.filter((t) => {
    if (activeCategory.value !== '全部模板' && t.category !== activeCategory.value) {
      return false
    }
    if (!kw) {
      return true
    }
    return (t.name + t.description + t.detail).toLowerCase().includes(kw)
  })
})

const current = computed(
  () => templates.find((t) => t.key === selectedKey.value) ?? templates[0],
)

const kbName = ref(current.value.name)

// 切换模板时同步默认知识库名，避免右侧输入框与选中模板对不上
watch(selectedKey, () => {
  kbName.value = current.value.name
})

/**
 * 触发创建。真正的建库请求由父组件发起（它已有建库流程与提示）。
 *
 * <p>模板的「预置结构」当前不会真正落地：后端无模板接口，建出来的库是空的。
 * 这一点在交付说明里已注明，不在这里假装成功。</p>
 */
function handleCreate() {
  emit('create', kbName.value.trim() || current.value.name)
}
</script>

<style scoped>
.kb-tpl-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ── 头部 ─────────────────────────────────────────────── */
.kb-tpl-page__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0 14px;
}

.kb-tpl-page__crumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.kb-tpl-page__back {
  padding: 0;
}

.kb-tpl-page__sep {
  color: var(--el-border-color);
}

.kb-tpl-page__lead {
  margin-top: 8px;
}

.kb-tpl-page__lead h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.kb-tpl-page__lead p {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.kb-tpl-page__search {
  flex: 0 0 320px;
  max-width: 320px;
  margin-top: 6px;
}

/* ── 分类 ─────────────────────────────────────────────── */
.kb-tpl-page__cats {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-tpl-cat {
  padding: 6px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

.kb-tpl-cat:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}

.kb-tpl-cat.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.kb-tpl-page__blank {
  margin-left: auto;
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
}

.kb-tpl-page__blank:hover {
  text-decoration: underline;
}

/* ── 主体 ─────────────────────────────────────────────── */
.kb-tpl-page__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 14px;
  padding: 14px 0;
  overflow: auto;
}

.kb-tpl-page__grid {
  flex: 1;
  min-width: 0;
  align-self: flex-start;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 1280px) {
  .kb-tpl-page__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.kb-tpl-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s);
}

.kb-tpl-card:hover {
  border-color: var(--el-color-primary-light-5);
}

/* 选中态：主色描边（设计图里选中卡是青色边框 + 右上勾） */
.kb-tpl-card.is-selected {
  border-color: var(--el-color-primary);
}

.kb-tpl-card__cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 118px;
}

/* 封面用主色各色阶渐变区分（无插画素材，不引外部图片） */
.kb-tpl-card__cover--sanguo,
.kb-tpl-detail__cover.kb-tpl-card__cover--sanguo {
  background: linear-gradient(135deg, var(--el-color-warning-light-8), var(--el-color-warning-light-9));
}

.kb-tpl-card__cover--poem,
.kb-tpl-detail__cover.kb-tpl-card__cover--poem {
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
}

.kb-tpl-card__cover--idiom,
.kb-tpl-detail__cover.kb-tpl-card__cover--idiom {
  background: linear-gradient(135deg, var(--el-color-success-light-8), var(--el-color-success-light-9));
}

.kb-tpl-card__cover--question,
.kb-tpl-detail__cover.kb-tpl-card__cover--question {
  background: linear-gradient(135deg, var(--el-color-danger-light-8), var(--el-color-danger-light-9));
}

.kb-tpl-card__cover--insect,
.kb-tpl-detail__cover.kb-tpl-card__cover--insect {
  background: linear-gradient(135deg, var(--el-color-info-light-8), var(--el-color-info-light-9));
}

.kb-tpl-card__cover--hanzi,
.kb-tpl-detail__cover.kb-tpl-card__cover--hanzi {
  background: linear-gradient(135deg, var(--el-fill-color), var(--el-fill-color-light));
}

.kb-tpl-card__cover--essay,
.kb-tpl-detail__cover.kb-tpl-card__cover--essay {
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-info-light-8));
}

.kb-tpl-card__cover--quote,
.kb-tpl-detail__cover.kb-tpl-card__cover--quote {
  background: linear-gradient(135deg, var(--el-color-success-light-9), var(--el-color-warning-light-8));
}

.kb-tpl-card__cover-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  opacity: 0.7;
}

.kb-tpl-card__badge {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 1px 8px;
  border-radius: var(--el-border-radius-small, 4px);
  font-size: 12px;
  color: var(--el-color-white);
}

.kb-tpl-card__badge--热门 {
  background: var(--el-color-warning);
}

.kb-tpl-card__badge--官方 {
  background: var(--el-color-primary);
}

.kb-tpl-card__badge--新课 {
  background: var(--el-color-success);
}

.kb-tpl-card__check {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 20px;
  color: var(--el-color-primary);
}

.kb-tpl-card__body {
  padding: 12px 14px 14px;
}

.kb-tpl-card__name {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-tpl-card__desc {
  margin: 5px 0 0;
  min-height: 2.4em;
  font-size: 12.5px;
  line-height: 1.2em;
  color: var(--el-text-color-secondary);
}

.kb-tpl-card__meta {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.kb-tpl-card__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.kb-tpl-card__use,
.kb-tpl-card__preview {
  flex: 1;
  --el-button-hover-bg-color: var(--el-color-primary-light-9);
}

.kb-tpl-card__preview {
  --el-button-text-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary-light-5);
}

/* ── 右侧详情 ─────────────────────────────────────────── */
.kb-tpl-detail {
  flex: 0 0 300px;
  width: 300px;
  align-self: flex-start;
  padding: 0 0 16px;
}

.kb-tpl-detail__cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 108px;
}

.kb-tpl-detail__name {
  margin: 14px 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-tpl-detail__desc {
  margin: 6px 16px 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.kb-tpl-detail__section {
  margin: 16px 16px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-tpl-detail__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 8px 16px 0;
}

.kb-tpl-detail__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 4px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-light);
}

.kb-tpl-detail__stat b {
  font-size: 16px;
  color: var(--el-text-color-primary);
}

.kb-tpl-detail__stat span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-tpl-detail__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 16px 0;
}

.kb-tpl-detail__tag {
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
}

.kb-tpl-detail__note {
  margin: 14px 16px 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}

.kb-tpl-detail__label {
  display: block;
  margin: 16px 16px 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.kb-tpl-detail__input {
  width: calc(100% - 32px);
  margin: 0 16px;
}

.kb-tpl-detail__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 16px 0;
}

.kb-tpl-detail__create {
  flex: 1;
}

/* ── 步骤条 ───────────────────────────────────────────── */
.kb-tpl-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 14px 0 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.kb-tpl-step {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.kb-tpl-step i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-style: normal;
}

.kb-tpl-step.is-done {
  color: var(--el-color-primary);
  font-weight: 500;
}

.kb-tpl-step.is-done i {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.kb-tpl-step__line {
  width: 96px;
  height: 1px;
  background: var(--el-border-color-lighter);
}
</style>
