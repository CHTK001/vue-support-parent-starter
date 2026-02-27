<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { ElTag } from "element-plus";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import {
  fetchDeleteProjectForSms,
  fetchPageProjectForSms,
  fetchSyncProjectForSms,
  fetchUpdateProjectForSms,
} from "../../../api/manage/project-sms";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const SmsDialog = defineAsyncComponent(() => import("./sms.vue"));
const SmsSelectDialog = defineAsyncComponent(() => import("./sms-select.vue"));
const LogDialog = defineAsyncComponent(() => import("./log.vue"));
const logDialogRef = ref();
const smsSelectDialogRef = ref();
const smsDialogRef = ref();
const env = reactive({
  sysProjectName: null,
  sysProjectId: null,
});
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

const handleSend = async (row) => {
  smsDialogRef.value.handleOpen(row);
};
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
  env.sysProjectId = query.sysProjectId;
  env.sysProjectName = query.sysProjectName;
  form.sysProjectId = env.sysProjectId;
};

const handleAllSend = async () => {
  smsSelectDialogRef.value.handleOpen(env);
};
const handleSync = async () => {
  fetchSyncProjectForSms(env).then((res) => {
    if (res.code == "00000") {
      message(t("message.syncSuccess"), { type: "success" });
      return;
    }
  });
};
const onDelete = async (row) => {
  await fetchDeleteProjectForSms(row.sysTemplateId).then((res) => {
    if (res.code == "00000") {
      tableRef.value.reload(form);
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  });
};

const doUpdate = async ($event, row) => {
  fetchUpdateProjectForSms(row).then((res) => {
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
const dialogOpen = async (item, mode) => {
  nextTick(() => {
    saveDialog.value.setData(item).open(mode);
  });
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

const form = reactive({
  sysSmsTemplateName: null,
  sysSmsTemplateCategory: null,
  sysProjectId: null,
});

const params = reactive({
  ...form,
});

const dialogClose = () => {
  visible.save = false;
};

const formRef = ref();
const resetForm = async (ref) => {
  ref?.resetFields();
};
</script>
<template>
  <div class="h-full system-container modern-bg">
    <SaveDialog
      ref="saveDialog"
      :categoryProp="categoryProp"
      :category="categoryData"
      :renderContent="renderContent"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />

    <LogDialog ref="logDialogRef" />
    <SmsDialog ref="smsDialogRef" />
    <SmsSelectDialog ref="smsSelectDialogRef" />

    <el-container>
      <el-header>
        <div class="left-panel">
          <ScForm 
            ref="formRef"
            :inline="true"
            :model="form"
            class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto"
          >
            <ScFormItem label="模板名称" prop="sysSmsTemplateName">
              <ScInput 
                v-model="form.sysSmsTemplateName"
                placeholder="请输入模板名称"
                clearable
                class="!w-[180px]"
              />
            </ScFormItem>

            <ScFormItem label="模板类型" prop="sysSmsTemplateCategory">
              <ScSelect 
                v-model="form.sysSmsTemplateCategory"
                placeholder="请选择类型"
                clearable
                class="w-full min-w-[240px]"
              >
                <ScOption 
                  v-for="item in categoryData"
                  :key="item.sysDictItemId"
                  :value="item.sysDictItemId"
                  :label="item.sysDictItemName"
                />
              </ScSelect>
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
              title="重置"
              :icon="useRenderIcon('ep:refresh')"
              @click="resetForm(formRef)"
            />
            <ScButton 
              title="新增"
              :icon="useRenderIcon('ep:edit')"
              @click="dialogOpen({}, 'save')"
            />
            <ScButton 
              title="测试"
              :icon="useRenderIcon('bi:send')"
              @click="handleAllSend"
            />
            <ScButton 
              title="同步"
              :icon="useRenderIcon('bi:database-down')"
              @click="handleSync"
            />
            <ScButton 
              title="日志"
              :icon="useRenderIcon('ep:files')"
              @click="handleLog"
            />
          </div>
        </div>
      </el-header>
      <el-main>
        <ScTable
          ref="tableRef"
          border
          :search="false"
          :url="fetchPageProjectForSms"
          :params="params"
          class="custom-table-row"
        >
          <ScTableColumn 
            label="序号"
            type="index"
            align="center"
            fixed
            width="60px"
          />
          <ScTableColumn 
            prop="sysSmsTemplateName"
            label="模板名称"
            align="center"
            fixed
            width="340px"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <div>
                <ScTooltip 
                  v-if="row.sysSmsTemplateRemark"
                  :content="row.sysSmsTemplateRemark"
                >
                  <ScTag 
                    :title="row.sysSmsTemplateName"
                    effect="dark"
                    size="small"
                    class="w-[180px] truncate"
                    style="margin-right: 5px"
                  >
                    {{ row.sysSmsTemplateName }}
                  </ScTag>
                  <span
                    style="
                      float: right;
                      color: var(--el-text-color-secondary);
                      font-size: 13px;
                    "
                  >
                    {{ row.sysSmsTemplateCode }}
                  </span>
                </ScTooltip>
                <div v-else>
                  <ScTag 
                    :title="row.sysSmsTemplateName"
                    effect="dark"
                    size="small"
                    class="w-[180px] truncate"
                    style="margin-right: 5px"
                  >
                    {{ row.sysSmsTemplateName }}
                  </ScTag>
                  <span
                    style="
                      float: right;
                      color: var(--el-text-color-secondary);
                      font-size: 13px;
                    "
                  >
                    {{ row.sysSmsTemplateCode }}
                  </span>
                </div>
              </div>
            </template>
          </ScTableColumn>
          <ScTableColumn 
            prop="sysSmsTemplateCategory"
            label="模板类型"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ScTag>{{ row.sysSmsTemplateCategoryLabel || "/" }}</ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn 
            prop="sysSmsTemplateContent"
            label="模板内容"
            min-width="360px"
            align="left"
          >
            <template #default="{ row }">
              <span>{{ row.sysSmsTemplateContent || "/" }}</span>
            </template>
          </ScTableColumn>
          <ScTableColumn 
            prop="sysSmsTemplateStatus"
            label="状态"
            align="center"
          >
            <template #default="{ row }">
              <ScSwitch
                v-model="row.sysSmsTemplateStatus"
                :active-value="1"
                :inactive-value="0"
                layout="modern"
                @click="doUpdate($event, row)"
              />
            </template>
          </ScTableColumn>
          <ScTableColumn 
            prop="sysSmsTemplateSort"
            label="排序"
            align="center"
            width="60px"
          />
          <ScTableColumn 
            prop="updateTime"
            label="最后一次更新时间"
            align="center"
          >
            <template #default="{ row }">
              <span :title="'更新来自' + row.sysSmsTemplateOrigin">{{
                row.updateTime || row.createTime
              }}</span>
            </template>
          </ScTableColumn>

          <ScTableColumn label="操作" fixed="right" align="center">
            <template #default="{ row }">
              <ScButton 
                size="small"
                plain
                link
                type="primary"
                :icon="useRenderIcon('bi:send')"
                @click="handleSend(row)"
              >
                {{ $t("buttons.test") }}
              </ScButton>
              <ScButton 
                size="small"
                plain
                link
                type="primary"
                :icon="useRenderIcon('ep:edit')"
                @click="dialogOpen(row, 'edit')"
              >
                {{ $t("buttons.update") }}
              </ScButton>
              <ScPopconfirm 
                v-if="row.sysSmsTemplateDisabled == 0"
                :title="$t('message.confimDelete')"
                @confirm="onDelete(row)"
              >
                <template #reference>
                  <ScButton 
                    size="small"
                    type="danger"
                    plain
                    link
                    :icon="useRenderIcon('ep:delete')"
                    >{{ $t("buttons.delete") }}</el-button
                  >
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
.template-page {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-container) {
  height: 100%;
}

:deep(.el-header) {
  height: auto !important;
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

:deep(.el-main) {
  padding: 24px;
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
</style>
