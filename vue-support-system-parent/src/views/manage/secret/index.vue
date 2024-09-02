<script setup>
import { fetchPageSecret, fetchDeleteSecret, fetchUpdateSecret } from "@/api/secret";
import ScTable from "@/components/ScTable/index.vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { debounce } from "@pureadmin/utils";
import { nextTick, reactive, ref } from "vue";
import SaveDialog from "./save.vue";

const table = ref();
const saveDialog = ref();
const formRef = ref();
const visible = reactive({
  save: false
});

const saveDialogParams = reactive({
  mode: "save"
});
const form = reactive({
  sysSecretGroup: null,
  sysSecretCode: null,
  sysSecretAppId: null,
  sysSecretAppSecret: null
});
const loading = reactive({
  query: false
});
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};

const onDelete = async it => {
  loading.query = true;
  await fetchDeleteSecret(it.sysSecretId);
  table.value.reload();
  loading.query = false;
};

const onSearch = debounce(
  () => {
    table.value.reload();
  },
  1000,
  true
);

const dialogOpen = async (row, mode) => {
  visible.save = true;
  saveDialogParams.mode = mode;
  await nextTick();
  saveDialog.value.setData(row).open(mode);
};
const dialogClose = async () => {
  visible.save = false;
};
</script>
<template>
  <div class="main background-color">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch()" @close="dialogClose" />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
              <el-form-item label="密钥分组" prop="sysRoleName">
                <el-input v-model="form.sysSecretGroup" placeholder="请输入密钥分组" clearable class="!w-[180px]" />
              </el-form-item>
              <el-form-item label="密钥编码" prop="SysRoleCode">
                <el-input v-model="form.sysSecretCode" placeholder="请输入密钥编码" clearable class="!w-[180px]" />
              </el-form-item>
            </el-form>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch()" />
              <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
              <el-button :icon="useRenderIcon(Edit)" @click="dialogOpen({}, 'save')" />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div class="h-full w-full" style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
              <ScTable ref="table" :url="fetchPageSecret">
                <el-table-column label="序号" type="index" align="center" width="60px" fixed />
                <el-table-column label="密钥分组" prop="sysSecretGroup" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysSecretGroup">{{ row.sysSecretGroup }}</el-tag>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="密钥编码" prop="sysSecretCode" align="center" />
                <el-table-column label="appId" prop="sysSecretAppId" align="center">
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppId">{{ row.sysSecretAppId }}</span>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="appSecret" prop="sysSecretAppSecret" align="center">
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppSecret">{{ row.sysSecretAppSecret }}</span>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="endpoint" prop="sysSecretAppEndpoint" align="center">
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppEndpoint">{{ row.sysSecretAppEndpoint }}</span>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="cdn" prop="sysSecretCdn" align="center">
                  <template #default="{ row }">
                    <span v-if="row.sysSecretCdn">{{ row.sysSecretCdn }}</span>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="启用" prop="sysSecretStatus" align="center">
                  <template #default="{ row }">
                    <el-switch
                      v-model="row.sysSecretStatus"
                      class="h-fit"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
                      :active-value="1"
                      :inactive-value="0"
                      @change="fetchUpdateSecret(row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime" align="center" />
                <el-table-column label="更新时间" prop="updateTime" align="center">
                  <template #default="{ row }">
                    <span v-if="row.updateTime">{{ row.updateTime }}</span>
                    <span v-else>/</span>
                  </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right">
                  <template #default="{ row }">
                    <el-button v-auth="'sys:secret:update'" v-roles="['ADMIN', 'SUPER_ADMIN']" size="small" plain link type="primary" :icon="useRenderIcon(EditPen)" @click="dialogOpen(row, 'edit')">
                      编辑
                    </el-button>
                    <el-popconfirm title="确定删除吗？" @confirm="onDelete(row)">
                      <template #reference>
                        <el-button v-auth="'sys:secret:delete'" v-roles="['ADMIN', 'SUPER_ADMIN']" size="small" type="danger" plain link :icon="useRenderIcon(Delete)">删除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </ScTable>
            </div>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>
