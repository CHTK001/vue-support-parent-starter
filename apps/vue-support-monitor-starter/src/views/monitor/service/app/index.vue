<template>
  <div class="app-container">
    <el-container>
      <!-- 顶部操作区 - 现代化设计 -->
      <el-header class="action-bar">
        <div class="left-section">
          <h2 class="page-title">
            <IconifyIconOnline icon="ep:monitor" class="title-icon" />
            应用监控
          </h2>
          <el-tag type="info" effect="plain" class="app-count">
            共 <span class="count-num">{{ totalCount }}</span> 个应用
          </el-tag>
        </div>

        <div class="right-section">
          <!-- 搜索框 -->
          <el-input v-model="params.keyword" placeholder="搜索应用名称" class="search-input" clearable @input="handleSearch">
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>

          <!-- 添加按钮 -->
          <el-button type="primary" class="add-btn" @click="doEdit({}, 'add')">
            <IconifyIconOnline icon="ri:add-fill" />
            <span class="ml-1">新增应用</span>
          </el-button>
        </div>
      </el-header>

      <!-- 卡片列表区域 -->
      <el-main class="!p-0 card-container">
        <!-- 空状态展示 -->
        <el-empty v-if="isEmpty" description="暂无应用数据" :image-size="200" class="empty-state">
          <el-button type="primary" @click="doEdit({}, 'add')">
            <IconifyIconOnline icon="ri:add-fill" />
            <span class="ml-1">添加应用</span>
          </el-button>
        </el-empty>

        <!-- 卡片列表 -->
        <transition-group name="card-fade" tag="div" class="card-list">
          <ScTable layout="card" v-if="!isEmpty" ref="dataRef" :url="fetchAppPageList" :params="params" :span="4"
            :lg="6" v-loading="loading" :data-loaded="handleDataLoaded">
            <template #default="{ row }">
              <el-card class="app-card" shadow="hover" :body-style="{ padding: '0' }">
                <!-- 卡片状态指示条 -->
                <div class="status-indicator" :class="getStatusType(row.status)"></div>

                <div class="card-header">
                  <span class="app-name">{{ row.monitorApplicationName }}</span>
                  <el-tag :type="getStatusType(row.status)" size="small" effect="light" class="status-tag">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </div>

                <el-row class="card-content">
                  <el-col :span="12">
                    <ul class="info-list">
                      <li class="info-item">
                        <h4 class="info-title">
                          <IconifyIconOnline icon="ep:info-filled" class="info-icon" />
                          应用说明
                        </h4>
                        <p class="info-value">
                          {{ row.monitorName || '暂无说明' }}
                        </p>
                      </li>
                      <li class="info-item" v-if="row.createTime">
                        <h4 class="info-title">
                          <IconifyIconOnline icon="ep:calendar" class="info-icon" />
                          创建时间
                        </h4>
                        <p class="info-value text-sm">
                          {{ formatDate(row.createTime) }}
                        </p>
                      </li>
                    </ul>
                  </el-col>

                  <!-- 进度指示区域 - 添加动画和交互效果 -->
                  <el-col :span="12" class="progress-area" @click="doOpenApps(row)">
                    <el-progress type="dashboard" :stroke-width="10" title="在线服务"
                      :percentage="row?.monitorRequests ? row.monitorRequests?.length : 0" :show-text="true"
                      :color="progressColor" class="progress-circle">
                      <template #default="{ percentage }">
                        <span class="percentage-value">
                          <b class="text-lg">{{ percentage }}</b>
                        </span>
                        <span class="percentage-label">在线服务</span>
                      </template>
                    </el-progress>
                  </el-col>
                </el-row>

                <!-- 卡片底部操作区 - 改进布局和交互 -->
                <div class="card-footer">
                  <div class="action-buttons">
                    <el-tooltip content="编辑" placement="top" :effect="isDark ? 'dark' : 'light'">
                      <el-button circle size="small" @click.stop="doEdit(row, 'edit')" class="action-btn edit-btn">
                        <IconifyIconOnline icon="ep:edit" />
                      </el-button>
                    </el-tooltip>

                    <el-popconfirm :title="$t('message.confimDelete')" @confirm="doDelete(row)"
                      confirm-button-type="danger" cancel-button-type="info" width="220">
                      <template #reference>
                        <el-tooltip content="删除" placement="top" :effect="isDark ? 'dark' : 'light'">
                          <el-button circle size="small" type="danger" class="action-btn delete-btn">
                            <IconifyIconOnline icon="ep:delete" />
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-popconfirm>
                  </div>

                  <!-- 添加更新时间 -->
                  <div class="update-time" v-if="row.updateTime">
                    <IconifyIconOnline icon="ep:time" class="time-icon" />
                    {{ formatDate(row.updateTime, 'MM-dd HH:mm') }}
                  </div>
                </div>
              </el-card>
            </template>
          </ScTable>
        </transition-group>
      </el-main>
    </el-container>

    <!-- 弹窗组件 -->
    <InfoDialog ref="infoDialogRef" />
    <SaveDialog ref="saveDialogRef" @success="handleSuccess" />
  </div>
