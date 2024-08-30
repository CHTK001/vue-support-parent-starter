<script setup>
import ScTable from "@/components/ScTable/index.vue";
import { fetchPageSecret } from "@/api/secret";
import { reactive, ref } from "vue";
import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Menu from "@iconify-icons/ep/menu";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { transformI18n } from "@/plugins/i18n";
import Edit from "@iconify-icons/line-md/plus";
import Close from "@iconify-icons/ep/close";
import Check from "@iconify-icons/ep/check";
import { debounce } from "@pureadmin/utils";
import { nextTick } from "vue";

const table = ref();
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
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};
const onSearch = async () => {
  debounce(() => table.value.reload(), 1000, true);
};

const dialogOpen = async (row, mode) => {
  visible.save = true;
  saveDialogParams.mode = mode;
  await nextTick();
};
const dialogClose = async () => {
  visible.save = false;
};
</script>
<template>
  <div class="main background-color">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
              <el-form-item label="角色名称" prop="sysRoleName">
                <el-input v-model="form.sysSecretGroup" placeholder="请输入角色名称" clearable class="!w-[180px]" />
              </el-form-item>
              <el-form-item label="角色编码" prop="SysRoleCode">
                <el-input v-model="form.sysSecretCode" placeholder="请输入角色编码" clearable class="!w-[180px]" />
              </el-form-item>
            </el-form>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
              <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
              <el-button :icon="useRenderIcon(Edit)" @click="dialogOpen({}, 'save')" />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div class="h-full w-full" style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
              <ScTable ref="table" :url="fetchPageSecret" border>
                <el-table-column label="序号" type="index" align="center" width="60px" fixed />
                <el-table-column label="密钥分组" prop="sysSecretGroup" align="center" />
                <el-table-column label="密钥编码" prop="sysSecretCode" align="center" />
                <el-table-column label="appId" prop="sysSecretAppId" align="center" />
                <el-table-column label="appSecret" prop="sysSecretAppSecret" align="center" />
                <el-table-column label="endpoint" prop="sysSecretAppEndpoint" align="center" />
                <el-table-column label="cdn" prop="sysSecretAppCdn" align="center" />
                <el-table-column label="创建时间" prop="createTime" align="center" />
                <el-table-column label="更新时间" prop="updateTime" align="center" />
                <el-table-column label="操作" fixed="right">
                  <template #default="{ row }">
                    <el-button v-auth="'sys:user:update'" v-roles="['ADMIN', 'SUPER_ADMIN']" size="small" plain link type="primary" :icon="EditPen" @click="dialogOpen(row, 'edit')">编辑</el-button>
                    <el-popconfirm title="确定删除吗？" @confirm="onDelete(row)">
                      <template #reference>
                        <el-button v-if="!row.sysUserInSystem" v-auth="'sys:user:delete'" v-roles="['ADMIN', 'SUPER_ADMIN']" size="small" type="danger" plain link :icon="Delete">删除</el-button>
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
