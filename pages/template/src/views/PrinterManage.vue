<!--
  打印机管理页面
  - 接口：/template/printer（挂在“系统管理”下方，系统菜单里可见）
  - 能力来自独立组件：RePrinter（page 模式）——
    第三方打印机接入（地址/端口/Token）、设默认、发现、新增/编辑/删除
  - 前端打印流的其它页面（设计器/预览页）只要重载 default 即可直接选它
  @since 4.0.0.60
  @author CH
-->
<template>
  <div class="printer">
    <!-- ==================== 顶栏 ==================== -->
    <header class="printer-header">
      <div class="printer-header__left">
        <h1 class="printer-header__title">打印机管理</h1>
        <span class="printer-header__count">所有接入的打印机（局域网 / 第三方的打印代理）</span>
      </div>
      <div class="printer-header__right">
        <ReButton type="info" text @click="onRefresh">
          <ReIcon name="RefreshRight" :size="12" />
          刷新列表
        </ReButton>
      </div>
    </header>

    <!-- ==================== 主体：RePrinter（page 模式） ==================== -->
    <RePrinter mode="page" title="打印机管理" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReIcon from '@repo/ui/re-icon'
import ReButton from '@repo/ui/re-button'
import RePrinter from '../components/RePrinter.vue'

const tableRef = ref<Record<string, unknown> | null>(null)

/** 刷新列表（RePrinter 内部重载 loader） */
function onRefresh(): void {
  tableRef.value?.reload()
}
</script>

<style lang="scss" scoped>
.printer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
}

.printer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.printer-header__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.printer-header__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.printer-header__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.printer-header__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
