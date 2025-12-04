<template>
  <el-dialog
    v-model="visible"
    title="告警配置"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="alert-config">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 告警规则 -->
        <el-tab-pane label="告警规则" name="rules">
          <div class="rules-panel">
            <div class="rules-header">
              <el-button type="primary" size="small" @click="addRule">
                <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                新增规则
              </el-button>
              <el-button size="small" @click="importRules">
                <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
                导入规则
              </el-button>
              <el-button size="small" @click="exportRules">
                <IconifyIconOnline icon="ri:download-line" class="mr-1" />
                导出规则
              </el-button>
            </div>

            <div class="rules-list">
              <div
                v-for="(rule, index) in alertRules"
                :key="index"
                class="rule-item"
                :class="{ disabled: !rule.enabled }"
              >
                <div class="rule-header">
                  <div class="rule-info">
                    <span class="rule-name">{{ rule.name }}</span>
                    <el-tag :type="getSeverityType(rule.severity)" size="small">
                      {{ getSeverityText(rule.severity) }}
                    </el-tag>
                    <el-tag v-if="!rule.enabled" type="info" size="small">已禁�?/el-tag>
                  </div>
                  <div class="rule-actions">
                    <el-switch
                      v-model="rule.enabled"
                      size="small"
                      @change="updateRule(index)"
                    />
                    <el-button size="small" text @click="editRule(index)">
                      <IconifyIconOnline icon="ri:edit-line" />
                    </el-button>
                    <el-button size="small" text @click="deleteRule(index)">
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </el-button>
                  </div>
                </div>
                <div class="rule-content">
                  <div class="rule-condition">
                    <span class="condition-label">条件:</span>
                    <span class="condition-text">
                      {{ rule.metric }} {{ getOperatorText(rule.operator) }} {{ rule.threshold }}{{ getUnitText(rule.metric) }}
                    </span>
                  </div>
                  <div class="rule-description" v-if="rule.description">
                    {{ rule.description }}
                  </div>
                </div>
              </div>

              <el-empty v-if="alertRules.length === 0" description="暂无告警规则" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 阈值设�?-->
        <el-tab-pane label="阈值设�? name="thresholds">
          <div class="thresholds-panel">
            <el-alert
              title="阈值配置说�?
              description="设置各项监控指标的告警阈值，当指标值超过设定阈值时将触发相应级别的告警�?
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />

            <el-form :model="thresholdConfig" label-width="120px">
              <!-- CPU阈值设�?-->
              <el-card class="threshold-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <IconifyIconOnline icon="ri:cpu-line" class="metric-icon" />
                    <span>CPU使用率阈�?/span>
                  </div>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="正常阈�?>
                      <el-input-number
                        v-model="thresholdConfig.cpu.normal"
                        :min="0"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="警告阈�?>
                      <el-input-number
                        v-model="thresholdConfig.cpu.warning"
                        :min="thresholdConfig.cpu.normal"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="危险阈�?>
                      <el-input-number
                        v-model="thresholdConfig.cpu.critical"
                        :min="thresholdConfig.cpu.warning"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <!-- 内存阈值设�?-->
              <el-card class="threshold-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <IconifyIconOnline icon="ri:database-line" class="metric-icon" />
                    <span>内存使用率阈�?/span>
                  </div>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="正常阈�?>
                      <el-input-number
                        v-model="thresholdConfig.memory.normal"
                        :min="0"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="警告阈�?>
                      <el-input-number
                        v-model="thresholdConfig.memory.warning"
                        :min="thresholdConfig.memory.normal"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="危险阈�?>
                      <el-input-number
                        v-model="thresholdConfig.memory.critical"
                        :min="thresholdConfig.memory.warning"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <!-- 磁盘阈值设�?-->
              <el-card class="threshold-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <IconifyIconOnline icon="ri:hard-drive-line" class="metric-icon" />
                    <span>磁盘使用率阈�?/span>
                  </div>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="正常阈�?>
                      <el-input-number
                        v-model="thresholdConfig.disk.normal"
                        :min="0"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="警告阈�?>
                      <el-input-number
                        v-model="thresholdConfig.disk.warning"
                        :min="thresholdConfig.disk.normal"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="危险阈�?>
                      <el-input-number
                        v-model="thresholdConfig.disk.critical"
                        :min="thresholdConfig.disk.warning"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <!-- 温度阈值设�?-->
              <el-card class="threshold-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <IconifyIconOnline icon="ri:temp-hot-line" class="metric-icon" />
                    <span>温度阈�?/span>
                  </div>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="正常阈�?>
                      <el-input-number
                        v-model="thresholdConfig.temperature.normal"
                        :min="0"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">°C</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="警告阈�?>
                      <el-input-number
                        v-model="thresholdConfig.temperature.warning"
                        :min="thresholdConfig.temperature.normal"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">°C</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="危险阈�?>
                      <el-input-number
                        v-model="thresholdConfig.temperature.critical"
                        :min="thresholdConfig.temperature.warning"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">°C</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <!-- 网络阈值设�?-->
              <el-card class="threshold-card" shadow="never">
                <template #header>
                  <div class="card-header">
                    <IconifyIconOnline icon="ri:wifi-line" class="metric-icon" />
                    <span>网络使用率阈�?/span>
                  </div>
                </template>
                <el-row :gutter="20">
                  <el-col :span="8">
                    <el-form-item label="正常阈�?>
                      <el-input-number
                        v-model="thresholdConfig.network.normal"
                        :min="0"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="警告阈�?>
                      <el-input-number
                        v-model="thresholdConfig.network.warning"
                        :min="thresholdConfig.network.normal"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                  <el-col :span="8">
                    <el-form-item label="危险阈�?>
                      <el-input-number
                        v-model="thresholdConfig.network.critical"
                        :min="thresholdConfig.network.warning"
                        :max="100"
                        :step="5"
                        :precision="1"
                        style="width: 100%"
                      />
                      <span class="unit">%</span>
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-card>

              <div class="threshold-actions">
                <el-button @click="resetThresholds">重置为默认�?/el-button>
                <el-button type="primary" @click="saveThresholds">保存阈值配�?/el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <div class="notifications-panel">
            <el-form :model="notificationConfig" label-width="100px">
              <el-form-item label="启用通知">
                <el-switch v-model="notificationConfig.enabled" />
              </el-form-item>

              <template v-if="notificationConfig.enabled">
                <el-form-item label="通知方式">
                  <el-checkbox-group v-model="notificationConfig.methods">
                    <el-checkbox label="email">邮件通知</el-checkbox>
                    <el-checkbox label="webhook">Webhook</el-checkbox>
                    <el-checkbox label="dingtalk">钉钉</el-checkbox>
                    <el-checkbox label="wechat">企业微信</el-checkbox>
                  </el-checkbox-group>
                </el-form-item>

                <!-- 邮件配置 -->
                <template v-if="notificationConfig.methods.includes('email')">
                  <el-divider content-position="left">邮件配置</el-divider>
                  <el-form-item label="收件�?>
                    <el-input
                      v-model="notificationConfig.email.recipients"
                      placeholder="多个邮箱用逗号分隔"
                    />
                  </el-form-item>
                  <el-form-item label="SMTP服务�?>
                    <el-input v-model="notificationConfig.email.smtpHost" />
                  </el-form-item>
                  <el-form-item label="SMTP端口">
                    <el-input-number v-model="notificationConfig.email.smtpPort" :min="1" :max="65535" />
                  </el-form-item>
                </template>

                <!-- Webhook配置 -->
                <template v-if="notificationConfig.methods.includes('webhook')">
                  <el-divider content-position="left">Webhook配置</el-divider>
                  <el-form-item label="Webhook URL">
                    <el-input v-model="notificationConfig.webhook.url" placeholder="https://..." />
                  </el-form-item>
                  <el-form-item label="请求方法">
                    <el-select v-model="notificationConfig.webhook.method">
                      <el-option label="POST" value="POST" />
                      <el-option label="PUT" value="PUT" />
                    </el-select>
                  </el-form-item>
                </template>

                <!-- 钉钉配置 -->
                <template v-if="notificationConfig.methods.includes('dingtalk')">
                  <el-divider content-position="left">钉钉配置</el-divider>
                  <el-form-item label="机器人Token">
                    <el-input v-model="notificationConfig.dingtalk.token" />
                  </el-form-item>
                  <el-form-item label="加签密钥">
                    <el-input v-model="notificationConfig.dingtalk.secret" />
                  </el-form-item>
                </template>
              </template>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 告警历史 -->
        <el-tab-pane label="告警历史" name="history">
          <div class="history-panel">
            <div class="history-filters">
              <el-date-picker
                v-model="historyFilters.dateRange"
                type="datetimerange"
                range-separator="�?
                start-placeholder="开始时�?
                end-placeholder="结束时间"
                size="small"
              />
              <el-select v-model="historyFilters.severity" placeholder="告警级别" size="small" clearable>
                <el-option label="严重" value="critical" />
                <el-option label="警告" value="warning" />
                <el-option label="信息" value="info" />
              </el-select>
              <el-button size="small" @click="loadAlertHistory">查询</el-button>
            </div>

            <div class="history-list">
              <div
                v-for="(alert, index) in alertHistory"
                :key="index"
                class="history-item"
              >
                <div class="alert-header">
                  <el-tag :type="getSeverityType(alert.severity)" size="small">
                    {{ getSeverityText(alert.severity) }}
                  </el-tag>
                  <span class="alert-time">{{ formatTime(alert.time) }}</span>
                  <el-tag :type="alert.resolved ? 'success' : 'danger'" size="small">
                    {{ alert.resolved ? '已解�? : '未解�? }}
                  </el-tag>
                </div>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-description">{{ alert.description }}</div>
                  <div class="alert-server">服务�? {{ alert.serverName }}</div>
                </div>
              </div>

              <el-empty v-if="alertHistory.length === 0" description="暂无告警历史" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 规则编辑对话�?-->
    <el-dialog
      v-model="ruleDialogVisible"
      :title="editingRuleIndex === -1 ? '新增规则' : '编辑规则'"
      width="500px"
      append-to-body
    >
      <el-form :model="currentRule" :rules="ruleRules" ref="ruleFormRef" label-width="80px">
        <el-form-item label="规则名称" prop="name">
          <el-input v-model="currentRule.name" placeholder="请输入规则名�? />
        </el-form-item>
        <el-form-item label="监控指标" prop="metric">
          <el-select v-model="currentRule.metric" placeholder="选择监控指标">
            <el-option label="CPU使用�? value="cpu_usage" />
            <el-option label="内存使用�? value="memory_usage" />
            <el-option label="磁盘使用�? value="disk_usage" />
            <el-option label="网络延迟" value="network_latency" />
            <el-option label="磁盘IO" value="disk_io" />
            <el-option label="负载平均�? value="load_average" />
          </el-select>
        </el-form-item>
        <el-form-item label="比较操作" prop="operator">
          <el-select v-model="currentRule.operator" placeholder="选择比较操作">
            <el-option label="大于" value="gt" />
            <el-option label="大于等于" value="gte" />
            <el-option label="小于" value="lt" />
            <el-option label="小于等于" value="lte" />
            <el-option label="等于" value="eq" />
          </el-select>
        </el-form-item>
        <el-form-item label="阈�? prop="threshold">
          <el-input-number
            v-model="currentRule.threshold"
            :min="0"
            :max="getMaxValue(currentRule.metric)"
            :step="getStepValue(currentRule.metric)"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="告警级别" prop="severity">
          <el-select v-model="currentRule.severity" placeholder="选择告警级别">
            <el-option label="严重" value="critical" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="持续时间">
          <el-input-number
            v-model="currentRule.duration"
            :min="1"
            :max="3600"
            style="width: 100%"
          />
          <span class="duration-unit">�?/span>
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="currentRule.description"
            type="textarea"
            :rows="3"
            placeholder="请输入规则描�?
          />
        </el-form-item>
        <el-form-item label="启用规则">
          <el-switch v-model="currentRule.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ruleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRule">保存</el-button>
      </template>
    </el-dialog>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import { DEFAULT_THRESHOLDS, type MetricsThresholdConfig } from "@/utils/metricsThreshold";

