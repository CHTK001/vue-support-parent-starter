<template>
  <div class="sc-editor-example">
    <div class="example-header">
      <h2>ScEditor 富文本编辑器组件示例</h2>
      <p>基于 wangEditor 的 Vue 富文本编辑器，支持丰富的文本编辑功能</p>
    </div>

    <!-- 基础用法 -->
    <div class="example-section">
      <h3>基础用法</h3>
      <p>最基本的富文本编辑器</p>
      <div class="example-demo">
        <div class="editor-container">
          <ScEditor v-model="basicContent" />
        </div>
        <div class="content-preview">
          <h4>编辑器内容预览：</h4>
          <div class="preview-content" v-html="basicContent"></div>
        </div>
        <div class="editor-controls">
          <el-button @click="clearBasicContent">清空内容</el-button>
          <el-button @click="setBasicContent">设置示例内容</el-button>
          <el-button @click="getBasicContent">获取内容</el-button>
        </div>
      </div>
    </div>

    <!-- 自定义高度 -->
    <div class="example-section">
      <h3>自定义高度</h3>
      <p>可以自定义编辑器的高度</p>
      <div class="example-demo">
        <div class="height-controls">
          <el-slider
            v-model="editorHeight"
            :min="200"
            :max="800"
            :step="50"
            show-input
            style="margin-bottom: 20px;"
          >
            <template #prepend>高度:</template>
          </el-slider>
        </div>
        <div class="editor-container">
          <div :style="{ border: '1px solid #ccc' }">
            <Toolbar
              :style="{ borderBottom: '1px solid #ccc' }"
              :editor="customEditorRef"
              :defaultConfig="customToolbarConfig"
              mode="default"
            />
            <Editor
              v-model="customContent"
              :style="{ height: editorHeight + 'px', overflowY: 'hidden' }"
              :defaultConfig="customEditorConfig"
              mode="default"
              @onCreated="handleCustomCreated"
              @onChange="handleCustomChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 简洁模式 -->
    <div class="example-section">
      <h3>简洁模式</h3>
      <p>使用简洁模式的编辑器，工具栏功能更少</p>
      <div class="example-demo">
        <div class="editor-container">
          <div :style="{ border: '1px solid #ccc' }">
            <Toolbar
              :style="{ borderBottom: '1px solid #ccc' }"
              :editor="simpleEditorRef"
              :defaultConfig="simpleToolbarConfig"
              mode="simple"
            />
            <Editor
              v-model="simpleContent"
              :style="{ height: '300px', overflowY: 'hidden' }"
              :defaultConfig="simpleEditorConfig"
              mode="simple"
              @onCreated="handleSimpleCreated"
              @onChange="handleSimpleChange"
            />
          </div>
        </div>
        <div class="content-preview">
          <h4>简洁模式内容：</h4>
          <div class="preview-content" v-html="simpleContent"></div>
        </div>
      </div>
    </div>

    <!-- 禁用功能 -->
    <div class="example-section">
      <h3>禁用特定功能</h3>
      <p>可以禁用编辑器的某些功能</p>
      <div class="example-demo">
        <div class="editor-container">
          <div :style="{ border: '1px solid #ccc' }">
            <Toolbar
              :style="{ borderBottom: '1px solid #ccc' }"
              :editor="disabledEditorRef"
              :defaultConfig="disabledToolbarConfig"
              mode="default"
            />
            <Editor
              v-model="disabledContent"
              :style="{ height: '300px', overflowY: 'hidden' }"
              :defaultConfig="disabledEditorConfig"
              mode="default"
              @onCreated="handleDisabledCreated"
              @onChange="handleDisabledChange"
            />
          </div>
        </div>
        <div class="feature-info">
          <p><strong>已禁用功能：</strong>图片上传、视频插入、代码块</p>
        </div>
      </div>
    </div>

    <!-- 只读模式 -->
    <div class="example-section">
      <h3>只读模式</h3>
      <p>编辑器处于只读状态，无法编辑</p>
      <div class="example-demo">
        <div class="editor-container">
          <div :style="{ border: '1px solid #ccc' }">
            <Toolbar
              :style="{ borderBottom: '1px solid #ccc' }"
              :editor="readonlyEditorRef"
              :defaultConfig="readonlyToolbarConfig"
              mode="default"
            />
            <Editor
              v-model="readonlyContent"
              :style="{ height: '300px', overflowY: 'hidden' }"
              :defaultConfig="readonlyEditorConfig"
              mode="default"
              @onCreated="handleReadonlyCreated"
            />
          </div>
        </div>
        <div class="readonly-controls">
          <el-button @click="toggleReadonly">
            {{ isReadonly ? '启用编辑' : '设为只读' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 表单集成 -->
    <div class="example-section">
      <h3>表单集成</h3>
      <p>在表单中使用富文本编辑器</p>
      <div class="example-demo">
        <el-form :model="formData" :rules="formRules" ref="formRef" label-width="100px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入标题" />
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <ScEditor v-model="formData.content" />
          </el-form-item>
          <el-form-item label="摘要" prop="summary">
            <el-input
              v-model="formData.summary"
              type="textarea"
              :rows="3"
              placeholder="请输入摘要"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">提交</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <!-- 内容统计 -->
    <div class="example-section">
      <h3>内容统计</h3>
      <p>实时统计编辑器内容的字数和字符数</p>
      <div class="example-demo">
        <div class="editor-container">
          <ScEditor v-model="statsContent" @update:modelValue="updateStats" />
        </div>
        <div class="content-stats">
          <div class="stats-item">
            <span class="stats-label">字符数：</span>
            <span class="stats-value">{{ contentStats.charCount }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">字数：</span>
            <span class="stats-value">{{ contentStats.wordCount }}</span>
          </div>
          <div class="stats-item">
            <span class="stats-label">段落数：</span>
            <span class="stats-value">{{ contentStats.paragraphCount }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="example-section">
      <h3>事件日志</h3>
      <div class="event-log">
        <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-event">{{ log.event }}</span>
          <span class="log-detail">{{ log.detail }}</span>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <div class="api-table">
        <h4>Props</h4>
        <table>
          <thead>
            <tr>
              <th>参数</th>
              <th>说明</th>
              <th>类型</th>
              <th>可选值</th>
              <th>默认值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>v-model</td>
              <td>编辑器内容</td>
              <td>string</td>
              <td>—</td>
              <td>''</td>
            </tr>
          </tbody>
        </table>

        <h4>Events</h4>
        <table>
          <thead>
            <tr>
              <th>事件名</th>
              <th>说明</th>
              <th>回调参数</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>update:modelValue</td>
              <td>内容变化时触发</td>
              <td>content: string</td>
            </tr>
          </tbody>
        </table>

        <h4>编辑器配置</h4>
        <table>
          <thead>
            <tr>
              <th>配置项</th>
              <th>说明</th>
              <th>类型</th>
              <th>默认值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>placeholder</td>
              <td>占位符文本</td>
              <td>string</td>
              <td>'请输入内容...'</td>
            </tr>
            <tr>
              <td>readOnly</td>
              <td>是否只读</td>
              <td>boolean</td>
              <td>false</td>
            </tr>
            <tr>
              <td>maxLength</td>
              <td>最大字符数</td>
              <td>number</td>
              <td>—</td>
            </tr>
            <tr>
              <td>autoFocus</td>
              <td>自动聚焦</td>
              <td>boolean</td>
              <td>false</td>
            </tr>
          </tbody>
        </table>

        <h4>工具栏配置</h4>
        <table>
          <thead>
            <tr>
              <th>配置项</th>
              <th>说明</th>
              <th>类型</th>
              <th>默认值</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>excludeKeys</td>
              <td>排除的菜单key</td>
              <td>array</td>
              <td>[]</td>
            </tr>
            <tr>
              <td>insertKeys</td>
              <td>插入的菜单key</td>
              <td>object</td>
              <td>{}</td>
            </tr>
            <tr>
              <td>modalAppendToBody</td>
              <td>弹窗是否挂载到body</td>
              <td>boolean</td>
              <td>false</td>
            </tr>
          </tbody>
        </table>

        <h4>特性</h4>
        <ul>
          <li>支持丰富的文本格式化功能</li>
          <li>支持图片、视频、链接等多媒体内容</li>
          <li>支持表格、代码块、引用等结构化内容</li>
          <li>支持自定义工具栏和菜单</li>
          <li>支持多种编辑模式（默认、简洁）</li>
          <li>支持只读模式和禁用特定功能</li>
          <li>良好的移动端适配</li>
          <li>支持自定义主题样式</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, shallowRef, onBeforeUnmount, nextTick } from 'vue'
import { message } from "@repo/utils";
import ScEditor from './index.vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 基础编辑器内容
const basicContent = ref('<p>这是一个基础的富文本编辑器示例。</p><p>你可以在这里输入和编辑文本。</p>')

// 自定义高度编辑器
const editorHeight = ref(400)
const customContent = ref('<p>这是一个可以自定义高度的编辑器。</p>')
const customEditorRef = shallowRef()
const customToolbarConfig = reactive({})
const customEditorConfig = reactive({ placeholder: '请输入内容...' })

// 简洁模式编辑器
const simpleContent = ref('<p>这是简洁模式的编辑器，工具栏功能较少。</p>')
const simpleEditorRef = shallowRef()
const simpleToolbarConfig = reactive({})
const simpleEditorConfig = reactive({ placeholder: '请输入内容...' })

// 禁用功能编辑器
const disabledContent = ref('<p>这个编辑器禁用了部分功能。</p>')
const disabledEditorRef = shallowRef()
const disabledToolbarConfig = reactive({
  excludeKeys: ['uploadImage', 'uploadVideo', 'codeBlock']
})
const disabledEditorConfig = reactive({ placeholder: '请输入内容...' })

// 只读模式编辑器
const readonlyContent = ref('<p>这是只读模式的编辑器。</p><p><strong>无法编辑</strong>，只能查看内容。</p>')
const readonlyEditorRef = shallowRef()
const readonlyToolbarConfig = reactive({})
const readonlyEditorConfig = reactive({ 
  placeholder: '请输入内容...',
  readOnly: true
})
const isReadonly = ref(true)

// 表单数据
const formRef = ref()
const formData = reactive({
  title: '',
  content: '<p>请输入文章内容...</p>',
  summary: ''
})

const formRules = reactive({
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' }
  ],
  summary: [
    { max: 200, message: '摘要不能超过200个字符', trigger: 'blur' }
  ]
})

// 内容统计
const statsContent = ref('<p>在这里输入内容，下方会实时显示统计信息。</p>')
const contentStats = reactive({
  charCount: 0,
  wordCount: 0,
  paragraphCount: 0
})

// 事件日志
const eventLogs = ref([])

// 添加日志
const addLog = (event, detail = '') => {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift({ time, event, detail })
  if (eventLogs.value.length > 10) {
    eventLogs.value.pop()
  }
}

// 编辑器创建事件处理
const handleCustomCreated = (editor) => {
  customEditorRef.value = editor
  addLog('customCreated', '自定义编辑器创建完成')
}

const handleSimpleCreated = (editor) => {
  simpleEditorRef.value = editor
  addLog('simpleCreated', '简洁模式编辑器创建完成')
}

const handleDisabledCreated = (editor) => {
  disabledEditorRef.value = editor
  addLog('disabledCreated', '禁用功能编辑器创建完成')
}

const handleReadonlyCreated = (editor) => {
  readonlyEditorRef.value = editor
  addLog('readonlyCreated', '只读模式编辑器创建完成')
}

// 编辑器内容变化事件处理
const handleCustomChange = (editor) => {
  addLog('customChange', '自定义编辑器内容变化')
}

const handleSimpleChange = (editor) => {
  addLog('simpleChange', '简洁模式编辑器内容变化')
}

const handleDisabledChange = (editor) => {
  addLog('disabledChange', '禁用功能编辑器内容变化')
}

// 基础编辑器操作
const clearBasicContent = () => {
  basicContent.value = ''
  addLog('clearBasicContent', '清空基础编辑器内容')
}

const setBasicContent = () => {
  basicContent.value = `
    <h2>示例文章标题</h2>
    <p>这是一个<strong>示例文章</strong>的内容。</p>
    <p>包含了<em>斜体文本</em>和<u>下划线文本</u>。</p>
    <ul>
      <li>列表项目 1</li>
      <li>列表项目 2</li>
      <li>列表项目 3</li>
    </ul>
    <blockquote>这是一个引用块的示例。</blockquote>
    <p>还可以插入<a href="https://example.com" target="_blank">链接</a>。</p>
  `
  addLog('setBasicContent', '设置基础编辑器示例内容')
}

const getBasicContent = () => {
  console.log('基础编辑器内容：', basicContent.value)
  message('内容已输出到控制台', { type: "success" })
  addLog('getBasicContent', '获取基础编辑器内容')
}

// 切换只读模式
const toggleReadonly = () => {
  isReadonly.value = !isReadonly.value
  readonlyEditorConfig.readOnly = isReadonly.value
  
  if (readonlyEditorRef.value) {
    if (isReadonly.value) {
      readonlyEditorRef.value.disable()
    } else {
      readonlyEditorRef.value.enable()
    }
  }
  
  addLog('toggleReadonly', `切换到${isReadonly.value ? '只读' : '编辑'}模式`)
}

// 表单提交
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      console.log('表单数据：', formData)
      message('表单提交成功！', { type: "success" })
      addLog('submitForm', '表单提交成功')
    } else {
      message('表单验证失败！', { type: "error" })
      addLog('submitForm', '表单验证失败')
    }
  })
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  formData.content = '<p>请输入文章内容...</p>'
  addLog('resetForm', '重置表单')
}

