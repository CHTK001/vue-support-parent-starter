<!--
  模板设计器（拖拽式设计 + 预览/打印）

  布局：
    - 左上：组件库 / 数据源 标签页（可拖拽元素在此备选）
    - 右：WYSIWYG 编辑区（由 vue-plugin-hiprint 的 PrintTemplate.design 驱动）
    - 中：工具条（撤销/重做/预览/打印/保存/关闭）

  关键点：
    - json 模板描述由 `templateApi.designer()` 拿到，编辑过程中通过 onDataChanged 实时落盘 toDemo
    - 设计器关闭时自动保存
    - 依赖 jquery + vue-plugin-hiprint（皆为 cdn 模式的 UMD 包）
-->
<template>
  <div class="designer">
    <!-- ==================== 顶栏 ==================== -->
    <header class="designer-header">
      <ReButton icon="ArrowLeft" @click="onBack">返回</ReButton>
      <ReInput v-model="templateName" class="designer-title" disabled />
      <div class="designer-actions">
        <ReButton text @click="onUndo" :disabled="!historyUndo">撤销</ReButton>
        <ReButton text @click="onRedo" :disabled="!historyRedo">重做</ReButton>
        <!-- 主题（类 PPT 的主题切换，一键换色/换字） -->
        <ReSelect :data="themeOptions" v-model="selectedThemeId" @change="onThemeChange" placeholder="选主题" class="designer-theme" size="default" />
        <ReButton type="warning" plain @click="onPreview">预览</ReButton>
        <ReButton type="primary" @click="onSave">保存</ReButton>
        <ReButton type="success" plain @click="onPrint" :loading="saving">打印</ReButton>
      </div>
    </header>

    <!-- ==================== 主体 ==================== -->
    <div class="designer-body">
      <!-- 左侧：组件库 / 数据源 -->
      <aside class="designer-left" :class="{ 'is-collapsed': !leftVisible }">
        <div class="designer-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="designer-tab"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 组件库可拖拽元素（由 defaultElementTypeProvider 的 tid 驱动） -->
        <div class="designer-panel" ref="libraryRef">
          <template v-if="activeTab === 'components'">
            <div class="ep-draggable-item" data-tid="text" :title="item.label" v-for="item in componentList" :key="item.tid">
              <div class="ep-draggable-item__label">{{ item.label }}</div>
            </div>
          </template>
          <template v-if="activeTab === 'sources'">
            <div class="ep-draggable-item" data-tid="text" :title="item.label" v-for="item in sourceList" :key="item.tid">
              <div class="ep-draggable-item__label">{{ item.label }}</div>
            </div>
          </template>
        </div>
      </aside>

      <!-- 中间：WYSIWYG 编辑区 -->
      <main class="designer-center" ref="canvasRef">
        <div class="designer-canvas">
          <div :id="tplContainerId" class="hiprint-canvas" ref="tplRef"></div>
        </div>
      </main>

      <!-- 右侧：属性设置（元素的参数面板） -->
      <aside class="designer-right" v-if="settingVisible">
        <div :id="settingContainerId" ref="settingRef"></div>
      </aside>
    </div>

    <!-- ==================== 第三方的打：打印机选择抽屉 ==================== -->
    <ReDrawer
      v-model="printerVisible"
      :title="''"
      size="520"
      :show-window-shell="false"
      :close-on-click-modal="false"
      show-close
    >
      <RePrinter
        mode="selector"
        title="第三方的打"
        :printer="selectedPrinter"
        @print="onPrinterConfirm"
      />
    </ReDrawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 模板设计器：拖拽式设计 + 直接打印。
 *
 * 依赖的 UMD 全局：
 *   - `jquery`（npm 包 jquery 的 default 导出挂载到 window.$ / window.jQuery）
 *   - `hipster`（vue-plugin-hiprint 的 hiprint 对象）
 *   - `defaultElementTypeProvider`（拖拽元素类型生成器）
 *
 * 第三方的打：
 *   - RePrinter（selector 模式）作为弹出抽屉：已接入的打印机列表 + 设为默认
 *   - 有默认打印机时「打印」直接发；没有时打开抽屉选机再发
 * 主题（类 PPT 主题）：
 *   - ReSelect 选主题 → applyTheme 写入设计描述 → 重建画布
 *
 * 注意：设计器既可作为独立的路由页（挂回 `route.params.id`），也可作为
 * 工作区页签的数据（通过 `templateId` prop 传入；离开时通过 `back` event 通知宿主）。
 *
 * @since 4.0.0.70
 */
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import ReDrawer from '@repo/ui/re-drawer'
import RePrinter from '../components/RePrinter.vue'
import $ from 'jquery'
import { hiprint, defaultElementTypeProvider } from 'vue-plugin-hiprint'
import 'vue-plugin-hiprint/dist/print-lock.css'

