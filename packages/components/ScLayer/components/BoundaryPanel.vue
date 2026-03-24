<template>
  <div class="boundary-panel" v-if="visible">
    <div class="panel-header">
      <span class="panel-title">行政区划</span>
      <el-button type="text" class="close-btn" @click="handleClose">
        <IconifyIconOnline icon="ep:close" />
      </el-button>
    </div>

    <div class="panel-content" v-loading="loading">
      <!-- 面包屑导航 -->
      <boundary-breadcrumb
        :current-boundary="currentBoundary"
        :history-boundaries="historyBoundaries"
        :show-breadcrumb="true"
        :show-back-button="historyBoundaries.length > 0"
        @drill-to="handleDrillTo"
        @drill-up="handleDrillUp"
      />

      <!-- 当前区域信息 -->
      <div class="boundary-info" v-if="currentBoundary">
        <h3>{{ currentBoundary.name }}</h3>
        <p>行政代码：{{ currentBoundary.code }}</p>
        <p>行政级别：{{ formatLevel(currentBoundary.level) }}</p>
      </div>

      <!-- 下级区域列表 -->
      <div class="sub-districts" v-if="subDistricts.length > 0">
        <h4>下级行政区</h4>
        <el-row :gutter="10">
          <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="district in subDistricts" :key="district.adcode">
            <el-card shadow="hover" class="district-card" @click="handleDrillTo(district.adcode)">
              {{ district.name }}
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 提示信息 -->
      <div class="empty-tip" v-if="subDistricts.length === 0 && currentBoundary">
        <el-empty description="无下级行政区划数据" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { defineComponent, PropType, ref, watch } from "vue";
import { fetchGaodeDistrictsByParentId } from "../api/district";
import { BoundaryData, BoundaryLevel } from "../types/boundary";
import BoundaryBreadcrumb from "./BoundaryBreadcrumb.vue";

// 下级行政区信息接口
interface SubDistrict {
  name: string;
  adcode: string;
  level: string;
}

export default defineComponent({
  name: "BoundaryPanel",
  components: {
    BoundaryBreadcrumb,
    IconifyIconOnline
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentBoundary: {
      type: Object as PropType<BoundaryData | null>,
      default: null
    },
    historyBoundaries: {
      type: Array as PropType<BoundaryData[]>,
      default: () => []
    },
    mapKey: {
      type: String,
      default: ""
    }
  },
  emits: ["drill-to", "drill-up", "close", "update:visible"],
  setup(props, { emit }) {
    // 下级行政区数据
    const subDistricts = ref<SubDistrict[]>([]);

    // 加载状态
    const loading = ref(false);

    // 监听当前边界变化，加载下级行政区
    watch(
      () => props.currentBoundary,
      async current => {
        if (!current) {
          subDistricts.value = [];
          return;
        }

        loading.value = true;
        try {
          // 获取下级行政区数据
          const districts = await loadSubDistricts(current.code);
          subDistricts.value = districts;
        } catch (error) {
          console.error("加载下级行政区失败:", error);
          subDistricts.value = [];
        } finally {
          loading.value = false;
        }
      },
      { immediate: true }
    );

    // 加载下级行政区数据
    const loadSubDistricts = async (adcode: string): Promise<SubDistrict[]> => {
      if (!props.mapKey) {
        console.warn("未提供地图API密钥，无法加载下级行政区");
        return [];
      }

      try {
        // 调用高德API获取下级行政区
        const result = await fetchGaodeDistrictsByParentId({
          key: props.mapKey,
          keywords: adcode,
          subdistrict: 1,
          extensions: "base"
        });

        if (result && result.districts && result.districts.length > 0) {
          const firstDistrict = result.districts[0];

          if (firstDistrict.districts) {
            return firstDistrict.districts.map(d => ({
              name: d.name,
              adcode: d.adcode,
              level: d.level
            }));
          }
        }

        return [];
      } catch (error) {
        console.error("获取下级行政区失败:", error);
        return [];
      }
    };

    // 处理钻取到指定行政区
    const handleDrillTo = (adcode: string) => {
      emit("drill-to", adcode);
    };

    // 处理返回上级
    const handleDrillUp = () => {
      emit("drill-up");
    };

    // 处理关闭面板
    const handleClose = () => {
      emit("update:visible", false);
      emit("close");
    };

    // 格式化行政级别
    const formatLevel = (level: string): string => {
      const levelMap: Record<string, string> = {
        country: "国家",
        province: "省/直辖市/自治区",
        city: "市",
        district: "区/县",
        street: "街道/乡镇"
      };

      return levelMap[level] || level;
    };

    return {
      subDistricts,
      loading,
      handleDrillTo,
      handleDrillUp,
      handleClose,
      formatLevel
    };
  }
});
</script>

<style scoped lang="scss">
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.boundary-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-overlay);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s;
  backdrop-filter: blur(8px);

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);

    .panel-title {
      font-size: var(--el-font-size-large);
      font-weight: bold;
      color: var(--el-text-color-primary);
    }
  }

  .panel-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    position: relative;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-darker);
      border-radius: 10px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    .boundary-info {
      margin-bottom: 20px;
      padding: 16px;
      background-color: var(--el-fill-color-lighter);
      border-radius: var(--el-border-radius-base);
      border: 1px solid var(--el-border-color-lighter);

      h3 {
        margin: 0 0 12px 0;
        font-size: var(--el-font-size-extra-large);
        color: var(--el-color-primary);
      }

      p {
        margin: 6px 0;
        color: var(--el-text-color-regular);
        font-size: var(--el-font-size-base);
      }
    }

    .sub-districts {
      h4 {
        margin: 0 0 12px 0;
        font-size: var(--el-font-size-medium);
        color: var(--el-text-color-primary);
      }

      .district-card {
        margin-bottom: 10px;
        cursor: pointer;
        text-align: center;
        transition: all 0.3s;
        border: 1px solid var(--el-border-color-lighter);
        background-color: var(--el-fill-color-blank);
        padding: 8px;
        font-size: var(--el-font-size-small);

        &:hover {
          color: var(--el-color-primary);
          border-color: var(--el-color-primary-light-5);
          background-color: var(--el-color-primary-light-9);
          transform: translateY(-2px);
          box-shadow: var(--el-box-shadow-lighter);
        }
      }
    }

    .empty-tip {
      margin-top: 30px;
      text-align: center;
    }
  }
}
</style>
