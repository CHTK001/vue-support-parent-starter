<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const url = computed(() => {
  return link[type.value].replace("{{input}}", input.value);
});

const show = ref(true);
const link = reactive({
  1: "https://jx.xmflv.cc/?url={{input}}?vfm=2008_aldbd&fc=828fb30b722f3164&fv=p_0",
  2: "https://www.8090g.cn/?url={{input}}",
  3: "https://vip.parwix.com:4433/player/?url={{input}}",
  4: "https://jx.m3u8.tv/jiexi/?url={{input}}"
});
const type = ref(1);
const input = ref();
const goFullScreen = () => {
  const iframe: any = document.getElementById("myFrame");
  // 进入全屏模式
  if (iframe.requestFullscreen) {
    iframe.requestFullscreen();
  } else if (iframe.mozRequestFullScreen) {
    /* Firefox */
    iframe.mozRequestFullScreen();
  } else if (iframe.webkitRequestFullscreen) {
    /* Chrome, Safari & Opera */
    iframe.webkitRequestFullscreen();
  } else if (iframe.msRequestFullscreen) {
    /* IE/Edge */
    iframe.msRequestFullscreen();
  }
};
</script>

<template>
  <div class="page flex flex-col h-full">
    <!-- 页面头部 -->
    <div class="page-header" v-if="show">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ri:video-line" class="title-icon" />
            视频解析工具
          </h1>
          <p class="page-subtitle">在线播放 VIP 视频资源</p>
        </div>
      </div>
    </div>

    <!-- 控制栏 -->
    <div class="video-controls" v-if="show">
      <el-card shadow="never" class="controls-card">
        <el-form :inline="true">
          <el-form-item label="解析服务" class="w-[200px]">
            <el-select v-model="type" class="w-[200px]">
              <el-option label="智能解析" :value="1" />
              <el-option label="备用地址1" :value="2" />
              <el-option label="备用地址2" :value="3" />
              <el-option label="备用地址3" :value="4" />
            </el-select>
          </el-form-item>
          <el-form-item label="视频地址" class="w-[800px]">
            <el-input v-model="input" class="w-[800px]" />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button v-if="show" :icon="useRenderIcon('ri:fullscreen-fill')" @click="goFullScreen()">全屏</el-button>
      <el-button v-else :icon="useRenderIcon('ri:fullscreen-exit-fill')" @click="goFullScreen()">退出全屏</el-button>
      <el-button v-if="show" :icon="useRenderIcon('ri:arrow-up-double-line')" @click="show = false" />
      <el-button v-else :icon="useRenderIcon('ri:arrow-down-double-line')" @click="show = true" />
    </div>

    <!-- 视频播放器 -->
    <div class="flex-1 overflow-hidden">
      <iframe id="myFrame" class="video-frame" :src="url" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  padding: 0;
  background: var(--el-bg-color-page);
}

.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  padding: 24px 32px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;

  .title-icon {
    font-size: 28px;
    color: var(--el-color-primary);
  }
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
  margin: 0;
}

.video-controls {
  margin-bottom: 16px;
}

.controls-card {
  :deep(.el-card__body) {
    padding: 16px;
  }
}

.action-buttons {
  position: fixed;
  top: 120px;
  right: 16px;
  z-index: 100;
  display: flex;
  gap: 8px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.video-frame {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

:deep(.el-card) {
  border-radius: 8px;
}
</style>
