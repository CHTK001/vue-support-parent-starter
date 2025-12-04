<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="80%"
    :before-close="handleClose"
    class="file-preview-dialog"
    destroy-on-close
  >
    <div class="preview-container">
      <!-- 文件信息头部 -->
      <div class="file-info-header">
        <div class="file-icon-info">
          <IconifyIconOnline
            :icon="getFileIcon(file)"
            class="file-icon-large"
            :class="getFileIconClass(file)"
          />
          <div class="file-details">
            <h3 class="file-name">{{ file?.name }}</h3>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file?.size || 0) }}</span>
              <span class="file-type">{{ getFileType(file) }}</span>
              <span class="file-date">{{ formatDate(file?.lastModified || 0) }}</span>
            </div>
          </div>
        </div>
        <div class="file-actions">
          <el-button @click="downloadFile" type="primary">
            <IconifyIconOnline icon="ri:download-line" class="btn-icon" />
            下载
          </el-button>
          <el-button @click="copyPath">
            <IconifyIconOnline icon="ri:file-copy-line" class="btn-icon" />
            复制路径
          </el-button>
        </div>
      </div>

      <!-- 预览内容 -->
      <div class="preview-content">
        <!-- 图片预览 -->
        <div v-if="isImage" class="image-preview">
          <el-image
            :src="previewUrl"
            :alt="file?.name"
            fit="contain"
            class="preview-image"
            :preview-src-list="[previewUrl]"
            :initial-index="0"
            preview-teleported
          >
            <template #error>
              <div class="image-error">
                <IconifyIconOnline icon="ri:image-line" class="error-icon" />
                <p>图片加载失败</p>
              </div>
            </template>
          </el-image>
        </div>

        <!-- 文本预览 -->
        <div v-else-if="isText" class="text-preview">
          <div class="text-toolbar">
            <el-button-group>
              <el-button
                :type="textWrap ? 'primary' : 'default'"
                @click="textWrap = !textWrap"
                size="small"
              >
                <IconifyIconOnline icon="ri:text-wrap" />
                自动换行
              </el-button>
              <el-button @click="copyTextContent" size="small">
                <IconifyIconOnline icon="ri:file-copy-line" />
                复制内容
              </el-button>
            </el-button-group>
          </div>
          <div class="text-content" :class="{ 'text-wrap': textWrap }">
            <pre v-if="textContent" class="text-pre">{{ textContent }}</pre>
            <div v-else-if="textLoading" class="text-loading">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>加载�?..</span>
            </div>
            <div v-else class="text-error">
              <IconifyIconOnline icon="ri:file-text-line" class="error-icon" />
              <p>无法加载文件内容</p>
            </div>
          </div>
        </div>

        <!-- PDF预览 -->
        <div v-else-if="isPdf" class="pdf-preview">
          <div class="pdf-toolbar">
            <span class="pdf-info">PDF文档预览</span>
            <el-button @click="openInNewTab" type="primary" size="small">
              <IconifyIconOnline icon="ri:external-link-line" />
              在新标签页中打开
            </el-button>
          </div>
          <iframe
            :src="previewUrl"
            class="pdf-iframe"
            frameborder="0"
          ></iframe>
        </div>

        <!-- 音频预览 -->
        <div v-else-if="isAudio" class="audio-preview">
          <div class="audio-player">
            <IconifyIconOnline icon="ri:music-line" class="audio-icon" />
            <audio :src="previewUrl" controls class="audio-element">
              您的浏览器不支持音频播放
            </audio>
          </div>
        </div>

        <!-- 视频预览 -->
        <div v-else-if="isVideo" class="video-preview">
          <video :src="previewUrl" controls class="video-element">
            您的浏览器不支持视频播放
          </video>
        </div>

        <!-- 代码预览 -->
        <div v-else-if="isCode" class="code-preview">
          <div class="code-toolbar">
            <span class="code-language">{{ getCodeLanguage() }}</span>
            <el-button @click="copyTextContent" size="small">
              <IconifyIconOnline icon="ri:file-copy-line" />
              复制代码
            </el-button>
          </div>
          <div class="code-content">
            <pre v-if="textContent" class="code-pre"><code>{{ textContent }}</code></pre>
            <div v-else-if="textLoading" class="code-loading">
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              <span>加载�?..</span>
            </div>
            <div v-else class="code-error">
              <IconifyIconOnline icon="ri:code-line" class="error-icon" />
              <p>无法加载代码内容</p>
            </div>
          </div>
        </div>

        <!-- 不支持预览的文件类型 -->
        <div v-else class="unsupported-preview">
          <div class="unsupported-content">
            <IconifyIconOnline icon="ri:file-unknow-line" class="unsupported-icon" />
            <h3>无法预览此文件类�?/h3>
            <p>{{ file?.name }} ({{ getFileType(file) }})</p>
            <el-button @click="downloadFile" type="primary" size="large">
              <IconifyIconOnline icon="ri:download-line" class="btn-icon" />
              下载文件
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button @click="downloadFile" type="primary">
          <IconifyIconOnline icon="ri:download-line" class="btn-icon" />
          下载
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { formatBytes } from '@pureadmin/utils'
import dayjs from 'dayjs'

