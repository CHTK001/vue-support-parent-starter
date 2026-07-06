<script>
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { defineComponent } from "vue";
import { getTimeAgo } from "@repo/utils";
export default defineComponent({
  components: { IconifyIconOnline },
  props: {
    moduleOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      visible: false,
      row: {},
    };
  },
  methods: {
    setData(row) {
      this.row = { ...(row || {}) };
      return this;
    },
    open(node) {
      this.visible = true;
    },
    onClose() {
      this.visible = false;
      this.row = {};
      this.$emit("close");
    },
    toJsonObject(value) {
      try {
        return JSON.parse(value);
      } catch (error) {
        return value;
      }
    },
    formatJsonText(value) {
      if (value === null || value === undefined || value === "") {
        return "";
      }
      const jsonValue = this.toJsonObject(value);
      if (typeof jsonValue === "string") {
        return jsonValue;
      }
      try {
        return JSON.stringify(jsonValue, null, 2);
      } catch (error) {
        return String(value);
      }
    },
    transform(value) {
      value = String(value || "").toUpperCase();
      const _value = this.moduleOptions.filter((item) => {
        if (item.value == value) {
          return item.label;
        }
      });
      return _value && _value.length > 0 ? _value?.[0]?.label : "其他";
    },
    resolveLoginTypeLabel(value) {
      const normalizedValue = String(value || "").toUpperCase();
      const labels = {
        WEB: "网页",
        APP: "应用",
        H5: "H5",
        WAP: "WAP",
        PC: "电脑端",
      };
      return labels[normalizedValue] || normalizedValue || "-";
    },
    resolveRoleNames(value) {
      if (!value) {
        return [];
      }
      return String(value)
        .split("、")
        .map((item) => item.trim())
        .filter(Boolean);
    },
    getTimeAgo,
  },
});
</script>
<template>
  <div>
    <sc-drawer
      v-model="visible"
      size="50%"
      class="modern-drawer"
      @close="onClose"
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-left">
            <div
              class="header-icon-wrapper"
              :class="row.sysLogStatus === 1 ? 'success' : 'danger'"
            >
              <IconifyIconOnline
                :icon="
                  row.sysLogStatus === 1
                    ? 'ri:checkbox-circle-line'
                    : 'ri:close-circle-line'
                "
                :size="24"
              />
            </div>
            <div class="header-info">
              <span class="header-title">登录日志详情</span>
              <span class="header-subtitle">{{ row.sysLogUsername }}</span>
            </div>
          </div>
          <ScTag
            :type="row.sysLogStatus === 1 ? 'success' : 'danger'"
            size="large"
          >
            {{ row.sysLogStatus === 1 ? "登录成功" : "登录失败" }}
          </ScTag>
        </div>
      </template>
      <div class="drawer-content">
        <!-- 基本信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <IconifyIconOnline icon="ri:information-line" class="card-icon" />
            <span>基本信息</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">账号名称</span>
                <span class="info-value">{{ row.sysLogUsername }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">日志类型</span>
                <span class="info-value">{{ transform(row.sysLogFrom) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">登录方式</span>
                <span class="info-value">{{
                  resolveLoginTypeLabel(row.sysLogLoginType)
                }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">账号角色</span>
                <span class="info-value">
                  <template v-if="resolveRoleNames(row.sysLogRoleNames).length">
                    <ScTag
                      v-for="role in resolveRoleNames(row.sysLogRoleNames)"
                      :key="`${row.sysLogId}-${role}`"
                      type="primary"
                      size="small"
                      class="mr-2 mb-1"
                    >
                      {{ role }}
                    </ScTag>
                  </template>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">部门名称</span>
                <span class="info-value">{{ row.sysDeptName || "-" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">登录时间</span>
                <span class="info-value"
                  >{{ getTimeAgo(row.createTime) }} ({{ row.createTime }})</span>
              </div>
              <div class="info-item">
                <span class="info-label">响应耗时</span>
                <span class="info-value">
                  <ScTag
                    v-if="row.sysLogCost <= 1000"
                    type="success"
                    size="small"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                  <ScTag
                    v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000"
                    type="warning"
                    size="small"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                  <ScTag v-else type="danger" size="small"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 网络信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <IconifyIconOnline icon="ri:global-line" class="card-icon" />
            <span>网络信息</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">客户端IP</span>
                <span class="info-value">{{ row.sysLogIp }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">地理位置</span>
                <span class="info-value">
                  <ScTag v-if="row.sysLogAddress" type="info">{{
                    row.sysLogAddress
                  }}</ScTag>
                  <span v-else>-</span>
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">运营商</span>
                <span class="info-value">{{ row.sysLogIsp || "-" }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">请求地址</span>
                <span class="info-value url-value">{{ row.sysLogUrl }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 设备信息卡片 -->
        <div class="info-card">
          <div class="card-header">
            <IconifyIconOnline icon="ri:device-line" class="card-icon" />
            <span>设备信息</span>
          </div>
          <div class="card-body">
            <div class="info-grid">
              <div v-if="row.sysLogFingerprint" class="info-item">
                <span class="info-label">浏览器指纹</span>
                <span class="info-value fingerprint">{{
                  row.sysLogFingerprint
                }}</span>
              </div>
              <div v-if="row.sysLogUa" class="info-item full-width">
                <span class="info-label">User-Agent</span>
                <span class="info-value ua-value">{{ row.sysLogUa }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 请求参数卡片 -->
        <div v-if="row.sysLogParam" class="info-card">
          <div class="card-header">
            <IconifyIconOnline icon="ri:code-s-slash-line" class="card-icon" />
            <span>请求参数</span>
          </div>
          <div class="card-body">
            <div class="json-wrapper">
              <pre class="json-pretty">{{ formatJsonText(row.sysLogParam) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </sc-drawer>
  </div>
</template>

<style lang="scss" scoped>
.modern-drawer {
  :deep(.el-drawer__header) {
    padding: 20px 24px;
    margin-bottom: 0;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-drawer__body) {
    padding: 24px;
    background: var(--el-bg-color-page);
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;

  .header-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .header-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: #fff;
    border-radius: 10px;

    &.success {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    }

    &.danger {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
    }
  }

  .header-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }

    .header-subtitle {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.drawer-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  overflow: hidden;
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 5%);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgb(0 0 0 / 8%);
  }

  .card-header {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 14px 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .card-icon {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }

  .card-body {
    padding: 16px 20px;
  }
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.full-width {
      grid-column: span 2;
    }

    .info-label {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .info-value {
      font-size: 14px;
      color: var(--el-text-color-primary);

      &.url-value {
        color: var(--el-color-primary);
        word-break: break-all;
      }

      &.fingerprint {
        padding: 4px 8px;
        font-family: monospace;
        font-size: 13px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
      }

      &.ua-value {
        font-size: 12px;
        line-height: 1.6;
        color: var(--el-text-color-secondary);
        word-break: break-word;
      }
    }
  }
}

.json-wrapper {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
}

.json-pretty {
  margin: 0;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, monospace;
  font-size: 13px;
  line-height: 1.65;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

// 暗色主题适配
:root[data-theme="dark"] {
  .info-card {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);

    &:hover {
      box-shadow: 0 4px 16px rgb(0 0 0 / 30%);
    }
  }
}
</style>