// 状�?
const visible = ref(false);
const activeTab = ref('rules');
const ruleDialogVisible = ref(false);
const editingRuleIndex = ref(-1);

// 告警规则
const alertRules = ref<any[]>([
  {
    name: 'CPU使用率过�?,
    metric: 'cpu_usage',
    operator: 'gt',
    threshold: 80,
    severity: 'warning',
    duration: 300,
    description: 'CPU使用率超�?0%持续5分钟',
    enabled: true
  },
  {
    name: '内存使用率严�?,
    metric: 'memory_usage',
    operator: 'gt',
    threshold: 90,
    severity: 'critical',
    duration: 60,
    description: '内存使用率超�?0%',
    enabled: true
  }
]);

// 当前编辑的规�?
const currentRule = reactive({
  name: '',
  metric: '',
  operator: '',
  threshold: 0,
  severity: 'warning',
  duration: 300,
  description: '',
  enabled: true
});

// 阈值配�?
const thresholdConfig = reactive<MetricsThresholdConfig>({
  cpu: { ...DEFAULT_THRESHOLDS.cpu },
  memory: { ...DEFAULT_THRESHOLDS.memory },
  disk: { ...DEFAULT_THRESHOLDS.disk },
  temperature: { ...DEFAULT_THRESHOLDS.temperature },
  network: { ...DEFAULT_THRESHOLDS.network }
});

