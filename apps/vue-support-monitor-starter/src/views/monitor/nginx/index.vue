<template>
  <div class="nginx-container">
    <!-- 页面头部区域 -->
    <div class="nginx-header">
      <div class="nginx-header__title">
        <IconifyIconOnline icon="simple-icons:nginx" class="nginx-header__icon" />
        <span>Nginx 服务管理</span>
        <el-tag type="info" class="nginx-header__tag">
          <IconifyIconOnline icon="ri:server-line" class="nginx-header__tag-icon" />
          {{ articleRef?.total || 0 }} 个服务
        </el-tag>
      </div>
      <div class="nginx-header__actions">
        <el-button type="primary" class="nginx-header__button" @click="handleRowClick({}, 'add')">
          <IconifyIconOnline icon="ep:plus" />
          <span>添加服务</span>
        </el-button>
        <el-button type="success" plain class="nginx-header__button" @click="handlerSuccess">
          <IconifyIconOnline icon="ep:refresh" />
          <span>刷新</span>
        </el-button>
      </div>
    </div>

    <!-- 服务统计卡片 -->
    <div class="nginx-stats">
      <div class="nginx-stats__card nginx-stats__card--running">
        <div class="nginx-stats__icon-wrapper">
          <IconifyIconOnline icon="ri:play-circle-fill" class="nginx-stats__icon" />
        </div>
        <div class="nginx-stats__content">
          <div class="nginx-stats__label">运行中</div>
          <div class="nginx-stats__value">{{ runningCount }}</div>
        </div>
      </div>

      <div class="nginx-stats__card nginx-stats__card--stopped">
        <div class="nginx-stats__icon-wrapper">
          <IconifyIconOnline icon="ri:stop-circle-fill" class="nginx-stats__icon" />
        </div>
        <div class="nginx-stats__content">
          <div class="nginx-stats__label">已停止</div>
          <div class="nginx-stats__value">{{ stoppedCount }}</div>
        </div>
      </div>

      <div class="nginx-stats__card nginx-stats__card--total">
        <div class="nginx-stats__icon-wrapper">
          <IconifyIconOnline icon="ri:server-fill" class="nginx-stats__icon" />
        </div>
        <div class="nginx-stats__content">
          <div class="nginx-stats__label">总服务数</div>
          <div class="nginx-stats__value">{{ articleRef?.total || 0 }}</div>
        </div>
      </div>
    </div>

    <!-- 服务列表 -->
    <ScTable
      ref="articleRef"
      layout="card"
      :url="fetchPageNginxConfig"
      :rowClick="handleRowClick"
      class="nginx-article"
      empty-text="暂无 Nginx 服务，请点击添加"
      :empty-icon="'ri:server-off-line'"
      @data-loaded="handleDataLoaded"
    >
      <!-- 卡片内容区域 -->
      <template #default="{ row }">
        <div class="nginx-card" :class="{ 'nginx-card--active': row.running }">
          <div class="nginx-card__status-indicator" :class="{ 'nginx-card__status-indicator--active': row.running }" />

          <div class="nginx-card__cover" :class="{ 'nginx-card__cover--active': row.running }">
            <IconifyIconOnline icon="simple-icons:nginx" class="nginx-card__icon" :class="{ 'nginx-card__icon--active': row.running }" />
            <el-tag :type="row.running ? 'success' : 'danger'" class="nginx-card__status" effect="dark">
              {{ row.running ? "运行中" : "已停止" }}
            </el-tag>
          </div>

          <div class="nginx-card__content">
            <div class="nginx-card__title">
              <IconifyIconOnline icon="ri:server-line" class="nginx-card__title-icon" />
              <el-text class="nginx-card__title-text" :type="row.running ? 'primary' : 'info'">{{ row.monitorMqttServerName }}</el-text>
            </div>

            <div class="nginx-card__details">
              <div v-if="row.ip" class="nginx-card__detail-item">
                <IconifyIconOnline icon="ri:global-line" class="nginx-card__detail-icon" />
                <el-text class="nginx-card__detail-text">{{ row.ip }}</el-text>
              </div>
              <div v-if="row.port" class="nginx-card__detail-item">
                <IconifyIconOnline icon="ri:door-lock-line" class="nginx-card__detail-icon" />
                <el-text class="nginx-card__detail-text">端口: {{ row.port }}</el-text>
              </div>
              <div class="nginx-card__detail-item">
                <IconifyIconOnline icon="ri:time-line" class="nginx-card__detail-icon" />
                <el-text class="nginx-card__detail-text">{{ row.createTime }}</el-text>
              </div>
            </div>

            <div class="nginx-card__divider" />

            <div class="nginx-card__actions">
              <el-tooltip content="解析配置" placement="top">
                <el-button type="primary" plain size="small" class="nginx-card__action-btn" @click.stop="handleBoradcast(row)">
                  <IconifyIconOnline icon="ri:align-vertically" />
                </el-button>
              </el-tooltip>

              <el-tooltip content="HTTP设置" placement="top">
                <el-button type="warning" plain size="small" class="nginx-card__action-btn" @click.stop="handleSetting(row)">
                  <IconifyIconOnline icon="ri:settings-3-line" />
                </el-button>
              </el-tooltip>

              <el-tooltip :content="row.running ? '停止服务' : '启动服务'" placement="top">
                <el-button v-if="row.running" type="danger" plain size="small" class="nginx-card__action-btn" @click.stop="handleStop(row)">
                  <IconifyIconOnline icon="ri:stop-circle-line" />
                </el-button>
                <el-button v-else type="success" plain size="small" class="nginx-card__action-btn" @click.stop="handleStart(row)">
                  <IconifyIconOnline icon="ri:play-circle-line" />
                </el-button>
              </el-tooltip>

              <el-tooltip content="重启服务" placement="top">
                <el-button type="info" plain size="small" class="nginx-card__action-btn" @click.stop="handleRestart(row)">
                  <IconifyIconOnline icon="ri:restart-fill" />
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </template>
    </ScTable>

    <!-- 组件引用 -->
    <Save ref="saveRef" @success="handlerSuccess" />
    <Boradcast ref="boradcastRef" @success="handlerSuccess" />
    <Setting ref="settingRef" @success="handlerSuccess" />
  </div>
