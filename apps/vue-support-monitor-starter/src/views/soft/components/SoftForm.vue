<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑软件' : '新增软件'"
    width="90%"
    draggable
    top="10px"
    destroy-on-close
  >
    <div class="form-container">
      <!-- 左侧基本信息 -->
      <div class="form-left">
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="rules" 
          label-width="150px"
          label-position="right"
        >
          <el-form-item label="软件名称" prop="softServiceName">
            <el-input v-model="form.softServiceName" placeholder="请输入软件名称" />
          </el-form-item>
          
          <el-form-item label="软件分类" prop="softServiceCategory">
            <el-select v-model="form.softServiceCategory" placeholder="请选择软件分类" style="width: 100%">
              <el-option 
                v-for="item in categories" 
                :key="item.value" 
                :label="item.label" 
                :value="item.value" 
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="适用系统" prop="softServiceOs">
            <ScSelect
              v-model="form.softServiceOs"
              :options="osOptions"
              layout="select"
              placeholder="请选择适用操作系统"
            />
          </el-form-item>
          
          <el-form-item label="软件版本" prop="softServiceVersion">
            <el-input v-model="form.softServiceVersion" placeholder="请输入软件版本" />
          </el-form-item>
          
          <el-form-item label="软件图标">
            <el-input v-model="form.softServiceLogo" placeholder="请输入图标URL地址" />
          </el-form-item>
          
          <el-form-item label="下载地址">
            <el-input v-model="form.softServiceDownloadUrl" placeholder="请输入软件下载地址" />
          </el-form-item>
          
          <el-form-item label="状态检查成功标识" prop="softServiceStatusCheckSuccessFlag">
            <el-input v-model="form.softServiceStatusCheckSuccessFlag" placeholder="请输入服务状态检查成功标识" />
            <div class="form-hint">判断服务正常运行的关键字，如"running"或"active"</div>
          </el-form-item>
          
          <el-form-item label="软件描述">
            <el-input 
              v-model="form.softServiceRemark" 
              type="textarea" 
              :rows="3" 
              placeholder="请输入软件描述" 
            />
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 右侧命令编辑区 -->
      <div class="form-right">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="安装命令" name="install">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="installEditorRef"
                v-model="form.softServiceInstallCommand" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>安装成功标识:</p>
                    <el-input v-model="form.softServiceInstallSuccessFlag" placeholder="例如: installed successfully" />
                  </el-col>
                  <el-col :span="12">
                    <p>安装失败标识:</p>
                    <el-input v-model="form.softServiceInstallFailureFlag" placeholder="例如: installation failed" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="卸载命令" name="uninstall">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="uninstallEditorRef"
                v-model="form.softServiceUninstallCommand" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 可以使用 <code>$DIR</code> 表示安装目录</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>卸载成功标识:</p>
                    <el-input v-model="form.softServiceUninstallSuccessFlag" placeholder="例如: uninstalled successfully" />
                  </el-col>
                  <el-col :span="12">
                    <p>卸载失败标识:</p>
                    <el-input v-model="form.softServiceUninstallFailureFlag" placeholder="例如: uninstall failed" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="启动命令" name="start">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="startEditorRef"
                v-model="form.softServiceStartCommand" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>启动成功标识:</p>
                    <el-input v-model="form.softServiceStartSuccessFlag" placeholder="例如: started successfully" />
                  </el-col>
                  <el-col :span="12">
                    <p>启动失败标识:</p>
                    <el-input v-model="form.softServiceStartFailureFlag" placeholder="例如: start failed" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="停止命令" name="stop">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="stopEditorRef"
                v-model="form.softServiceStopCommand" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 可以使用 <code>$DIR</code> 表示安装目录</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>停止成功标识:</p>
                    <el-input v-model="form.softServiceStopSuccessFlag" placeholder="例如: stopped successfully" />
                  </el-col>
                  <el-col :span="12">
                    <p>停止失败标识:</p>
                    <el-input v-model="form.softServiceStopFailureFlag" placeholder="例如: stop failed" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="重启命令" name="restart">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="restartEditorRef"
                v-model="form.softServiceRestartCommand" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>重启成功标识:</p>
                    <el-input v-model="form.softServiceRestartSuccessFlag" placeholder="例如: restarted successfully" />
                  </el-col>
                  <el-col :span="12">
                    <p>重启失败标识:</p>
                    <el-input v-model="form.softServiceRestartFailureFlag" placeholder="例如: restart failed" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="状态命令" name="status">
            <div class="code-editor-container">
              <ScCodeEditor 
                ref="statusEditorRef"
                v-model="form.abstractChannelSession" 
                height="300" 
                mode="shell" 
                :options="codeEditorOptions" 
              />
            </div>
            <div class="command-tips">
              <p>提示: 用于检查服务运行状态的命令，可以使用 <code>$DIR</code> 表示安装目录</p>
              <div class="command-flags">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <p>状态检查成功标识:</p>
                    <el-input v-model="form.softServiceStatusCheckSuccessFlag" placeholder="例如: running 或 active" />
                  </el-col>
                  <el-col :span="12">
                    <p>状态检查失败标识:</p>
                    <el-input v-model="form.softServiceStatusCheckFailureFlag" placeholder="例如: stopped 或 inactive" />
                  </el-col>
                </el-row>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { message } from '@repo/utils'
