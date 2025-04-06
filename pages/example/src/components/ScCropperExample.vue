<template>
  <div class="cropper-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础图片裁剪</h3>
        <p class="example-desc">基础的图片裁剪功能，支持选择图片并进行裁剪</p>

        <div class="example-row">
          <div class="cropper-container">
            <div class="upload-section" v-if="!basicImage">
              <el-upload class="upload-demo" action="" :auto-upload="false" :show-file-list="false" :on-change="handleBasicImageChange">
                <el-button type="primary">选择图片</el-button>
                <div class="upload-tip">支持jpg、png格式</div>
              </el-upload>
            </div>

            <div v-else class="cropper-content">
              <ScCropper ref="basicCropperRef" :src="basicImage" :aspect-ratio="1" />

              <div class="cropper-actions">
                <el-button type="primary" @click="cropBasicImage">裁剪</el-button>
                <el-button @click="resetBasicImage">重置</el-button>
              </div>
            </div>
          </div>

          <div class="preview-container" v-if="basicCroppedImage">
            <h4>裁剪结果：</h4>
            <div class="preview-image">
              <img :src="basicCroppedImage" alt="裁剪结果" />
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;div class="upload-section" v-if="!basicImage"&gt;
  &lt;el-upload
    action=""
    :auto-upload="false"
    :show-file-list="false"
    :on-change="handleBasicImageChange"
  &gt;
    &lt;el-button type="primary"&gt;选择图片&lt;/el-button&gt;
  &lt;/el-upload&gt;
&lt;/div&gt;

&lt;div v-else class="cropper-content"&gt;
  &lt;ScCropper
    ref="basicCropperRef"
    :src="basicImage"
    :aspect-ratio="1"
  /&gt;
  
  &lt;div class="cropper-actions"&gt;
    &lt;el-button type="primary" @click="cropBasicImage"&gt;裁剪&lt;/el-button&gt;
    &lt;el-button @click="resetBasicImage"&gt;重置&lt;/el-button&gt;
  &lt;/div&gt;
&lt;/div&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const basicImage = ref('');
const basicCroppedImage = ref('');
const basicCropperRef = ref(null);

const handleBasicImageChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    basicImage.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const cropBasicImage = () => {
  if (basicCropperRef.value) {
    basicCroppedImage.value = basicCropperRef.value.getCroppedCanvas().toDataURL();
  }
};

