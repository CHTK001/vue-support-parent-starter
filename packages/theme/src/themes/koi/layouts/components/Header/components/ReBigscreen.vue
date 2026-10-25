<!--
  顶栏大屏入口图标
  - 显隐由 app.yaml other.bigscreen.enable 控制（不在设置面板暴露，纯 yaml 配置）
  - 点击在新窗口打开 bigscreen.url（默认 /bigscreen，独立窗口 windowFeatures）
  - 不挂 popover，纯按钮
-->
<template>
  <el-tooltip :content="$t('header.bigscreen')" placement="bottom" :show-after="300">
    <div class="bigscreen-trigger" :title="$t('header.bigscreen')" @click="openBigscreen">
      <!-- 动画图标（hover/focus 播放）；上游无 Monitor，取分屏栅格表达「多屏大屏」 -->
      <ReIcon name="anim:tabler:layout-grid" :size="18" />
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { getConfig } from "@repo/config";

const bigscreenUrl = () => getConfig().other.bigscreen.url || "/bigscreen";
const windowFeatures = () => getConfig().other.bigscreen.windowFeatures || "width=1920,height=1080";

/**
 * 在新窗口打开大屏路由
 * - 大屏通常独立分辨率（1920×1080），用 window.open 避免影响当前 SPA 布局
 * - noopener 防 window.opener 引用泄漏；noreferrer 同样安全策略
 * - 失败回退：父窗口用 router.push 跳转（保底，避免点击无响应）
 */
function openBigscreen() {
  const url = bigscreenUrl();
  // 拼接绝对地址：相对路径走 window.location.origin
  const fullUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;
  const win = window.open(fullUrl, "_blank", windowFeatures());
  if (!win) {
    // 浏览器拦截弹窗：回退到当前窗口跳转
    window.location.href = fullUrl;
  }
}
</script>

<style lang="scss" scoped>
.bigscreen-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: 0 2px;
  cursor: pointer;
  color: var(--el-text-color-regular);
  background: transparent;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease, transform 0.3s ease;

  &:hover {
    color: var(--el-color-primary);
    background: var(--el-header-icon-hover-bg-color, rgba(0, 0, 0, 0.06));
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.94);
  }
}
</style>
