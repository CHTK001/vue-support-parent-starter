<script setup>
import { fetchPageProjectForDevice, fetchUpdateProjectForDevice } from "@/api/manage/project-device";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { ElTag } from "element-plus";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { createDevice, getResourceIcon } from "./hook/device";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const CameraDialog = defineAsyncComponent(() => import("./device.vue"));
const LogDialog = defineAsyncComponent(() => import("./log.vue"));
const OrgDialog = defineAsyncComponent(() => import("./org.vue"));
const TimelineDialog = defineAsyncComponent(() => import("./timeline.vue"));
const CameraPreviewDialog = defineAsyncComponent(() => import("./preview/index.vue"));
const logDialogRef = ref();
const cameraPreviewDialogRef = ref();
const timelineDialogRef = ref();
const smsDialogRef = ref();
const deviceInstance = createDevice();
const env = reactive({
  sysProjectName: null,
  sysProjectId: null,
});
const orgDialogRef = ref(null);
const tableRef = ref(null);
const saveDialog = ref(null);
const templateDialogRef = ref(null);
const { t } = useI18n();

const loading = reactive({
  query: false,
});
const onSearch = (query) => {
  tableRef.value?.reload(form);
};

const categoryData = ref([]);
const categoryProp = reactive({
  label: "sysDictItemName",
  value: "SysDictItemId",
});

const onCategory = async () => {
  const { data } = await fetchListDictItem({ sysDictId: 2 });
  categoryData.value = data;
};

const renderContent = (h, { node, data }) => {
  return h(
    "span",
    {},
    node.data?.sysDictItemName,
    h(
      "span",
      {
        class: "flex-col justify-end",
        style: "float: right; color: var(--el-text-color-secondary); font-size: 13px",
      },
      data?.sysDictItemCode
    )
  );
};
onMounted(() => {
  onAfterProperieSet();
  onCategory();
  onSearch();
});
const route = useRoute();

const onAfterProperieSet = () => {
  const query = route.query;
  env.sysProjectId = query.sysProjectId;
  env.sysProjectName = query.sysProjectName;
  form.sysProjectId = query.sysProjectId;
};

const doUpdate = async ($event, row) => {
  fetchUpdateProjectForDevice(row).then((res) => {
    if (res.code == "00000") {
      tableRef.value.reload(form);
      message(t("message.updateSuccess"), { type: "success" });
      return;
    }
  });
};

const visible = reactive({
  save: false,
  template: false,
});
const saveDialogParams = reactive({
  mode: "save",
});

const handleOrg = async () => {
  orgDialogRef.value.handleOpen(env);
};

const handleLog = async () => {
  logDialogRef.value.handleOpen(env);
};
const templateOpen = async (item, mode) => {
  visible.template = true;
  await nextTick();
  mode = item.sysTemplateDisabled == 1 ? "show" : mode;
  templateDialogRef.value.open(mode);
};

let form = reactive({
});

const dialogClose = () => {
  visible.save = false;
};

const formRef = ref();
const params = shallowRef();
const resetForm = async (ref) => {
  form = reactive({});
  params.value = {};
  onSearch();
};