const resetBasicImage = () => {
  basicImage.value = '';
  basicCroppedImage.value = '';
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="高级选项">
        <h3>高级裁剪选项</h3>
        <p class="example-desc">支持调整裁剪比例、旋转和缩放等高级功能</p>

        <div class="example-row">
          <div class="cropper-container">
            <div class="upload-section" v-if="!advancedImage">
              <el-upload class="upload-demo" action="" :auto-upload="false" :show-file-list="false" :on-change="handleAdvancedImageChange">
                <el-button type="primary">选择图片</el-button>
                <div class="upload-tip">支持jpg、png格式</div>
              </el-upload>
            </div>

            <div v-else class="cropper-content">
              <ScCropper ref="advancedCropperRef" :src="advancedImage" :aspect-ratio="aspectRatio" :view-mode="2" :guides="true" :background="true" :rotatable="true" :scalable="true" :zoomable="true" />

              <div class="cropper-controls">
                <div class="control-item">
                  <span class="control-label">裁剪比例：</span>
                  <el-radio-group v-model="aspectRatioOption" size="small">
                    <el-radio-button label="free">自由</el-radio-button>
                    <el-radio-button label="1:1">1:1</el-radio-button>
                    <el-radio-button label="4:3">4:3</el-radio-button>
                    <el-radio-button label="16:9">16:9</el-radio-button>
                  </el-radio-group>
                </div>

                <div class="control-item">
                  <span class="control-label">旋转：</span>
                  <el-button-group>
                    <el-button size="small" @click="rotateLeft">
                      <IconifyIconOnline icon="ri:rotate-left-line" />
                    </el-button>
                    <el-button size="small" @click="rotateRight">
                      <IconifyIconOnline icon="ri:rotate-right-line" />
                    </el-button>
                  </el-button-group>
                </div>

                <div class="control-item">
                  <span class="control-label">缩放：</span>
                  <el-button-group>
                    <el-button size="small" @click="zoomOut">
                      <IconifyIconOnline icon="ri:zoom-out-line" />
                    </el-button>
                    <el-button size="small" @click="zoomIn">
                      <IconifyIconOnline icon="ri:zoom-in-line" />
                    </el-button>
                  </el-button-group>
                </div>
              </div>

              <div class="cropper-actions">
                <el-button type="primary" @click="cropAdvancedImage">裁剪</el-button>
                <el-button @click="resetAdvancedImage">重置</el-button>
              </div>
            </div>
          </div>

          <div class="preview-container" v-if="advancedCroppedImage">
            <h4>裁剪结果：</h4>
            <div class="preview-image">
              <img :src="advancedCroppedImage" alt="裁剪结果" />
            </div>
            <div class="image-info" v-if="imageInfo">
              <div>尺寸: {{ imageInfo.width }} x {{ imageInfo.height }} px</div>
              <div>格式: {{ imageInfo.type }}</div>
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCropper
  ref="advancedCropperRef"
  :src="advancedImage"
  :aspect-ratio="aspectRatio"
  :view-mode="2"
  :guides="true"
  :background="true"
  :rotatable="true"
  :scalable="true"
  :zoomable="true"
/&gt;

&lt;div class="cropper-controls"&gt;
  &lt;div class="control-item"&gt;
    &lt;span class="control-label"&gt;裁剪比例：&lt;/span&gt;
    &lt;el-radio-group v-model="aspectRatioOption" size="small"&gt;
      &lt;el-radio-button label="free"&gt;自由&lt;/el-radio-button&gt;
      &lt;el-radio-button label="1:1"&gt;1:1&lt;/el-radio-button&gt;
      &lt;el-radio-button label="4:3"&gt;4:3&lt;/el-radio-button&gt;
      &lt;el-radio-button label="16:9"&gt;16:9&lt;/el-radio-button&gt;
    &lt;/el-radio-group&gt;
  &lt;/div&gt;
  
  &lt;div class="control-item"&gt;
    &lt;span class="control-label"&gt;旋转：&lt;/span&gt;
    &lt;el-button-group&gt;
      &lt;el-button size="small" @click="rotateLeft"&gt;
        &lt;IconifyIconOnline icon="ri:rotate-left-line" /&gt;
      &lt;/el-button&gt;
      &lt;el-button size="small" @click="rotateRight"&gt;
        &lt;IconifyIconOnline icon="ri:rotate-right-line" /&gt;
      &lt;/el-button&gt;
    &lt;/el-button-group&gt;
  &lt;/div&gt;
&lt;/div&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="圆形裁剪">
        <h3>圆形裁剪</h3>
        <p class="example-desc">支持圆形裁剪，适合头像等场景</p>

        <div class="example-row">
          <div class="cropper-container">
            <div class="upload-section" v-if="!circleImage">
              <el-upload class="upload-demo" action="" :auto-upload="false" :show-file-list="false" :on-change="handleCircleImageChange">
                <el-button type="primary">选择图片</el-button>
                <div class="upload-tip">支持jpg、png格式</div>
              </el-upload>
            </div>

            <div v-else class="cropper-content">
              <ScCropper ref="circleCropperRef" :src="circleImage" :aspect-ratio="1" :view-mode="1" :guides="true" :center="true" :highlight="false" :background="true" :autoCropArea="0.8" :cropBoxResizable="false" :cropBoxMovable="true" :minCropBoxWidth="100" class="circle-cropper" />

              <div class="cropper-actions">
                <el-button type="primary" @click="cropCircleImage">裁剪</el-button>
                <el-button @click="resetCircleImage">重置</el-button>
              </div>
            </div>
          </div>

          <div class="preview-container" v-if="circleCroppedImage">
            <h4>裁剪结果：</h4>
            <div class="preview-image circle">
              <img :src="circleCroppedImage" alt="裁剪结果" />
            </div>
          </div>
        </div>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScCropper
  ref="circleCropperRef"
  :src="circleImage"
  :aspect-ratio="1"
  :view-mode="1"
  :guides="true"
  :center="true"
  :highlight="false"
  :background="true"
  :autoCropArea="0.8"
  :cropBoxResizable="false"
  :cropBoxMovable="true"
  :minCropBoxWidth="100"
  class="circle-cropper"
/&gt;

&lt;style&gt;
.circle-cropper .cropper-view-box,
.circle-cropper .cropper-face {
  border-radius: 50%;
}

.preview-image.circle img {
  border-radius: 50%;
}
&lt;/style&gt;
        </code></pre>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { message } from "@repo/utils";

// 基础裁剪
const basicImage = ref("");
const basicCroppedImage = ref("");
const basicCropperRef = ref(null);

const handleBasicImageChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    basicImage.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const cropBasicImage = () => {
  if (basicCropperRef.value) {
    basicCroppedImage.value = basicCropperRef.value.getCroppedCanvas().toDataURL();
    message("图片裁剪成功", { type: "success" });
  }
};

const resetBasicImage = () => {
  basicImage.value = "";
  basicCroppedImage.value = "";
  message("已重置", { type: "info" });
};

// 高级裁剪
const advancedImage = ref("");
const advancedCroppedImage = ref("");
const advancedCropperRef = ref(null);
const aspectRatioOption = ref("1:1");
const imageInfo = ref(null);

const aspectRatio = computed(() => {
  switch (aspectRatioOption.value) {
    case "free":
      return NaN;
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    default:
      return 1;
  }
});

const handleAdvancedImageChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    advancedImage.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const rotateLeft = () => {
  if (advancedCropperRef.value) {
    advancedCropperRef.value.rotate(-90);
  }
};

const rotateRight = () => {
  if (advancedCropperRef.value) {
    advancedCropperRef.value.rotate(90);
  }
};

const zoomIn = () => {
  if (advancedCropperRef.value) {
    advancedCropperRef.value.zoom(0.1);
  }
};

const zoomOut = () => {
  if (advancedCropperRef.value) {
    advancedCropperRef.value.zoom(-0.1);
  }
};

const cropAdvancedImage = () => {
  if (advancedCropperRef.value) {
    const canvas = advancedCropperRef.value.getCroppedCanvas();
    advancedCroppedImage.value = canvas.toDataURL();

    // 获取图片信息
    imageInfo.value = {
      width: canvas.width,
      height: canvas.height,
      type: "PNG",
    };

    message("图片裁剪成功", { type: "success" });
  }
};

const resetAdvancedImage = () => {
  advancedImage.value = "";
  advancedCroppedImage.value = "";
  imageInfo.value = null;
  message("已重置", { type: "info" });
};

// 圆形裁剪
const circleImage = ref("");
const circleCroppedImage = ref("");
const circleCropperRef = ref(null);

const handleCircleImageChange = (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    circleImage.value = e.target.result;
  };
  reader.readAsDataURL(file.raw);
};

