<script setup lang="ts">
/**
 * 主机资产 · 独立窗口
 *
 * <p>由主机资产页头部的「独立窗口」按钮打开（{@code window.open}）。本视图
 * 只渲染主机资产本身：左侧主机列表 + 右侧多标签工作区 + 底部指标条，
 * 不带应用的侧边栏、顶栏与面包屑 —— 单独摆到第二块屏幕上盯机器时，
 * 每一条像素都该是主机信息。</p>
 *
 * <p>路由用 {@code meta.standalone}，由 {@code registerRoutesUnderLayout}
 * 注册为顶层路由，因此本组件不必也不应该再套一层布局。</p>
 *
 * @author CH
 * @since 4.0.0
 */
import { computed } from "vue";
import AssetsView from "./AssetsView.vue";

/** 当前窗口是否由本页面自己打开（用于决定要不要给「回到主窗口」按钮） */
const openedByParent = computed(() => window.opener != null);

/**
 * 关掉独立窗口。
 *
 * <p>不是所有浏览器都允许脚本关闭非脚本打开的窗口，关不掉时退化为
 * 留在当前窗口（用户自己按 Ctrl+W），不做无意义的报错。</p>
 */
function closeWindow(): void {
  window.close();
}
</script>

<template>
  <div class="as-standalone">
    <header class="as-standalone__bar">
      <span class="as-standalone__dot" />
      <b class="as-standalone__title">主机资产</b>
      <span class="as-standalone__hint">独立窗口 · 仅显示主机资产</span>
      <span class="as-standalone__gap" />
      <button v-if="openedByParent" type="button" class="as-standalone__btn" @click="closeWindow">
        关闭窗口
      </button>
    </header>
    <main class="as-standalone__body">
      <AssetsView />
    </main>
  </div>
</template>

<style scoped lang="scss">
.as-standalone {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  box-sizing: border-box;
  padding: 10px 12px 12px;
  background: var(--bg-page, var(--el-bg-color-page));
}

/* 一条 26px 的标题带：告诉用户「这是独立窗口」，其余空间全给资产 */
.as-standalone__bar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 2px 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.as-standalone__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.as-standalone__title {
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.as-standalone__hint {
  color: var(--el-text-color-placeholder);
}

.as-standalone__gap {
  flex: 1;
}

.as-standalone__btn {
  padding: 3px 10px;
  font-size: 11.5px;
  font-family: inherit;
  color: var(--el-text-color-regular);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.as-standalone__btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}

.as-standalone__body {
  flex: 1;
  min-height: 0;
}
</style>
