<script setup>
import { getRandomInt } from "@repo/utils";
import { defineAsyncComponent, ref } from "vue";
const loadingShow = ref(true);
const loadingRef = ref();
const showNumber = ref(true);
const showLoading = ref(false);
const layout = ref("loader5");
const LoadingLayout = defineAsyncComponent(() => import("@repo/components/ScLoading/index.vue"));

setInterval(() => {
  loadingRef.value.stepBy(getRandomInt(1, 10));
}, 1000);
</script>
<template>
  <div>
    <div class="relative top-0 left-0 z-[9999]">
      <el-form :inline="true" class="text-white">
        <el-form-item label="布局">
          <el-select v-model="layout" placeholder="请选择布局" class="!w-[200px]">
            <el-option label="spining" value="spining" />
            <el-option label="spining2" value="spining2" />
            <el-option label="pencil" value="pencil" />
            <el-option label="loader" value="loader" />
            <el-option label="loader2" value="loader2" />
            <el-option label="loader3" value="loader3" />
            <el-option label="loader4" value="loader4" />
            <el-option label="loader5" value="loader5" />
            <el-option label="loader6" value="loader6" />
            <el-option label="banter" value="banter" />
            <el-option label="default" value="default" />
            <el-option label="jimi" value="jimi" />
            <el-option label="box" value="box" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否显示数字">
          <el-switch v-model="showNumber" />
        </el-form-item>
        <el-form-item label="是否显示loading">
          <el-switch v-model="showLoading" />
        </el-form-item>
      </el-form>
    </div>
    <div class="!w-[500px] !h-[500px] relative flex justify-center">
      <div />
      <LoadingLayout ref="loadingRef" v-model="loadingShow" :layout="layout" :show-number="showNumber" :show-loading="showLoading" />
    </div>
  </div>
</template>
