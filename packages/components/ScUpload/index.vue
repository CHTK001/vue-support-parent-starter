<template>
  <div class="sc-upload" :class="{ 'sc-upload-round': round }" :style="style">
    <div v-if="file && file.status != 'success'" class="sc-upload__uploading">
      <div v-if="autoUpload" class="sc-upload__progress">
        <el-progress :percentage="file.percentage" :text-inside="true" :stroke-width="16" />
      </div>
      <!-- 图片文件显示预览 -->
      <el-image v-if="file.isImage || isImageFile(file.raw?.type)" class="image" :src="file.tempFile" fit="cover" />
      <!-- 非图片文件显示文件图标 -->
      <div v-else class="sc-upload__file-preview">
        <el-icon class="file-icon"><component :is="useRenderIcon('ep:document')" /></el-icon>
        <span class="file-name">{{ file.name }}</span>
      </div>
      <div class="sc-upload__img-actions always">
        <span class="del" @click="handleRemove()">
          <el-icon><component :is="useRenderIcon('ep:delete')" /></el-icon>
        </span>
      </div>
    </div>
    <div v-if="file && file.status == 'success'" class="sc-upload__img">
      <!-- 图片文件显示预览 -->
      <template v-if="file.isImage || isImageFile(file.raw?.type) || isImageUrl(file.url)">
        <el-image class="image" :src="file.url" :preview-src-list="[file.url]" fit="cover" hide-on-click-modal append-to-body :z-index="9999">
          <template #placeholder>
            <div class="sc-upload__img-slot">Loading...</div>
          </template>
          <template #error>
            <img class="image" :src="file.tempFile" fit="cover">
          </template>
        </el-image>
      </template>
      <!-- 非图片文件显示文件信息 -->
      <div v-else class="sc-upload__file-preview">
        <el-icon class="file-icon"><component :is="useRenderIcon('ep:document')" /></el-icon>
        <span class="file-name">{{ file.name || '文件已上传' }}</span>
      </div>
      <div v-if="!disabled" class="sc-upload__img-actions">
        <span class="del" @click="handleRemove()">
          <el-icon><component :is="useRenderIcon('ep:delete')" /></el-icon>
        </span>
      </div>
    </div>
    <el-upload
      v-show="!file"
      ref="uploader"
      class="uploader"
      :auto-upload="cropper ? false : autoUpload"
      :disabled="disabled"
      :show-file-list="showFileList"
      :action="action"
      :name="name"
      :data="data"
      :accept="accept"
      :limit="1"
      :http-request="request"
      :on-change="change"
      :before-upload="before"
      :on-success="success"
      :on-error="error"
      :on-exceed="handleExceed"
    >
      <slot>
        <div class="el-upload--picture-card">
          <div class="file-empty">
            <el-icon>
              <component :is="useRenderIcon(icon)" />
            </el-icon>
            <h4 v-if="title">{{ title }}</h4>
          </div>
        </div>
      </slot>
    </el-upload>
    <span style="display: none !important">
      <el-input v-model="value" />
    </span>
    <sc-dialog :append-to-body="true" v-model="cropperDialogVisible" title="剪裁" draggable :width="680" destroy-on-close @closed="cropperClosed">
      <sc-cropper ref="cropper" :src="cropperFile.tempCropperFile" :compress="compress" :aspectRatio="aspectRatio" />
      <template #footer>
        <el-button @click="cropperDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="cropperSave">确 定</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { genFileId } from "element-plus";
import { useRenderIcon } from "../ReIcon/src/hooks";

const scCropper = defineAsyncComponent(() => import("../scCropper/index.vue"));
import {config, parseData} from "./setting";
import { getConfig } from "@repo/config";
import { formatFilePath } from "@repo/utils";

