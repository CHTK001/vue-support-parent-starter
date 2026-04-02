<template>
  <div class="system-container online-container">
    <div class="online-wrapper">
      <ScContainer>
        <!-- 页面头部 -->
        <ScHeader class="toolbar-section online-header">
          <div class="toolbar-left header-left">
            <div class="header-title">
              <IconifyIconOnline icon="mdi:account-multiple-check" />
              <span>在线用户管理</span>
            </div>
            <div class="header-stats">
              <ScTag
                type="success"
                effect="light"
                size="large"
                class="stats-tag"
              >
                <IconifyIconOnline
                  icon="mdi:account-check"
                  class="stats-icon"
                />
                <span>当前在线: {{ onlineCount }} 人</span>
              </ScTag>
            </div>
          </div>
          <div class="toolbar-right header-actions">
            <!-- 搜索表单 -->
            <ScForm
              :inline="true"
              :model="searchForm"
              class="modern-form search-form"
            >
              <ScFormItem>
                <ScInput
                  v-model="searchForm.username"
                  placeholder="用户名"
                  clearable
                  class="search-input"
                  :prefix-icon="SearchIcon"
                />
              </ScFormItem>
              <ScFormItem>
                <ScInput
                  v-model="searchForm.ip"
                  placeholder="IP地址"
                  clearable
                  class="search-input"
                  :prefix-icon="LocationIcon"
                />
              </ScFormItem>
            </ScForm>
            <!-- 操作按钮 -->
            <ScButton type="primary" class="action-btn" @click="handleSearch">
              <IconifyIconOnline icon="mdi:magnify" />
              <span>搜索</span>
            </ScButton>
            <ScButton class="action-btn" @click="handleRefresh">
              <IconifyIconOnline icon="mdi:refresh" />
              <span>刷新</span>
            </ScButton>
            <ScButton
              type="danger"
              class="action-btn"
              :disabled="selectedUsers.length === 0"
              @click="handleBatchKick"
            >
              <IconifyIconOnline icon="mdi:account-remove" />
              <span>批量踢出 ({{ selectedUsers.length }})</span>
            </ScButton>
          </div>
        </ScHeader>

        <!-- 表格主体 -->
        <ScMain class="online-main">
          <div class="table-container">
            <!-- 加载骨架屏 -->
            <ScSkeleton v-if="loading" animated :rows="8" />

            <!-- 数据表格 -->
            <ScTable
              v-else
              :data="tableData"
              row-key="userId"
              class="modern-table online-table"
              @selection-change="handleSelectionChange"
            >
              <!-- 多选列 -->
              <ScTableColumn type="selection" width="55" align="center" />

              <!-- 序号列 -->
              <ScTableColumn
                type="index"
                label="序号"
                width="80"
                align="center"
              >
                <template #default="{ $index }">
                  <ScTag
                    type="primary"
                    effect="light"
                    size="small"
                    class="index-tag"
                  >
                    {{ $index + 1 }}
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 用户信息列 -->
              <ScTableColumn label="用户信息" min-width="200">
                <template #default="{ row }">
                  <div class="user-info-cell">
                    <div class="user-avatar">
                      <IconifyIconOnline icon="mdi:account-circle" />
                    </div>
                    <div class="user-details">
                      <span class="user-nickname">{{
                        row.nickname || row.username
                      }}</span>
                      <span class="user-username">@{{ row.username }}</span>
                    </div>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 登录IP列 -->
              <ScTableColumn label="登录IP" min-width="150">
                <template #default="{ row }">
                  <div class="ip-cell">
                    <IconifyIconOnline icon="mdi:ip-network" class="ip-icon" />
                    <span>{{ row.loginIp || "-" }}</span>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 登录地址列 -->
              <ScTableColumn
                label="登录地址"
                min-width="150"
                show-overflow-tooltip
              >
                <template #default="{ row }">
                  <div class="address-cell">
                    <IconifyIconOnline
                      icon="mdi:map-marker"
                      class="address-icon"
                    />
                    <span>{{ row.loginAddress || "未知" }}</span>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 浏览器列 -->
              <ScTableColumn label="浏览器" min-width="120">
                <template #default="{ row }">
                  <ScTag effect="light" size="small" class="browser-tag">
                    <IconifyIconOnline
                      :icon="getBrowserIcon(row.browser)"
                      class="browser-icon"
                    />
                    <span>{{ row.browser || "未知" }}</span>
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 操作系统列 -->
              <ScTableColumn label="操作系统" min-width="120">
                <template #default="{ row }">
                  <ScTag
                    type="info"
                    effect="light"
                    size="small"
                    class="os-tag"
                  >
                    <IconifyIconOnline
                      :icon="getOsIcon(row.os)"
                      class="os-icon"
                    />
                    <span>{{ row.os || "未知" }}</span>
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 登录方式列 -->
              <ScTableColumn label="登录方式" width="100" align="center">
                <template #default="{ row }">
                  <ScTag
                    :type="getLoginTypeTag(row.loginType)"
                    effect="light"
                    size="small"
                  >
                    {{ getLoginTypeLabel(row.loginType) }}
                  </ScTag>
                </template>
              </ScTableColumn>

              <!-- 登录时间列 -->
              <ScTableColumn label="登录时间" min-width="180">
                <template #default="{ row }">
                  <div class="time-cell">
                    <IconifyIconOnline
                      icon="mdi:clock-outline"
                      class="time-icon"
                    />
                    <div class="time-details">
                      <span class="time-ago">{{
                        getTimeAgo(row.loginTime)
                      }}</span>
                      <span class="time-full">{{ row.loginTime }}</span>
                    </div>
                  </div>
                </template>
              </ScTableColumn>

              <!-- 操作列 -->
              <ScTableColumn
                label="操作"
                width="120"
                fixed="right"
                align="center"
              >
                <template #default="{ row }">
                  <ScPopconfirm
                    title="确定要强制下线该用户吗？"
                    confirm-button-type="danger"
                    @confirm="handleKickUser(row)"
                  >
                    <template #reference>
                      <ScButton type="danger" link class="kick-btn">
                        <IconifyIconOnline icon="mdi:logout" />
                        <span>踢出</span>
                      </ScButton>
                    </template>
                  </ScPopconfirm>
                </template>
              </ScTableColumn>
            </ScTable>

            <!-- 空状态 -->
            <ScEmpty
              v-if="!loading && tableData.length === 0"
              description="暂无在线用户"
            />
          </div>
        </ScMain>
      </ScContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon, IconifyIconOnline } from "@repo/components/ReIcon";
