<template>
  <div class="p-3 pb-8">
    <div>
      <div class="flex justify-end">
        <el-button type="primary" :icon="useRenderIcon('ep:plus')" @click="doEdit({}, 'add')" />
      </div>
    </div>
    <ScCard ref="dataRef" :url="fetchAppPageList" :params="params">
      <template #default="{ row }">
        <el-row class="relation el-text">
          <el-col :span="12">
            <ul>
              <li>
                <h4>应用名称</h4>
                <p>
                  <el-tag>{{ row.monitorApplicationName }}</el-tag>
                </p>
              </li>
              <li>
                <h4>应用说明</h4>
                <p>
                  <el-tag effect="light">{{ row.monitorName }}</el-tag>
                </p>
              </li>
            </ul>
          </el-col>

          <el-col :span="12" class="cursor-pointer" @click="doOpenApps(row)">
            <el-progress type="circle" :stroke-width="10" title="在线服务" :percentage="row?.monitorRequests ? row.monitorRequests?.length : 0" :show-text="true">
              <template #default="{ percentage }">
                <span class="percentage-value">
                  <b class="text-lg">{{ percentage }}</b>
                </span>
                <span class="percentage-label" />
              </template>
            </el-progress>
          </el-col>
        </el-row>

        <div class="bottom justify-start flex">
          <div class="state">
            <el-button circle size="small" :icon="useRenderIcon('ep:edit')" style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(row, 'edit')" />
            <el-popconfirm title="确定删除吗？" @confirm="doDelete(row)">
              <template #reference>
                <el-button circle size="small" type="danger" :icon="useRenderIcon('ep:delete')" style="font-size: 16px" class="cursor-pointer" title="删除" />
              </template>
            </el-popconfirm>
          </div>
        </div>
      </template>
    </ScCard>
    <Suspense>
      <template #default>
        <div>
          <InfoDialog v-if="infoDialogStatus" ref="infoDialogRef" />
          <SaveDialog v-if="saveDialogStatus" ref="saveDialogRef" @success="handleSuccess" />
        </div>
      </template>
    </Suspense>
  </div>
</template>
<script setup>
import { fetchAppPageList, fetchAppDelete } from "@/api/monitor/app";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ScCard from "@/components/ScCard/index.vue";
import { markRaw, reactive, ref, nextTick, defineComponent, defineAsyncComponent } from "vue";
// import InfoDialog from "./info.vue";
// import SaveDialog from "./save.vue";

const InfoDialog = defineAsyncComponent(() => import("./info.vue"));
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const params = reactive({
  page: 1,
  pageSize: 10
});
const dataRef = ref();

const infoDialogStatus = ref(false);
const infoDialogRef = ref();

const doOpenApps = async item => {
  infoDialogStatus.value = true;
  await nextTick();
  setTimeout(() => {
    infoDialogRef.value.setData(item).open("view");
  }, 300);
};

const saveDialogStatus = ref(false);
const saveDialogRef = ref();
const doEdit = async (item, mode) => {
  saveDialogStatus.value = true;
  await nextTick();
  saveDialogRef.value.setData(item).open(mode);
};

const doDelete = async item => {
  const res = await fetchAppDelete({ id: item.monitorId });
  if (res.code === "00000") {
    this.$message.success("操作成功");
    dataRef.value.refresh();
    return false;
  }

  this.$message.error(res.msg);
};
const handleSuccess = (res, mode) => {
  dataRef.value.refresh();
};
</script>
<style lang="scss" scoped>
.bottom {
  border-top: 1px solid #ebeef5;
  text-align: right;
  padding-top: 10px;
  align-items: center;
}
</style>