</template>

<script setup>
import { fetchPageNginxConfig, fetchStartNginxConfig, fetchStopNginxConfig, fetchRestartNginxConfig } from "@/api/monitor/nginx";
import { message } from "@repo/utils";
import { defineAsyncComponent, nextTick, ref, computed } from "vue";

// 异步加载组件
const Save = defineAsyncComponent({
  loader: () => import("./save.vue"),
  delay: 1000
});
const Boradcast = defineAsyncComponent({
  loader: () => import("./analysis.vue"),
  delay: 1000
});
const Setting = defineAsyncComponent({
  loader: () => import("./http.vue"),
  delay: 1000
});

// 组件引用
const saveRef = ref();
const boradcastRef = ref();
const settingRef = ref();
const articleRef = ref();

// 数据状态
const tableData = ref([]);
const runningCount = ref(0);
const stoppedCount = ref(0);

/**
 * 处理数据加载完成事件
 * 计算运行中和已停止的服务数量
 * @param {Array} data - 加载的数据
 */
const handleDataLoaded = data => {
  tableData.value = data;
  runningCount.value = data.filter(item => item.running).length;
  stoppedCount.value = data.filter(item => !item.running).length;
};

/**
 * 启动Nginx服务
 * @param {Object} data - 服务配置数据
 */
const handleStart = async data => {
  try {
    const res = await fetchStartNginxConfig(data);
    if (res.code === "00000") {
      message("服务启动成功", { type: "success" });
      data.running = true;
      // 更新统计数据
      runningCount.value++;
      stoppedCount.value--;
    } else {
      message(res.msg || "启动失败", { type: "error" });
    }
  } catch (error) {
    console.error("启动服务出错:", error);
    message("启动服务出错", { type: "error" });
  }
};

/**
 * 重启Nginx服务
 * @param {Object} data - 服务配置数据
 */
const handleRestart = async data => {
  try {
    const res = await fetchRestartNginxConfig(data);
    if (res.code === "00000") {
      message("服务重启成功", { type: "success" });
      data.running = true;
      // 如果之前是停止状态，更新统计数据
      if (!data.running) {
        runningCount.value++;
        stoppedCount.value--;
      }
    } else {
      message(res.msg || "重启失败", { type: "error" });
    }
  } catch (error) {
    console.error("重启服务出错:", error);
    message("重启服务出错", { type: "error" });
  }
};

/**
 * 停止Nginx服务
 * @param {Object} data - 服务配置数据
 */
const handleStop = async data => {
  try {
    const res = await fetchStopNginxConfig(data);
    if (res.code === "00000") {
      message("服务已停止", { type: "success" });
      data.running = false;
      // 更新统计数据
      runningCount.value--;
      stoppedCount.value++;
    } else {
      message(res.msg || "停止失败", { type: "error" });
    }
  } catch (error) {
    console.error("停止服务出错:", error);
    message("停止服务出错", { type: "error" });
  }
};

/**
 * 操作成功后刷新列表
 */
const handlerSuccess = async () => {
  articleRef.value.refresh();
};

/**
 * 处理行点击事件，打开编辑/添加对话框
 * @param {Object} data - 行数据
 * @param {String} mode - 操作模式，add或edit
 */
const handleRowClick = async (data, mode) => {
  nextTick(() => {
    saveRef.value.handleOpen(mode || "edit", data);
  });
};

/**
 * 打开配置解析对话框
 * @param {Object} data - 行数据
 * @param {String} mode - 操作模式
 */
const handleBoradcast = async (data, mode) => {
  nextTick(() => {
    boradcastRef.value.handleOpen(mode || "edit", data);
  });
};

/**
 * 打开HTTP设置对话框
 * @param {Object} data - 行数据
 * @param {String} mode - 操作模式
 */
const handleSetting = async (data, mode) => {
  nextTick(() => {
    settingRef.value.handleOpen(mode || "edit", data);
  });
};
</script>

