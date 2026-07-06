<script setup>
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 引入 ReIcon 组件的钩子函数，用于渲染图标
// 引入 Vue 的响应式和生命周期相关函数
import {
  computed,
  defineAsyncComponent,
  nextTick,
  reactive,
  ref,
} from "vue";
// 引入获取用户日志分页数据的 API 函数
import {
  fetchCleanupUserLog,
  fetchPageUserLog,
  useUserStoreHook,
} from "@repo/core";
// 引入国际化转换函数
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";
// 引入ScIp组件
import { ScIp } from "@repo/components/ScIp";
// 引入防抖函数
import { debounce } from "@pureadmin/utils";
// 将 Detail 组件标记为原始组件，避免响应式处理
import DetailLayout from "./detail.vue";
import SystemStatsCards from "../../components/SystemStatsCards.vue";
const ScFilter = defineAsyncComponent(
  () => import("@repo/components/ScFilter"),
);
const userStore = useUserStoreHook();
const i18nLabel = (key, fallback) => {
  const translated = transformI18n(key);
  return translated && translated !== key ? translated : fallback;
};

const normalizedCurrentRoles = computed(() =>
  (userStore.roles || []).map((role) => String(role || "").toUpperCase()),
);

const hasCurrentRole = (roleCode) => {
  return normalizedCurrentRoles.value.includes(
    String(roleCode || "").toUpperCase(),
  );
};

const isSuperAdminView = computed(() => {
  return hasCurrentRole("SUPER_ADMIN") || userStore.username === "sa";
});

const isAdminView = computed(() => {
  return isSuperAdminView.value || hasCurrentRole("ADMIN");
});

const isDeptLeaderView = computed(() => {
  return !isAdminView.value && hasCurrentRole("DEPT_LEADER");
});

const resolveRoleCodes = (row) => {
  return String(row?.sysLogRoleCodes || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
};

const resolveRoleRibbons = (row) => {
  const roleCodes = resolveRoleCodes(row);
  const items = [];

  if (row?.sysLogUsername === "sa" || roleCodes.includes("SUPER_ADMIN")) {
    items.push({ text: "SA", color: "#ef4444" });
  }
  if (roleCodes.includes("ADMIN")) {
    items.push({ text: "管理员", color: "#2563eb" });
  }
  if (roleCodes.includes("DEPT_LEADER")) {
    items.push({ text: "部门负责人", color: "#0f766e" });
  }
  if (roleCodes.includes("OPS")) {
    items.push({ text: "运维", color: "#7c3aed" });
  }
  if (roleCodes.includes("GUEST")) {
    items.push({ text: "游客", color: "#6b7280" });
  }

  return items;
};
// 定义详情页组件的引用
const detailRef = ref(null);
const createFilterForm = () => ({
  sysLogUsername: "",
  sysLogFrom: "",
  sysLogStatus: "",
  sysLogIp: "",
  sysLogTime: [],
});

// 定义搜索表单的数据对象
const form = reactive(createFilterForm());

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
  const normalizedValue = String(value || "").toUpperCase();
  const item = moduleOptions.find((option) => option.value === normalizedValue);
  return item?.label || i18nLabel("module.other", "其他");
};

const resolveLoginTypeLabel = (value) => {
  const normalizedValue = String(value || "").toUpperCase();
  const labels = {
    WEB: i18nLabel("WEB", "网页"),
    APP: i18nLabel("APP", "应用"),
    H5: i18nLabel("H5", "H5"),
    WAP: i18nLabel("WAP", "WAP"),
    PC: i18nLabel("PC", "电脑端"),
  };
  return labels[normalizedValue] || normalizedValue || "-";
};

