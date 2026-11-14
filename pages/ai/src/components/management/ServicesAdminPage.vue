<template>
  <!--
    服务管理（一级菜单）。

    为什么单独一层壳：这页原先只是「系统设置 → 系统 → 服务配置」里的一个 tab，
    外层套着设置页的页头、左侧设置导航和页签条，内容被压窄一截，
    和定稿的「网关控制台」版式对不上。提到一级菜单后：
      · 侧栏是应用自己的导航（与稿子一致），不再叠一层设置导航；
      · 页面拿到完整宽度，端口带一行能放下 5 张卡；
      · 页头仍由页面内的 RePageHead 提供，不重复建设。
    padding 与「路由」页同节奏，滚动交给这一层，页面本身不关心滚动条。
  -->
  <div class="svc-page">
    <ServiceManagementPage />
  </div>
</template>

<script setup lang="ts">
import ServiceManagementPage from './ServiceManagementPage.vue'
</script>

<style scoped>
.svc-page {
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  /* 外侧留白收到 8px：三栏内部已经是 2px 间距、卡面靠 1px 描边分界，
     外层再留 16/20/28 会在四周空出一圈，整页看起来像嵌在画布里 */
  padding: 8px;
}
</style>
