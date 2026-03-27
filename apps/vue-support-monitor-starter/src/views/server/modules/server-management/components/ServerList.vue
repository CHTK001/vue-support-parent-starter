<template>
  <div class="server-list system-container modern-bg">
    <!-- 搜索和筛选工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <ScInput
          v-model="searchKeyword"
          placeholder="搜索服务器名称、地址..."
          clearable
          style="width: 300px"
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </ScInput>

        <ScSelect
          v-model="filterProtocol"
          placeholder="协议类型"
          clearable
          style="width: 120px; margin-left: 12px"
          @change="handleFilter"
        >
          <ScOption label="SSH" value="SSH" />
          <ScOption label="RDP" value="RDP" />
          <ScOption label="VNC" value="VNC" />
        </ScSelect>

        <ScSelect
          v-model="filterStatus"
          placeholder="连接状态"
          clearable
          style="width: 120px; margin-left: 12px"
          @change="handleFilter"
        >
          <ScOption label="在线" :value="1" />
          <ScOption label="离线" :value="0" />
          <ScOption label="连接中" :value="2" />
          <ScOption label="异常" :value="3" />
        </ScSelect>
      </div>

      <div class="toolbar-right">
        <ScButton @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </ScButton>

        <ScDropdown @command="handleBatchAction">
          <ScButton>
            批量操作
            <IconifyIconOnline icon="ep:arrow-down" class="ml-1" />
          </ScButton>
          <template #dropdown>
            <ScDropdownMenu>
              <ScDropdownItem command="test">批量测试连接</ScDropdownItem>
              <ScDropdownItem command="enable">批量启用</ScDropdownItem>
              <ScDropdownItem command="disable">批量禁用</ScDropdownItem>
              <ScDropdownItem command="delete" divided
                >批量删除</ScDropdownItem
              >
            </ScDropdownMenu>
          </template>
        </ScDropdown>
      </div>
    </div>

    <!-- 服务器表格 -->
    <ScTable
      v-loading="loading"
      :data="serverList"
      stripe
      @selection-change="handleSelectionChange"
    >
      <ScTableColumn type="selection" width="55" />

      <ScTableColumn label="服务器信息" min-width="200">
        <template #default="{ row }">
          <div class="server-info">
            <div class="server-name">
              <IconifyIconOnline
                :icon="getProtocolIcon(row.monitorSysGenServerProtocol)"
                class="protocol-icon"
              />
              {{ row.monitorSysGenServerName }}
            </div>
            <div class="server-address">
              {{ row.monitorSysGenServerHost }}:{{
                row.monitorSysGenServerPort
              }}
            </div>
            <div v-if="row.monitorSysGenServerTags" class="server-tags">
              <ScTag
                v-for="tag in getTagList(row.monitorSysGenServerTags)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </ScTag>
            </div>
          </div>
        </template>
      </ScTableColumn>

      <ScTableColumn label="协议" width="80" align="center">
        <template #default="{ row }">
          <ScTag
            :type="getProtocolType(row.monitorSysGenServerProtocol)"
            size="small"
          >
            {{ row.monitorSysGenServerProtocol }}
          </ScTag>
        </template>
      </ScTableColumn>

      <ScTableColumn label="连接状态" width="100" align="center">
        <template #default="{ row }">
          <ScTag
            :type="
              getConnectionStatusType(row.monitorSysGenServerConnectionStatus)
            "
            size="small"
            effect="light"
          >
            {{
              getConnectionStatusText(row.monitorSysGenServerConnectionStatus)
            }}
          </ScTag>
        </template>
      </ScTableColumn>

      <ScTableColumn label="服务器状态" width="100" align="center">
        <template #default="{ row }">
          <ScSwitch
            v-model="row.monitorSysGenServerStatus"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </ScTableColumn>

      <ScTableColumn label="监控设置" width="120" align="center">
        <template #default="{ row }">
          <ServerQuickSetting
            :server-id="row.monitorSysGenServerId"
            :server-name="row.monitorSysGenServerName"
            @open-full-setting="handleOpenFullSetting"
            @setting-changed="handleSettingChanged"
          />
        </template>
      </ScTableColumn>

      <ScTableColumn label="最后连接时间" width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerLastConnectTime">
            {{ formatDateTime(row.monitorSysGenServerLastConnectTime) }}
          </span>
          <span v-else class="text-muted">从未连接</span>
        </template>
      </ScTableColumn>

      <ScTableColumn label="操作" width="300" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <ScButton
              size="small"
              type="primary"
              @click="$emit('connect', row)"
            >
              <IconifyIconOnline icon="ri:play-line" />
            </ScButton>

            <ScButton size="small" @click="$emit('monitor', row)">
              <IconifyIconOnline icon="ri:dashboard-line" />
            </ScButton>

            <ScButton size="small" @click="$emit('files', row)">
              <IconifyIconOnline icon="ri:folder-line" />
            </ScButton>

            <ScButton size="small" @click="$emit('script', row)">
              <IconifyIconOnline icon="ri:terminal-line" />
            </ScButton>

            <ScButton size="small" @click="$emit('upload', row)">
              <IconifyIconOnline icon="ri:upload-line" />
            </ScButton>

            <ScDropdown @command="(cmd) => handleAction(cmd, row)">
              <ScButton size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </ScButton>
              <template #dropdown>
                <ScDropdownMenu>
                  <ScDropdownItem command="edit">编辑</ScDropdownItem>
                  <ScDropdownItem command="config">配置管理</ScDropdownItem>
                  <ScDropdownItem command="setting"
                    >服务器设置</ScDropdownItem
                  >
                  <ScDropdownItem command="test">测试连接</ScDropdownItem>
                  <ScDropdownItem command="logs">查看日志</ScDropdownItem>
                  <ScDropdownItem command="clone">克隆配置</ScDropdownItem>
                  <ScDropdownItem command="delete" divided
                    >删除</ScDropdownItem
                  >
                </ScDropdownMenu>
              </template>
            </ScDropdown>
          </ScButton-group>
        </template>
      </ScTableColumn>
    </ScTable>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <ScPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import ServerQuickSetting from "./ServerQuickSetting.vue";
