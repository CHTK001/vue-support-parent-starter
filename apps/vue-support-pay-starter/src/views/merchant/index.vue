<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchPageMerchant } from "@/api/merchant";
import { reactive } from "vue";
import { message } from "@repo/utils";

const form = reactive({});
</script>

<template>
  <div class="main background-color h-full">
    <el-header>
      <el-form :model="form">
        <el-form-item label="名称" prop="">
          <el-input v-model="form.payMerchantName" placeholder="请输入商户名称" clearable class="!w-[180px]" />
        </el-form-item>
      </el-form>
    </el-header>
    <el-container>
      <ScTable ref="tableRef" :url="fetchPageMerchant" :params="form" />
    </el-container>
  </div>
</template>
