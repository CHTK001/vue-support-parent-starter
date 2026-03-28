<template>
  <div class="container-performance-ranking system-container modern-bg">
    <div class="ranking-header">
      <div class="header-left">
        <IconifyIconOnline icon="ri:bar-chart-line" class="header-icon" />
        <span class="header-title">容器性能排行榜</span>
      </div>
      <div class="header-right">
        <ScSelect
          v-model="rankingType"
          size="small"
          @change="handleRankingTypeChange"
        >
          <ScOption label="CPU使用率" value="cpu" />
          <ScOption label="内存使用率" value="memory" />
          <ScOption label="网络IO" value="network" />
          <ScOption label="磁盘IO" value="disk" />
        </ScSelect>
      </div>
    </div>

    <div class="ranking-content">
      <ScTable :data="rankingData" style="width: 100%" :show-header="false">
        <ScTableColumn prop="rank" width="40">
          <template #default="{ row }">
            <div class="rank-number" :class="getRankClass(row.rank)">
              {{ row.rank }}
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="containerName">
          <template #default="{ row }">
            <div class="container-info">
              <div class="container-name">{{ row.containerName }}</div>
              <div class="container-image">{{ row.imageName }}</div>
            </div>
          </template>
        </ScTableColumn>
        <ScTableColumn prop="value" width="80" align="right">
          <template #default="{ row }">
            <div class="value-text">{{ formatValue(row.value, row.unit) }}</div>
          </template>
        </ScTableColumn>
      </ScTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { containerApi, type SystemSoftContainer } from "@/api/docker";

interface RankingItem {
  rank: number;
  containerId: number;
  containerName: string;
  imageName: string;
  value: number;
  unit: string;
}

// 响应式数据
const rankingType = ref("cpu");
const rankingData = ref<RankingItem[]>([]);
const loading = ref(false);

// 获取排行榜数据
const fetchRankingData = async () => {
  if (loading.value) return;
  loading.value = true;

  try {
    const response = await containerApi.getContainerPageList({
      page: 1,
      size: 200,
    });
    if (response.code !== "00000") return;

    const records: SystemSoftContainer[] = response.data.records || [];
    const ranked = records
      .map((item) => {
        const value = getMetricValue(item);
        return {
          containerId: item.systemSoftContainerId || 0,
          containerName: item.systemSoftContainerName || "-",
          imageName: item.systemSoftContainerImage
            ? `${item.systemSoftContainerImage}:${item.systemSoftContainerImageTag || "latest"}`
            : "-",
          value,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((item, index) => ({
        rank: index + 1,
        containerId: item.containerId,
        containerName: item.containerName,
        imageName: item.imageName,
        value: item.value,
        unit: getMetricUnit(),
      }));

    rankingData.value = ranked;
  } catch (error) {
    console.error("获取排行榜数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 处理排行榜类型变化
const handleRankingTypeChange = () => {
  fetchRankingData();
};

// 根据排名获取样式类
const getRankClass = (rank: number) => {
  if (rank === 1) return "rank-first";
  if (rank === 2) return "rank-second";
  if (rank === 3) return "rank-third";
  return "";
};

// 格式化值显示
const formatValue = (value: number, unit: string) => {
  if (unit === "%") {
    return `${value.toFixed(1)}${unit}`;
  }
  if (unit === "B") {
    return formatBytes(value);
  }
  return `${value.toFixed(1)}${unit}`;
};

const getMetricUnit = () => {
  switch (rankingType.value) {
    case "cpu":
    case "memory":
      return "%";
    case "network":
    case "disk":
      return "B";
    default:
      return "%";
  }
};

const getMetricValue = (item: any) => {
  switch (rankingType.value) {
    case "cpu":
      return Number(
        item.systemSoftContainerCpuPercent ||
          item.systemSoftContainerCpuUsage ||
          0,
      );
    case "memory":
      return Number(
        item.systemSoftContainerMemoryPercent ||
          item.systemSoftContainerMemoryUsage ||
          0,
      );
    case "network":
      return Number(
        (item.systemSoftContainerStatsNetworkRxBytes ||
          item.systemSoftContainerNetworkRx ||
          0) +
          (item.systemSoftContainerStatsNetworkTxBytes ||
            item.systemSoftContainerNetworkTx ||
            0),
      );
    case "disk":
      return Number(
        (item.systemSoftContainerStatsDiskRead ||
          item.systemSoftContainerDiskRead ||
          0) +
          (item.systemSoftContainerStatsDiskWrite ||
            item.systemSoftContainerDiskWrite ||
            0),
      );
    default:
      return 0;
  }
};

const formatBytes = (bytes: number) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

// 组件挂载时获取数据
onMounted(() => {
  fetchRankingData();
});

watch(rankingType, () => {
  fetchRankingData();
});
</script>

<style scoped lang="scss">
.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.container-performance-ranking {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.ranking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.ranking-content {
  min-height: 200px;
}

.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 500;
  color: #909399;
  background: #f5f7fa;
}

.rank-number.rank-first {
  background: #f56c6c;
  color: white;
}

.rank-number.rank-second {
  background: #e6a23c;
  color: white;
}

.rank-number.rank-third {
  background: #67c23a;
  color: white;
}

.container-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.container-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.container-image {
  font-size: 12px;
  color: #909399;
}

.value-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
