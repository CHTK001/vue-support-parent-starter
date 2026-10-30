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
        <ReButton type="warning" plain @click="onPreview">预览</ReButton>
        <ReButton type="primary" @click="onSave">保存</ReButton>
        <ReButton type="success" plain @click="onPrint">打印</ReButton>
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
          <div id="hiprint-printTemplate" ref="tplRef"></div>
        </div>
      </main>

      <!-- 右侧：属性设置（元素的参数面板） -->
      <aside class="designer-right" v-if="settingVisible">
        <div id="hiprint-setting" ref="settingRef"></div>
      </aside>
    </div>
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
 */
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import ReButton from '@repo/ui/re-button'
import ReInput from '@repo/ui/re-input'
import $ from 'jquery'
import { hiprint, defaultElementTypeProvider } from 'vue-plugin-hiprint'
import 'vue-plugin-hiprint/dist/print-lock.css'

import { templateApi } from '../api/templateApi'
import type { TemplateDesignerPayload } from '../types/template'

const route = useRoute()
const router = useRouter()

/** 模板名（只读显示） */
const templateName = ref('')
const templateId = computed(() => (route.params.id as string) || '')

/** 左侧面板显隐 */
const leftVisible = ref(true)
const settingVisible = ref(true)

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
    await initDesign(payload)
  } catch (err) {
    ElMessage.error(String(err))
    router.replace('/template')
  }
})

/**
 * 初始化设计器（拖拽 + 元素面板 + hiprint printTemplate）
 */
async function initDesign(payload: TemplateDesignerPayload): Promise<void> {
  // 1. 把 jquery 挂到 window 上（hiprint UMD 版用 window.jQuery）
  if (!window.jQuery) window.jQuery = $
  if (!window.$) window.$ = $

  // 2. 全局初始化 hiprint（可拖拽元素提供者）
  hiprint.init({
    providers: [new defaultElementTypeProvider()]
  })

  // 3. 把左侧的 .ep-draggable-item 注册为可拖拽元素
  buildDraggableItems()

  // 4. 创建 PrintTemplate 并进入设计器
  const tpl = new hiprint.PrintTemplate({
    template: payload.content,
    settingContainer: '#hiprint-setting',
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
      void json
    },
    onUpdateError: (e: any) => {
      ElMessage.error('模板更新失败：' + String(e))
    }
  })

  // 5. 进入设计器（渲染画布 + 属性面板 + 工具条 + 分页容器）
  tpl.design('#hiprint-printTemplate')
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
  router.replace('/template')
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
  router.push({ name: 'TemplatePreview', params: { id: templateId.value } })
}

/** 直接打印（让盒子选择打印机） */
async function onPrint(): Promise<void> {
  const tpl = printTemplate.value
  if (!tpl) {
    ElMessage.warning('工作区为空')
    return
  }
  try {
    tpl.print({}, { printer: '', smartPrint: false }, () => {
      ElMessage.info('已弹出系统打印窗口')
    })
  } catch (err) {
    ElMessage.error(String(err))
  }
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

#hiprint-printTemplate {
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
