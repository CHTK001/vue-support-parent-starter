<script setup lang="ts">
import DictLayout from "./layout.vue";
import { reactive, ref, nextTick } from "vue";
import { fetchPageTemplate, fetchDeleteTemplate, fetchUpdateTemplate } from "@/api/template";
import ScSearch from "@/components/scSearch/index.vue";
import SaveDialog from "./saveItem.vue";
import { useI18n } from "vue-i18n";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { message } from "@/utils/message";
const saveDialog = ref(null);
const tableRef = ref(null);
const params = reactive({
  sysTemplateGroupId: null
});

const { t } = useI18n();
const onClick = data => {
  params.sysTemplateGroupId = data.sysTemplateGroupId;
  onSearch(params);
};

const columns = reactive([
  {
    label: "状态",
    prop: "sysTemplateDelete",
    placeholder: "请选择状态",
    isAdmin: true,
    type: "select",
    children: [
      {
        label: "已删除",
        value: 1
      },
      {
        label: "正常",
        value: 0
      }
    ]
  }
]);

const onSearch = query => {
  const newParams = {};
  Object.assign(newParams, params);
  Object.assign(newParams, query);
  tableRef.value?.reload(newParams);
};

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
  item.sysTemplateGroupId = params.sysTemplateGroupId;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const dialogClose = () => {
  visible.save = false;
};
</script>
<template>
  <div class="h-full">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <el-container>
      <el-aside width="300px">
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-container>
        <el-header>
          <scSearch :columns="columns" :onSearch="onSearch" :show-number="4" :onEdit="dialogOpen" />
        </el-header>
        <el-main class="nopadding">
          <scTable v-if="params.sysTemplateGroupId" ref="tableRef" :url="fetchPageTemplate" :params="params" :row-key="'sysTemplateId'">
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
                <el-button size="small" plain link type="primary" :icon="useRenderIcon(EditPen)" @click="dialogOpen(row, 'edit')">{{ $t("button.update") }}</el-button>
                <el-popconfirm v-if="row.sysSettingInSystem != 1" title="确定删除吗？" @confirm="onDelete(row)">
                  <template #reference>
                    <el-button size="small" type="danger" plain link :icon="useRenderIcon(Delete)">{{ $t("button.delete") }}</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </scTable>
          <el-empty v-else />
        </el-main>
      </el-container>
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
