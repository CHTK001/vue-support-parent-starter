<template>
  <div class="sc-upload-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础上传</h3>
        <p class="example-desc">ScUpload 组件基于 Element Plus 的上传组件封装，提供了更便捷的文件上传能力</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>基础文件上传</span>
            </div>
          </template>

          <ScUpload v-model="fileList1" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :limit="5" multiple @success="handleUploadSuccess">
            <template #default>
              <div class="upload-trigger">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" />
                <div class="upload-text">点击或拖拽文件到此处上传</div>
                <div class="upload-tip">支持多个文件同时上传，单个文件不超过10MB</div>
              </div>
            </template>
          </ScUpload>
        </el-card>

        <el-divider content-position="left">代码示例</el-divider>

        <pre><code>
&lt;ScUpload
  v-model="fileList"
  action="https://api.example.com/upload"
  :limit="5"
  multiple
  @success="handleUploadSuccess"
&gt;
  &lt;template #default&gt;
    &lt;div class="upload-trigger"&gt;
      &lt;IconifyIconOnline icon="ri:upload-cloud-2-line" class="upload-icon" /&gt;
      &lt;div class="upload-text"&gt;点击或拖拽文件到此处上传&lt;/div&gt;
      &lt;div class="upload-tip"&gt;支持多个文件同时上传，单个文件不超过10MB&lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScUpload&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="图片上传">
        <h3>图片上传</h3>
        <p class="example-desc">支持图片预览、裁剪等功能</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>图片上传</span>
            </div>
          </template>

          <ScUpload v-model="fileList2" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :limit="9" multiple accept="image/*" list-type="picture-card" @success="handleUploadSuccess">
            <template #default>
              <IconifyIconOnline icon="ri:add-line" class="upload-add-icon" />
            </template>
          </ScUpload>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>图片裁剪上传</span>
            </div>
          </template>

          <ScUpload
            v-model="fileList3"
            action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
            :limit="1"
            accept="image/*"
            list-type="picture-card"
            :image-crop="true"
            :image-crop-options="{
              aspectRatio: 1,
              viewMode: 1,
              autoCropArea: 1,
              movable: true,
              zoomable: true,
              rotatable: true,
            }"
            @success="handleUploadSuccess"
          >
            <template #default>
              <IconifyIconOnline icon="ri:add-line" class="upload-add-icon" />
            </template>
          </ScUpload>
          <div class="crop-info">
            <el-alert title="裁剪提示" type="info" description="选择图片后将自动打开裁剪框，可通过拖拽、缩放、旋转调整图片，点击确认后将上传裁剪后的图片" :closable="false" show-icon></el-alert>
          </div>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>头像上传</span>
            </div>
          </template>

          <div class="avatar-uploader-wrapper">
            <ScUpload
              v-model="fileList4"
              action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
              :limit="1"
              accept="image/*"
              list-type="picture-card"
              :show-file-list="false"
              :image-crop="true"
              :image-crop-options="{
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 1,
              }"
              @success="handleAvatarSuccess"
            >
              <template #default>
                <div v-if="avatarUrl" class="avatar-preview">
                  <img :src="avatarUrl" class="avatar" alt="Avatar" />
                  <div class="avatar-hover">
                    <IconifyIconOnline icon="ri:camera-line" class="avatar-icon" />
                  </div>
                </div>
                <div v-else class="avatar-upload-placeholder">
                  <IconifyIconOnline icon="ri:user-add-line" class="avatar-placeholder-icon" />
                  <span>上传头像</span>
                </div>
              </template>
            </ScUpload>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="自定义上传">
        <h3>自定义上传</h3>
        <p class="example-desc">自定义上传样式、限制和处理方式</p>

        <el-card class="example-card">
          <template #header>
            <div class="card-header">
              <span>自定义按钮样式</span>
            </div>
          </template>

          <ScUpload v-model="fileList5" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :limit="3" :on-exceed="handleExceed" @success="handleUploadSuccess">
            <template #default>
              <el-button type="primary">
                <IconifyIconOnline icon="ri:upload-2-line" />
                点击上传文件
              </el-button>
            </template>
            <template #tip>
              <div class="upload-tip-text">提示：最多上传3个文件，超出数量将被忽略</div>
            </template>
          </ScUpload>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>文件类型限制</span>
            </div>
          </template>

          <ScUpload v-model="fileList6" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" accept=".pdf,.doc,.docx,.xlsx" :limit="5" :before-upload="beforeUpload" @success="handleUploadSuccess">
            <template #default>
              <el-button type="success">
                <IconifyIconOnline icon="ri:file-upload-line" />
                上传文档文件
              </el-button>
            </template>
            <template #tip>
              <div class="upload-tip-text">提示：只能上传PDF、Word和Excel文件，且不超过10MB</div>
            </template>
          </ScUpload>
        </el-card>

        <el-card class="example-card mt-4">
          <template #header>
            <div class="card-header">
              <span>手动上传</span>
            </div>
          </template>

          <ScUpload ref="uploadRef" v-model="fileList7" action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15" :auto-upload="false" multiple :limit="5" @success="handleUploadSuccess">
            <template #default>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="upload-tip-text">提示：选择文件后，点击下方按钮开始上传</div>
            </template>
            <template #file-list-footer>
              <div class="manual-upload-footer">
                <el-button type="success" @click="submitUpload" :disabled="fileList7.length === 0"> 开始上传 </el-button>
                <el-button type="danger" @click="clearFiles" :disabled="fileList7.length === 0"> 清空文件列表 </el-button>
              </div>
            </template>
          </ScUpload>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScUpload 组件 API</h3>

        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="v-model / modelValue">已上传的文件列表，类型: Array</el-descriptions-item>
          <el-descriptions-item label="action">上传的URL，类型: String，必填</el-descriptions-item>
          <el-descriptions-item label="headers">设置上传的请求头部，类型: Object</el-descriptions-item>
          <el-descriptions-item label="multiple">是否支持多选文件，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="data">上传时附带的额外参数，类型: Object</el-descriptions-item>
          <el-descriptions-item label="name">上传的文件字段名，类型: String，默认: file</el-descriptions-item>
          <el-descriptions-item label="with-credentials">支持发送 cookie 凭证信息，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="accept">接受上传的文件类型，类型: String</el-descriptions-item>
          <el-descriptions-item label="limit">最大允许上传个数，类型: Number</el-descriptions-item>
          <el-descriptions-item label="file-size">文件大小限制（单位：MB），类型: Number</el-descriptions-item>
          <el-descriptions-item label="list-type">文件列表的类型，类型: String，可选值: text/picture/picture-card，默认: text</el-descriptions-item>
          <el-descriptions-item label="auto-upload">是否在选取文件后立即进行上传，类型: Boolean，默认: true</el-descriptions-item>
          <el-descriptions-item label="drag">是否启用拖拽上传，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="disabled">是否禁用，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="image-crop">是否启用图片裁剪功能，类型: Boolean，默认: false</el-descriptions-item>
          <el-descriptions-item label="image-crop-options">图片裁剪配置项，类型: Object</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="submit">手动上传文件列表</el-descriptions-item>
          <el-descriptions-item label="clearFiles">清空已上传的文件列表</el-descriptions-item>
          <el-descriptions-item label="abort">取消上传请求</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="success">文件上传成功时的钩子，参数: response, file, fileList</el-descriptions-item>
          <el-descriptions-item label="error">文件上传失败时的钩子，参数: error, file, fileList</el-descriptions-item>
          <el-descriptions-item label="progress">文件上传时的钩子，参数: event, file, fileList</el-descriptions-item>
          <el-descriptions-item label="change">文件状态改变时的钩子，参数: file, fileList</el-descriptions-item>
          <el-descriptions-item label="exceed">文件超出个数限制时的钩子，参数: files, fileList</el-descriptions-item>
          <el-descriptions-item label="crop-success">图片裁剪成功时的钩子，参数: blob, cropData</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">插槽</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="default">自定义上传触发区域内容</el-descriptions-item>
          <el-descriptions-item label="tip">提示说明文字</el-descriptions-item>
          <el-descriptions-item label="file">自定义文件列表项</el-descriptions-item>
          <el-descriptions-item label="file-list-footer">文件列表底部内容，一般用于手动上传场景</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 基础上传
