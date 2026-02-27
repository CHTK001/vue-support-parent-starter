<script setup>
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import Download from "@iconify-icons/ri/cloud-line";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components";
import ScTable from "@repo/components/ScTable/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import { markRaw, nextTick, reactive, ref } from "vue";
import {
  fetchDeleteSecret,
  fetchPageSecret,
  fetchUpdateSecret,
} from "../../api/manage/secret";
import SaveDialog from "./save.vue";
import SyncDialog from "./sync.vue";

const table = ref();
const saveDialog = ref();
const syncDialog = ref();
const formRef = ref();
const visible = reactive({
  save: false,
  sync: false,
});

const sysSecretFunctions = reactive([
  {
    label: "短信",
    value: "SMS",
  },
]);
const saveDialogParams = reactive({
  mode: "save",
});
const form = reactive({
  sysSecretGroup: null,
  sysSecretCode: null,
  sysSecretAppId: null,
  sysSecretAppSecret: null,
});
const loading = reactive({
  query: false,
});
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

const onDelete = async (it) => {
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

const isShow = (val) => {
  return ["SMS"].includes(val);
};
const syncOpen = async (row, mode) => {
  visible.sync = true;
  await nextTick();
  syncDialog.value.setData(row).open(mode);
};

const dialogOpen = async (row, mode) => {
  visible.save = true;
  saveDialogParams.mode = mode;
  await nextTick();
  saveDialog.value.setData(row).open(mode);
};

const hasSyncFunction = (row) => {
  return (row.sysSecretFunction || "").split(",").includes("SMS");
};
const dialogClose = async () => {
  visible.save = false;
  visible.sync = false;
};
</script>
<template>
  <div class="main background-color system-container modern-bg">
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :sysSecretFunctions="sysSecretFunctions"
      :mode="saveDialogParams.mode"
      @success="onSearch()"
      @close="dialogClose"
    />
    <SyncDialog
      v-if="visible.sync"
      ref="syncDialog"
      :sysSecretFunctions="sysSecretFunctions"
      :mode="saveDialogParams.mode"
      @success="onSearch()"
      @close="dialogClose"
    />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel">
            <ScForm 
              ref="formRef"
              :inline="true"
              :model="form"
              class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
            >
              <ScFormItem label="密钥分组" prop="sysRoleName">
                <ScInput 
                  v-model="form.sysSecretGroup"
                  placeholder="请输入密钥分组"
                  clearable
                  class="!w-[180px]"
                />
              </ScFormItem>
              <ScFormItem label="密钥编码" prop="SysRoleCode">
                <ScInput 
                  v-model="form.sysSecretCode"
                  placeholder="请输入密钥编码"
                  clearable
                  class="!w-[180px]"
                />
              </ScFormItem>
            </ScForm>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <ScButton 
                type="primary"
                :icon="useRenderIcon('ri:search-line')"
                :loading="loading.query"
                @click="onSearch()"
              />
              <ScButton 
                :icon="useRenderIcon(Refresh)"
                @click="resetForm(formRef)"
              />
              <ScButton 
                :icon="useRenderIcon(Edit)"
                @click="dialogOpen({}, 'save')"
              />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div
              class="h-full w-full"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <ScTable ref="table" :url="fetchPageSecret">
                <ScTableColumn 
                  label="序号"
                  type="index"
                  align="center"
                  width="60px"
                  fixed
                />
                <ScTableColumn 
                  label="密钥分组"
                  prop="sysSecretGroup"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <ScTag v-if="row.sysSecretGroup">{{
                      row.sysSecretGroup
                    }}</ScTag>
                    <span v-else>/</span>
                    <span
                      class="flex-col justify-end"
                      style="
                        float: right;
                        color: var(--el-text-color-secondary);
                        font-size: 13px;
                      "
                    >
                      {{ row.sysSecretCode }}
                    </span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="所属厂家"
                  prop="sysSecretDictItemName"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <ScTag v-if="row.sysSecretDictItemName">{{
                      row.sysSecretDictItemName
                    }}</ScTag>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="签名"
                  prop="sysSecretSign"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <ScTag v-if="row.sysSecretSign">{{
                      row.sysSecretSign
                    }}</ScTag>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="appId"
                  prop="sysSecretAppId"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppId">{{
                      row.sysSecretAppId
                    }}</span>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="appSecret"
                  prop="sysSecretAppSecret"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppSecret">{{
                      row.sysSecretAppSecret
                    }}</span>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="endpoint"
                  prop="sysSecretAppEndpoint"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.sysSecretAppEndpoint">{{
                      row.sysSecretAppEndpoint
                    }}</span>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="cdn"
                  prop="sysSecretCdn"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.sysSecretCdn">{{ row.sysSecretCdn }}</span>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="启用"
                  prop="sysSecretStatus"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <ScSwitch
                      v-model="row.sysSecretStatus"
                      class="h-fit"
                      layout="modern"
                      :active-value="1"
                      :inactive-value="0"
                      @change="fetchUpdateSecret(row)"
                    />
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="创建时间"
                  prop="createTime"
                  align="center"
                  show-overflow-tooltip
                />
                <ScTableColumn 
                  label="更新时间"
                  prop="updateTime"
                  align="center"
                  show-overflow-tooltip
                >
                  <template #default="{ row }">
                    <span v-if="row.updateTime">{{ row.updateTime }}</span>
                    <span v-else>/</span>
                  </template>
                </ScTableColumn>
                <ScTableColumn 
                  label="操作"
                  fixed="right"
                  min-width="130px"
                  align="center"
                >
                  <template #default="{ row }">
                    <ScButton 
                      v-if="hasSyncFunction(row)"
                      size="small"
                      plain
                      link
                      type="primary"
                      :icon="useRenderIcon(markRaw(Download))"
                      @click="syncOpen(row, 'edit')"
                    >
                      同步
                    </ScButton>
                    <ScButton 
                      size="small"
                      plain
                      link
                      type="primary"
                      :icon="useRenderIcon(EditPen)"
                      @click="dialogOpen(row, 'edit')"
                    >
                      编辑
                    </ScButton>

                    <ScPopconfirm 
                      title="确认删除吗？"
                      @confirm="onDelete(row)"
                    >
                      <template #reference>
                        <ScButton 
                          size="small"
                          type="danger"
                          plain
                          link
                          :icon="useRenderIcon(Delete)"
                          >删除</el-button
                        >
                      </template>
                    </ScPopconfirm>
                  </template>
                </ScTableColumn>
              </ScTable>
            </div>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  overflow: hidden;
}

.background-color {
  background-color: var(--el-bg-color);
}

.left-panel {
  flex: 1;
}

.right-panel {
  display: flex;
  align-items: center;
  padding-right: 20px;
}

.right-panel-search {
  display: flex;
  gap: 12px;
}

.nopadding {
  padding: 0;
}

.search-form {
  margin-bottom: 0;
}

:deep(.el-header) {
  padding: 16px 24px;
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-9) 0%,
    var(--el-bg-color-overlay) 100%
  );
  border-bottom: 1px solid var(--el-border-color-lighter);
  height: auto !important;
}

:deep(.el-main) {
  padding: 24px;
  background-color: var(--el-bg-color);
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;

  th {
    background-color: var(--el-fill-color-light) !important;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .el-table__row {
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-button--link) {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }
}

:deep(.el-input) {
  .el-input__wrapper {
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
    }
  }
}

:deep(.el-select) {
  .el-select__wrapper {
    border-radius: 8px;
  }
}
</style>
