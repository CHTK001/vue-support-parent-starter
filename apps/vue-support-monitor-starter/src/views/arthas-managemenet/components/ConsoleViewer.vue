<template>
  <div class="console-viewer">
    <el-alert type="info" :closable="false" show-icon class="mb-2" title="提示：控制台由后端代理连接（HTTP/WS），前端仅展�? />
    <iframe v-if="url" :src="url" class="console-iframe" frameborder="0" />
    <div v-else class="tip">后端未提供控制台代理地址或连接尚未建�?/div>
  </div>
</template>

<style scoped>
.console-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.console-iframe {
  flex: 1;
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.mb-2 {
  margin-bottom: 8px;
}
</style>
