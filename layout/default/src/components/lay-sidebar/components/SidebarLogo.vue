<script setup lang="ts">
import { getTopMenu } from "@repo/core";
import { useNav } from "../../../hooks/useNav";
import TypeIt from "@repo/components/ReTypeit";

defineProps({
  collapse: Boolean,
});

const { title, getLogo } = useNav();
</script>

<template>
  <div class="sidebar-logo-container" :class="{ collapses: collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" :title="title" class="sidebar-logo-link" :to="getTopMenu()?.path ?? '/'">
        <img :src="getLogo()" alt="logo" />
        <span class="sidebar-title"><TypeIt :options="{ strings: [title], cursor: false, speed: 100 }" /></span>
      </router-link>
      <router-link v-else key="expand" :title="title" class="sidebar-logo-link" :to="getTopMenu()?.path ?? '/'">
        <img :src="getLogo()" alt="logo" />
        <span class="sidebar-title"><TypeIt :options="{ strings: [title], cursor: false, speed: 100 }" /></span>
      </router-link>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 48px;
  overflow: hidden;

  .sidebar-logo-link {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    height: 100%;
    padding-left: 10px;

    img {
      display: inline-block;
      height: 32px;
    }

    .sidebar-title {
      display: inline-block;
      height: 32px;
      margin: 2px 0 0 12px;
      overflow: hidden;
      font-size: 18px;
      font-weight: 600;
      line-height: 32px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
