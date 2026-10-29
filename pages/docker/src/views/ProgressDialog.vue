<script setup lang="ts">
/**
 * 通用「SSE 操作进度」弹窗
 *
 * <p>卸载容器 / 卸载镜像 / 下载镜像都走 SSE，事件流为
 * {@code step | log | error | done}；本组件只负责展示，不持有连接 ——
 * 连接与状态由调用方管理，避免弹窗关闭时连接被意外复用。</p>
 *
 * @author CH
 * @since 4.0.0.46
 */
import { computed, nextTick, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    /** 是否显示 */
    modelValue?: boolean;
    /** 标题 */
    title?: string;
    /** 执行中（执行中禁止关闭） */
    running?: boolean;
    /** 成功结束 */
    done?: boolean;
    /** 失败结束 */
    failed?: boolean;
    /** 已收到的进度行 */
    lines?: string[];
  }>(),
  { modelValue: false, title: "操作进度", running: false, done: false, failed: false, lines: () => [] },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const box = ref<HTMLElement | null>(null);

/** 状态文案 */
const statusText = computed(() => {
  if (props.running) return "执行中…";
  if (props.done) return "已完成";
  if (props.failed) return "失败";
  return "等待开始";
});

/** 已收到输出时自动滚到底部 */
watch(
  () => props.lines.length,
  () => {
    void nextTick(() => {
      if (box.value) box.value.scrollTop = box.value.scrollHeight;
    });
  },
);

/** 关闭（执行中不允许关闭，避免用户误以为操作已取消） */
function close(): void {
  if (props.running) return;
  emit("update:modelValue", false);
  emit("close");
}
</script>

<template>
  <div v-if="modelValue" class="dk-mask" @click.self="close">
    <div class="dk-modal dk-modal--progress" role="dialog" aria-modal="true">
      <div class="dk-modal-head">
        <ReIcon name="Loading" :size="14" />
        <b>{{ title }}</b>
        <span class="dk-spacer" />
        <ReButton layout="square" link icon="Close" tip="关闭" :disabled="running" @click="close" />
      </div>

      <div class="dk-modal-body dk-progress">
        <div class="dk-progress-head">
          <i class="dk-live" :class="{ on: running }" />
          <span>{{ statusText }}</span>
        </div>
        <pre ref="box" class="dk-log dk-log--progress">{{ lines.length ? lines.join("\n") : "等待后端输出…" }}</pre>
      </div>

      <div class="dk-modal-foot">
        <span class="dk-spacer" />
        <ReButton :disabled="running" @click="close">关闭</ReButton>
      </div>
    </div>
  </div>
</template>