export default {
  components: {
    scCropper
  },
  props: {
    modelValue: { type: String, default: "" },
    height: { type: Number, default: 148 },
    width: { type: Number, default: 148 },
    title: { type: String, default: "" },
    urlPrefix: { type: String, default: "" },
    icon: { type: String, default: "ep:plus" },
    action: { type: String, default: "" },
    apiObj: { type: Object, default: () => {} },
    name: { type: String, default: config.filename },
    data: { type: Object, default: () => {} },
    accept: { type: String, default: "image/gif, image/jpeg, image/png, image/jpg,, image/webp" },
    maxSize: { type: Number, default: config.maxSizeFile },
    limit: { type: Number, default: 1 },
    autoUpload: { type: Boolean, default: true },
    showFileList: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    round: { type: Boolean, default: false },
    onSuccess: {
      type: Function,
      default: () => {
        return true;
      }
    },
    cropperAutoUpload: { type: Boolean, default: true },
    cropper: { type: Boolean, default: false },
    compress: { type: Number, default: 1 },
    aspectRatio: { type: Number, default: NaN },
    enablePaste: { type: Boolean, default: true },
    enableDrag: { type: Boolean, default: true },
    placeholder: { type: String, default: '点击或拖拽上传图片，支持 Ctrl+V 粘贴' }
  },
  data() {
    return {
      value: "",
      file: null,
      style: {
        width: this.width + "px",
        height: this.height + "px"
      },
      cropperDialogVisible: false,
      cropperFile: null,
      // 缓存 OssAddress 避免重复调用 getConfig()
      cachedOssAddress: getConfig().OssAddress || ''
    };
  },
  watch: {
    modelValue(val) {
      this.value = val;
      this.newFile(val);
    },
    value(val) {
      this.$emit("update:modelValue", val);
    },
    file(val) {
      this.$emit("handleFile", val);
      this.$emit("handlerFile", val);
    }
  },
  mounted() {
    this.value = this.modelValue;
    this.newFile(this.modelValue);
    // 添加粘贴事件监听
    if (this.enablePaste) {
      document.addEventListener('paste', this.handlePaste);
    }
  },
  beforeUnmount() {
    // 移除粘贴事件监听
    if (this.enablePaste) {
      document.removeEventListener('paste', this.handlePaste);
    }
  },
  methods: {

    useRenderIcon,
    newFile(url) {
      if (url) {
        this.file = {
          status: "success",
          url: formatFilePath(this.urlPrefix || this.cachedOssAddress, (url?.tempFile || url))
        };
      } else {
        this.file = null;
      }
    },
    cropperSave() {
      this.$refs.cropper.getCropFile(
        file => {
          file.uid = this.cropperFile.uid;
          this.cropperFile.raw = file;

          this.file = this.cropperFile;
          this.file.tempFile = URL.createObjectURL(this.file.raw);
          if (this.cropperAutoUpload) {
            this.$refs.uploader.submit();
          }
        },
        this.cropperFile.name,
        this.cropperFile.type
      );
      this.cropperDialogVisible = false;
    },
    cropperClosed() {
      URL.revokeObjectURL(this.cropperFile.tempCropperFile);
      delete this.cropperFile.tempCropperFile;
    },
    handleRemove() {
      this.clearFiles();
      this.$emit("handleRemove");
      this.$emit("handlerRemove");
    },
    clearFiles() {
      URL.revokeObjectURL(this.file?.tempFile);
      this.value = "";
      this.file = null;
      this.$nextTick(() => {
        this.$refs.uploader.clearFiles();
      });
    },
    change(file, files) {
      if (files.length > 1) {
        files.splice(0, 1);
      }
      
      // 先验证文件格式
      if (file.status == "ready") {
        var acceptIncludes = true;
        if (this.accept !== "*/*") {
          acceptIncludes = this.accept.replace(/\s/g, "").split(",").includes(file.raw.type);
        }
        
        if (!acceptIncludes) {
          this.$notify.warning({
            title: "上传文件警告",
            message: "选择的文件格式不支持"
          });
          // 格式不匹配时不占用组件位置，直接清除
          this.$nextTick(() => {
            this.$refs.uploader.clearFiles();
          });
          return false;
        }
        
        // 检查文件大小
        const maxSize = file.raw.size / 1024 / 1024 < this.maxSize;
        if (!maxSize) {
          this.$message.warning(`上传文件大小不能超过 ${this.maxSize}MB!`);
          this.$nextTick(() => {
            this.$refs.uploader.clearFiles();
          });
          return false;
        }
      }
      
      if (this.cropper && file.status == "ready") {
        const acceptIncludes = ["image/gif", "image/jpeg", "image/png"].includes(file.raw.type);
        if (!acceptIncludes) {
          this.$notify.warning({
            title: "上传文件警告",
            message: "选择的文件非图像类文件"
          });
          return false;
        }
        this.cropperFile = file;
        this.value = file;
        this.cropperFile.tempCropperFile = URL.createObjectURL(file.raw);
        this.cropperDialogVisible = true;
        return false;
      }
      this.value = file;
      this.file = file;
      if (file.status == "ready") {
        file.tempFile = URL.createObjectURL(file.raw);
        // 判断是否是图片文件，设置图片预览标志
        file.isImage = this.isImageFile(file.raw.type);
      }
    },
    // 判断是否是图片文件
    isImageFile(type) {
      return type && type.startsWith('image/');
    },
    // 判断URL是否是图片
    isImageUrl(url) {
      if (!url) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico'];
      const lowerUrl = url.toLowerCase();
      return imageExtensions.some(ext => lowerUrl.includes(ext));
    },
    before(file) {
      var acceptIncludes = !0;
      if (this.accept !== "*/*") {
        acceptIncludes = this.accept.replace(/\s/g, "").split(",").includes(file.type);
      }

      if (!acceptIncludes) {
        this.$notify.warning({
          title: "上传文件警告",
          message: "选择的文件非图像类文件"
        });
        this.clearFiles();
        return false;
      }
      const maxSize = file.size / 1024 / 1024 < this.maxSize;
      if (!maxSize) {
        this.$message.warning(`上传文件大小不能超过 ${this.maxSize}MB!`);
        this.clearFiles();
        return false;
      }
    },
    handleExceed(files) {
      const file = files[0];
      file.uid = genFileId();
      this.$refs.uploader.handleStart(file);
    },
    handleStart(file) {
      this.$refs.uploader.handleStart(file);
    },

    submit() {
      this.$refs.uploader.submit();
    },
    /**
     * 处理粘贴事件
     */
    handlePaste(event) {
      if (this.disabled || this.file) return;
      
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          event.preventDefault();
          const file = item.getAsFile();
          if (file) {
            this.handlePasteFile(file);
          }
          break;
        }
      }
    },
    /**
     * 处理粘贴的文件
     */
    handlePasteFile(file) {
      const uploadFile = {
        uid: genFileId(),
        name: `paste-${Date.now()}.png`,
        raw: file,
        status: 'ready',
        size: file.size,
        type: file.type,
        percentage: 0
      };

      // 检查文件大小
      const maxSize = file.size / 1024 / 1024 < this.maxSize;
      if (!maxSize) {
        this.$message.warning(`上传文件大小不能超过 ${this.maxSize}MB!`);
        return;
      }

      if (this.cropper) {
        // 如果启用裁剪，打开裁剪对话框
        this.cropperFile = uploadFile;
        this.cropperFile.tempCropperFile = URL.createObjectURL(file);
        this.cropperDialogVisible = true;
      } else {
        // 直接上传
        this.file = uploadFile;
        this.file.tempFile = URL.createObjectURL(file);
        if (this.autoUpload) {
          this.$refs.uploader.handleStart(uploadFile);
          this.$refs.uploader.submit();
        }
      }
    },
    success(res, file) {
      var os = this.onSuccess(res, file);
      if (os != undefined && os == false) {
        this.$nextTick(() => {
          this.file = null;
          this.value = "";
        });
        return false;
      }
      var response = config.parseData(res);
      if (response.src) {
        //释放内存删除blob
        URL.revokeObjectURL(file.tempFile);
        delete file.tempFile;
        file.url = this.urlPrefix + response.src;
        this.value = file.url;
      } else {
        file.url = file.tempFile;
      }
    },
    error(err) {
      this.$nextTick(() => {
        this.clearFiles();
      });
      this.$notify.error({
        title: "上传文件未成功",
        message: err
      });
    },
    request(param) {
      var apiObj = config.apiObj;
      if (this.apiObj) {
        apiObj = this.apiObj;
      }
      const data = new FormData();
      data.append(param.filename, param.file);
      for (const key in param.data) {
        data.append(key, param.data[key]);
      }
      apiObj(data, {
          onUploadProgress: e => {
            const complete = parseInt(((e.loaded / e.total) * 100) | 0, 10);
            param.onProgress({ percent: complete });
          }
        })
        .then(res => {
          var response = parseData(res);
          if (response.code == config.successCode) {
            try {
              this.file.url = formatFilePath(this.urlPrefix || this.cachedOssAddress, response.url);
              this.$emit("modelValue:url", this.file.url);
              this.$emit("url", this.file.url);
              param.onSuccess(res);
            } catch (e) {
              // upload error ignored
            }
            this.$emit("handleSuccess", res);
            this.$emit("handlerSuccess", res);
          } else {
            param.onError(response.msg || "未知错误");
          }
        })
        .catch(err => {
          param.onError(err?.data?.msg);
        });
    }
  }
};
</script>