</template>

<script setup>
import { fetchAppPageList, fetchAppDelete } from "@/api/monitor/app";
import ScTable from "@repo/components/ScTable/index.vue"; // 修正导入组件
import { reactive, ref, nextTick, onMounted, defineAsyncComponent, computed, shallowRef } from "vue";
import { useDark } from "@vueuse/core";
import { message } from "@repo/utils";

// 异步加载弹窗组件以提高性能
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const InfoDialog = defineAsyncComponent(() => import("./info.vue"));

// 响应式状态管理
const params = reactive({
  page: 1,
  pageSize: 10,
  keyword: '' // 添加搜索关键词
});

// 引用和状态
const dataRef = shallowRef();
const loading = ref(false);
const infoDialogStatus = ref(false);
const infoDialogStatusSync = ref(false);
const infoDialogRef = shallowRef();
const saveDialogStatus = ref(false);
const saveDialogRef = shallowRef();
const isEmpty = ref(false); // 空状态标记
const totalCount = ref(0); // 应用总数

// 检测暗黑模式
const isDark = useDark();

// 进度条颜色计算 - 使用渐变色增强视觉效果
const progressColor = computed(() => {
  return [
    { color: '#f56c6c', percentage: 20 },
    { color: '#e6a23c', percentage: 40 },
    { color: '#5cb87a', percentage: 60 },
    { color: '#1989fa', percentage: 80 },
    { color: '#6f7ad3', percentage: 100 }
  ];
});

/**
 * 格式化日期
 * @param {String|Number} date - 日期字符串或时间戳
 * @param {String} format - 格式化模式，默认为 'yyyy-MM-dd HH:mm'
 * @returns {String} 格式化后的日期字符串
 */
const formatDate = (date, format = 'yyyy-MM-dd HH:mm') => {
  if (!date) return '暂无数据';
  try {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return format
      .replace('yyyy', year)
      .replace('MM', month)
      .replace('dd', day)
      .replace('HH', hours)
      .replace('mm', minutes);
  } catch (e) {
    console.error('日期格式化错误:', e);
    return date;
  }
};

/**
 * 获取状态类型
 * @param {Number} status - 状态码
 * @returns {String} Element Plus 标签类型
 */
const getStatusType = (status) => {
  const statusMap = {
    1: 'success',
    0: 'info',
    2: 'warning',
    3: 'danger'
  };
  return statusMap[status] || 'info';
};

/**
 * 获取状态文本
 * @param {Number} status - 状态码
 * @returns {String} 状态描述文本
 */
const getStatusText = (status) => {
  const statusMap = {
    1: '运行中',
    0: '未运行',
    2: '警告',
    3: '异常'
  };
  return statusMap[status] || '未知状态';
};

/**
 * 处理搜索
 * 防抖处理，避免频繁请求
 */
const handleSearch = (() => {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (dataRef.value) {
        dataRef.value.refresh();
      }
    }, 300);
  };
})();

/**
 * 处理数据加载完成
 * @param {Object} data - 加载的数据
 * @param {Number} total - 数据总数
 */
const handleDataLoaded = (data, total) => {
  totalCount.value = total || 0;
};

/**
 * 打开应用详情
 * @param {Object} item - 应用数据
 */
const doOpenApps = async (item) => {
  infoDialogStatus.value = true;
  nextTick(async () => {
    infoDialogRef.value.setData(item);
    infoDialogRef.value.open("view");
  });
};

/**
 * 编辑或新增应用
 * @param {Object} item - 应用数据
 * @param {String} mode - 操作模式：add/edit
 */
const doEdit = async (item, mode) => {
  saveDialogStatus.value = true;
  await nextTick();
  saveDialogRef.value.setData(item);
  saveDialogRef.value.open(mode);
};

/**
 * 删除应用
 * @param {Object} item - 要删除的应用数据
 */
