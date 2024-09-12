<template>
  <div class="p-3">
    <ScCard :url="fetchAppPageList" :params="params">
      <template #default="{ row }">
        <el-row class="relation">
          <el-col :span="12">
            <ul>
              <li>
                <h4>应用名称</h4>
                <p>{{ row.monitorApplicationName }}</p>
              </li>
              <li>
                <h4>应用说明</h4>
                <p>
                  <el-tag effect="light">{{ row.monitorName }}</el-tag>
                </p>
              </li>
            </ul>
          </el-col>

          <el-col :span="12" class="cursor-pointer">
            <el-progress type="circle" :stroke-width="10" :percentage="row?.monitorRequests ? row.monitorRequests?.length : 0" :show-text="true" @click="doOpenApps(row)">
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}</span>
                <span class="percentage-label">应用</span>
              </template>
            </el-progress>
          </el-col>
        </el-row>

        <div class="bottom">
          <div class="state">
            <el-button circle size="small" :icon="useRenderIcon('ep:edit')" style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)" />
          </div>
        </div>
      </template>
    </ScCard>
    <InfoDialog v-if="infoDialogStatus" ref="infoDialogRef" />
  </div>
</template>
<script setup>
import { fetchAppPageList } from "@/api/monitor/app";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ScCard from "@/components/ScCard/index.vue";
import { markRaw, reactive, ref } from "vue";
import Info from "./info.vue";

const InfoDialog = markRaw(Info);
const params = reactive({
  page: 1,
  pageSize: 10
});

const infoDialogStatus = ref(false);
const infoDialogRef = ref();

const doOpenApps = async item => {
  infoDialogStatus.value = true;
  await $nextTick;
  infoDialogRef.value.open("view").setData(item);
};
</script>
