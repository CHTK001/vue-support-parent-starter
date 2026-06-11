<script setup>
import { useRenderIcon } from "@repo/components/ReIcon";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { ElTag } from "element-plus";
import {
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  fetchPageProjectForDevice,
  fetchUpdateProjectForDevice,
} from "../../../api/manage/device-template";
import { createDevice, getResourceIcon } from "./hook/device";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const CameraDialog = defineAsyncComponent(() => import("./device.vue"));
const LogDialog = defineAsyncComponent(() => import("./log.vue"));
const OrgDialog = defineAsyncComponent(() => import("./org.vue"));
const TimelineDialog = defineAsyncComponent(() => import("./timeline.vue"));
const CardHistory = defineAsyncComponent(() => import("./card-history.vue"));

const logDialogRef = shallowRef();
const cameraPreviewDialogRef = shallowRef();
const timelineDialogRef = shallowRef();
const cardHistoryRef = shallowRef();
const smsDialogRef = shallowRef();
const deviceInstance = createDevice();
const env = reactive({
  sysProjectName: null,
  sysProjectId: null,
});
const orgDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const saveDialog = shallowRef(null);
const templateDialogRef = shallowRef(null);
const { t } = useI18n();

const loading = reactive({
  query: false,
});
const platformLabelMap = {
  AF: "海康安防",
  YY: "海康云耀",
  YM: "海康云眸",
};
const resolvePlatformLabel = (value) => platformLabelMap[value] || value || "未识别";
const getPlatformSummary = (row) => {
  const platform = resolvePlatformLabel(row.hikPlatform);
  const address = row.hikAddress || "未配置";
  const project = row.hikProjectCode || row.hikProjectId || "未绑定";
  return `${platform} · ${address} · ${project}`;
};
const onSearch = (query) => {
  tableRef.value?.reload(form);
};

