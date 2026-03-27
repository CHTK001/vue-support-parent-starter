<script setup>
import { useRenderIcon, IconifyIconOnline } from "@repo/components/ReIcon";

// 引入 ReIcon 组件的钩子函数，用于渲染图标
// 引入 Vue 的响应式和生命周期相关函数
import {
  computed,
  defineAsyncComponent,
  nextTick,
  reactive,
  ref,
  watch,
} from "vue";
// 引入获取用户日志分页数据的 API 函数
import { fetchPageUserLog } from "@repo/core";
// 引入国际化转换函数
import { transformI18n } from "@repo/config";
// 引入计算时间差的工具函数
import { getTimeAgo } from "@repo/utils";
// 引入ScIp组件
import { ScIp } from "@repo/components/ScIp";
// 引入刷新图标
import Refresh from "@iconify-icons/line-md/backup-restore";
// 引入防抖函数
import { debounce } from "@pureadmin/utils";
// 引入 Vue i18n 的 useI18n 函数，用于国际化
import { useI18n } from "vue-i18n";
// 将 Detail 组件标记为原始组件，避免响应式处理
const DetailLayout = defineAsyncComponent(() => import("./detail.vue"));
// 获取国际化实例
const { t } = useI18n();
// 定义详情页组件的引用
const detailRef = ref(null);
// 定义搜索表单的数据对象
const form = reactive({
  sysLogUsername: "", // 账号名称
  sysLogFrom: "", // 模块名称
  sysLogStatus: null, // 日志状态
  sysLogIp: null, // 请求 IP
  startDate: null, // 开始时间
  endDate: null, // 结束时间
});

// 计算图标样式类
const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]",
  ];
});

// 定义模态框显示状态的对象
const visible = reactive({
  save: false, // 保存模态框显示状态
  role: false, // 角色模态框显示状态
  detail: false, // 详情模态框显示状态
});

/**
 * 转换模块值为对应的标签
 * @param {string} value - 模块值
 * @returns {string} - 转换后的标签
 */
const transform = (value) => {
  value = String(value || "").toUpperCase();
  const _value = moduleOptions.filter((item) => {
    if (item.value === value) {
      return item.label;
    }
  });
  return _value.length > 0 ? _value[0].label : transformI18n("module.other");
};

// 定义加载状态的对象
const loading = reactive({
  query: false, // 查询加载状态
  menu: false, // 菜单加载状态
});

// 定义日期选择器绑定的时间范围
const sysLogTime = ref([]);
// 监听日期选择器的时间范围变化，更新表单中的开始和结束时间
watch(
  sysLogTime,
  (newValue) => {
    form.startDate = newValue?.[0];
    form.endDate = newValue?.[1];
  },
  { deep: true, immediate: true },
);

// 定义表单的引用
const formRef = ref();
// 定义表格的引用
const table = ref(null);

/**
 * 重置表单并重新搜索
 * @param {Object} formRef - 表单引用
 */
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

/**
 * 搜索用户日志，使用防抖处理
 */
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  1000,
  true,
);

/**
 * 打开详情页
 * @param {Object} row - 当前行数据
 */
const openDetail = async (row) => {
  visible.detail = true;
  await nextTick();
  detailRef.value.setData(row).open("view");
};

// 定义内容区域的引用
const contentRef = ref();
// 定义模块选项列表
const moduleOptions = reactive([
  { label: transformI18n("module.login"), value: "LOGIN" },
  { label: transformI18n("module.logout"), value: "LOGOUT" },
]);

// 统计数据
const stats = reactive({
  total: 0,
  success: 0,
  failed: 0,
  todayCount: 0,
});

// 数据加载完成回调
const onDataLoaded = (data, total) => {
  stats.total = total || 0;
  stats.success = data?.filter((item) => item.sysLogStatus === 1)?.length || 0;
  stats.failed = data?.filter((item) => item.sysLogStatus === 0)?.length || 0;
  const today = new Date().toISOString().split("T")[0];
  stats.todayCount =
    data?.filter((item) => item.createTime?.startsWith(today))?.length || 0;
};
</script>

