<template>
  <div class="code-display">
    <div class="code-header">
      <h4 v-if="title">{{ title }}</h4>
      <div class="code-actions">
        <el-button
          type="primary"
          size="small"
          :icon="useRenderIcon('ep:copy-document')"
          @click="copyCode"
          class="copy-btn"
          :loading="copying"
        >
          {{ copyButtonText }}
        </el-button>
        <el-button
          v-if="showFullscreen"
          type="default"
          size="small"
          :icon="useRenderIcon('ep:full-screen')"
          @click="toggleFullscreen"
          class="fullscreen-btn"
        >
          {{ isFullscreen ? "退出全屏" : "全屏" }}
        </el-button>
      </div>
    </div>

    <el-alert v-if="description" type="info" :closable="false" class="mb-3">
      <div class="code-desc">{{ description }}</div>
    </el-alert>

    <div class="code-container" :class="{ fullscreen: isFullscreen }">
      <pre><code :class="`language-${language}`">{{ formattedCode }}</code></pre>

      <!-- 复制成功提示 -->
      <div class="code-overlay" v-if="showCopySuccess">
        <div class="copy-success">
          <IconifyIconOnline icon="ep:check" :size="24" />
          <span>代码已复制</span>
        </div>
      </div>

      <!-- 行号显示 -->
      <div v-if="showLineNumbers" class="line-numbers">
        <span
          v-for="(line, index) in codeLines"
          :key="index"
          class="line-number"
        >
          {{ index + 1 }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ElMessage } from "element-plus";
import { computed, ref, watch } from "vue";

// Props
const props = defineProps({
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "html",
  },
  title: {
    type: String,
    default: "代码示例",
  },
  description: {
    type: String,
    default: "",
  },
  showLineNumbers: {
    type: Boolean,
    default: false,
  },
  showFullscreen: {
    type: Boolean,
    default: true,
  },
  autoFormat: {
    type: Boolean,
    default: true,
  },
});

// 响应式数据
const copying = ref(false);
const showCopySuccess = ref(false);
const copyButtonText = ref("复制代码");
const isFullscreen = ref(false);

// 计算属性
const formattedCode = computed(() => {
  if (!props.autoFormat) return props.code;

  // 简单的代码格式化
  return props.code
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
});

const codeLines = computed(() => {
  return formattedCode.value.split("\n");
});

// 复制代码功能
const copyCode = async () => {
  if (copying.value) return;

  copying.value = true;

  try {
    await navigator.clipboard.writeText(formattedCode.value);

    // 显示复制成功状态
    showCopySuccess.value = true;
    copyIcon.value = Check;
    copyButtonText.value = "已复制";

    // 2秒后恢复原状态
    setTimeout(() => {
      showCopySuccess.value = false;
      copyIcon.value = Copy;
      copyButtonText.value = "复制代码";
      copying.value = false;
    }, 2000);

    ElMessage.success("代码已复制到剪贴板");
  } catch (err) {
    console.error("复制失败:", err);
    ElMessage.error("复制失败，请手动复制");
    copying.value = false;
  }
};

// 全屏功能
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  if (isFullscreen.value) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

// 监听ESC键退出全屏
const handleKeydown = (event) => {
  if (event.key === "Escape" && isFullscreen.value) {
    toggleFullscreen();
  }
};

// 组件挂载时添加键盘监听
watch(isFullscreen, (newVal) => {
  if (newVal) {
    document.addEventListener("keydown", handleKeydown);
  } else {
    document.removeEventListener("keydown", handleKeydown);
  }
});
</script>

<style scoped>
.code-display {
  margin: 16px 0;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.code-header h4 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
}

.code-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.copy-btn,
.fullscreen-btn {
  transition: all 0.3s ease;
}

.copy-btn:hover,
.fullscreen-btn:hover {
  transform: translateY(-1px);
}

.copy-btn:hover {
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.fullscreen-btn:hover {
  box-shadow: var(--el-box-shadow-light);
}

.code-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.code-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color-overlay);
  transition: all 0.3s ease;
}

.code-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  border-radius: 0;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.code-container.fullscreen pre {
  flex: 1;
  margin: 0;
  border-radius: 0;
  overflow: auto;
}

pre {
  background-color: transparent;
  padding: 20px;
  margin: 0;
  overflow-x: auto;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
}

.line-numbers {
  position: absolute;
  top: 0;
  left: 0;
  padding: 20px 0;
  background: var(--el-fill-color-light);
  border-right: 1px solid var(--el-border-color);
  user-select: none;
  min-width: 40px;
  text-align: center;
}

.line-number {
  display: block;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
  line-height: 1.6;
  height: 22.4px;
}

.code-container:has(.line-numbers) pre {
  padding-left: 60px;
}

.code-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  animation: fadeIn 0.3s ease;
}

.copy-success {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-color-success);
  font-size: 16px;
  font-weight: 600;
  background: var(--el-bg-color);
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: var(--el-box-shadow);
  animation: bounceIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .code-header {
    flex-direction: column;
    align-items: stretch;
  }

  .code-actions {
    justify-content: center;
  }

  pre {
    padding: 16px;
    font-size: 13px;
  }

  .line-numbers {
    min-width: 35px;
  }

  .code-container:has(.line-numbers) pre {
    padding-left: 50px;
  }
}

/* 暗黑模式样式 - 使用 html.dark 选择器 */
html.dark {
  .code-container {
    border-color: var(--el-border-color);
    background: var(--el-fill-color-dark);
  }

  .line-numbers {
    background: var(--el-fill-color-darker);
    border-color: var(--el-border-color);
  }

  .line-number {
    color: var(--el-text-color-secondary);
  }

  .copy-success {
    background: var(--el-bg-color-overlay);
  }

  .code-container.fullscreen {
    background: var(--el-bg-color);
  }
}
</style>
