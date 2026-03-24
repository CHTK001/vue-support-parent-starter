<template>
  <div class="re-text-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="lineClamp 省略行数">
            <ScSelect
              v-model="config.lineClamp"
              layout="card"
              :options="lineClampOptions"
              :gap="6"
              width="50px"
            />
          </ScFormItem>

          <ScFormItem label="text 文本内容">
            <ScInput v-model="config.text" type="textarea" :rows="4" />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="鼠标悬停时显示完整文本" placement="left">
                <span>showTooltip 显示提示</span>
              </ScTooltip>
              <ScSwitch v-model="config.showTooltip" />
            </div>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <div class="text-wrapper">
            <ReText :lineClamp="config.lineClamp" :showTooltip="config.showTooltip">
              {{ config.text }}
            </ReText>
          </div>
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
import ReText from "@repo/components/ReText/src/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 行数选项
const lineClampOptions = [
  { label: "1", value: 1, icon: "ri:text" },
  { label: "2", value: 2, icon: "ri:text" },
  { label: "3", value: 3, icon: "ri:text" },
  { label: "4", value: 4, icon: "ri:text" },
  { label: "5", value: 5, icon: "ri:text" }
];

// 配置项
const config = reactive({
  lineClamp: 2,
  showTooltip: true,
  text: "这是一段很长很长的文本，用于演示多行省略显示效果。鼠标悬停将通过 tippy 显示完整内容。这个组件非常适合用于列表项、卡片描述等需要限制文本行数的场景。"
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  if (config.lineClamp !== 1) {
    props.push(`:lineClamp="${config.lineClamp}"`);
  }
  if (!config.showTooltip) {
    props.push(`:showTooltip="false"`);
  }

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : "";

  return `<ReText${propsStr}>
  ${config.text.substring(0, 30)}...
</ReText>`;
});
</script>

<style scoped lang="scss">
.re-text-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
  }
}

.preview-area {
  padding: 40px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.text-wrapper {
  max-width: 300px;
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.code-area {
  margin-top: 20px;
}

.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;

  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
