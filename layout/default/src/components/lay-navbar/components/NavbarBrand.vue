<script setup lang="ts">
import { useNav } from "../../../hooks/useNav";
import { useRouter } from "vue-router";

const { title, getLogo } = useNav();
const router = useRouter();

function goHome() {
  router.push("/");
}
</script>

<template>
  <div class="navbar-brand" @click="goHome">
    <img :src="getLogo()" class="navbar-brand__logo" alt="logo" />
    <span class="navbar-brand__title">{{ title }}</span>
  </div>
</template>

<style lang="scss" scoped>
.navbar-brand {
  display: flex;
  align-items: center;
  gap: var(--dt-space-2);
  padding: 0 var(--dt-space-4);
  height: 100%;
  cursor: pointer;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity var(--dt-transition-fast);

  &:hover {
    opacity: 0.8;
  }

  &__logo {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }

  &__title {
    font-size: var(--dt-font-size-base);
    font-weight: var(--dt-font-weight-semibold);
    color: var(--el-text-color-primary);
    white-space: nowrap;
    letter-spacing: -0.01em;
  }
}
</style>
