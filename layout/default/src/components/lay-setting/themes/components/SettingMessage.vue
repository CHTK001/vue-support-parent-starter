<script setup lang="ts">
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScTooltip from "@repo/components/ScTooltip/index";
import ScSelect from "@repo/components/ScSelect/index.vue";

// ---- Props 定义 ----
const props = defineProps<{
  /** reactive 设置对象引用，子组件可直接修改 */
  settings: Record<string, any>;
  isDevelopment: boolean;
  isTest: boolean;
  showMessageChange: (value: boolean) => void;
  messageDropdownPositionChange: (value: string) => void;
  sendDevDefaultMessage: () => void;
}>();
</script>

<template>
  <!-- 消息配置区域 -->
  <div class="setting-section">
    <div class="section-header">
      <IconifyIconOnline icon="ri:notification-4-line" class="section-icon" />
      <h3 class="section-title">消息配置</h3>
      <div class="section-description">控制消息中心按钮显示以及下拉弹框的弹出位置</div>
    </div>
    <div class="setting-content">
      <div class="setting-item">
        <div class="switch-card-grid">
          <ScSwitch
            v-model="settings.showMessage"
            layout="visual-card"
            label="显示消息中心"
            description="控制 lay-header 的消息中心按钮是否显示"
            active-icon="ri:notification-4-fill"
            inactive-icon="ri:notification-off-line"
            @change="showMessageChange"
          />
        </div>
      </div>

      <div v-if="settings.showMessage" class="setting-item">
        <div class="setting-item-label">
          <span>弹出位置</span>
          <ScTooltip content="设置消息下拉弹框从哪个方向弹出" placement="top">
            <span class="setting-item-tip-trigger">
              <IconifyIconOnline icon="ri:question-line" class="setting-item-tip-icon" />
            </span>
          </ScTooltip>
        </div>
        <div class="setting-item-control">
          <ScSelect
            :model-value="settings.messageDropdownPosition"
            layout="position"
            :disabled="!settings.showMessage"
            @change="messageDropdownPositionChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>
