<template>
  <div class="profile-preference-container">
    <ScCard class="preference-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span class="card-title">个人偏好设置</span>
          <ScButton type="primary" :loading="saveLoading" @click="handleSave">
            保存设置
          </ScButton>
        </div>
      </template>

      <div class="preference-sections">
        <div class="preference-section">
          <div class="section-title">外观设置</div>
          <div class="section-content">
            <div class="preference-item">
              <div class="item-info">
                <div class="item-label">主题模式</div>
                <div class="item-desc">选择您喜欢的主题模式</div>
              </div>
              <div class="item-control">
                <ScRadioGroup v-model="preferences.theme">
                  <ScRadio label="light">浅色</ScRadio>
                  <ScRadio label="dark">深色</ScRadio>
                  <ScRadio label="auto">跟随系统</ScRadio>
                </ScRadioGroup>
              </div>
            </div>
            <div class="preference-item">
              <div class="item-info">
                <div class="item-label">紧凑模式</div>
                <div class="item-desc">减少页面元素间距</div>
              </div>
              <div class="item-control">
                <ScSwitch v-model="preferences.compactMode" />
              </div>
            </div>
          </div>
        </div>

        <div class="preference-section">
          <div class="section-title">通知设置</div>
          <div class="section-content">
            <div class="preference-item">
              <div class="item-info">
                <div class="item-label">桌面通知</div>
                <div class="item-desc">允许系统发送桌面通知</div>
              </div>
              <div class="item-control">
                <ScSwitch v-model="preferences.desktopNotification" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScCard>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import {
  ScCard,
  ScButton,
  ScRadio,
  ScRadioGroup,
  ScSwitch,
} from "@repo/components";
import { ScMessage } from "@repo/utils";

const preferences = reactive({
  theme: "light",
  compactMode: false,
  desktopNotification: true,
});

const saveLoading = ref(false);

const handleSave = async () => {
  saveLoading.value = true;
  try {
    localStorage.setItem("userPreferences", JSON.stringify(preferences));
    ScMessage.success("设置已保存");
  } finally {
    saveLoading.value = false;
  }
};

onMounted(() => {
  const saved = localStorage.getItem("userPreferences");
  if (saved) {
    Object.assign(preferences, JSON.parse(saved));
  }
});
</script>

<style scoped lang="scss">
.profile-preference-container {
  padding: 20px;

  .preference-card {
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .card-title {
        font-size: 16px;
        font-weight: 600;
      }
    }

    .preference-sections {
      .preference-section {
        margin-bottom: 32px;

        .section-title {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid var(--el-border-color-lighter);
        }

        .section-content {
          .preference-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px;
            margin-bottom: 12px;
            background: var(--el-fill-color-lighter);
            border-radius: 8px;

            .item-info {
              flex: 1;

              .item-label {
                font-size: 14px;
                font-weight: 500;
                margin-bottom: 4px;
              }

              .item-desc {
                font-size: 12px;
                color: var(--el-text-color-secondary);
              }
            }

            .item-control {
              margin-left: 20px;
            }
          }
        }
      }
    }
  }
}
</style>
