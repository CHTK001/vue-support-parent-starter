<template>
  <el-dialog v-model="visibleInner" :title="modelValue ? '编辑配置' : '新建配置'" width="1200px" :close-on-click-modal="false" @close="handleClose" class="data-edit-dialog">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" class="form-grid">
      <!-- 左：基础信息 -->
      <div class="col left">
        <el-form-item label="名称" prop="systemDataSettingName"><el-input v-model="form.systemDataSettingName" /></el-form-item>
        <el-form-item label="模式" prop="systemDataSettingMode">
          <ScSelect v-model="form.systemDataSettingMode" :options="modeOptions" placeholder="请选择模式" />
        </el-form-item>
        <el-form-item label="类型" prop="systemDataSettingType">
          <el-select v-model="form.systemDataSettingType" filterable>
            <el-option v-for="item in systemDataSettingTypeValues" :key="item.value || item.name" :label="item.name" :value="item?.value || item.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="协议">
          <el-select v-model="form.systemDataSettingProtocol" filterable allow-create default-first-option :disabled="!modeChosen">
            <el-option v-for="p in protocolOptions" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.systemDataSettingProtocol && form.systemDataSettingProtocol.toLowerCase().includes('influx')" label="Influx 版本">
          <el-select v-model="form.systemDataSettingInfluxVersion" placeholder="请选择版本" :disabled="!modeChosen">
            <el-option label="v1" value="v1" />
            <el-option label="v2" value="v2" />
          </el-select>
        </el-form-item>
        <el-form-item label="地址"><el-input v-model="form.systemDataSettingServer" placeholder="优先填写完整连接串" :disabled="!modeChosen" /></el-form-item>
        <el-form-item label="主机/端口">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="form.systemDataSettingHost" placeholder="主机" :disabled="!modeChosen" />
            <el-input-number class="!min-w-[150px]" v-model="form.systemDataSettingPort" :min="0" :max="65535" placeholder="端口" :disabled="!modeChosen" />
          </div>
        </el-form-item>
        <el-form-item label="账号/密码">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="form.systemDataSettingUsername" placeholder="账号" :disabled="!modeChosen" />
            <el-input v-model="form.systemDataSettingPassword" type="password" placeholder="密码" :disabled="!modeChosen" />
          </div>
        </el-form-item>
        <el-form-item label="启用"><el-switch v-model="form.systemDataSettingEnabled" :disabled="!modeChosen" /></el-form-item>
      </div>

      <!-- 右：高级配置 -->
      <div class="col right">
        <el-form-item label="启用控制台">
          <el-switch v-model="consoleEnabled" :disabled="!modeChosen" />
        </el-form-item>
        <el-form-item label="图表类型">
          <el-select v-model="form.systemDataSettingChartType" filterable allow-create :disabled="!modeChosen" placeholder="可自定义">
            <el-option label="LINE" value="LINE" />
            <el-option label="BAR" value="BAR" />
            <el-option label="PIE" value="PIE" />
          </el-select>
        </el-form-item>
        <el-form-item label="远程图片URL">
          <el-input v-model="form.systemDataSettingImageUrl" placeholder="http(s)://..." :disabled="!modeChosen" />
        </el-form-item>
        <el-form-item label="图标URL">
          <el-input v-model="form.systemDataSettingIcon" placeholder="http(s)://..." :disabled="!modeChosen" />
        </el-form-item>
        <el-form-item label="认证类型"><el-input v-model="form.systemDataSettingAuthType" :disabled="!modeChosen" /></el-form-item>
        <el-form-item label="超时时间(ms)"><el-input-number v-model="form.systemDataSettingTimeoutMs" :min="0" :max="600000" :disabled="!modeChosen" /></el-form-item>

        <!-- JDBC 驱动设置 -->
        <template v-if="isJdbc">
          <el-form-item label="JDBC驱动">
            <el-select v-model="form.systemDataSettingDriverClass" placeholder="选择驱动" :disabled="!modeChosen" filterable allow-create>
              <el-option v-for="d in jdbcDrivers" :key="d.value" :label="d.label" :value="d.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="驱动文件">
            <div style="display: flex; gap: 8px; width: 100%">
              <el-input v-model="form.systemDataSettingDriverPath" placeholder="本地路径或URL" :disabled="!modeChosen" />
              <el-upload :auto-upload="false" :show-file-list="false" :on-change="onDriverFileChange" :disabled="!modeChosen">
                <el-button :disabled="!modeChosen">上传驱动</el-button>
              </el-upload>
            </div>
          </el-form-item>
        </template>
      </div>
    </el-form>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { saveSystemDataSetting, type SystemDataSetting, uploadJdbcDriver } from "@/api/system-data";
import { ElMessage } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";

interface Props {
  visible: boolean;
  modelValue?: SystemDataSetting | null;
}
const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const systemDataSettingTypeValues = [
  { name: "数据库", value: "JDBC" },
  { name: "REDIS", value: "REDIS" },
  { name: "ZOOKEEPER", value: "ZOOKEEPER" },
  { name: "INFLUXDB", value: "INFLUXDB" }
];
const visibleInner = ref(false);
const loading = ref(false);
const form = ref<SystemDataSetting>({
  systemDataSettingName: "",
  systemDataSettingType: "",
  systemDataSettingProtocol: "",
  systemDataSettingEnabled: true,
  systemDataSettingTimeoutMs: 600000,
  systemDataSettingMode: "REMOTE"
});
const formRef = ref();

// 是否启用控制台（由原“控制台类型”字段派生）
const consoleEnabled = ref<boolean>(true);

