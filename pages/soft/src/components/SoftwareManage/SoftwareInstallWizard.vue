<template>
  <ScDialog
    v-model="dialogVisible"
    title="软件安装向导"
    width="800px"
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="install-wizard">
      <div class="install-wizard__steps">
        <div
          v-for="(step, index) in steps"
          :key="step.key"
          class="install-wizard__step"
          :class="{
            'install-wizard__step--active': currentStep === index,
            'install-wizard__step--completed': currentStep > index,
          }"
        >
          <div class="install-wizard__step-indicator">
            <span v-if="currentStep <= index">{{ index + 1 }}</span>
            <IconifyIconOnline v-else icon="ep:check" />
          </div>
          <span class="install-wizard__step-label">{{ step.label }}</span>
        </div>
      </div>

      <div class="install-wizard__content">
        <template v-if="currentStep === 0">
          <div class="install-wizard__form-row">
            <label>软件名称</label>
            <ScInput v-model="formData.softwareName" placeholder="请输入软件名称" />
          </div>
          <div class="install-wizard__form-row">
            <label>软件编码</label>
            <ScInput v-model="formData.softwareCode" placeholder="请输入软件编码" />
          </div>
          <div class="install-wizard__form-row">
            <label>软件版本</label>
            <ScInput v-model="formData.softwareVersion" placeholder="请输入软件版本，如 8.0" />
          </div>
        </template>

        <template v-else-if="currentStep === 1">
          <div class="install-wizard__form-row">
            <label>安装目录</label>
            <ScInput v-model="formData.installPath" placeholder="请输入安装目录路径" />
          </div>
          <div class="install-wizard__form-row">
            <label>日志目录</label>
            <ScInput v-model="formData.logPath" placeholder="请输入日志目录路径" />
          </div>
        </template>

        <template v-else-if="currentStep === 2">
          <div class="install-wizard__form-row">
            <label>服务端口</label>
            <ScInputNumber v-model="formData.port" placeholder="请输入服务端口" :min="1" :max="65535" />
          </div>
          <div class="install-wizard__form-row">
            <label>绑定地址</label>
            <ScInput v-model="formData.bindAddress" placeholder="请输入绑定地址，如 0.0.0.0" />
          </div>
        </template>

        <template v-else-if="currentStep === 3">
          <div class="install-wizard__form-row">
            <label>服务名称</label>
            <ScInput v-model="formData.serviceName" placeholder="请输入系统服务名称" />
          </div>
          <div class="install-wizard__form-row">
            <label class="install-wizard__checkbox-label">
              <ScCheckbox v-model="formData.enableAutostart" disabled />
              开机自启动（默认启用，暂不支持取消）
            </label>
          </div>
          <div class="install-wizard__form-row">
            <label class="install-wizard__checkbox-label">
              <ScCheckbox v-model="formData.createService" disabled checked />
              创建系统服务（默认挂载，暂不支持取消）
            </label>
          </div>
        </template>

        <template v-else-if="currentStep === 4">
          <template v-if="softwareProfile === 'mysql8'">
            <div class="install-wizard__form-row">
              <label>MySQL 端口</label>
              <ScInputNumber v-model="formData.mysqlPort" placeholder="默认 3306" :min="1" :max="65535" />
            </div>
            <div class="install-wizard__form-row">
              <label>数据目录</label>
              <ScInput v-model="formData.mysqlDataDir" placeholder="如 /var/lib/mysql" />
            </div>
            <div class="install-wizard__form-row">
              <label>root 密码</label>
              <ScInput v-model="formData.mysqlRootPassword" type="password" placeholder="请输入 root 密码" />
            </div>
            <div class="install-wizard__form-row">
              <label>远程访问</label>
              <ScSelect v-model="formData.mysqlRemoteAccess">
                <ScOption :value="true" label="允许 root 远程访问" />
                <ScOption :value="false" label="仅本机访问" />
              </ScSelect>
            </div>
          </template>

          <template v-else-if="softwareProfile === 'redis'">
            <div class="install-wizard__form-row">
              <label>Redis 端口</label>
              <ScInputNumber v-model="formData.redisPort" placeholder="默认 6379" :min="1" :max="65535" />
            </div>
            <div class="install-wizard__form-row">
              <label>访问密码</label>
              <ScInput v-model="formData.redisPassword" type="password" placeholder="可为空" />
            </div>
            <div class="install-wizard__form-row">
              <label>AOF 持久化</label>
              <ScSelect v-model="formData.redisAppendOnly">
                <ScOption :value="true" label="开启 AOF" />
                <ScOption :value="false" label="关闭 AOF" />
              </ScSelect>
            </div>
          </template>

          <template v-else-if="softwareProfile === 'nginx'">
            <div class="install-wizard__form-row">
              <label>Nginx 端口</label>
              <ScInputNumber v-model="formData.nginxPort" placeholder="默认 80" :min="1" :max="65535" />
            </div>
            <div class="install-wizard__form-row">
              <label>root 目录</label>
              <ScInput v-model="formData.nginxRoot" placeholder="如 /usr/share/nginx/html" />
            </div>
          </template>

          <template v-else-if="softwareProfile === 'guacamole'">
            <div class="install-wizard__form-row">
              <label>Web 端口</label>
              <ScInputNumber v-model="formData.guacamolePort" placeholder="默认 8080" :min="1" :max="65535" />
            </div>
            <div class="install-wizard__form-row">
              <label>配置目录</label>
              <ScInput v-model="formData.guacamoleHome" placeholder="如 /etc/guacamole" />
            </div>
            <div class="install-wizard__form-row">
              <label>默认账号</label>
              <ScInput v-model="formData.guacamoleUsername" placeholder="默认 admin" />
            </div>
            <div class="install-wizard__form-row">
              <label>默认密码</label>
              <ScInput v-model="formData.guacamolePassword" type="password" placeholder="请输入默认密码" />
            </div>
          </template>

          <template v-else>
            <div class="install-wizard__form-row">
              <label>备注</label>
              <ScInput v-model="formData.remark" type="textarea" :rows="4" placeholder="请输入备注信息" />
            </div>
          </template>
        </template>
      </div>

      <div class="install-wizard__footer">
        <ScButton v-if="currentStep > 0" @click="handlePrev">上一步</ScButton>
        <ScButton v-if="currentStep < steps.length - 1" type="primary" @click="handleNext">下一步</ScButton>
        <ScButton v-if="currentStep === steps.length - 1" type="primary" :loading="submitting" @click="handleFinish">完成安装</ScButton>
      </div>
    </div>
  </ScDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import ScDialog from "@repo/components/ScDialog";