import { type PartialSoftService } from '@/api/soft'
import "codemirror/mode/shell/shell.js"
import ScSelect from "@repo/components/ScSelect/index.vue"

const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"))

const props = defineProps<{
  modelValue?: boolean
  isEdit: boolean
  software?: PartialSoftService
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', visible: boolean): void
  (e: 'success'): void
  (e: 'submit', formData: PartialSoftService): void
  (e: 'cancel'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue ?? false,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const activeTab = ref('install')

// 代码编辑器配置
const codeEditorOptions = {
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  theme: 'idea',
  autoRefresh: true,
  lineWrapping: true,
  // 高亮关键词
  hintOptions: {
    completeSingle: false
  },
  extraKeys: {
    "Ctrl-Space": "autocomplete"
  },
  // 自定义高亮规则
  mode: "shell"
}

// 添加自定义高亮样式
const addCustomHighlighting = (editor) => {
  if (!editor) return;
  
  const keywords = ["$DIR", "$PORT", "cd", "mkdir", "wget", "tar", "chmod", "rm", "cp", "mv", "docker", "systemctl"];
  
  // 添加自定义标记
  editor.on("renderLine", (cm, line, el) => {
    const text = line.text;
    keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        const regex = new RegExp(keyword.replace(/\$/g, "\\$"), "g");
        let match;
        while ((match = regex.exec(text)) !== null) {
          const startPos = match.index;
          const endPos = startPos + keyword.length;
          
          // 创建高亮元素
          const highlightSpan = document.createElement("span");
          highlightSpan.className = "custom-highlight";
          highlightSpan.style.color = "#0066cc";
          highlightSpan.style.fontWeight = "bold";
          highlightSpan.textContent = keyword;
          
          // 查找对应位置的文本节点
          const textNodes = el.childNodes;
          let currentPos = 0;
          
          for (let i = 0; i < textNodes.length; i++) {
            const node = textNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
              const nodeLength = node.textContent.length;
              if (currentPos <= startPos && startPos < currentPos + nodeLength) {
                // 找到包含关键词的文本节点
                const beforeText = node.textContent.substring(0, startPos - currentPos);
                const afterText = node.textContent.substring(endPos - currentPos);
                
                // 替换文本节点
                const beforeNode = document.createTextNode(beforeText);
                const afterNode = document.createTextNode(afterText);
                
                node.parentNode.insertBefore(beforeNode, node);
                node.parentNode.insertBefore(highlightSpan, node);
                node.parentNode.insertBefore(afterNode, node);
                node.parentNode.removeChild(node);
                break;
              }
              currentPos += nodeLength;
            }
          }
        }
      }
    });
  });
}

const form = reactive<PartialSoftService>({
  softServiceName: '',
  softServiceCategory: '',
  softServiceVersion: '',
  softServiceLogo: '',
  softServiceRemark: '',
  softServiceOs: '',
  softServiceDownloadUrl: '',
  softServiceInstallCommand: '',
  softServiceUninstallCommand: '',
  softServiceStartCommand: '',
  softServiceStopCommand: '',
  softServiceRestartCommand: '',
  softServiceInstalledCommand: '',
  abstractChannelSession: '',
  softServiceStatusCheckSuccessFlag: '',
  softServiceStatusCheckFailureFlag: '',
  softServiceInstallSuccessFlag: '',
  softServiceInstallFailureFlag: '',
  softServiceUninstallSuccessFlag: '',
  softServiceUninstallFailureFlag: '',
  softServiceStartSuccessFlag: '',
  softServiceStartFailureFlag: '',
  softServiceStopSuccessFlag: '',
  softServiceStopFailureFlag: '',
  softServiceRestartSuccessFlag: '',
  softServiceRestartFailureFlag: '',
  ...(props.software || {})
})