import {
  getServerPageList,
  updateServer,
  deleteServer,
  testServerConnection,
  batchOperateServers,
  cloneServer,
  type ServerInfo,
} from "@/api/server";
import {
  CONNECTION_STATUS,
  getConnectionStatusColor,
  getConnectionStatusText,
} from "@/api/server/connection-status";

// 定义事件
const emit = defineEmits<{
  edit: [server: ServerInfo];
  config: [server: ServerInfo];
  setting: [server: ServerInfo];
  delete: [server: ServerInfo];
  connect: [server: ServerInfo];
  monitor: [server: ServerInfo];
  files: [server: ServerInfo];
  script: [server: ServerInfo];
  logs: [server: ServerInfo];
  upload: [server: ServerInfo];
}>();

// 响应式状态
const loading = ref(false);
const serverList = ref<ServerInfo[]>([]);
const selectedServers = ref<ServerInfo[]>([]);

// 搜索和筛选
const searchKeyword = ref("");
const filterProtocol = ref("");
const filterStatus = ref("");

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

/**
 * 加载服务器列表
 */
const loadServerList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenServerName: searchKeyword.value || undefined,
      monitorSysGenServerProtocol: filterProtocol.value || undefined,
      monitorSysGenServerConnectionStatus: filterStatus.value || undefined,
    };

    const res = await getServerPageList(params);
    if (res.code === "00000") {
      serverList.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    message.error("加载服务器列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 获取协议图标
 */
const getProtocolIcon = (protocol: string) => {
  const iconMap: Record<string, string> = {
    SSH: "ri:terminal-line",
    RDP: "ri:computer-line",
    VNC: "ri:remote-control-line",
  };
  return iconMap[protocol] || "ri:server-line";
};

/**
 * 获取协议类型
 */
const getProtocolType = (protocol: string) => {
  const typeMap: Record<string, string> = {
    SSH: "primary",
    RDP: "success",
    VNC: "warning",
  };
  return typeMap[protocol] || "info";
};

/**
 * 获取连接状态类型
 */
const getConnectionStatusType = (status: number) => {
  return getConnectionStatusColor(status);
};

/**
 * 获取标签列表
 */
const getTagList = (tags: string) => {
  return tags ? tags.split(",").filter((tag) => tag.trim()) : [];
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadServerList();
};

/**
 * 处理筛选
 */
const handleFilter = () => {
  pagination.page = 1;
  loadServerList();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadServerList();
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: ServerInfo[]) => {
  selectedServers.value = selection;
};

/**
 * 处理状态变化
 */
const handleStatusChange = async (server: ServerInfo) => {
  try {
    await updateServer({
      monitorSysGenServerId: server.monitorSysGenServerId,
      monitorSysGenServerStatus: server.monitorSysGenServerStatus,
    } as any);
    message.success("状态更新成功");
  } catch (error) {
    console.error("状态更新失败:", error);
    message.error("状态更新失败");
    // 回滚状态
    server.monitorSysGenServerStatus =
      server.monitorSysGenServerStatus === 1 ? 0 : 1;
  }
};

/**
 * 处理操作
 */
const handleAction = async (command: string, server: ServerInfo) => {
  switch (command) {
    case "edit":
      emit("edit", server);
      break;
    case "config":
      emit("config", server);
      break;
    case "setting":
      emit("setting", server);
      break;
    case "test":
      await handleTestConnection(server);
      break;
    case "logs":
      emit("logs", server);
      break;
    case "clone":
      await handleCloneServer(server);
      break;
    case "delete":
      await handleDeleteServer(server);
      break;
  }
};

/**
 * 处理测试连接
 */
const handleTestConnection = async (server: ServerInfo) => {
  try {
    loading.value = true;
    const res = await testServerConnection(
      server.monitorSysGenServerId.toString(),
    );
    if (res.code === "00000") {
      message.success("连接测试成功");
    } else {
      message.error(`连接测试失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("连接测试失败:", error);
    message.error("连接测试失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 处理克隆服务器
 */
const handleCloneServer = async (server: ServerInfo) => {
  try {
    const { value: targetName } = await ElMessageBox.prompt(
      "请输入新服务器名称",
      "克隆服务器",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputPattern: /^.{2,50}$/,
        inputErrorMessage: "名称长度在 2 到 50 个字符",
      },
    );

    const res = await cloneServer({
      sourceId: server.monitorSysGenServerId.toString(),
      targetName,
    });

    if (res.code === "00000") {
      message.success("服务器克隆成功");
      loadServerList();
    } else {
      message.error(`克隆失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("克隆服务器失败:", error);
      message.error("克隆服务器失败");
    }
  }
};

/**
 * 处理删除服务器
 */
const handleDeleteServer = async (server: ServerInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除服务器 "${server.monitorSysGenServerName}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const res = await deleteServer(server.monitorSysGenServerId.toString());
    if (res.code === "00000") {
      message.success("删除成功");
      loadServerList();
      emit("delete", server);
    } else {
      message.error(`删除失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除服务器失败:", error);
      message.error("删除服务器失败");
    }
  }
};

/**
 * 处理批量操作
 */
const handleBatchAction = async (command: string) => {
  if (selectedServers.value.length === 0) {
    message.warning("请先选择要操作的服务器");
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedServers.value.length} 台服务器执行 "${command}" 操作吗？`,
      "批量操作确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const ids = selectedServers.value.map((server) =>
      server.monitorSysGenServerId.toString(),
    );
    const res = await batchOperateServers({ ids, action: command as any });

    if (res.code === "00000") {
      message.success("批量操作成功");
      loadServerList();
    } else {
      message.error(`批量操作失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("批量操作失败:", error);
      message.error("批量操作失败");
    }
  }
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadServerList();
};

/**
 * 处理当前页变化
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadServerList();
};

/**
 * 刷新列表
 */
const refresh = () => {
  loadServerList();
};

/**
 * 处理打开完整设置
 */
const handleOpenFullSetting = (serverId: number) => {
  const server = serverList.value.find(
    (s) => s.monitorSysGenServerId === serverId,
  );
  if (server) {
    emit("setting", server);
  }
};

/**
 * 处理设置变化
 */
const handleSettingChanged = (serverId: number) => {
  // 可以在这里刷新服务器列表或更新特定服务器的状态
  console.log("服务器设置已更新:", serverId);
};

// 暴露方法
defineExpose({
  refresh,
});

// 生命周期
onMounted(() => {
  loadServerList();
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.server-list {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }

  .server-info {
    .server-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      margin-bottom: 4px;

      .protocol-icon {
        margin-right: 6px;
        color: #409eff;
      }
    }

    .server-address {
      font-size: 12px;
      color: var(--el-text-color);
      margin-bottom: 4px;
    }

    .server-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  }

  .text-muted {
    color: #c0c4cc;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  // 修复按钮 hover 时图标不可见问题
  :deep(.el-button-group) {
    .el-button:not(.el-button--primary):hover {
      color: #fff;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
