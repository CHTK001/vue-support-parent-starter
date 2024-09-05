<script setup lang="ts">
import { fetchDeleteTemplate, fetchPageTemplate, fetchUpdateTemplate, fetchPageTemplateCategoryTree } from "@/api/template";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import Delete from "@iconify-icons/ep/delete";
import Refresh from "@iconify-icons/ep/refresh";
import Edit from "@iconify-icons/ep/edit-pen";
import { nextTick, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import SaveDialog from "./saveItem.vue";
import { ElIcon, ElTag } from "element-plus";
import { markRaw } from "vue";
const saveDialog = ref(null);
const tableRef = ref(null);
const { t } = useI18n();
const params = reactive({
  sysTemplateCategoryId: null
});

const loading = reactive({
  query: false
});
const onSearch = query => {
  const newParams = {};
  Object.assign(newParams, params);
  Object.assign(newParams, query);
  tableRef.value?.reload(newParams);
};

const categoryData = reactive([]);
const categoryProp = reactive({
  label: "sysTemplateCategoryName",
  value: "sysTemplateCategoryId"
});

const onCategory = async () => {
  categoryData.length = 0;
  const { data } = await fetchPageTemplateCategoryTree({});
  categoryData.push(...data);
};
const renderContent = (h, { node, data }) => {
  return h(
    "span",
    {},
    node.data?.sysTemplateCategoryName,
    h(
      "span",
      {
        class: "flex-col justify-end",
        style: "float: right; color: var(--el-text-color-secondary); font-size: 13px"
      },
      data?.sysTemplateCategoryCode
    )
  );
};
onMounted(() => {
  onCategory();
});
const onDelete = async row => {
  await fetchDeleteTemplate(row.sysTemplateId).then(res => {
    if (res.code == "00000") {
      tableRef.value.reload(params);
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  });
};

const doUpdate = async ($event, row) => {
  fetchUpdateTemplate(row);
};

const visible = reactive({
  save: false
});
const saveDialogParams = reactive({
  mode: "save"
});
const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const form = reactive({
  sysTemplateName: null,
  SysTemplateCategoryId: null
});

const dialogClose = () => {
  visible.save = false;
};

const formRef = ref();
const resetForm = async ref => {
  ref?.resetFields();
};
</script>
<template>
  <div class="h-full">
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :categoryProp="categoryProp"
      :category="categoryData"
      :renderContent="renderContent"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto">
            <el-form-item label="模板名称" prop="sysTemplateName">
              <el-input v-model="form.sysTemplateName" placeholder="请输入模板名称" clearable class="!w-[180px]" />
            </el-form-item>

            <el-form-item label="模板类型" prop="SysTemplateCategoryId">
              <el-tree-select
                v-model="form.SysTemplateCategoryId"
                :props="categoryProp"
                placeholder="请选择类型"
                :data="categoryData"
                check-strictly
                :render-after-expand="false"
                :render-content="renderContent"
                class="w-full min-w-[240px]"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
            <el-button :icon="useRenderIcon(markRaw(Refresh))" @click="resetForm(formRef)" />
            <el-button :icon="useRenderIcon(markRaw(Edit))" @click="dialogOpen({}, 'save')" />
          </div>
        </div>
      </el-header>
      <el-main>
        <scTable ref="tableRef" :url="fetchPageTemplate" :params="params" :row-key="'sysTemplateId'">
          <el-table-column label="序号" type="index" align="center" fixed width="60px" />
          <el-table-column prop="sysTemplateName" label="模板名称" align="center" fixed width="240px">
            <template #default="{ row }">
              <div>
                <el-tooltip v-if="row.sysTemplateRemark" :content="row.sysTemplateRemark">
                  <el-tag :type="row.sysTemplateType" effect="dark" size="small" style="margin-right: 5px">
                    {{ row.sysTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysTemplateCode }}
                  </span>
                </el-tooltip>
                <div v-else>
                  <el-tag :type="row.sysTemplateType" effect="dark" size="small" style="margin-right: 5px">
                    {{ row.sysTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysTemplateCode }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateManufacturerName" label="适用厂家" />
          <el-table-column prop="sysTemplateCategoryName" label="模板类型">
            <template #default="{ row }">
              <el-tag>{{ row.sysTemplateCategoryName || "/" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateContent" label="模板内容" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.sysTemplateContent || "/" }}
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateStatus" label="状态" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.sysTemplateStatus" :active-value="1" :inactive-value="0" @click="doUpdate($event, row)" />
              <!-- <el-tag :type="!row.sysTemplateStatus || row.sysTemplateStatus == 1 ? 'success' : 'danger'" effect="dark" size="small">
                  {{ !row.sysTemplateStatus || row.sysTemplateStatus == 1 ? "启用" : "禁用" }}
                </el-tag> -->
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateSort" label="模板排序" align="center" />

          <el-table-column label="操作" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" plain link type="primary" :icon="useRenderIcon(markRaw(Edit))" @click="dialogOpen(row, 'edit')">{{ $t("button.update") }}</el-button>
              <el-popconfirm v-if="row.sysSettingInSystem != 1" title="确定删除吗？" @confirm="onDelete(row)">
                <template #reference>
                  <el-button size="small" type="danger" plain link :icon="useRenderIcon(markRaw(Delete))">{{ $t("button.delete") }}</el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </scTable>
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
</style>
