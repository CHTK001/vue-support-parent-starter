<template>
  <div class="sc-upload-example">
    <!-- 基础用法 -->
    <DemoBlock title="基础用法" :code="codes.basic">
      <p class="demo-tip">点击上传图片，支持预览和删除。v-model 返回上传后的图片URL</p>
      <div class="demo-row">
        <ScUpload v-model="url1" />
      </div>
      <div class="demo-result">v-model: {{ url1 || '(未上传)' }}</div>
    </DemoBlock>

    <!-- 不自动上传 -->
    <DemoBlock title="不自动上传" :code="codes.noAutoUpload">
      <p class="demo-tip">设置 :auto-upload="false"，选择文件后不会自动上传，需手动调用 submit()</p>
      <div class="demo-row">
        <ScUpload ref="manualUploadRef" v-model="url2" :auto-upload="false" @handleFile="handleFileSelect" />
        <el-button type="primary" @click="handleManualUpload">手动上传</el-button>
      </div>
      <div class="demo-result">选择的文件: {{ selectedFile?.name || '(未选择)' }}</div>
    </DemoBlock>

    <!-- 自定义尺寸 -->
    <DemoBlock title="自定义尺寸" :code="codes.size">
      <div class="demo-row">
        <ScUpload v-model="url3" :width="100" :height="100" title="小" />
        <ScUpload v-model="url4" :width="200" :height="200" title="大" />
      </div>
    </DemoBlock>

    <!-- 圆形上传 -->
    <DemoBlock title="圆形（头像上传）" :code="codes.round">
      <p class="demo-tip">设置 round 属性实现圆形上传框，适合头像</p>
      <div class="demo-row">
        <ScUpload v-model="url5" round :width="120" :height="120" />
      </div>
    </DemoBlock>

    <!-- 图片裁剪 -->
    <DemoBlock title="图片裁剪" :code="codes.cropper">
      <p class="demo-tip">启用 cropper 属性，上传前可裁剪图片。可设置 aspectRatio 固定裁剪比例</p>
      <div class="demo-row">
        <ScUpload v-model="url6" cropper :aspect-ratio="1" title="1:1裁剪" />
        <ScUpload v-model="url7" cropper :aspect-ratio="16/9" title="16:9裁剪" />
        <ScUpload v-model="url8" cropper title="自由裁剪" />
      </div>
    </DemoBlock>

    <!-- Ctrl+V 粘贴上传 -->
    <DemoBlock title="粘贴上传" :code="codes.paste">
      <p class="demo-tip">支持 Ctrl+V 粘贴图片直接上传（默认启用）</p>
      <div class="demo-row">
        <ScUpload v-model="url9" :enable-paste="true" title="粘贴上传" />
      </div>
    </DemoBlock>

    <!-- 限制文件类型 -->
    <DemoBlock title="限制文件类型" :code="codes.accept">
      <p class="demo-tip">通过 accept 属性限制可上传的文件类型</p>
      <div class="demo-row">
        <ScUpload v-model="url10" accept="image/png" title="仅PNG" />
        <ScUpload v-model="url11" accept="image/jpeg, image/jpg" title="仅JPG" />
        <ScUpload v-model="url12" accept="image/gif, image/webp" title="GIF/WebP" />
      </div>
    </DemoBlock>

    <!-- 限制文件大小 -->
    <DemoBlock title="限制文件大小" :code="codes.maxSize">
      <p class="demo-tip">通过 maxSize 属性限制上传文件大小（单位MB）</p>
      <div class="demo-row">
        <ScUpload v-model="url13" :max-size="1" title="最大1MB" />
        <ScUpload v-model="url14" :max-size="5" title="最大5MB" />
      </div>
    </DemoBlock>

    <!-- 自定义图标和文字 -->
    <DemoBlock title="自定义图标和文字" :code="codes.custom">
      <div class="demo-row">
        <ScUpload v-model="url15" icon="ep:upload" title="上传封面" />
        <ScUpload v-model="url16" icon="ep:picture" title="上传图片" />
        <ScUpload v-model="url17" icon="ep:avatar" title="上传头像" />
      </div>
    </DemoBlock>

    <!-- 禁用状态 -->
    <DemoBlock title="禁用状态" :code="codes.disabled">
      <div class="demo-row">
        <ScUpload v-model="url18" disabled />
      </div>
    </DemoBlock>

    <!-- 事件监听 -->
    <DemoBlock title="事件监听" :code="codes.events">
      <p class="demo-tip">支持 @handleSuccess、@handleRemove、@handleFile 等事件</p>
      <div class="demo-row">
        <ScUpload 
          v-model="url19" 
          @handleSuccess="onSuccess"
          @handleRemove="onRemove"
          @handleFile="onFileChange"
        />
      </div>
      <div class="demo-result">事件日志: {{ eventLog }}</div>
    </DemoBlock>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import ScUpload from "@repo/components/ScUpload/index.vue";