// 更新内容统计
const updateStats = (content) => {
  // 移除HTML标签，计算纯文本
  const textContent = content.replace(/<[^>]*>/g, '')
  
  // 字符数（包括空格）
  contentStats.charCount = textContent.length
  
  // 字数（中文按字符计算，英文按单词计算）
  const chineseChars = textContent.match(/[\u4e00-\u9fa5]/g) || []
  const englishWords = textContent.match(/[a-zA-Z]+/g) || []
  contentStats.wordCount = chineseChars.length + englishWords.length
  
  // 段落数
  const paragraphs = content.match(/<p[^>]*>.*?<\/p>/g) || []
  contentStats.paragraphCount = paragraphs.length
  
  addLog('updateStats', `字符数: ${contentStats.charCount}, 字数: ${contentStats.wordCount}`)
}

// 组件卸载时销毁编辑器
onBeforeUnmount(() => {
  const editors = [
    customEditorRef.value,
    simpleEditorRef.value,
    disabledEditorRef.value,
    readonlyEditorRef.value
  ]
  
  editors.forEach(editor => {
    if (editor) {
      editor.destroy()
    }
  })
})

// 初始化内容统计
nextTick(() => {
  updateStats(statsContent.value)
})
</script>

<style scoped>
.sc-editor-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: var(--el-text-color-primary);
  border-radius: 10px;
}