// 通知配置
const notificationConfig = reactive({
  enabled: true,
  methods: ['email'],
  email: {
    recipients: '',
    smtpHost: '',
    smtpPort: 587
  },
  webhook: {
    url: '',
    method: 'POST'
  },
  dingtalk: {
    token: '',
    secret: ''
  }
});

// 告警历史
const alertHistory = ref<any[]>([
  {
    title: 'CPU使用率过�?,
    description: 'server01的CPU使用率达�?5%',
    severity: 'warning',
    time: new Date(Date.now() - 3600000),
    serverName: 'server01',
    resolved: true
  },
  {
    title: '内存使用率严�?,
    description: 'server02的内存使用率达到95%',
    severity: 'critical',
    time: new Date(Date.now() - 1800000),
    serverName: 'server02',
    resolved: false
  }
]);

// 历史查询过滤�?
const historyFilters = reactive({
  dateRange: [],
  severity: ''
});

// 表单验证规则
const ruleRules = {
  name: [
    { required: true, message: '请输入规则名�?, trigger: 'blur' }
  ],
  metric: [
    { required: true, message: '请选择监控指标', trigger: 'change' }
  ],
  operator: [
    { required: true, message: '请选择比较操作', trigger: 'change' }
  ],
  threshold: [
    { required: true, message: '请输入阈�?, trigger: 'blur' }
  ],
  severity: [
    { required: true, message: '请选择告警级别', trigger: 'change' }
  ]
};

const ruleFormRef = ref();

// 方法
const open = () => {
  visible.value = true;
  loadAlertHistory();
};

const handleClose = () => {
  visible.value = false;
};

const addRule = () => {
  editingRuleIndex.value = -1;
  resetCurrentRule();
  ruleDialogVisible.value = true;
};

const editRule = (index: number) => {
  editingRuleIndex.value = index;
  Object.assign(currentRule, alertRules.value[index]);
  ruleDialogVisible.value = true;
};

const deleteRule = (index: number) => {
  alertRules.value.splice(index, 1);
  message.success('规则已删�?);
};

const updateRule = (index: number) => {
  message.success('规则状态已更新');
};

const resetCurrentRule = () => {
  Object.assign(currentRule, {
    name: '',
    metric: '',
    operator: '',
    threshold: 0,
    severity: 'warning',
    duration: 300,
    description: '',
    enabled: true
  });
};

const saveRule = async () => {
  try {
    await ruleFormRef.value?.validate();
    
    if (editingRuleIndex.value === -1) {
      alertRules.value.push({ ...currentRule });
      message.success('规则添加成功');
    } else {
      Object.assign(alertRules.value[editingRuleIndex.value], currentRule);
      message.success('规则更新成功');
    }
    
    ruleDialogVisible.value = false;
  } catch (error) {
    // 表单验证失败
  }
};

const importRules = () => {
  // TODO: 实现规则导入
  message.info('功能开发中');
};

const exportRules = () => {
  const data = JSON.stringify(alertRules.value, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alert_rules_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
  message.success('规则导出成功');
};

const loadAlertHistory = () => {
  // TODO: 根据过滤条件加载告警历史
  message.success('告警历史已刷�?);
};

const saveConfig = () => {
  // TODO: 保存告警配置
  message.success('配置保存成功');
};

/**
 * 重置阈值为默认�?
 */
const resetThresholds = () => {
  Object.assign(thresholdConfig.cpu, DEFAULT_THRESHOLDS.cpu);
  Object.assign(thresholdConfig.memory, DEFAULT_THRESHOLDS.memory);
  Object.assign(thresholdConfig.disk, DEFAULT_THRESHOLDS.disk);
  Object.assign(thresholdConfig.temperature, DEFAULT_THRESHOLDS.temperature);
  Object.assign(thresholdConfig.network, DEFAULT_THRESHOLDS.network);
  message.success('阈值已重置为默认�?);
};

/**
 * 保存阈值配�?
 */
const saveThresholds = async () => {
  try {
    // TODO: 调用API保存阈值配�?
    // await saveThresholdConfig(thresholdConfig);
    message.success('阈值配置保存成�?);
  } catch (error) {
    message.error('阈值配置保存失�?);
  }
};

const getSeverityType = (severity: string) => {
  const typeMap = {
    critical: 'danger',
    warning: 'warning',
    info: 'info'
  };
  return typeMap[severity as keyof typeof typeMap] || 'info';
};

const getSeverityText = (severity: string) => {
  const textMap = {
    critical: '严重',
    warning: '警告',
    info: '信息'
  };
  return textMap[severity as keyof typeof textMap] || '未知';
};

const getOperatorText = (operator: string) => {
  const textMap = {
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    eq: '='
  };
  return textMap[operator as keyof typeof textMap] || operator;
};

const getUnitText = (metric: string) => {
  const unitMap = {
    cpu_usage: '%',
    memory_usage: '%',
    disk_usage: '%',
    network_latency: 'ms',
    disk_io: 'MB/s',
    load_average: ''
  };
  return unitMap[metric as keyof typeof unitMap] || '';
};

const getMaxValue = (metric: string) => {
  const maxMap = {
    cpu_usage: 100,
    memory_usage: 100,
    disk_usage: 100,
    network_latency: 10000,
    disk_io: 1000,
    load_average: 100
  };
  return maxMap[metric as keyof typeof maxMap] || 100;
};

const getStepValue = (metric: string) => {
  const stepMap = {
    cpu_usage: 1,
    memory_usage: 1,
    disk_usage: 1,
    network_latency: 10,
    disk_io: 10,
    load_average: 0.1
  };
  return stepMap[metric as keyof typeof stepMap] || 1;
};

const formatTime = (time: Date) => {
  return time.toLocaleString();
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
.alert-config {
  .thresholds-panel {
    .threshold-card {
      margin-bottom: 20px;

      :deep(.el-card__header) {
        padding: 16px 20px;
        background-color: var(--el-fill-color-lighter);
      }

      .card-header {
        display: flex;
        align-items: center;
        gap: 8px;

        .metric-icon {
          font-size: 18px;
          color: var(--el-color-primary);
        }
      }

      :deep(.el-form-item) {
        margin-bottom: 16px;

        .el-form-item__label {
          font-weight: 500;
        }
      }

      .unit {
        margin-left: 8px;
        color: var(--el-text-color-regular);
        font-size: 14px;
      }
    }

    .threshold-actions {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--el-border-color-light);
    }
  }

  .rules-panel {
    .rules-header {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .rules-list {
      .rule-item {
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        margin-bottom: 12px;
        overflow: hidden;

        &.disabled {
          opacity: 0.6;
        }

        .rule-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: var(--el-fill-color-extra-light);
          border-bottom: 1px solid var(--el-border-color-lighter);

          .rule-info {
            display: flex;
            align-items: center;
            gap: 8px;

            .rule-name {
              font-weight: 500;
              color: var(--el-text-color-primary);
            }
          }

          .rule-actions {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .rule-content {
          padding: 12px 16px;

          .rule-condition {
            margin-bottom: 8px;

            .condition-label {
              font-weight: 500;
              color: var(--el-text-color-secondary);
            }

            .condition-text {
              color: var(--el-text-color-primary);
              font-family: monospace;
            }
          }

          .rule-description {
            font-size: 13px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .notifications-panel {
    padding: 16px 0;
  }

  .history-panel {
    .history-filters {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      align-items: center;
    }

    .history-list {
      .history-item {
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        margin-bottom: 12px;
        overflow: hidden;

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background-color: var(--el-fill-color-extra-light);
          border-bottom: 1px solid var(--el-border-color-lighter);

          .alert-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .alert-content {
          padding: 12px 16px;

          .alert-title {
            font-weight: 500;
            margin-bottom: 4px;
            color: var(--el-text-color-primary);
          }

          .alert-description {
            font-size: 13px;
            color: var(--el-text-color-regular);
            margin-bottom: 4px;
          }

          .alert-server {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }
}

.duration-unit {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
