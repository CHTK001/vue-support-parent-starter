<template>
  <div class="spider-node-panel">
    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>页面访问</strong>
        <span>访问模式、目标地址与运行参数</span>
      </div>

      <label class="spider-node-panel__item">
        <span>节点标题</span>
        <el-input :model-value="nodeTitle" @update:model-value="updateTitle" />
      </label>

      <div class="spider-node-panel__item">
        <span>访问模式</span>
        <el-select :model-value="accessMode" @update:model-value="value => updateConfig('accessMode', value)">
          <el-option v-for="item in accessModeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </div>

      <label class="spider-node-panel__item">
        <span>目标地址</span>
        <el-input :model-value="targetUrl" @update:model-value="value => updateConfig('targetUrl', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>超时(秒)</span>
        <el-input-number :model-value="timeoutSeconds" :min="1" @update:model-value="value => updateConfig('timeoutSeconds', Number(value || 0))" />
      </label>

      </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>请求上下文</strong>
        <span>Cookie、Header、代理等运行参数</span>
      </div>

      <label class="spider-node-panel__item">
        <span>凭证池编码</span>
        <el-input :model-value="accountPoolCode" placeholder="关联 ACCOUNT 类型的数据池编码" @update:model-value="value => updateConfig('accountPoolCode', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>凭证条目编码</span>
        <el-input :model-value="accountItemCode" placeholder="可选，不填则取池中第一条" @update:model-value="value => updateConfig('accountItemCode', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>Cookie JSON</span>
        <el-input :model-value="cookieJson" type="textarea" :rows="4" @update:model-value="value => updateConfig('cookieJson', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>Header JSON</span>
        <el-input :model-value="headerJson" type="textarea" :rows="4" @update:model-value="value => updateConfig('headerJson', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>代理引用</span>
        <el-input :model-value="proxyRef" @update:model-value="value => updateConfig('proxyRef', value)" />
      </label>

    </div>

    <div class="spider-node-panel__section">
      <div class="spider-node-panel__section-head">
        <strong>登录编排</strong>
        <span>Playwright 模式下的声明式登录步骤（可选）</span>
      </div>

      <label class="spider-node-panel__item">
        <span>登录页地址</span>
        <el-input :model-value="loginUrl" placeholder="如 https://pan.baidu.com" @update:model-value="value => updateLoginConfig('loginUrl', value)" />
      </label>

      <label class="spider-node-panel__item">
        <span>登录后等待(ms)</span>
        <el-input-number :model-value="loginWaitAfter" :min="0" :step="1000" @update:model-value="value => updateLoginConfig('waitAfterLogin', Number(value || 0))" />
      </label>

      <label class="spider-node-panel__item">
        <span>登录步骤 JSON</span>
        <el-input :model-value="loginStepsJson" type="textarea" :rows="6" placeholder='[{"action":"click","selector":"#tab"},{"action":"fill","selector":"#user","value":"{username}"},{"action":"fill","selector":"#pass","value":"{password}"},{"action":"click","selector":"#submit"}]' @update:model-value="value => updateLoginStepsJson(value)" />
      </label>
    </div>

    <div class="spider-node-panel__footer">
      <el-button type="danger" plain @click="removeNode">删除节点</el-button>
      <el-button type="primary" @click="saveConfig">保存配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElButton, ElInput, ElInputNumber, ElOption, ElSelect } from "element-plus";
import type { ScMFlowNodeMeta } from "@repo/components/ScFlowEditor";
defineOptions({ name: "SpiderPageAccessConfigPanel" });

const props = defineProps<{
  nodeMeta: ScMFlowNodeMeta;
  nodeTitle: string;
  nodeConfig: Record<string, any>;
  updateTitle: (value: string) => void;
  updateConfig: (field: string, value: unknown) => void;
  saveConfig: () => void;
  removeNode: () => void;
}>();

const accessModeOptions = [
  { label: "HTTP", value: "HTTP" },
  { label: "Playwright", value: "PLAYWRIGHT" },
];

const accessMode = computed(() => String(props.nodeConfig.accessMode || "HTTP"));
const targetUrl = computed(() => String(props.nodeConfig.targetUrl || ""));
const timeoutSeconds = computed(() => Number(props.nodeConfig.timeoutSeconds || 30));
const accountPoolCode = computed(() => String(props.nodeConfig.accountPoolCode || ""));
const accountItemCode = computed(() => String(props.nodeConfig.accountItemCode || ""));
const cookieJson = computed(() => String(props.nodeConfig.cookieJson || ""));
const headerJson = computed(() => String(props.nodeConfig.headerJson || ""));
const proxyRef = computed(() => String(props.nodeConfig.proxyRef || ""));

// 登录编排配置
const loginConfig = computed(() => (props.nodeConfig.loginConfig as Record<string, any>) || {});
const loginUrl = computed(() => String(loginConfig.value.loginUrl || ""));
const loginWaitAfter = computed(() => Number(loginConfig.value.waitAfterLogin ?? 3000));
const loginStepsJson = computed(() => {
  const steps = loginConfig.value.steps;
  if (!steps || !Array.isArray(steps) || steps.length === 0) return "";
  return JSON.stringify(steps, null, 2);
});

function updateLoginConfig(field: string, value: unknown) {
  const current = { ...(props.nodeConfig.loginConfig as Record<string, any> || {}) };
  current[field] = value;
  props.updateConfig("loginConfig", current);
}

function updateLoginStepsJson(raw: string) {
  const current = { ...(props.nodeConfig.loginConfig as Record<string, any> || {}) };
  if (!raw || !raw.trim()) {
    delete current.steps;
  } else {
    try {
      current.steps = JSON.parse(raw);
    } catch {
      // 保留原值让用户继续编辑
      return;
    }
  }
  props.updateConfig("loginConfig", current);
}
</script>

<style scoped lang="scss">
.spider-node-panel { display: grid; gap: 16px; }
.spider-node-panel__section { display: grid; gap: 10px; }
.spider-node-panel__section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.spider-node-panel__section-head strong { color: var(--el-text-color-primary); font-size: 13px; font-weight: 700; }
.spider-node-panel__section-head span { color: var(--el-text-color-placeholder); font-size: 11px; }
.spider-node-panel__item { display: grid; gap: 6px; }
.spider-node-panel__item > span { color: var(--el-text-color-secondary); font-size: 12px; }
.spider-node-panel__switch { display: flex; align-items: center; gap: 8px; }
.spider-node-panel__footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.spider-node-panel :deep(.el-input__wrapper),
.spider-node-panel :deep(.el-textarea__inner),
.spider-node-panel :deep(.el-select__wrapper) { border-radius: 6px; }
</style>
