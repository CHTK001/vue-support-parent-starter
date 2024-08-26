<script setup lang="ts">
import DeptLayout from "./layout.vue";
import UserLayout from "../user/layout.vue";
import { reactive, ref } from "vue";

const userLayout = ref(null);
const params = reactive({
  sysDeptId: null
});
const onClick = data => {
  Object.assign(params, data);
  userLayout.value.onQuery(params);
};
</script>
<template>
  <div class="h-full">
    <el-container>
      <el-aside width="300px">
        <DeptLayout :nodeClick="onClick" />
      </el-aside>
      <el-container>
        <el-main class="nopadding">
          <UserLayout
            ref="userLayout"
            :sysDeptId="params.sysDeptId"
            :showTool="false"
            :showQuery="false"
            mode="view"
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