// 监听props.software的变化
watch(() => props.software, (newVal) => {
  if (newVal) {
    // 更新表单数据
    Object.keys(newVal).forEach(key => {
      if (key in form) {
        form[key] = newVal[key];
      }
    });
  }
}, { deep: true })

// 表单验证规则
const rules = {
  softServiceName: [
    { required: true, message: '请输入软件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  softServiceCategory: [
    { required: true, message: '请选择软件分类', trigger: 'change' }
  ],
  softServiceOs: [
    { required: true, message: '请选择适用操作系统', trigger: 'change' }
  ],
  softServiceVersion: [
    { required: true, message: '请输入软件版本', trigger: 'blur' }
  ]
}

// 软件分类
const categories = [
  { label: '数据库', value: 'database' },
  { label: 'Web服务器', value: 'web_server' },
  { label: '开发工具', value: 'development' },
  { label: '监控工具', value: 'monitoring' },
  { label: '容器', value: 'container' },
  { label: '其他', value: 'other' }
]

// 操作系统选项
const osOptions = [
  { label: 'Linux', value: 'linux', icon: 'mdi:linux' },
  { label: 'Windows', value: 'windows', icon: 'mdi:microsoft-windows' },
  { label: 'MacOS', value: 'macos', icon: 'mdi:apple' },
  { label: '全部', value: 'all', icon: 'ep:monitor' }
]

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      // 直接触发提交事件，让父组件处理保存逻辑
      emit('submit', form)
      dialogVisible.value = false
    } catch (error) {
      console.error(error)
      message.error('表单验证失败')
    } finally {
      loading.value = false
    }
  })
}

// 取消按钮处理函数
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}

// 在script部分添加ref和onMounted处理
const installEditorRef = ref(null)
const uninstallEditorRef = ref(null)
const startEditorRef = ref(null)
const stopEditorRef = ref(null)
const restartEditorRef = ref(null)
const statusEditorRef = ref(null)

// 初始化
onMounted(() => {
  // 延迟应用高亮，确保编辑器已完全加载
  setTimeout(() => {
    const editorRefs = [
      installEditorRef.value,
      uninstallEditorRef.value,
      startEditorRef.value,
      stopEditorRef.value,
      restartEditorRef.value,
      statusEditorRef.value
    ]
    
    editorRefs.forEach(editorRef => {
      if (editorRef && editorRef.coder) {
        addCustomHighlighting(editorRef.coder)
      }
    })
  }, 500)
})
</script>

<style scoped lang="scss">
.form-container {
  display: flex;
  gap: 20px;
  
  .form-left {
    flex: 1;
    min-width: 300px;
    
    .form-hint {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
  
  .form-right {
    flex: 1.5;
    min-width: 400px;
    
    .code-editor-container {
      border: 1px solid var(--el-border-color-light);
      border-radius: 4px;
    }
    
    .command-tips {
      margin-top: 10px;
      padding: 8px;
      background-color: var(--el-fill-color-light);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      
      code {
        background-color: var(--el-bg-color);
        padding: 2px 4px;
        border-radius: 3px;
        color: var(--el-color-primary);
        font-family: monospace;
      }

      .command-flags {
        margin-top: 10px;
        padding: 10px;
        background-color: var(--el-bg-color);
        border-radius: 4px;
        border: 1px dashed var(--el-border-color);

        p {
          margin-bottom: 5px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }

        .el-input {
          margin-bottom: 10px;
        }

        .el-col:first-child {
          border-right: 1px dashed var(--el-border-color-lighter);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .form-container {
    flex-direction: column;
  }
}
</style>

<!-- 添加全局样式，确保自定义高亮可以生效 -->
<style>
.custom-highlight {
  color: #0066cc !important;
  font-weight: bold !important;
  background-color: rgba(0, 102, 204, 0.1);
  padding: 0 2px;
  border-radius: 2px;
}

/* 变量高亮 */
.cm-variable {
  color: #d73a49 !important;
}

/* 命令高亮 */
.cm-builtin {
  color: #6f42c1 !important;
  font-weight: bold;
}

/* 字符串高亮 */
.cm-string {
  color: #22863a !important;
}

/* 注释高亮 */
.cm-comment {
  color: #6a737d !important;
  font-style: italic;
}

/* 关键词高亮 */
.cm-keyword {
  color: #e36209 !important;
  font-weight: bold;
}
</style>
```