// 类型定义
interface FileItem {
  name: string
  path: string
  size: number
  lastModified: number
  isDirectory: boolean
  extension?: string
  mimeType?: string
}

// Props
interface Props {
  modelValue: boolean
  file: FileItem | null
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  file: null
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  close: []
}>()

// 响应式数�?
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const textContent = ref('')
const textLoading = ref(false)
const textWrap = ref(true)

// 计算属�?
const dialogTitle = computed(() => {
  return props.file ? `预览 - ${props.file.name}` : '文件预览'
})

const previewUrl = computed(() => {
  if (!props.file) return ''
  // 这里应该返回实际的文件预览URL
  return `/api/files/preview/${encodeURIComponent(props.file.path)}`
})

const fileExtension = computed(() => {
  return props.file?.extension?.toLowerCase() || ''
})

const isImage = computed(() => {
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp']
  return imageExts.includes(fileExtension.value)
})

const isText = computed(() => {
  const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'ini', 'conf', 'yaml', 'yml']
  return textExts.includes(fileExtension.value)
})

const isPdf = computed(() => {
  return fileExtension.value === 'pdf'
})

const isAudio = computed(() => {
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a']
  return audioExts.includes(fileExtension.value)
})

const isVideo = computed(() => {
  const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm']
  return videoExts.includes(fileExtension.value)
})

const isCode = computed(() => {
  const codeExts = [
    'js', 'ts', 'jsx', 'tsx', 'vue', 'html', 'css', 'scss', 'sass', 'less',
    'java', 'py', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
    'kt', 'scala', 'sh', 'bat', 'ps1', 'sql', 'r', 'matlab', 'm'
  ]
  return codeExts.includes(fileExtension.value)
})

// 方法
const getFileIcon = (file: FileItem | null) => {
  if (!file || file.isDirectory) {
    return 'ri:folder-line'
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'ri:image-line'
    case 'pdf':
      return 'ri:file-pdf-line'
    case 'doc':
    case 'docx':
      return 'ri:file-word-line'
    case 'xls':
    case 'xlsx':
      return 'ri:file-excel-line'
    case 'ppt':
    case 'pptx':
      return 'ri:file-ppt-line'
    case 'txt':
    case 'md':
      return 'ri:file-text-line'
    case 'zip':
    case 'rar':
    case '7z':
      return 'ri:file-zip-line'
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'ri:file-music-line'
    case 'mp4':
    case 'avi':
    case 'mkv':
      return 'ri:file-video-line'
    default:
      return 'ri:file-line'
  }
}

const getFileIconClass = (file: FileItem | null) => {
  if (!file || file.isDirectory) {
    return 'folder-icon'
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'image-icon'
    case 'pdf':
      return 'pdf-icon'
    case 'doc':
    case 'docx':
      return 'word-icon'
    case 'xls':
    case 'xlsx':
      return 'excel-icon'
    case 'ppt':
    case 'pptx':
      return 'ppt-icon'
    default:
      return 'file-icon'
  }
}