import { templateApi } from '../api/templateApi'
import type { TemplateDesignerPayload } from '../types/template'
import type { Theme } from '../themes/themes'
import { THEMES, applyTheme } from '../themes/themes'

/** 工作区页签模式：宿主传入的模板 ID（独立路由页时不传） */
const props = defineProps<{
  templateId?: string
}>()

/** 行为通知宿主（置于路由模式时宿主不监听到，页面内自行消化） */
const emit = defineEmits<{
  /** 返回：回到模板详情页签 */
  (e: 'back'): void
  /** 打开预览页签 */
  (e: 'preview'): void
}>()

const route = useRoute()
const router = useRouter()

/** 当前模板 ID（prop 优先，独立路由页挂回 route.params） */
const templateId = computed(() => props.templateId || (route.params.id as string) || '')

/** hiprint 画布容器（随模板隔离，避免多页签时 DOM 冲突） */
const tplContainerId = computed(() => `hiprint-printTemplate-${templateId.value}`)
/** 属性设置容器（随模板隔离） */
const settingContainerId = computed(() => `hiprint-setting-${templateId.value}`)

/** 模板名（只读显示） */
const templateName = ref('')

/** 左侧面板显隐 */
const leftVisible = ref(true)
const settingVisible = ref(true)

// ==================== 第三方的打（打印机） ====================
/** 第三方的打切换开关（RePrinter 选择器抽屉） */
const printerVisible = ref(false)
/** 选中的（或欲用的）打印机名（RePrinter 的 printer 双向） */
const selectedPrinter = ref('')
/** 默认的打印机（后端设的默认 → 前端「打印」不弹抽屉，直接选它） */
const defaultPrinter = ref('')
/** 第三方的打的按键态（按钮 loading） */
const saving = ref(false)

// ==================== 主题（类 PPT 主题） ====================
/** 主题菜单（ReSelect 的选项） */
const themeOptions = computed(() => THEMES.map((t: Theme) => ({ label: t.name, value: t.id })))
/** 当前选中的主题 id（应用后写入设计描述，保存到预览/第三方的打时生效） */
const selectedThemeId = ref(THEMES[0].id)
/** 最近一次应用的主题（画布重建的记号） */
const selectedTheme = ref<Theme | null>(THEMES[0])

/** 活跃标签页 */
const activeTab = ref('components')

const tabs = [
  { key: 'components', label: '模板组件' },
  { key: 'sources', label: '数据源' }
]

/** 左侧组件列表 */
const componentList = ref<{ tid: string; label: string }[]>([
  { tid: 'text', label: '单行文本' },
  { tid: 'longText', label: '多行文本' },
  { tid: 'text2', label: '多段文本' },
  { tid: 'table', label: '表格' },
  { tid: 'barcode', label: '条形码' },
  { tid: 'qrcode', label: '二维码' },
  { tid: 'image', label: '图片' },
  { tid: 'rect', label: '矩形' },
  { tid: 'oval', label: '椭圆' },
  { tid: 'vline', label: '竖线' },
  { tid: 'hline', label: '横线' }
])

/** 数据源列表（虚拟） */
const sourceList = ref<{ tid: string; label: string }[]>([
  { tid: 'text', label: '静态文本' },
  { tid: 'longText', label: '长文本' }
])

/** 撤销/重做（Dep 联动由 hiprint 内部负责，这里只负责开关显隐） */
const historyUndo = ref(false)
const historyRedo = ref(false)

/** hiprint 设计器的内部实例 */
const printTemplate = ref<any>(null)
const tplRef = ref<HTMLDivElement | null>(null)
const libraryRef = ref<HTMLDivElement | null>(null)
const settingRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)

