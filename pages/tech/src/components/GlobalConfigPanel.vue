<template>
  <div class="config-panel">
    <div class="config-panel__header">
      <span class="config-panel__title">全局配置</span>
    </div>
    <div class="config-panel__body">
      <section class="config-group">
        <h4 class="config-group__title">接口前缀</h4>
        <div class="config-field">
          <input
            type="text"
            :value="apiPrefix"
            placeholder="https://api.example.com"
            @input="updateApiPrefix(($event.target as HTMLInputElement).value)"
          />
          <p class="config-hint">所有数据绑定的 URL 将自动拼接此前缀</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const API_PREFIX_KEY = "tech-api-prefix";
const apiPrefix = localStorage.getItem(API_PREFIX_KEY) || "";

function updateApiPrefix(value: string) {
  localStorage.setItem(API_PREFIX_KEY, value);
}
</script>

<style lang="scss" scoped>
.config-panel {
  width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(5, 15, 30, 0.9);
  border-left: 1px solid rgba(0, 246, 255, 0.15);
  flex-shrink: 0;
}
.config-panel__header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.1);
}
.config-panel__title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 246, 255, 0.9);
}
.config-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}
.config-group {
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(0, 246, 255, 0.06);
  padding-bottom: 12px;
}
.config-group__title {
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  color: rgba(0, 246, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.config-field {
  label {
    display: block;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.5);
    margin-bottom: 4px;
  }
  input[type="text"] {
    width: 100%;
    padding: 5px 8px;
    background: rgba(0, 20, 40, 0.6);
    border: 1px solid rgba(0, 246, 255, 0.15);
    border-radius: 4px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    outline: none;
    transition: border-color 0.15s;
    &:focus {
      border-color: rgba(0, 246, 255, 0.4);
    }
  }
}
.config-hint {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  margin: 4px 0 0;
}
</style>
