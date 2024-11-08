<script setup>
import { getMineLogs } from "@/api/manage/user";
import { deviceDetection } from "@pureadmin/utils";

defineOptions({
  name: "SecurityLog"
});
</script>

<template>
  <div :class="['min-w-[180px] h-full', deviceDetection() ? 'max-w-[100%]' : 'max-w-[90%]']">
    <h3 class="my-8">{{ $t("buttons.securityLog") }}</h3>
    <ScTable :url="getMineLogs" border>
      <el-table-column :label="$t('field.ipAddress')" prop="sysLogIp">
        <template #default="{ row }">
          <span>{{ row.sysLogIp }}</span>
          <span v-if="row.sysLogAddress" style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
            {{ row.sysLogAddress }}
          </span>
        </template>
      </el-table-column>
      <el-table-column :label="$t('field.system')" prop="sysLogSystem" />
      <el-table-column :label="$t('field.browser')" prop="sysLogBrowser" />
      <el-table-column :label="$t('field.time')" prop="createTime" />
    </ScTable>
  </div>
</template>