import DemoBlock from "./DemoBlock.vue";

/**
 * ScUpload 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
 */

const url1 = ref("");
const url2 = ref("");
const url3 = ref("");
const url4 = ref("");
const url5 = ref("");
const url6 = ref("");
const url7 = ref("");
const url8 = ref("");
const url9 = ref("");
const url10 = ref("");
const url11 = ref("");
const url12 = ref("");
const url13 = ref("");
const url14 = ref("");
const url15 = ref("");
const url16 = ref("");
const url17 = ref("");
const url18 = ref("https://picsum.photos/200");
const url19 = ref("");

const manualUploadRef = ref();
const selectedFile = ref<any>(null);
const eventLog = ref("(等待事件...)");

// 手动上传
const handleFileSelect = (file: any) => {
  selectedFile.value = file;
};

const handleManualUpload = () => {
  if (manualUploadRef.value) {
    manualUploadRef.value.submit();
    ElMessage.success("开始上传");
  }
};

// 事件处理
const onSuccess = (res: any) => {
  eventLog.value = `上传成功: ${JSON.stringify(res).slice(0, 50)}...`;
};

const onRemove = () => {
  eventLog.value = "图片已删除";
};

const onFileChange = (file: any) => {
  eventLog.value = `选择文件: ${file?.name || 'unknown'}`;
};

// 代码模板
const codes = {
  basic: `<ScUpload v-model="imageUrl" />

<script setup>
import { ref } from "vue";
// v-model 绑定上传后的图片URL
const imageUrl = ref("");
<\/script>`,

  noAutoUpload: `<!-- 不自动上传，手动控制 -->
<ScUpload 
  ref="uploadRef" 
  v-model="url" 
  :auto-upload="false"
  @handleFile="handleFileSelect"
/>
<el-button @click="uploadRef.submit()">手动上传</el-button>

<script setup>
const uploadRef = ref();
const handleFileSelect = (file) => {
  console.log('选择的文件:', file);
};
<\/script>`,

  size: `<!-- 自定义尺寸 -->
<ScUpload v-model="url" :width="100" :height="100" title="小" />
<ScUpload v-model="url" :width="200" :height="200" title="大" />`,

  round: `<!-- 圆形头像上传 -->
<ScUpload v-model="avatar" round :width="120" :height="120" />`,

  cropper: `<!-- 启用裁剪 -->
<ScUpload v-model="url" cropper :aspect-ratio="1" />
<!-- 自由裁剪 -->
<ScUpload v-model="url" cropper />
<!-- 16:9 比例裁剪 -->
<ScUpload v-model="url" cropper :aspect-ratio="16/9" />`,

  paste: `<!-- 支持 Ctrl+V 粘贴上传（默认启用） -->
<ScUpload v-model="url" :enable-paste="true" />
<!-- 禁用粘贴 -->
<ScUpload v-model="url" :enable-paste="false" />`,

  accept: `<!-- 限制文件类型 -->
<ScUpload v-model="url" accept="image/png" title="仅PNG" />
<ScUpload v-model="url" accept="image/jpeg, image/jpg" title="仅JPG" />
<ScUpload v-model="url" accept="image/gif, image/webp" title="GIF/WebP" />
<!-- 所有图片类型（默认） -->
<ScUpload v-model="url" accept="image/*" />`,

  maxSize: `<!-- 限制文件大小（单位MB） -->
<ScUpload v-model="url" :max-size="1" title="最大1MB" />
<ScUpload v-model="url" :max-size="5" title="最大5MB" />`,

  custom: `<!-- 自定义图标和文字 -->
<ScUpload v-model="url" icon="ep:upload" title="上传封面" />
<ScUpload v-model="url" icon="ep:picture" title="上传图片" />
<ScUpload v-model="url" icon="ep:avatar" title="上传头像" />`,

  disabled: `<!-- 禁用状态 -->
<ScUpload v-model="url" disabled />`,

  events: `<!-- 事件监听 -->
<ScUpload 
  v-model="url" 
  @handleSuccess="onSuccess"
  @handleRemove="onRemove"
  @handleFile="onFileChange"
/>

<script setup>
const onSuccess = (res) => console.log('上传成功', res);
const onRemove = () => console.log('图片已删除');
const onFileChange = (file) => console.log('选择文件', file);
<\/script>`
};
</script>

<style scoped lang="scss">
.sc-upload-example {
  padding: 20px;
}

.demo-row {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.demo-tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.demo-result {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  word-break: break-all;
}
</style>