<style scoped>
.el-form-item.is-error .sc-upload .el-upload--picture-card {
  border-color: var(--el-color-danger);
}

.sc-upload .el-upload--picture-card {
  border-radius: 0;
}

.sc-upload .uploader,
.sc-upload:deep(.el-upload) {
  width: 100%;
  height: 100%;
}

.sc-upload__img {
  width: 100%;
  height: 100%;
  position: relative;
}

.sc-upload__img .image {
  width: 100%;
  height: 100%;
}

.sc-upload__img-actions {
  position: absolute;
  top: 0;
  right: 0;
  display: none;
}

.sc-upload__img-actions span {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 25px;
  height: 25px;
  cursor: pointer;
  color: #fff;
}

.sc-upload__img-actions span i {
  font-size: 12px;
}

.sc-upload__img-actions .del {
  background: var(--el-color-danger);
}

.sc-upload__img:hover .sc-upload__img-actions {
  display: block;
}

.sc-upload__img-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  background-color: var(--el-fill-color-lighter);
}

.sc-upload__uploading {
  width: 100%;
  height: 100%;
  position: relative;
}

.sc-upload__progress {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-overlay-color-lighter);
  z-index: 1;
  padding: 10px;
}

.sc-upload__progress .el-progress {
  width: 100%;
}

.sc-upload__uploading .image {
  width: 100%;
  height: 100%;
}

.sc-upload__file-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--el-fill-color-light);
  gap: 8px;
}

.sc-upload__file-preview .file-icon {
  font-size: 32px;
  color: var(--el-color-primary);
}

.sc-upload__file-preview .file-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 90%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

.sc-upload .file-empty {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.sc-upload .file-empty i {
  font-size: 28px;
}

.sc-upload .file-empty h4 {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-placeholder);
  margin-top: 8px;
}

.always {
  display: block !important;
}

.sc-upload.sc-upload-round {
  border-radius: 50%;
  overflow: hidden;
}

.sc-upload.sc-upload-round .el-upload--picture-card {
  border-radius: 50%;
}

.sc-upload.sc-upload-round .sc-upload__img-actions {
  top: auto;
  left: 0;
  right: 0;
  bottom: 0;
}

.sc-upload.sc-upload-round .sc-upload__img-actions span {
  width: 100%;
}
</style>
