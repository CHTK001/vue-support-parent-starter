<template>
  <el-dialog
    draggable
    append-to-body
    v-model="visibleInner"
    :title="modelValue ? '编辑配置' : '新建配置'"
    width="1100px"
    :close-on-click-modal="false"
    @close="handleClose"
    class="data-edit-dialog"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="90px"
      class="edit-form"
    >
      <div class="form-layout">
        <!-- 左侧�?-->
        <div class="form-column">
          <!-- 基础信息区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:information-line" />
              <span>基础信息</span>
            </div>
            <div class="section-content">
              <el-form-item label="名称" prop="systemDataSettingName">
                <el-input v-model="form.systemDataSettingName" placeholder="请输入数据源名称" clearable>
                  <template #prefix>
                    <IconifyIconOnline icon="ri:text-snippet" />
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item label="类型" prop="systemDataSettingType">
                <el-select
                  v-model="form.systemDataSettingType"
                  placeholder="请选择数据源类�?
                  style="width: 100%"
                  @change="handleTypeChange"
                >
                  <el-option
                    v-for="item in systemDataSettingTypeValues"
                    :key="item.value"
                    :label="item.name"
                    :value="item.value"
                  >
                    <div class="type-option">
                      <IconifyIconOnline :icon="item.icon" class="option-icon" />
                      <span>{{ item.name }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>

              <!-- JDBC 驱动选择 -->
              <template v-if="form.systemDataSettingType === 'JDBC'">
                <el-form-item label="数据库类�? prop="systemDataSettingDriverClass">
                  <el-select
                    v-model="form.systemDataSettingDriverClass"
                    placeholder="请选择数据库类�?
                    style="width: 100%"
                    filterable
                    @change="handleDriverChange"
                  >
                    <el-option
                      v-for="item in jdbcDrivers"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    >
                      <div class="type-option">
                        <IconifyIconOnline :icon="item.icon" class="option-icon" />
                        <span>{{ item.label }}</span>
                        <el-tag v-if="item.tag" size="small" type="info" class="ml-2">{{ item.tag }}</el-tag>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="驱动文件">
                  <div class="driver-upload">
                    <el-input
                      v-model="form.systemDataSettingDriverPath"
                      placeholder="可选，自定义驱动路�?
                      clearable
                    />
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="onDriverFileChange"
                      class="upload-btn"
                    >
                      <el-button type="primary" plain size="small">
                        <IconifyIconOnline icon="ri:upload-2-line" />
                      </el-button>
                    </el-upload>
                  </div>
                </el-form-item>
              </template>
            </div>
          </div>

          <!-- 连接模式区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:switch-line" />
              <span>连接模式</span>
            </div>
            <div class="section-content">
              <el-form-item label="模式" class="mode-select-item">
                <ScSelect
                  v-model="form.systemDataSettingMode"
                  :options="modeOptions"
                  placeholder="请选择模式"
                />
              </el-form-item>
            </div>
          </div>

          <!-- 认证信息区域 - 仅远程模�?-->
          <div v-if="form.systemDataSettingMode === 'REMOTE'" class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:shield-user-line" />
              <span>认证信息</span>
            </div>
            <div class="section-content">
              <el-form-item :label="form.systemDataSettingType === 'EMAIL' ? '账号' : '用户�?">
                <el-input
                  v-model="form.systemDataSettingUsername"
                  placeholder="请输入用户名"
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:user-line" />
                  </template>
                </el-input>
              </el-form-item>
              <el-form-item :label="form.systemDataSettingType === 'EMAIL' ? '授权�? : '密码'">
                <el-input
                  v-model="form.systemDataSettingPassword"
                  type="password"
                  :placeholder="form.systemDataSettingType === 'EMAIL' ? '请输入授权码' : '请输入密�?"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:lock-line" />
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </div>

          <!-- 高级配置区域 -->
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </div>
            <div class="section-content">
              <el-row :gutter="12">
                <el-col :span="8">
                  <el-form-item label="启用">
                    <el-switch v-model="form.systemDataSettingEnabled" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="监听">
                    <el-switch v-model="form.systemDataSettingIdle" />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="控制�?>
                    <el-switch v-model="consoleEnabled" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item v-if="form.systemDataSettingType === 'INFLUXDB'" label="数据库策�?>
                <el-input v-model="form.systemDataSettingPolicy" placeholder="策略�? />
              </el-form-item>
            </div>
          </div>
        </div>

        <!-- 右侧�?-->
        <div class="form-column">
          <!-- 连接配置区域 - 远程模式 -->
          <div v-if="form.systemDataSettingMode === 'REMOTE'" class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:link" />
              <span>连接配置</span>
            </div>
            <div class="section-content">
              <el-row :gutter="12">
                <el-col :span="14">
                  <el-form-item label="主机地址" prop="systemDataSettingHost">
                    <el-input
                      v-model="form.systemDataSettingHost"
                      placeholder="localhost"
                      clearable
                      @blur="generateConnectionUrl"
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:server-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="10">
                  <el-form-item label="端口" prop="systemDataSettingPort">
                    <el-input-number
                      v-model="form.systemDataSettingPort"
                      :min="1"
                      :max="65535"
                      style="width: 100%"
                      controls-position="right"
                      @change="generateConnectionUrl"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="数据库名">
                    <el-input
                      v-model="form.systemDataSettingDatabase"
                      placeholder="数据库名�?
                      clearable
                      @blur="generateConnectionUrl"
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:database-2-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="协议">
                    <el-select
                      v-model="form.systemDataSettingProtocol"
                      filterable
                      allow-create
                      placeholder="自动识别"
                      style="width: 100%"
                    >
                      <el-option v-for="p in protocolOptions" :key="p" :label="p" :value="p" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 连接地址预览 -->
              <el-form-item label="连接地址">
                <div class="url-preview">
                  <el-input
                    v-model="form.systemDataSettingServer"
                    placeholder="自动生成或手动输�?
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:links-line" />
                    </template>
                    <template #append>
                      <el-tooltip content="自动生成" placement="top">
                        <el-button @click="generateConnectionUrl">
                          <IconifyIconOnline icon="ri:refresh-line" />
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-input>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 文件配置区域 - 文件模式 -->
          <div v-if="form.systemDataSettingMode === 'FILE'" class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:file-line" />
              <span>文件配置</span>
            </div>
            <div class="section-content">
              <el-form-item label="文件路径" prop="systemDataSettingServer">
                <el-input
                  v-model="form.systemDataSettingServer"
                  placeholder="本地文件路径"
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:folder-open-line" />
                  </template>
                  <template #append>
                    <el-upload
                      :auto-upload="false"
                      :show-file-list="false"
                      :on-change="onFileSelect"
                      class="file-upload-btn"
                    >
                      <el-button>
                        <IconifyIconOnline icon="ri:folder-open-line" />
                        浏览
                      </el-button>
                    </el-upload>
                  </template>
                </el-input>
              </el-form-item>

              <el-form-item label="数据库名">
                <el-input
                  v-model="form.systemDataSettingDatabase"
                  placeholder="数据库名称（可选）"
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:database-2-line" />
                  </template>
                </el-input>
              </el-form-item>
            </div>
          </div>

          <!-- 额外参数区域（仅JDBC显示�?-->
          <div v-if="form.systemDataSettingType === 'JDBC'" class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:settings-3-line" />
              <span>连接参数</span>
              <el-button type="primary" link size="small" @click="addExtraParam" class="add-param-btn">
                <IconifyIconOnline icon="ri:add-line" />
                添加
              </el-button>
            </div>
            <div class="section-content">
              <!-- 快捷参数按钮 -->
              <div class="quick-params">
                <el-tag
                  v-for="param in quickParams"
                  :key="param.key"
                  :type="hasParam(param.key) ? 'success' : 'info'"
                  effect="plain"
                  class="quick-param-tag"
                  @click="toggleQuickParam(param)"
                >
                  <IconifyIconOnline :icon="hasParam(param.key) ? 'ri:checkbox-circle-fill' : 'ri:checkbox-blank-circle-line'" class="tag-icon" />
                  {{ param.label }}
                </el-tag>
              </div>

              <!-- 参数列表 -->
              <div class="params-list">
                <div v-for="(param, index) in extraParams" :key="index" class="param-item">
                  <el-input v-model="param.key" placeholder="参数�? class="param-key" size="small" />
                  <span class="param-eq">=</span>
                  <el-input v-model="param.value" placeholder="参数�? class="param-value" size="small" />
                  <el-button type="danger" link size="small" @click="removeExtraParam(index)">
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                  </el-button>
                </div>
                <div v-if="extraParams.length === 0" class="no-params">
                  <IconifyIconOnline icon="ri:information-line" />
                  <span>点击快捷标签或添加按�?/span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          <IconifyIconOnline icon="ri:close-line" />
          取消
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">
          <IconifyIconOnline icon="ri:save-line" />
          保存
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
/**
 * 数据源编辑对话框
 * 
 * @author CH
 * @since 2025-11-30
 */
import { computed, ref, watch, reactive } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";
import {
  saveSystemDataSetting,
  type SystemDataSetting,
  uploadJdbcDriver,
} from "@/api/data-management/system-data";

interface Props {
  visible: boolean;
  modelValue?: SystemDataSetting | null;
}

interface ExtraParam {
  key: string;
  value: string;
}

interface QuickParam {
  key: string;
  value: string;
  label: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:visible": [boolean]; success: [] }>();

const visibleInner = ref(false);
const loading = ref(false);
const formRef = ref<FormInstance>();
const consoleEnabled = ref<boolean>(true);

// 额外参数列表
const extraParams = ref<ExtraParam[]>([]);

// 表单数据
const form = ref<SystemDataSetting>({
  systemDataSettingId: undefined as any,
  systemDataSettingName: "",
  systemDataSettingType: "",
  systemDataSettingIdle: false,
  systemDataSettingProtocol: "",
  systemDataSettingServer: "",
  systemDataSettingHost: "localhost",
  systemDataSettingPort: undefined as any,
  systemDataSettingUsername: "",
  systemDataSettingPassword: "",
  systemDataSettingDatabase: "",
  systemDataSettingEnabled: true,
  systemDataSettingTimeoutMs: 600000,
  systemDataSettingMode: "REMOTE",
  systemDataSettingChartType: "",
  systemDataSettingImageUrl: "",
  systemDataSettingIcon: "",
  systemDataSettingDriverClass: "",
  systemDataSettingDriverPath: "",
  systemDataSettingConfig: "",
} as any);

// 数据源类型选项
const systemDataSettingTypeValues = [
  { name: "数据�?JDBC)", value: "JDBC", icon: "ri:database-line" },
  { name: "Redis", value: "REDIS", icon: "ri:database-2-line" },
  { name: "Zookeeper", value: "ZOOKEEPER", icon: "ri:node-tree" },
  { name: "InfluxDB", value: "INFLUXDB", icon: "ri:line-chart-line" },
  { name: "电子邮件", value: "EMAIL", icon: "ri:mail-line" },
];

// 模式选项
const modeOptions = [
  { label: "远程连接", value: "REMOTE", icon: "ri:cloud-line" },
  { label: "本地文件", value: "FILE", icon: "ri:file-line" },
];

// 协议列表
const protocolOptions = ["Jdbc", "Mysql", "Postgresql", "Sqlite", "Oracle", "Sqlserver", "Redis", "Zookeeper", "Influxdb", "Mongodb", "Kafka", "Email"];

// JDBC驱动配置（包含默认端口和协议�?
const jdbcDrivers = [
  { label: "MySQL 8.x", value: "com.mysql.cj.jdbc.Driver", icon: "ri:database-line", port: 3306, protocol: "mysql", urlTemplate: "jdbc:mysql://{host}:{port}/{database}" },
  { label: "MySQL 5.x", value: "com.mysql.jdbc.Driver", icon: "ri:database-line", port: 3306, protocol: "mysql", urlTemplate: "jdbc:mysql://{host}:{port}/{database}" },
  { label: "PostgreSQL", value: "org.postgresql.Driver", icon: "ri:database-2-line", port: 5432, protocol: "postgresql", urlTemplate: "jdbc:postgresql://{host}:{port}/{database}" },
  { label: "Oracle", value: "oracle.jdbc.driver.OracleDriver", icon: "ri:database-fill", port: 1521, protocol: "oracle", urlTemplate: "jdbc:oracle:thin:@{host}:{port}:{database}" },
  { label: "SQL Server", value: "com.microsoft.sqlserver.jdbc.SQLServerDriver", icon: "ri:microsoft-line", port: 1433, protocol: "sqlserver", urlTemplate: "jdbc:sqlserver://{host}:{port};databaseName={database}" },
  { label: "SQLite", value: "org.sqlite.JDBC", icon: "ri:file-3-line", port: 0, protocol: "sqlite", urlTemplate: "jdbc:sqlite:{database}" },
  { label: "H2", value: "org.h2.Driver", icon: "ri:hard-drive-line", port: 9092, protocol: "h2", urlTemplate: "jdbc:h2:tcp://{host}:{port}/{database}" },

  { label: "MariaDB", value: "org.mariadb.jdbc.Driver", icon: "ri:database-line", port: 3306, protocol: "mariadb", urlTemplate: "jdbc:mariadb://{host}:{port}/{database}" },
  { label: "ClickHouse", value: "ru.yandex.clickhouse.ClickHouseDriver", icon: "ri:bar-chart-line", port: 8123, protocol: "clickhouse", urlTemplate: "jdbc:clickhouse://{host}:{port}/{database}" },
  { label: "达梦(DM)", value: "dm.jdbc.driver.DmDriver", icon: "ri:shield-line", port: 5236, protocol: "dm", urlTemplate: "jdbc:dm://{host}:{port}/{database}" },
  { label: "人大金仓", value: "com.kingbase8.Driver", icon: "ri:shield-line", port: 54321, protocol: "kingbase8", urlTemplate: "jdbc:kingbase8://{host}:{port}/{database}" },
  { label: "GBase", value: "com.gbase.jdbc.Driver", icon: "ri:shield-line", port: 5258, protocol: "gbase", urlTemplate: "jdbc:gbase://{host}:{port}/{database}" },
];

// 非JDBC类型的默认端�?
const defaultPorts: Record<string, number> = {
  redis: 6379,
  zookeeper: 2181,
  influxdb: 8086,
  email: 25,
};

// 快捷参数配置
const quickParams: QuickParam[] = [
  { key: "useUnicode", value: "true", label: "Unicode编码" },
  { key: "characterEncoding", value: "UTF-8", label: "UTF-8字符�? },
  { key: "serverTimezone", value: "Asia/Shanghai", label: "上海时区" },
  { key: "useSSL", value: "false", label: "禁用SSL" },
  { key: "allowPublicKeyRetrieval", value: "true", label: "允许公钥检�? },
  { key: "autoReconnect", value: "true", label: "自动重连" },
  { key: "connectTimeout", value: "10000", label: "连接超时10s" },
  { key: "socketTimeout", value: "60000", label: "Socket超时60s" },
];

// 检查是否已有某参数
const hasParam = (key: string): boolean => {
  return extraParams.value.some(p => p.key === key);
};

// 切换快捷参数
const toggleQuickParam = (param: QuickParam) => {
  const index = extraParams.value.findIndex(p => p.key === param.key);
  if (index >= 0) {
    extraParams.value.splice(index, 1);
  } else {
    extraParams.value.push({ key: param.key, value: param.value });
  }
  generateConnectionUrl();
};

// 添加额外参数
const addExtraParam = () => {
  extraParams.value.push({ key: "", value: "" });
};

// 删除额外参数
const removeExtraParam = (index: number) => {
  extraParams.value.splice(index, 1);
  generateConnectionUrl();
};

// 类型变更处理
const handleTypeChange = (type: string) => {
  const key = type.toLowerCase();
  if (defaultPorts[key]) {
    form.value.systemDataSettingPort = defaultPorts[key];
  }
  // 设置默认协议
  form.value.systemDataSettingProtocol = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  
  // 如果不是JDBC，清空驱动相关字�?
  if (type !== "JDBC") {
    form.value.systemDataSettingDriverClass = "";
    form.value.systemDataSettingDriverPath = "";
    extraParams.value = [];
  }
  
  generateConnectionUrl();
};

// 驱动变更处理
const handleDriverChange = (driverClass: string) => {
  const driver = jdbcDrivers.find(d => d.value === driverClass);
  if (driver) {
    // 设置默认端口
    if (!form.value.systemDataSettingPort || form.value.systemDataSettingPort === 0) {
      form.value.systemDataSettingPort = driver.port;
    }
    // 设置协议
    form.value.systemDataSettingProtocol = driver.protocol.charAt(0).toUpperCase() + driver.protocol.slice(1);
    
    // MySQL类型自动添加常用参数
    if (driver.protocol === "mysql" && extraParams.value.length === 0) {
      extraParams.value = [
        { key: "useUnicode", value: "true" },
        { key: "characterEncoding", value: "UTF-8" },
        { key: "serverTimezone", value: "Asia/Shanghai" },
        { key: "useSSL", value: "false" },
      ];
    }
    
    generateConnectionUrl();
  }
};

// 生成连接URL
const generateConnectionUrl = () => {
  const host = form.value.systemDataSettingHost || "localhost";
  const port = form.value.systemDataSettingPort || 3306;
  const database = form.value.systemDataSettingDatabase || "";
  const type = form.value.systemDataSettingType;
  
  if (type === "JDBC") {
    const driver = jdbcDrivers.find(d => d.value === form.value.systemDataSettingDriverClass);
    if (driver && driver.urlTemplate) {
      let url = driver.urlTemplate
        .replace("{host}", host)
        .replace("{port}", String(port))
        .replace("{database}", database);
      
      // 添加额外参数
      const validParams = extraParams.value.filter(p => p.key && p.value);
      if (validParams.length > 0) {
        const paramStr = validParams.map(p => `${p.key}=${p.value}`).join("&");
        // 根据不同数据库使用不同的参数分隔�?
        if (driver.protocol === "sqlserver") {
          url += ";" + validParams.map(p => `${p.key}=${p.value}`).join(";");
        } else {
          url += "?" + paramStr;
        }
      }
      
      form.value.systemDataSettingServer = url;
    }
  } else if (type === "REDIS") {
    form.value.systemDataSettingServer = `redis://${host}:${port}`;
  } else if (type === "ZOOKEEPER") {
    form.value.systemDataSettingServer = `${host}:${port}`;
  } else if (type === "INFLUXDB") {
    form.value.systemDataSettingServer = `http://${host}:${port}`;
  }
};

// 表单验证规则
const rules: FormRules = {
  systemDataSettingName: [
    { required: true, message: "请填写数据源名称", trigger: "blur" },
  ],
  systemDataSettingType: [
    { required: true, message: "请选择数据源类�?, trigger: "change" },
  ],
  systemDataSettingHost: [
    {
      validator: (_: any, __: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        const host = (form.value.systemDataSettingHost || "").trim();
        if (!host) return cb(new Error("请填写主机地址"));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingPort: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingMode !== "REMOTE") return cb();
        if (!Number.isInteger(value) || value <= 0) return cb(new Error("请填写有效端�?));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
  systemDataSettingDriverClass: [
    {
      validator: (_: any, value: any, cb: (e?: Error) => void) => {
        if (form.value.systemDataSettingType !== "JDBC") return cb();
        if (!(value || "").trim()) return cb(new Error("请选择数据库类�?));
        return cb();
      },
      trigger: ["blur", "change"],
    },
  ],
};

// 初始�?
function init() {
  if (props.modelValue) {
    form.value = { ...(props.modelValue as any) };
    // 解析额外参数
    if (form.value.systemDataSettingConfig) {
      try {
        const params = JSON.parse(form.value.systemDataSettingConfig);
        extraParams.value = Object.entries(params).map(([key, value]) => ({ key, value: String(value) }));
      } catch {
        extraParams.value = [];
      }
    } else {
      extraParams.value = [];
    }
  } else {
    form.value = {
      systemDataSettingName: "",
      systemDataSettingType: "",
      systemDataSettingProtocol: "",
      systemDataSettingServer: "",
      systemDataSettingHost: "localhost",
      systemDataSettingPort: undefined as any,
      systemDataSettingUsername: "",
      systemDataSettingPassword: "",
      systemDataSettingDatabase: "",
      systemDataSettingEnabled: true,
      systemDataSettingTimeoutMs: 600000,
      systemDataSettingMode: "REMOTE",
      systemDataSettingDriverClass: "",
      systemDataSettingDriverPath: "",
      systemDataSettingConfig: "",
    } as any;
    extraParams.value = [];
  }
  consoleEnabled.value = true;
}

// 保存
async function handleSave() {
  try {
    await formRef.value?.validate();
    loading.value = true;
    
    // 序列化额外参�?
    const validParams = extraParams.value.filter(p => p.key && p.value);
    const paramsObj: Record<string, string> = {};
    validParams.forEach(p => { paramsObj[p.key] = p.value; });
    
    const payload = { 
      ...(form.value as any),
      systemDataSettingConfig: validParams.length > 0 ? JSON.stringify(paramsObj) : "",
    };
    
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
      ElMessage.warning("请先保存配置再上传驱�?);
      return;
    }
    const raw = file?.raw as File;
    if (!raw) return;
    const res = await uploadJdbcDriver(form.value.systemDataSettingId as any, raw);
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

// 文件模式下选择文件
function onFileSelect(file: any) {
  const raw = file?.raw as File;
  if (raw) {
    form.value.systemDataSettingServer = raw.name;
  }
}

// 监听对话框显�?
watch(
  () => props.visible,
  (v) => {
    visibleInner.value = v;
    if (v) init();
  },
  { immediate: true }
);

watch(visibleInner, (v) => emit("update:visible", v));
</script>

<style scoped>
/* 对话框样�?*/
.data-edit-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.data-edit-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  padding: 20px 24px;
  margin: 0;
}

.data-edit-dialog :deep(.el-dialog__title) {
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.data-edit-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #fff;
  font-size: 20px;
}

.data-edit-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 65vh;
  overflow-y: auto;
  background: var(--el-bg-color);
}

.data-edit-dialog :deep(.el-dialog__footer) {
  padding: 16px 24px;
  background: var(--el-fill-color-lighter);
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 两列布局 */
.form-layout {
  display: flex;
  gap: 20px;
}

.form-column {
  flex: 1;
  min-width: 0;
}

/* 表单区块样式 */
.form-section {
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.form-section:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--el-color-primary-light-7);
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-primary-light-3));
  border-radius: 1px;
}

.section-title .iconify {
  font-size: 20px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 6px;
  border-radius: 8px;
}

.section-content {
  padding: 0 4px;
}

/* 表单项样式优�?*/
.edit-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.edit-form :deep(.el-input__wrapper),
.edit-form :deep(.el-select__wrapper) {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.edit-form :deep(.el-input__wrapper:hover),
.edit-form :deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary-light-5);
}

.edit-form :deep(.el-input__wrapper.is-focus),
.edit-form :deep(.el-select__wrapper.is-focus) {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
}

/* 类型选项样式 */
.type-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.option-icon {
  font-size: 18px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 4px;
  border-radius: 6px;
}

/* 驱动上传样式 */
.driver-upload {
  display: flex;
  gap: 8px;
  width: 100%;
}

.driver-upload .el-input {
  flex: 1;
}

.upload-btn {
  flex-shrink: 0;
}

.upload-btn :deep(.el-button) {
  border-radius: 8px;
  height: 32px;
  width: 32px;
  padding: 0;
}

/* URL预览样式 */
.url-preview {
  width: 100%;
}

.url-preview :deep(.el-input__wrapper) {
  background: var(--el-fill-color-light);
}

.url-preview :deep(.el-input-group__append) {
  border-radius: 0 8px 8px 0;
}

/* 快捷参数样式 */
.quick-params {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.quick-param-tag {
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
}

.quick-param-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quick-param-tag.el-tag--success {
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success-light-5);
  color: var(--el-color-success);
}

.quick-param-tag .tag-icon {
  margin-right: 6px;
  font-size: 14px;
}

/* 参数列表样式 */
.params-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.param-item:hover {
  background: var(--el-fill-color-light);
}

.param-key {
  width: 180px;
}

.param-key :deep(.el-input__wrapper) {
  background: var(--el-bg-color);
}

.param-eq {
  color: var(--el-color-primary);
  font-weight: bold;
  font-size: 16px;
  min-width: 20px;
  text-align: center;
}

.param-value {
  flex: 1;
}

.param-value :deep(.el-input__wrapper) {
  background: var(--el-bg-color);
}

.param-item :deep(.el-button) {
  font-size: 18px;
  transition: all 0.2s ease;
}

.param-item :deep(.el-button:hover) {
  transform: scale(1.1);
}

.no-params {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 30px 20px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  background: linear-gradient(135deg, var(--el-fill-color-lighter) 0%, var(--el-fill-color) 100%);
  border-radius: 8px;
  border: 2px dashed var(--el-border-color);
}

.no-params .iconify {
  font-size: 20px;
  color: var(--el-color-info);
}

/* 添加参数按钮 */
.add-param-btn {
  margin-left: auto;
  font-size: 13px;
}

.add-param-btn:hover {
  transform: scale(1.05);
}

/* 模式选择卡片样式 */
.mode-select-item {
  margin-bottom: 0;
}

.mode-select-item :deep(.el-form-item__content) {
  display: block;
}

.mode-select-item :deep(.sc-select-card) {
  display: flex;
  gap: 16px;
}

.mode-select-item :deep(.sc-select-card-item) {
  flex: 1;
  min-width: 120px;
  max-width: 200px;
  padding: 16px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.mode-select-item :deep(.sc-select-card-item:hover) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.mode-select-item :deep(.sc-select-card-item.is-active) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.2);
}

/* 开关样式优�?*/
.edit-form :deep(.el-switch) {
  --el-switch-on-color: var(--el-color-primary);
}

/* 对话框底�?*/
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer :deep(.el-button) {
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
}

.dialog-footer :deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
}

.dialog-footer :deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.4);
}

/* 滚动条美�?*/
.data-edit-dialog :deep(.el-dialog__body)::-webkit-scrollbar {
  width: 6px;
}

.data-edit-dialog :deep(.el-dialog__body)::-webkit-scrollbar-track {
  background: var(--el-fill-color-lighter);
  border-radius: 3px;
}

.data-edit-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.data-edit-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker);
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-section {
  animation: fadeInUp 0.4s ease forwards;
}

.form-section:nth-child(1) { animation-delay: 0.05s; }
.form-section:nth-child(2) { animation-delay: 0.1s; }
.form-section:nth-child(3) { animation-delay: 0.15s; }
.form-section:nth-child(4) { animation-delay: 0.2s; }
.form-section:nth-child(5) { animation-delay: 0.25s; }

/* 响应式调�?*/
@media (max-width: 768px) {
  .param-key {
    width: 120px;
  }
  
  .quick-params {
    gap: 6px;
  }
  
  .quick-param-tag {
    padding: 4px 10px;
    font-size: 12px;
  }
}
</style>
