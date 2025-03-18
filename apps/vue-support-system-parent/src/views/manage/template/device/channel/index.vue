<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { deepClean, deepCopy } from "@repo/utils";
import { computed, defineExpose, defineEmits, reactive, ref, shallowRef } from "vue";
import * as _ from "lodash-es";
import { fetchUpdateChannelForDevice } from "@/api/manage/device-channel";

const emit = defineEmits();
const form = reactive({});
const visible = shallowRef(false);
const title = shallowRef("管道管理");
const selectedItem = ref({});
const loadding = shallowRef(false);
const channelStatusList = [
  {
    value: 0,
    label: "离线",
  },
  {
    value: 1,
    label: "在线",
  },
  {
    value: -1,
    label: "未上报",
  },
  {
    value: 2,
    label: "未知",
  },
];
const handleOpen = async (row) => {
  Object.assign(form, row);
  visible.value = true;
};

const handleSave = async () => {
  selectedItem.value = {};
  selectedItem.value.sysDeviceSerialNumber = form.sysDeviceSerialNumber;
  selectedItem.value.sysDeviceChannelStatus = 1;
};

const handleDelete = async (item) => {
  form.channelList = form.channelList.filter((i) => i != item);
};

const isSelected = computed(() => {
  return selectedItem.value.sysDeviceSerialNumber;
});

const handleClickItem = async (item) => {
  selectedItem.value = item;
};
const handleSaveIntoList = async () => {
  form.channelList.push(_.cloneDeep(selectedItem.value));
};
const handleClose = async () => {
  visible.value = false;
  selectedItem.value = {};
  deepClean(form);
  loadding.value = false;
};

const handleSubmit = async () => {
  loadding.value = true;
  fetchUpdateChannelForDevice({
    sysDeviceSerialNumber: form.sysDeviceSerialNumber,
    channels: form.channelList,
  })
    .then((res) => {
      emit("success");
      handleClose();
    })
    .finally(() => {
      loadding.value = false;
    });
};
defineExpose({
  handleOpen,
  handleClose,
});
</script>
<template>
  <div>
    <el-dialog :title="title" draggable v-model="visible" :close-on-click-modal="false" @close="handleClose">
      <div>
        <el-button class="btn-text" :icon="useRenderIcon('ep:plus')" @click="handleSave"></el-button>
      </div>
      <div class="flex gap-4">
        <el-row :gutter="10" :class="{ 'w-1/2': !!isSelected, 'w-full': !isSelected }">
          <el-col :span="8" v-for="item in form.channelList" class="relative cursor-pointer py-1" @click="handleClickItem(item)">
            <el-card>
              <div class="flex-center">{{ item.sysDeviceChannelName }}</div>
            </el-card>
            <el-icon class="!absolute right-2 top-2" @click="handleDelete(item)">
              <component :is="useRenderIcon('ep:close')" />
            </el-icon>
          </el-col>
        </el-row>
        <div class="detail w-1/2" v-if="isSelected">
          <div class="flex justify-between">
            <span>详情</span>
            <div>
              <el-button class="btn-text" type="primary" :icon="useRenderIcon('ri:save-2-line')" @click="handleSaveIntoList"></el-button>
            </div>
          </div>
          <div class="flex-center">
            <el-form :model="selectedItem" :label-width="120">
              <el-form-item label="通道编码">
                <el-text>{{ selectedItem.sysDeviceSerialNumber }} {{ selectedItem.sysDeviceChannelId }}</el-text>
              </el-form-item>

              <el-form-item label="通道名称">
                <el-input v-model="selectedItem.sysDeviceChannelName" placeholder="通道名称"></el-input>
              </el-form-item>

              <el-form-item label="通道号">
                <el-input v-model="selectedItem.sysDeviceChannelNo" placeholder="通道号"></el-input>
              </el-form-item>

              <el-form-item label="管道类型">
                <el-input v-model="selectedItem.sysDeviceChannelType" placeholder="管道类型"></el-input>
              </el-form-item>

              <el-form-item label="通道状态">
                <el-select v-model="selectedItem.sysDeviceChannelStatus" placeholder="管道状态">
                  <el-option v-for="item in channelStatusList" :key="item.value" :label="item.label" :value="item.value"></el-option>
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
                />
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loadding">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>
