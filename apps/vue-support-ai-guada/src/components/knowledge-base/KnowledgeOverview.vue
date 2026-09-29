<template>
  <div class="kb-ov">
    <!-- ===================== 顶部栏 ===================== -->
    <header class="kb-ov__top">
      <div class="kb-ov__title">
        <h1>知识库</h1>
        <p>共 {{ total.kb }} 个知识库 · {{ total.file }} 篇文档</p>
      </div>
      <div class="kb-ov__search">
        <el-icon class="kb-ov__search-icon"><Search /></el-icon>
        <input v-model="keyword" type="text" placeholder="搜索知识库、文档、实体" @keyup.enter="onSearch" />
      </div>
      <button type="button" class="kb-ov__new" @click="openModal">
        <el-icon><Plus /></el-icon>
        新建知识库
      </button>
    </header>

    <div class="kb-ov__content">
      <!-- ===================== 统计卡（4 张） ===================== -->
      <section class="kb-ov__stats">
        <div v-for="s in stats" :key="s.key" class="kb-stat">
          <div class="kb-stat__ic">
            <el-icon :size="24"><component :is="s.icon" /></el-icon>
          </div>
          <div class="kb-stat__meta">
            <b>{{ s.value }}</b>
            <span>{{ s.label }}</span>
          </div>
        </div>
      </section>

      <section class="kb-ov__lower">
        <!-- --------------------- 创建面板 --------------------- -->
        <div class="kb-panel kb-create">
          <div class="kb-create__head">
            <h2>开始创建你的第一个知识库</h2>
            <span class="kb-link" @click="onHelp">查看帮助文档</span>
          </div>

          <div class="kb-hero">
            <img :src="heroIllustration" alt="书本与知识节点" />
            <h3>还没有知识库</h3>
            <p>上传文档即可自动提取知识点，生成实体与关系网络</p>
          </div>

          <div class="kb-create__actions">
            <button type="button" class="kb-ca kb-ca--blank" @click="openModal">
              <el-icon :size="40"><Upload /></el-icon>
              <span><b>空白创建</b><i>从上传文档开始</i></span>
            </button>
            <button type="button" class="kb-ca kb-ca--tpl" @click="openModal('tpl')">
              <el-icon :size="40"><Files /></el-icon>
              <span><b>从模板创建</b><i>套用预置结构</i></span>
            </button>
          </div>

          <div class="kb-tplhead">
            <b>教育场景模板</b>
            <span class="kb-link" @click="onAllTemplates">全部模板</span>
          </div>

          <div class="kb-tplgrid">
            <div v-for="t in templates" :key="t.key" class="kb-tplcard">
              <img class="kb-tplcard__pic" :src="t.cover" :alt="t.name" />
              <div class="kb-tplcard__body">
                <b>{{ t.name }}</b>
                <div class="kb-tplcard__foot">
                  <span>{{ t.entity }} 实体 · {{ t.relation }} 关系</span>
                  <button type="button" class="kb-btn-use" @click="useTemplate(t)">
                    {{ activeTpl === t.name ? '已选模板' : '使用模板' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- --------------------- 最近活动 --------------------- -->
        <aside class="kb-panel kb-activity">
          <h2>最近活动</h2>
          <div v-if="activities.length === 0" class="kb-activity__empty">
            <el-icon :size="88"><Files /></el-icon>
            <p>暂无活动，创建知识库、上传文档或生成图谱后会出现在这里</p>
          </div>
          <ul v-else class="kb-activity__list">
            <li v-for="a in activities" :key="a.key" class="kb-activity__item">
              <i class="kb-activity__dot" />
              <div>
                <b>{{ a.title }}</b>
                <span>{{ a.desc }} · {{ a.time }}</span>
              </div>
            </li>
          </ul>
          <div class="kb-activity__demo">例如：知识库创建成功</div>
        </aside>
      </section>
    </div>

    <!-- ===================== 新建知识库弹窗（宿主改用仓库标准 ReDialog） ===================== -->
    <ReDialog
      v-model="modalVisible"
      title="新建知识库"
      :width="560"
      :close-on-click-modal="false"
    >
      <div class="kb-modal__body">

        <div class="kb-seg">
          <button type="button" :class="{ on: seg === 'blank' }" @click="seg = 'blank'">空白创建</button>
          <button type="button" :class="{ on: seg === 'tpl' }" @click="seg = 'tpl'">从模板创建</button>
        </div>

        <div class="kb-form">
          <div class="kb-fld">
            <label>知识库名称<i>*</i></label>
            <input v-model="form.name" type="text" placeholder="例如：三年级语文上册" />
            <div class="kb-hint">2-20 个字，创建后可在设置中修改</div>
          </div>

          <div class="kb-fld">
            <label>描述</label>
            <textarea v-model="form.description" rows="2" placeholder="简单描述这个知识库的用途，例如收集课文、试卷与知识点" />
          </div>

          <div class="kb-fld">
            <label>可见范围</label>
            <div class="kb-scope kb-scope--two">
              <button
                v-for="s in scopes"
                :key="s.key"
                type="button"
                :class="{ on: form.isPublic === s.value }"
                @click="form.isPublic = s.value"
              >
                <el-icon :size="21"><component :is="s.icon" /></el-icon>
                <span>{{ s.label }}<br />{{ s.hint }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      <template #footer="{ cancel }">
        <div class="kb-modal__foot">
          <span class="kb-link" @click="seg = 'tpl'">需要预置结构？从模板创建</span>
          <div class="kb-modal__btns">
            <button type="button" class="kb-btn-ghost" @click="cancel">取消</button>
            <button type="button" class="kb-btn-primary" @click="submit">创建知识库</button>
          </div>
        </div>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识库总览（按设计稿 HTML 还原）。
 *
 * <p><b>只做内容区</b>：设计稿里的左侧导航与顶栏由系统 layout 提供，这里不重复实现，
 * 否则会出现两套导航。其余（统计卡、创建面板、教育场景模板、最近活动、新建弹窗）按稿还原。</p>
 *
 * <p><b>颜色全部走 Element / koi 变量</b>：设计稿里的
 * {@code --primary / --t1 / --card / --line / --radius} 等一次性变量已映射为
 * {@code --el-color-primary}、{@code --el-text-color-*}、{@code --el-bg-color-overlay}、
 * {@code --el-border-color-lighter}、{@code --el-radius-lg}，随主题与暗色自动切换。</p>
 *
 * <p><b>图片为本地资源</b>：设计稿的远程图已下载到 {@code src/assets/kb/} 后引用，
 * 运行期不外链。没有素材的模板回退到占位（由父组件提供的清单决定）。</p>
 *
 * <p><b>弹窗里的 图标 / 主题色 / 可见范围 后端暂未落库</b>（{@code sys_ai_knowledge_base}
 * 只有 {@code isPublic} 可对应）。当前只收集展示，提交时只把名称/描述/可见性交给父组件，
 * 不假装这些字段已持久化。</p>
 */
import ReDialog from '@repo/ui/re-dialog'
import {
  Search, Plus, Files, Upload, FolderOpened, Document, Connection,
  Lock, Share,
} from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import type { Component } from 'vue'
import heroIllustration from '@/assets/kb/kb-empty-hero.png'

/** 一条最近活动 */
interface ActivityItem {
  key: string
  title: string
  desc: string
  time: string
}

/** 一个模板卡 */
interface TemplateCard {
  key: string
  name: string
  cover: string
  entity: number
  relation: number
}

const props = withDefaults(defineProps<{
  /** 统计：知识库数量 */
  kbCount?: number
  /** 统计：文档总量 */
  fileCount?: number
  /** 统计：实体节点 */
  entityCount?: number
  /** 统计：关系连线 */
  relationCount?: number
  /** 最近活动（无数据时展示空态） */
  activities?: ActivityItem[]
  /** 模板清单（封面由父组件给出本地资源地址） */
  templates?: TemplateCard[]
}>(), {
  kbCount: 0,
  fileCount: 0,
  entityCount: 0,
  relationCount: 0,
  activities: () => [],
  templates: () => [],
})

const emit = defineEmits<{
  /** 提交新建：只带后端真实支持的字段 */
  (e: 'create', payload: { name: string; description: string; isPublic: boolean }): void
  /** 打开帮助文档 */
  (e: 'help'): void
  /** 查看全部模板 */
  (e: 'all-templates'): void
  /** 搜索 */
  (e: 'search', keyword: string): void
}>()

const keyword = ref('')
const modalVisible = ref(false)
const seg = ref<'blank' | 'tpl'>('blank')
const activeTpl = ref('')

/** 弹窗表单：只保留后端真实支持的字段（名称 / 描述 / 是否公开）。
    图标、主题色、高级开关等后端没有对应列，按「没有就不放上去」从界面上撤掉。 */
const form = reactive({
  name: '',
  description: '',
  isPublic: false,
})

/** 统计卡：数字与标签，图标对应设计稿里的文件夹/文档/节点/连线 */
const stats = computed<Array<{ key: string; icon: Component; value: number; label: string }>>(() => [
  { key: 'kb', icon: FolderOpened, value: props.kbCount, label: '知识库' },
  { key: 'file', icon: Document, value: props.fileCount, label: '文档总量' },
  { key: 'entity', icon: Share, value: props.entityCount, label: '实体节点' },
  { key: 'relation', icon: Connection, value: props.relationCount, label: '关系连线' },
])

const total = computed(() => ({ kb: props.kbCount, file: props.fileCount }))

/**
 * 可见范围：只保留后端支持的两种（`isPublic` 布尔）。
 * 设计稿里的「团队」没有对应列，按「没有就不放上去」不实现。
 */
const scopes: ReadonlyArray<{ key: string; icon: Component; label: string; hint: string; value: boolean }> = [
  { key: 'private', icon: Lock, label: '私有', hint: '仅自己可见', value: false },
  { key: 'public', icon: Share, label: '公开', hint: '所有人可见', value: true },
]

function openModal(presetSeg?: 'blank' | 'tpl') {
  seg.value = presetSeg ?? 'blank'
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
}

/** 用模板：选中并预填名称（名称同时是创建入口，与设计稿一致） */
function useTemplate(t: TemplateCard) {
  activeTpl.value = t.name
  form.name = t.name
  seg.value = 'tpl'
  modalVisible.value = true
}

function onHelp() {
  emit('help')
}

function onAllTemplates() {
  emit('all-templates')
}

function onSearch() {
  emit('search', keyword.value.trim())
}

/**
 * 提交新建。
 *
 * <p>只把后端确实支持的字段交出去：名称、描述、可见性。
 * 图标 / 主题色 / 高级开关后端没有对应列，这里不谣传成已保存。</p>
 */
function submit() {
  const name = form.name.trim()
  if (!name) {
    return
  }
  emit('create', {
    name,
    description: form.description.trim(),
    isPublic: form.isPublic,
  })
  closeModal()
}

defineExpose({ openModal })
</script>

<style scoped>
.kb-ov {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ===================== 顶部栏 ===================== */
.kb-ov__top {
  display: flex;
  align-items: center;
  gap: 26px;
  padding: 20px 32px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-ov__title {
  display: flex;
  align-items: baseline;
  gap: 13px;
  flex-shrink: 0;
}

.kb-ov__title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 0.5px;
  color: var(--el-text-color-primary);
}

.kb-ov__title p {
  margin: 0;
  font-size: 13.5px;
  white-space: nowrap;
  color: var(--el-text-color-secondary);
}

/* 设计稿是胶囊搜索框（radius 24）+ 聚焦主色环 */
.kb-ov__search {
  flex: 1;
  max-width: 760px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 10px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  transition: border-color var(--el-transition-duration, 0.2s),
    box-shadow var(--el-transition-duration, 0.2s);
}

.kb-ov__search:focus-within {
  border-color: var(--el-color-primary);
  background: var(--el-bg-color-overlay);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.kb-ov__search-icon {
  font-size: 18px;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.kb-ov__search input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.kb-ov__search input::placeholder {
  color: var(--el-text-color-placeholder);
}

/* 主按钮：胶囊 + 主色渐变 + 主色投影（阴影是层级表达，保留） */
.kb-ov__new {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 11px 22px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(135deg,
      var(--el-color-primary-light-3), var(--el-color-primary-dark-2));
  color: var(--el-color-white);
  font-size: 14.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
  transition: transform var(--el-transition-duration, 0.2s),
    box-shadow var(--el-transition-duration, 0.2s);
}

.kb-ov__new:hover {
  transform: translateY(-1px);
  box-shadow: 0 11px 22px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.kb-ov__content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 26px 32px 40px;
  background: var(--el-bg-color-page);
}

/* ===================== 统计卡 ===================== */
.kb-ov__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.kb-stat {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 96px;
  padding: 20px 22px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.kb-stat__ic {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.kb-stat__meta b {
  display: block;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}

.kb-stat__meta span {
  font-size: 13.5px;
  color: var(--el-text-color-secondary);
}

/* ===================== 下部两栏 ===================== */
.kb-ov__lower {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 330px;
  gap: 20px;
  align-items: start;
}

.kb-panel {
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-light);
}

.kb-link {
  color: var(--el-color-primary);
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
}

.kb-link:hover {
  text-decoration: underline;
}

/* --------------------- 创建面板 --------------------- */
.kb-create {
  padding: 26px 28px 28px;
}

.kb-create__head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 6px;
}

.kb-create__head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.kb-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 0 8px;
}

.kb-hero img {
  width: 300px;
  max-width: 70%;
}

.kb-hero h3 {
  margin: 8px 0 9px;
  font-size: 20px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.kb-hero p {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.kb-create__actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin: 24px 0 28px;
}

.kb-ca {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border: none;
  border-radius: var(--el-radius-lg, 12px);
  text-align: left;
  cursor: pointer;
  transition: transform var(--el-transition-duration, 0.2s);
}

.kb-ca:hover {
  transform: translateY(-2px);
}

.kb-ca b {
  display: block;
  margin-bottom: 3px;
  font-size: 18px;
  font-weight: 800;
}

.kb-ca i {
  font-size: 13px;
  font-style: normal;
  opacity: 0.85;
}

.kb-ca--blank {
  background: linear-gradient(135deg,
      var(--el-color-primary-light-3), var(--el-color-primary-dark-2));
  color: var(--el-color-white);
  box-shadow: 0 12px 26px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

.kb-ca--tpl {
  background: var(--el-bg-color-overlay);
  border: 1.6px solid var(--el-color-primary-light-5);
  color: var(--el-text-color-primary);
}

/* --------------------- 模板区 --------------------- */
.kb-tplhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.kb-tplhead b {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.kb-tplgrid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.kb-tplcard {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
  transition: box-shadow var(--el-transition-duration, 0.2s),
    transform var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.kb-tplcard:hover {
  transform: translateY(-3px);
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.kb-tplcard__pic {
  display: block;
  width: 100%;
  aspect-ratio: 400 / 225;
  object-fit: cover;
}

.kb-tplcard__body {
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  padding: 12px 13px 14px;
}

.kb-tplcard__body b {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.kb-tplcard__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.kb-tplcard__foot span {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.kb-btn-use {
  padding: 5px 12px;
  border: 1.3px solid var(--el-color-primary-light-5);
  border-radius: var(--el-radius-full, 9999px);
  background: none;
  color: var(--el-color-primary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s),
    color var(--el-transition-duration, 0.2s);
}

.kb-btn-use:hover {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}

/* --------------------- 最近活动 --------------------- */
.kb-activity {
  padding: 22px 24px 26px;
}

.kb-activity h2 {
  margin: 0 0 18px;
  font-size: 17px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.kb-activity__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 14px 0;
  color: var(--el-border-color);
}

.kb-activity__empty p {
  margin: 16px 0 0;
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.kb-activity__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.kb-activity__item {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 9px 0;
}

.kb-activity__item b {
  display: block;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.kb-activity__item span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-activity__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

/* 设计稿底部的虚线示例行 */
.kb-activity__demo {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1.5px dashed var(--el-border-color-lighter);
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* ===================== 弹窗 ===================== */
.kb-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: color-mix(in srgb, var(--el-text-color-primary) 42%, transparent);
}

.kb-overlay.is-show {
  display: flex;
}

.kb-modal {
  width: 560px;
  max-width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color-overlay);
  box-shadow: var(--el-box-shadow-dark);
}

.kb-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 26px 16px;
}

.kb-modal__head b {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 19px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}

.kb-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}

.kb-modal__close:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.kb-seg {
  display: flex;
  margin: 0 26px 18px;
  padding: 4px;
  border-radius: var(--el-radius-base);
  background: var(--el-fill-color-light);
}

.kb-seg button {
  flex: 1;
  padding: 9px;
  border: none;
  border-radius: var(--el-radius-small, 4px);
  background: none;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.kb-seg button.on {
  background: var(--el-bg-color-overlay);
  color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-lighter);
}

.kb-form {
  display: flex;
  flex-direction: column;
  gap: 17px;
  padding: 0 26px 24px;
}

.kb-fld label {
  display: block;
  margin-bottom: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.kb-fld label i {
  margin-left: 3px;
  font-style: normal;
  color: var(--el-color-danger);
}

.kb-fld input,
.kb-fld textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 14px;
  border: 1.4px solid var(--el-border-color);
  border-radius: var(--el-radius-base);
  background: var(--el-bg-color-overlay);
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-family: inherit;
  outline: none;
  resize: none;
  transition: border-color var(--el-transition-duration, 0.2s),
    box-shadow var(--el-transition-duration, 0.2s);
}

.kb-fld input:focus,
.kb-fld textarea:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.kb-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.kb-iconpick {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
}

.kb-iconpick button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: var(--el-radius-base);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
}

.kb-iconpick button.on {
  background: linear-gradient(135deg,
      var(--el-color-primary-light-3), var(--el-color-primary-dark-2));
  color: var(--el-color-white);
}

.kb-colorpick {
  display: flex;
  gap: 11px;
}

.kb-colorpick button {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  position: relative;
  cursor: pointer;
}

.kb-colorpick button.on::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid currentColor;
  border-radius: 50%;
}

.kb-scope {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 11px;
}

/* 只剩私有/公开两项时用两列，避免出现空列 */
.kb-scope--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.kb-scope button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 13px 8px;
  border: 1.4px solid var(--el-border-color);
  border-radius: var(--el-radius-base);
  background: none;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
  text-align: center;
  cursor: pointer;
}

.kb-scope button.on {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.kb-switches {
  display: flex;
  flex-direction: column;
  gap: 13px;
}

.kb-switchrow {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-secondary);
}

.kb-switchrow span {
  flex: 1;
  font-size: 13.5px;
  color: var(--el-text-color-primary);
}

.kb-toggle {
  position: relative;
  flex-shrink: 0;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: var(--el-color-primary);
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s);
}

.kb-toggle::after {
  content: '';
  position: absolute;
  top: 3px;
  right: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--el-color-white);
  transition: right var(--el-transition-duration, 0.2s);
}

.kb-toggle.off {
  background: var(--el-border-color);
}

.kb-toggle.off::after {
  right: 21px;
}

/* ReDialog 提供弹窗外壳（遮罩/标题/关闭/拖拽/全屏），这里只负责内容与底栏 */
.kb-modal__body {
  padding: 0 26px 4px;
}

.kb-modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 26px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.kb-modal__btns {
  display: flex;
  gap: 11px;
}

.kb-btn-ghost {
  padding: 10px 22px;
  border: 1.4px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  background: none;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  cursor: pointer;
}

.kb-btn-primary {
  padding: 10px 24px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: linear-gradient(135deg,
      var(--el-color-primary-light-3), var(--el-color-primary-dark-2));
  color: var(--el-color-white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 15px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}

/* ===================== 响应式（照设计稿断点） ===================== */
@media (max-width: 1100px) {
  .kb-ov__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kb-ov__lower {
    grid-template-columns: minmax(0, 1fr);
  }

  .kb-tplgrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .kb-ov__top {
    flex-wrap: wrap;
    padding: 16px 18px;
    gap: 14px;
  }

  .kb-ov__content {
    padding: 18px;
  }

  .kb-create__actions,
  .kb-tplgrid {
    grid-template-columns: minmax(0, 1fr);
  }

  .kb-scope {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
