<script setup>
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { computed, nextTick, reactive, ref, watch } from "vue";

import { fetchDeleteRole } from "@/api/role";
import { fetchPageUserLog } from "@/api/user-log";
import { transformI18n } from "@/plugins/i18n";
import { message } from "@/utils/message";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import DetailLayout from "./detail.vue";

const { t } = useI18n();
const detailRef = ref(null);
const form = reactive({
  sysLogUsername: "",
  sysLogFrom: "",
  sysLogStatus: null,
  sysLogIp: null,
  startDate: null,
  endDate: null
});

const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]"
  ];
});
const visible = reactive({
  save: false,
  role: false,
  detail: false
});

const transform = value => {
  value = String(value || "").toUpperCase();
  const _value = moduleOptions.filter(item => {
    if (item.value == value) {
      return item.label;
    }
  });
  return _value || _value.length > 0 ? _value?.[0]?.label : transformI18n("module.other");
};
const loading = reactive({
  query: false,
  menu: false
});
const sysLogTime = ref([]);
watch(
  sysLogTime,
  newValue => {
    form.startDate = newValue?.[0];
    form.endDate = newValue?.[1];
  },
  { deep: true, immediate: true }
);
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  1000,
  true
);

const openDetail = async row => {
  visible.detail = true;
  await nextTick();
  detailRef.value.setData(row).open("view");
};

const contentRef = ref();
const moduleOptions = reactive([
  { label: transformI18n("module.login"), value: "LOGIN" },
  { label: transformI18n("module.logout"), value: "LOGOUT" }
]);
</script>

<template>
  <div class="main">
    <DetailLayout v-if="visible.detail" ref="detailRef" :moduleOptions="moduleOptions" />
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" label-width="40px" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
            <el-form-item label="账号" prop="sysLogUsername">
              <el-input v-model="form.sysLogUsername" placeholder="请输入账号名称" clearable class="!w-[180px]" />
            </el-form-item>
            <el-form-item label="模块" prop="sysLogFrom">
              <el-select v-model="form.sysLogFrom" placeholder="请选择模块" clearable class="!w-[180px]">
                <el-option v-for="item in moduleOptions" :key="item.value" :value="item.value" :label="item.label">
                  {{ item.label }}
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="sysLogStatus">
              <el-select v-model="form.sysLogStatus" class="!w-[180px]" clearable>
                <el-option :value="1" label="成功">成功</el-option>
                <el-option :value="0" label="失败">失败</el-option>
              </el-select>
            </el-form-item>
            <el-form-item label=" IP" prop="sysLogIp">
              <el-input v-model="form.sysLogIp" placeholder="请输入IP" clearable class="!w-[180px]" />
            </el-form-item>
            <el-form-item label="时间" prop="sysLogTime">
              <el-date-picker
                v-model="sysLogTime"
                type="datetimerange"
                :start-placeholder="transformI18n('module.startDate')"
                :end-placeholder="transformI18n('module.endDate')"
                format="YYYY-MM-DD HH:mm:ss"
                date-format="YYYY-MM-DD ddd"
                time-format="A hh:mm:ss"
              />
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <div class="flex-1">
              <div>
                <div class="flex flex-wrap flex-row">
                  <div class="flex-1" />
                  <div class="flex flex-row flex-1 justify-center">
                    <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
                    <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-header>
      <el-main class="nopadding">
        <div ref="contentRef" class="h-full flex">
          <div :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'" style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
            <ScTable ref="table" :url="fetchPageUserLog" border :rowClick="openDetail">
              <el-table-column label="创建时间" prop="createTime" align="center" show-overflow-tooltip min-width="120px" />
              <el-table-column label="账号名称" prop="sysLogUsername" align="center" show-overflow-tooltip min-width="120px" />
              <el-table-column label="模块" prop="sysLogFrom" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>{{ transform(row.sysLogFrom) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="请求IP" prop="sysLogIp" align="center" show-overflow-tooltip min-width="160px">
                <template #default="{ row }">
                  <span>{{ row.sysLogIp }}</span>
                  <span v-if="row.sysLogAddress" style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                    {{ row.sysLogAddress }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="运营商" prop="sysLogIsp" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag v-if="row.sysLogIsp">{{ row.sysLogIsp }}</el-tag>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="地址" prop="sysLogUrl" align="center" show-overflow-tooltip />
              <el-table-column label="登录方式" prop="sysLogLoginType" align="center" width="140px">
                <template #default="{ row }">
                  {{ transformI18n(row.sysLogLoginType) }}
                </template>
              </el-table-column>
              <el-table-column label="userAgent" prop="sysLogUa" align="center" show-overflow-tooltip min-width="120px" />

              <el-table-column label="状态" prop="sysLogStatus" align="center" width="100px" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag v-if="row.sysLogStatus == 1" type="success">成功</el-tag>
                  <el-tag v-else-if="row.sysLogStatus == 0" type="danger">失败</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="耗时" prop="sysLogCost" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.sysLogCost <= 1000" type="success">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000" type="warning">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else type="danger">{{ row.sysLogCost || 0 }} ms</el-tag>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </div>
      </el-main>
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
