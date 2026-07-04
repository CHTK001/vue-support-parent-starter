<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("menu.docList") }}</h2>
      <el-button type="primary">
        <el-icon><Plus /></el-icon> {{ t("common.add") }}
      </el-button>
    </div>
    <el-empty :description="t('common.noData')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Plus } from "@element-plus/icons-vue";

const { t } = useI18n();
</script>
