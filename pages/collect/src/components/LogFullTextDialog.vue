<!--
  节点日志全文弹窗：TaskView「节点日志」表格的「出参预览」列只显示截断文本
  （后端 COLUMN_LIMIT=2000，再长前端表格还用省略号压一次），排查"数据去哪了"
  时必须看到完整消息与完整出参。这个弹窗只读展示 + 一键复制，不碰任何状态。

  打开与关闭：v-model；ReDialog 默认 closeOnPressEscape=true，Esc 可关。
-->
<script setup lang="ts">
import { computed } from "vue";
import { msgError, msgSuccess } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import type { CollectTaskLog } from "../types/collect";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    log?: CollectTaskLog | null;
  }>(),
  { log: null },
);

const emit = defineEmits<{ (event: "update:modelValue", value: boolean): void }>();

const visible = computed<boolean>({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const title = computed<string>(
  () => `日志全文 · ${props.log?.collectTaskLogNodeName || props.log?.collectTaskLogNodeId || ""}`,
);

const fullText = computed<string>(() => {
  const message = String(props.log?.collectTaskLogMessage ?? "");
  const output = String(props.log?.collectTaskLogOutput ?? "");
  return `【消息】\n${message || "—"}\n\n【出参预览】\n${output || "—"}`;
});

/**
 * 复制全文：优先 Clipboard API（localhost 安全上下文可用），
 * 失败时退回 textarea + execCommand，仍失败就如实提示手动复制。
 */
async function copyAll(): Promise<void> {
  const text = fullText.value;
  try {
    await navigator.clipboard.writeText(text);
    msgSuccess("已复制日志全文");
    return;
  } catch {
    // 无权限 / 非安全上下文时走降级
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    if (ok) {
      msgSuccess("已复制日志全文");
    } else {
      msgError("复制失败，请手动选择复制");
    }
  } catch {
    msgError("复制失败，请手动选择复制");
  }
}
</script>

<template>
  <ReDialog v-model="visible" :title="title" width="720px" top="8vh" footer-hidden>
    <div class="log-full">
      <h4 class="log-full__h">消息</h4>
      <pre class="log-full__pre">{{ String(log?.collectTaskLogMessage ?? "") || "—" }}</pre>
      <h4 class="log-full__h">出参预览</h4>
      <pre class="log-full__pre">{{ String(log?.collectTaskLogOutput ?? "") || "—" }}</pre>
      <div class="log-full__bar">
        <ReButton type="primary" icon="DocumentCopy" title="复制消息与出参全文" @click="copyAll">复制全文</ReButton>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.log-full__h {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.log-full__h + .log-full__h {
  margin-top: 12px;
}
.log-full__pre {
  margin: 0 0 12px;
  padding: 10px 12px;
  max-height: 260px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 12px;
  line-height: 1.6;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}
.log-full__bar {
  display: flex;
  justify-content: flex-end;
}
</style>
