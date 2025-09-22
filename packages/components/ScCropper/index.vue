<!--
 * @Descripttion: 图像裁剪组件
 * @version: 1.0
 * @Author: sakuya
 * @Date: 2021年7月24日17:05:43
 * @LastEditors:
 * @LastEditTime:
 * @other: 代码完全开源，欢迎参考，也欢迎PR
-->

<template>
  <div class="sc-cropper">
    <div class="sc-cropper__img">
      <img ref="img" :src="src" />
    </div>
    <div class="sc-cropper__preview">
      <div ref="preview" class="sc-cropper__preview__img" />
    </div>
  </div>
</template>

<script>
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

export default {
  props: {
    src: { type: String, default: "" },
    compress: { type: Number, default: 1 },
    aspectRatio: { type: Number, default: NaN }
  },
  data() {
    return {
      crop: null
    };
  },
  watch: {
    aspectRatio(val) {
      this.crop.setAspectRatio(val);
    }
  },
  mounted() {
    this.init();
  },
  methods: {
    init() {
      this.crop = new Cropper(this.$refs.img, {
        viewMode: 2,
        dragMode: "move",
        responsive: false,
        aspectRatio: this.aspectRatio,
        preview: this.$refs.preview
      });
    },
    setAspectRatio(aspectRatio) {
      this.crop.setAspectRatio(aspectRatio);
    },
    getCropData(cb, type = "image/jpeg", options = {}) {
      cb(this.crop.getCroppedCanvas(options).toDataURL(type, this.compress));
    },
    getCropBlob(cb, type = "image/jpeg", options = {}) {
      this.crop.getCroppedCanvas(options).toBlob(
        blob => {
          cb(blob);
        },
        type,
        this.compress
      );
    },
    getCropFile(cb, fileName = "fileName.jpg", type = "image/jpeg", options = {}) {
      this.crop.getCroppedCanvas(options).toBlob(
        blob => {
          let file = new File([blob], fileName, { type: type });
          cb(file);
        },
        type,
        this.compress
      );
    }
  }
};
</script>

<style scoped>
.sc-cropper {
  height: 400px;
  display: flex;
}
.sc-cropper__img {
  height: 100%;
  width: 400px;
  float: left;
  background: var(--el-fill-color-light);
}
.sc-cropper__img img {
  display: none;
}
.sc-cropper__preview {
  width: 240px;
  margin-left: 20px;
  float: left;
}
.sc-cropper__preview h4 {
  font-weight: normal;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-bottom: 20px;
}
.sc-cropper__preview__img {
  overflow: hidden;
  width: 100%;
  height: 100%;
  border: 1px solid var(--el-border-color-light);
}
</style>
