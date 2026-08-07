<template>
  <div class="custom-widget">
    <template v-if="config?.url">
      <div v-if="config.title" class="custom-widget__header">
        <span class="custom-widget__title">{{ config.title }}</span>
      </div>
      <div class="custom-widget__frame-wrap" :style="frameWrapStyle">
        <iframe
          class="custom-widget__frame"
          :src="config.url"
          :scrolling="config.scrolling === false ? 'no' : 'auto'"
          frameborder="0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen"
        />
      </div>
    </template>
    <ReEmpty v-else description="自定义组件未配置，请进入「自定义布局」编辑模式点击「配置」设置 URL" />
  </div>
</template>

<script setup lang="ts" name="CustomWidget">
/**
 * 自定义组件（iframe 嵌入）
 *
 * 通过 widget.config（CustomWidgetConfig）渲染外部 URL。
 * 未配置 url 时展示引导提示，引导用户进入编辑模式配置。
 */
import { computed, defineAsyncComponent } from "vue";
import type { WidgetItem } from "../types";

const ReEmpty = defineAsyncComponent(() => import("@repo/ui/re-empty").then((m) => m.default));

const props = defineProps<{ widget: WidgetItem }>();

const config = computed(() => props.widget.config);

const frameWrapStyle = computed(() => {
  if (config.value?.heightMode === "fixed" && config.value?.fixedHeight) {
    return { height: `${config.value.fixedHeight}px` };
  }
  return { flex: "1", minHeight: "0" };
});
</script>

<style lang="scss" scoped>
.custom-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
}

.custom-widget__header {
  flex-shrink: 0;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}

.custom-widget__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.custom-widget__frame-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.custom-widget__frame {
  flex: 1;
  width: 100%;
  border: none;
  background: #fff;
}
</style>
