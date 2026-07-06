<template>
  <div class="dashboard">
    <el-row :gutter="16">
      <el-col :span="6" v-for="card in cards" :key="card.title">
        <el-card shadow="hover" class="dashboard-card">
          <div class="card-content">
            <div class="card-icon" :style="{ background: card.color }">
              <el-icon :size="28"><component :is="card.icon" /></el-icon>
            </div>
            <div class="card-info">
              <p class="card-value">{{ card.loading ? "..." : card.value }}</p>
              <p class="card-title">{{ card.title }}</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="welcome-card" style="margin-top: 16px;">
      <h2>欢迎使用系统管理 v2</h2>
      <p>基于 KOI-UI 布局的新一代系统管理界面，使用 layout/koi + pages/system-v2 构建。</p>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted, markRaw } from "vue";
import { User, Flag, Menu, OfficeBuilding } from "@element-plus/icons-vue";

const cards = reactive([
  { title: "用户管理", value: "—", icon: markRaw(User), color: "#409eff", loading: true },
  { title: "角色管理", value: "—", icon: markRaw(Flag), color: "#67c23a", loading: true },
  { title: "菜单管理", value: "—", icon: markRaw(Menu), color: "#e6a23c", loading: true },
  { title: "部门管理", value: "—", icon: markRaw(OfficeBuilding), color: "#f56c6c", loading: true },
]);

const fetchCount = async (url: string, index: number, isList = false) => {
  try {
    const resp = await fetch(`/system/api${url}?page=1&pageSize=1`);
    const payload = await resp.json();
    const data = payload?.data;
    if (isList) {
      cards[index].value = String(Array.isArray(data) ? data.length : "—");
    } else {
      cards[index].value = String(data?.total ?? data?.records?.length ?? "—");
    }
  } catch (e: any) {
    console.warn(`[Dashboard] ${url} failed:`, e?.message || e);
    cards[index].value = "—";
  } finally {
    cards[index].loading = false;
  }
};

onMounted(() => {
  fetchCount("/v2/user/page", 0);
  fetchCount("/v2/role/page", 1);
  fetchCount("/v2/menu/page", 2);
  // dept uses list endpoint, count by array length
  fetchCount("/v2/dept/list", 3, true);
});
</script>

<style scoped>
.dashboard { padding: 4px; }
.dashboard-card { border-radius: 8px; }
.card-content { display: flex; align-items: center; gap: 16px; }
.card-icon {
  width: 56px; height: 56px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.card-value { font-size: 24px; font-weight: 700; color: #303133; }
.card-title { font-size: 14px; color: #909399; margin-top: 4px; }
.welcome-card h2 { margin-bottom: 8px; }
.welcome-card p { color: #606266; line-height: 1.6; }
</style>
