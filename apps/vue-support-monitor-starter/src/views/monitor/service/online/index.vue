<template>
  <div class="online-service-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar-container">
      <div class="toolbar-title">
        <IconifyIconOnline icon="ep:monitor" class="title-icon" />
        <span>在线服务监控</span>
      </div>

      <div class="refresh-control">
        <el-select v-model="countDownTime" class="refresh-select" size="large" placeholder="刷新间隔">
          <el-option :value="5" label="5秒" />
          <el-option :value="10" label="10秒" />
          <el-option :value="20" label="20秒" />
          <el-option :value="30" label="30秒" />
          <el-option :value="60" label="60秒" />
        </el-select>
        <ScCountDown v-model="countDownTime" :loop="true" class="countdown-display" @finish="refresh">
          <template #default="{ row }">
            <div class="countdown-text">
              <IconifyIconOnline icon="ep:refresh" class="countdown-icon" :class="{ rotating: row.seconds < 3 }" />
              <span>{{ row.seconds }}秒后刷新</span>
            </div>
          </template>
        </ScCountDown>
      </div>
    </div>

    <!-- 服务卡片列表 -->
    <div class="service-list-container">
      <transition-group name="service-fade" tag="div" class="service-grid">
        <div v-for="(row, index) in data.tableData" :key="index" class="service-card">
          <!-- 服务卡片头部 -->
          <div class="service-card-header" :class="getStatusClass(row.metadata?.applicationActive)">
            <div class="service-title">
              <span class="service-name">{{ row.metadata?.applicationName }}</span>
              <el-tooltip :content="row.metadata?.applicationActiveInclude" placement="top" effect="dark">
                <IconifyIconOnline icon="ep:info-filled" class="info-icon" />
              </el-tooltip>
            </div>
            <div class="service-status">
              <el-tag :type="row.metadata?.applicationActive === 'UP' ? 'success' : 'warning'" effect="light" size="small" class="status-tag">
                <span class="status-dot" />
                {{ row.metadata?.applicationActive }}
              </el-tag>
            </div>
          </div>

          <!-- 服务卡片内容 -->
          <div class="service-card-content">
            <div class="service-info-item">
              <span class="info-label">应用名称:</span>
              <span class="info-value">{{ row.metadata?.applicationName }}</span>
            </div>
            <div class="service-info-item">
              <span class="info-label">服务地址:</span>
              <span class="info-value address-value">
                <IconifyIconOnline icon="ep:connection" class="address-icon" />
                {{ row.metadata?.applicationHost }}:{{ row.metadata?.applicationPort }}
              </span>
            </div>
            <div class="service-info-item">
              <span class="info-label">运行环境:</span>
              <span class="info-value">{{ row.metadata?.applicationActive }}</span>
            </div>
          </div>

          <!-- 服务卡片操作区 -->
          <div class="service-card-actions">
            <el-tooltip content="数据大屏" placement="top">
              <el-button type="primary" circle class="action-button" @click="doDatav(row)">
                <IconifyIconOnline icon="ep:data-board" />
              </el-button>
            </el-tooltip>

            <el-tooltip content="实时日志" placement="top">
              <el-button type="success" circle class="action-button" @click="onLog(row)">
                <IconifyIconOnline icon="ep:document" />
              </el-button>
            </el-tooltip>

            <el-tooltip content="链路追踪" placement="top">
              <el-button type="warning" circle class="action-button" @click="onTrace(row)">
                <IconifyIconOnline icon="ep:share" />
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </transition-group>

      <!-- 空状态展示 -->
      <el-empty v-if="data.tableData.length === 0" description="暂无在线服务" :image-size="200" class="empty-state" />
    </div>

    <!-- 弹窗组件 -->
    <log ref="detailRef" :form="currentRow" :datav="false" :zIndex="20240925" :overlay="true" />
    <trace ref="detailRef1" :form="currentRow" :datav="false" :zIndex="2001" :overlay="true" />
  </div>
</template>

<script setup>
import { fetchServiceList } from "@/api/monitor/service";
import ScCountDown from "@repo/components/ScCountDown/index.vue";
import { router } from "@repo/core";
import { Base64 } from "js-base64";
import { defineAsyncComponent, markRaw, nextTick, onMounted, reactive, ref } from "vue";

// 异步加载组件
const log = defineAsyncComponent(() => import("../dashboard/portlet/log.vue"));
const trace = defineAsyncComponent(() => import("../dashboard/portlet/urldetail.vue"));

// 当前选中的行数据
const currentRow = ref({});

// 日志弹窗控制
const detailVisible = ref(false);
const detailRef = ref();
const onLog = async row => {
  currentRow.value = row;
  detailVisible.value = true;
  await nextTick();
  detailRef.value?.open();
};