<template>
  <div class="system-container log-main">
    <!-- 详情页组件，根据 visible.detail 控制显示 -->
    <DetailLayout
      v-if="visible.detail"
      ref="detailRef"
      :moduleOptions="moduleOptions"
    />
    <ScContainer class="log-container">
      <!-- 统计面板 -->
      <div class="log-stats">
        <div class="stat-item">
          <div class="stat-icon total">
            <IconifyIconOnline icon="ri:file-list-3-line" :size="28" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">全部日志</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon success">
            <IconifyIconOnline icon="ri:checkbox-circle-line" :size="28" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.success }}</span>
            <span class="stat-label">登录成功</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon failed">
            <IconifyIconOnline icon="ri:close-circle-line" :size="28" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.failed }}</span>
            <span class="stat-label">登录失败</span>
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-icon today">
            <IconifyIconOnline icon="ri:calendar-check-line" :size="28" />
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.todayCount }}</span>
            <span class="stat-label">今日登录</span>
          </div>
        </div>
      </div>
      <!-- 头部搜索区域 -->
      <ScHeader class="toolbar-section log-header">
        <div class="toolbar-left log-left-panel">
          <!-- 搜索表单 -->
          <ScForm
            ref="formRef"
            label-width="40px"
            :inline="true"
            :model="form"
            class="modern-form log-search-form"
          >
            <!-- 账号输入框 -->
            <ScFormItem
              label="账号"
              prop="sysLogUsername"
              class="log-form-item"
            >
              <ScInput
                v-model="form.sysLogUsername"
                placeholder="请输入账号名称"
                clearable
                class="log-input"
              />
            </ScFormItem>
            <!-- 模块选择框 -->
            <ScFormItem label="模块" prop="sysLogFrom" class="log-form-item">
              <ScSelect
                v-model="form.sysLogFrom"
                placeholder="请选择模块"
                clearable
                class="log-select"
              >
                <ScOption
                  v-for="item in moduleOptions"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                >
                  {{ item.label }}
                </ScOption>
              </ScSelect>
            </ScFormItem>
            <!-- 状态选择框 -->
            <ScFormItem
              label="状态"
              prop="sysLogStatus"
              class="log-form-item"
            >
              <ScSelect
                v-model="form.sysLogStatus"
                class="log-select"
                clearable
              >
                <ScOption :value="1" label="成功">成功</ScOption>
                <ScOption :value="0" label="失败">失败</ScOption>
              </ScSelect>
            </ScFormItem>
            <!-- IP 输入框 -->
            <ScFormItem label=" IP" prop="sysLogIp" class="log-form-item">
              <ScInput
                v-model="form.sysLogIp"
                placeholder="请输入IP"
                clearable
                class="log-input"
              />
            </ScFormItem>
            <!-- 日期时间范围选择器 -->
            <ScFormItem label="时间" prop="sysLogTime" class="log-form-item">
              <ScDatePicker
                v-model="sysLogTime"
                type="datetimerange"
                :start-placeholder="transformI18n('module.startDate')"
                :end-placeholder="transformI18n('module.endDate')"
                format="YYYY-MM-DD HH:mm:ss"
                date-format="YYYY-MM-DD ddd"
                time-format="A hh:mm:ss"
                class="log-date-picker"
              />
            </ScFormItem>
          </ScForm>
        </div>
        <div class="toolbar-right log-right-panel">
          <div class="log-right-panel-search">
            <div class="log-flex-1">
              <div>
                <div class="log-button-group">
                  <div class="log-flex-1" />
                  <div class="log-button-container">
                    <!-- 搜索按钮 -->
                    <ScButton
                      type="primary"
                      :icon="useRenderIcon('ri:search-line')"
                      :loading="loading.query"
                      class="log-button log-search-button"
                      @click="onSearch"
                    />
                    <!-- 重置按钮 -->
                    <ScButton
                      :icon="useRenderIcon(Refresh)"
                      class="log-button log-reset-button"
                      @click="resetForm(formRef)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScHeader>
      <!-- 主体表格区域 -->
      <ScMain class="log-main-content">
        <div ref="contentRef" class="log-content">
          <div
            :class="[
              visible.role
                ? 'log-table-container-narrow'
                : 'log-table-container-full',
            ]"
          >
            <!-- 表格组件 -->
            <ScTable
              ref="table"
              :url="fetchPageUserLog"
              :rowClick="openDetail"
              class="modern-table log-table"
              height="auto"
              @data-loaded="onDataLoaded"
            >
              <!-- 表格列保持不变 -->
              <ScTableColumn
                label="账号名称"
                prop="sysLogUsername"
                align="center"
                show-overflow-tooltip
                min-width="120px"
              />
              <ScTableColumn
                label="模块"
                prop="sysLogFrom"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <span class="log-module-text">{{
                    transform(row.sysLogFrom)
                  }}</span>
                </template>
              </ScTableColumn>
              <!-- 请求 IP 列，使用ScIp组件显示 -->
              <ScTableColumn
                label="请求IP"
                prop="sysLogIp"
                align="left"
                show-overflow-tooltip
                min-width="200px"
              >
                <template #default="{ row }">
                  <ScIp
                    :ip="row.sysLogIp"
                    :physical-address="row.sysLogAddress"
                    size="small"
                    :show-icon="false"
                    :copyable="true"
                    :open-search-original="true"
                  />
                  <div v-if="row.sysLogIsp" class="text-gray-400 text-xs mt-1">
                    {{ row.sysLogIsp }}
                  </div>
                </template>
              </ScTableColumn>
              <!-- 地址列 -->
              <ScTableColumn
                label="地址"
                prop="sysLogUrl"
                align="center"
                show-overflow-tooltip
                width="180px"
              />
              <!-- 浏览器指纹列 -->
              <ScTableColumn
                label="浏览器指纹"
                prop="sysLogFingerprint"
                align="center"
                show-overflow-tooltip
              />
              <!-- 登录方式列，使用国际化转换显示值 -->
              <ScTableColumn
                label="登录方式"
                prop="sysLogLoginType"
                align="center"
                width="140px"
              >
                <template #default="{ row }">
                  {{ transformI18n(row.sysLogLoginType) }}
                </template>
              </ScTableColumn>
              <!-- userAgent 列 -->
              <ScTableColumn
                label="userAgent"
                prop="sysLogUa"
                align="center"
                show-overflow-tooltip
                min-width="120px"
              />
              <!-- 请求时间列，显示时间差和具体时间 -->
              <ScTableColumn
                label="请求时间"
                prop="createTime"
                align="left"
                show-overflow-tooltip
                min-width="120px"
              >
                <template #default="{ row }">
                  <div>
                    <span>{{ getTimeAgo(row.createTime) }}</span>
                    <br />
                    <span class="text-gray-400">{{ row.createTime }}</span>
                  </div>
                </template>
              </ScTableColumn>
              <!-- 状态列，根据状态显示不同标签 -->
              <ScTableColumn
                label="状态"
                prop="sysLogStatus"
                align="center"
                width="100px"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <ScTag v-if="row.sysLogStatus === 1" type="success"
                    >成功</ScTag>
                  <ScTag v-else-if="row.sysLogStatus === 0" type="danger"
                    >失败</ScTag>
                </template>
              </ScTableColumn>
              <!-- 耗时列，根据耗时显示不同标签 -->
              <ScTableColumn label="耗时" prop="sysLogCost" align="center">
                <template #default="{ row }">
                  <ScTag v-if="row.sysLogCost <= 1000" type="success"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                  <ScTag
                    v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000"
                    type="warning"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                  <ScTag v-else type="danger"
                    >{{ row.sysLogCost || 0 }} ms</ScTag>
                </template>
              </ScTableColumn>
            </ScTable>
          </div>
        </div>
      </ScMain>
    </ScContainer>
  </div>
