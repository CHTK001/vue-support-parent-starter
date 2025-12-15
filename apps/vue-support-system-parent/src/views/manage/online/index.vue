<template>
  <div class="online-container">
    <div class="online-wrapper">
      <el-container>
        <!-- 页面头部 -->
        <el-header class="online-header">
          <div class="header-left">
            <div class="header-title">
              <IconifyIconOnline icon="mdi:account-multiple-check" />
              <span>在线用户管理</span>
            </div>
            <div class="header-stats">
              <el-tag type="success" effect="light" size="large" class="stats-tag">
                <IconifyIconOnline icon="mdi:account-check" class="stats-icon" />
                <span>当前在线: {{ onlineCount }} 人</span>
              </el-tag>
            </div>
          </div>
          <div class="header-actions">
            <!-- 搜索表单 -->
            <el-form :inline="true" :model="searchForm" class="search-form">
              <el-form-item>
                <el-input
                  v-model="searchForm.username"
                  placeholder="用户名"
                  clearable
                  class="search-input"
                  :prefix-icon="SearchIcon"
                />
              </el-form-item>
              <el-form-item>
                <el-input
                  v-model="searchForm.ip"
                  placeholder="IP地址"
                  clearable
                  class="search-input"
                  :prefix-icon="LocationIcon"
                />
              </el-form-item>
            </el-form>
            <!-- 操作按钮 -->
            <el-button type="primary" class="action-btn" @click="handleSearch">
              <IconifyIconOnline icon="mdi:magnify" />
              <span>搜索</span>
            </el-button>
            <el-button class="action-btn" @click="handleRefresh">
              <IconifyIconOnline icon="mdi:refresh" />
              <span>刷新</span>
            </el-button>
            <el-button
              type="danger"
              class="action-btn"
              :disabled="selectedUsers.length === 0"
              @click="handleBatchKick"
            >
              <IconifyIconOnline icon="mdi:account-remove" />
              <span>批量踢出 ({{ selectedUsers.length }})</span>
            </el-button>
          </div>
        </el-header>

        <!-- 表格主体 -->
        <el-main class="online-main">
          <div class="table-container">
            <!-- 加载骨架屏 -->
            <el-skeleton v-if="loading" animated :rows="8" />

            <!-- 数据表格 -->
            <el-table
              v-else
              :data="tableData"
              row-key="userId"
              class="online-table"
              @selection-change="handleSelectionChange"
            >
              <!-- 多选列 -->
              <el-table-column type="selection" width="55" align="center" />

              <!-- 序号列 -->
              <el-table-column type="index" label="序号" width="80" align="center">
                <template #default="{ $index }">
                  <el-tag type="primary" effect="light" size="small" class="index-tag">
                    {{ $index + 1 }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 用户信息列 -->
              <el-table-column label="用户信息" min-width="200">
                <template #default="{ row }">
                  <div class="user-info-cell">
                    <div class="user-avatar">
                      <IconifyIconOnline icon="mdi:account-circle" />
                    </div>
                    <div class="user-details">
                      <span class="user-nickname">{{ row.nickname || row.username }}</span>
                      <span class="user-username">@{{ row.username }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- 登录IP列 -->
              <el-table-column label="登录IP" min-width="150">
                <template #default="{ row }">
                  <div class="ip-cell">
                    <IconifyIconOnline icon="mdi:ip-network" class="ip-icon" />
                    <span>{{ row.loginIp || '-' }}</span>
                  </div>
                </template>
              </el-table-column>

              <!-- 登录地址列 -->
              <el-table-column label="登录地址" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  <div class="address-cell">
                    <IconifyIconOnline icon="mdi:map-marker" class="address-icon" />
                    <span>{{ row.loginAddress || '未知' }}</span>
                  </div>
                </template>
              </el-table-column>

              <!-- 浏览器列 -->
              <el-table-column label="浏览器" min-width="120">
                <template #default="{ row }">
                  <el-tag effect="light" size="small" class="browser-tag">
                    <IconifyIconOnline :icon="getBrowserIcon(row.browser)" class="browser-icon" />
                    <span>{{ row.browser || '未知' }}</span>
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 操作系统列 -->
              <el-table-column label="操作系统" min-width="120">
                <template #default="{ row }">
                  <el-tag type="info" effect="light" size="small" class="os-tag">
                    <IconifyIconOnline :icon="getOsIcon(row.os)" class="os-icon" />
                    <span>{{ row.os || '未知' }}</span>
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 登录方式列 -->
              <el-table-column label="登录方式" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getLoginTypeTag(row.loginType)" effect="light" size="small">
                    {{ getLoginTypeLabel(row.loginType) }}
                  </el-tag>
                </template>
              </el-table-column>

              <!-- 登录时间列 -->
              <el-table-column label="登录时间" min-width="180">
                <template #default="{ row }">
                  <div class="time-cell">
                    <IconifyIconOnline icon="mdi:clock-outline" class="time-icon" />
                    <div class="time-details">
                      <span class="time-ago">{{ getTimeAgo(row.loginTime) }}</span>
                      <span class="time-full">{{ row.loginTime }}</span>
                    </div>
                  </div>
                </template>
              </el-table-column>

              <!-- 操作列 -->
              <el-table-column label="操作" width="120" fixed="right" align="center">
                <template #default="{ row }">
                  <el-popconfirm
                    title="确定要强制下线该用户吗？"
                    confirm-button-type="danger"
                    @confirm="handleKickUser(row)"
                  >
                    <template #reference>
                      <el-button type="danger" link class="kick-btn">
                        <IconifyIconOnline icon="mdi:logout" />
                        <span>踢出</span>
                      </el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>

            <!-- 空状态 -->
            <el-empty v-if="!loading && tableData.length === 0" description="暂无在线用户" />
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, shallowRef } from "vue";
import { fetchOnlineUsers, fetchOnlineCount, fetchKickUser, fetchKickUsers, type OnlineUser } from "@/api/manage/online";
import { getTimeAgo, message } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Search from "@iconify-icons/ep/search";
import Location from "@iconify-icons/ep/location";

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
    tableData.value = usersRes.data || [];
    onlineCount.value = countRes.data || 0;
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
  if (b.includes("ie") || b.includes("explorer")) return "mdi:microsoft-internet-explorer";
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
const getLoginTypeTag = (type: string): "primary" | "success" | "warning" | "info" | "danger" => {
  const types: Record<string, "primary" | "success" | "warning" | "info" | "danger"> = {
    password: "primary",
    sms: "success",
    wechat: "warning",
    third: "info",
  };
  return types[type] || "info";
};

/**
 * 获取登录方式标签
 */
const getLoginTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    password: "密码",
    sms: "短信",
    wechat: "微信",
    third: "第三方",
  };
  return labels[type] || type || "未知";
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
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--el-box-shadow);
    }
  }

  .online-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: auto !important;
    min-height: 80px;
    padding: 16px 24px;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-image: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
    flex-wrap: wrap;
    gap: 16px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .header-title {
        display: flex;
        align-items: center;
        gap: 10px;
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
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        font-size: 14px;
        font-weight: 500;
        border-radius: 20px;
        box-shadow: 0 2px 8px rgba(0, 200, 83, 0.2);

        .stats-icon {
          font-size: 18px;
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

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
        align-items: center;
        gap: 6px;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
      background-color: var(--el-bg-color);
      border-radius: var(--el-border-radius-base);
      box-shadow: var(--el-box-shadow-lighter);
      overflow: hidden;
    }

    .online-table {
      :deep(.el-table__header) {
        th {
          background-color: var(--el-fill-color-light);
          font-weight: 600;
          color: var(--el-text-color-primary);
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
        align-items: center;
        gap: 12px;

        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, var(--el-color-primary-light-5) 0%, var(--el-color-primary) 100%);
          border-radius: 50%;
          color: #fff;

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
        align-items: center;
        gap: 6px;

        .ip-icon,
        .address-icon {
          font-size: 16px;
          color: var(--el-color-primary);
        }
      }

      .browser-tag,
      .os-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;

        .browser-icon,
        .os-icon {
          font-size: 14px;
        }
      }

      .time-cell {
        display: flex;
        align-items: center;
        gap: 8px;

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
        align-items: center;
        gap: 4px;
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
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }

    .online-header {
      background-color: var(--el-bg-color-overlay);
      background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);

      .stats-tag {
        box-shadow: 0 2px 8px rgba(0, 200, 83, 0.3);
      }
    }

    .table-container {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
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
          background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
        }
      }
    }
  }
}
</style>
