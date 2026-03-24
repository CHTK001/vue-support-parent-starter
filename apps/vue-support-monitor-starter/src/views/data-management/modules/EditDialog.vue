<template>
  <sc-dialog
    draggable
    v-model="visibleInner"
    width="1200px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="data-edit-dialog"
    align-center
    append-to-body
    destroy-on-close
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-icon" :class="modelValue ? 'edit' : 'add'">
          <IconifyIconOnline :icon="modelValue ? 'ri:edit-line' : 'ri:add-circle-line'" />
        </div>
        <div class="header-info">
          <span class="header-title">{{ modelValue ? '编辑配置' : '新建配置' }}</span>
          <span class="header-subtitle">{{ modelValue ? '修改数据源连接配置' : '创建新的数据源连接' }}</span>
        </div>
      </div>
    </template>

    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="form-container"
      >
        <div class="form-grid">
          <!-- 左侧：基础信息 -->
          <div class="form-section">
            <div class="section-header">
              <div class="section-icon basic">
                <IconifyIconOnline icon="ri:settings-3-line" />
              </div>
              <div class="section-title-wrapper">
                <span class="section-title">基础信息</span>
                <span class="section-desc">配置数据源的基本连接参数</span>
              </div>
            </div>
            <div class="section-body">
              <el-form-item label="名称" prop="systemDataSettingName">
                <el-input 
                  v-model="form.systemDataSettingName" 
                  placeholder="请输入配置名称"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:bookmark-line" class="input-icon" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="模式" prop="systemDataSettingMode">
                <ScSelect
                  v-model="form.systemDataSettingMode"
                  :options="modeOptions"
                  placeholder="请选择模式"
                />
              </el-form-item>

              <el-form-item label="类型" prop="systemDataSettingType">
                <ScSelect
                  layout="select"
                  v-model="form.systemDataSettingType"
                  :options="systemDataSettingTypeValues.map(item => ({ label: item.name, value: item.value || item.name, icon: item.icon }))"
                  placeholder="请选择类型"
                  filterable
                />
              </el-form-item>

              <!-- 远程模式必填字段 -->
              <template v-if="form.systemDataSettingMode === 'REMOTE'">
                <el-form-item label="主机/端口" prop="systemDataSettingHost">
                  <div class="dual-input">
                    <el-input
                      v-model="form.systemDataSettingHost"
                      placeholder="主机地址"
                      :disabled="!modeChosen"
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:server-line" class="input-icon" />
                      </template>
                    </el-input>
                    <el-input-number
                      class="port-input"
                      v-model="form.systemDataSettingPort"
                      :min="0"
                      :max="65535"
                      placeholder="端口"
                      :disabled="!modeChosen"
                      prop="systemDataSettingPort"
                      controls-position="right"
                    />
                  </div>
                </el-form-item>
              </template>

              <!-- JDBC类型必填字段 -->
              <template v-if="form.systemDataSettingType === 'JDBC'">
                <el-form-item label="JDBC驱动" prop="systemDataSettingDriverClass">
                  <ScSelect
                    layout="select"
                    v-model="form.systemDataSettingDriverClass"
                    :options="jdbcDrivers"
                    placeholder="选择驱动"
                    :disabled="!modeChosen"
                    filterable
                  />
                </el-form-item>
              </template>

              <el-form-item label="协议">
                <el-select
                  v-model="form.systemDataSettingProtocol"
                  filterable
                  allow-create
                  default-first-option
                  :disabled="!modeChosen"
                  placeholder="请选择或输入协议"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:link" class="input-icon" />
                  </template>
                  <el-option
                    v-for="p in protocolOptions"
                    :key="p"
                    :label="p"
                    :value="p"
                  />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <!-- 右侧：高级配置 -->
          <div class="form-section">
            <div class="section-header">
              <div class="section-icon advanced">
                <IconifyIconOnline icon="ri:tools-line" />
              </div>
              <div class="section-title-wrapper">
                <span class="section-title">连接配置</span>
                <span class="section-desc">设置连接认证与其他选项</span>
              </div>
            </div>
            <div class="section-body">
              <el-form-item label="连接地址">
                <el-input
                  v-model="form.systemDataSettingServer"
                  placeholder="优先填写完整连接串"
                  :disabled="!modeChosen"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:global-line" class="input-icon" />
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="数据库名">
                <el-input
                  v-model="form.systemDataSettingDatabase"
                  placeholder="请填写数据库名称"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:database-2-line" class="input-icon" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- 非远程模式或作为备选的主机/端口 -->
              <template v-if="form.systemDataSettingMode !== 'REMOTE'">
                <el-form-item label="主机/端口">
                  <div class="dual-input">
                    <el-input
                      v-model="form.systemDataSettingHost"
                      placeholder="主机地址"
                      :disabled="!modeChosen"
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:server-line" class="input-icon" />
                      </template>
                    </el-input>
                    <el-input-number
                      class="port-input"
                      v-model="form.systemDataSettingPort"
                      :min="0"
                      :max="65535"
                      placeholder="端口"
                      :disabled="!modeChosen"
                      controls-position="right"
                    />
                  </div>
                </el-form-item>
              </template>

              <el-form-item :label="form.systemDataSettingType == 'EMAIL' ? '账号/授权码': '账号/密码'">
                <div class="dual-input">
                  <el-input
                    v-model="form.systemDataSettingUsername"
                    placeholder="账号"
                    :disabled="!modeChosen"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:user-3-line" class="input-icon" />
                    </template>
                  </el-input>
                  <el-input
                    v-model="form.systemDataSettingPassword"
                    type="password"
                    show-password
                    :placeholder="form.systemDataSettingType == 'EMAIL' ? '授权码' : '密码'"
                    :disabled="!modeChosen"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:lock-line" class="input-icon" />
                    </template>
                  </el-input>
                </div>
              </el-form-item>

              <el-form-item v-if="form.systemDataSettingType == 'INFLUXDB'" label="数据库策略">
                <el-input 
                  v-model="form.systemDataSettingPolicy" 
                  placeholder="请填写数据库策略"
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:shield-check-line" class="input-icon" />
                  </template>
                </el-input>
              </el-form-item>

              <!-- JDBC 驱动文件设置（仅当类型为 JDBC 时显示） -->
              <template v-if="form.systemDataSettingType === 'JDBC'">
                <el-form-item label="驱动文件">
                  <div class="driver-upload">
                    <el-input
                      v-model="form.systemDataSettingDriverPath"
                      placeholder="本地路径或URL"
                      :disabled="!modeChosen"
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:file-code-line" class="input-icon" />
                      </template>
                    </el-input>
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="onDriverFileChange"
                      :disabled="!modeChosen"
                    >
                      <el-button type="primary" :disabled="!modeChosen">
                        <IconifyIconOnline icon="ri:upload-2-line" />
                        上传
                      </el-button>
                    </el-upload>
                  </div>
                </el-form-item>
              </template>

              <!-- 开关选项组 -->
              <div class="switch-group">
                <div class="switch-item">
                  <div class="switch-info">
                    <IconifyIconOnline icon="ri:toggle-line" class="switch-icon" />
                    <span class="switch-label">启用状态</span>
                  </div>
                  <el-switch
                    v-model="form.systemDataSettingEnabled"
                    :disabled="!modeChosen"
                    active-text=""
                    inactive-text=""
                  />
                </div>
                <div class="switch-item">
                  <div class="switch-info">
                    <IconifyIconOnline icon="ri:time-line" class="switch-icon" />
                    <span class="switch-label">支持IDLE</span>
                  </div>
                  <el-switch 
                    v-model="form.systemDataSettingIdle" 
                    active-text=""
                    inactive-text=""
                  />
                </div>
                <div class="switch-item">
                  <div class="switch-info">
                    <IconifyIconOnline icon="ri:terminal-box-line" class="switch-icon" />
                    <span class="switch-label">控制台</span>
                  </div>
                  <el-switch 
                    v-model="consoleEnabled" 
                    :disabled="!modeChosen" 
                    active-text=""
                    inactive-text=""
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" class="cancel-btn">
          <IconifyIconOnline icon="ri:close-line" />
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSave" class="save-btn">
          <IconifyIconOnline icon="ri:check-line" />
          保存配置
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
// 说明：
// 1) 选择协议后：将主机设置为 127.0.0.1，并将端口设置为协议默认端口（若有）。
// 2) 远程图片URL 与 图标URL 只能存在一个：增加表单互斥校验与互斥 watch。
// 3) JDBC 驱动与驱动文件：仅当协议为 jdbc 时显示。

