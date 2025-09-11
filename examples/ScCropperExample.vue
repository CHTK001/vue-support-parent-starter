<template>
  <div class="sc-cropper-example">
    <h1>ScCropper 组件示例</h1>
    <p>ScCropper 是一个基于 cropperjs 的图像裁剪组件，支持图像裁剪、预览和多种导出格式。</p>

    <!-- 基础用法 -->
    <div class="example-section">
      <h2>基础用法</h2>
      <p>最简单的图像裁剪功能，支持拖拽和缩放。</p>
      <div class="example-demo">
        <div class="upload-area">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleImageUpload"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将图片拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 jpg/png/gif 格式的图片文件
              </div>
            </template>
          </el-upload>
        </div>
        
        <div v-if="currentImage" class="cropper-container">
          <ScCropper 
            ref="cropperRef" 
            :src="currentImage" 
            :compress="0.8"
          />
          
          <div class="cropper-actions">
            <el-button type="primary" @click="getCroppedImage">获取裁剪结果</el-button>
            <el-button @click="downloadCroppedImage">下载图片</el-button>
            <el-button @click="resetImage">重置</el-button>
          </div>
        </div>
        
        <div v-if="croppedResult" class="result-preview">
          <h4>裁剪结果：</h4>
          <img :src="croppedResult" alt="裁剪结果" class="result-image" />
        </div>
      </div>
    </div>

    <!-- 固定比例裁剪 -->
    <div class="example-section">
      <h2>固定比例裁剪</h2>
      <p>设置固定的裁剪比例，适用于头像、封面等场景。</p>
      <div class="example-demo">
        <div class="ratio-controls">
          <el-radio-group v-model="selectedRatio" @change="handleRatioChange">
            <el-radio-button :label="1">1:1 (正方形)</el-radio-button>
            <el-radio-button :label="16/9">16:9 (宽屏)</el-radio-button>
            <el-radio-button :label="4/3">4:3 (标准)</el-radio-button>
            <el-radio-button :label="3/4">3:4 (竖屏)</el-radio-button>
            <el-radio-button :label="NaN">自由比例</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="upload-area">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleRatioImageUpload"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              上传图片进行固定比例裁剪
            </div>
          </el-upload>
        </div>
        
        <div v-if="ratioImage" class="cropper-container">
          <ScCropper 
            ref="ratioCropperRef" 
            :src="ratioImage" 
            :aspect-ratio="selectedRatio"
            :compress="0.9"
          />
          
          <div class="cropper-actions">
            <el-button type="primary" @click="getRatioCroppedImage">获取裁剪结果</el-button>
            <el-button @click="downloadRatioCroppedImage">下载图片</el-button>
          </div>
        </div>
        
        <div v-if="ratioCroppedResult" class="result-preview">
          <h4>裁剪结果：</h4>
          <img :src="ratioCroppedResult" alt="裁剪结果" class="result-image" />
        </div>
      </div>
    </div>

    <!-- 多种导出格式 -->
    <div class="example-section">
      <h2>多种导出格式</h2>
      <p>支持导出为 DataURL、Blob 或 File 格式。</p>
      <div class="example-demo">
        <div class="upload-area">
          <el-upload
            class="upload-demo"
            drag
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleExportImageUpload"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              上传图片测试导出功能
            </div>
          </el-upload>
        </div>
        
        <div v-if="exportImage" class="cropper-container">
          <ScCropper 
            ref="exportCropperRef" 
            :src="exportImage" 
            :compress="compressionQuality"
          />
          
          <div class="export-controls">
            <el-form :model="exportForm" label-width="120px">
              <el-form-item label="压缩质量：">
                <el-slider 
                  v-model="compressionQuality" 
                  :min="0.1" 
                  :max="1" 
                  :step="0.1"
                  show-input
                />
              </el-form-item>
              <el-form-item label="导出格式：">
                <el-select v-model="exportForm.format">
                  <el-option label="JPEG" value="image/jpeg" />
                  <el-option label="PNG" value="image/png" />
                  <el-option label="WebP" value="image/webp" />
                </el-select>
              </el-form-item>
              <el-form-item label="输出尺寸：">
                <el-input-number v-model="exportForm.width" placeholder="宽度" style="width: 120px" />
                <span style="margin: 0 10px">×</span>
                <el-input-number v-model="exportForm.height" placeholder="高度" style="width: 120px" />
              </el-form-item>
            </el-form>
          </div>
          
          <div class="cropper-actions">
            <el-button type="primary" @click="exportAsDataURL">导出为 DataURL</el-button>
            <el-button type="success" @click="exportAsBlob">导出为 Blob</el-button>
            <el-button type="warning" @click="exportAsFile">导出为 File</el-button>
          </div>
        </div>
        
        <div v-if="exportResults.length > 0" class="export-results">
          <h4>导出结果：</h4>
          <div class="result-list">
            <div v-for="(result, index) in exportResults" :key="index" class="result-item">
              <div class="result-info">
                <strong>{{ result.type }}</strong>
                <span>格式: {{ result.format }}</span>
                <span>大小: {{ result.size }}</span>
              </div>
              <img v-if="result.preview" :src="result.preview" alt="预览" class="result-thumbnail" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 头像裁剪示例 -->
    <div class="example-section">
      <h2>头像裁剪示例</h2>
      <p>专门用于头像裁剪的示例，固定1:1比例。</p>
      <div class="example-demo">
        <div class="avatar-upload">
          <el-upload
            class="avatar-uploader"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/*"
            @change="handleAvatarUpload"
          >
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="avatar-tip">点击上传头像</div>
        </div>
        
        <div v-if="avatarImage" class="avatar-cropper">
          <ScCropper 
            ref="avatarCropperRef" 
            :src="avatarImage" 
            :aspect-ratio="1"
            :compress="0.8"
          />
          
          <div class="cropper-actions">
            <el-button type="primary" @click="confirmAvatar">确认头像</el-button>
            <el-button @click="cancelAvatar">取消</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h2>API 文档</h2>
      
      <h3>Props</h3>
      <el-table :data="propsData" border>
        <el-table-column prop="name" label="参数" width="150" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="default" label="默认值" width="150" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3>Methods</h3>
      <el-table :data="methodsData" border>
        <el-table-column prop="name" label="方法名" width="200" />
        <el-table-column prop="params" label="参数" width="300" />
        <el-table-column prop="description" label="说明" />
      </el-table>

      <h3>使用说明</h3>
      <div class="usage-notes">
        <ul>
          <li>组件基于 cropperjs 库实现，提供了丰富的图像裁剪功能</li>
          <li>支持拖拽移动、缩放、旋转等操作</li>
          <li>可以设置固定的裁剪比例，适用于不同场景</li>
          <li>支持多种导出格式：DataURL、Blob、File</li>
          <li>可以自定义压缩质量和输出尺寸</li>
          <li>适用于头像裁剪、图片编辑等场景</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, Plus } from '@element-plus/icons-vue'
import ScCropper from '../packages/components/ScCropper/index.vue'

// 基础用法
const cropperRef = ref()
const currentImage = ref('')
const croppedResult = ref('')

// 固定比例裁剪
const ratioCropperRef = ref()
const selectedRatio = ref(1)
const ratioImage = ref('')
const ratioCroppedResult = ref('')

// 多种导出格式
const exportCropperRef = ref()
const exportImage = ref('')
const compressionQuality = ref(0.8)
const exportForm = reactive({
  format: 'image/jpeg',
  width: null,
  height: null
})
const exportResults = ref([])

// 头像裁剪
const avatarCropperRef = ref()
const avatarImage = ref('')
const avatarUrl = ref('')

// API 文档数据
const propsData = [
  {
    name: 'src',
    type: 'String',
    default: '""',
    description: '图片源地址'
  },
  {
    name: 'compress',
    type: 'Number',
    default: '1',
    description: '压缩质量，范围 0-1'
  },
  {
    name: 'aspectRatio',
    type: 'Number',
    default: 'NaN',
    description: '裁剪比例，NaN 表示自由比例'
  }
]

const methodsData = [
  {
    name: 'setAspectRatio',
    params: 'aspectRatio: number',
    description: '设置裁剪比例'
  },
  {
    name: 'getCropData',
    params: 'callback: function, type?: string, options?: object',
    description: '获取裁剪后的 DataURL'
  },
  {
    name: 'getCropBlob',
    params: 'callback: function, type?: string, options?: object',
    description: '获取裁剪后的 Blob 对象'
  },
  {
    name: 'getCropFile',
    params: 'callback: function, fileName?: string, type?: string, options?: object',
    description: '获取裁剪后的 File 对象'
  }
]

// 方法
const handleImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    currentImage.value = e.target.result
    croppedResult.value = ''
  }
  reader.readAsDataURL(file.raw)
}

const getCroppedImage = () => {
  if (!cropperRef.value) return
  
  cropperRef.value.getCropData((dataURL) => {
    croppedResult.value = dataURL
    ElMessage.success('裁剪成功！')
  })
}

const downloadCroppedImage = () => {
  if (!cropperRef.value) return
  
  cropperRef.value.getCropData((dataURL) => {
    const link = document.createElement('a')
    link.download = 'cropped-image.jpg'
    link.href = dataURL
    link.click()
    ElMessage.success('下载成功！')
  })
}

const resetImage = () => {
  currentImage.value = ''
  croppedResult.value = ''
}

const handleRatioChange = () => {
  if (ratioCropperRef.value) {
    ratioCropperRef.value.setAspectRatio(selectedRatio.value)
  }
}

const handleRatioImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    ratioImage.value = e.target.result
    ratioCroppedResult.value = ''
  }
  reader.readAsDataURL(file.raw)
}

const getRatioCroppedImage = () => {
  if (!ratioCropperRef.value) return
  
  ratioCropperRef.value.getCropData((dataURL) => {
    ratioCroppedResult.value = dataURL
    ElMessage.success('裁剪成功！')
  })
}

const downloadRatioCroppedImage = () => {
  if (!ratioCropperRef.value) return
  
  ratioCropperRef.value.getCropData((dataURL) => {
    const link = document.createElement('a')
    link.download = `cropped-${selectedRatio.value.toFixed(2)}-ratio.jpg`
    link.href = dataURL
    link.click()
    ElMessage.success('下载成功！')
  })
}

const handleExportImageUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    exportImage.value = e.target.result
    exportResults.value = []
  }
  reader.readAsDataURL(file.raw)
}

const exportAsDataURL = () => {
  if (!exportCropperRef.value) return
  
  const options = {}
  if (exportForm.width) options.width = exportForm.width
  if (exportForm.height) options.height = exportForm.height
  
  exportCropperRef.value.getCropData((dataURL) => {
    const size = Math.round((dataURL.length * 3) / 4 / 1024) + ' KB'
    exportResults.value.unshift({
      type: 'DataURL',
      format: exportForm.format,
      size: size,
      preview: dataURL,
      data: dataURL
    })
    ElMessage.success('导出 DataURL 成功！')
  }, exportForm.format, options)
}

const exportAsBlob = () => {
  if (!exportCropperRef.value) return
  
  const options = {}
  if (exportForm.width) options.width = exportForm.width
  if (exportForm.height) options.height = exportForm.height
  
  exportCropperRef.value.getCropBlob((blob) => {
    const size = Math.round(blob.size / 1024) + ' KB'
    const url = URL.createObjectURL(blob)
    exportResults.value.unshift({
      type: 'Blob',
      format: exportForm.format,
      size: size,
      preview: url,
      data: blob
    })
    ElMessage.success('导出 Blob 成功！')
  }, exportForm.format, options)
}

const exportAsFile = () => {
  if (!exportCropperRef.value) return
  
  const options = {}
  if (exportForm.width) options.width = exportForm.width
  if (exportForm.height) options.height = exportForm.height
  
  const fileName = `cropped-image.${exportForm.format.split('/')[1]}`
  
  exportCropperRef.value.getCropFile((file) => {
    const size = Math.round(file.size / 1024) + ' KB'
    const url = URL.createObjectURL(file)
    exportResults.value.unshift({
      type: 'File',
      format: exportForm.format,
      size: size,
      preview: url,
      data: file
    })
    ElMessage.success('导出 File 成功！')
  }, fileName, exportForm.format, options)
}

const handleAvatarUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarImage.value = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const confirmAvatar = () => {
  if (!avatarCropperRef.value) return
  
  avatarCropperRef.value.getCropData((dataURL) => {
    avatarUrl.value = dataURL
    avatarImage.value = ''
    ElMessage.success('头像设置成功！')
  })
}

const cancelAvatar = () => {
  avatarImage.value = ''
}
</script>

<style scoped>
.sc-cropper-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
}

.example-section h2 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 18px;
}

.example-section h3 {
  color: #606266;
  margin: 20px 0 10px 0;
  font-size: 16px;
}

.example-section p {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.example-demo {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-demo {
  width: 100%;
}

.cropper-container {
  margin: 20px 0;
}

.cropper-actions {
  margin-top: 15px;
  text-align: center;
}

.cropper-actions .el-button {
  margin: 0 5px;
}

.result-preview {
  margin-top: 20px;
  text-align: center;
}

.result-preview h4 {
  margin-bottom: 10px;
  color: #606266;
}

.result-image {
  max-width: 300px;
  max-height: 300px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.ratio-controls {
  margin-bottom: 20px;
}

.export-controls {
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
}

.export-results {
  margin-top: 20px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.result-info strong {
  color: #409eff;
}

.result-info span {
  font-size: 12px;
  color: #909399;
}

.result-thumbnail {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.avatar-upload {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  display: inline-block;
}

.avatar-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 0.2s;
}

.avatar-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  line-height: 120px;
  text-align: center;
}

.avatar {
  width: 120px;
  height: 120px;
  display: block;
  object-fit: cover;
}

.avatar-tip {
  margin-top: 10px;
  font-size: 12px;
  color: #606266;
}

.avatar-cropper {
  margin-top: 20px;
}

.usage-notes {
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.usage-notes ul {
  margin: 0;
  padding-left: 20px;
}

.usage-notes li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-cropper-example {
    padding: 10px;
  }
  
  .example-section {
    padding: 15px;
  }
  
  .example-demo {
    padding: 15px;
  }
  
  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .result-thumbnail {
    align-self: center;
  }
}
</style>