const rules = {
  systemDataSettingName: [{ required: true, message: "请输入名称", trigger: "blur" }],
  systemDataSettingMode: [{ required: true, message: "请选择模式", trigger: "change" }],
  systemDataSettingType: [{ required: true, message: "请选择类型", trigger: "change" }],
  // 远程模式下地址/主机/端口校验：需填写“地址(连接串)”或“主机+端口”
  systemDataSettingHost: [
    {
      validator: (_: any, __: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        const server = (form.value.systemDataSettingServer || "").trim();
        const host = (form.value.systemDataSettingHost || "").trim();
        const port = form.value.systemDataSettingPort;
        if (server) return cb();
        if (!host) return cb(new Error("远程模式下需填写“地址”或同时填写“主机+端口”"));
        if (!Number.isInteger(port) || port <= 0) return cb(new Error("请填写有效端口(>0)"));
        return cb();
      },
      trigger: ["blur", "change"]
    }
  ],
  systemDataSettingPort: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        const server = (form.value.systemDataSettingServer || "").trim();
        const host = (form.value.systemDataSettingHost || "").trim();
        if (server) return cb();
        if (!host) return cb(); // 由 host 的校验提示
        if (!Number.isInteger(value) || value <= 0) return cb(new Error("请填写有效端口(>0)"));
        return cb();
      },
      trigger: ["blur", "change"]
    }
  ]
};

const modeOptions = [
  { label: "远程", value: "REMOTE" },
  { label: "文件", value: "FILE" }
];

const jdbcDrivers = [
  {
    label: "MySQL 8.x - com.mysql.cj.jdbc.Driver",
    value: "com.mysql.cj.jdbc.Driver"
  },
  {
    label: "MySQL 5.x - com.mysql.jdbc.Driver",
    value: "com.mysql.jdbc.Driver"
  },
  {
    label: "PostgreSQL - org.postgresql.Driver",
    value: "org.postgresql.Driver"
  },
  {
    label: "Oracle - oracle.jdbc.OracleDriver",
    value: "oracle.jdbc.OracleDriver"
  },
  {
    label: "SQLServer - com.microsoft.sqlserver.jdbc.SQLServerDriver",
    value: "com.microsoft.sqlserver.jdbc.SQLServerDriver"
  },
  { label: "SQLite - org.sqlite.JDBC", value: "org.sqlite.JDBC" },
  { label: "H2 - org.h2.Driver", value: "org.h2.Driver" },
  {
    label: "Calcite - org.apache.calcite.jdbc.Driver",
    value: "org.apache.calcite.jdbc.Driver"
  }
];

const protocolOptions = [
  "jdbc",
  "mysql",
  "postgresql",
  "sqlite",
  "oracle",
  "sqlserver",
  "redis",
  "zookeeper",
  "influxdb",
  "influxdb-v1",
  "influxdb-v2",
  "mqtt",
  "graphdb",
  "email",
  "mongodb",
  "kafka"
];

const isJdbc = computed(() => {
  const t = (form.value.systemDataSettingType || "").toLowerCase();
  const url = (form.value.systemDataSettingServer || "").toLowerCase();
  return t.includes("jdbc") || t.includes("sql") || url.startsWith("");
});

const modeChosen = computed(() => !!form.value.systemDataSettingMode);

watch(
  () => props.visible,
  v => {
    visibleInner.value = v;
    if (v) {
      init();
    }
  },
  { immediate: true }
);
watch(visibleInner, v => emit("update:visible", v));

function init() {
  form.value = props.modelValue
    ? { ...(props.modelValue as any) }
    : {
        systemDataSettingName: "",
        systemDataSettingType: "",
        systemDataSettingProtocol: "",
        systemDataSettingEnabled: true,
        systemDataSettingMode: "REMOTE"
      };
  // 启用控制台：由历史 consoleType 是否为空推断（为空则视为禁用，不为空视为启用）；默认启用
  const oldConsoleType = (props.modelValue as any)?.systemDataSettingConsoleType;
  consoleEnabled.value = oldConsoleType == null ? true : String(oldConsoleType).length > 0;
}

async function handleSave() {
  loading.value = true;
  try {
    const valid = await formRef.value?.validate?.().catch(() => false);
    if (!valid) {
      loading.value = false;
      return;
    }
    // 与后端兼容：保留原字段，但用启用开关控制其是否为空
    const payload: any = { ...(form.value as any) };
    if (!consoleEnabled.value) {
      // 关闭控制台：清空 consoleType（后端可据此视为禁用）
      payload.systemDataSettingConsoleType = "";
    }
    const res = await saveSystemDataSetting(payload);
    if (!res?.success) {
      ElMessage.error(res?.msg || "保存失败");
      return;
    }
    ElMessage.success("保存成功");
    emit("success");
    visibleInner.value = false;
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
    if (!raw) {
      return;
    }
    const res = await uploadJdbcDriver(form.value.systemDataSettingId, raw);
    if (!res?.success) {
      ElMessage.error(res?.msg || "上传失败");
      return;
    }
    // 假设后端返回驱动落盘路径到 data
    if (res.data) {
      form.value.systemDataSettingDriverPath = res.data;
    }
    ElMessage.success("上传成功");
  } catch (e: any) {
    ElMessage.error(e?.message || "上传失败");
  }
}
</script>

<style scoped>
/* 统一弹框左右内边距，避免视觉偏移 */
.data-edit-dialog :deep(.el-dialog__body) {
  padding-left: 24px;
  padding-right: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}
.form-grid .col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-grid .left {
}
.form-grid .right {
}
</style>
