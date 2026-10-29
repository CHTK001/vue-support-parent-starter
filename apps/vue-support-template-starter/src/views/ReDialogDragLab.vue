<template>
  <div class="ddl">
    <h1 class="ddl__title">ReDialog 拖拽对照组</h1>
    <p class="ddl__sub">
      回归「弹窗能不能拖」。Element 的 useDraggable 在 <code>overflow=false</code> 时把位移钳制成
      「整个弹窗留在视口内」，近满高的弹窗竖向余量趋近 0，表现为完全拖不动 ——
      下面第 3 个就是这种规格。逐个按住标题栏拖一下即可验收。
    </p>

    <div class="ddl__row">
      <el-button type="primary" data-dd-open="el" @click="openEl = true">打开 el 布局（draggable）</el-button>
      <el-button data-dd-open="modern" @click="openModern = true">打开 modern 布局（draggable）</el-button>
      <el-button data-dd-open="tall" @click="openTall = true">打开近满高（模拟预览弹层）</el-button>
      <el-button data-dd-open="headless" @click="openHeadless = true">打开 headless（draggable）</el-button>
    </div>

    <div class="ddl__row">
      <span data-dd-state="el">el: {{ openEl }}</span>
      <span data-dd-state="modern">modern: {{ openModern }}</span>
      <span data-dd-state="tall">tall: {{ openTall }}</span>
      <span data-dd-state="headless">headless: {{ openHeadless }}</span>
    </div>

    <ReDialog
      v-model="openEl"
      title="可拖拽 · el 布局"
      :draggable="true"
      width="480px"
      top="12vh"
    >
      <div class="ddl__body" data-dd-body="el">按住标题栏拖动这个弹窗</div>
    </ReDialog>

    <ReDialog
      v-model="openModern"
      layout="modern"
      title="可拖拽 · modern 布局"
      :draggable="true"
      width="480px"
      top="12vh"
    >
      <div class="ddl__body" data-dd-body="modern">按住标题栏拖动这个弹窗</div>
    </ReDialog>

    <ReDialog
      v-model="openTall"
      class="ddl-tall"
      title="可拖拽 · 近满高"
      :draggable="true"
      width="min(1200px, 92vw)"
      top="5px"
    >
      <div class="ddl__body" data-dd-body="tall">模拟 filesystem 预览弹层（近满高）</div>
    </ReDialog>

    <ReDialog
      v-model="openHeadless"
      title="可拖拽 · headless"
      :draggable="true"
      headless
      width="480px"
      top="12vh"
    >
      <div class="ddl__body" data-dd-body="headless">headless 模式，顶部 44px 为拖拽热区</div>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import ReDialog from "@repo/ui/re-dialog";

const openEl = ref(false);
const openModern = ref(false);
const openTall = ref(false);
const openHeadless = ref(false);
</script>

<style scoped>
.ddl {
  padding: 24px;
}
.ddl__title {
  font-size: 18px;
  font-weight: 700;
}
.ddl__sub {
  margin: 6px 0 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.ddl__row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.ddl__body {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
}
</style>

<!-- 非 scoped：弹窗 teleport 到 body，scoped 样式够不到 -->
<style>
/* 近满高：与 filesystem 预览弹层同规格 */
.ddl-tall.el-dialog {
  height: calc(100vh - 20px);
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
}
</style>
