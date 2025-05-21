<template>
  <div class="boundary-panel" v-if="visible">
    <div class="panel-header">
      <span class="panel-title">行政区划</span>
      <el-button 
        type="text" 
        icon="el-icon-close" 
        class="close-btn"
        @click="handleClose"
      />
    </div>
    
    <div class="panel-content">
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
          <el-col 
            :span="8" 
            v-for="district in subDistricts" 
            :key="district.adcode"
          >
            <el-card 
              shadow="hover" 
              class="district-card"
              @click="handleDrillTo(district.adcode)"
            >
              {{ district.name }}
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <!-- 提示信息 -->
      <div class="empty-tip" v-if="subDistricts.length === 0 && currentBoundary">
        <el-empty description="无下级行政区划数据" />
      </div>
      
      <div class="loading-mask" v-if="loading">
        <el-loading background="rgba(255, 255, 255, 0.7)" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, PropType, watch, onMounted } from 'vue';
import { BoundaryData, BoundaryLevel } from '../types/boundary';
import BoundaryBreadcrumb from './BoundaryBreadcrumb.vue';
import { fetchGaodeDistrictsByParentId } from '../api/district';

// 下级行政区信息接口
interface SubDistrict {
  name: string;
  adcode: string;
  level: string;
}

export default defineComponent({
  name: 'BoundaryPanel',
  components: {
    BoundaryBreadcrumb
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
      default: ''
    }
  },
  emits: ['drill-to', 'drill-up', 'close', 'update:visible'],
  setup(props, { emit }) {
    // 下级行政区数据
    const subDistricts = ref<SubDistrict[]>([]);
    
    // 加载状态
    const loading = ref(false);
    
    // 监听当前边界变化，加载下级行政区
    watch(
      () => props.currentBoundary,
      async (current) => {
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
          console.error('加载下级行政区失败:', error);
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
        console.warn('未提供地图API密钥，无法加载下级行政区');
        return [];
      }
      
      try {
        // 调用高德API获取下级行政区
        const result = await fetchGaodeDistrictsByParentId({
          key: props.mapKey,
          keywords: adcode,
          subdistrict: 1,
          extensions: 'base'
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
        console.error('获取下级行政区失败:', error);
        return [];
      }
    };
    
    // 处理钻取到指定行政区
    const handleDrillTo = (adcode: string) => {
      emit('drill-to', adcode);
    };
    
    // 处理返回上级
    const handleDrillUp = () => {
      emit('drill-up');
    };
    
    // 处理关闭面板
    const handleClose = () => {
      emit('update:visible', false);
      emit('close');
    };
    
    // 格式化行政级别
    const formatLevel = (level: string): string => {
      const levelMap: Record<string, string> = {
        'country': '国家',
        'province': '省/直辖市/自治区',
        'city': '市',
        'district': '区/县',
        'street': '街道/乡镇'
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

<style lang="scss" scoped>
.boundary-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid #e4e7ed;
    
    .panel-title {
      font-size: 16px;
      font-weight: bold;
    }
  }
  
  .panel-content {
    flex: 1;
    padding: 16px;
    overflow-y: auto;
    position: relative;
    
    .boundary-info {
      margin-bottom: 20px;
      
      h3 {
        margin: 0 0 12px 0;
        font-size: 18px;
      }
      
      p {
        margin: 6px 0;
        color: #606266;
      }
    }
    
    .sub-districts {
      h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
      }
      
      .district-card {
        margin-bottom: 10px;
        cursor: pointer;
        text-align: center;
        
        &:hover {
          color: #409eff;
        }
      }
    }
    
    .empty-tip {
      margin-top: 30px;
      text-align: center;
    }
    
    .loading-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style> 