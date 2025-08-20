<template>
  <el-dialog
    v-model="visibleInner"
    :title="modelValue ? '编辑配置' : '新建配置'"
    width="1200px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="data-edit-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="form-grid"
    >
      <!-- 左：基础信息 -->
      <div class="col left">
        <el-form-item label="名称" prop="systemDataSettingName">
          <el-input v-model="form.systemDataSettingName" />
        </el-form-item>

        <el-form-item label="模式" prop="systemDataSettingMode">
          <ScSelect
            v-model="form.systemDataSettingMode"
            :options="modeOptions"
            placeholder="请选择模式"
          />
        </el-form-item>

        <el-form-item label="类型" prop="systemDataSettingType">
          <el-select v-model="form.systemDataSettingType" filterable>
            <el-option
              v-for="item in systemDataSettingTypeValues"
              :key="item.value || item.name"
              :label="item.name"
              :value="item?.value || item.name"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="协议">
          <el-select
            v-model="form.systemDataSettingProtocol"
            filterable
            allow-create
            default-first-option
            :disabled="!modeChosen"
          >
            <el-option
              v-for="p in protocolOptions"
              :key="p"
              :label="p"
              :value="p"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="地址">
          <el-input
            v-model="form.systemDataSettingServer"
            placeholder="优先填写完整连接串"
            :disabled="!modeChosen"
          />
        </el-form-item>

        <el-form-item label="主机/端口">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input
              v-model="form.systemDataSettingHost"
              placeholder="主机"
              :disabled="!modeChosen"
            />
            <el-input-number
              class="!min-w-[150px]"
              v-model="form.systemDataSettingPort"
              :min="0"
              :max="65535"
              placeholder="端口"
              :disabled="!modeChosen"
            />
          </div>
        </el-form-item>

        <el-form-item label="账号/密码">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input
              v-model="form.systemDataSettingUsername"
              placeholder="账号"
              :disabled="!modeChosen"
            />
            <el-input
              v-model="form.systemDataSettingPassword"
              type="password"
              placeholder="密码"
              :disabled="!modeChosen"
            />
          </div>
        </el-form-item>

        <el-form-item label="启用">
          <el-switch
            v-model="form.systemDataSettingEnabled"
            :disabled="!modeChosen"
          />
        </el-form-item>
      </div>

      <!-- 右：高级配置 -->
      <div class="col right">
        <el-form-item label="启用控制台">
          <el-switch v-model="consoleEnabled" :disabled="!modeChosen" />
        </el-form-item>

        <el-form-item label="图表类型">
          <el-select
            v-model="form.systemDataSettingChartType"
            filterable
            allow-create
            :disabled="!modeChosen"
            placeholder="可自定义"
          >
            <el-option label="LINE" value="LINE" />
            <el-option label="BAR" value="BAR" />
            <el-option label="PIE" value="PIE" />
          </el-select>
        </el-form-item>

        <el-form-item label="远程图片URL" prop="systemDataSettingImageUrl">
          <el-input
            v-model="form.systemDataSettingImageUrl"
            placeholder="http(s)://..."
            :disabled="!modeChosen"
          />
        </el-form-item>

        <el-form-item label="图标URL" prop="systemDataSettingIcon">
          <el-input
            v-model="form.systemDataSettingIcon"
            placeholder="http(s)://..."
            :disabled="!modeChosen"
          />
        </el-form-item>

        <!-- JDBC 驱动设置（仅当协议为 jdbc 时显示） -->
        <template v-if="isJdbc">
          <el-form-item label="JDBC驱动">
            <el-select
              v-model="form.systemDataSettingDriverClass"
              placeholder="选择驱动"
              :disabled="!modeChosen"
              filterable
              allow-create
            >
              <el-option
                v-for="d in jdbcDrivers"
                :key="d.value"
                :label="d.label"
                :value="d.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="驱动文件">
            <div style="display: flex; gap: 8px; width: 100%">
              <el-input
                v-model="form.systemDataSettingDriverPath"
                placeholder="本地路径或URL"
                :disabled="!modeChosen"
              />
              <el-upload
                :auto-upload="false"
                :show-file-list="false"
                :on-change="onDriverFileChange"
                :disabled="!modeChosen"
              >
                <el-button :disabled="!modeChosen">上传驱动</el-button>
              </el-upload>
            </div>
          </el-form-item>
        </template>
      </div>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSave"
        >保存</el-button
      >
    </template>
  </el-dialog>
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
} from "@/api/system-data";

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
  { label: "远程", value: "REMOTE" },
  { label: "文件", value: "FILE" },
];

const systemDataSettingTypeValues = [
  { name: "数据库", value: "JDBC" },
  { name: "REDIS", value: "REDIS" },
  { name: "ZOOKEEPER", value: "ZOOKEEPER" },
  { name: "INFLUXDB", value: "INFLUXDB" },
];

// 协议列表（包含 jdbc）
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
  "mongodb",
  "kafka",
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
    form.value.systemDataSettingHost = "127.0.0.1";
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
// - 远程模式校验：需填写“地址”或“主机+端口”
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
        const server = (form.value.systemDataSettingServer || "").trim();
        const host = (form.value.systemDataSettingHost || "").trim();
        const port = form.value.systemDataSettingPort as any;
        if (server) return cb();
        if (!host)
          return cb(new Error("远程模式下需填写“地址”或同时填写“主机+端口”"));
        if (!Number.isInteger(port) || port <= 0)
          return cb(new Error("请填写有效端口(>0)"));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingPort: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        const server = (form.value.systemDataSettingServer || "").trim();
        const host = (form.value.systemDataSettingHost || "").trim();
        if (server) return cb();
        if (!host) return cb(); // 由 host 的校验提示
        if (!Number.isInteger(value) || value <= 0)
          return cb(new Error("请填写有效端口(>0)"));
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

.col.left,
.col.right {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
