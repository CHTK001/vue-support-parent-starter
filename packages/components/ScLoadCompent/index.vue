<template>
  <div class="loading-container">
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
</template>

<script>
export default {
  name: "LoadingComponent"
};
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%; /* 或者设定为一个具体的高度，比如 200px */
}

.spinner {
  border: 4px solid var(--el-border-color-lighter);
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border-left-color: var(--el-color-primary);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

p {
  margin-top: 10px;
  font-size: 14px;
  color: var(--el-text-color-primary);
}
</style>
