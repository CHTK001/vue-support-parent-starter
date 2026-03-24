<script setup>
import Error from "@repo/assets/images/error.png";
import Wait from "@repo/assets/images/wait.apng";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { checkImage } from "@repo/utils";
import { VideoPlayer } from "@videojs-player/vue";
import { api as viewerApi } from "v-viewer";
import "video.js/dist/video-js.css";
import "viewerjs/dist/viewer.css";
import { reactive } from "vue";

const emit = defineEmits(["preview", "download"]);
const props = defineProps({
  // 媒体数据
  mediaUrls: {
    type: Array,
    default: () => [],
  },
  // 本地媒体数据
  localMediaUrls: {
    type: Array,
    default: () => [],
  },
  // 媒体类型：VINCENT(图片) 或 VIDEO(视频)
  mediaType: {
    type: String,
    default: "VINCENT",
  },
  // 媒体数量
  mediaCount: {
    type: Number,
    default: 1,
  },
  // 行ID，用于工具栏显示控制
  rowId: {
    type: String,
    required: true,
  },
  // 媒体尺寸
  mediaSize: {
    type: Object,
    default: () => ({ width: 120, height: 120 }),
  },
  // 占位符数据
  placeholderData: {
    type: Array,
    default: () => [],
  },
  // 是否正在生成
  isGenerating: {
    type: Boolean,
    default: false,
  },
});

const toolShow = reactive({});

/**
 * 预览图片
 */
const handlePreview = (url, localUrl) => {
  const _images = [];
  if (url) {
    checkImage(url)
      .then((res) => {
        _images.push(url);
        viewerApi({
          images: _images,
          options: {
            backdrop: true,
            inline: true,
          },
        });
      })
      .catch((e) => {
        _images.push(localUrl);
        viewerApi({
          images: _images,
          options: {
            backdrop: true,
            inline: true,
          },
        });
      });
    return;
  }

  // 如果没有指定URL，预览所有图片
  let _loadingImages = [];
  props.mediaUrls.forEach((url) => {
    _loadingImages.push(checkImage(url));
  });
  props.localMediaUrls.forEach((url) => {
    _loadingImages.push(checkImage(url));
  });

  Promise.allSettled(_loadingImages).then((results) => {
    results.forEach((it) => {
      if (!it.value) {
        return;
      }
      _images.push(it.value);
    });
    viewerApi({
      images: _images,
      options: {
        backdrop: true,
        inline: true,
      },
    });
  });

  emit("preview", url, localUrl);
};

/**
 * 下载媒体文件
 */
const handleDownload = (url, localUrl) => {
  checkImage(url)
    .then((res) => {
      const link = document.createElement("a");
      link.href = url;
      link.click();
    })
    .catch((e) => {
      const link = document.createElement("a");
      link.href = localUrl;
      link.click();
    });

  emit("download", url, localUrl);
};
</script>

<template>
  <div class="media-display">
    <div v-for="(item, index) in mediaCount" :key="index" class="media-item cursor-pointer relative" @mouseover="toolShow[`${rowId}_${index}`] = true" @mouseleave="toolShow[`${rowId}_${index}`] = false">
      <!-- 占位符显示 (仅在生成中且没有实际媒体数据时显示) -->
      <div v-if="isGenerating && placeholderData[index] && !mediaUrls[index]" class="placeholder-container media-content-fallback">
        <div class="placeholder-content">
          <b class="progress-text">进度: {{ placeholderData[index]?.progress || 10 }}%</b>
          <div class="placeholder-image-wrapper" :style="{ transform: 'translateY(' + (100 - (placeholderData[index]?.progress || 10)) + '%)' }">
            <img :src="Wait" class="placeholder-image" />
          </div>
        </div>
      </div>

      <!-- 图片展示 -->
      <ScImage v-else-if="mediaType === 'VINCENT' && (mediaUrls[index] || localMediaUrls[index])" :src="mediaUrls[index]" class="media-content" @click.prevent="handlePreview(mediaUrls[index], localMediaUrls[index])">
        <template #error>
          <ScImage :src="localMediaUrls[index]" class="media-content-fallback">
            <template #error>
              <img :src="Error" alt="加载失败" class="error-img" />
            </template>
          </ScImage>
        </template>
      </ScImage>

      <!-- 视频展示 -->
      <VideoPlayer
        v-else-if="mediaType === 'VIDEO' && mediaUrls[index]"
        :controlBar="{
          timeDivider: true,
          durationDisplay: true,
          remainingTimeDisplay: true,
          fullscreenToggle: true,
        }"
        notSupportedMessage="此视频暂无法播放，请稍后再试"
        :height="261"
        :width="261"
        :src="mediaUrls[index]"
        controls
        :autoplay="false"
        language="cn"
        :playbackRates="[0.5, 1, 1.5, 2]"
        class="video-player"
      />

      <ScImage v-else :src="Error" class="media-content-fallback"></ScImage>

      <!-- 鼠标悬停显示的操作按钮 -->
      <div class="hover-tools" v-if="toolShow[`${rowId}_${index}`] && mediaUrls[index]">
        <ScTooltip content="查看" placement="top">
          <ScButton circle size="small" :icon="useRenderIcon('ep:view')" @click.stop="handlePreview(mediaUrls[index], localMediaUrls[index])"></ScButton>
        </ScTooltip>
        <ScTooltip content="下载" placement="top">
          <ScButton circle size="small" :icon="useRenderIcon('ep:download')" @click.stop="handleDownload(mediaUrls[index], localMediaUrls[index])"></ScButton>
        </ScTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.media-display {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  align-items: center;
}

.media-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
}

.media-content,
.media-content-fallback {
  border-radius: 16px;
  max-width: 285px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}

.placeholder-container {
  width: 300px;
  height: 300px;
  border-radius: 16px;
  overflow: hidden;
  position: relative;
}

.placeholder-content {
  width: 100%;
  height: 100%;
  background-color: #f7f8fc;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.5);
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}

.progress-text {
  position: absolute;
  left: 16px;
  top: 0;
  font-size: 14px;
  z-index: 2;
  color: var(--el-text-color-primary);
}

.placeholder-image-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: translateY(100%);
  transition: all 1s;
  z-index: 1;
}

.placeholder-image {
  width: 261px;
  height: 261px;
  border-radius: 16px;
  // box-shadow:
  //   0px 2px 4px 0px rgba(0, 0, 0, 0.4),
  //   0px 7px 13px -3px rgba(0, 0, 0, 0.3),
  //   0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}

.video-player {
  border-radius: 16px;
  width: 261px;
  height: 261px;
  box-shadow:
    0px 2px 4px 0px rgba(0, 0, 0, 0.4),
    0px 7px 13px -3px rgba(0, 0, 0, 0.3),
    0px -3px 0px 0px rgba(0, 0, 0, 0.2) inset;
}

.error-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

// 悬停工具栏
.hover-tools {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 8px;
  backdrop-filter: blur(10px) brightness(90%);
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: fadeIn 0.3s ease;
  z-index: 10;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

// 暗黑模式适配
:deep(.el-dark) {
  .hover-tools {
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px) brightness(110%);
  }
}
</style>
