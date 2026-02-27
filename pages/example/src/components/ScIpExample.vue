<template>
  <div class="sc-ip-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="ip 地址">
            <ScInput v-model="config.ip" placeholder="请输入IP地址" />
          </ScFormItem>

          <ScFormItem label="快捷选择">
            <ScSelect
              v-model="config.ip"
              layout="card"
              :options="ipPresets"
              :gap="6"
              width="90px"
            />
          </ScFormItem>

          <ScFormItem label="physicalAddress 物理地址（可选）">
            <ScInput v-model="config.physicalAddress" placeholder="直接传入则不查询" />
          </ScFormItem>

          <ScFormItem label="emptyText 空文本">
            <ScInput v-model="config.emptyText" placeholder="无法获取时显示" />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="是否显示原始IP地址" placement="left">
                <span>showOriginal 显示IP</span>
              </ScTooltip>
              <ScSwitch v-model="config.showOriginal" />
            </div>
            <div class="switch-item">
              <ScTooltip content="IP地址是否可点击跳转搜索" placement="left">
                <span>openSearchOriginal 可搜索</span>
              </ScTooltip>
              <ScSwitch v-model="config.openSearchOriginal" />
            </div>
          </div>
        </ScForm>
      </div>

      <!-- 右侧：预览和结果 -->
      <div class="preview-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:eye-line" />
          效果预览
        </h3>

        <div class="preview-area">
          <ScIp
            :ip="config.ip"
            :physical-address="config.physicalAddress || undefined"
            :show-original="config.showOriginal"
            :open-search-original="config.openSearchOriginal"
            :empty-text="config.emptyText"
          />
        </div>

        <div class="code-area">
          <h4 class="code-title">
            <IconifyIconOnline icon="ri:code-s-slash-line" />
            示例代码
          </h4>
          <pre class="code-content"><code>{{ generatedCode }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from "vue";
import ScIp from "@repo/components/ScIp/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// IP预设选项
const ipPresets = [
  { label: "Google", value: "8.8.8.8", icon: "ri:google-fill" },
  { label: "Cloudflare", value: "1.1.1.1", icon: "ri:cloud-line" },
  { label: "114 DNS", value: "114.114.114.114", icon: "ri:global-line" },
  { label: "阿里 DNS", value: "223.5.5.5", icon: "ri:alipay-fill" },
  { label: "内网", value: "192.168.1.1", icon: "ri:home-wifi-line" }
];

// 配置项
const config = reactive({
  ip: "8.8.8.8",
  physicalAddress: "",
  showOriginal: true,
  openSearchOriginal: true,
  emptyText: "未知"
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  props.push(`ip="${config.ip}"`);
  
  if (config.physicalAddress) {
    props.push(`physical-address="${config.physicalAddress}"`);
  }
  if (!config.showOriginal) {
    props.push(`:show-original="false"`);
  }
  if (!config.openSearchOriginal) {
    props.push(`:open-search-original="false"`);
  }
  if (config.emptyText !== "未知") {
    props.push(`empty-text="${config.emptyText}"`);
  }

  const propsStr = props.length > 0 ? "\n  " + props.join("\n  ") + "\n" : " ";

  return `<ScIp${propsStr}/>`;
});
</script>

<style scoped lang="scss">
.sc-ip-example {
  padding: 20px;
}

.example-container {
  display: flex;
  gap: 24px;

  @media (max-width: 900px) {
    flex-direction: column;
  }
}

.config-panel {
  width: 320px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;

  @media (max-width: 900px) {
    width: 100%;
  }
}

.preview-panel {
  flex: 1;
  min-width: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 20px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.switch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-regular);

  span {
    cursor: help;
    border-bottom: 1px dashed var(--el-border-color);
  }
}

.preview-area {
  padding: 40px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
}

.code-area {
  margin-top: 20px;
}

.code-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  .iconify {
    color: var(--el-color-primary);
  }
}

.code-content {
  margin: 0;
  padding: 16px;
  background: #1e1e1e;
  border-radius: 6px;
  overflow-x: auto;

  code {
    font-size: 13px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    color: #d4d4d4;
    line-height: 1.6;
  }
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-divider) {
  margin: 16px 0;
}
</style>