import { onMounted, reactive, ref, shallowRef } from "vue";
import { getTimeAgo, message } from "@repo/utils";
import Search from "@iconify-icons/ep/search";
import Location from "@iconify-icons/ep/location";
import {
  fetchOnlineUsers,
  fetchOnlineCount,
  fetchKickUser,
  fetchKickUsers,
  type OnlineUser,
} from "@/api/manage/online";

const SearchIcon = useRenderIcon(Search);
const LocationIcon = useRenderIcon(Location);

// 搜索表单
const searchForm = reactive({
  username: "",
  ip: "",
});

// 状态
const loading = ref(false);
const tableData = shallowRef<OnlineUser[]>([]);
const selectedUsers = ref<OnlineUser[]>([]);
const onlineCount = ref(0);

const normalizeOnlineUsers = (value: unknown): OnlineUser[] =>
  Array.isArray(value) ? (value as OnlineUser[]) : [];

const normalizeOnlineCount = (value: unknown): number =>
  typeof value === "number"
    ? value
    : Number.isFinite(Number(value))
      ? Number(value)
      : 0;

/**
 * 加载在线用户数据
 */
const loadData = async () => {
  loading.value = true;
  try {
    const [usersRes, countRes] = await Promise.all([
      fetchOnlineUsers({
        username: searchForm.username || undefined,
        ip: searchForm.ip || undefined,
      }),
      fetchOnlineCount(),
    ]);
    tableData.value = normalizeOnlineUsers(usersRes?.data);
    selectedUsers.value = [];
    onlineCount.value = normalizeOnlineCount(countRes?.data);
  } catch (error) {
    console.error("获取在线用户失败:", error);
    message("获取在线用户失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  loadData();
};

/**
 * 刷新
 */
const handleRefresh = () => {
  searchForm.username = "";
  searchForm.ip = "";
  loadData();
};

/**
 * 表格选择变化
 */
const handleSelectionChange = (selection: OnlineUser[]) => {
  selectedUsers.value = selection;
};

/**
 * 踢出单个用户
 */
const handleKickUser = async (row: OnlineUser) => {
  try {
    await fetchKickUser(row.userId);
    message("用户已被强制下线", { type: "success" });
    loadData();
  } catch (error) {
    console.error("踢出用户失败:", error);
    message("踢出用户失败", { type: "error" });
  }
};

/**
 * 批量踢出用户
 */
const handleBatchKick = async () => {
  if (selectedUsers.value.length === 0) return;

  try {
    const userIds = selectedUsers.value.map((u) => u.userId);
    const res = await fetchKickUsers(userIds);
    message(`成功踢出 ${res.data} 个用户`, { type: "success" });
    loadData();
  } catch (error) {
    console.error("批量踢出失败:", error);
    message("批量踢出失败", { type: "error" });
  }
};

/**
 * 获取浏览器图标
 */
const getBrowserIcon = (browser: string) => {
  const b = (browser || "").toLowerCase();
  if (b.includes("chrome")) return "mdi:google-chrome";
  if (b.includes("firefox")) return "mdi:firefox";
  if (b.includes("safari")) return "mdi:apple-safari";
  if (b.includes("edge")) return "mdi:microsoft-edge";
  if (b.includes("ie") || b.includes("explorer"))
    return "mdi:microsoft-internet-explorer";
  return "mdi:web";
};

/**
 * 获取操作系统图标
 */
const getOsIcon = (os: string) => {
  const o = (os || "").toLowerCase();
  if (o.includes("windows")) return "mdi:microsoft-windows";
  if (o.includes("mac") || o.includes("ios")) return "mdi:apple";
  if (o.includes("linux")) return "mdi:linux";
  if (o.includes("android")) return "mdi:android";
  return "mdi:monitor";
};

/**
 * 获取登录方式标签类型
 */
const getLoginTypeTag = (
  type: string,
): "primary" | "success" | "warning" | "info" | "danger" => {
  const normalized = (type || "").toLowerCase();
  const types: Record<
    string,
    "primary" | "success" | "warning" | "info" | "danger"
  > = {
    web: "primary",
    password: "primary",
    sms: "success",
    tenant: "warning",
    static: "warning",
    wechat: "warning",
    third: "info",
  };
  return types[normalized] || "info";
};

/**
 * 获取登录方式标签
 */
const getLoginTypeLabel = (type: string) => {
  const normalized = (type || "").toLowerCase();
  const labels: Record<string, string> = {
    web: "密码",
    password: "密码",
    sms: "短信",
    tenant: "租户",
    static: "静态",
    wechat: "微信",
    third: "第三方",
  };
  return labels[normalized] || type || "未知";
};

// 组件挂载时加载数据
onMounted(() => {
  loadData();
});
</script>

<style scoped lang="scss">
.online-container {
  height: 100%;
  background-color: var(--el-bg-color);

  .online-wrapper {
    height: 100%;
    overflow: hidden;
    border-radius: var(--el-border-radius-base);
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--el-box-shadow);
    }
  }

  .online-header {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    height: auto !important;
    min-height: 80px;
    padding: 16px 24px;
    background-color: var(--el-bg-color);
    background-image: linear-gradient(
      135deg,
      var(--el-bg-color) 0%,
      var(--el-bg-color-page) 100%
    );
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-left {
      display: flex;
      gap: 20px;
      align-items: center;

      .header-title {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .iconify {
          font-size: 28px;
          color: var(--el-color-primary);
          transition: transform 0.3s ease;

          &:hover {
            transform: scale(1.1);
          }
        }
      }

      .stats-tag {
        display: flex;
        gap: 6px;
        align-items: center;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgb(0 200 83 / 20%);

        .stats-icon {
          font-size: 18px;
        }
      }
    }

    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;

      .search-form {
        display: flex;
        gap: 8px;
        margin-bottom: 0;

        :deep(.el-form-item) {
          margin-bottom: 0;
        }

        .search-input {
          width: 160px;
        }
      }

      .action-btn {
        display: flex;
        gap: 6px;
        align-items: center;
        transition: all 0.3s ease;

        &:hover {
          box-shadow: 0 4px 12px rgb(0 0 0 / 10%);
          transform: translateY(-2px);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }

  .online-main {
    padding: 16px;
    background-color: var(--el-bg-color-page);

    .table-container {
      height: 100%;
      overflow: hidden;
      background-color: var(--el-bg-color);
      border-radius: var(--el-border-radius-base);
      box-shadow: var(--el-box-shadow-lighter);
    }

    .online-table {
      :deep(.el-table__header) {
        th {
          font-weight: 600;
          color: var(--el-text-color-primary);
          background-color: var(--el-fill-color-light);
        }
      }

      :deep(.el-table__row) {
        transition: all 0.3s;

        &:hover {
          background-color: var(--el-fill-color-light);
          transform: translateY(-1px);
        }

        &:nth-child(even) {
          background-color: var(--el-fill-color-lighter);
        }
      }

      .index-tag {
        min-width: 32px;
        text-align: center;
      }

      .user-info-cell {
        display: flex;
        gap: 12px;
        align-items: center;

        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          color: #fff;
          background: linear-gradient(
            135deg,
            var(--el-color-primary-light-5) 0%,
            var(--el-color-primary) 100%
          );
          border-radius: 50%;

          .iconify {
            font-size: 24px;
          }
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .user-nickname {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .user-username {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .ip-cell,
      .address-cell {
        display: flex;
        gap: 6px;
        align-items: center;

        .ip-icon,
        .address-icon {
          font-size: 16px;
          color: var(--el-color-primary);
        }
      }

      .browser-tag,
      .os-tag {
        display: inline-flex;
        gap: 4px;
        align-items: center;

        .browser-icon,
        .os-icon {
          font-size: 14px;
        }
      }

      .time-cell {
        display: flex;
        gap: 8px;
        align-items: center;

        .time-icon {
          font-size: 16px;
          color: var(--el-color-info);
        }

        .time-details {
          display: flex;
          flex-direction: column;
          gap: 2px;

          .time-ago {
            font-weight: 500;
            color: var(--el-text-color-primary);
          }

          .time-full {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }

      .kick-btn {
        display: flex;
        gap: 4px;
        align-items: center;
        transition: all 0.3s;

        &:hover {
          transform: scale(1.05);
        }

        .iconify {
          font-size: 16px;
        }
      }
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .online-container {
    .online-wrapper {
      box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
    }

    .online-header {
      background-color: var(--el-bg-color-overlay);
      background-image: linear-gradient(
        135deg,
        var(--el-bg-color-overlay) 0%,
        var(--el-bg-color) 100%
      );

      .stats-tag {
        box-shadow: 0 2px 8px rgb(0 200 83 / 30%);
      }
    }

    .table-container {
      box-shadow: 0 2px 12px rgb(0 0 0 / 15%);
    }

    .online-table {
      :deep(.el-table__header) {
        th {
          background-color: var(--el-fill-color);
        }
      }

      :deep(.el-table__row) {
        &:nth-child(even) {
          background-color: var(--el-fill-color);
        }
      }

      .user-info-cell {
        .user-avatar {
          background: linear-gradient(
            135deg,
            var(--el-color-primary-light-3) 0%,
            var(--el-color-primary) 100%
          );
        }
      }
    }
  }
}
</style>
