<template>
  <div class="sc-password-strength-example">
    <div class="example-container">
      <!-- 左侧：属性配置面板 -->
      <div class="config-panel">
        <h3 class="panel-title">
          <IconifyIconOnline icon="ri:settings-3-line" />
          属性配置
        </h3>

        <ScForm label-position="top" size="small">
          <ScFormItem label="placeholder 占位文本">
            <ScInput v-model="config.placeholder" placeholder="输入占位文本" />
          </ScFormItem>

          <ScDivider />

          <div class="switch-group">
            <div class="switch-item">
              <ScTooltip content="是否禁用输入" placement="left">
                <span>disabled 禁用</span>
              </ScTooltip>
              <ScSwitch v-model="config.disabled" />
            </div>
          </div>

          <ScDivider />

          <div class="action-buttons">
            <ScButton type="primary" size="small" @click="generatePassword">
              <IconifyIconOnline icon="ri:key-line" />
              生成密码
            </ScButton>
            <ScButton size="small" @click="clearPassword">
              <IconifyIconOnline icon="ri:delete-bin-line" />
              清空
            </ScButton>
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
          <div class="password-wrapper">
            <ScPasswordStrength
              v-model="config.password"
              :placeholder="config.placeholder"
              :disabled="config.disabled"
            />
            <div class="password-value">
              当前密码：<code>{{ config.password || "(空)" }}</code>
            </div>
          </div>
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
import ScPasswordStrength from "@repo/components/ScPasswordStrength/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 配置项
const config = reactive({
  password: "",
  placeholder: "请输入密码",
  disabled: false
});

// 生成示例代码
const generatedCode = computed(() => {
  const props: string[] = [];

  props.push(`v-model="password"`);
  
  if (config.placeholder !== "请输入密码") {
    props.push(`placeholder="${config.placeholder}"`);
  }
  if (config.disabled) {
    props.push(`:disabled="true"`);
  }

  const propsStr = props.join("\n  ");
  return `<ScPasswordStrength\n  ${propsStr}\n/>`;
});

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789!@#$%";
  let pwd = "";
  for (let i = 0; i < 12; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  config.password = pwd;
}

function clearPassword() {
  config.password = "";
}
</script>

<style scoped lang="scss">
.sc-password-strength-example { padding: 20px; }
.example-container { display: flex; gap: 24px; @media (max-width: 900px) { flex-direction: column; } }
.config-panel { width: 320px; flex-shrink: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; @media (max-width: 900px) { width: 100%; } }
.preview-panel { flex: 1; min-width: 0; background: var(--el-bg-color); border: 1px solid var(--el-border-color-lighter); border-radius: 8px; padding: 20px; }
.panel-title { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 600; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.switch-group { display: flex; flex-direction: column; gap: 12px; }
.switch-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--el-text-color-regular); span { cursor: help; border-bottom: 1px dashed var(--el-border-color); } }
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.preview-area { padding: 40px; background: var(--el-fill-color-lighter); border-radius: 8px; display: flex; justify-content: center; align-items: center; }
.password-wrapper { width: 100%; max-width: 400px; }
.password-value { margin-top: 16px; padding: 12px; background: var(--el-bg-color); border-radius: 8px; color: var(--el-text-color-regular); code { padding: 2px 6px; background: var(--el-fill-color); border-radius: 4px; font-family: monospace; } }
.code-area { margin-top: 20px; }
.code-title { display: flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); .iconify { color: var(--el-color-primary); } }
.code-content { margin: 0; padding: 16px; background: #1e1e1e; border-radius: 6px; overflow-x: auto; code { font-size: 13px; font-family: "SF Mono", "Monaco", "Consolas", monospace; color: #d4d4d4; line-height: 1.6; } }
:deep(.el-form-item) { margin-bottom: 16px; }
:deep(.el-divider) { margin: 16px 0; }
</style>