</template>

<style scoped lang="scss">
@keyframes log-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes log-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

// 响应式适配
@media (width <= 1200px) {
  .log-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width <= 768px) {
  .log-stats {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;

    .stat-item {
      padding: 12px;

      .stat-icon {
        width: 40px;
        height: 40px;
      }

      .stat-info .stat-value {
        font-size: 18px;
      }
    }
  }
}

// 统计面板样式
.log-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 14px 18px;
    background: var(--el-fill-color-lighter);
    border-radius: 10px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 6px 20px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: #fff;
      border-radius: 10px;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.success {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.failed {
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
      }

      &.today {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 22px;
        font-weight: 700;
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 2px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 主容器样式
.log-main {
  height: 100%;
  background-color: var(--el-bg-color);
  animation: log-fade-in 0.5s ease-out;
}

.log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgb(0 0 0 / 5%);
}

// 头部样式
.log-header {
  height: auto !important;
  max-height: 160px;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid rgb(0 0 0 / 5%);
  box-shadow: 0 2px 8px rgb(0 0 0 / 3%);
  transition: all 0.3s ease;
}

.log-left-panel {
  width: 100%;
}

.log-search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  padding: 16px;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  animation: log-scale-in 0.4s ease-out;
}

.log-form-item {
  margin-bottom: 12px !important;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

.log-input,
.log-select,
.log-date-picker {
  width: 180px !important;
  transition: all 0.3s ease;

  &:focus,
  &:hover {
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.log-right-panel {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.log-right-panel-search {
  display: flex;
  justify-content: flex-end;
}

.log-flex-1 {
  flex: 1;
}

.log-button-group {
  display: flex;
  flex-flow: row wrap;
}

.log-button-container {
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
}

.log-button {
  margin: 0 5px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.log-search-button {
  background-color: var(--el-color-primary);

  &:hover {
    background-color: var(--el-color-primary-light-3);
  }
}

.log-reset-button {
  &:hover {
    background-color: rgba(var(--el-color-primary-rgb), 0.1);
  }
}

// 主内容区域样式
.log-main-content {
  height: calc(100% - 160px);
  padding: 0 !important;
  overflow: hidden;
}

.log-table {
  width: 100%; // 确保表格宽度为100%
  height: 100%;

  :deep(.el-table) {
    width: 100%; // 确保表格宽度为100%
    overflow: hidden;
    table-layout: fixed; // 使用固定表格布局
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 5%);

    th {
      font-weight: 600;
      transition: background-color 0.3s ease;
    }

    tr {
      transition: all 0.3s ease;

      &:hover {
        background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
      }
    }

    td {
      padding: 12px 0;
      word-break: break-word; // 允许单词内换行
      transition: all 0.3s ease;
    }
  }

  :deep(.el-table__row) {
    animation: log-fade-in 0.3s ease-out forwards;
    animation-delay: calc(
      var(--el-transition-duration) * 0.05 * var(--row-index, 0)
    );
  }
}

.log-module-text {
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    color: var(--el-color-primary);
  }
}

:deep(.el-tag) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

// 添加以下样式以防止内容溢出
.log-content {
  display: flex;
  width: 100%;
  height: 100%;
  overflow-x: hidden; // 隐藏横向滚动条
}

.log-table-container-full {
  width: 100%;
  height: 100%;
  overflow-x: hidden; // 隐藏横向滚动条
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.log-table-container-narrow {
  width: 60vw;
  height: 100%;
  overflow-x: hidden; // 隐藏横向滚动条
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

// 确保主容器不出现滚动条
.log-main {
  height: 100%;
  overflow-x: hidden; // 隐藏横向滚动条
  background-color: var(--el-bg-color);
  animation: log-fade-in 0.5s ease-out;
}

// 暗色主题适配
:root[data-theme="dark"] {
  .log-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .log-header {
    background-color: var(--el-bg-color-overlay);
  }

  .log-search-form {
    background-color: var(--el-bg-color-overlay);
  }
} // 动画定义
</style>
