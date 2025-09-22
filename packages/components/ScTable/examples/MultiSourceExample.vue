<template>
  <div class="multi-source-example">
    <div class="example-header">
      <h2>多数据源表格示例</h2>
      <div class="controls">
        <el-radio-group v-model="displayMode" @change="onDisplayModeChange">
          <el-radio-button label="table">表格模式</el-radio-button>
          <el-radio-button label="card">卡片模式</el-radio-button>
          <el-radio-button label="list">列表模式</el-radio-button>
        </el-radio-group>
        
        <el-select v-model="aggregationStrategy" placeholder="聚合策略" style="margin-left: 16px; width: 120px;">
          <el-option label="合并数据" value="merge" />
          <el-option label="连接数据" value="concat" />
        </el-select>
        
        <el-button @click="refreshTable" type="primary" style="margin-left: 16px;">
          刷新数据
        </el-button>
      </div>
    </div>

    <div class="example-content">
      <MultiSourceTable
        ref="multiSourceTableRef"
        :data-sources="dataSources"
        :display-mode="displayMode"
        :current-page="currentPage"
        :page-size="pageSize"
        :extra-params="extraParams"
        :aggregation-strategy="aggregationStrategy"
        :pagination-type="paginationType"
        :show-source-stats="showSourceStats"
        :show-current-page-info="showCurrentPageInfo"
        :group-by-source="groupBySource"
        :show-selection="showSelection"
        :height="600"
        @data-change="onDataChange"
        @current-change="onCurrentChange"
        @size-change="onSizeChange"
        @refresh="onRefresh"
        @load-more="onLoadMore"
        @export="onExport"
        @settings="onSettings"
      >
        <!-- 自定义列模板 -->
        <template #default="{ row, index }">
          <div v-if="displayMode === 'card'" class="card-content">
            <div class="card-title">{{ row.name || row.title }}</div>
            <div class="card-description">{{ row.description || row.content }}</div>
            <div class="card-meta">
              <span v-if="row._sourceId" class="source-tag">来源: {{ row._sourceId }}</span>
              <span class="index-tag">序号: {{ index + 1 }}</span>
            </div>
          </div>
          <div v-else-if="displayMode === 'list'" class="list-content">
            <div class="list-item">
              <div class="list-title">{{ row.name || row.title }}</div>
              <div class="list-description">{{ row.description || row.content }}</div>
              <div class="list-actions">
                <el-button size="small" @click="viewDetail(row)">查看详情</el-button>
                <el-button size="small" type="primary" @click="editItem(row)">编辑</el-button>
              </div>
            </div>
          </div>
        </template>
      </MultiSourceTable>
    </div>

    <!-- 数据统计信息 -->
    <div class="example-footer">
      <el-card>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">总记录数:</span>
            <span class="stat-value">{{ totalRecords }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前页数据:</span>
            <span class="stat-value">{{ currentPageData.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">数据源数量:</span>
            <span class="stat-value">{{ dataSources.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">聚合策略:</span>
            <span class="stat-value">{{ aggregationStrategy === 'merge' ? '合并' : '连接' }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElRadioGroup, ElRadioButton, ElSelect, ElOption, ElButton, ElCard, ElMessage } from 'element-plus'
import MultiSourceTable from '../MultiSourceTable.vue'

// 响应式数据
const multiSourceTableRef = ref(null)
const displayMode = ref('table')
const aggregationStrategy = ref('merge')
const currentPage = ref(1)
const pageSize = ref(20)
const totalRecords = ref(0)
const currentPageData = ref([])

// 分页相关配置
const paginationType = ref('normal')
const showSourceStats = ref(true)
const showCurrentPageInfo = ref(true)
const groupBySource = ref(false)
const showSelection = ref(true)

// 额外参数
const extraParams = reactive({
  keyword: '',
  category: '',
  status: 'active'
})

// 模拟数据源配置
const dataSources = ref([
  {
    id: 'source1',
    name: '用户数据源',
    api: async (params) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const mockData = Array.from({ length: params.pageSize }, (_, index) => ({
        id: `user_${params.page}_${index + 1}`,
        name: `用户 ${params.page}-${index + 1}`,
        email: `user${params.page}${index + 1}@example.com`,
        type: 'user',
        description: `这是来自用户数据源的第 ${index + 1} 条记录`,
        createTime: new Date().toISOString()
      }))
      
      return {
        data: mockData,
        total: 150, // 模拟总数
        code: 200,
        message: 'success'
      }
    }
  },
  {
    id: 'source2',
    name: '产品数据源',
    api: async (params) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockData = Array.from({ length: Math.min(params.pageSize, 15) }, (_, index) => ({
        id: `product_${params.page}_${index + 1}`,
        name: `产品 ${params.page}-${index + 1}`,
        price: Math.floor(Math.random() * 1000) + 100,
        type: 'product',
        description: `这是来自产品数据源的第 ${index + 1} 条记录`,
        createTime: new Date().toISOString()
      }))
      
      return {
        data: mockData,
        total: 80, // 模拟总数
        code: 200,
        message: 'success'
      }
    }
  },
  {
    id: 'source3',
    name: '订单数据源',
    api: async (params) => {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const mockData = Array.from({ length: Math.min(params.pageSize, 10) }, (_, index) => ({
        id: `order_${params.page}_${index + 1}`,
        name: `订单 ${params.page}-${index + 1}`,
        amount: Math.floor(Math.random() * 5000) + 500,
        type: 'order',
        description: `这是来自订单数据源的第 ${index + 1} 条记录`,
        createTime: new Date().toISOString()
      }))
      
      return {
        data: mockData,
        total: 120, // 模拟总数
        code: 200,
        message: 'success'
      }
    }
  }
])

// 事件处理方法
const onDisplayModeChange = (mode) => {
  console.log('展示模式切换为:', mode)
}

const onDataChange = (results, aggregatedData, total) => {
  console.log('数据变化:', { results, aggregatedData, total })
  totalRecords.value = total
  currentPageData.value = aggregatedData
}

const onCurrentChange = (page) => {
  currentPage.value = page
  console.log('页码变化:', page)
}

const onSizeChange = (size) => {
  pageSize.value = size
  console.log('页面大小变化:', size)
}

const refreshTable = () => {
  if (multiSourceTableRef.value) {
    multiSourceTableRef.value.refresh()
    ElMessage.success('数据刷新成功')
  }
}

const onRefresh = () => {
  refreshTable()
  console.log('刷新数据')
}

const onLoadMore = () => {
  console.log('加载更多数据')
  ElMessage.info('正在加载更多数据...')
}

const onExport = (exportData) => {
  console.log('导出数据:', exportData)
  const { type, data, selectedData, sourceStats } = exportData
  
  switch (type) {
    case 'current':
      ElMessage.success(`导出当前页数据 (${data.length} 条)`)
      break
    case 'all':
      ElMessage.success('导出全部数据')
      break
    case 'selected':
      ElMessage.success(`导出选中数据 (${selectedData.length} 条)`)
      break
    default:
      ElMessage.info('导出功能')
  }
}

const onSettings = (settingsData) => {
  console.log('设置配置:', settingsData)
  const { type, currentConfig } = settingsData
  
  switch (type) {
    case 'columns':
      ElMessage.info('打开列设置')
      break
    case 'display':
      ElMessage.info('打开显示设置')
      break
    case 'sources':
      ElMessage.info('打开数据源设置')
      break
    default:
      ElMessage.info('打开设置')
  }
}

const viewDetail = (row) => {
  ElMessage.info(`查看详情: ${row.name}`)
}

const editItem = (row) => {
  ElMessage.info(`编辑项目: ${row.name}`)
}

onMounted(() => {
  console.log('多数据源表格示例组件已挂载')
})
</script>

<style lang="scss" scoped>
.multi-source-example {
  padding: 20px;
  background: var(--el-bg-color-overlay);
  min-height: 100vh;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h2 {
    margin: 0;
    color: var(--el-text-color-primary);
  }

  .controls {
    display: flex;
    align-items: center;
  }
}

.example-content {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.example-footer {
  margin-top: 20px;

  .stats {
    display: flex;
    justify-content: space-around;
    align-items: center;

    .stat-item {
      text-align: center;

      .stat-label {
        display: block;
        font-size: 14px;
        color: var(--el-text-color-primary);
        margin-bottom: 4px;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: bold;
        color: #409eff;
      }
    }
  }
}

// 卡片模式样式
.card-content {
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: var(--el-bg-color-overlay);
  margin-bottom: 12px;

  .card-title {
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    margin-bottom: 8px;
  }

  .card-description {
    font-size: 14px;
    color: #606266;
    margin-bottom: 12px;
    line-height: 1.5;
  }

  .card-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .source-tag,
    .index-tag {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #f0f9ff;
      color: #409eff;
    }
  }
}

// 列表模式样式
.list-content {
  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .list-title {
      font-size: 16px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }

    .list-description {
      font-size: 14px;
      color: #606266;
      margin-top: 4px;
    }

    .list-actions {
      display: flex;
      gap: 8px;
    }
  }
}
</style>