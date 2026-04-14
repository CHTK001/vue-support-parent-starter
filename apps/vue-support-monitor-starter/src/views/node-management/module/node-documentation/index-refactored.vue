<template>
  <div class="node-doc-page">
    <header class="node-doc-header">
      <button type="button" class="node-doc-back" @click="goBack">
        返回
      </button>
      <div class="node-doc-meta">
        <h3>{{ nodeName }}</h3>
        <p v-if="specUrl">规范地址：{{ specUrl }}</p>
      </div>
    </header>

    <iframe
      v-if="iframeSrc"
      class="node-doc-iframe"
      :src="iframeSrc"
      frameborder="0"
    />
    <section v-else class="node-doc-empty">
      当前节点缺少地址信息，无法加载文档。
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const nodeName = computed(() => String(route.query.nodeName || "节点文档"));
const nodeAddress = computed(() => String(route.query.nodeAddress || ""));
const contextPath = computed(() => String(route.query.contextPath || ""));

const specUrl = computed(() => {
  if (!nodeAddress.value) return "";
  const base = `http://${nodeAddress.value}${contextPath.value}`;
  return `${base.replace(/\/$/, "")}/v3/api-docs`;
});

const iframeSrc = computed(() => {
  if (!specUrl.value) return "";
  const params = new URLSearchParams({
    title: nodeName.value,
    specUrl: specUrl.value,
  });
  return `/doc-v2.html?${params.toString()}`;
});

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss">
.node-doc-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.node-doc-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.node-doc-meta h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.node-doc-meta p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.node-doc-back {
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

.node-doc-iframe {
  width: 100%;
  height: 100%;
  min-height: 640px;
  border: 0;
}

.node-doc-empty {
  padding: 24px;
  color: var(--el-text-color-secondary);
}
</style>
