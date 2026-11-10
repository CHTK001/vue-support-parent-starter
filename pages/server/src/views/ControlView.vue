<script setup lang="ts">
/**
 * 控制管理（主机远控专用工作台）。
 *
 * <p>与「主机资产」共用同一个视图：左侧主机栏、搜索、分组、排序、状态筛选、底部指标条
 * 全部一致，区别只有两处 —— </p>
 * <ul>
 *   <li>点一下左侧主机，右侧直接打开该主机的远控页签；</li>
 *   <li>右键菜单只保留远控相关的少量动作（远程控制 / 编辑主机 / 复制地址 / 关闭页签），
 *       不出现画像、文件、运维台、Agent 等资产管理入口。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.51
 */
import AssetsView from "./AssetsView.vue";
</script>

<template>
  <AssetsView mode="control" />
</template>
