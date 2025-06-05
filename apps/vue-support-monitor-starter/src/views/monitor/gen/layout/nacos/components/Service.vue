<template>
  <div class="nacos-service h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="nacos-service-header mb-4 flex items-center justify-between">
      <div class="nacos-service-header__left flex items-center">
        <el-select v-model="currentNamespace" placeholder="选择命名空间" class="nacos-namespace-select mr-4" @change="handleNamespaceChange">
          <el-option
            v-for="item in namespaces"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <div class="flex items-center">
              <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
              <span>{{ item.name }}</span>
            </div>
          </el-option>
        </el-select>
        
        <div class="nacos-search-box flex items-center">
          <el-input
            v-model="searchParams.serviceName"
            placeholder="请输入服务名称"
            clearable
            class="mr-2"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          
          <el-select
            v-model="searchParams.groupName"
            placeholder="选择分组"
            clearable
            class="mr-2 w-40"
            @change="handleGroupChange"
          >
            <el-option label="DEFAULT_GROUP" value="DEFAULT_GROUP" />
            <el-option label="自定义分组" value="custom" />
          </el-select>
          
          <el-input
            v-if="searchParams.groupName === 'custom'"
            v-model="customGroupName"
            placeholder="请输入分组名称"
            clearable
            class="mr-2"
            @keyup.enter="handleSearch"
          />
          
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            搜索
          </el-button>
        </div>
      </div>
      
      <div class="nacos-service-header__right">
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 服务列表 -->
    <div class="nacos-service-body flex-1 overflow-hidden">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="serviceList"
        border
        stripe
        highlight-current-row
        class="nacos-table h-full"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="60" align="center" />
        <el-table-column prop="name" label="服务名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center">
              <IconifyIconOnline icon="ri:service-line" class="mr-2 text-blue-500" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="groupName" label="分组名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="clusterCount" label="集群数量" width="100" align="center" />
        <el-table-column prop="ipCount" label="实例数量" width="100" align="center" />
        <el-table-column prop="healthyInstanceCount" label="健康实例" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="success">{{ row.healthyInstanceCount }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unhealthyInstanceCount" label="不健康实例" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.unhealthyInstanceCount > 0" type="danger">{{ row.unhealthyInstanceCount }}</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <div class="flex justify-center">
              <el-tooltip content="查看详情" placement="top">
                <el-button type="primary" link @click.stop="handleViewDetail(row)">
                  <IconifyIconOnline icon="ri:eye-line" />
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="nacos-pagination flex justify-end mt-4">
        <el-pagination
          v-model:current-page="searchParams.pageNum"
          v-model:page-size="searchParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 服务详情抽屉 -->
    <el-drawer
      v-model="serviceDetailVisible"
      title="服务详情"
      size="70%"
      destroy-on-close
    >
      <template v-if="currentService">
        <div class="nacos-service-detail p-4">
          <div class="nacos-service-header mb-4 pb-2 border-b">
            <div class="flex items-center justify-between mb-2">
              <div class="text-lg font-medium flex items-center">
                <IconifyIconOnline icon="ri:service-line" class="mr-2 text-blue-500" />
                {{ currentService.name }}
              </div>
              <el-tag>{{ currentService.groupName || 'DEFAULT_GROUP' }}</el-tag>
            </div>
            <div class="text-sm text-gray-500">
              命名空间: {{ getNamespaceName(currentService.namespace) }} | 
              集群数量: {{ currentService.clusterCount || 0 }} | 
              实例数量: {{ currentService.ipCount || 0 }} | 
              健康实例: {{ currentService.healthyInstanceCount || 0 }} | 
              不健康实例: {{ currentService.unhealthyInstanceCount || 0 }}
            </div>
          </div>
          
          <div class="nacos-service-instances mb-4">
            <div class="nacos-service-instances-header mb-2 flex items-center">
              <IconifyIconOnline icon="ri:instance-line" class="mr-2 text-green-500" />
              <span class="text-lg font-medium">实例列表</span>
            </div>
            
            <el-table :data="instanceList" border stripe>
              <el-table-column type="index" width="60" align="center" />
              <el-table-column prop="ip" label="IP地址" min-width="120" />
              <el-table-column prop="port" label="端口" width="100" align="center" />
              <el-table-column prop="clusterName" label="集群名称" min-width="120" />
              <el-table-column prop="weight" label="权重" width="80" align="center" />
              <el-table-column prop="healthy" label="健康状态" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.healthy ? 'success' : 'danger'">
                    {{ row.healthy ? '健康' : '不健康' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="enabled" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.enabled ? 'primary' : 'info'">
                    {{ row.enabled ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ephemeral" label="临时实例" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.ephemeral ? 'warning' : 'info'">
                    {{ row.ephemeral ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="180" fixed="right">
                <template #default="{ row }">
                  <div class="flex justify-center gap-2">
                    <el-tooltip :content="row.enabled ? '禁用' : '启用'" placement="top">
                      <el-button :type="row.enabled ? 'warning' : 'success'" link>
                        <IconifyIconOnline :icon="row.enabled ? 'ri:forbid-line' : 'ri:checkbox-circle-line'" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="查看元数据" placement="top">
                      <el-button type="primary" link @click="handleViewMetadata(row)">
                        <IconifyIconOnline icon="ri:information-line" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <template v-if="currentMetadata">
            <div class="nacos-service-metadata">
              <div class="nacos-service-metadata-header mb-2 flex items-center">
                <IconifyIconOnline icon="ri:information-line" class="mr-2 text-blue-500" />
                <span class="text-lg font-medium">实例元数据</span>
              </div>
              
              <el-descriptions :column="2" border>
                <template v-for="(value, key) in currentMetadata" :key="key">
                  <el-descriptions-item :label="key">{{ value }}</el-descriptions-item>
                </template>
              </el-descriptions>
            </div>
          </template>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, defineProps, onMounted } from 'vue';
import nacosService from '@/services/nacosService';

// 组件属性
const props = defineProps({
  dataSource: {
    type: Object,
    required: true
  }
});

// 组件引用
const tableRef = ref(null);

// 数据状态
const loading = ref(false);
const serviceList = ref([]);
const instanceList = ref([]);
const namespaces = ref([]);
const currentNamespace = ref('');
const total = ref(0);
const serviceDetailVisible = ref(false);
const currentService = ref(null);
const currentMetadata = ref(null);
const customGroupName = ref('');

// 搜索参数
const searchParams = reactive({
  serviceName: '',
  groupName: '',
  namespace: '',
  pageNum: 1,
  pageSize: 20
});

/**
 * 获取命名空间名称
 */
const getNamespaceName = (namespaceId) => {
  if (!namespaceId) return '默认命名空间';
  const namespace = namespaces.value.find(item => item.id === namespaceId);
  return namespace ? namespace.name : namespaceId;
};

/**
 * 加载命名空间列表
 */
const loadNamespaces = async () => {
  try {
    namespaces.value = await nacosService.getNamespaces(props.dataSource);
    
    // 如果没有选择命名空间且列表不为空，默认选择第一个
    if (!currentNamespace.value && namespaces.value.length > 0) {
      currentNamespace.value = namespaces.value[0].id;
      searchParams.namespace = currentNamespace.value;
    }
    
    // 加载服务列表
    loadServiceList();
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
  }
};

/**
 * 加载服务列表
 */
const loadServiceList = async () => {
  loading.value = true;
  
  try {
    const result = await nacosService.getServiceList(props.dataSource, {
      ...searchParams,
      namespace: currentNamespace.value,
      groupName: searchParams.groupName === 'custom' ? customGroupName.value : searchParams.groupName
    });
    
    if (result) {
      serviceList.value = result.doms || [];
      total.value = result.count || 0;
    }
  } catch (error) {
    console.error('加载服务列表失败:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理命名空间变更
 */
const handleNamespaceChange = (value) => {
  searchParams.namespace = value;
  searchParams.pageNum = 1;
  loadServiceList();
};

/**
 * 处理分组变更
 */
const handleGroupChange = (value) => {
  if (value !== 'custom') {
    customGroupName.value = '';
  }
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  searchParams.pageNum = 1;
  loadServiceList();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadServiceList();
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (page) => {
  searchParams.pageNum = page;
  loadServiceList();
};

/**
 * 处理每页条数变化
 */
const handleSizeChange = (size) => {
  searchParams.pageSize = size;
  searchParams.pageNum = 1;
  loadServiceList();
};

/**
 * 处理行点击事件
 */
const handleRowClick = (row) => {
  handleViewDetail(row);
};

/**
 * 处理查看详情
 */
const handleViewDetail = async (service) => {
  try {
    currentService.value = service;
    
    // 加载实例列表
    const instances = await nacosService.getInstanceList(props.dataSource, {
      serviceName: service.name,
      groupName: service.groupName || 'DEFAULT_GROUP',
      namespace: currentNamespace.value
    });
    
    instanceList.value = instances || [];
    serviceDetailVisible.value = true;
  } catch (error) {
    console.error('获取服务实例列表失败:', error);
  }
};

/**
 * 处理查看元数据
 */
const handleViewMetadata = (instance) => {
  currentMetadata.value = instance.metadata || {};
};

// 组件挂载时初始化
onMounted(() => {
  if (props.dataSource.genId) {
    loadNamespaces();
  }
});
</script>

<style scoped lang="scss">
.nacos-service {
  .nacos-namespace-select {
    width: 200px;
  }
  
  .nacos-table {
    --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
  }
}
</style> 