.example-header h2 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: bold;
}

.example-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fafafa;
}

.example-section h3 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 20px;
  border-bottom: 2px solid #409eff;
  padding-bottom: 5px;
}

.example-section p {
  margin: 0 0 15px 0;
  color: var(--el-text-color-primary);
  line-height: 1.6;
}

.example-demo {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.editor-container {
  margin-bottom: 20px;
}

.content-preview {
  margin-top: 20px;
  padding: 15px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.content-preview h4 {
  margin: 0 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.preview-content {
  min-height: 50px;
  padding: 10px;
  background: var(--el-bg-color-overlay);
  border: 1px solid #ddd;
  border-radius: 4px;
  word-wrap: break-word;
}

.editor-controls,
.readonly-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 15px;
}

.height-controls {
  margin-bottom: 20px;
}

.feature-info {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  color: #856404;
}

.content-stats {
  display: flex;
  gap: 20px;
  margin-top: 15px;
  padding: 15px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stats-label {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin-bottom: 5px;
}

.stats-value {
  font-size: 18px;
  font-weight: bold;
  color: #409eff;
}

.event-log {
  max-height: 300px;
  overflow-y: auto;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  display: flex;
  padding: 5px 0;
  border-bottom: 1px solid #e9ecef;
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.log-time {
  color: #6c757d;
  margin-right: 10px;
  min-width: 80px;
}

.log-event {
  color: #007bff;
  margin-right: 10px;
  min-width: 120px;
  font-weight: bold;
}

.log-detail {
  color: #28a745;
}

.api-table {
  margin-top: 20px;
}

.api-table h4 {
  margin: 20px 0 10px 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.api-table table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.api-table th,
.api-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.api-table th {
  background: var(--el-bg-color-overlay);
  font-weight: bold;
  color: var(--el-text-color-primary);
}

.api-table td {
  color: var(--el-text-color-primary);
}

.api-table tr:hover {
  background: var(--el-bg-color-overlay);
}

.api-table ul {
  margin: 0;
  padding-left: 20px;
}

.api-table li {
  margin-bottom: 5px;
  color: var(--el-text-color-primary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-editor-example {
    padding: 10px;
  }
  
  .example-header {
    padding: 15px;
  }
  
  .example-header h2 {
    font-size: 24px;
  }
  
  .example-section {
    padding: 15px;
  }
  
  .editor-controls,
  .readonly-controls {
    flex-direction: column;
  }
  
  .content-stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .stats-item {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .api-table {
    overflow-x: auto;
  }
  
  .api-table table {
    min-width: 600px;
  }
}
</style>