// 链路追踪弹窗控制
const detailVisible1 = ref(false);
const detailRef1 = ref();
const onTrace = async row => {
  currentRow.value = row;
  detailVisible1.value = true;
  await nextTick();
  detailRef1.value?.open();
};

// 分页参数
const params = reactive({
  page: 1,
  pageSize: 10,
  uriSpec: "monitor"
});

// 表格数据
const data = reactive({
  tableData: markRaw([])
});

// 倒计时刷新控制
const countDownTime = ref(10);

// 获取服务列表数据
const getData = () => {
  fetchServiceList(params).then(res => {
    data.tableData = res.data;
  });
};

// 刷新数据
const refresh = () => {
  fetchServiceList(params).then(res => {
    data.tableData = res.data;
  });
};

// 跳转到数据大屏
const doDatav = item => {
  router.push({
    path: "/datav",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: item.metadata.applicationName
    }
  });
};

// 根据服务状态获取样式类名
const getStatusClass = status => {
  return {
    "status-up": status === "UP",
    "status-down": status === "DOWN",
    "status-unknown": !status || (status !== "UP" && status !== "DOWN")
  };
};

// 组件挂载时获取数据
onMounted(async () => {
  getData();
});
</script>

<style lang="scss" scoped>
.online-service-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color);
}

// 顶部工具栏样式
.toolbar-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .toolbar-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    .title-icon {
      margin-right: 8px;
      font-size: 24px;
      color: var(--el-color-primary);
    }
  }

  .refresh-control {
    display: flex;
    align-items: center;
    gap: 12px;

    .refresh-select {
      width: 120px;
    }

    .countdown-display {
      min-width: 140px;

      .countdown-text {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-secondary);

        .countdown-icon {
          color: var(--el-color-primary);
          transition: transform 0.3s ease;

          &.rotating {
            animation: rotate 1s linear infinite;
          }
        }
      }
    }
  }
}

// 服务列表容器
.service-list-container {
  flex: 1;
  padding: 24px;
  overflow: auto;

  .service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  // 服务卡片样式
  .service-card {
    background: var(--el-bg-color-overlay);
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }

    // 卡片头部
    .service-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &.status-up {
        background: linear-gradient(to right, rgba(var(--el-color-success-rgb), 0.1), rgba(var(--el-color-success-rgb), 0.05));
      }

      &.status-down {
        background: linear-gradient(to right, rgba(var(--el-color-danger-rgb), 0.1), rgba(var(--el-color-danger-rgb), 0.05));
      }

      &.status-unknown {
        background: linear-gradient(to right, rgba(var(--el-color-info-rgb), 0.1), rgba(var(--el-color-info-rgb), 0.05));
      }

      .service-title {
        display: flex;
        align-items: center;
        gap: 8px;

        .service-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }

        .info-icon {
          color: var(--el-color-info);
          cursor: pointer;
          transition: color 0.3s;

          &:hover {
            color: var(--el-color-primary);
          }
        }
      }

      .service-status {
        .status-tag {
          display: flex;
          align-items: center;
          gap: 4px;

          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: currentColor;
            display: inline-block;
            animation: pulse 2s infinite;
          }
        }
      }
    }

    // 卡片内容
    .service-card-content {
      padding: 16px;

      .service-info-item {
        display: flex;
        margin-bottom: 12px;

        &:last-child {
          margin-bottom: 0;
        }

        .info-label {
          width: 80px;
          color: var(--el-text-color-secondary);
          flex-shrink: 0;
        }

        .info-value {
          color: var(--el-text-color-primary);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &.address-value {
            display: flex;
            align-items: center;
            gap: 6px;

            .address-icon {
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    // 卡片操作区
    .service-card-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 12px 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      background: var(--el-fill-color-light);

      .action-button {
        transition: all 0.3s;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  // 空状态样式
  .empty-state {
    margin-top: 60px;
  }
}

// 动画效果
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-success-rgb), 0.7);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(var(--el-color-success-rgb), 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(var(--el-color-success-rgb), 0);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

// 列表项动画
.service-fade {
  &-enter-active {
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    transition-delay: calc(0.1s * var(--el-transition-duration) * var(--index, 0));
  }

  &-leave-active {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &-enter-from,
  &-leave-to {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .service-card {
    background: var(--el-bg-color-overlay);

    .service-card-header {
      &.status-up {
        background: linear-gradient(to right, rgba(var(--el-color-success-rgb), 0.2), rgba(var(--el-color-success-rgb), 0.1));
      }

      &.status-down {
        background: linear-gradient(to right, rgba(var(--el-color-danger-rgb), 0.2), rgba(var(--el-color-danger-rgb), 0.1));
      }
    }

    .service-card-actions {
      background: var(--el-fill-color-darker);
    }
  }
}
</style>