import ScInput from "@repo/components/ScInput";
import ScInputNumber from "@repo/components/ScInputNumber";
import ScSelect from "@repo/components/ScSelect";
import ScOption from "@repo/components/ScOption";
import ScButton from "@repo/components/ScButton";
import ScCheckbox from "@repo/components/ScCheckbox";
import { IconifyIconOnline } from "@repo/components";

const props = defineProps<{
  visible: boolean;
  softwareProfile?: string;
  presetData?: Record<string, any>;
}>();

const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "complete", data: any): void;
  (e: "closed"): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const steps = computed(() => {
  const baseSteps = [
    { key: "basic", label: "基础信息" },
    { key: "directory", label: "目录配置" },
    { key: "port", label: "端口配置" },
    { key: "service", label: "服务配置" },
  ];

  if (props.softwareProfile) {
    return [...baseSteps, { key: "software", label: "软件配置" }];
  }

  return baseSteps;
});

const currentStep = ref(0);
const submitting = ref(false);

const formData = ref({
  softwareName: "",
  softwareCode: "",
  softwareVersion: "",
  installPath: "",
  logPath: "",
  port: 0,
  bindAddress: "0.0.0.0",
  serviceName: "",
  enableAutostart: true,
  createService: true,
  remark: "",
  mysqlPort: 3306,
  mysqlDataDir: "",
  mysqlRootPassword: "",
  mysqlRemoteAccess: false,
  redisPort: 6379,
  redisPassword: "",
  redisAppendOnly: false,
  nginxPort: 80,
  nginxRoot: "",
  guacamolePort: 8080,
  guacamoleHome: "",
  guacamoleUsername: "admin",
  guacamolePassword: "",
});

watch(
  () => props.presetData,
  (val) => {
    if (val) {
      formData.value = {
        ...formData.value,
        softwareName: val.softwareName || "",
        softwareCode: val.softwareCode || "",
        softwareVersion: val.softwareVersion || "",
        installPath: val.installPath || "",
        logPath: val.logPath || "",
        serviceName: val.serviceName || val.softwareCode || "",
      };
    }
  },
  { immediate: true },
);

watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentStep.value = 0;
    }
  },
);

const handlePrev = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

const handleNext = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++;
  }
};

const handleFinish = async () => {
  submitting.value = true;
  try {
    emit("complete", { ...formData.value });
    dialogVisible.value = false;
  } finally {
    submitting.value = false;
  }
};

const handleClosed = () => {
  currentStep.value = 0;
  emit("closed");
};
</script>

<style scoped lang="scss">
.install-wizard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.install-wizard__steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.install-wizard__step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 80px;

  &--active {
    .install-wizard__step-indicator {
      background: var(--el-color-primary);
      color: #fff;
    }

    .install-wizard__step-label {
      color: var(--el-color-primary);
    }
  }

  &--completed {
    .install-wizard__step-indicator {
      background: var(--el-color-success);
      color: #fff;
    }
  }
}

.install-wizard__step-indicator {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.install-wizard__step-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.install-wizard__content {
  min-height: 280px;
  padding: 16px 0;
}

.install-wizard__form-row {
  margin-bottom: 20px;

  > label {
    display: block;
    margin-bottom: 8px;
    font-size: 13px;
    color: var(--el-text-color-regular);
    font-weight: 500;
  }
}

.install-wizard__checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.install-wizard__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
}
</style>