const categoryData = ref([]);
const categoryProp = reactive({
  label: "sysDictItemName",
  value: "sysDictItemId",
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
        style:
          "float: right; color: var(--el-text-color-secondary); font-size: 13px",
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
  // 兼容新参数名 sysSecretId 和旧参数名 sysProjectId
  env.sysProjectId = String(query.sysSecretId || query.sysProjectId || "");
  env.sysProjectName = String(query.sysSecretName || query.sysProjectName || "");
  form.sysProjectId = env.sysProjectId;
};

// 监听路由参数变化（支持 _t 时间戳强制刷新）
watch(
  () => route.query,
  () => { onAfterProperieSet(); },
);

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

let form = reactive({});

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
  deviceInstance.handlePreviewUrl(
    cameraPreviewDialogRef.value,
    selectedValues,
    "view-all"
  );
};
</script>
<template>
  <div class="h-full system-container modern-bg device-page">
    <SaveDialog
      ref="saveDialog"
      :categoryProp="categoryProp"
      :category="categoryData"
      :renderContent="renderContent"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />

    <CardHistory ref="cardHistoryRef" />
    <LogDialog ref="logDialogRef" />
    <OrgDialog ref="orgDialogRef" />
    <CameraDialog ref="smsDialogRef" />
    <TimelineDialog ref="timelineDialogRef" />

    <el-container>
      <el-header class="device-page__header">
        <div class="left-panel">
          <div class="device-page__hero">
            <div class="device-page__hero-title">设备管理</div>
            <div class="device-page__hero-desc">
              平台信息、摄像头、门禁和同步操作统一管理
            </div>
          </div>
          <div class="device-page__sync-strip">
            <ScButton type="primary" @click="deviceInstance.handleSync(env)">
              <ScIcon class="pr-1" size="18">
                <component :is="useRenderIcon('ri:download-cloud-2-line')" />
              </ScIcon>
              同步设备
            </ScButton>
            <ScButton @click="deviceInstance.handleSyncOrg(env)">
              <ScIcon class="pr-1" size="18">
                <component :is="useRenderIcon('ri:organization-chart')" />
              </ScIcon>
              同步组织
            </ScButton>
            <ScButton @click="handleOrg">
              <ScIcon class="pr-1" size="18">
                <component :is="useRenderIcon('ri:node-tree')" />
              </ScIcon>
              组织树
            </ScButton>
            <ScButton @click="handleLog">
              <ScIcon class="pr-1" size="18">
                <component :is="useRenderIcon('ri:file-list-3-line')" />
              </ScIcon>
              同步日志
            </ScButton>
          </div>
          <ScForm
            ref="formRef"
            :inline="true"
            :model="form"
            class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto"
          >
            <ScFormItem label="序列号" prop="sysDeviceSerialNumber">
              <ScInput
                v-model="form.sysDeviceSerialNumber"
                placeholder="请输入序列号"
                clearable
              />
            </ScFormItem>

            <ScFormItem label="设备名称" prop="sysDeviceName">
              <ScInput
                v-model="form.sysDeviceName"
                placeholder="请输入设备名称"
                clearable
              />
            </ScFormItem>
            <ScFormItem label="设备状态" prop="sysDeviceOnline">
              <el-segmented
                @change="onSearch"
                v-model="form.sysDeviceOnline"
                :options="[
                  { label: '全部', value: null },
                  { label: '在线', value: 1 },
                  { label: '离线', value: 0 },
                ]"
              ></el-segmented>
            </ScFormItem>
          </ScForm>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <ScButton
              type="primary"
              :icon="useRenderIcon('ri:search-line')"
              :loading="loading.query"
              @click="onSearch"
            />
            <ScButton
              title="批量播放"
              :icon="useRenderIcon('ri:play-circle-line')"
              @click="handlePreview(formRef)"
            />
            <ScButton
              title="新增"
              :icon="useRenderIcon('ep:plus')"
              @click="
                deviceInstance.dialogOpen(
                  saveDialog,
                  {
                    sysProjectId: env.sysProjectId,
                  },
                  'save'
                )
              "
              class="mr-3"
            />
            <el-dropdown trigger="click">
              <ScButton
                title="同步"
                :icon="useRenderIcon('ri:more-2-fill')"
              ></ScButton>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    class="h-[38px]"
                    @click="deviceInstance.handleSync(env)"
                  >
                    <ScIcon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:database-down')" />
                    </ScIcon>
                    同步信息
                  </el-dropdown-item>
                  <el-dropdown-item
                    class="h-[38px]"
                    @click="deviceInstance.handleSyncOrg(env)"
                  >
                    <ScIcon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:database-down')" />
                    </ScIcon>
                    同步组织
                  </el-dropdown-item>
                  <el-dropdown-item class="h-[38px]" @click="handleOrg">
                    <ScIcon class="pr-1" size="21">
                      <component :is="useRenderIcon('humbleicons:droplet')" />
                    </ScIcon>
                    项目组织
                  </el-dropdown-item>
                  <el-dropdown-item class="h-[38px]" @click="handleLog">
                    <ScIcon class="pr-1" size="21">
                      <component :is="useRenderIcon('bi:files')" />
                    </ScIcon>
                    项目日志
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </el-header>
      <el-main>
        <ScTable
          ref="tableRef"
          border
          :search="false"
          :url="fetchPageProjectForDevice"
          :params="params"
          class="custom-table-row overflow-auto w-[90vw] device-table"
          rowKey="sysDeviceId"
        >
          <ScTableColumn type="selection" />
          <ScTableColumn
            label="序号"
            type="index"
            align="center"
            fixed
            width="60px"
          />
          <ScTableColumn
            prop="sysDeviceSerialNumber"
            label="设备序列号"
            align="center"
            fixed
            width="340px"
          >
            <template #default="{ row }">
              <div class="device-cell device-cell--serial">
                <ScTag>
                  {{ row.sysDeviceSerialNumber }}
                  <ScIcon
                    v-if="row.sysDeviceSerialNumber"
                    class="cursor-pointer"
                    v-copy:click="row.sysDeviceSerialNumber || ''"
                  >
                    <component
                      :is="useRenderIcon('ep:copy-document')"
                    ></component>
                  </ScIcon>
                  <ScIcon v-else class="cursor-pointer">
                    <component
                      :is="useRenderIcon('ep:copy-document')"
                    ></component>
                  </ScIcon>
                </ScTag>
                <div class="device-cell__sub">{{ getPlatformSummary(row) }}</div>
              </div>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="sysDeviceName"
            label="设备名称"
            show-overflow-tooltip
            width="220"
          >
            <template #default="{ row }">
              <div class="device-cell">
                <div class="device-cell__title">
                  <ScIcon
                    v-if="row.sysDeviceOnline === 1"
                    title="在线"
                    color="var(--el-color-primary)"
                  >
                    <component :is="useRenderIcon('humbleicons:wifi')" />
                  </ScIcon>
                  <ScIcon v-else title="离线" color="var(--el-text-color-secondary)">
                    <component :is="useRenderIcon('humbleicons:wifi-off')" />
                  </ScIcon>
                  <span>{{ row.sysDeviceName }}</span>
                </div>
                <div class="device-cell__sub">
                  {{ row.sysDeviceOrgName || '未分组' }} · {{ resolvePlatformLabel(row.hikPlatform) }}
                </div>
              </div>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="sysDeviceNetAddress"
            label="网路地址"
            align="center"
            show-overflow-tooltip
            width="180px"
          >
          </ScTableColumn>

          <ScTableColumn
            prop="sysDeviceOrgCode"
            label="组织编码"
            align="center"
            show-overflow-tooltip
            width="200"
          >
            <template #default="scope">
              {{ scope.row.sysDeviceOrgName }}
              <span class="el-form-item-msg">{{
                scope.row.sysDeviceOrgCode
              }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="sysDeviceChannelNumber"
            label="管道号"
            align="center"
            show-overflow-tooltip
          >
            <template #default="scope">
              {{ scope.row.sysDeviceChannelNumber || "" }}
              <span class="el-form-item-msg">{{
                scope.row.sysDeviceChannelName
              }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="sysDevicePosition"
            label="位置"
            align="center"
            show-overflow-tooltip
            width="200"
          >
          </ScTableColumn>
          <ScTableColumn
            prop="sysDeviceResourceType"
            label="资源类型"
            align="center"
            show-overflow-tooltip
            width="200px"
          >
            <template #default="{ row }">
              <ScButton
                :icon="getResourceIcon(row.sysDeviceResourceType)"
                :title="row.sysDeviceResourceType"
                text
                plain
                class="btn-text !text-[14px]"
              ></ScButton>
              <span class="el-form-item-msg">
                {{ row.sysDeviceVersion }}
              </span>
            </template>
          </ScTableColumn>
          <ScTableColumn
            prop="updateTime"
            label="最后一次更新时间"
            align="center"
            width="180px"
          >
            <template #default="{ row }">
              <span :title="'更新来自' + row.sysDeviceSerialNumber">{{
                row.updateTime || row.createTime
              }}</span>
            </template>
          </ScTableColumn>

          <ScTableColumn
            label="操作"
            fixed="right"
            align="center"
            width="240px"
          >
            <template #default="{ row }">
              <ScButton
                size="small"
                plain
                link
                type="primary"
                :icon="useRenderIcon('ep:edit')"
                @click="deviceInstance.dialogOpen(saveDialog, row, 'edit')"
              >
                {{ $t("buttons.update") }}
              </ScButton>
              <ScButton
                size="small"
                plain
                link
                type="primary"
                v-if="row.sysDeviceOnline == 1"
                :icon="useRenderIcon('humbleicons:wifi')"
                @click="deviceInstance.handleOnline(row)"
              >
                {{ $t("buttons.online") }}
              </ScButton>
              <ScButton
                size="small"
                plain
                link
                type="danger"
                v-else
                :icon="useRenderIcon('humbleicons:wifi-off')"
                @click="deviceInstance.handleOnline(row)"
              >
                {{ $t("buttons.offline") }}
              </ScButton>

              <ScButton
                size="small"
                plain
                link
                type="danger"
                v-if="row.sysDeviceResourceType == 'CAMERA'"
                @click="
                  deviceInstance.handlePreviewUrl(
                    cameraPreviewDialogRef,
                    row,
                    'view'
                  )
                "
              >
                {{ $t("buttons.preview-url") }}
              </ScButton>

              <ScButton
                size="small"
                plain
                link
                type="primary"
                :icon="useRenderIcon('ri:timeline-view')"
                @click="deviceInstance.handleTimeline(timelineDialogRef, row)"
              >
                {{ $t("buttons.timeline") }}
              </ScButton>

              <ScButton
                size="small"
                plain
                link
                type="primary"
                :icon="useRenderIcon('bi:eye')"
                v-if="row.sysDeviceResourceType == 'MEN_JIN'"
                @click="
                  deviceInstance.handlePreviewCardHistory(
                    cardHistoryRef,
                    row,
                    'view'
                  )
                "
              >
                历史信息
              </ScButton>

              <ScPopconfirm
                v-if="row.sysDeviceDisabled == 0"
                :title="$t('message.confimDelete')"
                @confirm="deviceInstance.onDelete(tableRef, row, form)"
              >
                <template #reference>
                  <ScButton
                    size="small"
                    type="danger"
                    plain
                    link
                    :icon="useRenderIcon('ep:delete')"
                    >{{ $t("buttons.delete") }}</ScButton>
                </template>
              </ScPopconfirm>
            </template>
          </ScTableColumn>
        </ScTable>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
.device-page {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
}

.device-page__header {
  height: auto !important;
  padding: 14px 16px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.device-page__hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.device-page__hero-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.device-page__hero-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.device-page__sync-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}

:deep(.el-container) {
  height: 100%;
}

:deep(.el-main) {
  padding: 16px;
  background-color: var(--el-bg-color);
}

:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: var(--el-fill-color-light) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button--link) {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

:deep(.el-select) {
  .el-select__wrapper {
    border-radius: 8px;
  }
}

/* 在这里引入你的自定义CSS类 */
.custom-table-row {
  --el-table-row-height: 60px;
}

.device-table {
  :deep(.el-table__cell) {
    vertical-align: top;
  }
}

.device-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-cell--serial {
  align-items: flex-start;
}

.device-cell__title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.device-cell__sub {
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}
</style>
