<template>
  <div class="sc-compare-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <el-form label-position="top" size="small">
          <el-form-item label="leftImageLabel 左侧标签">
            <el-input v-model="config.leftLabel" placeholder="左侧图片标签" />
          </el-form-item>

          <el-form-item label="rightImageLabel 右侧标签">
            <el-input v-model="config.rightLabel" placeholder="右侧图片标签" />
          </el-form-item>

          <el-divider />

          <div class="action-buttons">
            <el-button type="primary" size="small" @click="swapImages">
              <IconifyIconOnline icon="ri:swap-line" />
              交换
            </el-button>
            <el-button size="small" @click="resetImages">
              <IconifyIconOnline icon="ri:refresh-line" />
              重置
            </el-button>
          </div>
        </el-form>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览 <span class="hint">拖动滑块对比</span>
        </h3>

        <div class="preview-area">
          <ScCompare
            :leftImage="config.leftImage"
            :rightImage="config.rightImage"
            :leftImageLabel="config.leftLabel"
            :rightImageLabel="config.rightLabel"
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
import { reactive, computed } from "vue";
import ScCompare from "@repo/components/ScCompare/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const defaultLeft = "https://via.placeholder.com/600x300/3b82f6/ffffff?text=Before";
const defaultRight = "https://via.placeholder.com/600x300/10b981/ffffff?text=After";

// 配置项
const config = reactive({
  leftImage: defaultLeft,
  rightImage: defaultRight,
  leftLabel: "原图",
  rightLabel: "处理后"
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];
  props.push(`:leftImage="leftImage"`);
  props.push(`:rightImage="rightImage"`);
  if (config.leftLabel) props.push(`leftImageLabel="${config.leftLabel}"`);
  if (config.rightLabel) props.push(`rightImageLabel="${config.rightLabel}"`);
  return `<ScCompare\n  ${props.join("\n  ")}\n/>`;
});

function swapImages() {
  const temp = config.leftImage;
  config.leftImage = config.rightImage;
  config.rightImage = temp;
}

function resetImages() {
  config.leftImage = defaultLeft;
  config.rightImage = defaultRight;
}
</script>

<style scoped lang="scss">
.sc-compare-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } .hint { margin-left: auto; font-size: 12px; font-weight: 400; color: var(--el-text-color-placeholder); } }
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.preview-area { background: var(--el-fill-color-lighter); border-radius: 8px; overflow: hidden; }
.code-area { margin-top: 20px; }
.code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>
