<!--
 * DemoBlock 示例区域组件
 * 用于展示组件示例，支持查看/复制源码
 * @author CH
 * @version 1.0.0
 * @since 2025-12-06
-->
<template>
  <div class="demo-block" :class="{ 'demo-block--dark': dark, 'demo-block--gradient': gradient }">
    <div class="demo-block__header">
      <h4 class="demo-block__title">{{ title }}</h4>
      <div class="demo-block__actions">
        <el-tooltip :content="showCode ? '收起代码' : '查看代码'" placement="top">
          <div class="action-btn" @click="toggleCode">
            <IconifyIconOnline :icon="showCode ? 'ri:arrow-up-s-line' : 'ri:code-s-slash-line'" />
          </div>
        </el-tooltip>
        <el-tooltip content="复制代码" placement="top">
          <div class="action-btn" @click="copyCode">
            <IconifyIconOnline :icon="copied ? 'ri:check-line' : 'ri:file-copy-line'" />
          </div>
        </el-tooltip>
      </div>
    </div>
    <div class="demo-block__content">
      <slot />
    </div>
    <el-collapse-transition>
      <div v-show="showCode" class="demo-block__code">
        <div class="code-header">
          <span class="code-lang">VUE</span>
          <span class="code-tip">可直接复制使用</span>
        </div>
        <div class="code-content">
          <pre><code>{{ code }}</code></pre>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "@repo/utils";
import { IconifyIconOnline } from "@repo/components/ReIcon";

const props = defineProps<{
  title: string;
  code: string;
  dark?: boolean;
  gradient?: boolean;
}>();

const showCode = ref(false);
const copied = ref(false);

function toggleCode() {
  showCode.value = !showCode.value;
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code);
    copied.value = true;
    message("代码已复制到剪贴板", { type: "success" });
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    message("复制失败", { type: "error" });
  }
}
</script>

<style lang="scss" scoped>
.demo-block {
  margin-bottom: 24px;
  border-radius: 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;

  &--dark {
    background: linear-gradient(135deg, #0a1628 0%, #1a2840 100%);
    border-color: rgba(0, 246, 255, 0.2);

    .demo-block__title {
      color: #fff;
    }

    .action-btn {
      color: rgba(255, 255, 255, 0.7);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #00f6ff;
      }
    }
  }

  &--gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: rgba(255, 255, 255, 0.2);

    .demo-block__title {
      color: #fff;
    }

    .action-btn {
      color: rgba(255, 255, 255, 0.7);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }
  }
}

.demo-block__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  .demo-block--dark & {
    border-bottom-color: rgba(0, 246, 255, 0.1);
  }

  .demo-block--gradient & {
    border-bottom-color: rgba(255, 255, 255, 0.2);
  }
}

.demo-block__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.demo-block__actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }
}

.demo-block__content {
  padding: 20px;
}

.demo-block__code {
  border-top: 1px solid var(--el-border-color-lighter);
  background: #1e1e1e;

  .demo-block--dark &,
  .demo-block--gradient & {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background: #2d2d2d;
  border-bottom: 1px solid #3d3d3d;
}

.code-lang {
  font-size: 11px;
  color: #858585;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.code-tip {
  font-size: 11px;
  color: #6a9955;
}

.code-content {
  padding: 16px;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;

  pre {
    margin: 0;
    font-family: "Fira Code", "Consolas", "Monaco", monospace;
    font-size: 13px;
    line-height: 1.6;
  }

  code {
    color: #d4d4d4;
    white-space: pre;
  }
}
</style>
