<template>
  <sc-drawer
    v-model="visible"
    :size="600"
    destroy-on-close
    class="log-detail-drawer"
    @close="close"
  >
    <template #header>
      <div class="drawer-header">
        <div
          class="header-icon"
          :class="form.jobLogTriggerCode !== '00000' ? 'error' : 'success'"
        >
          <IconifyIconOnline
            :icon="
              form.jobLogTriggerCode !== '00000'
                ? 'ri:close-circle-line'
                : 'ri:checkbox-circle-line'
            "
          />
        </div>
        <div class="header-info">
          <span class="header-title">日志详情</span>
          <span class="header-subtitle">#{{ form.jobLogId }}</span>
        </div>
      </div>
    </template>

    <div class="drawer-content">
      <!-- 状态卡片 -->
      <div
        class="status-card"
        :class="form.jobLogTriggerCode !== '00000' ? 'error' : 'success'"
      >
        <div class="status-info">
          <span class="status-label">执行状态</span>
          <span class="status-value">{{
            form.jobLogTriggerCode !== "00000" ? "执行失败" : "执行成功"
          }}</span>
        </div>
        <div class="status-time">
          <IconifyIconOnline icon="ri:time-line" />
          <span>{{ dateFormat(form.jobLogTriggerTime) }}</span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:information-line" class="section-icon" />
          <span>基本信息</span>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">请求接口</span>
            <span class="info-value code">{{
              form.executorHandler || "-"
            }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">执行环境</span>
            <el-tag size="small" :type="getEnvType(form.jobLogProfile)">
              {{ form.jobLogProfile || "-" }}
            </el-tag>
          </div>
          <div class="info-item">
            <span class="info-label">执行服务器</span>
            <ScIp
              v-if="form.jobLogTriggerAddress"
              :ip="form.jobLogTriggerAddress"
            />
            <span v-else class="info-value">-</span>
          </div>
          <div class="info-item">
            <span class="info-label">执行耗时</span>
            <span
              class="info-value cost"
              :class="getCostClass(form.jobLogCost)"
            >
              <IconifyIconOnline icon="ri:timer-line" />
              {{ form.jobLogCost || 0 }} ms
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">日志时间</span>
            <span class="info-value">{{ dateFormat(form.createTime) }}</span>
          </div>
        </div>
      </div>

      <!-- 错误信息 -->
      <div v-if="form.jobLogTriggerMsg" class="info-section">
        <div class="section-title">
          <IconifyIconOnline
            icon="ri:error-warning-line"
            class="section-icon error"
          />
          <span>错误信息</span>
        </div>
        <div class="error-box">
          <div class="error-content" v-html="form.jobLogTriggerMsg" />
        </div>
      </div>

      <!-- 参数信息 -->
      <div v-if="form.jobLogTriggerParam" class="info-section">
        <div class="section-title">
          <IconifyIconOnline icon="ri:code-s-slash-line" class="section-icon" />
          <span>请求参数</span>
        </div>
        <div class="param-box">
          <pre class="param-content">{{ form.jobLogTriggerParam }}</pre>
        </div>
      </div>
    </div>
  </sc-drawer>
</template>

<script>
import { dateFormat } from "@repo/utils";

export default {
  data() {
    return {
      form: {},
      visible: false,
    };
  },
  methods: {
    dateFormat,
    setData(data) {
      Object.assign(this.form, data);
      return this;
    },
    close() {
      this.visible = false;
      this.form = {};
    },
    open() {
      this.visible = true;
    },
    getEnvType(env) {
      if (!env) return "info";
      const envMap = {
        prod: "danger",
        dev: "primary",
        test: "warning",
      };
      return envMap[env.toLowerCase()] || "info";
    },
    getCostClass(cost) {
      if (!cost) return "";
      if (cost > 10000) return "slow";
      if (cost > 5000) return "warn";
      return "normal";
    },
  },
};
</script>

<style scoped lang="scss">
/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
}

.header-icon.success {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.header-icon.error {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-subtitle {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
}

/* 抽屉内容 */
.drawer-content {
  padding: 0 20px 20px;
}

/* 状态卡片 */
.status-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.status-card.success {
  background: linear-gradient(
    135deg,
    rgba(16, 185, 129, 0.1),
    rgba(16, 185, 129, 0.05)
  );
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-card.error {
  background: linear-gradient(
    135deg,
    rgba(239, 68, 68, 0.1),
    rgba(239, 68, 68, 0.05)
  );
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-value {
  font-size: 18px;
  font-weight: 700;
}

.status-card.success .status-value {
  color: #10b981;
}

.status-card.error .status-value {
  color: #ef4444;
}

.status-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 信息区块 */
.info-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-icon {
  font-size: 16px;
  color: var(--el-color-primary);
}

.section-icon.error {
  color: var(--el-color-danger);
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.info-label {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-weight: 500;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.info-value.code {
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-color-primary);
}

.info-value.cost {
  display: flex;
  align-items: center;
  gap: 4px;
}

.info-value.cost.normal {
  color: var(--el-color-success);
}

.info-value.cost.warn {
  color: var(--el-color-warning);
}

.info-value.cost.slow {
  color: var(--el-color-danger);
}

/* 错误信息框 */
.error-box {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-5);
  border-radius: 8px;
  padding: 16px;
}

.error-content {
  font-size: 13px;
  color: var(--el-color-danger);
  line-height: 1.6;
  word-break: break-all;
}

/* 参数信息框 */
.param-box {
  background: var(--el-fill-color-darker);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.param-content {
  font-size: 12px;
  font-family: "SF Mono", "Monaco", "Consolas", monospace;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
