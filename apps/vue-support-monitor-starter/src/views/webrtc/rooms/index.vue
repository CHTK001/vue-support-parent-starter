<template>
  <div class="room-management system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <ScBreadcrumb separator="/">
        <ScBreadcrumbItem :to="{ path: '/webrtc' }"
          >WebRTC管理</el-breadcrumb-item
        >
        <ScBreadcrumbItem>房间管理</ScBreadcrumbItem>
      </ScBreadcrumb>
      <div class="header-actions">
        <ScButton type="primary" @click="showCreateDialog = true">
          <ScIcon><Plus /></ScIcon>
          创建房间
        </ScButton>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <ScCard class="search-card" shadow="never">
      <ScForm :model="searchForm" inline>
        <ScFormItem label="房间名称">
          <ScInput
            v-model="searchForm.roomName"
            placeholder="请输入房间名称"
            clearable
            style="width: 200px"
          />
        </ScFormItem>
        <ScFormItem label="房间类型">
          <ScSelect
            v-model="searchForm.roomType"
            placeholder="请选择房间类型"
            clearable
            style="width: 150px"
          >
            <ScOption label="视频通话" value="video_call" />
            <ScOption label="视频会议" value="video_conference" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem label="房间状态">
          <ScSelect
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <ScOption label="活跃" value="active" />
            <ScOption label="非活跃" value="inactive" />
          </ScSelect>
        </ScFormItem>
        <ScFormItem>
          <ScButton type="primary" @click="handleSearch">
            <ScIcon><Search /></ScIcon>
            搜索
          </ScButton>
          <ScButton @click="handleReset">
            <ScIcon><Refresh /></ScIcon>
            重置
          </ScButton>
        </ScFormItem>
      </ScForm>
    </ScCard>

    <!-- 房间列表 -->
    <ScCard class="table-card" shadow="never">
      <ScTable v-loading="loading" :data="roomList" stripe style="width: 100%">
        <ScTableColumn prop="roomId" label="房间ID" width="120" />
        <ScTableColumn prop="roomName" label="房间名称" min-width="150" />
        <ScTableColumn prop="roomType" label="房间类型" width="120">
          <template #default="{ row }">
            <ScTag
              :type="row.roomType === 'video_call' ? 'primary' : 'success'"
            >
              {{ row.roomType === "video_call" ? "视频通话" : "视频会议" }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="status" label="状态" width="100">
          <template #default="{ row }">
            <ScTag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === "active" ? "活跃" : "非活跃" }}
            </ScTag>
          </template>
        </ScTableColumn>
        <ScTableColumn label="用户数" width="120">
          <template #default="{ row }">
            <span>{{ row.currentUsers }}/{{ row.maxUsers }}</span>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="creatorName" label="创建者" width="120" />
        <ScTableColumn prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </ScTableColumn>
        <ScTableColumn
          prop="description"
          label="描述"
          min-width="150"
          show-overflow-tooltip
        />
        <ScTableColumn label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ScButton type="primary" size="small" @click="joinRoom(row)">
              加入
            </ScButton>
            <ScButton type="info" size="small" @click="viewRoomDetail(row)">
              详情
            </ScButton>
            <ScDropdown @command="(command) => handleCommand(command, row)">
              <ScButton type="primary" size="small">
                更多<ScIcon class="el-icon--right"><arrow-down /></ScIcon>
              </ScButton>
              <template #dropdown>
                <ScDropdownMenu>
                  <ScDropdownItem command="edit">编辑</ScDropdownItem>
                  <ScDropdownItem command="users">用户列表</ScDropdownItem>
                  <ScDropdownItem command="delete" divided
                    >删除</el-dropdown-item
                  >
                </ScDropdownMenu>
              </template>
            </ScDropdown>
          </template>
        </ScTableColumn>
      </ScTable>

      <!-- 分页 -->
      <div class="pagination-container">
        <ScPagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </ScCard>

    <!-- 创建房间对话框 -->
    <sc-dialog
      v-model="showCreateDialog"
      title="创建房间"
      width="500px"
      :before-close="handleCloseCreateDialog"
    >
      <ScForm
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <ScFormItem label="房间名称" prop="roomName">
          <ScInput
            v-model="createForm.roomName"
            placeholder="请输入房间名称"
          />
        </ScFormItem>
        <ScFormItem label="房间类型" prop="roomType">
          <ScRadioGroup v-model="createForm.roomType">
            <ScRadio value="video_call">视频通话</ScRadio>
            <ScRadio value="video_conference">视频会议</ScRadio>
          </ScRadioGroup>
        </ScFormItem>
        <ScFormItem label="最大用户数" prop="maxUsers">
          <ScInputNumber
            v-model="createForm.maxUsers"
            :min="2"
            :max="50"
            style="width: 100%"
          />
        </ScFormItem>
        <ScFormItem label="房间描述">
          <ScInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入房间描述"
          />
        </ScFormItem>
        <ScFormItem label="房间密码">
          <ScInput
            v-model="createForm.password"
            type="password"
            placeholder="可选，设置房间密码"
            show-password
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="showCreateDialog = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="createLoading"
          @click="handleCreateRoom"
        >
          创建
        </ScButton>
      </template>
    </sc-dialog>

    <!-- 加入房间对话框 -->
    <sc-dialog v-model="showJoinDialog" title="加入房间" width="400px">
      <ScForm :model="joinForm" label-width="80px">
        <ScFormItem label="房间名称">
          <ScInput v-model="selectedRoom.roomName" readonly />
        </ScFormItem>
        <ScFormItem v-if="selectedRoom.requirePassword" label="房间密码">
          <ScInput
            v-model="joinForm.password"
            type="password"
            placeholder="请输入房间密码"
            show-password
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="showJoinDialog = false">取消</ScButton>
        <ScButton
          type="primary"
          :loading="joinLoading"
          @click="handleJoinRoom"
        >
          加入
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC房间管理页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { message } from "@repo/utils";
import { ElMessageBox, type FormInstance } from "element-plus";
import { Plus, Search, Refresh, ArrowDown } from "@element-plus/icons-vue";
import {
  getRoomList,
  createRoom,
  joinRoom as joinRoomApi,
  deleteRoom,
  type RoomInfo,
  type CreateRoomParams,
  type RoomListParams,
} from "@/api/webrtc";

