<template>
  <div class="code-block">
    <div class="code-block__header">
      <span class="code-block__title">代码片段</span>
      <div class="code-block__tabs">
        <el-radio-group v-model="activeTab" >
          <el-radio-button label="vue">Vue</el-radio-button>
          <el-radio-button label="props">Props</el-radio-button>
        </el-radio-group>
      </div>
      <el-button
        type="primary"

        :icon="CopyDocument"
        :disabled="!code"
        class="code-block__copy"
        @click="copy"
      >
        复制代码
      </el-button>
    </div>

    <pre class="code-block__pre"><code class="code-block__code">{{ display }}</code></pre>

    <div v-if="copied" class="code-block__toast">
      <span>已复制到剪贴板</span>
      <!-- 用图标组件代替 ✓ 字符：几何字符作图标在不同字体下渲染不一致 -->
      <ReIcon name="CircleCheck" :size="14" aria-hidden="true" />
    </div>
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
  /* 代码块是独立的深色编辑器语境，与页面浅色主题令牌不同源，
     因此把这一小套配色集中声明成本组件的局部令牌，
     下面各处只引用 var()，不再散落写死色值。 */
  --code-bg: #1e1e2e;
  --code-bg-header: #181825;
  --code-border: #313244;
  --code-text: #cdd6f4;
  --code-success: #10b981;
  --code-success-deep: #059669;

  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--code-bg);
  /* 原 10px，取最近档 lg(12px)：代码块属卡片层 */
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  color: var(--code-text);
}

.code-block__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--code-bg-header);
  border-bottom: 1px solid var(--code-border);
  flex-shrink: 0;
}

.code-block__title {
  font-size: 12px;
  font-weight: 600;
  color: var(--code-text);
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
  background: var(--code-bg);
  color: var(--code-text);
}

.code-block__code {
  white-space: pre;
  word-break: normal;
}

.code-block__toast {
  position: absolute;
  right: 16px;
  bottom: 16px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  font-size: 12px;
  color: var(--code-text);
  background: linear-gradient(135deg, var(--code-success) 0%, var(--code-success-deep) 100%);
  border-radius: var(--el-radius-sm, 6px);
  /* 浮层反馈类投影，色值取局部成功色令牌 */
  box-shadow: 0 4px 12px color-mix(in srgb, var(--code-success) 30%, transparent);
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

/* 尊重系统「减少动态效果」偏好。
   提示条的存亡由脚本里的 1500ms 定时器驱动、与本动画无关，
   关掉动画后它仍以不透明静态样式完整显示 1.5 秒，反馈不会丢。 */
@media (prefers-reduced-motion: reduce) {
  .code-block__toast {
    animation: none;
  }
}
</style>