const filterFields = [
  {
    prop: "sysLogUsername",
    label: "账号名称",
    type: "input",
    placeholder: "输入账号名称",
    width: 220,
  },
  {
    prop: "sysLogFrom",
    label: "日志模块",
    type: "select",
    placeholder: "全部模块",
    width: 220,
    options: [
      { label: i18nLabel("module.login", "登录"), value: "LOGIN" },
      { label: i18nLabel("module.loginFail", "登录失败"), value: "LOGIN_FAIL" },
      { label: i18nLabel("module.logout", "退出登录"), value: "LOGOUT" },
    ],
  },
  {
    prop: "sysLogStatus",
    label: "状态",
    type: "select",
    placeholder: "全部状态",
    width: 220,
    options: [
      { value: 1, label: "成功" },
      { value: 0, label: "失败" },
    ],
  },
  {
    prop: "sysLogIp",
    label: "IP 地址",
    type: "input",
    placeholder: "输入 IP 地址",
    width: 220,
  },
  {
    prop: "sysLogTime",
    label: "时间范围",
    type: "datetimerange",
    width: 340,
    startPlaceholder: i18nLabel("module.startDate", "开始时间"),
    endPlaceholder: i18nLabel("module.endDate", "结束时间"),
    props: {
      format: "YYYY-MM-DD HH:mm:ss",
      dateFormat: "YYYY-MM-DD ddd",
      timeFormat: "A hh:mm:ss",
    },
  },
];

// 定义加载状态的对象
const loading = reactive({
  query: false, // 查询加载状态
  menu: false, // 菜单加载状态
  cleanup: false,
});
// 定义表格的引用
const table = ref(null);

const buildLogQueryPayload = (payload = form) => {
  const nextValue = {
    ...createFilterForm(),
    ...(payload || {}),
  };
  const timeRange = Array.isArray(nextValue.sysLogTime)
    ? nextValue.sysLogTime
    : [];

  return {
    nextValue,
    params: {
      ...(nextValue.sysLogUsername?.trim()
        ? { sysLogUsername: nextValue.sysLogUsername.trim() }
        : {}),
      ...(nextValue.sysLogFrom ? { sysLogFrom: nextValue.sysLogFrom } : {}),
      ...(nextValue.sysLogStatus !== "" &&
      nextValue.sysLogStatus !== null &&
      nextValue.sysLogStatus !== undefined
        ? { sysLogStatus: nextValue.sysLogStatus }
        : {}),
      ...(nextValue.sysLogIp?.trim()
        ? { sysLogIp: nextValue.sysLogIp.trim() }
        : {}),
      ...(timeRange[0] ? { startDate: timeRange[0] } : {}),
      ...(timeRange[1] ? { endDate: timeRange[1] } : {}),
    },
  };
};

const syncFilterForm = (nextValue = {}) => {
  Object.assign(form, createFilterForm(), nextValue || {});
};

/**
 * 重置表单并重新搜索
 */
const resetForm = async () => {
  syncFilterForm();
  onSearch(form);
};

/**
 * 搜索用户日志，使用防抖处理
 */
const onSearch = debounce(
  async (payload = form) => {
    const { nextValue, params } = buildLogQueryPayload(payload);
    syncFilterForm(nextValue);
    loading.query = true;
    table.value?.reload(params);
  },
  180,
  true,
);

const canCleanupLogs = computed(() => {
  return isAdminView.value && Array.isArray(form.sysLogTime) && form.sysLogTime.some(Boolean);
});

const handleCleanupLogs = async () => {
  if (!canCleanupLogs.value) {
    message("请先选择需要清理的时间范围", { type: "warning" });
    return;
  }
  const { params } = buildLogQueryPayload(form);
  loading.cleanup = true;
  try {
    const res = await fetchCleanupUserLog(params);
    if (res?.code === "00000") {
      message(`已清理 ${res.data || 0} 条登录日志`, { type: "success" });
      onSearch(form);
      return;
    }
    message(res?.msg || "清理失败", { type: "error" });
  } catch (error) {
    message("清理失败", { type: "error" });
  } finally {
    loading.cleanup = false;
  }
};

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
  { label: i18nLabel("module.login", "登录"), value: "LOGIN" },
  { label: i18nLabel("module.loginFail", "登录失败"), value: "LOGIN_FAIL" },
  { label: i18nLabel("module.logout", "退出登录"), value: "LOGOUT" },
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
  loading.query = false;
  stats.total = total || 0;
  stats.success = data?.filter((item) => item.sysLogStatus === 1)?.length || 0;
  stats.failed = data?.filter((item) => item.sysLogStatus === 0)?.length || 0;
  const today = new Date().toISOString().split("T")[0];
  stats.todayCount =
    data?.filter((item) => item.createTime?.startsWith(today))?.length || 0;
};

