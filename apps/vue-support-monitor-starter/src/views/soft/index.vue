<template>
  <div class="soft-page">
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="搜索软件名称/编码" clearable class="mr-2" style="width: 280px" />
      <el-button type="primary" :loading="syncing" @click="handleSync">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" /> 同步
      </el-button>
      <el-button type="success" @click="openCreate">
        <IconifyIconOnline icon="ri:add-fill" class="mr-1" /> 新增
      </el-button>
    </div>

    <el-empty v-if="list.length === 0" description="暂无软件，点击同步或新增" />

    <div v-else class="soft-grid">
      <el-card v-for="item in list" :key="item.systemSoftId" class="soft-card" @click="goDetail(item)">
        <div class="soft-card-header">
          <img v-if="item.systemSoftIcon" :src="item.systemSoftIcon" class="soft-icon" />
          <div class="soft-title">
            <div class="name">{{ item.systemSoftName }}</div>
            <div class="code">{{ item.systemSoftCode }}</div>
          </div>
        </div>
        <div class="desc" :title="item.systemSoftDesc">{{ item.systemSoftDesc }}</div>
        <div class="tags">
          <el-tag v-for="tag in (item.systemSoftTags || '').split(',').filter(Boolean)" :key="tag" size="small">{{ tag }}</el-tag>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@repo/utils";
import { getSoftPageList, syncSoft, type SystemSoft } from "@/api/soft";
import { useRouter } from "vue-router";

const router = useRouter();
const keyword = ref("");
const syncing = ref(false);
const list = ref<SystemSoft[]>([]);

const loadList = async () => {
  const res = await getSoftPageList({ page: 1, pageSize: 100, systemSoftName: keyword.value || undefined });
  if (res.code === "00000") {
    list.value = res.data.records || [];
  }
};

const handleSync = async () => {
  try {
    syncing.value = true;
    const res = await syncSoft();
    if (res.code === "00000") {
      message.success("同步成功");
      await loadList();
    }
  } finally {
    syncing.value = false;
  }
};

const openCreate = () => {
  message.info("后续提供新增弹窗/页面");
};

const goDetail = (item: SystemSoft) => {
  router.push({ name: "softDetail", params: { id: item.systemSoftId } });
};

onMounted(loadList);
</script>

<style scoped>
.soft-page { padding: 16px; }
.toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.soft-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
.soft-card { cursor: pointer; }
.soft-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.12); }
.soft-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
.soft-icon { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; }
.soft-title .name { font-weight: 600; }
.soft-title .code { color: #888; font-size: 12px; }
.desc { color: #666; height: 38px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.tags { margin-top: 8px; display: flex; gap: 6px; flex-wrap: wrap; }
</style>

