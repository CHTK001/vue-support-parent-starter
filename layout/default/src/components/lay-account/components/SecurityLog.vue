<script setup>
import { getMineLogs } from "@repo/core";
import { deviceDetection } from "@pureadmin/utils";
import { $t } from "@repo/config";

defineOptions({
  name: "SecurityLog"
});
</script>

<template>
  <div :class="['min-w-[180px] h-full', deviceDetection() ? 'max-w-[100%]' : 'max-w-[90%]']">
    <h3 class="my-8">{{ $t("buttons.securityLog") }}</h3>
    <ScTable :url="getMineLogs" border>
      <ScTableColumn :label="$t('field.ipAddress')" prop="sysLogIp">
        <template #default="{ row }">
          <span>{{ row.sysLogIp }}</span>
          <span v-if="row.sysLogAddress" style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
            {{ row.sysLogAddress }}
          </span>
        </template>
      </ScTableColumn>
      <ScTableColumn :label="$t('field.system')" prop="sysLogSystem" />
      <ScTableColumn :label="$t('field.browser')" prop="sysLogBrowser" />
      <ScTableColumn :label="$t('field.time')" prop="createTime" />
    </ScTable>
  </div>
</template>
