<template>
  <sc-dialog
    v-model="dialogVisible"
    title="爬取数据"
    width="80%"
    :close-on-click-modal="false"
    destroy-on-close
    append-to-body
  >
    <div class="data-toolbar">
      <div class="toolbar-left">
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          size="small"
          @change="handleSearch"
        />
        <el-input
          v-model="keyword"
          placeholder="关键字搜索"
          clearable
          size="small"
          style="width: 200px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </el-input>
        <el-button type="primary" size="small" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" class="mr-1" />
          搜索
        </el-button>
      </div>
      <div class="toolbar-right">
        <el-button size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
        <el-button type="success" size="small" @click="handleExport">
          <IconifyIconOnline icon="ri:download-line" class="mr-1" />
          导出数据
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="dataList"
      border
      stripe
      max-height="500"
    >
      <el-table-column type="index" label="#" width="60" align="center" />
      <template v-for="col in columns" :key="col.prop">
        <el-table-column
          :prop="col.prop"
          :label="col.label"
          :min-width="col.minWidth || 150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <template v-if="isUrl(row[col.prop])">
              <el-link type="primary" :href="row[col.prop]" target="_blank">
                {{ truncateText(row[col.prop], 50) }}
              </el-link>
            </template>
            <template v-else-if="isImageUrl(row[col.prop])">
              <el-image
                :src="row[col.prop]"
                :preview-src-list="[row[col.prop]]"
                fit="cover"
                style="width: 60px; height: 60px"
              />
            </template>
            <template v-else>
              {{ row[col.prop] }}
            </template>
          </template>
        </el-table-column>
      </template>
      <el-table-column prop="crawlTime" label="爬取时间" width="180" />
      <el-table-column label="操作" width="100" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="handleViewDetail(row)">
            <IconifyIconOnline icon="ri:eye-line" />
          </el-button>
          <el-button type="danger" link size="small" @click="handleDeleteRow(row)">
            <IconifyIconOnline icon="ri:delete-bin-line" />
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <sc-dialog
      v-model="detailVisible"
      title="数据详情"
      width="600px"
      append-to-body
    >
      <el-descriptions :column="1" border>
        <el-descriptions-item
          v-for="(value, key) in detailData"
          :key="key"
          :label="String(key)"
        >
          <template v-if="isUrl(value)">
            <el-link type="primary" :href="String(value)" target="_blank">{{ value }}</el-link>
          </template>
          <template v-else-if="isImageUrl(String(value))">
            <el-image :src="String(value)" fit="contain" style="max-width: 200px; max-height: 200px" />
          </template>
          <template v-else>
            {{ value }}
          </template>
        </el-descriptions-item>
      </el-descriptions>
    </sc-dialog>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message, confirm } from "@repo/utils";
import { getSpiderTaskData, exportSpiderTaskData, deleteSpiderData } from "@/api/spider";

// Props
const props = defineProps<{
  visible: boolean;
  taskId?: number;
  taskName?: string;
}>();

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val)
});

// 响应式状态
const loading = ref(false);
const dataList = ref<any[]>([]);
const columns = ref<{ prop: string; label: string; minWidth?: number }[]>([]);
const keyword = ref("");
const dateRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const detailData = ref<Record<string, any>>({});

// 分页
const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
});

// 监听对话框打开
watch(() => props.visible, (val) => {
  if (val && props.taskId) {
    loadData();
  }
});

/**
 * 加载数据
 */
const loadData = async () => {
  if (!props.taskId) return;
  
  try {
    loading.value = true;
    const res = await getSpiderTaskData(props.taskId, pagination.page, pagination.size);
    
    if (res.code === "00000" && res.data) {
      dataList.value = res.data.data || [];
      pagination.total = res.data.total || 0;
      
      // 动态生成列
      if (dataList.value.length > 0) {
        const firstRow = dataList.value[0];
        columns.value = Object.keys(firstRow)
          .filter(key => !key.startsWith("_") && !["id", "taskId"].includes(key))
          .map(key => ({
            prop: key,
            label: key,
            minWidth: 150
          }));
      }
    }
  } catch (error) {
    console.error("加载数据失败:", error);
    message.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

/**
 * 刷新
 */
const handleRefresh = () => {
  loadData();
};

/**
 * 导出数据
 */
const handleExport = async () => {
  if (!props.taskId) return;
  
  try {
    const res = await exportSpiderTaskData(props.taskId, "json");
    
    if (res.code === "00000" && res.data) {
      // 下载文件
      const link = document.createElement("a");
      link.href = res.data;
      link.download = `spider_data_${props.taskId}_${Date.now()}.json`;
      link.click();
      message.success("导出成功");
    } else {
      message.error(`导出失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("导出失败:", error);
    message.error("导出失败");
  }
};

/**
 * 查看详情
 */
const handleViewDetail = (row: any) => {
  detailData.value = row;
  detailVisible.value = true;
};

/**
 * 删除行
 */
const handleDeleteRow = async (row: any) => {
  try {
    await confirm("确定要删除这条数据吗？", "警告");
    const dataId = row._id;
    if (!dataId || !props.taskId) {
      message.error("数据ID不存在");
      return;
    }
    const res = await deleteSpiderData(props.taskId, dataId);
    if (res.code === "00000") {
      message.success("删除成功");
      loadData();
    } else {
      message.error(`删除失败: ${res.msg}`);
    }
  } catch (error) {
    // 取消删除
  }
};

/**
 * 分页大小改变
 */
const handleSizeChange = () => {
  pagination.page = 1;
  loadData();
};

/**
 * 页码改变
 */
const handleCurrentChange = () => {
  loadData();
};

/**
 * 判断是否是URL
 */
const isUrl = (value: any): boolean => {
  if (typeof value !== "string") return false;
  return /^https?:\/\//i.test(value);
};

/**
 * 判断是否是图片URL
 */
const isImageUrl = (value: string): boolean => {
  if (!isUrl(value)) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i.test(value);
};

/**
 * 截断文本
 */
const truncateText = (text: string, maxLen: number): string => {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
};
</script>

<style scoped lang="scss">
.data-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  
  .toolbar-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
