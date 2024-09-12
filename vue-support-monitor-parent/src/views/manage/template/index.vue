<script setup lang="ts">
import { fetchDeleteTemplate, fetchPageTemplate, fetchUpdateTemplate } from "@/api/template";
import { fetchListDictItem, fetchPListDictItem } from "@/api/dict";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import Delete from "@iconify-icons/ep/delete";
import Edit from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/ep/refresh";
import { ElTag } from "element-plus";
import { markRaw, nextTick, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import SaveDialog from "./save.vue";

const tableRef = ref(null);
const saveDialog = ref(null);
const templateDialogRef = ref(null);
const { t } = useI18n();
const params = reactive({
  sysDictItemId2: null
});

const loading = reactive({
  query: false
});
const onSearch = query => {
  const newParams = {};
  Object.assign(newParams, params);
  Object.assign(newParams, form);
  Object.assign(newParams, query);
  tableRef.value?.reload(newParams);
};

const cloudData = reactive([]);
const categoryData = reactive([]);
const categoryDataKinds = reactive([]);
const categoryProp = reactive({
  label: "sysDictItemName",
  value: "SysDictItemId"
});

const onCloud = async () => {
  cloudData.length = 0;
  const { data } = await fetchListDictItem({ sysDictId: 1 });
  cloudData.push(...data);
};
const onCategory = async () => {
  categoryData.length = 0;
  const { data } = await fetchListDictItem({ sysDictId: 2 });
  categoryData.push(...data);
};

const onCategoryKind = async () => {
  categoryDataKinds.length = 0;
  const { data } = await fetchPListDictItem({
    sysDictId: 2
  });
  categoryDataKinds.push(...data);
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
        style: "float: right; color: var(--el-text-color-secondary); font-size: 13px"
      },
      data?.sysDictItemCode
    )
  );
};
onMounted(() => {
  onCloud();
  onCategory();
  onCategoryKind();
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
  save: false,
  template: false
});
const saveDialogParams = reactive({
  mode: "save"
});
const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
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
  sysDictItemId3: null
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
      :category-kinds="categoryDataKinds"
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

            <el-form-item label="适用厂家" prop="sysDictItemId1">
              <el-select v-model="form.sysDictItemId1" placeholder="请选择适用厂家" clearable class="w-full min-w-[240px]">
                <el-option v-for="item in cloudData" :key="item.sysDictItemId" :value="item.sysDictItemId" :label="item.sysDictItemName" />
              </el-select>
            </el-form-item>

            <el-form-item label="模板类型" prop="sysDictItemId2">
              <el-select v-model="form.sysDictItemId2" placeholder="请选择类型" clearable class="w-full min-w-[240px]">
                <el-option v-for="item in categoryData" :key="item.sysDictItemId" :value="item.sysDictItemId" :label="item.sysDictItemName" />
              </el-select>
            </el-form-item>

            <el-form-item label="模板子类型" prop="sysDictItemId3">
              <el-select v-model="form.sysDictItemId3" placeholder="请选择类型" clearable class="w-full min-w-[240px]">
                <el-option v-for="item in categoryDataKinds" :key="item.sysDictItemId" :value="item.sysDictItemId" :label="item.sysDictItemName" />
              </el-select>
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
        <scTable ref="tableRef" :url="fetchPageTemplate" :params="params" class="custom-table-row">
          <el-table-column label="序号" type="index" align="center" fixed width="60px" />
          <el-table-column prop="sysTemplateName" label="模板名称" align="center" fixed width="340px" show-overflow-tooltip>
            <template #default="{ row }">
              <div>
                <el-tooltip v-if="row.sysTemplateRemark" :content="row.sysTemplateRemark">
                  <el-tag :title="row.sysTemplateName" effect="dark" size="small" class="w-[180px] truncate" style="margin-right: 5px">
                    {{ row.sysTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysTemplateCode }}
                  </span>
                </el-tooltip>
                <div v-else>
                  <el-tag :title="row.sysTemplateName" effect="dark" size="small" class="w-[180px] truncate" style="margin-right: 5px">
                    {{ row.sysTemplateName }}
                  </el-tag>
                  <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysTemplateCode }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="sysDictItem1Name" label="适用厂家" width="90px" show-overflow-tooltip />
          <el-table-column prop="sysDictItem2Name" label="模板类型" width="90px" show-overflow-tooltip>
            <template #default="{ row }">
              <el-tag>{{ row.sysDictItem2Name || "/" }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateContent" label="模板内容" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              <span>{{ row.sysTemplateContent || "/" }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateStatus" label="状态" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.sysTemplateStatus" :active-value="1" :inactive-value="0" @click="doUpdate($event, row)" />
            </template>
          </el-table-column>
          <el-table-column prop="sysTemplateSort" label="排序" align="center" width="60px" />
          <el-table-column prop="createTime" label="创建时间" align="center" />
          <el-table-column prop="updateTime" label="更新时间" align="center" />

          <el-table-column label="操作" fixed="right" align="center">
            <template #default="{ row }">
              <el-button size="small" plain link type="primary" :icon="useRenderIcon(markRaw(Edit))" @click="dialogOpen(row, 'edit')">
                {{ $t("buttons.update") }}
              </el-button>
              <el-popconfirm v-if="row.sysTemplateDisabled == 0" title="确定删除吗？" @confirm="onDelete(row)">
                <template #reference>
                  <el-button size="small" type="danger" plain link :icon="useRenderIcon(markRaw(Delete))">{{ $t("buttons.delete") }}</el-button>
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
/* 在这里引入你的自定义CSS类 */
.custom-table-row {
  --el-table-row-height: 60px; /* 设置行高为60像素 */
}
</style>
