<script setup lang="ts">
import DictLayout from "./layout.vue";
import { reactive, ref } from "vue";
import { fetchPageDictItem } from "@/api/dict";

const userLayout = ref(null);
const params = reactive({
  sysDictId: null
});
const onClick = data => {
  params.sysDictId = data.sysDictId;
};
</script>
<template>
  <div class="h-full">
    <el-container>
      <el-aside width="300px">
        <DictLayout :nodeClick="onClick" />
      </el-aside>
      <el-container>
        <el-main class="nopadding">
          <scTable
            :url="fetchPageDictItem"
            :params="params"
            :row-key="'sysDictItemId'"
          />
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