const getFileType = (file: FileItem | null) => {
  if (!file || file.isDirectory) {
    return '文件�?
  }
  
  const ext = file.extension?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return '图片'
    case 'pdf':
      return 'PDF文档'
    case 'doc':
    case 'docx':
      return 'Word文档'
    case 'xls':
    case 'xlsx':
      return 'Excel表格'
    case 'ppt':
    case 'pptx':
      return 'PowerPoint演示文稿'
    case 'txt':
      return '文本文件'
    case 'md':
      return 'Markdown文档'
    case 'zip':
    case 'rar':
    case '7z':
      return '压缩文件'
    case 'mp3':
    case 'wav':
    case 'flac':
      return '音频文件'
    case 'mp4':
    case 'avi':
    case 'mkv':
      return '视频文件'
    default:
      return file.extension ? `${file.extension.toUpperCase()}文件` : '未知类型'
  }
}

const getCodeLanguage = () => {
  const ext = fileExtension.value
  const languageMap: Record<string, string> = {
    js: 'JavaScript',
    ts: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    vue: 'Vue',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'Sass',
    less: 'Less',
    java: 'Java',
    py: 'Python',
    cpp: 'C++',
    c: 'C',
    h: 'C Header',
    cs: 'C#',
    php: 'PHP',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    swift: 'Swift',
    kt: 'Kotlin',
    scala: 'Scala',
    sh: 'Shell',
    bat: 'Batch',
    ps1: 'PowerShell',
    sql: 'SQL',
    r: 'R',
    matlab: 'MATLAB',
    m: 'Objective-C'
  }
  
  return languageMap[ext] || ext.toUpperCase()
}

const formatFileSize = (size: number) => {
  return formatBytes(size)
}

const formatDate = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const loadTextContent = async () => {
  if (!props.file || (!isText.value && !isCode.value)) return
  
  textLoading.value = true
  try {
    // 这里应该调用实际的API获取文件内容
    // const response = await getFileContent(props.file.path)
    // textContent.value = response.data
    
    // 模拟加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    textContent.value = `// 这是 ${props.file.name} 的内容\n// 实际内容需要通过API获取\n\nconsole.log('Hello, World!');`
  } catch (error) {
    console.error('加载文件内容失败:', error)
    textContent.value = ''
  } finally {
    textLoading.value = false
  }
}

const downloadFile = async () => {
  if (!props.file) return
  
  try {
    // 这里应该调用实际的下载API
    ElMessage.success(`开始下�?${props.file.name}`)
  } catch (error) {
    ElMessage.error('下载失败')
    console.error(error)
  }
}

