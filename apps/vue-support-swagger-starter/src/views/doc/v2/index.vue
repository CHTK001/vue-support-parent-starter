<template>
  <div class="doc-v2-container">
    <iframe
      ref="iframeRef"
      :src="iframeSrc"
      frameborder="0"
      class="doc-v2-iframe"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";

/**
 * 路由对象
 */
const route = useRoute();

/**
 * iframe 引用
 */
const iframeRef = ref<HTMLIFrameElement>();

/**
 * iframe 源地址
 */
const iframeSrc = computed(() => {
  const baseUrl = "/doc-v2.html";
  const params = new URLSearchParams();
  
  // 默认使用 /v3/api-docs 作为 OpenAPI 规范地址（替代 Knife4j）
  const defaultSpecUrl = "/v3/api-docs";
  
  // 从路由查询参数获取配置
  if (route.query.baseUrl) {
    params.append("baseUrl", String(route.query.baseUrl));
  }
  if (route.query.url) {
    params.append("url", String(route.query.url));
  }
  // 如果没有指定 specUrl，使用默认值
  if (route.query.specUrl) {
    params.append("specUrl", String(route.query.specUrl));
  } else if (route.query.spec) {
    params.append("specUrl", String(route.query.spec));
  } else {
    // 默认使用 /v3/api-docs（Knife4j 的 OpenAPI 规范地址）
    params.append("specUrl", defaultSpecUrl);
  }
  if (route.query.title) {
    params.append("title", String(route.query.title));
  }
  if (route.query.username) {
    params.append("username", String(route.query.username));
  }
  if (route.query.user) {
    params.append("user", String(route.query.user));
  }
  if (route.query.password) {
    params.append("password", String(route.query.password));
  }
  if (route.query.pwd) {
    params.append("pwd", String(route.query.pwd));
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : `${baseUrl}?specUrl=${defaultSpecUrl}`;
});

/**
 * 组件挂载
 */
onMounted(() => {
  // iframe 加载完成后可以做一些处理
  if (iframeRef.value) {
    iframeRef.value.onload = () => {
      console.log("doc-v2 iframe loaded");
    };
  }
});
</script>

<style scoped lang="scss">
.doc-v2-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.doc-v2-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>