import { computed, ref, watch, nextTick } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";
import {
  saveSystemDataSetting,
  type SystemDataSetting,
  uploadJdbcDriver,
} from "@/api/data-management/system-data";
import { fromBase64 } from "js-base64";

interface Props {
  visible: boolean;
  modelValue?: SystemDataSetting | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();

// 表单数据（补齐常用字段，避免 v-model 未定义）
const form = ref<SystemDataSetting>({
  systemDataSettingId: undefined as any,
  systemDataSettingName: "",
  systemDataSettingType: "",
  systemDataSettingIdle: false,
  systemDataSettingProtocol: "",
  systemDataSettingServer: "",
  systemDataSettingHost: "",
  systemDataSettingPort: undefined as any,
  systemDataSettingUsername: "",
  systemDataSettingPassword: "",
  systemDataSettingEnabled: true,
  systemDataSettingTimeoutMs: 600000,
  systemDataSettingMode: "REMOTE",
  systemDataSettingChartType: "",
  systemDataSettingImageUrl: "",
  systemDataSettingIcon: "",
  systemDataSettingDriverClass: "",
  systemDataSettingDriverPath: "",
} as any);

// 启用控制台（由原字段派生，默认启用）
const consoleEnabled = ref<boolean>(true);

const modeOptions = [
  { label: "远程", value: "REMOTE", icon: "ri:cloud-line" },
  { label: "文件", value: "FILE", icon: "ri:file-line" },
];

const systemDataSettingTypeValues = [
  { name: "数据库", value: "JDBC", icon: "ri:database-line" },
  { name: "REDIS", value: "REDIS", icon: "ri:database-2-line" },
  { name: "ZOOKEEPER", value: "ZOOKEEPER", icon: "ri:node-tree" },
  { name: "时序数据库(INFLUXDB)", value: "INFLUXDB", icon: "ri:line-chart-line" },
  { name: "电子邮件", value: "EMAIL", icon: "ri:mail-line" },
];

const systemDataSettingPolicy = [
  "INFLUXDB"
]

// 协议列表（包含 jdbc）
const protocolOptions = [
  "Jdbc",
  "Mysql",
  "Postgresql",
  "Sqlite",
  "Oracle",
  "Sqlserver",
  "Redis",
  "Zookeeper",
  "Influxdb",
  "Mongodb",
  "Kafka",
  "Email"
];

// 常见协议默认端口
const defaultPorts: Record<string, number> = {
  mysql: 3306,
  postgresql: 5432,
  sqlite: 0, // 无端口，通常本地文件
  oracle: 1521,
  sqlserver: 1433,
  redis: 6379,
  zookeeper: 2181,
  influxdb: 8086,
  mongodb: 27017,
  kafka: 9092,
  // jdbc: 未定义（取决于子协议），不设置默认
};

// 仅当协议为 jdbc 时显示
const isJdbc = computed(
  () => (form.value.systemDataSettingProtocol || "").toLowerCase() === "jdbc"
);

// JDBC 驱动选项
const jdbcDrivers = [
  { label: "MySQL8", value: "com.mysql.cj.jdbc.Driver", icon: "ri:database-line" },
  { label: "MySQL5", value: "com.mysql.jdbc.Driver", icon: "ri:database-line" },
  { label: "PostgreSQL", value: "org.postgresql.Driver", icon: "ri:database-2-line" },
  { label: "Oracle", value: "oracle.jdbc.driver.OracleDriver", icon: "ri:database-fill" },
  { label: "SQL Server", value: "com.microsoft.sqlserver.jdbc.SQLServerDriver", icon: "ri:microsoft-line" },
  { label: "SQLite", value: "org.sqlite.JDBC", icon: "ri:file-3-line" },
  { label: "H2", value: "org.h2.Driver", icon: "ri:hard-drive-line" },
  { label: "TiDB", value: "com.mysql.cj.jdbc.Driver", icon: "ri:cloud-line" },
  { label: "MariaDB", value: "org.mariadb.jdbc.Driver", icon: "ri:database-line" },
  { label: "ClickHouse", value: "ru.yandex.clickhouse.ClickHouseDriver", icon: "ri:bar-chart-line" },
  { label: "DM (达梦)", value: "dm.jdbc.driver.DmDriver", icon: "ri:shield-line" },
  { label: "KingBase (人大金仓)", value: "com.kingbase8.Driver", icon: "ri:shield-line" },
  { label: "GBase", value: "com.gbase.jdbc.Driver", icon: "ri:shield-line" },

];

const modeChosen = computed(() => !!form.value.systemDataSettingMode);

// 打开/关闭
watch(
  () => props.visible,
  (v) => {
    visibleInner.value = v;
    if (v) init();
  },
  { immediate: true }
);
watch(visibleInner, (v) => emit("update:visible", v));

function init() {
  form.value = props.modelValue
    ? { ...(props.modelValue as any) }
    : ({
        systemDataSettingName: "",
        systemDataSettingType: "",
        systemDataSettingProtocol: "",
        systemDataSettingServer: "",
        systemDataSettingHost: "",
        systemDataSettingPort: undefined,
        systemDataSettingUsername: "",
        systemDataSettingPassword: "",
        systemDataSettingEnabled: true,
        systemDataSettingTimeoutMs: 600000,
        systemDataSettingMode: "REMOTE",
        systemDataSettingChartType: "",
        systemDataSettingImageUrl: "",
        systemDataSettingIcon: "",
        systemDataSettingDriverClass: "",
        systemDataSettingDriverPath: "",
      } as any);
  // 控制台启用：默认启用（如需与旧数据对齐，可在此根据旧字段推断）
  consoleEnabled.value = true;
}

// 协议选择后：主机设为 127.0.0.1，端口设为协议默认端口
watch(
  () => form.value.systemDataSettingProtocol,
  (p) => {
    const key = (p || "").toLowerCase();
    // 按需求：选择协议后直接覆盖主机值
    // form.value.systemDataSettingHost = "127.0.0.1";
    // 设置默认端口（如有），jdbc 不设置，避免误导
    if (defaultPorts[key] != null) {
      form.value.systemDataSettingPort = defaultPorts[key] as any;
    } else if (key === "jdbc") {
      form.value.systemDataSettingPort = undefined as any;
    }
  }
);

// 远程图片URL 与 图标URL 只能存在一个：互斥处理
watch(
  () => form.value.systemDataSettingImageUrl,
  (v) => {
    if (v && String(v).trim().length > 0) {
      form.value.systemDataSettingIcon = "" as any;
    }
  }
);
watch(
  () => form.value.systemDataSettingIcon,
  (v) => {
    if (v && String(v).trim().length > 0) {
      form.value.systemDataSettingImageUrl = "" as any;
    }
  }
);

// 表单规则：
// - 远程模式校验：主机+端口必填
// - JDBC类型校验：驱动必填
// - 图片/图标互斥校验
const rules: FormRules = {
  systemDataSettingName: [
    { required: true, message: "请填写名称", trigger: "blur" },
  ],
  systemDataSettingMode: [
    { required: true, message: "请选择模式", trigger: "change" },
  ],
  systemDataSettingType: [
    { required: true, message: "请选择类型", trigger: "change" },
  ],
  systemDataSettingHost: [
    {
      validator: (_: any, __: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        const host = (form.value.systemDataSettingHost || "").trim();
        if (!host)
          return cb(new Error("远程模式下主机为必填项"));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingPort: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        if (!Number.isInteger(value) || value <= 0)
          return cb(new Error("远程模式下端口为必填项，请填写有效端口(>0)"));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingDriverClass: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingType !== "JDBC") return cb();
        const driver = (value || "").trim();
        if (!driver)
          return cb(new Error("数据库类型下JDBC驱动为必填项"));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingImageUrl: [
    {
      validator: (_: any, val: any, cb: (e?: Error) => void) => {
        const img = (val || "").trim();
        const icon = (form.value.systemDataSettingIcon || "").trim();
        if (img && icon)
          return cb(new Error("“远程图片URL”和“图标URL”只能填写一个"));
        cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingIcon: [
    {
      validator: (_: any, val: any, cb: (e?: Error) => void) => {
        const icon = (val || "").trim();
        const img = (form.value.systemDataSettingImageUrl || "").trim();
        if (img && icon)
          return cb(new Error("“图标URL”和“远程图片URL”只能填写一个"));
        cb();
      },
      trigger: ["blur", "change"],
    },
  ],
};

async function handleSave() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    const payload = { ...(form.value as any) };
    const res = await saveSystemDataSetting(payload);
    if (!res || (res as any).success === false) {
      ElMessage.error((res as any)?.msg || "保存失败");
      return;
    }
    ElMessage.success("保存成功");
    emit("success");
    visibleInner.value = false;
  } catch (e: any) {
    if (e) {
      ElMessage.error(e?.message || "保存失败");
    }
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  visibleInner.value = false;
}

async function onDriverFileChange(file: any) {
  try {
    if (!form.value.systemDataSettingId) {
      ElMessage.warning("请先保存配置再上传驱动");
      return;
    }
    const raw = file?.raw as File;
    if (!raw) return;
    const res = await uploadJdbcDriver(
      form.value.systemDataSettingId as any,
      raw
    );
    if (!res || (res as any).success === false) {
      ElMessage.error((res as any)?.msg || "上传失败");
      return;
    }
    if ((res as any).data) {
      (form.value as any).systemDataSettingDriverPath = (res as any).data;
    }
    ElMessage.success("上传成功");
  } catch (e: any) {
    ElMessage.error(e?.message || "上传失败");
  }
}
</script>

<style scoped lang="scss">
/* 对话框整体样式 */
.data-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    background: var(--el-bg-color-page);
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

/* 自定义头部 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--el-bg-color);

  .header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    flex-shrink: 0;

    &.add {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    &.edit {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .header-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .header-subtitle {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

/* 内容区域 */
.dialog-content {
  padding: 24px;
}

.form-container {
  :deep(.el-form-item) {
    margin-bottom: 18px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
    transition: all 0.2s ease;
    box-shadow: none;
    border: 1px solid var(--el-border-color);
    background: var(--el-bg-color);

    &:hover {
      border-color: var(--el-color-primary-light-3);
    }

    &:focus-within,
    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      border-radius: 8px;
    }
  }
}

/* 表单网格布局 */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 表单分区 */
.form-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    background: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .section-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;

      &.basic {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
        box-shadow: 0 3px 8px rgba(99, 102, 241, 0.25);
      }

      &.advanced {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff;
        box-shadow: 0 3px 8px rgba(245, 158, 11, 0.25);
      }
    }

    .section-title-wrapper {
      display: flex;
      flex-direction: column;
      gap: 2px;

      .section-title {
        font-size: 15px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      .section-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .section-body {
    padding: 20px;
  }
}

/* 双输入框布局 */
.dual-input {
  display: flex;
  gap: 12px;
  width: 100%;

  > .el-input,
  > :deep(.el-input) {
    flex: 1;
  }

  .port-input {
    width: 140px;
    flex-shrink: 0;
  }
}

/* 驱动上传 */
.driver-upload {
  display: flex;
  gap: 12px;
  width: 100%;

  > .el-input,
  > :deep(.el-input) {
    flex: 1;
  }

  .el-button {
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 8px;
  }
}

/* 输入框图标 */
.input-icon {
  color: var(--el-text-color-placeholder);
  font-size: 16px;
}

/* 开关选项组 */
.switch-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  margin-top: 8px;

  .switch-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .switch-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .switch-icon {
        font-size: 18px;
        color: var(--el-color-primary);
      }

      .switch-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }
    }
  }
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .el-button {
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.25s ease;

    &:hover {
      transform: translateY(-1px);
    }
  }

  .cancel-btn {
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color);
    color: var(--el-text-color-regular);

    &:hover {
      background: var(--el-fill-color);
      border-color: var(--el-border-color-darker);
    }
  }

  .save-btn {
    box-shadow: 0 4px 12px var(--el-color-primary-light-5);

    &:hover {
      box-shadow: 0 6px 16px var(--el-color-primary-light-3);
    }
  }
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
