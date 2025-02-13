<script setup>
import { fetchDeleteProjectForEmail, fetchPageProjectForEmail, fetchSyncProjectForEmail, fetchUpdateProjectForEmail } from "@/api/manage/project-email";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { ElTag } from "element-plus";
import { defineAsyncComponent, nextTick, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const EmailDialog = defineAsyncComponent(() => import("./email.vue"));
const LogDialog = defineAsyncComponent(() => import("./log.vue"));
const emailSelectDialogRef = ref();
const emailDialogRef = ref();
const logDialogRef = ref();
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
  emailDialogRef.value.handleOpen(row);
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
  form.sysProjectId = env.sysProjectId;
};

const handleAllSend = async () => {
  emailSelectDialogRef.value.handleOpen(env);
};

const handleLog = async () => {
  logDialogRef.value.handleOpen(env);
};

const handleSync = async () => {
  fetchSyncProjectForEmail(env).then((res) => {
    if (res.code == "00000") {
      message(t("message.syncSuccess"), { type: "success" });
      return;
    }
  });
};
const onDelete = async (row) => {
  await fetchDeleteProjectForEmail(row.sysTemplateId).then((res) => {
    if (res.code == "00000") {
      tableRef.value.reload(form);
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  });
};

const doUpdate = async ($event, row) => {
  fetchUpdateProjectForEmail(row).then((res) => {
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
    saveDialog.value.setData(item).setTableData(env).open(mode);
  });
};
const templateOpen = async (item, mode) => {
  visible.template = true;
  await nextTick();
  mode = item.sysTemplateDisabled == 1 ? "show" : mode;
  templateDialogRef.value.open(mode);
};

const form = reactive({
  sysTemplateName: null,
  sysDictItemId1: null,
  sysDictItemId2: null,
  sysDictItemId3: null,
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
  <div class="h-full">
    <SaveDialog ref="saveDialog" :categoryProp="categoryProp" :category="categoryData" :renderContent="renderContent"
      :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />

    <LogDialog ref="logDialogRef" />
    <EmailDialog ref="emailDialogRef" />

    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="form"
            class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto">
            <el-form-item label="模板名称" prop="sysEmailTemplateName">
              <el-input v-model="form.sysTemplateName" placeholder="请输入模板名称" clearable class="!w-[180px]" />
            </el-form-item>

            <el-form-item label="模板类型" prop="sysEmailTemplateCategory">
              <el-select v-model="form.sysEmailTemplateCategory" placeholder="请选择类型" clearable
                class="w-full min-w-[240px]">
                <el-option v-for="item in categoryData" :key="item.sysDictItemId" :value="item.sysDictItemId"
                  :label="item.sysDictItemName" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query"
              @click="onSearch" />
            <el-button title="刷新" :icon="useRenderIcon('ep:refresh')" @click="resetForm(formRef)" />
            <el-button title="新增" :icon="useRenderIcon('ep:edit')" @click="dialogOpen({}, 'save')" />
            <el-button title="日志" :icon="useRenderIcon('ep:files')" @click="handleLog" />
          </div>
        </div>
      </el-header>
      <el-main>
        <ScTable ref="tableRef" border :search="false" :url="fetchPageProjectForEmail" :params="params"
          class="custom-table-row">
          <el-table-column label="序号" type="index" align="center" fixed width="60px" />
          <el-table-column prop="sysEmailTemplateName" label="模板名称" align="center" fixed width="340px"
            show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-tooltip v-if="row.sysEmailTemplateRemark" :content="row.sysEmailTemplateRemark">
                  <el-tag :title="row.sysEmailTemplateName" effect="dark" size="small" class="w-[180px] truncate"
                    style="margin-right: 5px">
                    {{ row.sysTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysEmailTemplateCode }}
                  </span>
                </el-tooltip>
                <div v-else>
                  <el-tag :title="row.sysEmailTemplateName" effect="dark" size="small" class="w-[180px] truncate"
                    style="margin-right: 5px">
                    {{ row.sysEmailTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysEmailTemplateCode }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysEmailTemplateCategory" label="模板类型" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag>{{ row.sysEmailTemplateCategoryLabel || "/" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysEmailTemplateContent" label="模板内容" min-width="360px" align="center"
            show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.sysEmailTemplateContent || "/" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysEmailTemplateStatus" label="状态" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.sysEmailTemplateStatus" :active-value="1" :inactive-value="0"
                @click="doUpdate($event, row)" />
            </template>
          </el-table-column>
          <el-table-column prop="sysEmailTemplateSort" label="排序" align="center" width="60px" />
          <el-table-column prop="updateTime" label="最后一次更新时间" align="center">
            <template #default="{ row }">
              <span :title="'更新来自' + row.sysEmailTemplateOrigin">{{ row.updateTime || row.createTime }}</span>
            </template>
          </el-table-column>

          <el-table-column label="操作" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" plain link type="primary" :icon="useRenderIcon('bi:send')"
                @click="handleSend(row)">
                {{ $t("buttons.test") }}
              </el-button>
              <el-button size="small" plain link type="primary" :icon="useRenderIcon('ep:edit')"
                @click="dialogOpen(row, 'edit')">
                {{ $t("buttons.update") }}
              </el-button>
              <el-popconfirm v-if="row.sysEmailTemplateDisabled == 0" :title="$t('message.confimDelete')"
                @confirm="onDelete(row)">
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
