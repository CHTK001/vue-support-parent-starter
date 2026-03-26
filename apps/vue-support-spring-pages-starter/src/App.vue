<template>
  <component
    :is="page.component"
    v-if="page"
    :title="page.title"
    :description="page.description"
    :eyebrow="page.eyebrow"
    :default-api-root="apiRoot"
    :storage-key="storageKey"
  />
  <div v-else class="spring-login-shell">
    <section class="spring-login-card spring-card">
      <div class="spring-login-copy">
        <span class="spring-eyebrow">Spring Pages</span>
        <h1>页面未注册</h1>
        <p>当前构建指定的页面 key 未注册，请检查发布目标映射和页面装配表。</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { resolveSpringApiRoot, resolveSpringPageDefinition, resolveSpringStorageKey } from "./support/runtime";

const page = computed(() => resolveSpringPageDefinition());
const apiRoot = resolveSpringApiRoot();
const storageKey = resolveSpringStorageKey();
</script>
