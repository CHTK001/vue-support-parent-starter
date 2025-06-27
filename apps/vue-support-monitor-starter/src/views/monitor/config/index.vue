<template>
  <div class="monitor-config-container p-4">
    <el-card class="config-card" shadow="hover">
      <template #header>
        <div class="card-header flex items-center justify-between">
          <div class="header-title flex items-center">
            <IconifyIconOnline icon="ri:settings-3-line" class="mr-2 text-primary" />
            <span class="text-lg font-medium">监控配置管理</span>
          </div>
          <div class="header-actions">
            <el-button @click="router.go(-1)" plain>
              <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
              返回
            </el-button>
          </div>
        </div>
      </template>

      <div class="config-content">
        <el-tabs v-model="activeTab" class="config-tabs">
          <!-- 阈值设置 -->
          <el-tab-pane label="阈值设置" name="thresholds">
            <div class="threshold-config">
              <el-alert
                title="阈值设置说明"
                description="配置系统监控的各项阈值，当指标超过设定值时将触发告警。"
                type="info"
                :closable="false"
                class="mb-4"
              />
              
              <el-form
                ref="thresholdFormRef"
                :model="thresholdForm"
                :rules="thresholdRules"
                label-width="140px"
                class="threshold-form"
              >
                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="CPU警告阈值" prop="cpuWarningThreshold">
                      <el-input-number
                        v-model="thresholdForm.cpuWarningThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="CPU警告阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">CPU使用率警告阈值(%)</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="CPU严重阈值" prop="cpuCriticalThreshold">
                      <el-input-number
                        v-model="thresholdForm.cpuCriticalThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="CPU严重阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">CPU使用率严重阈值(%)</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="内存警告阈值" prop="memoryWarningThreshold">
                      <el-input-number
                        v-model="thresholdForm.memoryWarningThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="内存警告阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">内存使用率警告阈值(%)</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="内存严重阈值" prop="memoryCriticalThreshold">
                      <el-input-number
                        v-model="thresholdForm.memoryCriticalThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="内存严重阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">内存使用率严重阈值(%)</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="磁盘警告阈值" prop="diskWarningThreshold">
                      <el-input-number
                        v-model="thresholdForm.diskWarningThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="磁盘警告阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">磁盘使用率警告阈值(%)</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="磁盘严重阈值" prop="diskCriticalThreshold">
                      <el-input-number
                        v-model="thresholdForm.diskCriticalThreshold"
                        :min="1"
                        :max="100"
                        :step="1"
                        placeholder="磁盘严重阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">磁盘使用率严重阈值(%)</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="24">
                  <el-col :span="12">
                    <el-form-item label="网络阈值" prop="networkThreshold">
                      <el-input-number
                        v-model="thresholdForm.networkThreshold"
                        :min="1"
                        :max="1000"
                        :step="1"
                        placeholder="网络阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">网络使用率阈值(Mbps)</div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="响应时间阈值" prop="responseTimeThreshold">
                      <el-input-number
                        v-model="thresholdForm.responseTimeThreshold"
                        :min="100"
                        :max="30000"
                        :step="100"
                        placeholder="响应时间阈值"
                        style="width: 100%"
                      />
                      <div class="form-tip">响应时间阈值(毫秒)</div>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item>
                  <el-button type="primary" @click="saveThresholds" :loading="saving">
                    <IconifyIconOnline icon="ri:save-line" class="mr-1" />
                    保存配置
                  </el-button>
                  <el-button @click="resetThresholds" plain>
                    <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>

          <!-- 全局监控设置 -->
          <el-tab-pane label="全局设置" name="global">
            <div class="global-config">
              <el-alert
                title="全局监控设置"
                description="配置系统级别的监控参数，影响所有服务器的监控行为。"
                type="info"
                :closable="false"
                class="mb-4"
              />
              
              <el-form
                ref="globalFormRef"
                :model="globalForm"
                :rules="globalRules"
                label-width="140px"
                class="global-form"
              >
                <el-form-item label="默认监控间隔" prop="defaultMonitorInterval">
                  <el-input-number
                    v-model="globalForm.defaultMonitorInterval"
                    :min="10"
                    :max="3600"
                    :step="10"
                    placeholder="监控间隔"
                    style="width: 200px"
                  />
                  <span class="form-tip ml-2">秒，建议值：60</span>
                </el-form-item>

                <el-form-item label="数据保留天数" prop="dataRetentionDays">
                  <el-input-number
                    v-model="globalForm.dataRetentionDays"
                    :min="1"
                    :max="365"
                    :step="1"
                    placeholder="保留天数"
                    style="width: 200px"
                  />
                  <span class="form-tip ml-2">天，超过此时间的数据将被清理</span>
                </el-form-item>

                <el-form-item label="告警通知方式" prop="alertNotificationMethod">
                  <el-select
                    v-model="globalForm.alertNotificationMethod"
                    placeholder="请选择通知方式"
                    style="width: 200px"
                  >
                    <el-option label="邮件" value="EMAIL" />
                    <el-option label="短信" value="SMS" />
                    <el-option label="钉钉" value="DINGTALK" />
                    <el-option label="企业微信" value="WECHAT" />
                  </el-select>
                </el-form-item>

                <el-form-item>
                  <el-button type="primary" @click="saveGlobalConfig" :loading="saving">
                    <IconifyIconOnline icon="ri:save-line" class="mr-1" />
                    保存配置
                  </el-button>
                  <el-button @click="resetGlobalConfig" plain>
                    <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
                    重置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  getMonitorThresholds,
  saveMonitorThresholds,
  getGlobalMonitorConfig,
  saveGlobalMonitorConfig,
  type MonitorThresholds,
  type GlobalMonitorConfig
} from "@/api/monitor/config";