const router = useRouter();

// 表单引用
const createFormRef = ref<FormInstance>();

// 数据状态
const loading = ref(false);
const createLoading = ref(false);
const joinLoading = ref(false);
const roomList = ref<RoomInfo[]>([]);

// 对话框状态
const showCreateDialog = ref(false);
const showJoinDialog = ref(false);

// 搜索表单
const searchForm = reactive<RoomListParams>({
  roomName: "",
  roomType: undefined,
  status: undefined,
});

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0,
});

// 创建房间表单
const createForm = reactive<CreateRoomParams>({
  roomName: "",
  roomType: "video_call",
  maxUsers: 10,
  description: "",
  password: "",
});

// 加入房间表单
const joinForm = reactive({
  password: "",
});

// 选中的房间
const selectedRoom = ref<RoomInfo>({} as RoomInfo);

// 创建房间表单验证规则
const createRules = {
  roomName: [
    { required: true, message: "请输入房间名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "房间名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  roomType: [{ required: true, message: "请选择房间类型", trigger: "change" }],
  maxUsers: [{ required: true, message: "请设置最大用户数", trigger: "blur" }],
};

/**
 * 加载房间列表
 */
const loadRoomList = async () => {
  loading.value = true;
  try {
    const params = {
      ...searchForm,
      page: pagination.page,
      size: pagination.size,
    };
    const { data } = await getRoomList(params);
    roomList.value = data.records;
    pagination.total = data.total;
  } catch (error) {
    console.error("加载房间列表失败:", error);
    message("加载房间列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadRoomList();
};

/**
 * 重置搜索
 */
const handleReset = () => {
  Object.assign(searchForm, {
    roomName: "",
    roomType: undefined,
    status: undefined,
  });
  pagination.page = 1;
  loadRoomList();
};

/**
 * 分页大小改变
 */
const handleSizeChange = (size: number) => {
  pagination.size = size;
  pagination.page = 1;
  loadRoomList();
};

/**
 * 当前页改变
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadRoomList();
};

/**
 * 创建房间
 */
const handleCreateRoom = async () => {
  if (!createFormRef.value) return;

  try {
    await createFormRef.value.validate();
    createLoading.value = true;

    const params = { ...createForm };
    if (!params.password) {
      delete params.password;
    }

    await createRoom(params);
    message("房间创建成功", { type: "success" });
    showCreateDialog.value = false;
    loadRoomList();
  } catch (error) {
    console.error("创建房间失败:", error);
    message("创建房间失败", { type: "error" });
  } finally {
    createLoading.value = false;
  }
};

/**
 * 关闭创建对话框
 */
const handleCloseCreateDialog = () => {
  createFormRef.value?.resetFields();
  Object.assign(createForm, {
    roomName: "",
    roomType: "video_call",
    maxUsers: 10,
    description: "",
    password: "",
  });
  showCreateDialog.value = false;
};

/**
 * 加入房间
 */
const joinRoom = (room: RoomInfo) => {
  selectedRoom.value = room;
  if (room.requirePassword) {
    showJoinDialog.value = true;
  } else {
    handleJoinRoom();
  }
};

/**
 * 处理加入房间
 */
const handleJoinRoom = async () => {
  try {
    joinLoading.value = true;
    const params = {
      roomId: selectedRoom.value.roomId,
      password: joinForm.password,
    };

    const { data } = await joinRoomApi(params);
    if (data.success) {
      message("加入房间成功", { type: "success" });
      showJoinDialog.value = false;
      // 跳转到房间页面
      router.push(`/webrtc/room/${selectedRoom.value.roomId}`);
    } else {
      message(data.message || "加入房间失败", { type: "error" });
    }
  } catch (error) {
    console.error("加入房间失败:", error);
    message("加入房间失败", { type: "error" });
  } finally {
    joinLoading.value = false;
    joinForm.password = "";
  }
};

/**
 * 查看房间详情
 */
const viewRoomDetail = (room: RoomInfo) => {
  router.push(`/webrtc/rooms/${room.roomId}`);
};

/**
 * 处理下拉菜单命令
 */
const handleCommand = async (command: string, room: RoomInfo) => {
  switch (command) {
    case "edit":
      // 编辑房间
      router.push(`/webrtc/rooms/${room.roomId}/edit`);
      break;
    case "users":
      // 查看用户列表
      router.push(`/webrtc/rooms/${room.roomId}/users`);
      break;
    case "delete":
      // 删除房间
      await handleDeleteRoom(room);
      break;
  }
};

/**
 * 删除房间
 */
const handleDeleteRoom = async (room: RoomInfo) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除房间 "${room.roomName}" 吗？此操作不可恢复。`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const { data } = await deleteRoom(room.roomId);
    if (data.success) {
      message("房间删除成功", { type: "success" });
      loadRoomList();
    } else {
      message(data.message || "删除房间失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除房间失败:", error);
      message("删除房间失败", { type: "error" });
    }
  }
};

/**
 * 格式化时间
 */
const formatTime = (time: string) => {
  return new Date(time).toLocaleString();
};

// 组件挂载时加载数据
onMounted(() => {
  loadRoomList();
});
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  }
}

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

.room-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  .pagination-container {
    display: flex;
    justify-content: center;
    margin-top: 20px;
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