// ==================== 加载模板 ====================
onMounted(async () => {
  const id = templateId.value
  if (!id) {
    ElMessage.error('未指定模板')
    router.replace('/template')
    return
  }

  try {
    const payload: TemplateDesignerPayload = await templateApi.designer(id)
    templateName.value = payload.info.name || payload.info.subtitle || '未命名模板'
    // 先取默认的打印机（后端的打印机列表里有 isDefault 标记），让「打印」直接选它
    await loadDefaultPrinter()
    await createDesign(payload.content)
  } catch (err) {
    ElMessage.error(String(err))
    router.replace('/template')
  }
})

/** 加载默认的打印机（从后端的打印机列表取 isDefault） */
async function loadDefaultPrinter(): Promise<void> {
  try {
    const list = await templateApi.printerList()
    const found = list.find(p => p.isDefault)
    defaultPrinter.value = found?.name ?? ''
    selectedPrinter.value = found?.name ?? ''
    if (found) {
      ElMessage.info(`已选默认打印机：${found.name}`)
    }
  } catch (_err) {
    /* 没有打印机就手动选（抽屉兜底） */
  }
}

/** hiprint 框架是否已经过 init（主题重建不重复初始化） */
let hiprintInitialized = false
/** 左侧面板的拖拽元素是否已经注册（避免重复注册） */
let draggedItemsRegistered = false

/**
 * 创建 PrintTemplate 并设计画布（首次进入 / 主题变更后重建画布都走它）
 *
 * @param template hiprint JSON 描述（主题变更后这里是应用了主题的描述）
 */
async function createDesign(template: string): Promise<void> {
  // 1. 把 jquery 挂到 window 上（hiprint UMD 版用 window.jQuery）
  if (!window.jQuery) window.jQuery = $
  if (!window.$) window.$ = $

  // 2. 全局初始化 hiprint（可拖拽元素提供者）—— 只全量初始化一次
  if (!hiprintInitialized) {
    hiprint.init({
      providers: [new defaultElementTypeProvider()]
    })
    hiprintInitialized = true
  }

  // 3. 把左侧的 .ep-draggable-item 注册为可拖拽元素——只注册一次
  if (!draggedItemsRegistered) {
    buildDraggableItems()
    draggedItemsRegistered = true
  }

  // 4. 创建 PrintTemplate 并进入设计器
  const tpl = new hiprint.PrintTemplate({
    template,
    settingContainer: '#' + settingContainerId.value,
    paginationContainer: '.hiprint-printPagination',
    providers: [new defaultElementTypeProvider()],
    fontList: [
      { title: '微软雅黑', value: 'Microsoft YaHei' },
      { title: '黑体', value: 'STHeitiSC-Light' },
      { title: '宋体', value: 'SimSun' },
      { title: '仿宋', value: 'FangSong' },
      { title: '楷体', value: 'STKaiti' },
      { title: 'Cursive', value: 'cursive' }
    ],
    dataMode: 1,
    history: true,
    onDataChanged: (type: string, json: any) => {
      // 编辑过程中自动更新 payload 供保存使用
      printTemplate.value = tpl
      historyUndo.value = true
      historyRedo.value = true
    },
    onUpdateError: (e: any) => {
      ElMessage.error('模板更新失败：' + String(e))
    }
  })

  // 5. 进入设计器（渲染画布 + 属性面板 + 工具条 + 分页容器）
  tpl.design('#' + tplContainerId.value)
  printTemplate.value = tpl
}

/** 把左侧面板的 .ep-draggable-item 注册到 hiprint 元素管理 */
function buildDraggableItems(): void {
  const panel = libraryRef.value
  if (!panel) return
  const items = panel.querySelectorAll('.ep-draggable-item') as NodeListOf<HTMLElement>
  const $items = $(items) as any
  if (window.hiprint?.PrintElementTypeManager?.buildByHtml) {
    window.hiprint.PrintElementTypeManager.buildByHtml($items)
  }
}

// ==================== 操作 ====================
function onBack(): void {
  emit('back')
}

/** 撤销 */
function onUndo(): void {
  printTemplate.value?.undo()
  ElMessage.info('撤销')
}

/** 重做 */
function onRedo(): void {
  printTemplate.value?.redo()
  ElMessage.info('重做')
}

/** 保存设计描述 */
async function onSave(): Promise<void> {
  const tpl = printTemplate.value
  if (!tpl) {
    ElMessage.warning('工作区为空')
    return
  }
  try {
    const json = tpl.getJson()
    await templateApi.update(templateId.value, {
      content: json,
      name: templateName.value
    })
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error(String(err))
  }
}

