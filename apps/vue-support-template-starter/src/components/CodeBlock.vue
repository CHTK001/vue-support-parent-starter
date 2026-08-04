<template>
  <div class="code-block">
    <div class="code-block__header">
      <span class="code-block__title">代码片段</span>
      <div class="code-block__tabs">
        <el-radio-group v-model="activeTab" size="small">
          <el-radio-button label="vue">Vue</el-radio-button>
          <el-radio-button label="props">Props</el-radio-button>
        </el-radio-group>
      </div>
      <el-button
        type="primary"
        size="small"
        :icon="CopyDocument"
        :disabled="!code"
        class="code-block__copy"
        @click="copy"
      >
        复制代码
      </el-button>
    </div>

    <pre class="code-block__pre"><code class="code-block__code">{{ display }}</code></pre>

    <div v-if="copied" class="code-block__toast">已复制到剪贴板 ✓</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CopyDocument } from "@element-plus/icons-vue";

const props = defineProps<{
  /** 主代码片段（Vue） */
  code: string;
  /** 调试输出（Props JSON 形式） */
  debug?: string;
}>();

const activeTab = ref<"vue" | "props">("vue");
const copied = ref(false);

const display = computed(() => (activeTab.value === "vue" ? props.code : props.debug ?? ""));

const copy = async () => {
  const text = display.value;
  if (!text) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // 兜底：旧浏览器使用 textarea + execCommand
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch (e) {
    console.error("[CodeBlock] 复制失败", e);
  }
};
</script>

<style lang="scss" scoped>
.code-block {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e2e;
  border-radius: 10px;
  overflow: hidden;
  color: #cdd6f4;
}

.code-block__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #181825;
  border-bottom: 1px solid #313244;
  flex-shrink: 0;
}

.code-block__title {
  font-size: 12px;
  font-weight: 600;
  color: #cdd6f4;
}

.code-block__tabs {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.code-block__copy {
  flex-shrink: 0;
}

.code-block__pre {
  flex: 1;
  min-height: 0;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  background: #1e1e2e;
  color: #cdd6f4;
}

.code-block__code {
  white-space: pre;
  word-break: normal;
}

.code-block__toast {
  position: absolute;
  right: 16px;
  bottom: 16px;
  padding: 6px 14px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  animation: code-toast 1.5s ease;
}

@keyframes code-toast {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>