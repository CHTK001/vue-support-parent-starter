<template>
  <text class="md-inline"><template v-for="(segment, index) in segments" :key="index"><text
      v-if="segment.type === 'code'"
      class="md-inline-code"
    >{{ segment.text }}</text><text
      v-else-if="segment.type === 'strong'"
      class="md-inline-strong"
    >{{ segment.text }}</text><text
      v-else-if="segment.type === 'em'"
      class="md-inline-em"
    >{{ segment.text }}</text><text
      v-else-if="segment.type === 'link'"
      class="md-inline-link"
      @tap="copyLink(segment.href)"
    >{{ segment.text }}</text><text v-else>{{ segment.text }}</text></template></text>
</template>

<script setup lang="ts">
import type { InlineSegment } from "../../utils/markdown";

/**
 * 行内片段渲染。
 *
 * <p>根节点必须是单个 {@code <text>}：小程序组件不支持多根节点，而嵌套
 * {@code <text>} 是微信支持的写法，能保住行内排版（加粗/代码/链接混排）。</p>
 *
 * <p>链接不跳外链：小程序打开外部浏览器需要业务域名白名单，这里统一改成
 * "点击复制链接"，行为可预期且不依赖配置。</p>
 */
defineProps<{ segments: InlineSegment[] }>();

function copyLink(href: string) {
  if (!href) return;
  uni.setClipboardData({
    data: href,
    success: () => uni.showToast({ title: "链接已复制", icon: "none" }),
  });
}
</script>

<style scoped>
.md-inline {
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

.md-inline-code {
  padding: 0 8rpx;
  margin: 0 2rpx;
  border-radius: 6rpx;
  background: rgba(31, 35, 41, 0.07);
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 25rpx;
}

.md-inline-strong {
  font-weight: 600;
}

.md-inline-em {
  font-style: italic;
}

.md-inline-link {
  color: #2f6fed;
  text-decoration: underline;
}
</style>
