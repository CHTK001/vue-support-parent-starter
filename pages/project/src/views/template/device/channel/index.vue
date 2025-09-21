<script setup>
import { deepClean, message } from "@repo/utils";
import * as _ from "lodash-es";
import { computed,  defineExpose, reactive, ref, shallowRef } from "vue";
import { fetchUpdateChannelForDevice } from "../../../../api/manage/device-channel";

// 定义组件事件
const emit = defineEmits();

// 响应式数据
const form = reactive({}); // 表单数据
const visible = shallowRef(false); // 对话框显示状态
const title = shallowRef("通道管理"); // 对话框标题
const selectedItem = ref({}); // 当前选中的通道
const loading = shallowRef(false); // 加载状态
const isAddingNew = ref(false); // 是否正在添加新通道

// 通道状态列表
const channelStatusList = [
  {
    value: 0,
    label: "离线",
    color: "#F56C6C",
  },
  {
    value: 1,
    label: "在线",
    color: "#67C23A",
  },
  {
    value: -1,
    label: "未上报",
    color: "#909399",
  },
  {
    value: 2,
    label: "未知",
    color: "#E6A23C",
  },
];

/**
 * 打开通道管理对话框
 * @param {Object} row - 设备数据
 */
const handleOpen = async (row) => {
  Object.assign(form, row);
  // 确保通道列表存在
  if (!form.channelList) {
    form.channelList = [];
  }
  visible.value = true;
};

/**
 * 创建新通道
 */
const handleAddNew = async () => {
  // 重置选中项，准备创建新通道
  selectedItem.value = {
    sysDeviceSerialNumber: form.sysDeviceSerialNumber,
    sysDeviceChannelStatus: 1,
    sysDeviceChannelUse: 1,
    sysDeviceChannelName: "",
    sysDeviceChannelNo: "",
    sysDeviceChannelType: "",
  };
  isAddingNew.value = true;
};

/**
 * 删除通道
 * @param {Object} item - 要删除的通道
 */
const handleDelete = async (item, event) => {
  // 阻止事件冒泡，避免触发选中事件
  event.stopPropagation();

  // 确认删除
  ElMessageBox.confirm("确定要删除该通道吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(() => {
      // 从列表中移除
      form.channelList = form.channelList.filter((i) => i != item);
      // 如果删除的是当前选中项，则清空选中
      if (selectedItem.value === item) {
        selectedItem.value = {};
      }
      message("删除成功", { type: "success" });
    })
    .catch(() => {});
};

/**
 * 判断是否有选中的通道
 */
const isSelected = computed(() => {
  return Object.keys(selectedItem.value).length > 0;
});

/**
 * 选中通道
 * @param {Object} item - 选中的通道
 */
const handleClickItem = async (item) => {
  selectedItem.value = _.cloneDeep(item);
  isAddingNew.value = false;
};

/**
 * 保存通道到列表
 */
const handleSaveIntoList = async () => {
  // 表单验证
  if (!selectedItem.value.sysDeviceChannelName) {
    message("请输入通道名称", { type: "warning" });
    return;
  }

  if (isAddingNew.value) {
    // 添加新通道
    form.channelList.push(_.cloneDeep(selectedItem.value));
    message("添加成功", { type: "success" });
  } else {
    // 更新现有通道
    const index = form.channelList.findIndex((item) => item.sysDeviceChannelId === selectedItem.value.sysDeviceChannelId);
    if (index !== -1) {
      form.channelList[index] = _.cloneDeep(selectedItem.value);
      message("更新成功", { type: "success" });
    }
  }

  // 重置状态
  selectedItem.value = {};
  isAddingNew.value = false;
};

/**
 * 关闭对话框
 */
