<template>
  <div class="app">
    <main class="main">
      <!-- ===== 顶栏（固定，不随内容滚动） ===== -->
      <!-- 顶栏已移除（与系统顶栏重复，且「新建」在下方已有）：
           标题与统计走上方系统顶栏 + 统计卡；搜索框随顶栏一并移除。 -->

      <!-- ===== 内容区（唯一滚动容器） ===== -->
      <div class="content">
        <section class="stats">
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg></div>
            <div class="stat-meta"><b>{{ kbCount }}</b><span>知识库</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg></div>
            <div class="stat-meta"><b>{{ fileCount }}</b><span>文档总量</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg></div>
            <div class="stat-meta"><b>{{ entityCount }}</b><span>实体节点</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" /></svg></div>
            <div class="stat-meta"><b>{{ relationCount }}</b><span>关系连线</span></div>
          </div>
        </section>

        <section class="lower">
          <div class="lower__main">
            <!-- ===== 独立卡片：我的知识库 ===== -->
            <div v-if="bases.length > 0" class="panel mine">
            <div class="panel-head">
              <h2>我的知识库</h2>
              <!-- 可点击徽章：显示库数量，点开选库进入详情（原顶栏入口移到这里） -->
              <el-popover v-if="bases.length > 0" placement="bottom-start" :width="300" trigger="click">
                <template #reference>
                  <button class="kb-badge">{{ bases.length }}</button>
                </template>
                <div class="kb-pick">
                  <div
                    v-for="kb in bases"
                    :key="kb.id"
                    class="kb-pick__row"
                    @click="emit('open', { id: kb.id })"
                  >
                    <b>{{ kb.name }}</b>
                    <span>{{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}</span>
                  </div>
                </div>
              </el-popover>
            </div>

            <!-- 最近使用的 2 个知识库 -->
            <div v-if="recentBases.length > 0" class="recent">
              <div class="recent__head">最近使用</div>
              <div class="recent__list">
                <button
                  v-for="kb in recentBases"
                  :key="kb.id"
                  class="recent__item"
                  @click="emit('open', { id: kb.id })"
                >
                  <span class="recent__cover">
                    <img v-if="kb.cover" :src="kb.cover" :alt="kb.name" />
                    <em v-else>{{ initialsOf(kb.name) }}</em>
                  </span>
                  <span class="recent__meta">
                    <b>{{ kb.name }}</b>
                    <span>{{ kb.fileCount }} 篇文档 · {{ kb.ready ? '已就绪' : '待索引' }}</span>
                  </span>
                  <span class="recent__go">进入</span>
                </button>
              </div>
            </div>
            </div>

            <!-- ===== 独立卡片：创建引导 ===== -->
            <div class="panel create-panel">
            <div class="panel-head">
              <h2>开始创建你的第一个知识库</h2>
            </div>

            <div class="empty-hero">
              <img :src="heroIllustration" alt="书本与知识节点">
              <h3>{{ bases.length > 0 ? '继续创建新的知识库' : '还没有知识库' }}</h3>
              <p>{{ bases.length > 0 ? '上传文档即可自动提取知识点，生成实体与关系网络' : '上传文档即可自动提取知识点，生成实体与关系网络' }}</p>
            </div>

            <div class="create-actions">
              <button class="ca ca-blank" @click="openModal">
                <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A4 4 0 0 0 7 17h10" /><path d="M12 11v5m-2.5-2.5L12 16l2.5-2.5" /></svg>
                <span><b>空白创建</b><span>从上传文档开始</span></span>
              </button>
              <button class="ca ca-tpl" @click="emit('all-templates')">
                <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>
                <span><b>从模板创建</b><span>套用预置结构</span></span>
              </button>
            </div>

            <div class="tpl-head">
              <b>教育场景模板</b>
              <span class="link-all" @click="emit('all-templates')">全部模板</span>
            </div>
            <div class="tpl-grid">
              <div v-for="t in templates" :key="t.key" class="tpl-card">
                <img class="pic" :src="t.cover" :alt="t.name" />
                <div class="tpl-body">
                  <b>{{ t.name }}</b>
                  <div class="tpl-foot">
                    <span>{{ t.entity }} 实体 · {{ t.relation }} 关系</span>
                    <button class="btn-use" @click="useTemplate(t)">使用模板</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>

          <!-- ===== 右：最近活动（独立卡片） ===== -->
          <aside class="panel activity">
            <h2>最近活动</h2>
            <ul v-if="activities.length > 0" class="act-list">
              <li v-for="a in activities" :key="a.key" class="act-item">
                <b>{{ a.title }}</b>
                <span>{{ a.desc }}</span>
                <em>{{ a.time }}</em>
              </li>
            </ul>
            <div v-else class="act-empty">
              <svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 13h16M10 4v16" /></svg>
              <p>暂无活动，创建知识库、上传文档或生成图谱后会出现在这里</p>
            </div>
            <div class="act-demo">例如：知识库创建成功</div>
          </aside>
        </section>
      </div>
    </main>

    <!-- ===== 新建知识库弹框（外壳 ReDialog，内容同原稿） ===== -->
    <ReDialog v-model="modalVisible" title="新建知识库" :width="560" :close-on-click-modal="false">
      <div class="seg">
        <button :class="{ on: seg === 'blank' }" @click="seg = 'blank'">空白创建</button>
        <button :class="{ on: seg === 'tpl' }" @click="onToTemplate">从模板创建</button>
      </div>

      <div class="form">
        <div class="fld">
          <label>知识库名称<i>*</i></label>
          <input v-model="form.name" type="text" placeholder="例如：三年级语文上册" @keyup.enter="submit" />
          <div class="hint">2-20 个字，创建后可在设置中修改</div>
        </div>

        <div class="fld">
          <label>描述</label>
          <textarea v-model="form.description" rows="2" placeholder="简单描述这个知识库的用途，例如收集课文、试卷与知识点" />
        </div>

        <div class="fld">
          <label>图标</label>
          <div class="icon-pick">
            <button :class="{ on: form.icon === 0 }" @click="form.icon = 0"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" /></svg></button>
            <button :class="{ on: form.icon === 1 }" @click="form.icon = 1"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5z" /><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" /><path d="M22 9v5" /></svg></button>
            <button :class="{ on: form.icon === 2 }" @click="form.icon = 2"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg></button>
            <button :class="{ on: form.icon === 3 }" @click="form.icon = 3"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg></button>
            <button :class="{ on: form.icon === 4 }" @click="form.icon = 4"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 14.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13l3.5-2 3 2 3-2" /><path d="M9 8h5M9 11h3" /></svg></button>
            <button :class="{ on: form.icon === 5 }" @click="form.icon = 5"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg></button>
            <button :class="{ on: form.icon === 6 }" @click="form.icon = 6"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6L20 9.4l-4 4 1 6-5-2.8L7 19.4l1-6-4-4 5.4-.8z" /></svg></button>
            <button :class="{ on: form.icon === 7 }" @click="form.icon = 7"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14c-3 0-6-2-6-5.5C6 5.5 8.5 3 12 3s6 2.5 6 5.5c0 3.5-3 5.5-6 5.5z" /><path d="M9 14c-1 3-1.5 6-3 7 3-.3 5-1.5 6-3 1 1.5 3 2.7 6 3-1.5-1-2-4-3-7" /></svg></button>
          </div>
        </div>

        <div class="fld">
          <label>主题色</label>
          <div class="color-pick">
            <button
              v-for="c in colorChoices"
              :key="c"
              :class="{ on: form.color === c }"
              :style="{ background: c, color: c }"
              @click="form.color = c"
            />
          </div>
        </div>

        <div class="fld">
          <label>可见范围</label>
          <div class="scope">
            <button :class="{ on: form.scope === '私有' }" @click="form.scope = '私有'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>私有<br>仅自己可见</button>
            <button :class="{ on: form.scope === '团队' }" @click="form.scope = '团队'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20a6 6 0 0 0-4-5.6" /></svg>团队<br>成员可见</button>
            <button :class="{ on: form.scope === '公开' }" @click="form.scope = '公开'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 0 0-18" /></svg>公开<br>所有人可见</button>
          </div>
        </div>

        <div class="fld">
          <label>高级配置（默认开启）</label>
          <div class="switches">
            <div class="switch-row">
              <svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
              <span>上传文档后自动提取知识点</span>
              <div class="toggle" :class="{ off: !form.toggles.extract }" @click="form.toggles.extract = !form.toggles.extract"></div>
            </div>
            <div class="switch-row">
              <svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.3" /><circle cx="18" cy="6" r="2.3" /><circle cx="18" cy="18" r="2.3" /><path d="M8 10.8 16 7.2M8 13.2l8 3.8" /></svg>
              <span>自动生成知识图谱</span>
              <div class="toggle" :class="{ off: !form.toggles.graph }" @click="form.toggles.graph = !form.toggles.graph"></div>
            </div>
            <div class="switch-row">
              <svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12z" /><path d="M9.5 10.5h5M9.5 13.5h3" /></svg>
              <span>接入 AI 问答</span>
              <div class="toggle" :class="{ off: !form.toggles.qa }" @click="form.toggles.qa = !form.toggles.qa"></div>
            </div>
          </div>
        </div>
      </div>

      <template #footer="{ cancel }">
        <div class="modal-foot">
          <span class="to-tpl" @click="onToTemplate">需要预置结构？从模板创建</span>
          <div class="btns">
            <button class="btn-ghost" @click="cancel">取消</button>
            <button class="btn-primary" @click="submit">创建知识库</button>
          </div>
        </div>
      </template>
    </ReDialog>

    <div class="toast" :class="{ show: toastShown }">
      <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg><span>{{ toastMsg }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 知识库总览（koi 变量体系 + 响应式 + 内部滚动）。
 *
 * <p><b>布局</b>：.app 撑满父容器；.topbar 固定不滚；.content 是唯一滚动容器
 * （flex:1 + min-height:0 + overflow-y:auto），因此长内容可滚、短内容不出现滚动条。</p>
 *
 * <p><b>样式</b>：全部使用 koi 令牌 --rm-*（--rm-bg / --rm-bg-overlay / --rm-border-light /
 * --rm-text / --rm-text-secondary / --rm-text-disabled / --rm-primary / --rm-primary-hover /
 * --rm-primary-light-9 / --rm-radius* / --rm-shadow-lg / --rm-danger / --rm-success /
 * --rm-bg-subtle），不再直接引用 --color-*、--el-color-* 作为主口径。
 * 变量声明在 :root 上（koi 体系即如此），因此 ReDialog 内容（append-to-body）同样取得到。</p>
 *
 * <p><b>响应式</b>：>=1600 / 1280 / 1024 / 768 / 480 五档，见文末媒体查询。</p>
 *
 * <p><b>数据</b>：本组件不发请求，只渲染 props 并上抛事件（7 props + 7 emits）。</p>
 */
import { computed, reactive, ref } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
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
  /** 描述 */
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

/** 最近使用的 2 个知识库（按文档数降序，稳定可预期；没有 updatedAt 字段可用） */
const recentBases = computed(() =>
  [...props.bases].sort((a, b) => b.fileCount - a.fileCount || a.name.localeCompare(b.name)).slice(0, 2),
)

const keyword = ref('')
const modalVisible = ref(false)
const toastShown = ref(false)
const toastMsg = ref('')
let toastTimer: number | undefined

/** 弹框分段 */
const seg = ref<'blank' | 'tpl'>('blank')

/** 主题色候选（用户可选的颜色值，属数据） */
const colorChoices = ['#12b8c8', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#64748b']

/** 弹框表单 */
const form = reactive({
  name: '',
  description: '',
  icon: 0,
  color: colorChoices[0],
  scope: '团队',
  toggles: { extract: true, graph: true, qa: true } as Record<string, boolean>,
})

/**
 * 弹出提示。
 * @param msg 提示文本
 */
function showToast(msg: string) {
  toastMsg.value = msg
  toastShown.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastShown.value = false
  }, 2200)
}

/** 打开新建弹框并重置表单 */
function openModal() {
  form.name = ''
  form.description = ''
  form.icon = 0
  form.color = colorChoices[0]
  form.scope = '团队'
  form.toggles.extract = true
  form.toggles.graph = true
  form.toggles.qa = true
  seg.value = 'blank'
  modalVisible.value = true
}

/**
 * 取名称首字做占位封面。
 * @param name 知识库名称
 * @returns 首字（最多两个字符）
 */
function initialsOf(name: string): string {
  const s = String(name || '').trim()
  return s ? s.slice(0, 2) : '知'
}

/**
 * 搜索：回车时提示并把关键词交给父页面过滤。
 */
function onSearchEnter() {
  const v = keyword.value.trim()
  if (!v) {
    return
  }
  showToast('搜索：' + v)
  emit('search', v)
}

/**
 * 使用模板。
 * @param t 被选中的模板
 */
function useTemplate(t: TemplateItem) {
  showToast('已选择「' + t.name + '」模板')
  emit('all-templates')
}

/** 底栏跳模板：关弹框并进模板页 */
function onToTemplate() {
  seg.value = 'tpl'
  modalVisible.value = false
  emit('all-templates')
}

/**
 * 提交新建：校验后上抛，建库请求由父页面统一发出。
 */
function submit() {
  const name = form.name.trim()
  if (name.length < 2 || name.length > 20) {
    showToast('名称需 2-20 个字符')
    return
  }
  emit('create', {
    name,
    description: form.description.trim(),
    isPublic: form.scope === '公开',
  })
  modalVisible.value = false
  showToast('知识库「' + name + '」创建中…')
}
</script>

<style scoped>
/* ============================================================================
 * 全部使用 koi 令牌（--rm-*）。变量定义在 :root（koi 体系），故弹框内容同样可用。
 * ========================================================================== */
*{margin:0;padding:0;box-sizing:border-box}

.app{
  height:100%;
  min-height:0;
  display:flex;
  flex-direction:column;
  background:var(--rm-bg);
  color:var(--rm-text);
  font-size:14px;
  -webkit-font-smoothing:antialiased;
}

/* ===== 主区：撑满剩余高度，内部滚动 ===== */
.main{
  flex:1;
  min-height:0;
  min-width:0;
  display:flex;
  flex-direction:column;
}

/* ===== 顶栏（固定） ===== */
.topbar{
  flex-shrink:0;
  background:var(--rm-bg-overlay);
  padding:16px 24px;
  display:flex;
  align-items:center;
  gap:20px;
  border-bottom:1px solid var(--rm-border-light);
}
.page-title{display:flex;align-items:baseline;gap:12px;flex-shrink:0;min-width:0}
.page-title h1{font-size:22px;font-weight:800;letter-spacing:.5px;white-space:nowrap}
.page-title p{color:var(--rm-text-secondary);font-size:13px;white-space:nowrap}
.searchbox{
  flex:1;
  min-width:120px;
  max-width:720px;
  display:flex;
  align-items:center;
  gap:9px;
  background:var(--rm-bg-subtle);
  border:1px solid var(--rm-border-light);
  border-radius:24px;
  padding:9px 16px;
  transition:var(--rm-transition, .2s);
}
.searchbox:focus-within{border-color:var(--rm-border-focus, var(--rm-primary));background:var(--rm-bg-overlay)}
.searchbox svg{width:17px;height:17px;stroke:var(--rm-text-disabled);flex-shrink:0}
.searchbox input{border:none;background:none;flex:1;min-width:0;font-size:14px;color:var(--rm-text);outline:none;font-family:inherit}
.searchbox input::placeholder{color:var(--rm-text-disabled)}
.topbar-actions{display:flex;align-items:center;gap:10px;flex-shrink:0;margin-left:auto}

.btn-new{
  background:var(--rm-primary);
  color:var(--rm-text-white);
  font-weight:600;
  font-size:14px;
  padding:9px 18px;
  border:none;
  border-radius:22px;
  display:inline-flex;
  align-items:center;
  gap:6px;
  cursor:pointer;
  font-family:inherit;
  white-space:nowrap;
  transition:var(--rm-transition, .2s);
}
.btn-new:hover{background:var(--rm-primary-hover)}
.btn-new svg{width:16px;height:16px;stroke:currentColor;fill:none}

.btn-ghost-sm{
  border:1px solid var(--rm-border);
  background:var(--rm-bg-overlay);
  color:var(--rm-text-regular);
  font-size:13.5px;
  padding:8px 16px;
  border-radius:22px;
  display:inline-flex;
  align-items:center;
  gap:6px;
  cursor:pointer;
  font-family:inherit;
  white-space:nowrap;
  transition:var(--rm-transition, .2s);
}
.btn-ghost-sm:hover{border-color:var(--rm-primary);color:var(--rm-primary)}
.btn-ghost-sm svg{width:15px;height:15px;stroke:currentColor;fill:none}

/* 可点击徽章（我的知识库数量） */
.kb-badge{
  flex-shrink:0;
  min-width:22px;height:22px;padding:0 7px;
  border:none;border-radius:11px;
  background:var(--rm-primary);color:var(--rm-text-white);
  font-size:12px;font-weight:700;line-height:22px;
  cursor:pointer;font-family:inherit;
  transition:var(--rm-transition, .15s);
}
.kb-badge:hover{background:var(--rm-primary-hover)}

/* 顶栏下拉里的知识库条目 */
.kb-pick{display:flex;flex-direction:column;gap:2px;max-height:320px;overflow-y:auto}
.kb-pick__row{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border-radius:var(--rm-radius-sm, 8px);cursor:pointer;transition:var(--rm-transition, .15s)}
.kb-pick__row:hover{background:var(--rm-bg-subtle)}
.kb-pick__row b{font-size:13.5px;font-weight:600;color:var(--rm-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kb-pick__row span{font-size:12px;color:var(--rm-text-disabled)}

/* ===== 内容区：唯一滚动容器 ===== */
.content{
  flex:1;
  min-height:0;
  overflow-y:auto;
  overflow-x:hidden;
  padding:20px 24px 28px;
  display:flex;
  flex-direction:column;
  gap:18px;
  scrollbar-width:thin;
}

/* ===== 统计卡 ===== */
.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.stat-card{
  background:var(--rm-bg-overlay);
  border-radius:var(--rm-radius-lg, 12px);
  padding:18px 20px;
  display:flex;
  align-items:center;
  gap:14px;
  min-height:88px;
  min-width:0;
  box-shadow:0 1px 2px rgba(0,0,0,.04);
}
.stat-ic{
  width:44px;height:44px;
  border-radius:var(--rm-radius-md, 10px);
  background:var(--rm-primary-light-9);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
}
.stat-ic svg{width:22px;height:22px;stroke:var(--rm-primary);fill:none}
.stat-meta{min-width:0}
.stat-meta b{font-size:24px;font-weight:800;line-height:1.15;display:block}
.stat-meta span{color:var(--rm-text-secondary);font-size:13px}

/* ===== 下部布局 ===== */
.lower{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}
.lower__main{display:flex;flex-direction:column;gap:18px;min-width:0}
.panel{background:var(--rm-bg-overlay);border-radius:var(--rm-radius-lg, 12px);min-width:0;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.create-panel{padding:20px 22px 22px}
.mine{padding:20px 22px 22px}
.panel-head{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.panel-head h2{font-size:18px;font-weight:800}
.link-doc{color:var(--rm-primary);font-size:13px;font-weight:500;cursor:pointer}
.link-doc:hover{text-decoration:underline}

/* ===== 最近使用（2 个） ===== */
.recent{margin-bottom:16px}
.recent__head{font-size:12.5px;color:var(--rm-text-secondary);margin-bottom:8px}
.recent__list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.recent__item{
  display:flex;align-items:center;gap:11px;
  border:1px solid var(--rm-border-light);
  border-radius:var(--rm-radius-lg, 12px);
  padding:10px 12px;
  background:var(--rm-bg-overlay);
  cursor:pointer;
  font-family:inherit;
  text-align:left;
  min-width:0;
  transition:var(--rm-transition, .18s);
}
.recent__item:hover{border-color:var(--rm-primary);background:var(--rm-bg-subtle)}
.recent__cover{
  width:38px;height:38px;flex-shrink:0;border-radius:var(--rm-radius-md, 10px);
  overflow:hidden;display:flex;align-items:center;justify-content:center;
  background:var(--rm-primary-light-9);color:var(--rm-primary);
  font-size:15px;font-weight:800;font-style:normal;
}
.recent__cover img{width:100%;height:100%;object-fit:cover;display:block}
.recent__meta{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1}
.recent__meta b{font-size:13.5px;font-weight:600;color:var(--rm-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.recent__meta span{font-size:12px;color:var(--rm-text-disabled);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.recent__go{font-size:12.5px;color:var(--rm-primary);flex-shrink:0}

/* ===== 空状态插图 ===== */
.empty-hero{display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 0 6px}
.empty-hero img{width:260px;max-width:60%;height:auto}
.empty-hero h3{font-size:18px;font-weight:800;margin:6px 0 8px}
.empty-hero p{color:var(--rm-text-secondary);font-size:13.5px;max-width:560px}

/* ===== 两个创建入口 ===== */
.create-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin:18px 0 22px}
.ca{
  border-radius:var(--rm-radius-lg, 12px);
  padding:18px 20px;
  display:flex;align-items:center;gap:14px;text-align:left;
  transition:var(--rm-transition, .2s);
  cursor:pointer;font-family:inherit;
  min-width:0;
}
.ca:hover{transform:translateY(-2px)}
.ca svg{width:36px;height:36px;flex-shrink:0}
.ca span{min-width:0}
.ca b{font-size:16.5px;font-weight:800;display:block;margin-bottom:3px}
.ca span span{font-size:12.5px;opacity:.85;display:block}
.ca-blank{background:var(--rm-primary);color:var(--rm-text-white)}
.ca-blank svg{stroke:var(--rm-text-white);fill:none}
.ca-tpl{background:var(--rm-bg-overlay);border:1px solid var(--rm-primary-light-9);color:var(--rm-text)}
.ca-tpl svg{stroke:var(--rm-primary);fill:none}
.ca-tpl span span{color:var(--rm-text-secondary)}

/* ===== 教育场景模板 ===== */
.tpl-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
.tpl-head b{font-size:15px;font-weight:700}
.link-all{color:var(--rm-primary);font-size:13px;cursor:pointer;font-weight:500;flex-shrink:0}
.tpl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.tpl-card{
  border:1px solid var(--rm-border-light);
  border-radius:var(--rm-radius-lg, 12px);
  overflow:hidden;transition:var(--rm-transition, .2s);
  background:var(--rm-bg-overlay);
  display:flex;flex-direction:column;min-width:0;
}
.tpl-card:hover{border-color:var(--rm-primary);background:var(--rm-bg-subtle)}
.tpl-card .pic{width:100%;aspect-ratio:400/225;object-fit:cover;display:block}
.tpl-body{padding:11px 12px 13px;display:flex;flex-direction:column;gap:8px;flex:1;min-width:0}
.tpl-body b{font-size:13.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tpl-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;flex-wrap:wrap}
.tpl-foot span{color:var(--rm-text-disabled);font-size:11.5px}
.btn-use{
  border:1px solid var(--rm-primary-light-9);
  color:var(--rm-primary);
  font-size:12px;padding:4px 11px;border-radius:14px;
  transition:var(--rm-transition, .15s);font-weight:500;
  background:none;cursor:pointer;font-family:inherit;white-space:nowrap;
}
.btn-use:hover{background:var(--rm-primary);color:var(--rm-text-white);border-color:var(--rm-primary)}

/* ===== 最近活动 ===== */
.activity{padding:20px 20px 22px}
.activity h2{font-size:16px;font-weight:800;margin-bottom:14px}
.act-list{list-style:none;display:flex;flex-direction:column;gap:11px}
.act-item{display:flex;flex-direction:column;gap:3px;padding-bottom:10px;border-bottom:1px solid var(--rm-border-light);min-width:0}
.act-item:last-child{border-bottom:none;padding-bottom:0}
.act-item b{font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.act-item span{color:var(--rm-text-secondary);font-size:12.5px}
.act-item em{color:var(--rm-text-disabled);font-size:11.5px;font-style:normal}
.act-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:12px 0}
.act-empty svg{width:78px;height:78px;stroke:var(--rm-border);fill:none;margin-bottom:14px}
.act-empty p{color:var(--rm-text-secondary);font-size:13px;line-height:1.7}
.act-demo{border-top:1px dashed var(--rm-border-light);margin-top:16px;padding-top:14px;text-align:center;color:var(--rm-text-disabled);font-size:12.5px}

/* ============================================================================
 * 弹框内容（外壳 ReDialog）
 * 不覆盖 ReDialog 的 body 内边距 —— 它已给左右对称的边距；本组件只做内部间距，
 * 避免出现「左边贴边、右边被压」的不对称。表单过高由 ReDialog 自身滚动承担。
 * ========================================================================== */
.seg{background:var(--rm-bg-subtle);border-radius:var(--rm-radius, 10px);padding:4px;display:flex;margin-bottom:16px}
.seg button{flex:1;padding:8px;border-radius:var(--rm-radius-sm, 8px);font-size:13.5px;color:var(--rm-text-secondary);font-weight:500;border:none;background:none;cursor:pointer;font-family:inherit}
.seg button.on{background:var(--rm-bg-overlay);color:var(--rm-primary);box-shadow:0 1px 3px rgba(0,0,0,.06)}

.form{display:flex;flex-direction:column;gap:15px}
.fld label{display:block;font-size:12.5px;color:var(--rm-text-secondary);margin-bottom:6px;font-weight:500}
.fld label i{color:var(--rm-danger);font-style:normal;margin-left:3px}
.fld input[type=text],.fld textarea{
  width:100%;border:1px solid var(--rm-border);border-radius:var(--rm-radius, 10px);
  padding:10px 13px;font-size:13.5px;color:var(--rm-text);background:var(--rm-bg-overlay);
  resize:none;transition:var(--rm-transition, .15s);font-family:inherit;outline:none;
}
.fld input:focus,.fld textarea:focus{border-color:var(--rm-primary)}
.hint{color:var(--rm-text-disabled);font-size:11.5px;margin-top:5px}

.icon-pick{display:flex;gap:8px;flex-wrap:wrap}
.icon-pick button{
  width:36px;height:36px;border-radius:var(--rm-radius, 10px);
  background:var(--rm-bg-subtle);display:flex;align-items:center;justify-content:center;
  color:var(--rm-text-secondary);border:none;cursor:pointer;transition:var(--rm-transition, .15s);
}
.icon-pick button svg{width:18px;height:18px;stroke:currentColor;fill:none}
.icon-pick button.on{background:var(--rm-primary);color:var(--rm-text-white)}

.color-pick{display:flex;gap:10px;flex-wrap:wrap}
.color-pick button{width:24px;height:24px;border-radius:50%;position:relative;border:none;cursor:pointer}
.color-pick button.on::after{content:"";position:absolute;inset:-4px;border:2px solid currentColor;border-radius:50%}

.scope{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.scope button{
  border:1px solid var(--rm-border);border-radius:var(--rm-radius, 10px);
  padding:11px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;
  color:var(--rm-text-secondary);font-size:12px;background:none;cursor:pointer;
  font-family:inherit;line-height:1.6;transition:var(--rm-transition, .15s);
}
.scope button svg{width:20px;height:20px;stroke:currentColor;fill:none}
.scope button.on{border-color:var(--rm-primary);color:var(--rm-primary);background:var(--rm-primary-light-9)}

.switches{display:flex;flex-direction:column;gap:12px}
.switch-row{display:flex;align-items:center;gap:11px;color:var(--rm-text-secondary)}
.switch-row svg{width:18px;height:18px;stroke:currentColor;fill:none;flex-shrink:0}
.switch-row span{flex:1;font-size:13px;color:var(--rm-text);min-width:0}
.toggle{width:40px;height:22px;border-radius:11px;background:var(--rm-primary);position:relative;flex-shrink:0;transition:var(--rm-transition, .2s);cursor:pointer}
.toggle::after{content:"";position:absolute;width:17px;height:17px;border-radius:50%;background:var(--rm-text-white);top:2.5px;right:2.5px;transition:var(--rm-transition, .2s)}
.toggle.off{background:var(--rm-border)}
.toggle.off::after{right:20.5px}

.modal-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.modal-foot .to-tpl{color:var(--rm-primary);font-size:12.5px;cursor:pointer}
.modal-foot .btns{display:flex;gap:10px}
.btn-ghost{border:1px solid var(--rm-border);color:var(--rm-text-secondary);padding:8px 20px;border-radius:20px;font-size:13.5px;background:none;cursor:pointer;font-family:inherit;transition:var(--rm-transition, .15s)}
.btn-ghost:hover{border-color:var(--rm-primary);color:var(--rm-primary)}
.btn-primary{background:var(--rm-primary);color:var(--rm-text-white);padding:8px 22px;border:none;border-radius:20px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:var(--rm-transition, .15s)}
.btn-primary:hover{background:var(--rm-primary-hover)}

/* ===== toast ===== */
.toast{
  position:fixed;top:24px;left:50%;
  transform:translateX(-50%) translateY(-80px);
  background:var(--rm-text);color:var(--rm-bg-overlay);
  padding:11px 20px;border-radius:22px;font-size:13px;
  box-shadow:var(--rm-shadow-lg, 0 8px 24px rgba(0,0,0,.16));
  z-index:80;transition:var(--rm-transition, .3s);
  display:flex;align-items:center;gap:8px;max-width:90vw;
}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast svg{width:16px;height:16px;stroke:var(--rm-primary);fill:none;flex-shrink:0}

/* ============================================================================
 * 响应式：五档 —— >=1600 / 1280 / 1024 / 768 / 480
 * ========================================================================== */

/* 1280 - 1600：模板 3 列，右栏收窄 */
@media (max-width:1600px){
  .tpl-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
  .lower{grid-template-columns:minmax(0,1fr) 300px}
}

/* 1024 - 1280：统计 2 列；右栏折到下方 */
@media (max-width:1280px){
  .stats{grid-template-columns:repeat(2,minmax(0,1fr))}
  .lower{grid-template-columns:minmax(0,1fr)}
  .tpl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}

/* 768 - 1024：顶栏换行，标题与操作分行 */
@media (max-width:1024px){
  .topbar{flex-wrap:wrap;padding:14px 18px;gap:12px}
  .page-title{width:100%}
  .searchbox{max-width:none;order:3;width:100%}
  .topbar-actions{order:2;margin-left:auto}
  .content{padding:16px 18px 22px}
}

/* 480 - 768：单列；创建入口与最近使用都堆叠 */
@media (max-width:768px){
  .stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .recent__list{grid-template-columns:minmax(0,1fr)}
  .create-actions{grid-template-columns:minmax(0,1fr)}
  .tpl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .scope{grid-template-columns:minmax(0,1fr)}
  .stat-card{min-height:76px;padding:14px 16px}
  .stat-meta b{font-size:20px}
}

/* < 480：最小屏，全部单列 */
@media (max-width:480px){
  .topbar{padding:12px 14px}
  .page-title h1{font-size:19px}
  .page-title p{display:none}
  .btn-new,.btn-ghost-sm{padding:7px 13px;font-size:13px}
  .content{padding:12px 14px 18px;gap:14px}
  .stats{grid-template-columns:minmax(0,1fr)}
  .tpl-grid{grid-template-columns:minmax(0,1fr)}
  .stat-card{min-height:70px}
  .empty-hero img{max-width:80%}
}
</style>