// 路由
const router = useRouter();

// 响应式状态
const activeTab = ref("thresholds");
const saving = ref(false);
const thresholdFormRef = ref();
const globalFormRef = ref();

// 阈值配置表单
const thresholdForm = reactive({
  cpuWarningThreshold: 70,
  cpuCriticalThreshold: 85,
  memoryWarningThreshold: 75,
  memoryCriticalThreshold: 90,
  diskWarningThreshold: 80,
  diskCriticalThreshold: 95,
  networkThreshold: 100,
  responseTimeThreshold: 5000
});

// 全局配置表单
const globalForm = reactive({
  defaultMonitorInterval: 60,
  dataRetentionDays: 30,
  alertNotificationMethod: "EMAIL"
});

// 表单验证规则
const thresholdRules = {
  cpuWarningThreshold: [
    { required: true, message: "请输入CPU警告阈值", trigger: "blur" },
    { type: "number", min: 1, max: 100, message: "阈值范围为1-100", trigger: "blur" }
  ],
  cpuCriticalThreshold: [
    { required: true, message: "请输入CPU严重阈值", trigger: "blur" },
    { type: "number", min: 1, max: 100, message: "阈值范围为1-100", trigger: "blur" }
  ],
  memoryWarningThreshold: [
    { required: true, message: "请输入内存警告阈值", trigger: "blur" },
    { type: "number", min: 1, max: 100, message: "阈值范围为1-100", trigger: "blur" }
  ],
  memoryCriticalThreshold: [
    { required: true, message: "请输入内存严重阈值", trigger: "blur" },
    { type: "number", min: 1, max: 100, message: "阈值范围为1-100", trigger: "blur" }
  ]
};

const globalRules = {
  defaultMonitorInterval: [
    { required: true, message: "请输入监控间隔", trigger: "blur" },
    { type: "number", min: 10, max: 3600, message: "间隔范围为10-3600秒", trigger: "blur" }
  ],
  dataRetentionDays: [
    { required: true, message: "请输入数据保留天数", trigger: "blur" },
    { type: "number", min: 1, max: 365, message: "保留天数范围为1-365天", trigger: "blur" }
  ]
};

/**
 * 保存阈值配置
 */
const saveThresholds = async () => {
  if (!thresholdFormRef.value) return;

  try {
    await thresholdFormRef.value.validate();
    saving.value = true;

    const result = await saveMonitorThresholds(thresholdForm);
    if (result.code === "00000") {
      message.success("阈值配置保存成功");
    } else {
      message.error(result.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存阈值配置失败:", error);
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
};

/**
 * 重置阈值配置
 */
const resetThresholds = () => {
  Object.assign(thresholdForm, {
    cpuWarningThreshold: 70,
    cpuCriticalThreshold: 85,
    memoryWarningThreshold: 75,
    memoryCriticalThreshold: 90,
    diskWarningThreshold: 80,
    diskCriticalThreshold: 95,
    networkThreshold: 100,
    responseTimeThreshold: 5000
  });
};

/**
 * 保存全局配置
 */
const saveGlobalConfig = async () => {
  if (!globalFormRef.value) return;

  try {
    await globalFormRef.value.validate();
    saving.value = true;

    const result = await saveGlobalMonitorConfig(globalForm);
    if (result.code === "00000") {
      message.success("全局配置保存成功");
    } else {
      message.error(result.msg || "保存失败");
    }
  } catch (error) {
    console.error("保存全局配置失败:", error);
    message.error("保存失败");
  } finally {
    saving.value = false;
  }
};

/**
 * 重置全局配置
 */
const resetGlobalConfig = () => {
  Object.assign(globalForm, {
    defaultMonitorInterval: 60,
    dataRetentionDays: 30,
    alertNotificationMethod: "EMAIL"
  });
};

/**
 * 加载配置数据
 */
const loadConfig = async () => {
  try {
    // 加载阈值配置
    const thresholdResult = await getMonitorThresholds();
    if (thresholdResult.code === "00000" && thresholdResult.data) {
      Object.assign(thresholdForm, thresholdResult.data);
    }

    // 加载全局配置
    const globalResult = await getGlobalMonitorConfig();
    if (globalResult.code === "00000" && globalResult.data) {
      Object.assign(globalForm, globalResult.data);
    }
  } catch (error) {
    console.error("加载配置失败:", error);
    message.error("加载配置失败");
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadConfig();
});
</script>

<style lang="scss" scoped>
.monitor-config-container {
  min-height: calc(100vh - 100px);
  background-color: var(--el-bg-color-page);
}

.config-card {
  border-radius: 8px;

  :deep(.el-card__header) {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 24px;
  }
}

.card-header {
  .header-title {
    color: var(--el-text-color-primary);
    font-weight: 600;
  }
}

.config-content {
  .config-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }

    :deep(.el-tabs__nav-wrap::after) {
      background-color: var(--el-border-color-lighter);
    }

    :deep(.el-tabs__item) {
      font-weight: 500;

      &.is-active {
        color: var(--el-color-primary);
      }
    }
  }
}

.threshold-form,
.global-form {
  max-width: 800px;

  .el-form-item {
    margin-bottom: 24px;
  }

  .form-tip {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
    display: block;
  }
}

.threshold-config,
.global-config {
  .el-alert {
    border-radius: 6px;
  }
}

:deep(.el-input-number) {
  .el-input__inner {
    text-align: left;
  }
}

:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;

  &.is-loading {
    pointer-events: none;
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-tabs__content) {
  padding-top: 0;
}
</style>