const handleClose = async () => {
  visible.value = false;
  selectedItem.value = {};
  deepClean(form);
  loading.value = false;
  isAddingNew.value = false;
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  loading.value = true;

  try {
    const res = await fetchUpdateChannelForDevice({
      sysDeviceSerialNumber: form.sysDeviceSerialNumber,
      channels: form.channelList,
    });

    if (res.code === "00000") {
      emit("success");
      message("保存成功", { type: "success" });
      handleClose();
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    message("操作失败：" + (error.message || "未知错误"), { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 导出方法供父组件调用
defineExpose({
  handleOpen,
  handleClose,
});
</script>

<template>
  <div>
    <el-dialog :title="title" draggable v-model="visible" :close-on-click-modal="false" @close="handleClose" width="800px" class="channel-dialog">
      <div class="channel-container">
        <!-- 通道列表区域 -->
        <div class="channel-list-section" :class="{ 'w-full': !isSelected, 'w-1/2': isSelected }">
          <div class="section-header">
            <h3 class="section-title">通道列表</h3>
            <el-button type="primary" size="small" class="add-button" @click="handleAddNew">
              <IconifyIconOnline icon="mdi:plus" />
              <span>添加通道</span>
            </el-button>
          </div>

          <div class="channel-grid">
            <div v-for="(item, index) in form.channelList" :key="index" class="channel-card-wrapper" @click="handleClickItem(item)">
              <el-card :class="{ 'is-selected': selectedItem.sysDeviceChannelId === item.sysDeviceChannelId }" class="channel-card">
                <div class="channel-card-content">
                  <div class="channel-name">{{ item.sysDeviceChannelName || "未命名通道" }}</div>
                  <div class="channel-info">
                    <el-tag size="small" :type="item.sysDeviceChannelStatus === 1 ? 'success' : 'danger'">
                      {{ channelStatusList.find((status) => status.value === item.sysDeviceChannelStatus)?.label || "未知" }}
                    </el-tag>
                    <span class="channel-id">{{ item.sysDeviceChannelId }}</span>
                  </div>
                </div>
                <el-button class="delete-btn" type="danger" size="small" circle @click="handleDelete(item, $event)">
                  <IconifyIconOnline icon="mdi:delete" />
                </el-button>
              </el-card>
            </div>

            <!-- 空状态提示 -->
            <div v-if="form.channelList && form.channelList.length === 0" class="empty-tip">
              <IconifyIconOnline icon="mdi:playlist-remove" class="empty-icon" />
              <p>暂无通道数据，请点击"添加通道"按钮创建</p>
            </div>
          </div>
        </div>

        <!-- 通道详情区域 -->
        <div class="channel-detail-section w-full" v-if="isSelected">
          <div class="section-header">
            <h3 class="section-title">{{ isAddingNew ? "添加通道" : "通道详情" }}</h3>
            <el-button type="primary" size="small" @click="handleSaveIntoList">
              <IconifyIconOnline icon="mdi:content-save" />
              <span>{{ isAddingNew ? "添加" : "保存" }}</span>
            </el-button>
          </div>

          <el-form :model="selectedItem" label-position="top" class="detail-form">
            <el-form-item label="通道编码">
              <el-input v-model="selectedItem.sysDeviceChannelId" placeholder="系统自动生成" disabled></el-input>
            </el-form-item>

            <el-form-item label="通道名称" required>
              <el-input v-model="selectedItem.sysDeviceChannelName" placeholder="请输入通道名称"></el-input>
            </el-form-item>

            <el-form-item label="通道号">
              <el-input v-model="selectedItem.sysDeviceChannelNo" placeholder="请输入通道号"></el-input>
            </el-form-item>

            <el-form-item label="通道类型">
              <el-input v-model="selectedItem.sysDeviceChannelType" placeholder="请输入通道类型"></el-input>
            </el-form-item>

            <el-form-item label="通道状态">
              <el-select v-model="selectedItem.sysDeviceChannelStatus" placeholder="请选择通道状态" class="w-full">
                <el-option v-for="item in channelStatusList" :key="item.value" :label="item.label" :value="item.value">
                  <div class="status-option">
                    <div class="status-dot" :style="{ backgroundColor: item.color }"></div>
                    <span>{{ item.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>

            <el-form-item label="通道启用状态">
              <el-segmented
                v-model="selectedItem.sysDeviceChannelUse"
                :options="[
                  {
                    label: '启用',
                    value: 1,
                  },
                  {
                    label: '禁用',
                    value: 0,
                  },
                ]"
                class="w-full"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleClose">取 消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">保 存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.channel-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__header) {
    margin-right: 0;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color);
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid #f0f0f0;
  }
}

.channel-container {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.channel-list-section,
.channel-detail-section {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin: 0;
  position: relative;
  padding-left: 12px;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background-color: var(--el-color-primary);
    border-radius: 2px;
  }
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.channel-card-wrapper {
  position: relative;
}

.channel-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  background-color: var(--el-table-row-hover-bg-color);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
  }

  .channel-card-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .channel-name {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .channel-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
  }

  .channel-id {
     color: var(--el-text-color);
    font-size: 11px;
  }

  .delete-btn {
    position: absolute;
    top: 5px;
    right: 5px;
    opacity: 0;
    transition: opacity 0.2s;
    padding: 4px;
    font-size: 12px;
  }

  &:hover .delete-btn {
    opacity: 1;
  }
}

.detail-form {
  margin-top: 16px;

  :deep(.el-form-item__label) {
    padding-bottom: 4px;
  }
}

.status-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
}

.empty-tip {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
   color: var(--el-text-color);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #dcdfe6;
  }

  p {
    margin: 0;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