/** 打开只读预览页（当前标签页不再显示工具条） */
function onPreview(): void {
  const tpl = printTemplate.value
  if (!tpl) {
    ElMessage.warning('工作区为空')
    return
  }
  emit('preview')
}

/** 直接打印：有默认打印机时直接发起，没有时弹选机抽屉 */
async function onPrint(): Promise<void> {
  const tpl = printTemplate.value
  if (!tpl) {
    ElMessage.warning('工作区为空')
    return
  }
  if (defaultPrinter.value) return onPrintWith(tpl, defaultPrinter.value)
  selectedPrinter.value = ''
  printerVisible.value = true
}

/** 按指定打印机发起（把打印机名和连接参数交给底层引擎） */
async function onPrintWith(tpl: any, name: string): Promise<void> {
  if (!name) {
    ElMessage.warning('请选择一台打印机')
    return
  }
  saving.value = true
  try {
    tpl.print({}, { printer: name, smartPrint: false }, () => {
      ElMessage.info(`已发送到「${name}」`)
    })
  } catch (err) {
    ElMessage.error(String(err))
  } finally {
    saving.value = false
  }
}

/** 选机抽屉确认：选哪台就打哪台 */
function onPrinterConfirm(name: string): void {
  printerVisible.value = false
  void onPrintWith(printTemplate.value, name)
}

/** 选主题（类 PPT 主题页）：应用主题 → 写入设计描述 → 重建画布 */
async function onThemeChange(id: string): Promise<void> {
  if (!id) return
  const t = THEMES.find(item => item.id === id) ?? THEMES[0]
  if (t.id === selectedThemeId.value) return
  selectedThemeId.value = t.id
  const tpl = printTemplate.value
  if (!tpl) {
    ElMessage.warning('工作区为空')
    return
  }
  try {
    const json = tpl.getJson()
    const themed = applyTheme(json, t)
    selectedTheme.value = t
    await rebuildDesign(themed)
    ElMessage.success(`主题「${t.name}」已应用（已写进设计描述）`)
  } catch (err) {
    ElMessage.error(String(err))
  }
}

/** 重建画布：换掉当前 PrintTemplate 并重新设计（主题变更时） */
async function rebuildDesign(template: string): Promise<void> {
  printTemplate.value = null
  await createDesign(template)
}

onBeforeUnmount(() => {
  // 清理 jQuery 与 hiprint 在全局态（页面内的单个设计器，随页面卸载）
  printTemplate.value = null
})
</script>

<style lang="scss" scoped>
.designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page);
  overflow: hidden;
}

/* ==================== 顶栏 ==================== */
.designer-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  gap: 8px;
}

.designer-title {
  flex: 1;
  text-align: center;
  font-weight: 500;
}

.designer-actions {
  display: flex;
  gap: 4px;
}

/* 主题选择器（类 PPT 主题下拉，选完即应用并重建画布） */
.designer-theme {
  width: 140px;
}

/* ==================== 主体 ==================== */
.designer-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 左侧面板（组件库/数据源） */
.designer-left {
  display: flex;
  flex-direction: column;
  width: 300px;
  min-width: 240px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  transition: width 0.2s;
}

.designer-left.is-collapsed {
  width: 0;
  min-width: 0;
  border-right: none;
}

.designer-tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}

.designer-tab {
  flex: 1;
  text-align: center;
  line-height: 36px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--el-text-color-regular);
}

.designer-tab.active {
  color: var(--el-color-primary);
  border-bottom: 2px solid var(--el-color-primary);
}

.designer-panel {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.ep-draggable-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  margin-bottom: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-blank);
  cursor: move;
  user-select: none;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

.ep-draggable-item__label {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

/* 中间：WYSIWYG 编辑区 */
.designer-center {
  flex: 1;
  overflow: auto;
  position: relative;
  background: var(--el-fill-color);
}

.designer-canvas {
  padding: 24px;
  display: flex;
  justify-content: center;
}

.hiprint-canvas {
  width: 800pt;
  min-height: 1200pt;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
}

/* 右侧：属性设置面板 */
.designer-right {
  width: 320px;
  min-width: 280px;
  border-left: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow: auto;
}
</style>
