<template>
  <div class="bg-white p-[30px]">
    <div class="browser-info bg-white">
      <h1 class="text-2xl font-bold mb-4">浏览器信息</h1>
      <div class="flex flex-wrap gap-[5px]">
        <el-descriptions border :column="2">
          <el-descriptions-item v-for="(value, key) in browserInfo" :key="key" style="flex: 1 1 auto; width: calc(20% - 5px)" :label="key">
            {{ value }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";

const browserInfo = ref({});

const getBrowserInfo = () => {
  const info = {
    名称: navigator.appName,
    版本: navigator.appVersion,
    供应商: navigator.vendor,
    引擎: navigator.product,
    用户代理: navigator.userAgent,
    应用程序版本: navigator.appVersion,
    平台: navigator.platform,
    语言: navigator.language,
    屏幕分辨率: `${screen.width}x${screen.height}`,
    窗口大小: `${window.innerWidth}x${window.innerHeight}`,
    颜色深度: screen.colorDepth + " bits",
    在线状态: navigator.onLine,
    Cookies启用: navigator.cookieEnabled,
    Java启用: navigator.javaEnabled(),
    插件: Array.from(navigator.plugins)
      .map(plugin => plugin.name)
      .join(", "),
    MIME类型: Array.from(navigator.mimeTypes)
      .map(mimeType => mimeType.type)
      .join(", "),
    时区偏移: new Date().getTimezoneOffset(),
    时区: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
  return info;
};

onMounted(() => {
  browserInfo.value = getBrowserInfo();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-content {
  white-space: pre-wrap;
}
</style>
