<script setup>
import { fetchPageMerchant, fetchUpdateMerchant } from "@/api/merchant";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";

const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const SettingDialog = defineAsyncComponent(() => import("./setting.vue"));
const saveDialogRef = ref();
const settingDialogRef = ref();

const form = reactive({});

const handleSetting = async row => {
  nextTick(() => {
    settingDialogRef.value.handleOpen(row);
  });
};
const handleUpdate = async (row, type) => {
  nextTick(() => {
    saveDialogRef.value.handleOpen(type, row);
  });
};
</script>

<template>
  <div class="main background-color w-full h-full">
    <SettingDialog ref="settingDialogRef" />
    <SaveDialog ref="saveDialogRef" />
    <el-header>
      <el-form :model="form" :inline="true">
        <el-form-item label="名称" prop="">
          <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" clearable class="!w-[180px]" />
        </el-form-item>

        <el-form-item>
          <el-button class="btn-text" :icon="useRenderIcon('ep:plus')" @click="handleUpdate({}, 'add')" />
        </el-form-item>
      </el-form>
    </el-header>
    <el-container>
      <ScTable ref="tableRef" :url="fetchPageMerchant" :params="form">
        <el-table-column label="商户名称" prop="payMerchantName" align="center" fixed>
          <template #default="{ row }">
            <el-tag>{{ row.payMerchantName }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商户号" prop="payMerchantCode" />
        <el-table-column label="是否开启" prop="payMerchantStatus">
          <template #default="{ row }">
            <el-switch v-model="row.payMerchantStatus" :active-value="1" :inactive-value="0" @change="fetchUpdateMerchant(row)" />
          </template>
        </el-table-column>
        <el-table-column label="是否开启钱包" prop="payMerchantOpenWallet">
          <template #default="{ row }">
            <el-switch v-model="row.payMerchantOpenWallet" :active-value="1" :inactive-value="0" @change="fetchUpdateMerchant(row)" />
          </template>
        </el-table-column>

        <el-table-column label="创建时间">
          <template #default="{ row }">
            {{ row.createTime }}
          </template>
        </el-table-column>

        <el-table-column>
          <template #default="{ row }">
            <el-button class="btn-text" :icon="useRenderIcon('ep:edit')" @click="handleUpdate(row, 'edit')" />
            <el-button class="btn-text" :icon="useRenderIcon('ri:settings-2-line')" @click="handleSetting(row)" />
          </template>
        </el-table-column>
      </ScTable>
    </el-container>
  </div>
</template>