const handlePreview = async () => {
  const selectedValues = tableRef.value.getSelection();
  deviceInstance.handlePreviewUrl(cameraPreviewDialogRef.value, selectedValues, 'view-all')
}
</script>
<template>
  <div class="h-full">
    <SaveDialog ref="saveDialog" :categoryProp="categoryProp" :category="categoryData" :renderContent="renderContent"
      :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />

    <LogDialog ref="logDialogRef" />
    <OrgDialog ref="orgDialogRef" />
    <CameraDialog ref="smsDialogRef" />
    <TimelineDialog ref="timelineDialogRef" />
    <CameraPreviewDialog ref="cameraPreviewDialogRef" />

    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="form"
            class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto">
            <el-form-item label="序列号" prop="sysDeviceSerialNumber">
              <el-input v-model="form.sysDeviceSerialNumber" placeholder="请输入序列号" clearable />
            </el-form-item>

            <el-form-item label="设备名称" prop="sysDeviceName">
              <el-input v-model="form.sysDeviceName" placeholder="请输入设备名称" clearable />
            </el-form-item>
            <el-form-item label="设备状态" prop="sysCameraTemplateOnline">
              <el-segmented @change="onSearch" v-model="form.sysCameraTemplateOnline" :options="[
                { label: '全部', value: null },
                { label: '在线', value: 1 },
                { label: '离线', value: 0 },
              ]"></el-segmented>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query"
              @click="onSearch" />
            <el-button title="预览" :icon="useRenderIcon('mingcute:eye-2-fill')" @click="handlePreview(formRef)" />
            <el-button title="新增" :icon="useRenderIcon('ep:plus')" @click="
              deviceInstance.dialogOpen(
                saveDialog,
                {
                  sysProjectId: env.sysProjectId,
                },
                'save'
              )
              " class="mr-3" />
            <el-dropdown trigger="click">
              <el-button title="同步" :icon="useRenderIcon('ri:more-2-fill')"></el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item class="h-[38px]" @click="deviceInstance.handleSync(env)">
                    <el-icon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:database-down')" />
                    </el-icon>
                    同步设备/组织
                  </el-dropdown-item>
                  <el-dropdown-item class="h-[38px]" @click="deviceInstance.handleSyncOrg(env)">
                    <el-icon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:database-down')" />
                    </el-icon>
                    同步组织
                  </el-dropdown-item>
                  <el-dropdown-item class="h-[38px]" @click="handleOrg">
                    <el-icon class="pr-1" size="21">
                      <component :is="useRenderIcon('humbleicons:droplet')" />
                    </el-icon>
                    项目组织
                  </el-dropdown-item>
                  <el-dropdown-item class="h-[38px]" @click="handleLog">
                    <el-icon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:files')" />
                    </el-icon>
                    项目日志
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <ScTable ref="tableRef" border :search="false" :url="fetchPageProjectForDevice" :params="params"
          class="custom-table-row overflow-auto w-[90vw]" rowKey="sysDeviceId">
          <el-table-column type="selection" />
          <el-table-column label="序号" type="index" align="center" fixed width="60px" />
          <el-table-column prop="sysDeviceSerialNumber" label="设备序列号" align="center" fixed width="340px"
            show-overflow-tooltip>
            <template #default="{ row }">
              <el-icon v-if="row.sysDeviceSerialNumber" class="cursor-pointer"
                v-copy:click="row.sysDeviceSerialNumber || ''">
                <component :is="useRenderIcon('ep:copy-document')"></component>
              </el-icon>
              <el-icon v-else class="cursor-pointer">
                <component :is="useRenderIcon('ep:copy-document')"></component>
              </el-icon>
              <el-tag>{{ row.sysDeviceSerialNumber }} </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysDeviceName" label="设备名称" show-overflow-tooltip>
            <template #default="{ row }">
              <el-icon v-if="row.sysDeviceOnline === 1" title="在线" color="blue">
                <component :is="useRenderIcon('humbleicons:wifi')" />
              </el-icon>
              <el-icon v-else color="red" title="离线">
                <component :is="useRenderIcon('humbleicons:wifi-off')" />
              </el-icon>{{ row.sysDeviceName }}
              <div class="absolute top-2 right-0 z-[99]" title="管道数量">
                <el-badge type="primary" :value="row.sysDeviceChannelCount"> </el-badge>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysDeviceNetAddress" label="网路地址" align="center" show-overflow-tooltip width="180px">
          </el-table-column>

          <el-table-column prop="sysDeviceOrgCode" label="组织编码" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.sysDeviceOrgName }}
              <span class="el-form-item-msg">{{ scope.row.sysDeviceOrgCode }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysDeviceChannelNumber" label="管道号" align="center" show-overflow-tooltip>
            <template #default="scope">
              {{ scope.row.sysDeviceChannelNumber || "" }}
              <span class="el-form-item-msg">{{ scope.row.sysDeviceChannelName }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysDevicePosition" label="位置" align="center" show-overflow-tooltip> </el-table-column>
          <el-table-column prop="sysDeviceResourceType" label="资源类型" align="center" show-overflow-tooltip width="200px">
            <template #default="{ row }">
              <el-button :icon="getResourceIcon(row.sysDeviceResourceType)" :title="row.sysDeviceResourceType" text
                plain class="btn-text !text-[14px]"></el-button>
              <span class="el-form-item-msg">
                {{ row.sysDeviceVersion }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="最后一次更新时间" align="center" width="180px">
            <template #default="{ row }">
              <span :title="'更新来自' + row.sysDeviceSerialNumber">{{ row.updateTime || row.createTime }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" align="center" width="240px">
            <template #default="{ row }">
              <el-button size="small" plain link type="primary" :icon="useRenderIcon('ep:edit')"
                @click="deviceInstance.dialogOpen(saveDialog, row, 'edit')">
                {{ $t("buttons.update") }}
              </el-button>
              <el-button size="small" plain link type="primary" v-if="row.sysDeviceOnline == 1"
                :icon="useRenderIcon('humbleicons:wifi')" @click="deviceInstance.handleOnline(row)">
                {{ $t("buttons.online") }}
              </el-button>
              <el-button size="small" plain link type="danger" v-else :icon="useRenderIcon('humbleicons:wifi-off')"
                @click="deviceInstance.handleOnline(row)">
                {{ $t("buttons.offline") }}
              </el-button>

              <el-button size="small" plain link type="danger" v-if="row.sysDeviceResourceType == 'CAMERA'"
                @click="deviceInstance.handlePreviewUrl(cameraPreviewDialogRef, row, 'view')">
                {{ $t("buttons.preview-url") }}
              </el-button>

              <el-button size="small" plain link type="primary" :icon="useRenderIcon('ri:timeline-view')"
                @click="deviceInstance.handleTimeline(timelineDialogRef, row)">
                {{ $t("buttons.timeline") }}
              </el-button>
              <el-popconfirm v-if="row.sysDeviceDisabled == 0" :title="$t('message.confimDelete')"
                @confirm="deviceInstance.onDelete(tableRef, row, form)">
                <template #reference>
                  <el-button size="small" type="danger" plain link :icon="useRenderIcon('ep:delete')">{{
                    $t("buttons.delete") }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </ScTable>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

/* 在这里引入你的自定义CSS类 */
.custom-table-row {
  --el-table-row-height: 60px;
  /* 设置行高为60像素 */
}
</style>
