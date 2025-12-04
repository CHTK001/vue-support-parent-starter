<template>
  <div class="room-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/webrtc' }">WebRTC管理</el-breadcrumb-item>
        <el-breadcrumb-item>房间管理</el-breadcrumb-item>
      </el-breadcrumb>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          创建房间
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="房间名称">
          <el-input
            v-model="searchForm.roomName"
            placeholder="请输入房间名称"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="房间类型">
          <el-select v-model="searchForm.roomType" placeholder="请选择房间类型" clearable style="width: 150px">
            <el-option label="视频通话" value="video_call" />
            <el-option label="视频会议" value="video_conference" />
          </el-select>
        </el-form-item>
        <el-form-item label="房间状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 房间列表 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="roomList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="roomId" label="房间ID" width="120" />
        <el-table-column prop="roomName" label="房间名称" min-width="150" />
        <el-table-column prop="roomType" label="房间类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.roomType === 'video_call' ? 'primary' : 'success'">
              {{ row.roomType === 'video_call' ? '视频通话' : '视频会议' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '活跃' : '非活跃' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="用户数" width="120">
          <template #default="{ row }">
            <span>{{ row.currentUsers }}/{{ row.maxUsers }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="创建者" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="joinRoom(row)">
              加入
            </el-button>
            <el-button type="info" size="small" @click="viewRoomDetail(row)">
              详情
            </el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button type="primary" size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="users">用户列表</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建房间对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建房间"
      width="500px"
      :before-close="handleCloseCreateDialog"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="房间名称" prop="roomName">
          <el-input v-model="createForm.roomName" placeholder="请输入房间名称" />
        </el-form-item>
        <el-form-item label="房间类型" prop="roomType">
          <el-radio-group v-model="createForm.roomType">
            <el-radio value="video_call">视频通话</el-radio>
            <el-radio value="video_conference">视频会议</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="最大用户数" prop="maxUsers">
          <el-input-number
            v-model="createForm.maxUsers"
            :min="2"
            :max="50"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="房间描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入房间描述"
          />
        </el-form-item>
        <el-form-item label="房间密码">
          <el-input
            v-model="createForm.password"
            type="password"
            placeholder="可选，设置房间密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateRoom" :loading="createLoading">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 加入房间对话框 -->
    <el-dialog
      v-model="showJoinDialog"
      title="加入房间"
      width="400px"
    >
      <el-form :model="joinForm" label-width="80px">
        <el-form-item label="房间名称">
          <el-input v-model="selectedRoom.roomName" readonly />
        </el-form-item>
        <el-form-item label="房间密码" v-if="selectedRoom.requirePassword">
          <el-input
            v-model="joinForm.password"
            type="password"
            placeholder="请输入房间密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showJoinDialog = false">取消</el-button>
        <el-button type="primary" @click="handleJoinRoom" :loading="joinLoading">
          加入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * WebRTC房间管理页面
 * @author CH
 * @date 2025-01-10
 * @version 1.0.0
 */

import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import {
  Plus,
  Search,
  Refresh,
  ArrowDown
} from '@element-plus/icons-vue';
import {
  getRoomList,
  createRoom,
  joinRoom as joinRoomApi,
  deleteRoom,
  type RoomInfo,
  type CreateRoomParams,
  type RoomListParams
} from '@/api/webrtc';

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
  roomName: '',
  roomType: undefined,
  status: undefined
});

// 分页信息
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 创建房间表单
const createForm = reactive<CreateRoomParams>({
  roomName: '',
  roomType: 'video_call',
  maxUsers: 10,
  description: '',
  password: ''
});

// 加入房间表单
const joinForm = reactive({
  password: ''
});

// 选中的房间
const selectedRoom = ref<RoomInfo>({} as RoomInfo);

// 创建房间表单验证规则
const createRules = {
  roomName: [
    { required: true, message: '请输入房间名称', trigger: 'blur' },
    { min: 2, max: 50, message: '房间名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  roomType: [
    { required: true, message: '请选择房间类型', trigger: 'change' }
  ],
  maxUsers: [
    { required: true, message: '请设置最大用户数', trigger: 'blur' }
  ]
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
      size: pagination.size
    };
    const { data } = await getRoomList(params);
    roomList.value = data.records;
    pagination.total = data.total;
  } catch (error) {
    console.error('加载房间列表失败:', error);
    ElMessage.error('加载房间列表失败');
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
    roomName: '',
    roomType: undefined,
    status: undefined
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
    ElMessage.success('房间创建成功');
    showCreateDialog.value = false;
    loadRoomList();
  } catch (error) {
    console.error('创建房间失败:', error);
    ElMessage.error('创建房间失败');
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
    roomName: '',
    roomType: 'video_call',
    maxUsers: 10,
    description: '',
    password: ''
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
      password: joinForm.password
    };
    
    const { data } = await joinRoomApi(params);
    if (data.success) {
      ElMessage.success('加入房间成功');
      showJoinDialog.value = false;
      // 跳转到房间页面
      router.push(`/webrtc/room/${selectedRoom.value.roomId}`);
    } else {
      ElMessage.error(data.message || '加入房间失败');
    }
  } catch (error) {
    console.error('加入房间失败:', error);
    ElMessage.error('加入房间失败');
  } finally {
    joinLoading.value = false;
    joinForm.password = '';
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
    case 'edit':
      // 编辑房间
      router.push(`/webrtc/rooms/${room.roomId}/edit`);
      break;
    case 'users':
      // 查看用户列表
      router.push(`/webrtc/rooms/${room.roomId}/users`);
      break;
    case 'delete':
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
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const { data } = await deleteRoom(room.roomId);
    if (data.success) {
      ElMessage.success('房间删除成功');
      loadRoomList();
    } else {
      ElMessage.error(data.message || '删除房间失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除房间失败:', error);
      ElMessage.error('删除房间失败');
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
</style>