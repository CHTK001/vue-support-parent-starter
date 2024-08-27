<script setup lang="ts">
import DictLayout from "./layout.vue";
import { reactive, ref } from "vue";
import { fetchPageDictItem } from "@/api/dict";
import ScSearch from "@/components/scSearch/index.vue";
import SaveDialog from "./save.vue";
const tableRef = ref(null);
const params = reactive({
  sysDictId: null
});
const onClick = data => {
  params.sysDictId = data.sysDictId;
};

const columns = reactive([]);

const onSearch = params => {
  tableRef.value.onSearch(params);
};

const visible = reactive({
  save: false
});
const saveDialogParams = reactive({
  mode: "save",
  item: null,
  sysDictId: null,
  sysDictCode: null,
  sysDictName: null,
  sysDictPid: null
});
const dialogOpen = (item, mode) => {
  visible.save = true;
  saveDialogParams.mode = mode;
  saveDialogParams.item = item;
  saveDialogParams.sysDictId = params.sysDictId;
  saveDialogParams.sysDictCode = item.sysDictCode;
  saveDialogParams.sysDictName = item.sysDictName;
  saveDialogParams.sysDictPid = item.sysDictPid;
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
            :row-key="'sysDictItemId'"
          />
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
