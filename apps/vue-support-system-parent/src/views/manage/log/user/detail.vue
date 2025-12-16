<script>
import { defineComponent } from "vue";
import EyeClose from "@iconify-icons/ri/eye-close-line";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import scStatusIndicator from "@repo/components/ScMini/scStatusIndicator.vue";
import VueJsonPretty from "vue-json-pretty";
import "vue-json-pretty/lib/styles.css";
import { getTimeAgo } from "@repo/utils";
export default defineComponent({
  components: { scStatusIndicator, VueJsonPretty, IconifyIconOnline },
  props: {
    moduleOptions: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      icon: { EyeClose: null },
      visible: false,
      row: {},
      clickEye: false,
    };
  },
  mounted() {
    this.icon.EyeClose = useRenderIcon(EyeClose);
  },
  methods: {
    setData(row) {
      Object.assign(this.row, row);
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
    transform(value) {
      value = String(value || "").toUpperCase();
      const _value = this.moduleOptions.filter((item) => {
        if (item.value == value) {
          return item.label;
        }
      });
      return _value || _value.length > 0
        ? _value?.[0]?.label
        : transformI18n("module.other");
    },
    getTimeAgo,
  },
});
</script>
<template>
  <div>
    <el-drawer
      v-model="visible"
      size="50%"
      @close="onClose"
      class="modern-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-left">
            <div class="header-icon-wrapper" :class="row.sysLogStatus === 1 ? 'success' : 'danger'">
              <IconifyIconOnline :icon="row.sysLogStatus === 1 ? 'ri:checkbox-circle-line' : 'ri:close-circle-line'" :size="24" />
            </div>
            <div class="header-info">
              <span class="header-title">登录日志详情</span>
              <span class="header-subtitle">{{ row.sysLogUsername }}</span>
            </div>
          </div>
          <el-tag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="large">
            {{ row.sysLogStatus === 1 ? '登录成功' : '登录失败' }}
          </el-tag>
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
                <span class="info-label">登录方式</span>
                <span class="info-value">{{ transform(row.sysLogFrom) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">登录时间</span>
                <span class="info-value">{{ getTimeAgo(row.createTime) }} ({{ row.createTime }})</span>
              </div>
              <div class="info-item">
                <span class="info-label">响应耗时</span>
                <span class="info-value">
                  <el-tag v-if="row.sysLogCost <= 1000" type="success" size="small">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000" type="warning" size="small">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else type="danger" size="small">{{ row.sysLogCost || 0 }} ms</el-tag>
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
              <div class="info-item" v-if="row.sysLogAddress">
                <span class="info-label">地理位置</span>
                <span class="info-value">
                  <el-tag type="info">{{ row.sysLogAddress }}</el-tag>
                </span>
              </div>
              <div class="info-item" v-if="row.sysLogIsp">
                <span class="info-label">运营商</span>
                <span class="info-value">{{ row.sysLogIsp }}</span>
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
              <div class="info-item" v-if="row.sysLogFingerprint">
                <span class="info-label">浏览器指纹</span>
                <span class="info-value fingerprint">{{ row.sysLogFingerprint }}</span>
              </div>
              <div class="info-item full-width" v-if="row.sysLogUa">
                <span class="info-label">User-Agent</span>
                <span class="info-value ua-value">{{ row.sysLogUa }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 请求参数卡片 -->
        <div class="info-card" v-if="row.sysLogParam">
          <div class="card-header">
            <IconifyIconOnline icon="ri:code-s-slash-line" class="card-icon" />
            <span>请求参数</span>
          </div>
          <div class="card-body">
            <div class="json-wrapper">
              <VueJsonPretty :data="toJsonObject(row.sysLogParam)" />
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.modern-drawer {
  :deep(.el-drawer__header) {
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 0;
    background: var(--el-bg-color);
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
    align-items: center;
    gap: 12px;
  }

  .header-icon-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

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
  background: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    font-weight: 600;
    color: var(--el-text-color-primary);

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
        word-break: break-all;
        color: var(--el-color-primary);
      }

      &.fingerprint {
        font-family: monospace;
        font-size: 13px;
        background: var(--el-fill-color-light);
        padding: 4px 8px;
        border-radius: 4px;
      }

      &.ua-value {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
        word-break: break-word;
      }
    }
  }
}

.json-wrapper {
  :deep(.vjs-tree) {
    background: var(--el-fill-color-lighter);
    padding: 16px;
    border-radius: 8px;
    font-size: 13px;
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .info-card {
    background: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
