<script setup lang="ts">
import DictLayout from "./layout.vue";
import { reactive, ref, nextTick } from "vue";
import { fetchPageDictItem } from "@/api/dict";
import ScSearch from "@/components/scSearch/index.vue";
import SaveDialog from "./saveItem.vue";
const saveDialog = ref(null);
const tableRef = ref(null);
const params = reactive({
  sysDictId: null
});
const onClick = data => {
  params.sysDictId = data.sysDictId;
};

const columns = reactive([]);

const onSearch = query => {
  const newParams = {};
  Object.assign(newParams, params);
  Object.assign(newParams, query);
  tableRef.value.reload(newParams);
};

const visible = reactive({
  save: false
});
const saveDialogParams = reactive({
  mode: "save"
});
const dialogOpen = async (item, mode) => {
  visible.save = true;
  item.sysDictId = params.sysDictId;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const dialogClose = () => {
  visible.save = false;
};
</script>
<template>
  <div class="h-full">
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
    <el-container>
      <el-aside width="300px">
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-container>
        <el-header>
          <scSearch
            :columns="columns"
            :onSearch="onSearch"
            :show-number="4"
            :onEdit="dialogOpen"
          />
        </el-header>
        <el-main class="nopadding">
          <scTable
            v-if="params.sysDictId"
            ref="tableRef"
            :url="fetchPageDictItem"
            :params="params"
            border
            :row-key="'sysDictItemId'"
          >
            <el-table-column
              label="序号"
              type="index"
              align="center"
              fixed
              width="60px"
            />
            <el-table-column
              prop="sysDictItemName"
              label="字典项名称"
              align="center"
              fixed
            >
              <template #default="{ row }">
                <el-tag
                  :type="row.sysDictItemType"
                  effect="dark"
                  size="small"
                  style="margin-right: 5px"
                >
                  {{ row.sysDictItemName }}
                </el-tag>
                <span
                  style="
                    float: right;
                    color: var(--el-text-color-secondary);
                    font-size: 13px;
                  "
                >
                  {{ row.sysDictItemCode }}
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="sysDictItemI18n"
              label="字典项i18n"
              align="center"
            />
            <el-table-column
              prop="sysDictItemCode"
              label="字典项编码"
              align="center"
            />
            <el-table-column
              prop="sysDictItemStatus"
              label="状态"
              align="center"
            >
              <template #default="{ row }">
                <el-tag
                  :type="
                    !row.sysDictItemStatus || row.sysDictItemStatus == 1
                      ? 'success'
                      : 'danger'
                  "
                  effect="dark"
                  size="small"
                >
                  {{
                    !row.sysDictItemStatus || row.sysDictItemStatus == 1
                      ? "启用"
                      : "禁用"
                  }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              prop="sysDictItemSort"
              label="字典项排序"
              align="center"
            />
            <el-table-column
              prop="sysDictItemSort"
              label="字典项优先级"
              align="center"
            />
            <el-table-column
              prop="sysDictItemRemark"
              label="字典项备注"
              align="center"
            />
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