const fileList1 = ref([]);

// 图片上传
const fileList2 = ref([]);

// 图片裁剪上传
const fileList3 = ref([]);

// 头像上传
const fileList4 = ref([]);
const avatarUrl = ref("");

// 自定义按钮样式上传
const fileList5 = ref([]);

// 文件类型限制上传
const fileList6 = ref([]);

// 手动上传
const fileList7 = ref([]);
const uploadRef = ref(null);

// 上传成功处理函数
const handleUploadSuccess = (response, file, fileList) => {
  ElMessage.success(`文件 ${file.name} 上传成功`);
};

// 头像上传成功处理函数
const handleAvatarSuccess = (response, file) => {
  avatarUrl.value = URL.createObjectURL(file.raw);
  ElMessage.success("头像上传成功");
};

// 超出限制处理函数
const handleExceed = (files, fileList) => {
  ElMessage.warning(`当前限制选择 3 个文件，本次选择了 ${files.length} 个文件，共选择了 ${files.length + fileList.length} 个文件`);
};

// 上传前检查文件
const beforeUpload = (file) => {
  const isDoc =
    file.type === "application/pdf" || file.type === "application/msword" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.type === "application/vnd.ms-excel" || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  const isLt10M = file.size / 1024 / 1024 < 10;

  if (!isDoc) {
    ElMessage.error("只能上传PDF、Word或Excel文件!");
    return false;
  }

  if (!isLt10M) {
    ElMessage.error("文件大小不能超过10MB!");
    return false;
  }

  return true;
};

