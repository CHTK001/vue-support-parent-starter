<template>
  <div class="example-container">
    <h2 class="example-title">ScIp IP地址显示示例</h2>
    <p class="example-desc">用于显示 IP 地址及其归属地信息</p>

    <el-divider content-position="left">功能演示</el-divider>

    <div class="demo-section">
      <div class="demo-controls">
        <el-button type="primary" @click="setLocalIp">
          <IconifyIconOnline icon="ri:home-line" class="mr-1" />
          本地IP
        </el-button>
        <el-button @click="setGoogleDns">
          <IconifyIconOnline icon="ri:google-line" class="mr-1" />
          Google DNS
        </el-button>
        <el-button @click="setCloudflare">
          <IconifyIconOnline icon="ri:cloud-line" class="mr-1" />
          Cloudflare
        </el-button>
      </div>

      <el-form label-width="120px" class="config-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="IP 地址">
              <el-input v-model="config.ip" placeholder="输入IP，如 8.8.8.8" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <el-divider content-position="left">显示效果</el-divider>

      <div class="ip-display">
        <ScIp :ip="config.ip" />
      </div>
    </div>

    <el-divider content-position="left">代码示例</el-divider>

    <CodePreview :tabs="codeTabs" />

    <el-divider content-position="left">属性说明</el-divider>

    <el-table :data="propsData" border stripe class="props-table">
      <el-table-column prop="name" label="属性名" width="180" />
      <el-table-column prop="type" label="类型" width="150" />
      <el-table-column prop="default" label="默认值" width="120" />
      <el-table-column prop="description" label="说明" />
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScIp from "@repo/components/ScIp/index.vue";
import CodePreview from "./CodePreview.vue";

/**
 * ScIp 组件示例
 * @author CH
 * @version 1.0.0
 * @since 2025-12-02
 */

const config = reactive({
  ip: "8.8.8.8",
});

// 属性说明
const propsData = [
  {
    name: "ip",
    type: "string",
    default: "''",
    description: "要显示的 IP 地址",
  },
  {
    name: "showLocation",
    type: "boolean",
    default: "true",
    description: "是否显示归属地",
  },
];

// 代码示例
const codeTabs = computed(() => [
  {
    key: "template",
    label: "模板",
    icon: "ri:code-s-slash-line",
    language: "vue",
    code: `<ScIp ip="${config.ip}" />`,
  },
  {
    key: "script",
    label: "脚本",
    icon: "ri:javascript-line",
    language: "ts",
    code: `import ScIp from "@repo/components/ScIp/index.vue";

// 直接传入 IP 地址即可
const ip = "${config.ip}";`,
  },
]);

function setLocalIp() {
  config.ip = "127.0.0.1";
}

function setGoogleDns() {
  config.ip = "8.8.8.8";
}

function setCloudflare() {
  config.ip = "1.1.1.1";
}
</script>

<style scoped lang="scss">
.example-container {
  padding: 20px;
}

.example-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.example-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.demo-section {
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.demo-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.config-form {
  margin-top: 16px;
}

.ip-display {
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
}

.props-table {
  margin-bottom: 20px;
}
</style>