const copyPath = async () => {
  if (!props.file) return
  
  try {
    await navigator.clipboard.writeText(props.file.path)
    ElMessage.success('文件路径已复制到剪贴�?)
  } catch (error) {
    ElMessage.error('复制失败')
    console.error(error)
  }
}

const copyTextContent = async () => {
  if (!textContent.value) return
  
  try {
    await navigator.clipboard.writeText(textContent.value)
    ElMessage.success('内容已复制到剪贴�?)
  } catch (error) {
    ElMessage.error('复制失败')
    console.error(error)
  }
}

const openInNewTab = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

const handleClose = () => {
  dialogVisible.value = false
  emit('close')
}

// 监听文件变化
watch(
  () => props.file,
  (newFile) => {
    if (newFile && (isText.value || isCode.value)) {
      nextTick(() => {
        loadTextContent()
      })
    } else {
      textContent.value = ''
    }
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.file-preview-dialog {
  .preview-container {
    .file-info-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      margin-bottom: 20px;

      .file-icon-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .file-icon-large {
          font-size: 48px;

          &.folder-icon {
            color: #f39c12;
          }

          &.image-icon {
            color: #e74c3c;
          }

          &.pdf-icon {
            color: #e74c3c;
          }

          &.word-icon {
            color: #3498db;
          }

          &.excel-icon {
            color: #27ae60;
          }

          &.ppt-icon {
            color: #e67e22;
          }

          &.file-icon {
            color: #95a5a6;
          }
        }

        .file-details {
          .file-name {
            margin: 0 0 8px 0;
            font-size: 20px;
            font-weight: 600;
            color: #2c3e50;
          }

          .file-meta {
            display: flex;
            gap: 16px;
            font-size: 14px;
            color: #7f8c8d;

            .file-size,
            .file-type,
            .file-date {
              &::before {
                content: '�?;
                margin-right: 8px;
                color: #bdc3c7;
              }

              &:first-child::before {
                display: none;
              }
            }
          }
        }
      }

      .file-actions {
        display: flex;
        gap: 12px;

        .btn-icon {
          margin-right: 6px;
        }
      }
    }

    .preview-content {
      min-height: 400px;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e9ecef;

      .image-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        background: var(--el-bg-color-overlay);

        .preview-image {
          max-width: 100%;
          max-height: 600px;
        }

        .image-error {
          text-align: center;
          color: #7f8c8d;

          .error-icon {
            font-size: 48px;
            margin-bottom: 12px;
          }
        }
      }

      .text-preview,
      .code-preview {
        .text-toolbar,
        .code-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--el-bg-color-overlay);
          border-bottom: 1px solid #e9ecef;

          .code-language {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .text-content,
        .code-content {
          height: 500px;
          overflow: auto;

          .text-pre,
          .code-pre {
            margin: 0;
            padding: 20px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.6;
            background: #fff;
            color: #2c3e50;
            white-space: pre;
            overflow-x: auto;

            &.text-wrap {
              white-space: pre-wrap;
            }
          }

          .code-pre {
            background: var(--el-bg-color-overlay);
            
            code {
              font-family: inherit;
            }
          }

          .text-loading,
          .code-loading {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #7f8c8d;

            .el-icon {
              font-size: 24px;
              margin-bottom: 12px;
            }
          }

          .text-error,
          .code-error {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            color: #7f8c8d;

            .error-icon {
              font-size: 48px;
              margin-bottom: 12px;
            }
          }
        }
      }

      .pdf-preview {
        .pdf-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: var(--el-bg-color-overlay);
          border-bottom: 1px solid #e9ecef;

          .pdf-info {
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }

        .pdf-iframe {
          width: 100%;
          height: 600px;
          border: none;
        }
      }

      .audio-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        background: var(--el-bg-color-overlay);

        .audio-player {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;

          .audio-icon {
            font-size: 64px;
            color: #3498db;
          }

          .audio-element {
            width: 400px;
            max-width: 100%;
          }
        }
      }

      .video-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        background: #000;

        .video-element {
          max-width: 100%;
          max-height: 600px;
        }
      }

      .unsupported-preview {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        background: var(--el-bg-color-overlay);

        .unsupported-content {
          text-align: center;
          color: #7f8c8d;

          .unsupported-icon {
            font-size: 64px;
            margin-bottom: 20px;
            color: #bdc3c7;
          }

          h3 {
            margin: 0 0 12px 0;
            color: var(--el-text-color-primary);
          }

          p {
            margin: 0 0 24px 0;
            color: #7f8c8d;
          }

          .btn-icon {
            margin-right: 8px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .btn-icon {
      margin-right: 6px;
    }
  }
}

// 响应式设�?
@media (max-width: 768px) {
  .file-preview-dialog {
    .preview-container {
      .file-info-header {
        flex-direction: column;
        gap: 16px;
        text-align: center;

        .file-icon-info {
          flex-direction: column;
          text-align: center;
        }

        .file-actions {
          width: 100%;
          justify-content: center;
        }
      }

      .preview-content {
        .audio-preview {
          .audio-player {
            .audio-element {
              width: 100%;
            }
          }
        }
      }
    }
  }
}
</style>