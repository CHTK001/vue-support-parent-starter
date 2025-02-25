<script setup>
import { feechSyncTenant, fetchDeleteTenant, fetchPageTenant, fetchUpdateTenant } from "@/api/service/tenant";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { isTimeExpired, message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { fetchListService } from "@/api/service/service";

const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const env = reactive({
  params: {},
  loading: false,
  serviceList: [],
});

const status = reactive({
  async: false,
  delete: false,
});

const loadingTag = computed(() => {
  return env.loading;
});
const loadData = () => {
  tableRef.value.reload(env.params);
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleLoadMenuList(env.serviceList);
  saveDialogRef.value.handleOpen(row, mode);
};

const handleDelete = async (row) => {
  status.delete = true;
  fetchDeleteTenant(row)
    .then((res) => {
      message(t("message.deleteSuccess"), { type: "success" });
      loadData();
    })
    .finally(() => {
      status.delete = false;
    });
};
const handleUpdate = async (row) => {
  fetchUpdateTenant(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};
const loadServiceList = async () => {
  env.loading = true;
  fetchListService({})
    .then((res) => {
      env.serviceList = res.data;
    })
    .finally(() => {
      env.loading = false;
    });
};
const handleListEquals = (arr, tag) => {
  const item = arr.find((it) => it.sysMenuId === tag);
  if (item) {
    return item;
  }
  for (let index = 0; index < arr.length; index++) {
    const it = arr[index];
    if (it.children) {
      const _item = handleListEquals(it.children, tag);
      if (_item) {
        return _item;
      }
    }
  }
  return null;
};
const handleRenderTagName = (tag) => {
  const find = handleListEquals(env.serviceList, tag);
  return find?.sysMenuTitle;
};

const isValid = (time) => {
  return !time ? false : isTimeExpired(time);
};

const getTagName = (tag) => {
  return env.serviceList?.find((item) => item.sysServiceId === tag)?.sysServiceName;
};

const getContent = (row) => {
  return `<ul>
    <li>服务名称: ${getTagName(row?.sysServiceId)}</li>
    <li>过期时间: ${row?.sysTenantServiceValidTime || "-"} ${isValid(row?.sysTenantServiceValidTime) ? "(有效)" : "(过期)"}</li>
    </ul>`;
};

const handleSync = async (row) => {
  status.async = true;
  feechSyncTenant(row)
    .then((res) => {
      message(t("message.syncSuccess"), { type: "success" });
    })
    .finally(() => {
      status.async = false;
    });
};
onMounted(async () => {
  loadServiceList();
});
</script>
<template>
  <div class="fullscreen p-2">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <el-header>
      <div class="left-panel">
        <el-form :inline="true">
          <el-form-item label="租户名称">
            <el-input clearable v-model="env.params.sysTenantName" placeholder="请输入租户名称"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="right-panel">
        <el-button :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 0, 1000)" type="primary" />
        <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
      </div>
    </el-header>
    <ScTable ref="tableRef" :url="fetchPageTenant" :params="env.params">
      <el-table-column type="index" label="序号" width="120px">
        <template #default="scope">
          <el-tag type="primary" size="small">{{ scope.$index + 1 }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="租户名称" prop="sysTenantName"> </el-table-column>
      <el-table-column label="租户账号" prop="sysTenantUsername"> </el-table-column>
      <el-table-column label="手机号" prop="sysTenantPhone"> </el-table-column>
      <el-table-column label="订阅服务" width="450px">
        <template #default="{ row }">
          <el-tooltip class="cursor-default" :raw-content="true" :content="getContent(item)" v-for="item in row?.sysTenantService">
            <el-tag :type="isValid(item?.sysTenantServiceValidTime) ? 'success' : 'info'" class="m-2">
              {{ getTagName(item?.sysServiceId) }}
            </el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="公司地址" prop="sysTenantCorporation">
        <template #default="{ row }">
          <div class="flex justify-between gap-1">
            <span>{{ row.sysTenantCorporation }} </span>
            <span class="el-form-item-msg" :title="row.sysTenantAddress">{{ row.sysTenantAddress }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="是否启用">
        <template #default="{ row }">
          <el-segmented
            v-model="row.sysTenantStatus"
            :options="[
              {
                label: '启用',
                value: 0,
              },
              {
                label: '禁用',
                value: 1,
              },
            ]"
            @change="handleUpdate(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300px" fixed="right">
        <template #default="{ row }">
          <el-button :icon="useRenderIcon('ep:edit-pen')" class="btn-text" @click="handleEdit(row, 'edit')"></el-button>
          <el-button :icon="useRenderIcon('ep:delete')" type="danger" class="btn-text" :loading="status.delete" @click="handleDelete(row)"></el-button>
          <el-button :icon="useRenderIcon('bi:send')" type="warning" class="btn-text" :loading="status.async" title="同步" @click="handleSync(row)"></el-button>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
<style scoped></style>
