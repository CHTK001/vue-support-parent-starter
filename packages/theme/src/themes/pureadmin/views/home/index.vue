<template>
  <div class="pureadmin-home p-6">
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <el-card v-for="stat in stats" :key="stat.label" class="shadow-sm rounded-xl">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-el-text-secondary">{{ stat.label }}</div>
            <div class="text-2xl font-bold text-el-text mt-1">{{ stat.value }}</div>
          </div>
          <el-icon :size="32" :color="stat.color">
            <component :is="stat.icon" />
          </el-icon>
        </div>
      </el-card>
    </div>

    <!-- 快速入口 -->
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card class="shadow-sm rounded-xl">
          <template #header>
            <span class="font-semibold">快速入口</span>
          </template>
          <div class="flex flex-wrap gap-3">
            <el-button v-for="item in quickActions" :key="item.label" type="primary" plain size="small" @click="item.action">
              {{ item.label }}
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card class="shadow-sm rounded-xl">
          <template #header>
            <span class="font-semibold">{{ t("menu.home.work.name") }}</span>
          </template>
          <div class="text-sm text-el-text-secondary">
            {{ t("menu.home.work.desc") }}
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts" name="PureadminHome">
import { useI18n } from "vue-i18n";
import { Document, User, ShoppingCart, TrendCharts } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

const { t } = useI18n();

const stats = [
  { label: t("dashboard.users"), value: "1,280", icon: User, color: "#409EFF" },
  { label: t("dashboard.orders"), value: "356", icon: ShoppingCart, color: "#67C23A" },
  { label: t("dashboard.visits"), value: "4,521", icon: TrendCharts, color: "#E6A23C" },
  { label: t("dashboard.documents"), value: "89", icon: Document, color: "#F56C6C" },
];

const quickActions = [
  { label: t("menu.system.user"), action: () => ElMessage.info(t("msg.navigate") + ": 用户管理") },
  { label: t("menu.system.role"), action: () => ElMessage.info(t("msg.navigate") + ": 角色管理") },
  { label: t("menu.system.menu"), action: () => ElMessage.info(t("msg.navigate") + ": 菜单管理") },
];
</script>
