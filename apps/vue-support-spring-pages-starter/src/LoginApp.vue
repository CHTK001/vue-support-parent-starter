<template>
  <SpringConsoleLoginPage
    :title="page?.title || 'Spring Console'"
    :description="page?.description || '输入控制台账号密码后进入页面。'"
    :eyebrow="page?.eyebrow || 'Spring Console Login'"
    :auth-base-path="authBasePath"
  />
</template>

<script setup lang="ts">
import { SpringConsoleLoginPage } from "@pages/spring";
import { computed } from "vue";
import { resolveSpringAuthBasePath, resolveSpringPageDefinition } from "./support/runtime";

const page = computed(() => resolveSpringPageDefinition());
const authBasePath = resolveSpringAuthBasePath();
</script>
