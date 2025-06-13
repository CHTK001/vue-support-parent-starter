<template>
  <div class="software-save-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <h2>软件保存</h2>
          <div>
            <el-button @click="goBack">返回</el-button>
            <el-button type="primary" @click="handleSubmit" :loading="loading">保存</el-button>
          </div>
        </div>
      </template>
      
      <div class="form-container">
        <!-- 左侧基本信息 -->
        <div class="form-left">
          <el-form 
            ref="formRef" 
            :model="formData" 
            :rules="formRules" 
            label-width="100px"
            label-position="right"
          >
            <el-form-item label="软件名称" prop="softServiceName">
              <el-input v-model="formData.softServiceName" placeholder="请输入软件名称" />
            </el-form-item>
            
            <el-form-item label="软件分类" prop="softServiceCategory">
              <el-select v-model="formData.softServiceCategory" placeholder="请选择软件分类" style="width: 100%">
                <el-option 
                  v-for="item in categories" 
                  :key="item.value" 
                  :label="item.label" 
                  :value="item.value" 
                />
              </el-select>
            </el-form-item>
            
            <el-form-item label="软件版本" prop="softServiceVersion">
              <el-input v-model="formData.softServiceVersion" placeholder="请输入软件版本" />
            </el-form-item>
            
            <el-form-item label="软件图标">
              <el-input v-model="formData.softServiceLogo" placeholder="请输入图标URL地址" />
            </el-form-item>
            
            <el-form-item label="下载地址">
              <el-input v-model="formData.softServiceDownloadUrl" placeholder="请输入软件下载地址" />
            </el-form-item>
            
            <el-form-item label="软件日志路径">
              <el-input v-model="formData.softServiceLogPath" placeholder="请输入软件日志路径" />
              <div class="form-hint">服务运行日志的文件路径，如"/var/log/service.log"</div>
            </el-form-item>
            
            <el-form-item label="软件描述">
              <el-input 
                v-model="formData.softServiceRemark" 
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
                  v-model="formData.softServiceInstallCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
              <div class="command-tips">
                <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="卸载命令" name="uninstall">
              <div class="code-editor-container">
                <ScCodeEditor 
                  ref="uninstallEditorRef"
                  v-model="formData.softServiceUninstallCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
              <div class="command-tips">
                <p>提示: 可以使用 <code>$DIR</code> 表示安装目录</p>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="启动命令" name="start">
              <div class="code-editor-container">
                <ScCodeEditor 
                  ref="startEditorRef"
                  v-model="formData.softServiceStartCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
              <div class="command-tips">
                <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="停止命令" name="stop">
              <div class="code-editor-container">
                <ScCodeEditor 
                  ref="stopEditorRef"
                  v-model="formData.softServiceStopCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
              <div class="command-tips">
                <p>提示: 可以使用 <code>$DIR</code> 表示安装目录</p>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="重启命令" name="restart">
              <div class="code-editor-container">
                <ScCodeEditor 
                  ref="restartEditorRef"
                  v-model="formData.softServiceRestartCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
              <div class="command-tips">
                <p>提示: 可以使用 <code>$DIR</code> 表示安装目录，<code>$PORT</code> 表示端口号</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineAsyncComponent } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from '@repo/utils'
import type { FormInstance } from 'element-plus'
import { fetchSoftServiceSave, fetchSoftServiceUpdate, type SoftService } from '@/api/soft'
import "codemirror/mode/shell/shell.js"

const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"))

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(false)
const isEdit = ref(false)
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

// 表单数据
const formData = reactive<Partial<SoftService>>({
  softServiceName: '',
  softServiceCategory: '',
  softServiceVersion: '',
  softServiceLogo: '',
  softServiceDownloadUrl: '',
  softServiceLogPath: '',
  softServiceInstallCommand: '',
  softServiceUninstallCommand: '',
  softServiceStartCommand: '',
  softServiceStopCommand: '',
  softServiceRestartCommand: '',
  softServiceRemark: ''
})

// 表单验证规则
const formRules = {
  softServiceName: [
    { required: true, message: '请输入软件名称', trigger: 'blur' }
  ],
  softServiceCategory: [
    { required: true, message: '请选择软件分类', trigger: 'change' }
  ],
  softServiceVersion: [
    { required: true, message: '请输入软件版本', trigger: 'blur' }
  ],
  softServiceInstallCommand: [
    { required: true, message: '请输入安装命令', trigger: 'blur' }
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

// 返回列表页
const goBack = () => {
  router.push('/soft')
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      loading.value = true
      const api = isEdit.value ? fetchSoftServiceUpdate : fetchSoftServiceSave
      const res = await api(formData as SoftService)
      // @ts-ignore
      if (res.code === '00000') {
        message.success(isEdit.value ? '编辑成功' : '添加成功')
        goBack()
      } else {
        // @ts-ignore
        message.error(res.msg || '操作失败')
      }
    } catch (error) {
      console.error(error)
      message.error('操作失败')
    } finally {
      loading.value = false
    }
  })
}

// 在script部分添加ref和onMounted处理
const installEditorRef = ref(null)
const uninstallEditorRef = ref(null)
const startEditorRef = ref(null)
const stopEditorRef = ref(null)
const restartEditorRef = ref(null)

// 初始化
onMounted(() => {
  // 如果URL中有ID参数，则为编辑模式
  const softId = route.query.id
  if (softId) {
    isEdit.value = true
    // 这里可以添加获取软件详情的逻辑
    fetchSoftDetail(softId)
  }
  
  // 延迟应用高亮，确保编辑器已完全加载
  setTimeout(() => {
    const editorRefs = [
      installEditorRef.value,
      uninstallEditorRef.value,
      startEditorRef.value,
      stopEditorRef.value,
      restartEditorRef.value
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
.software-save-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.box-card {
  margin-bottom: 20px;
}

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