// 手动提交上传
const submitUpload = () => {
  if (fileList7.value.length === 0) {
    ElMessage.warning("请先选择要上传的文件");
    return;
  }

  uploadRef.value.submit();
  ElMessage.info("开始上传文件");
};

// 清空文件列表
const clearFiles = () => {
  ElMessageBox.confirm("确定要清空文件列表吗?", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      uploadRef.value.clearFiles();
      ElMessage.success("文件列表已清空");
    })
    .catch(() => {});
};
</script>

<style lang="scss" scoped>
.sc-upload-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .example-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 30px 0;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
    }

    .upload-icon {
      font-size: 42px;
      color: #8c939d;
      margin-bottom: 16px;
    }

    .upload-text {
      font-size: 16px;
      color: #606266;
      margin-bottom: 8px;
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }

  .upload-add-icon {
    font-size: 28px;
    color: #8c939d;
  }

  .crop-info {
    margin-top: 16px;
  }

  .avatar-uploader-wrapper {
    text-align: center;

    .avatar-preview {
      width: 148px;
      height: 148px;
      border-radius: 50%;
      position: relative;
      overflow: hidden;

      .avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-hover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s;

        .avatar-icon {
          font-size: 32px;
          color: #fff;
        }
      }

      &:hover .avatar-hover {
        opacity: 1;
      }
    }

    .avatar-upload-placeholder {
      width: 148px;
      height: 148px;
      border-radius: 50%;
      background-color: #f5f7fa;
      border: 1px dashed #d9d9d9;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: border-color 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
      }

      .avatar-placeholder-icon {
        font-size: 32px;
        color: #8c939d;
        margin-bottom: 8px;
      }

      span {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .upload-tip-text {
    font-size: 12px;
    color: #909399;
    margin-top: 8px;
  }

  .manual-upload-footer {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
