<template>
  <el-dialog
    v-model="visible"
    title="图片裁剪"
    width="800px"
    destroy-on-close
    :close-on-click-modal="false"
    class="image-crop-dialog"
  >
    <div class="crop-container">
      <div class="crop-area">
        <img ref="imageRef" :src="imageUrl" alt="Crop" class="crop-image" />
      </div>

      <div class="crop-controls">
        <div class="control-group">
          <span class="control-label">缩放</span>
          <el-slider
            v-model="zoom"
            :min="0.1"
            :max="3"
            :step="0.1"
            @change="handleZoom"
          />
        </div>
        <div class="control-group">
          <span class="control-label">旋转</span>
          <el-slider
            v-model="rotate"
            :min="-180"
            :max="180"
            :step="1"
            @change="handleRotate"
          />
        </div>
        <div class="control-buttons">
          <el-button @click="handleRotateLeft">
            <IconifyIconOnline icon="ri:rotate-left-line" />
            左旋 90°
          </el-button>
          <el-button @click="handleRotateRight">
            <IconifyIconOnline icon="ri:rotate-right-line" />
            右旋 90°
          </el-button>
          <el-button @click="handleFlipH">
            <IconifyIconOnline icon="ri:swap-line" />
            水平翻转
          </el-button>
          <el-button @click="handleFlipV">
            <IconifyIconOnline icon="ri:arrow-up-down-line" />
            垂直翻转
          </el-button>
          <el-button @click="handleReset">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="processing" @click="handleCrop"
        >确定裁剪</el-button
      >
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";

interface Props {
  modelValue: boolean;
  imageUrl: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  cropped: [blob: Blob];
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// 状态
const imageRef = ref<HTMLImageElement>();
const cropper = ref<Cropper>();
const processing = ref(false);
const zoom = ref(1);
const rotate = ref(0);

// 初始化裁剪器
const initCropper = () => {
  if (!imageRef.value) return;

  cropper.value = new Cropper(imageRef.value, {
    aspectRatio: NaN,
    viewMode: 1,
    dragMode: "move",
    autoCropArea: 0.8,
    restore: false,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
  });
};

// 销毁裁剪器
const destroyCropper = () => {
  if (cropper.value) {
    cropper.value.destroy();
    cropper.value = undefined;
  }
};

// 缩放
const handleZoom = (val: number) => {
  cropper.value?.zoomTo(val);
};

// 旋转
const handleRotate = (val: number) => {
  cropper.value?.rotateTo(val);
};

// 左旋 90°
const handleRotateLeft = () => {
  rotate.value -= 90;
  cropper.value?.rotate(-90);
};

// 右旋 90°
const handleRotateRight = () => {
  rotate.value += 90;
  cropper.value?.rotate(90);
};

// 水平翻转
const handleFlipH = () => {
  const data = cropper.value?.getData();
  if (data) {
    cropper.value?.scaleX(data.scaleX === -1 ? 1 : -1);
  }
};

// 垂直翻转
const handleFlipV = () => {
  const data = cropper.value?.getData();
  if (data) {
    cropper.value?.scaleY(data.scaleY === -1 ? 1 : -1);
  }
};

// 重置
const handleReset = () => {
  zoom.value = 1;
  rotate.value = 0;
  cropper.value?.reset();
};

// 裁剪
const handleCrop = () => {
  if (!cropper.value) return;

  processing.value = true;

  const canvas = cropper.value.getCroppedCanvas({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: "high",
  });

  canvas.toBlob(
    (blob) => {
      processing.value = false;
      if (blob) {
        emit("cropped", blob);
        visible.value = false;
        ElMessage.success("裁剪成功");
      } else {
        ElMessage.error("裁剪失败");
      }
    },
    "image/png",
    1
  );
};

// 监听显示状态
watch(visible, (val) => {
  if (val) {
    nextTick(() => {
      initCropper();
    });
  } else {
    destroyCropper();
    zoom.value = 1;
    rotate.value = 0;
  }
});

onUnmounted(() => {
  destroyCropper();
});
</script>

<style lang="scss" scoped>
.image-crop-dialog {
  :deep(.el-dialog__body) {
    padding: 16px 20px;
  }
}

.crop-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crop-area {
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;

  .crop-image {
    display: block;
    max-width: 100%;
  }
}

.crop-controls {
  .control-group {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;

    .control-label {
      width: 40px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .el-slider {
      flex: 1;
    }
  }

  .control-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
