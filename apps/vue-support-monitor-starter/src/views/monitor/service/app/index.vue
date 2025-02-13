<template>
  <div class="p-4">
    <div class="w-[70px] flex justify-between mb-4">
      <div class="flex justify-start">
        <el-button :icon="useRenderIcon('ri:add-fill')" @click="doEdit({}, 'add')" />
      </div>
    </div>
    <div style="height: calc(100% - 70px)">
      <ScCard ref=" dataRef" :url="fetchAppPageList" :params="params" :span="4" :lg="6">
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
              <el-progress type="circle" :stroke-width="10" title="在线服务"
                :percentage="row?.monitorRequests ? row.monitorRequests?.length : 0" :show-text="true">
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
              <el-button circle size="small" :icon="useRenderIcon('ep:edit')" style="font-size: 16px"
                class="cursor-pointer" title="编辑" @click="doEdit(row, 'edit')" />
              <el-popconfirm :title="$t('message.confimDelete')" @confirm="doDelete(row)">
                <template #reference>
                  <el-button circle size="small" type="danger" :icon="useRenderIcon('ep:delete')"
                    style="font-size: 16px" class="cursor-pointer" title="删除" />
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </ScCard>
    </div>
    <component :is="InfoDialog" ref="infoDialogRef" />
    <SaveDialog ref="saveDialogRef" @success="handleSuccess" />
  </div>
</template>
<script setup>
import { fetchAppPageList, fetchAppDelete } from "@/api/monitor/app";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import ScCard from "@repo/components/ScCard/index.vue";
import { markRaw, reactive, ref, nextTick, onMounted, defineAsyncComponent } from "vue";
// import InfoDialog from "./info.vue";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const InfoDialog = defineAsyncComponent(() => import("./info.vue"));
// const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const params = reactive({
  page: 1,
  pageSize: 10
});
const dataRef = ref();

const infoDialogStatus = ref(false);
const infoDialogStatusSync = ref(false);
const infoDialogRef = ref();

const doOpenApps = async item => {
  infoDialogStatus.value = true;
  nextTick(async () => {
    infoDialogRef.value.setData(item);
    infoDialogRef.value.open("view");
  });
};

const saveDialogStatus = ref(false);
const saveDialogRef = ref();
const doEdit = async (item, mode) => {
  saveDialogStatus.value = true;
  await nextTick();
  saveDialogRef.value.setData(item);
  saveDialogRef.value.open(mode);
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

onMounted(() => {
  infoDialogStatusSync.value = true;
});
</script>
<style lang="scss" scoped>
.bottom {
  border-top: 1px solid #ebeef5;
  text-align: right;
  padding-top: 10px;
  align-items: center;
}
</style>
