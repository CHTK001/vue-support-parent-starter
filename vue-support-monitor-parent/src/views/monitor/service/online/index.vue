<template>
  <div>
    <div class="h-[100px] p-4">
      <div class="flex flex-[2] justify-end">
        <div class="w-[300px] flex">
          <el-select v-model="countDownTime" class="w-[100px] basis-2/4">
            <el-option :value="5" label="5s" />
            <el-option :value="10" label="10s" />
            <el-option :value="20" label="20s" />
            <el-option :value="30" label="30s" />
            <el-option :value="60" label="60" />
          </el-select>
          <ScCountDown v-model="countDownTime" :loop="true" class="block basis-2/4 pl-2 mt-[3px]" @finish="refresh">
            <template #default="{ row }">
              <span>{{ row.seconds }}s 后刷新数据</span>
            </template>
          </ScCountDown>
        </div>
      </div>
    </div>
    <div class="h-full pl-4 pr-4">
      <ScCard :data="data.tableData" :params="params">
        <template #default="{ row }">
          <div clas="flex flex-1">
            <el-descriptions border :column="2" class="w-full" :title="row.metadata?.applicationName">
              <template #title>
                <span>
                  {{ row.metadata?.applicationName }}
                  <el-tooltip :content="row.metadata?.applicationActiveInclude" placement="top" effect="dark">
                    <el-icon><component :is="useRenderIcon('humbleicons:activity')" /></el-icon>
                  </el-tooltip>
                </span>
              </template>
              <el-descriptions-item label="应用">{{ row.metadata?.applicationName }}</el-descriptions-item>
              <el-descriptions-item label="地址">{{ row.metadata?.applicationHost }}:{{ row.metadata?.applicationPort }}</el-descriptions-item>
              <el-descriptions-item label="环境">
                {{ row.metadata?.applicationActive }}
              </el-descriptions-item>
              <el-descriptions-item label="配置">
                <el-icon class="cursor-pointer" title="大屏" @click="doDatav(row)"><component :is="useRenderIcon('simple-icons:databricks')" /></el-icon>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </template>
      </ScCard>
    </div>
  </div>
</template>
<script setup>
import { fetchServiceList } from "@/api/monitor/service";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ScCard from "@/components/scCard/index.vue";
import ScCountDown from "@/components/ScCountDown/index.vue";
import { markRaw, onMounted, reactive, ref } from "vue";
import { Base64 } from "js-base64";
import { router } from "@/router";

const params = reactive({
  page: 1,
  pageSize: 10,
  uriSpec: "monitor"
});

const data = reactive({
  tableData: markRaw([])
});

const countDownTime = ref(10);
const getData = () => {
  fetchServiceList(params).then(res => {
    data.tableData = res.data;
  });
};
const refresh = () => {
  fetchServiceList(params).then(res => {
    data.tableData = res.data;
  });
};

const doDatav = item => {
  router.push({
    path: "/datav",
    query: {
      data: Base64.encode(JSON.stringify(item)),
      appName: item.metadata.applicationName
    }
  });
};

onMounted(async () => {
  getData();
});
</script>
<style lang="scss" scoped>
:deep(.el-descriptions__body .el-descriptions__table) {
  white-space: nowrap;
}
:deep(.el-descriptions-item__content) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}
</style>
