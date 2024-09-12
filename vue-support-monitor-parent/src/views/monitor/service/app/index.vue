<template>
  <div>
    <ScCard :url="fetchAppPageList" :params="params">
      <template #default="{ row }">
        <el-row class="relation">
          {{ row }}
          <el-col :span="12">
            <ul>
              <li>
                <h4>应用名称</h4>
                <p>{{ row.monitorApplicationName }}</p>
              </li>
              <li>
                <h4>应用说明</h4>
                <p>
                  <el-tag effect="light">{{ item.monitorName }}</el-tag>
                </p>
              </li>
            </ul>
          </el-col>

          <el-col :span="12" class="cursor-pointer">
            <el-progress type="circle" :stroke-width="10" :percentage="item.monitorRequests ? item.monitorRequests?.length : 0" :show-text="true" @click="doOpenApps(item)">
              <template #default="{ percentage }">
                <span class="percentage-value">{{ percentage }}</span>
                <span class="percentage-label">应用</span>
              </template>
            </el-progress>
          </el-col>
        </el-row>

        <div class="bottom">
          <div class="state">
            <el-button circle size="small" icon="el-icon-edit" style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)" />
          </div>
        </div>
      </template>
    </ScCard>
  </div>
</template>
<script setup>
import { fetchAppPageList } from "@/api/monitor/app";
import ScCard from "@/components/ScCard/index.vue";
import { reactive } from "vue";

const params = reactive({
  page: 1,
  pageSize: 10
});
</script>
