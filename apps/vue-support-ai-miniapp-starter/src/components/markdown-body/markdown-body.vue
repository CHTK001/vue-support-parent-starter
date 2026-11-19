<template>
  <view class="md-body">
    <template v-for="(block, index) in blocks" :key="index">
      <!-- 围栏代码块：横向滚动 + 长按复制 -->
      <view v-if="block.type === 'code'" class="md-code">
        <view v-if="block.lang" class="md-code-head">
          <text class="md-code-lang">{{ block.lang }}</text>
        </view>
        <scroll-view scroll-x class="md-code-scroll">
          <text class="md-code-text" @longpress="copy(block.text)">{{ block.text }}</text>
        </scroll-view>
      </view>

      <view
        v-else-if="block.type === 'heading'"
        class="md-heading"
        :class="'md-heading--' + block.level"
      >
        <md-inline :segments="block.inlines" />
      </view>

      <view v-else-if="block.type === 'list'" class="md-list">
        <view v-for="(item, itemIndex) in block.items" :key="itemIndex" class="md-list-item">
          <text class="md-list-mark">{{ block.ordered ? itemIndex + 1 + "." : "•" }}</text>
          <view class="md-list-body">
            <md-inline :segments="item" />
          </view>
        </view>
      </view>

      <view v-else-if="block.type === 'quote'" class="md-quote">
        <md-inline :segments="block.inlines" />
      </view>

      <view v-else class="md-paragraph">
        <md-inline :segments="block.inlines" />
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import type { MarkdownBlock } from "../../utils/markdown";

/**
 * Markdown 渲染（小程序端）。
 *
 * <p>只接收解析好的块（{@link MarkdownBlock}），不自己解析：解析节奏由页面控制，
 * 流式输出时按节流重算一次，避免每个 chunk 都做一遍正则。</p>
 *
 * <p>对齐方式由 easycom-autoscan 自动注册（{@code components/markdown-body/markdown-body.vue}），
 * 页面里直接写 {@code <markdown-body :blocks="..." />}，无需 import。</p>
 */
defineProps<{ blocks: MarkdownBlock[] }>();

function copy(text: string) {
  if (!text) return;
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: "代码已复制", icon: "none" }),
  });
}
</script>

<style scoped>
.md-body {
  color: inherit;
  font-size: inherit;
  line-height: inherit;
  word-break: break-word;
}

/* ---------- 段落 / 标题 ---------- */
.md-paragraph {
  margin: 0 0 12rpx;
  font-size: 28rpx;
  line-height: 1.65;
}

.md-paragraph:last-child {
  margin-bottom: 0;
}

.md-heading {
  margin: 16rpx 0 10rpx;
  font-weight: 600;
  line-height: 1.45;
}

.md-heading--1 {
  font-size: 34rpx;
}

.md-heading--2 {
  font-size: 31rpx;
}

.md-heading--3 {
  font-size: 29rpx;
}

/* ---------- 列表 ---------- */
.md-list {
  margin: 6rpx 0 12rpx;
}

.md-list-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 6rpx;
}

.md-list-mark {
  width: 34rpx;
  flex-shrink: 0;
  font-size: 28rpx;
  line-height: 1.65;
  color: #6b7280;
}

.md-list-body {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  line-height: 1.65;
}

/* ---------- 引用 ---------- */
.md-quote {
  margin: 8rpx 0 12rpx;
  padding: 10rpx 0 10rpx 20rpx;
  border-left: 6rpx solid #c9d4e8;
  font-size: 27rpx;
  line-height: 1.6;
  color: #6b7280;
}

/* ---------- 代码块 ---------- */
.md-code {
  margin: 10rpx 0 14rpx;
  background: #1f2329;
  border-radius: 12rpx;
  overflow: hidden;
}

.md-code-head {
  padding: 8rpx 20rpx;
  background: #2b313a;
}

.md-code-lang {
  font-size: 20rpx;
  color: #9aa4b2;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

.md-code-scroll {
  width: 100%;
  white-space: nowrap;
}

.md-code-text {
  display: inline-block;
  padding: 18rpx 20rpx;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 24rpx;
  line-height: 1.6;
  color: #e6e8eb;
  white-space: pre;
}
</style>
