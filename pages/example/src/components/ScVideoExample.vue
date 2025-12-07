<template>
  <div class="sc-video-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <el-form label-position="top" size="small">
          <el-form-item label="src 视频地址">
            <el-input v-model="config.src" placeholder="输入视频URL" />
          </el-form-item>

          <el-divider />

          <div class="switch-group">
            <div class="switch-item">
              <el-tooltip content="是否显示控制条" placement="left">
                <span>controls 控制条</span>
              </el-tooltip>
              <el-switch v-model="config.controls" />
            </div>
            <div class="switch-item">
              <el-tooltip content="是否自动播放" placement="left">
                <span>autoplay 自动播放</span>
              </el-tooltip>
              <el-switch v-model="config.autoplay" />
            </div>
            <div class="switch-item">
              <el-tooltip content="是否循环播放" placement="left">
                <span>loop 循环</span>
              </el-tooltip>
              <el-switch v-model="config.loop" />
            </div>
            <div class="switch-item">
              <el-tooltip content="是否静音" placement="left">
                <span>muted 静音</span>
              </el-tooltip>
              <el-switch v-model="config.muted" />
            </div>
          </div>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" size="small" @click="playVideo">
              <IconifyIconOnline icon="ri:play-line" />
              播放
            </el-button>
            <el-button size="small" @click="pauseVideo">
              <IconifyIconOnline icon="ri:pause-line" />
              暂停
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScVideo
            ref="videoRef"
            :src="config.src"
            :controls="config.controls"
            :autoplay="config.autoplay"
            :loop="config.loop"
            :muted="config.muted"
            :width="560"
            :height="315"
          />
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import ScVideo from "@repo/components/ScVideo/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const videoRef = ref();

// 配置项
const config = reactive({
  src: "https://www.w3schools.com/html/mov_bbb.mp4",
  controls: true,
  autoplay: false,
  loop: false,
  muted: false
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];
  props.push(`src="${config.src}"`);
  if (!config.controls) props.push(`:controls="false"`);
  if (config.autoplay) props.push(`autoplay`);
  if (config.loop) props.push(`loop`);
  if (config.muted) props.push(`muted`);
  return `<ScVideo\n  ${props.join("\n  ")}\n/>`;
});

function playVideo() {
  videoRef.value?.play();
}

function pauseVideo() {
  videoRef.value?.pause();
}
</script>

<style scoped lang="scss">
.sc-video-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.switch-group { display: flex; flex-direction: column; gap: 12px; }
.switch-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--el-text-color-regular); span { cursor: help; border-bottom: 1px dashed var(--el-border-color); } }
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.preview-area { background: var(--el-fill-color-lighter); border-radius: 8px; display: flex; justify-content: center; align-items: center; overflow: hidden; }
.code-area { margin-top: 20px; }
.code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>