const formatDateTime = (date) => {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const statsCards = computed(() => [
  {
    key: "total",
    label: "全部日志",
    value: stats.total,
    icon: "ri:file-list-3-line",
    theme: "primary",
    active:
      (form.sysLogStatus === "" ||
        form.sysLogStatus === null ||
        form.sysLogStatus === undefined) &&
      !form.sysLogFrom &&
      (!Array.isArray(form.sysLogTime) || form.sysLogTime.length === 0),
  },
  {
    key: "success",
    label: "登录成功",
    value: stats.success,
    icon: "ri:checkbox-circle-line",
    theme: "success",
    active: form.sysLogStatus === 1,
  },
  {
    key: "failed",
    label: "登录失败",
    value: stats.failed,
    icon: "ri:close-circle-line",
    theme: "danger",
    active: form.sysLogStatus === 0 || form.sysLogFrom === "LOGIN_FAIL",
  },
  {
    key: "today",
    label: "今日登录",
    value: stats.todayCount,
    icon: "ri:calendar-check-line",
    theme: "info",
    active: Array.isArray(form.sysLogTime) && form.sysLogTime.length === 2,
  },
]);

const handleStatsSelect = (item) => {
  if (!item?.key) {
    return;
  }

  if (item.key === "total") {
    resetForm();
    return;
  }

  if (item.key === "success") {
    onSearch({
      ...form,
      sysLogFrom: "",
      sysLogStatus: 1,
      sysLogTime: [],
    });
    return;
  }

  if (item.key === "failed") {
    onSearch({
      ...form,
      sysLogFrom: "LOGIN_FAIL",
      sysLogStatus: 0,
      sysLogTime: [],
    });
    return;
  }

  if (item.key === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    onSearch({
      ...form,
      sysLogFrom: "",
      sysLogStatus: "",
      sysLogTime: [formatDateTime(start), formatDateTime(end)],
    });
  }
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
      <div class="stats-section">
        <SystemStatsCards :items="statsCards" @select="handleStatsSelect" />
      </div>
      <!-- 头部搜索区域 -->
      <ScHeader class="toolbar-section log-header">
        <ScFilter
          class="log-filter"
          :model-value="form"
          :fields="filterFields"
          :loading="loading.query"
          @update:model-value="syncFilterForm"
          @search="onSearch"
          @reset="resetForm"
        >
          <template #actions>
            <ScButton
              type="primary"
              class="log-filter__action"
              :loading="loading.query"
              @click="onSearch(form)"
            >
              查询
            </ScButton>
            <ScButton class="log-filter__action" @click="resetForm">
              重置
            </ScButton>
            <ScPopconfirm
              v-if="isAdminView"
              title="将按当前筛选条件清理日志，至少需要选择时间范围。确认继续？"
              @confirm="handleCleanupLogs"
            >
              <template #reference>
                <span>
                  <ScButton
                    class="log-filter__action"
                    type="danger"
                    plain
                    :loading="loading.cleanup"
                    :disabled="!canCleanupLogs"
                  >
                    按时间清理
                  </ScButton>
                </span>
              </template>
            </ScPopconfirm>
          </template>
        </ScFilter>
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
              height="100%"
              @data-loaded="onDataLoaded"
            >
              <ScTableColumn
                type="index"
                label="序号"
                width="78"
                align="center"
              />
              <!-- 表格列保持不变 -->
              <ScTableColumn
                label="账号名称"
                prop="sysLogUsername"
                align="left"
                min-width="220px"
              >
                <template #default="{ row }">
                  <div class="log-account-cell">
                    <div class="log-account-item">
                      <IconifyIconOnline
                        icon="ri:user-line"
                        class="log-account-icon"
                      />
                      <span class="log-account-label">账号</span>
                      <span class="log-account-value">{{
                        row.sysLogUsername || "-"
                      }}</span>
                    </div>
                    <div class="log-account-item">
                      <IconifyIconOnline
                        icon="ri:building-line"
                        class="log-account-icon"
                      />
                      <span class="log-account-label">部门</span>
                      <span
                        class="log-account-value"
                        :class="{ 'no-value': !row.sysDeptName }"
                      >
                        {{ row.sysDeptName || "未标记部门" }}
                      </span>
                    </div>
                    <div
                      v-if="isAdminView && resolveRoleRibbons(row).length"
                      class="log-role-ribbons"
                    >
                      <ScTag
                        v-for="item in resolveRoleRibbons(row)"
                        :key="`${row.sysLogId}-${item.text}`"
                        :color="item.color"
                        size="small"
                      >
                        {{ item.text }}
                      </ScTag>
                    </div>
                  </div>
                </template>
              </ScTableColumn>
              <ScTableColumn
                v-if="isDeptLeaderView"
                label="部门"
                prop="sysDeptName"
                align="center"
                show-overflow-tooltip
                min-width="140px"
              >
                <template #default="{ row }">
                  {{ row.sysDeptName || "-" }}
                </template>
              </ScTableColumn>
              <ScTableColumn
                label="模块"
                prop="sysLogFrom"
                align="center"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <ScTag class="log-module-text">{{
                    transform(row.sysLogFrom)
                  }}</ScTag>
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
                label="请求地址"
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
                  <ScTag>
                    {{ resolveLoginTypeLabel(row.sysLogLoginType) }}</ScTag
                  >
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
                  <ScTimeText v-model="row.createTime" />
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
                    >成功</ScTag
                  >
                  <ScTag v-else-if="row.sysLogStatus === 0" type="danger"
                    >失败</ScTag
                  >
                </template>
              </ScTableColumn>
              <!-- 耗时列，根据耗时显示不同标签 -->
              <ScTableColumn label="耗时" prop="sysLogCost" align="center">
                <template #default="{ row }">
                  <ScTag v-if="row.sysLogCost <= 1000" type="success"
                    >{{ row.sysLogCost || 0 }} ms</ScTag
                  >
                  <ScTag
                    v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000"
                    type="warning"
                    >{{ row.sysLogCost || 0 }} ms</ScTag
                  >
                  <ScTag v-else type="danger"
                    >{{ row.sysLogCost || 0 }} ms</ScTag
                  >
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
.system-container.log-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.system-container.log-main :deep(.sc-container) {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.stats-section {
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

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

.log-role-ribbons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  justify-content: flex-start;
}

.log-role-ribbons :deep(.sc-ribbon-badge) {
  flex-shrink: 0;
}

.log-account-cell {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.log-account-item {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.log-account-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.log-account-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.log-account-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.log-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 1px 4px rgb(0 0 0 / 4%);
}

// 头部样式
.log-header {
  height: auto !important;
  padding: 12px 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid rgb(0 0 0 / 5%);
  box-shadow: 0 10px 24px -24px rgb(15 23 42 / 22%);
}

.log-filter {
  width: 100%;
}

.log-filter__action {
  min-width: 100px;
}

// 主内容区域样式
.log-main-content {
  padding: 0 !important;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.log-table {
  width: 100%; // 确保表格宽度为100%
  height: 100%;
  display: flex;
  flex: 1;
  min-height: 0;

  :deep(.el-table) {
    width: 100%; // 确保表格宽度为100%
    height: 100%;
    overflow: hidden;
    table-layout: fixed; // 使用固定表格布局
    border-radius: 8px;
    box-shadow: 0 1px 3px rgb(0 0 0 / 5%);

    th {
      font-weight: 600;
      transition: background-color 0.3s ease;
    }

    tr:hover {
      background-color: rgba(var(--el-color-primary-rgb), 0.05) !important;
    }

    td {
      padding: 12px 0;
      word-break: break-word; // 允许单词内换行
    }
  }

  :deep(.sc-table-container),
  :deep(.sc-table-wrapper),
  :deep(.sc-table-content-wrapper),
  :deep(.el-table__inner-wrapper),
  :deep(.el-table__body-wrapper) {
    height: 100%;
    min-height: 0;
  }
}

.log-module-text {
  font-weight: 500;
  transition: color 0.2s ease;

  &:hover {
    color: var(--el-color-primary);
  }
}

:deep(.el-tag) {
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

// 添加以下样式以防止内容溢出
.log-content {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.log-table-container-full {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

.log-table-container-narrow {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 60vw;
  height: 100%;
  overflow: hidden;
  transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1);
}

// 确保主容器不出现滚动条
.log-main {
  overflow-x: hidden; // 隐藏横向滚动条
  background-color: var(--el-bg-color);
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
}
</style>