const cropCircleImage = () => {
  if (circleCropperRef.value) {
    const canvas = circleCropperRef.value.getCroppedCanvas({
      imageSmoothingQuality: "high",
    });
    circleCroppedImage.value = canvas.toDataURL();
    message("图片裁剪成功", { type: "success" });
  }
};

const resetCircleImage = () => {
  circleImage.value = "";
  circleCroppedImage.value = "";
  message("已重置", { type: "info" });
};

// 监听裁剪比例变化
watch(aspectRatioOption, () => {
  if (advancedCropperRef.value) {
    advancedCropperRef.value.setAspectRatio(aspectRatio.value);
  }
});
</script>

<style lang="scss" scoped>
.cropper-example {
  padding: 20px;

  .example-desc {
    color: #666;
    margin-bottom: 20px;
  }

  .example-row {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .cropper-container {
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    padding: 20px;
    background-color: #f5f7fa;
  }

  .upload-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 0;

    .upload-tip {
      margin-top: 10px;
      color: #909399;
      font-size: 14px;
    }
  }

  .cropper-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .cropper-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin: 15px 0;
    padding: 15px;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid #ebeef5;

    .control-item {
      display: flex;
      align-items: center;
      margin-right: 20px;

      .control-label {
        margin-right: 10px;
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .cropper-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 10px;
  }

  .preview-container {
    padding: 20px;
    background-color: #fff;
    border-radius: 8px;
    border: 1px solid #dcdfe6;
    text-align: center;

    h4 {
      margin-top: 0;
      margin-bottom: 15px;
      font-weight: 500;
      color: #606266;
    }

    .preview-image {
      display: inline-block;
      max-width: 100%;
      margin-bottom: 15px;

      img {
        max-width: 100%;
        max-height: 300px;
        border: 1px solid #ebeef5;
      }

      &.circle img {
        border-radius: 50%;
      }
    }

    .image-info {
      text-align: left;
      padding: 10px;
      background-color: #f5f7fa;
      border-radius: 4px;
      font-size: 14px;
      color: #606266;
      line-height: 1.6;
    }
  }

  pre {
    background-color: #f5f7fa;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
}

:deep(.circle-cropper .cropper-view-box),
:deep(.circle-cropper .cropper-face) {
  border-radius: 50%;
}
</style>
