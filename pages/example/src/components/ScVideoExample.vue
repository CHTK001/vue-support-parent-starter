<template>
  <div class="example-container">
    <h2 class="example-title">ScVideo 视频播放器示例</h2>
    <p class="example-desc">视频播放组件，支持多种格式、控制条等功能</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="playVideo">
          <IconifyIconOnline icon="ri:play-line" class="mr-1" />
          播放
        </el-button>
        <el-button @click="pauseVideo">
          <IconifyIconOnline icon="ri:pause-line" class="mr-1" />
          暂停
        </el-button>
      </div>

      <div class="video-wrapper">
        <ScVideo
          ref="videoRef"
          :src="config.src"
          :controls="config.controls"
          :autoplay="config.autoplay"
          :width="640"
          :height="360"
        />
      </div>

      <el-divider content-position="left">属性配置</el-divider>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="显示控制条">
              <el-switch v-model="config.controls" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="自动播放">
              <el-switch v-model="config.autoplay" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ScVideo from "@repo/components/ScVideo/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScVideo 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const videoRef = ref();

const config = reactive({
  src: "https://www.w3schools.com/html/mov_bbb.mp4",
  controls: true,
  autoplay: false,
});

// 属性说明
const propsData = [
  { name: "src", type: "string", default: "''", description: "视频地址" },
  {
    name: "controls",
    type: "boolean",
    default: "true",
    description: "是否显示控制条",
  },
  {
    name: "autoplay",
    type: "boolean",
    default: "false",
    description: "是否自动播放",
  },
  {
    name: "loop",
    type: "boolean",
    default: "false",
    description: "是否循环播放",
  },
  { name: "muted", type: "boolean", default: "false", description: "是否静音" },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScVideo
  src="${config.src}"
  ${config.controls ? "controls" : ':controls="false"'}
  ${config.autoplay ? "autoplay" : ""}
/>`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ScVideo from "@repo/components/ScVideo/index.vue";`,
  },
]);

function playVideo() {
  videoRef.value?.play();
}

function pauseVideo() {
  videoRef.value?.pause();
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.video-wrapper {
  max-width: 640px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
}

.config-form {
  margin-top: 16px;
}

.props-table {
  margin-bottom: 20px;
}
</style>