const doDelete = async (item) => {
  loading.value = true;
  try {
    const res = await fetchAppDelete({ id: item.monitorId });
    if (res.code === "00000") {
      message.success("删除成功");
      dataRef.value.refresh();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    message.error("操作异常，请稍后重试");
    console.error("删除应用出错:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理保存成功后的回调
 */
const handleSuccess = () => {
  dataRef.value.refresh();
};

// 生命周期钩子
onMounted(() => {
  infoDialogStatusSync.value = true;
});
</script>

<style lang="scss" scoped>
.app-container {
  padding: 20px;
  height: 100%;
  background-color: var(--el-bg-color);
}

/* 顶部操作区样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20px 0;
  height: auto !important;
  border-bottom: 1px solid var(--el-border-color-lighter);
  margin-bottom: 24px;

  .left-section {
    display: flex;
    align-items: center;

    .page-title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-right: 16px;
      display: flex;
      align-items: center;

      .title-icon {
        margin-right: 8px;
        color: var(--el-color-primary);
        font-size: 24px;
      }
    }

    .app-count {
      font-size: 14px;
      padding: 6px 12px;
      border-radius: 20px;
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .count-num {
        font-weight: bold;
        color: var(--el-color-primary);
      }
    }
  }

  .right-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .search-input {
      width: 240px;
      transition: all 0.3s;
      border-radius: 20px;
      overflow: hidden;

      &:focus-within {
        width: 280px;
        box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
      }
    }

    .add-btn {
      display: flex;
      align-items: center;
      transition: all 0.3s;
      border-radius: 20px;
      padding: 8px 16px;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
      }
    }
  }
}

/* 卡片容器样式 */
.card-container {
  position: relative;

  .empty-state {
    margin-top: 60px;
  }

  .card-list {
    height: 100%;
    width: 100%;
  }
}

/* 卡片样式 */
.app-card {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  position: relative;

  /* 状态指示条 */
  .status-indicator {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    transition: all 0.3s;

    &.success {
      background-color: var(--el-color-success);
    }

    &.warning {
      background-color: var(--el-color-warning);
    }

    &.danger {
      background-color: var(--el-color-danger);
    }

    &.info {
      background-color: var(--el-color-info);
    }
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.15);

    .card-header {
      background-color: var(--el-color-primary-light-9);
    }

    .status-indicator {
      height: 6px;
    }
  }

  .card-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-light);
    transition: all 0.3s;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .app-name {
      font-weight: 600;
      font-size: 16px;
      color: var(--el-text-color-primary);
    }

    .status-tag {
      transition: all 0.3s;
      border-radius: 12px;
      padding: 0 10px;

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

/* 卡片内容样式 */
.card-content {
  padding: 20px;
  transition: all 0.3s;

  .info-list {
    list-style: none;
    padding: 0;
    margin: 0;

    .info-item {
      margin-bottom: 16px;
      transition: all 0.3s;

      &:hover {
        transform: translateX(4px);
      }

      .info-title {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
        display: flex;
        align-items: center;

        .info-icon {
          margin-right: 8px;
          color: var(--el-color-primary);
        }
      }

      .info-value {
        margin: 0;
        color: var(--el-text-color-primary);
        word-break: break-word;
        padding: 4px 0;
      }
    }
  }

  .progress-area {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    border-radius: 12px;
    padding: 16px;
    height: 100%;

    &:hover {
      background-color: var(--el-fill-color-light);

      .view-details {
        opacity: 1;
        transform: translateY(0);
      }

      .progress-circle {
        transform: scale(1.08);
      }
    }

    .progress-circle {
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .percentage-value {
      display: block;
      margin-bottom: 4px;
    }

    .percentage-label {
      display: block;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .view-details {
      margin-top: 16px;
      font-size: 14px;
      color: var(--el-color-primary);
      display: flex;
      align-items: center;
      opacity: 0.7;
      transform: translateY(8px);
      transition: all 0.3s;
      padding: 6px 12px;
      border-radius: 16px;
      background-color: var(--el-color-primary-light-9);

      &:hover {
        background-color: var(--el-color-primary-light-8);
        color: var(--el-color-primary-dark-2);
      }

      .view-icon {
        margin-right: 6px;
      }
    }
  }
}

/* 卡片底部样式 */
.card-footer {
  border-top: 1px solid var(--el-border-color-lighter);
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-fill-color-light);

  .action-buttons {
    display: flex;
    gap: 10px;

    .action-btn {
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);

      &:hover {
        transform: scale(1.15);
      }

      &.edit-btn:hover {
        background-color: var(--el-color-primary);
        color: white;
      }

      &.delete-btn:hover {
        background-color: var(--el-color-danger);
        color: white;
      }
    }
  }

  .update-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    display: flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 12px;
    background-color: var(--el-fill-color);
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-fill-color-darker);
      transform: translateY(-2px);
    }

    .time-icon {
      margin-right: 6px;
      font-size: 14px;
    }
  }
}

/* 卡片过渡动画 */
.card-fade-enter-active {
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transition-delay: calc(var(--el-transition-duration) * 0.1 * v-bind('index'));
}

.card-fade-leave-active {
  transition: all 0.3s ease;
}

.card-fade-enter-from,
.card-fade-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.9);
}

/* 响应式样式 */
@media (max-width: 992px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;

    .left-section {
      margin-bottom: 16px;
    }

    .right-section {
      width: 100%;

      .search-input {
        flex: 1;
      }
    }
  }

  .card-content {
    .el-col {
      width: 100% !important;
    }

    .progress-area {
      margin-top: 16px;
      padding-top: 0;
    }
  }
}

@media (max-width: 768px) {
  .right-section {
    flex-direction: column;
    align-items: stretch;

    .search-input {
      width: 100% !important;
      margin-bottom: 12px;
    }

    .add-btn {
      width: 100%;
    }
  }
}

/* 暗黑模式适配 */
:root[data-theme='dark'] {
  .app-card {
    .status-indicator {
      opacity: 0.8;
    }

    .card-header {
      background-color: var(--el-bg-color-overlay);
    }

    .card-footer {
      background-color: var(--el-bg-color-overlay);
    }

    .progress-area {
      &:hover {
        background-color: var(--el-fill-color-darker);
      }

      .view-details {
        background-color: var(--el-fill-color-darker);
      }
    }
  }
}
</style>