<style lang="scss" scoped>
.nginx-container {
  padding: 16px;
  background-color: var(--el-bg-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.nginx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }

  &__title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__icon {
    font-size: 28px;
    color: var(--el-color-success);
    margin-right: 12px;
    filter: drop-shadow(0 0 3px rgba(0, 200, 0, 0.2));
  }

  &__tag {
    margin-left: 12px;
    display: flex;
    align-items: center;
    border-radius: 16px;
    padding: 0 10px;

    &-icon {
      margin-right: 4px;
    }
  }

  &__actions {
    display: flex;
    gap: 12px;
  }

  &__button {
    display: flex;
    align-items: center;
    gap: 6px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
}

/* 统计卡片样式 */
.nginx-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;

  &__card {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color-overlay);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.1);
    }

    &--running {
      border-left: 4px solid var(--el-color-success);

      .nginx-stats__icon {
        color: var(--el-color-success);
      }

      .nginx-stats__value {
        color: var(--el-color-success);
      }
    }

    &--stopped {
      border-left: 4px solid var(--el-color-danger);

      .nginx-stats__icon {
        color: var(--el-color-danger);
      }

      .nginx-stats__value {
        color: var(--el-color-danger);
      }
    }

    &--total {
      border-left: 4px solid var(--el-color-primary);

      .nginx-stats__icon {
        color: var(--el-color-primary);
      }

      .nginx-stats__value {
        color: var(--el-color-primary);
      }
    }
  }

  &__icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--el-fill-color-light);
    margin-right: 16px;
  }

  &__icon {
    font-size: 24px;
  }

  &__content {
    flex: 1;
  }

  &__label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
  }

  &__value {
    font-size: 24px;
    font-weight: 600;
  }
}

.nginx-article {
  flex: 1;
  overflow: auto;

  :deep(.el-card) {
    transition: all 0.3s ease-in-out;
    border-radius: 12px;
    overflow: hidden;
    height: 100%;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    position: relative;

    &:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-primary-light-7);
      z-index: 1;
    }

    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.08));
      opacity: 0;
      transition: opacity 0.3s ease;
      pointer-events: none;
    }

    &:hover::after {
      opacity: 1;
    }
  }
}

.nginx-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  overflow: hidden;

  &--active {
    :deep(.el-card) {
      border: 1px solid var(--el-color-success-light-5);
      box-shadow: 0 8px 24px rgba(0, 200, 0, 0.1);

      &:hover {
        box-shadow: 0 16px 32px rgba(0, 200, 0, 0.15);
        border-color: var(--el-color-success-light-3);
      }
    }
  }

  &__status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background-color: var(--el-color-danger);
    z-index: 2;
    transition: all 0.3s ease;
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.2);

    &--active {
      background-color: var(--el-color-success);
      box-shadow: 0 0 8px rgba(0, 200, 0, 0.3);
    }
  }

  &__cover {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 120px;
    background-color: var(--el-fill-color-light);
    transition: all 0.3s ease;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 70%);
      opacity: 0;
      transform: scale(0.5);
      transition:
        opacity 0.5s ease,
        transform 0.5s ease;
    }

    &:hover::before {
      opacity: 1;
      transform: scale(1);
    }

    &--active {
      background: linear-gradient(135deg, var(--el-color-success-light-8), var(--el-color-success-light-6));

      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
        opacity: 0.5;
      }
    }
  }

  &__icon {
    font-size: 64px;
    color: var(--el-color-info);
    transition: all 0.3s;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));

    &--active {
      color: var(--el-color-success);
      filter: drop-shadow(0 0 12px rgba(0, 200, 0, 0.4));
      animation: pulse 2s infinite;
    }
  }

  &__status {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 12px;
    border-radius: 12px;
    padding: 0 10px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  &__content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 1;
    background: var(--el-bg-color);
    transition: background-color 0.3s ease;
  }

  &__title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 12px;

    &-icon {
      margin-right: 8px;
      color: var(--el-color-primary);
      font-size: 18px;
    }

    &-text {
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__details {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  &__detail-item {
    display: flex;
    align-items: center;
    transition: all 0.3s ease;
    padding: 4px 8px;
    border-radius: 4px;

    &:hover {
      transform: translateX(4px);
      background-color: var(--el-fill-color-light);
    }
  }

  &__detail-icon {
    font-size: 14px;
    margin-right: 8px;
    color: var(--el-color-info);
  }

  &__detail-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  &__divider {
    height: 1px;
    background: linear-gradient(to right, transparent, var(--el-border-color-lighter), transparent);
    margin: 12px 0 16px;
  }

  &__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 8px;
  }

  &__action-btn {
    border-radius: 8px;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition:
        width 0.4s ease,
        height 0.4s ease;
      z-index: -1;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);

      &::before {
        width: 150%;
        height: 150%;
      }
    }

    &:active {
      transform: translateY(0);
    }
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(0, 200, 0, 0.3));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 16px rgba(0, 200, 0, 0.5));
  }
  100% {
    transform: scale(1);
    filter: drop-shadow(0 0 8px rgba(0, 200, 0, 0.3));
  }
}

@keyframes float {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
